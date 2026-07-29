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
