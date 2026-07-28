import { describe, expect, it } from "vitest";
import type * as prismic from "@prismicio/client";
import { createClient, linkResolver } from "./prismicio";

const doc = (type: string, uid: string) =>
  ({
    link_type: "Document",
    type,
    uid,
  }) as unknown as prismic.FilledContentRelationshipField;

describe("createClient", () => {
  // Prismic rejects every query on a client whose routes config names a type
  // with no documents in the repo — and a cloned repo only ever populates one
  // of page/catalog_page. Routes-free is the only config that works on all of
  // native, migrated, frozen, and pre-content repos (see module comment).
  it("creates a routes-free client", () => {
    expect(createClient().routes).toBeUndefined();
  });
});

describe("linkResolver", () => {
  it("resolves the home page doc to the root path", () => {
    expect(linkResolver(doc("page", "home"))).toBe("/");
    expect(linkResolver(doc("catalog_page", "home"))).toBe("/");
  });

  it("resolves other page docs to /:uid", () => {
    expect(linkResolver(doc("page", "our-team"))).toBe("/our-team");
    expect(linkResolver(doc("catalog_page", "about"))).toBe("/about");
  });

  it("returns null for non-page types", () => {
    expect(linkResolver(doc("person", "dr-quan"))).toBeNull();
    expect(linkResolver(doc("frozen_page", "home"))).toBeNull();
  });
});
