import { render, cleanup } from "@testing-library/svelte";
import { afterEach, describe, expect, it } from "vitest";
import type { Content } from "@prismicio/client";
import CollectionList from "./index.svelte";

// Multiple `render()` calls in this file (across independent tests/describes)
// leave prior mounts in the shared document.body without this — the returned
// queries bind to baseElement, not each render's own container (same pattern
// as AppointmentModal.test.ts).
afterEach(() => cleanup());

const slice = {
  slice_type: "collection_list",
  variation: "grid",
  primary: {
    heading: [{ type: "heading2", text: "Products", spans: [] }],
    collection_type: "product",
    max_items: 12,
  },
  items: [],
} as unknown as Content.CollectionListSlice;

const context = {
  collections: {
    product: [
      {
        uid: "aero-sofa",
        data: {
          title: [{ type: "heading3", text: "Aero Sofa", spans: [] }],
          media: {
            url: "https://img.example/sofa.jpg",
            alt: "Aero Sofa",
            dimensions: { width: 800, height: 600 },
          },
        },
      },
      {
        uid: "loft-chair",
        data: {
          title: [{ type: "heading3", text: "Loft Chair", spans: [] }],
          media: {
            url: "https://img.example/chair.jpg",
            alt: "Loft Chair",
            dimensions: { width: 800, height: 600 },
          },
        },
      },
    ],
  },
};

describe("CollectionList slice", () => {
  it("renders one entry per linked collection document", () => {
    const { getByRole, getAllByRole } = render(CollectionList, {
      props: { slice, context },
    });
    expect(getByRole("heading", { level: 2 }).textContent).toContain(
      "Products",
    );
    expect(getAllByRole("heading", { level: 3 })).toHaveLength(2);
  });

  it("renders nothing but the heading when the collection is absent from context", () => {
    const { container } = render(CollectionList, {
      props: { slice, context: { collections: {} } },
    });
    expect(container.querySelectorAll("h2")).toHaveLength(1);
    expect(container.querySelectorAll("h3")).toHaveLength(0);
  });

  // `product` isn't in the doc-type → detail-route map (unknown types have no
  // detail page), so these existing "product" mock docs stay card-only —
  // preserving the pre-link behavior this test locks in above.
  it("renders no <a> for a doc type absent from the href map", () => {
    const { container } = render(CollectionList, {
      props: { slice, context },
    });
    expect(container.querySelectorAll("a")).toHaveLength(0);
  });

  it("omits the muted tags line when a doc has no tags", () => {
    const { container } = render(CollectionList, {
      props: { slice, context },
    });
    expect(container.querySelectorAll("p")).toHaveLength(0);
  });
});

describe("CollectionList slice — tags line + detail-route links", () => {
  const teamSlice = {
    ...slice,
    primary: { ...slice.primary, collection_type: "person" },
  } as unknown as Content.CollectionListSlice;

  const teamContext = {
    collections: {
      person: [
        {
          uid: "dr-jane-smith",
          type: "person",
          data: {
            title: [{ type: "heading3", text: "Dr. Jane Smith", spans: [] }],
            tags: "Lead Dentist",
          },
        },
      ],
      news_article: [
        {
          uid: "does-insurance-cover-whitening",
          type: "news_article",
          data: {
            title: [
              {
                type: "heading3",
                text: "Does insurance cover whitening?",
                spans: [],
              },
            ],
          },
        },
      ],
      collection_item: [
        {
          uid: "teeth-whitening",
          type: "collection_item",
          data: {
            title: [{ type: "heading3", text: "Teeth Whitening", spans: [] }],
            tags: "Cosmetic Dentistry",
          },
        },
      ],
    },
  };

  it("renders a doc's tags as a muted line under the title (team role line)", () => {
    const { getByText } = render(CollectionList, {
      props: { slice: teamSlice, context: teamContext },
    });
    const role = getByText("Lead Dentist");
    expect(role.tagName).toBe("P");
    expect(role.className).toContain("text-secondary");
  });

  it("links a person card to /team-members/<uid>", () => {
    const { getByRole } = render(CollectionList, {
      props: { slice: teamSlice, context: teamContext },
    });
    expect(getByRole("link").getAttribute("href")).toBe(
      "/team-members/dr-jane-smith",
    );
  });

  it("links a news_article card to /questions/<uid>", () => {
    const questionSlice = {
      ...slice,
      primary: { ...slice.primary, collection_type: "news_article" },
    } as unknown as Content.CollectionListSlice;
    const { getByRole } = render(CollectionList, {
      props: { slice: questionSlice, context: teamContext },
    });
    expect(getByRole("link").getAttribute("href")).toBe(
      "/questions/does-insurance-cover-whitening",
    );
  });

  it("links a collection_item card to /services/<uid>", () => {
    const serviceSlice = {
      ...slice,
      primary: { ...slice.primary, collection_type: "collection_item" },
    } as unknown as Content.CollectionListSlice;
    const { getByRole } = render(CollectionList, {
      props: { slice: serviceSlice, context: teamContext },
    });
    expect(getByRole("link").getAttribute("href")).toBe(
      "/services/teeth-whitening",
    );
  });
});
