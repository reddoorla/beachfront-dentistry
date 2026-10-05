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
    const { getAllByRole } = render(CollectionList, {
      props: { slice, context },
    });
    for (const title of getAllByRole("heading", { level: 3 }))
      expect(title.closest("a")).toBeNull();
  });

  it("omits the tags line when a doc has no tags", () => {
    const { container } = render(CollectionList, {
      props: { slice, context },
    });
    expect(
      [...container.querySelectorAll("p")].filter(
        (p) => !p.textContent?.trim(),
      ),
    ).toHaveLength(0);
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

  it("renders a doc's tags on its card (team role line)", () => {
    const { getByText } = render(CollectionList, {
      props: { slice: teamSlice, context: teamContext },
    });
    expect(getByText("Lead Dentist")).toBeTruthy();
  });

  it("links a person card to /team-members/<uid>", () => {
    const { getByRole } = render(CollectionList, {
      props: { slice: teamSlice, context: teamContext },
    });
    expect(
      getByRole("link", { name: /Dr\. Jane Smith/ }).getAttribute("href"),
    ).toBe("/team-members/dr-jane-smith");
  });

  it("links a news_article card to /questions/<uid>", () => {
    const questionSlice = {
      ...slice,
      primary: { ...slice.primary, collection_type: "news_article" },
    } as unknown as Content.CollectionListSlice;
    const { getByRole } = render(CollectionList, {
      props: { slice: questionSlice, context: teamContext },
    });
    expect(
      getByRole("link", {
        name: /Does insurance cover whitening/,
      }).getAttribute("href"),
    ).toBe("/questions/does-insurance-cover-whitening");
  });

  it("links a collection_item card to /services/<uid>", () => {
    const serviceSlice = {
      ...slice,
      primary: { ...slice.primary, collection_type: "collection_item" },
    } as unknown as Content.CollectionListSlice;
    const { getByRole } = render(CollectionList, {
      props: { slice: serviceSlice, context: teamContext },
    });
    expect(
      getByRole("link", { name: /Teeth Whitening/ }).getAttribute("href"),
    ).toBe("/services/teeth-whitening");
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
    // the card's name is a plain heading now (the card carries ONE link —
    // READ MORE — whose stretched hit area covers the name; see below).
    const names = getAllByRole("heading", { level: 5 }).map((h) =>
      h.textContent?.trim(),
    );
    expect(names).toEqual(["Dr. Quan", "Stacey", "Linda", "Unranked"]);
  });
});

// The person card used to carry THREE links to one route (headshot, name,
// READ MORE): three tab stops per card, 33 on /our-team, all announcing the
// same destination, and none of them giving the pointer any response. It is
// one link now, stretched over the card, and the card answers hover/focus;
// the hit area is measured in a browser (tests/interaction/team-card.spec.ts).
describe("CollectionList slice — the person card's link", () => {
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

  const withPhoto = {
    collections: {
      person: [
        {
          uid: "stacey",
          type: "person",
          data: {
            title: [{ type: "heading3", text: "Stacey", spans: [] }],
            tags: "Dental Hygienist",
            body: [{ type: "paragraph", text: "Stacey joined.", spans: [] }],
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

  it("gives the card one link to the person, named for them, its visible words in the name", () => {
    const { container, getByRole } = render(CollectionList, {
      props: { slice: peopleSlice, context: withPhoto },
    });
    const link = getByRole("link", { name: /Stacey/ });
    expect(link.getAttribute("href")).toBe("/team-members/stacey");
    // one tab stop per person, not three announcing the same destination
    expect(
      container.querySelectorAll('a[href="/team-members/stacey"]'),
    ).toHaveLength(1);
    // not eleven links called "Read More" (WCAG 2.4.4); the visible words are
    // still contained in the accessible name (2.5.3).
    const visible = link.textContent!.trim().toLowerCase();
    expect(visible.length).toBeGreaterThan(0);
    expect(link.getAttribute("aria-label")!.toLowerCase()).toContain(visible);
  });

  it("does not advertise a click on a card with no detail route", () => {
    const { getByRole } = render(CollectionList, {
      props: {
        slice: peopleSlice,
        context: {
          collections: {
            // no `type`, so hrefFor() returns undefined
            person: [
              {
                uid: "stacey",
                data: { title: [{ type: "heading3", text: "S", spans: [] }] },
              },
            ],
          },
        } as never,
      },
    });
    const card = getByRole("heading", { name: "S" }).closest("article")!;
    expect(card.querySelector("a")).toBeNull();
  });
});
