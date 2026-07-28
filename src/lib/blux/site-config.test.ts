import { describe, it, expect } from "vitest";
import { loadSiteConfig, footerColumns, type SiteConfig } from "./site-config";

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

    expect(config.nav.items).toHaveLength(5);
    expect(config.nav.items.map((item) => item.href)).toEqual([
      "/your-first-visit",
      "/our-team",
      "/services",
      "/ask-the-doctor",
      "/contact-us",
    ]);
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
