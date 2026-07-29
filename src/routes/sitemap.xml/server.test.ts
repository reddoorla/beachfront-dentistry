import { describe, it, expect, vi, beforeEach } from "vitest";

// Same vi.mock("$lib/prismicio") convention as services/slug-load.test.ts,
// extended with isFrozenSite (this route branches on it too).
const mocks = vi.hoisted(() => ({
  isPlaceholderRepo: false,
  isFrozenSite: false,
  getAllByType: vi.fn<(type: string) => Promise<unknown[]>>(),
}));

vi.mock("$lib/prismicio", () => ({
  createClient: () => ({ getAllByType: mocks.getAllByType }),
  get isPlaceholderRepo() {
    return mocks.isPlaceholderRepo;
  },
  get isFrozenSite() {
    return mocks.isFrozenSite;
  },
}));

vi.mock("$lib/blux-frozen/load", () => ({
  frozenUids: () => [],
}));

import { GET } from "./+server";

function get() {
  return GET({
    fetch: vi.fn(),
    url: new URL("https://example.com/sitemap.xml"),
  } as unknown as Parameters<typeof GET>[0]);
}

beforeEach(() => {
  mocks.isPlaceholderRepo = false;
  mocks.isFrozenSite = false;
  mocks.getAllByType.mockReset();
});

describe("GET /sitemap.xml", () => {
  it("includes page entries plus person/news_article/collection_item detail-route entries, same prefixes as CollectionList's hrefFor", async () => {
    mocks.getAllByType.mockImplementation(async (type: string) => {
      if (type === "page") return [{ uid: "home" }];
      if (type === "person") return [{ uid: "z" }];
      if (type === "news_article") return [{ uid: "y" }];
      if (type === "collection_item") return [{ uid: "x" }];
      return [];
    });

    const body = await (await get()).text();

    expect(body).toContain("<loc>https://example.com/</loc>");
    expect(body).toContain("<loc>https://example.com/services/x</loc>");
    expect(body).toContain("<loc>https://example.com/questions/y</loc>");
    expect(body).toContain("<loc>https://example.com/team-members/z</loc>");
  });

  it("tolerates a repo missing one of the entity types (empty list, not a thrown 500)", async () => {
    mocks.getAllByType.mockImplementation(async (type: string) => {
      if (type === "page") return [{ uid: "home" }];
      if (type === "person") throw new Error("no such custom type");
      if (type === "news_article") return [{ uid: "y" }];
      return [];
    });

    const body = await (await get()).text();
    expect(body).toContain("<loc>https://example.com/questions/y</loc>");
    expect(body).not.toContain("/team-members/");
  });

  it("stays empty on the placeholder repo, no queries fired", async () => {
    mocks.isPlaceholderRepo = true;
    const body = await (await get()).text();
    expect(body).not.toContain("<url>");
    expect(mocks.getAllByType).not.toHaveBeenCalled();
  });
});
