import { describe, it, expect, vi, beforeEach } from "vitest";

// Shared load-path test for the three typed detail routes (services,
// questions, team-members) — same vi.mock("$lib/prismicio") convention as
// src/routes/health/server.test.ts, extended with a stub `getByUID` +
// `getAllByType` since these loads hit both (see products/[slug]'s
// no-Prismic shape for why this route family needs its own gate: it's the
// first live-Prismic `getByUID` detail route in the repo).
const mocks = vi.hoisted(() => ({
  isPlaceholderRepo: false,
  getByUID: vi.fn<(type: string, uid: string) => Promise<unknown>>(),
  getAllByType: vi.fn<(type: string) => Promise<unknown[]>>(),
}));

vi.mock("$lib/prismicio", () => ({
  createClient: () => ({
    getByUID: mocks.getByUID,
    getAllByType: mocks.getAllByType,
  }),
  get isPlaceholderRepo() {
    return mocks.isPlaceholderRepo;
  },
}));

import {
  load as loadService,
  entries as serviceEntries,
} from "./[slug]/+page.server";
import { splitLede } from "./[slug]/lede";
import type { RichTextField } from "@prismicio/client";
import {
  load as loadQuestion,
  entries as questionEntries,
} from "../questions/[slug]/+page.server";
import {
  load as loadTeamMember,
  entries as teamMemberEntries,
} from "../team-members/[slug]/+page.server";

const richText = (text: string) => [{ type: "paragraph", text, spans: [] }];

const stubEvent = (slug: string) => ({
  params: { slug },
  fetch: vi.fn(),
  cookies: {},
});

beforeEach(() => {
  mocks.isPlaceholderRepo = false;
  mocks.getByUID.mockReset();
  mocks.getAllByType.mockReset();
});

describe("services/[slug] load (collection_item)", () => {
  const doc = {
    uid: "teeth-whitening",
    data: {
      title: richText("Teeth Whitening"),
      body: richText(
        "Get a brighter smile with our professional whitening treatments. Ask us about custom trays at your next visit.",
      ),
      media: { url: "https://images.prismic.io/site/whitening.jpg" },
      tags: "Cosmetic Dentistry",
      link: { link_type: "Web", url: "https://www.youtube.com/embed/xyz" },
    },
  };

  it("resolves a collection_item doc into title/category/meta", async () => {
    mocks.getByUID.mockResolvedValue(doc);
    const result = await loadService(stubEvent("teeth-whitening") as never);
    expect(mocks.getByUID).toHaveBeenCalledWith(
      "collection_item",
      "teeth-whitening",
    );
    expect(result).toMatchObject({
      doc,
      title: "Teeth Whitening",
      category: "Cosmetic Dentistry",
      meta_image: "https://images.prismic.io/site/whitening.jpg",
    });
    expect(result!.meta_description!.length).toBeLessThanOrEqual(155);
  });

  it("falls back category to '' when tags is unset", async () => {
    mocks.getByUID.mockResolvedValue({
      ...doc,
      data: { ...doc.data, tags: null },
    });
    const result = await loadService(stubEvent("teeth-whitening") as never);
    expect(result!.category).toBe("");
  });

  // Shared load-shape branches (identical code in all three routes' loads —
  // one test each here suffices).
  it("falls back title to params.slug when the title rich text is empty", async () => {
    mocks.getByUID.mockResolvedValue({
      ...doc,
      data: { ...doc.data, title: [] },
    });
    const result = await loadService(stubEvent("teeth-whitening") as never);
    expect(result!.title).toBe("teeth-whitening");
  });

  it("truncates meta_description to exactly 155 chars for a longer body", async () => {
    mocks.getByUID.mockResolvedValue({
      ...doc,
      data: { ...doc.data, body: richText("x".repeat(400)) },
    });
    const result = await loadService(stubEvent("teeth-whitening") as never);
    expect(result!.meta_description!.length).toBe(155);
  });

  it("404s (via SvelteKit's error()) when getByUID rejects", async () => {
    mocks.getByUID.mockRejectedValue(new Error("No documents"));
    await expect(
      loadService(stubEvent("missing") as never),
    ).rejects.toMatchObject({ status: 404 });
  });

  it("entries() skips the query and returns [] on the placeholder repo", async () => {
    mocks.isPlaceholderRepo = true;
    const result = await serviceEntries();
    expect(result).toEqual([]);
    expect(mocks.getAllByType).not.toHaveBeenCalled();
  });

  it("entries() maps every collection_item doc's uid to a slug entry", async () => {
    mocks.getAllByType.mockResolvedValue([{ uid: "a" }, { uid: "b" }]);
    const result = await serviceEntries();
    expect(mocks.getAllByType).toHaveBeenCalledWith("collection_item");
    expect(result).toEqual([{ slug: "a" }, { slug: "b" }]);
  });
});

describe("services/[slug] lede split (page-side, via the exported splitLede)", () => {
  // The +page.svelte derivation is a direct passthrough to splitLede (see
  // ./[slug]/lede.ts), so the pure function is tested here instead of
  // standing up a component render for it.
  const p = (text: string) => ({ type: "paragraph", text, spans: [] });
  const h1 = (text: string) => ({ type: "heading1", text, spans: [] });

  it("promotes the first block to the lede when it is a paragraph", () => {
    const body = [p("Opening lede."), h1("Details"), p("More.")];
    const { lede, rest } = splitLede(body as unknown as RichTextField);
    expect(lede).toBe("Opening lede.");
    expect(rest).toEqual([h1("Details"), p("More.")]);
  });

  it("extracts NO lede when the body opens with a heading — block order preserved", () => {
    // The guard under test: promoting a deeper paragraph above the heading
    // the author put first would silently reorder the document.
    const body = [h1("Why choose us"), p("First paragraph."), p("Second.")];
    const { lede, rest } = splitLede(body as unknown as RichTextField);
    expect(lede).toBe("");
    expect(rest).toEqual(body);
  });

  it("handles an empty body (no lede, empty rest)", () => {
    const { lede, rest } = splitLede([] as unknown as RichTextField);
    expect(lede).toBe("");
    expect(rest).toEqual([]);
  });
});

describe("questions/[slug] load (news_article)", () => {
  const doc = {
    uid: "does-insurance-cover-whitening",
    data: {
      title: richText("Does insurance cover whitening?"),
      body: richText(
        "Cosmetic whitening is typically not covered, but check your specific plan for exceptions.",
      ),
      media: { url: "https://images.prismic.io/site/faq.jpg" },
      tags: "",
      link: { link_type: "Any" },
    },
  };

  it("resolves a news_article doc into title/meta", async () => {
    mocks.getByUID.mockResolvedValue(doc);
    const result = await loadQuestion(
      stubEvent("does-insurance-cover-whitening") as never,
    );
    expect(mocks.getByUID).toHaveBeenCalledWith(
      "news_article",
      "does-insurance-cover-whitening",
    );
    expect(result).toMatchObject({
      doc,
      title: "Does insurance cover whitening?",
      meta_image: "https://images.prismic.io/site/faq.jpg",
    });
  });

  it("404s when getByUID rejects", async () => {
    mocks.getByUID.mockRejectedValue(new Error("No documents"));
    await expect(
      loadQuestion(stubEvent("missing") as never),
    ).rejects.toMatchObject({ status: 404 });
  });

  it("entries() returns [] on the placeholder repo without querying", async () => {
    mocks.isPlaceholderRepo = true;
    const result = await questionEntries();
    expect(result).toEqual([]);
    expect(mocks.getAllByType).not.toHaveBeenCalled();
  });

  it("entries() maps every news_article doc's uid to a slug entry", async () => {
    mocks.getAllByType.mockResolvedValue([{ uid: "q1" }]);
    const result = await questionEntries();
    expect(mocks.getAllByType).toHaveBeenCalledWith("news_article");
    expect(result).toEqual([{ slug: "q1" }]);
  });
});

describe("team-members/[slug] load (person)", () => {
  const doc = {
    uid: "dr-jane-smith",
    data: {
      title: richText("Dr. Jane Smith"),
      body: richText(
        "Dr. Smith has been practicing dentistry in Redondo Beach for over fifteen years.",
      ),
      media: { url: "https://images.prismic.io/site/jane.jpg" },
      tags: "Lead Dentist",
      link: { link_type: "Any" },
    },
  };

  it("resolves a person doc into title/role/meta", async () => {
    mocks.getByUID.mockResolvedValue(doc);
    const result = await loadTeamMember(stubEvent("dr-jane-smith") as never);
    expect(mocks.getByUID).toHaveBeenCalledWith("person", "dr-jane-smith");
    expect(result).toMatchObject({
      doc,
      title: "Dr. Jane Smith",
      role: "Lead Dentist",
      meta_image: "https://images.prismic.io/site/jane.jpg",
    });
  });

  it("falls back role to '' when tags is unset", async () => {
    mocks.getByUID.mockResolvedValue({
      ...doc,
      data: { ...doc.data, tags: null },
    });
    const result = await loadTeamMember(stubEvent("dr-jane-smith") as never);
    expect(result!.role).toBe("");
  });

  it("404s when getByUID rejects", async () => {
    mocks.getByUID.mockRejectedValue(new Error("No documents"));
    await expect(
      loadTeamMember(stubEvent("missing") as never),
    ).rejects.toMatchObject({ status: 404 });
  });

  it("entries() returns [] on the placeholder repo without querying", async () => {
    mocks.isPlaceholderRepo = true;
    const result = await teamMemberEntries();
    expect(result).toEqual([]);
    expect(mocks.getAllByType).not.toHaveBeenCalled();
  });

  it("entries() maps every person doc's uid to a slug entry", async () => {
    mocks.getAllByType.mockResolvedValue([{ uid: "dr-jane-smith" }]);
    const result = await teamMemberEntries();
    expect(mocks.getAllByType).toHaveBeenCalledWith("person");
    expect(result).toEqual([{ slug: "dr-jane-smith" }]);
  });
});

// The SEO & Metadata tab (Tim, 2026-11-20): each field, then its fallback,
// through each route's real load. $lib/detail-meta holds the chain.
describe("SEO & Metadata tab fallbacks on the detail routes", () => {
  const prismicImage = (name: string, alt: string | null = null) => ({
    url: `https://images.prismic.io/site/${name}.jpg`,
    alt,
    copyright: null,
    dimensions: { width: 2400, height: 1260 },
  });
  const emptyImage = {};
  const article = (data: Record<string, unknown>) => ({
    uid: "abscess",
    data: {
      title: richText("What are the warning signs of a dental abscess?"),
      body: richText("An abscess is a pocket of infection. See us today."),
      media: prismicImage("hero", "grayscale photo of a woman"),
      ...data,
    },
  });

  it("news_article: the tab's Meta Image wins over the main image", async () => {
    mocks.getByUID.mockResolvedValue(
      article({ meta_image: prismicImage("card", "card alt") }),
    );
    const result = await loadQuestion(stubEvent("abscess") as never);
    expect(result!.meta_image).toBe("https://images.prismic.io/site/card.jpg");
    expect(result!.meta_image_alt).toBe("card alt");
  });

  it("news_article: an empty Meta Image falls back to the main image (media)", async () => {
    mocks.getByUID.mockResolvedValue(article({ meta_image: emptyImage }));
    const result = await loadQuestion(stubEvent("abscess") as never);
    expect(result!.meta_image).toBe("https://images.prismic.io/site/hero.jpg");
    // The main image's alt is often another page's name (shared library
    // photos), so the fallback leaves the alt to the layout (the page title).
    expect(result!.meta_image_alt).toBeUndefined();
  });

  it("news_article: an Unsplash main image is the fallback, as-is", async () => {
    const unsplash =
      "https://images.unsplash.com/photo-1599140458985-d80aad8b06f0?crop=entropy&cs=srgb&fm=jpg&q=85";
    mocks.getByUID.mockResolvedValue(
      article({ meta_image: emptyImage, media: { url: unsplash, alt: null } }),
    );
    const result = await loadQuestion(stubEvent("abscess") as never);
    expect(result!.meta_image).toBe(unsplash);
  });

  it("news_article: no Meta Image and no main image leaves it to the site default", async () => {
    mocks.getByUID.mockResolvedValue(
      article({ meta_image: emptyImage, media: emptyImage }),
    );
    const result = await loadQuestion(stubEvent("abscess") as never);
    expect(result!.meta_image).toBeUndefined();
  });

  it("news_article: the tab's Meta Description wins over the summary", async () => {
    mocks.getByUID.mockResolvedValue(
      article({
        meta_description: "Swelling, fever, a bad taste: when to call us.",
        summary: "The card excerpt.",
      }),
    );
    const result = await loadQuestion(stubEvent("abscess") as never);
    expect(result!.meta_description).toBe(
      "Swelling, fever, a bad taste: when to call us.",
    );
  });

  it("news_article: an empty Meta Description falls back to the summary", async () => {
    mocks.getByUID.mockResolvedValue(
      article({ meta_description: "", summary: "The card excerpt." }),
    );
    const result = await loadQuestion(stubEvent("abscess") as never);
    expect(result!.meta_description).toBe("The card excerpt.");
  });

  it("news_article: an authored summary is used whole, never cut mid-word", async () => {
    const summary =
      "Bad breath that brushing does not fix can be a sign of tooth decay. Here is how the two are linked, what to look for at home, and why you're more likely to notice it in the morning.";
    mocks.getByUID.mockResolvedValue(
      article({ meta_description: null, summary }),
    );
    const result = await loadQuestion(stubEvent("abscess") as never);
    expect(summary.length).toBeGreaterThan(155);
    expect(result!.meta_description).toBe(summary);
  });

  it("news_article: with no summary either, it falls back to the body lead", async () => {
    mocks.getByUID.mockResolvedValue(
      article({ meta_description: null, summary: null }),
    );
    const result = await loadQuestion(stubEvent("abscess") as never);
    expect(result!.meta_description).toBe(
      "An abscess is a pocket of infection. See us today.",
    );
  });

  it("news_article: the tab's Meta Title wins over the old meta title field", async () => {
    mocks.getByUID.mockResolvedValue(
      article({ seo_title: "Abscess Warning Signs", meta_title: "Old" }),
    );
    const result = await loadQuestion(stubEvent("abscess") as never);
    expect(result!.meta_title).toBe("Abscess Warning Signs");
  });

  it("news_article: the old meta title field still works when the tab's is empty", async () => {
    mocks.getByUID.mockResolvedValue(
      article({ seo_title: null, meta_title: "Dental Abscess Warning Signs" }),
    );
    const result = await loadQuestion(stubEvent("abscess") as never);
    expect(result!.meta_title).toBe("Dental Abscess Warning Signs");
  });

  it("collection_item: tab fields win, and empty ones fall back to media and body", async () => {
    mocks.getByUID.mockResolvedValue({
      uid: "whitening",
      data: {
        title: richText("Teeth Whitening"),
        body: richText("Brighter smiles, in one visit."),
        media: prismicImage("whitening"),
        meta_title: "Whitening in Redondo Beach",
        meta_description: "",
        meta_image: emptyImage,
      },
    });
    const result = await loadService(stubEvent("whitening") as never);
    expect(result!.meta_title).toBe("Whitening in Redondo Beach");
    expect(result!.meta_description).toBe("Brighter smiles, in one visit.");
    expect(result!.meta_image).toBe(
      "https://images.prismic.io/site/whitening.jpg",
    );
  });

  it("person: an empty Meta Description falls back to the teaser, and Meta Image to media", async () => {
    mocks.getByUID.mockResolvedValue({
      uid: "dr-jane",
      data: {
        title: richText("Dr. Jane Smith"),
        body: richText("Fifteen years in Redondo Beach."),
        teaser: "Our lead dentist.",
        media: prismicImage("jane"),
        meta_description: null,
        meta_image: emptyImage,
      },
    });
    const result = await loadTeamMember(stubEvent("dr-jane") as never);
    expect(result!.meta_description).toBe("Our lead dentist.");
    expect(result!.meta_image).toBe("https://images.prismic.io/site/jane.jpg");
  });
});
