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

  it("renders the team variation as a circular-avatar carousel", () => {
    const teamSlice = {
      slice_type: "collection_list",
      variation: "team",
      primary: {
        heading: [{ type: "heading2", text: "Meet Your Team", spans: [] }],
        collection_type: "person",
        max_items: 24,
      },
      items: [],
    } as unknown as Content.CollectionListSlice;
    const { getByRole, getByText } = render(CollectionList, {
      props: { slice: teamSlice, context: teamContext },
    });
    // heading renders as a plain eyebrow (not an <h2>), inside a carousel region
    expect(getByRole("region").getAttribute("aria-roledescription")).toBe(
      "carousel",
    );
    expect(getByText("Meet Your Team")).toBeTruthy();
    // The live team row shows the headshot only — the person's name is the
    // avatar link's accessible name (aria-label), not visible text.
    expect(
      getByRole("link", { name: "Dr. Jane Smith" }).getAttribute("href"),
    ).toBe("/team-members/dr-jane-smith");
  });
});

// The team row's name is a HOVER reveal, and Tailwind v4 wraps `group-hover:`
// in `@media (hover: hover)` — so on a phone or a tablet the row that exists
// to introduce the staff rendered eleven unlabelled faces. Probed at 390 with
// touch emulation before the fix: `matchMedia("(hover: hover)")` false, badge
// opacity 0 on all 11, before and after a tap.
// These assert the CLASS CONTRACT, since jsdom evaluates no media queries;
// the rendered proof is the 390 screenshot pair in the commit body.
describe("CollectionList slice — the team row names a face without hover", () => {
  const teamSlice = {
    slice_type: "collection_list",
    variation: "team",
    primary: {
      heading: [{ type: "heading2", text: "Meet Your Team", spans: [] }],
      collection_type: "person",
      max_items: 24,
    },
    items: [],
  } as unknown as Content.CollectionListSlice;

  const context = {
    collections: {
      person: [
        {
          uid: "stacey",
          type: "person",
          data: {
            title: [{ type: "heading3", text: "Stacey", spans: [] }],
            media: {
              url: "https://img.example/stacey.jpg",
              alt: "Stacey",
              dimensions: { width: 800, height: 800 },
            },
          },
        },
      ],
    },
  } as never;

  const render_ = () =>
    render(CollectionList, { props: { slice: teamSlice, context } });

  it("prints the name in a caption that touch devices can see", () => {
    const { getByRole } = render_();
    const link = getByRole("link", { name: "Stacey" });
    const caption = [...link.querySelectorAll("span")].find((s) =>
      s.className.includes("[@media(hover:none)]"),
    );
    expect(caption?.textContent?.trim()).toBe("Stacey");
    // hidden where a pointer can hover (the design's reveal still owns that
    // case), shown where it cannot — the Grid.svelte:169 idiom
    expect(caption?.className).toContain("hidden");
    expect(caption?.className).toContain("[@media(hover:none)]:block");
    // and it is inside the link, so tapping the name navigates
    expect(caption?.closest("a")).toBe(link);
  });

  it("keeps the cyan hover badge off the face on touch, not permanently over it", () => {
    const { getByRole } = render_();
    const badge = getByRole("link", { name: "Stacey" }).querySelector(
      "span.absolute",
    );
    expect(badge?.className).toContain("opacity-0");
    expect(badge?.className).toContain("group-hover:opacity-100");
    expect(badge?.className).toContain("group-focus-visible:opacity-100");
    // deliberately NOT `[@media(hover:none)]:opacity-100`: that one-class fix
    // paints a 65% cyan disc over every face permanently (probed at 390), and
    // this row's job is the faces. The caption above carries touch instead.
    expect(badge?.className).not.toContain("[@media(hover:none)]:opacity-100");
  });
});

// The roster order is an AUTHORED field (person.order), not Prismic's
// document order. The card excerpt was authored too (person.teaser) until
// MARKUP ROUND C: thread 4dd560d2-3dad-4240-b5bb-3a5d64a6cedd (yfv pin #5)
// replaced it with a visual 3-line clamp of the real bio, so the card now
// reads person.body FIRST and keeps the teaser only as a fallback for a
// person with no bio — see the personCard snippet and LEDGER ROUND C.
describe("CollectionList slice — people variation reads its authored fields", () => {
  const peopleSlice = {
    slice_type: "collection_list",
    variation: "people",
    primary: {
      heading: [{ type: "heading2", text: "Our Team", spans: [] }],
      collection_type: "person",
      max_items: 24,
    },
    items: [],
  } as unknown as Content.CollectionListSlice;

  const person = (
    uid: string,
    name: string,
    extra: Record<string, unknown> = {},
  ) => ({
    uid,
    type: "person",
    data: {
      title: [{ type: "heading3", text: name, spans: [] }],
      tags: "Dental Hygienist",
      body: [
        {
          type: "paragraph",
          text: `${name} joined the practice in 2019.`,
          spans: [],
        },
      ],
      ...extra,
    },
  });

  it("prints the real bio, not the authored teaser, when both exist (ROUND C)", () => {
    const { getByText, queryByText } = render(CollectionList, {
      props: {
        slice: peopleSlice,
        context: {
          collections: {
            person: [
              person("stacey", "Stacey", {
                teaser: "A hand-cut card teaser...",
              }),
            ],
          },
        } as never,
      },
    });
    expect(getByText("Stacey joined the practice in 2019.")).toBeTruthy();
    expect(queryByText("A hand-cut card teaser...")).toBeNull();
  });

  it("falls back to person.teaser for a person with no bio", () => {
    const { getByText } = render(CollectionList, {
      props: {
        slice: peopleSlice,
        context: {
          collections: {
            person: [
              person("stacey", "Stacey", {
                body: [],
                teaser: "A hand-cut card teaser...",
              }),
            ],
          },
        } as never,
      },
    });
    expect(getByText("A hand-cut card teaser...")).toBeTruthy();
  });

  it("sorts the roster by person.order, leaving docs without one at the end", () => {
    const { getAllByRole } = render(CollectionList, {
      props: {
        slice: peopleSlice,
        context: {
          collections: {
            person: [
              person("linda", "Linda", { order: 3 }),
              person("unranked", "Unranked"),
              person("dr-quan", "Dr. Quan", { order: 1 }),
              person("stacey", "Stacey", { order: 2 }),
            ],
          },
        } as never,
      },
    });
    // each card links its name; the headshot link is absent (no media).
    const names = getAllByRole("link")
      .map((a) => a.textContent?.trim())
      .filter((t) => t && !t.startsWith("Read More"));
    expect(names).toEqual(["Dr. Quan", "Stacey", "Linda", "Unranked"]);
  });
});
