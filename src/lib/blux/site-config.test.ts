import { describe, it, expect } from "vitest";
import { existsSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { loadSiteConfig, footerColumns, type SiteConfig } from "./site-config";
import { TITLES } from "$lib/beachfront-pages.js";
import {
  COLLECTION_ITEM_CONTENT,
  NEWS_ARTICLE_CONTENT,
  PERSON_CONTENT,
} from "$lib/beachfront-entities.js";

/** Every path this site answers with a page, from what the repo itself
 *  defines: the seeded `page` documents behind the `[uid]` catch-all, the
 *  seeded entities behind each `[slug]` route, and every static route
 *  directory. The catch-all routes ANY one-segment path, so the route table
 *  alone cannot tell `/our-team` from `/our-teams`; only the documents can. A
 *  page published in Prismic without a seed entry is not visible from here;
 *  add it to the seed (src/lib/beachfront-pages.js) before linking to it. */
function servedPaths(): Set<string> {
  const routes = resolve(process.cwd(), "src/routes");
  const staticRoutes = readdirSync(routes, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !/[[(]/.test(d.name))
    .filter((d) =>
      ["+page.svelte", "+page.server.ts", "+page.ts"].some((f) =>
        existsSync(resolve(routes, d.name, f)),
      ),
    )
    .map((d) => `/${d.name}`);
  const under = (prefix: string, uids: object) =>
    Object.keys(uids).map((uid) => `${prefix}/${uid}`);
  return new Set([
    "/",
    ...Object.keys(TITLES)
      .filter((uid) => uid !== "home")
      .map((uid) => `/${uid}`),
    ...under("/services", COLLECTION_ITEM_CONTENT),
    ...under("/team-members", PERSON_CONTENT),
    ...under("/questions", NEWS_ARTICLE_CONTENT),
    ...staticRoutes,
  ]);
}

describe("loadSiteConfig", () => {
  it("returns a well-formed config", () => {
    const config = loadSiteConfig();
    // The shape must always be safe to spread into <Nav items> /
    // <Footer socials> without guards at the call site.
    expect(Array.isArray(config.nav.items)).toBe(true);
    expect(Array.isArray(config.footer.socials)).toBe(true);
  });

  it("loads the Beachfront chrome data and satisfies SiteConfig", () => {
    // Typecheck-level assertion: this only compiles if the checked-in JSON
    // conforms to the SiteConfig shape.
    const config: SiteConfig = loadSiteConfig();

    // The practice's five destinations stay reachable from the menu. A
    // designer may add entries or reorder them; that is not a bug.
    expect(config.nav.items.map((item) => item.href)).toEqual(
      expect.arrayContaining([
        "/your-first-visit",
        "/our-team",
        "/services",
        "/ask-the-doctor",
        "/contact-us",
      ]),
    );
  });

  it("points every internal nav link at a page this site serves", () => {
    const served = servedPaths();
    // Guard the guard: an empty set would fail every link for the wrong reason.
    expect(served.has("/our-team")).toBe(true);
    const internal = loadSiteConfig()
      .nav.items.map((item) => item.href)
      .filter((href) => href.startsWith("/"));
    expect(internal.length).toBeGreaterThan(0);
    for (const href of internal) {
      const path = href.replace(/[?#].*$/, "").replace(/(.)\/$/, "$1");
      expect(served.has(path), `${href} resolves to no page`).toBe(true);
    }
  });
});

describe("footerColumns", () => {
  const chromeCols = [
    { items: [{ text: "Leasing: (555) 123-4567", href: "tel:5551234567" }] },
  ];
  const configWithColumns: SiteConfig = {
    nav: { items: [] },
    footer: { socials: [], columns: chromeCols },
  };

  it("prefers the per-route page-data columns (the dev fidelity gate injects them)", () => {
    const pageCols = [{ items: [{ text: "from page data" }] }];
    expect(footerColumns(pageCols, configWithColumns)).toBe(pageCols);
  });

  it("falls back to the site-config chrome columns when page data has none", () => {
    // The regression this guards: a migrated site's leasing-contact footer
    // rides site-config.json (the catalog chrome emit), NOT page.data — so a
    // layout that reads only page.data.footerColumns drops the real footer.
    expect(footerColumns(undefined, configWithColumns)).toBe(chromeCols);
  });

  it("returns undefined when neither supplies columns (fresh site → Footer placeholder)", () => {
    // A fresh (unconverted) site's config has no footer.columns — modeled
    // here explicitly, since this repo's checked-in site-config.json now
    // carries Beachfront's real chrome data.
    const freshSiteConfig: SiteConfig = {
      nav: { items: [] },
      footer: { socials: [] },
    };
    expect(footerColumns(undefined, freshSiteConfig)).toBeUndefined();
  });
});
