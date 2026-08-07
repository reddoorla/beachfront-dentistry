import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/svelte";
import ServiceCategoryBand from "./index.svelte";

afterEach(() => cleanup());

const rt = (level: string, text: string) => [{ type: level, text, spans: [] }];

// Five stub collection_item docs: mixed single/multi tag strings, whitespace
// after commas, and one doc with NO tags field at all — the tags field is a
// comma-separated STRING on these docs, not a Prismic tags array.
const collectionItemDocs = [
  {
    uid: "veneers",
    data: {
      title: rt("heading1", "Porcelain Veneers"),
      tags: "Cosmetic Dentistry",
    },
  },
  {
    uid: "whitening",
    data: {
      title: rt("heading1", "Teeth Whitening"),
      tags: "Cosmetic Dentistry, Specialty Services",
    },
  },
  {
    uid: "invisalign",
    data: {
      title: rt("heading1", "Invisalign"),
      tags: "Specialty Services,Cosmetic Dentistry",
    },
  },
  {
    uid: "cleanings",
    data: {
      title: rt("heading1", "Routine Cleanings"),
      tags: "General Dentistry",
    },
  },
  {
    uid: "mystery-service",
    data: { title: rt("heading1", "Mystery Service") },
  },
];

// Cast matches the slice fixtures' `as never` idiom: the stub docs' literal
// arrays don't satisfy RichTextField's non-empty tuple type.
const context = {
  collections: { collection_item: collectionItemDocs },
} as never;

// Not cast to `never` yet (unlike the other fixtures) so the no-match variant
// below can still spread it — spreading a `never`-typed value doesn't type-check.
const sliceData = {
  slice_type: "service_category_band",
  variation: "default",
  primary: {
    category_tag: "Cosmetic Dentistry",
    heading: rt("heading3", "Cosmetic Dentistry"),
    intro: rt(
      "paragraph",
      "Smile-focused treatments designed around comfort and lasting results.",
    ),
  },
};
const slice = sliceData as never;

describe("ServiceCategoryBand slice", () => {
  it("renders only docs whose parsed tags include the category tag, as links to /services/<uid>", () => {
    const { getAllByRole } = render(ServiceCategoryBand, {
      props: { slice, context },
    });
    const links = getAllByRole("link");
    expect(links).toHaveLength(3);
    const hrefs = links.map((link) => link.getAttribute("href"));
    expect(hrefs).toEqual(
      expect.arrayContaining([
        "/services/veneers",
        "/services/whitening",
        "/services/invisalign",
      ]),
    );
  });

  it("excludes a doc whose tags don't match", () => {
    const { queryByText } = render(ServiceCategoryBand, {
      props: { slice, context },
    });
    expect(queryByText("Routine Cleanings")).toBeNull();
  });

  it("renders a doc with no tags field nowhere", () => {
    const { queryByText } = render(ServiceCategoryBand, {
      props: { slice, context },
    });
    expect(queryByText("Mystery Service")).toBeNull();
  });

  it("renders the heading and intro", () => {
    const { getByRole, getByText } = render(ServiceCategoryBand, {
      props: { slice, context },
    });
    expect(getByRole("heading", { level: 3 }).textContent).toContain(
      "Cosmetic Dentistry",
    );
    expect(
      getByText(/Smile-focused treatments designed around comfort/),
    ).not.toBeNull();
  });

  it("renders an aria-hidden arrow glyph inside each link", () => {
    const { container } = render(ServiceCategoryBand, {
      props: { slice, context },
    });
    const arrows = container.querySelectorAll('a [aria-hidden="true"]');
    expect(arrows).toHaveLength(3);
  });

  it("an empty match list still renders heading/intro, with an empty panel (no links)", () => {
    const noMatchSlice = {
      ...sliceData,
      primary: { ...sliceData.primary, category_tag: "Orthodontics" },
    } as never;
    const { getByRole, queryAllByRole } = render(ServiceCategoryBand, {
      props: { slice: noMatchSlice, context },
    });
    expect(getByRole("heading", { level: 3 }).textContent).toContain(
      "Cosmetic Dentistry",
    );
    expect(queryAllByRole("link")).toHaveLength(0);
  });
});

// The panel wording and the within-panel order are AUTHORED fields
// (collection_item.link_label / collection_item.order) — live's panel prints
// "dental veneers" where the detail page prints "Dental Veneers", and Prismic's
// document order matches live's panel order in none of the four categories.
describe("ServiceCategoryBand slice — authored label + order", () => {
  const labelledDocs = [
    {
      uid: "veneers",
      data: {
        title: rt("heading1", "Porcelain Veneers"),
        tags: "Cosmetic Dentistry",
        link_label: "porcelain veneers",
        order: 3,
      },
    },
    {
      uid: "whitening",
      data: {
        title: rt("heading1", "Teeth Whitening"),
        tags: "Cosmetic Dentistry",
        link_label: "teeth whitening",
        order: 1,
      },
    },
    {
      uid: "bonding",
      data: {
        title: rt("heading1", "Dental Bonding"),
        tags: "Cosmetic Dentistry",
        order: 2,
      },
    },
    {
      uid: "unranked",
      data: {
        title: rt("heading1", "Unranked Service"),
        tags: "Cosmetic Dentistry",
      },
    },
  ];
  const labelledContext = {
    collections: { collection_item: labelledDocs },
  } as never;

  it("prints link_label when set and the document title when it isn't", () => {
    const { getByRole } = render(ServiceCategoryBand, {
      props: { slice, context: labelledContext },
    });
    expect(getByRole("link", { name: /teeth whitening/ })).toBeTruthy();
    // no link_label → falls back to the title, so other sites still read right
    expect(getByRole("link", { name: /Dental Bonding/ })).toBeTruthy();
  });

  it("orders the panel by `order`, leaving docs without one at the end", () => {
    const { getAllByRole } = render(ServiceCategoryBand, {
      props: { slice, context: labelledContext },
    });
    expect(getAllByRole("link").map((a) => a.getAttribute("href"))).toEqual([
      "/services/whitening",
      "/services/bonding",
      "/services/veneers",
      "/services/unranked",
    ]);
  });
});
