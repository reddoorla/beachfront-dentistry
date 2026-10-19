import { describe, it, expect, vi } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

// robots.txt, sitemap.xml and every prerendered page are built with kit 3's
// placeholder origin, "http://sveltekit-prerender" (paths.origin is not set:
// sveltekit.config.js says why). Each absolute URL they emit must go through
// $lib/seo's siteOrigin, which puts the build's production URL in its place.
// Kit 2 took that from prerender.origin, so these routes read url.origin
// directly; a revert to that builds green and ships the placeholder in the
// production sitemap, robots.txt and JSON-LD (measured on #90's review: 82
// files). In vitest the build has no URL, so the build origin is fixed here
// through the mock.
vi.mock("$lib/seo", async (importOriginal) => {
  const actual = await importOriginal<typeof import("$lib/seo")>();
  return {
    ...actual,
    siteOrigin: (url: Pick<URL, "origin"> | string) =>
      actual.siteOrigin(url, "https://beachfrontdentistry.com"),
  };
});

// The sitemap reads Prismic; the same mock convention as its own server.test.ts.
vi.mock("$lib/prismicio", () => ({
  createClient: () => ({
    getAllByType: async (type: string) =>
      type === "page" ? [{ uid: "home" }, { uid: "about" }] : [],
  }),
  isPlaceholderRepo: false,
  isFrozenSite: false,
}));
vi.mock("$lib/blux-frozen/load", () => ({ frozenUids: () => [] }));

const robots = await import("./robots.txt/+server");
const sitemap = await import("./sitemap.xml/+server");

const PLACEHOLDER = "http://sveltekit-prerender";
const src = join(import.meta.dirname, "..");

describe("prerendered while the build had a production URL", () => {
  it("robots.txt names the production sitemap, not the placeholder", async () => {
    const res = await (robots.GET as unknown as (e: { url: URL }) => Response)({
      url: new URL(`${PLACEHOLDER}/robots.txt`),
    });
    const body = await res.text();
    expect(body).toContain(
      "Sitemap: https://beachfrontdentistry.com/sitemap.xml",
    );
    expect(body).not.toContain(PLACEHOLDER);
  });

  it("sitemap.xml lists production URLs only, not the placeholder", async () => {
    const res = await (
      sitemap.GET as unknown as (e: {
        fetch: typeof fetch;
        url: URL;
      }) => Promise<Response>
    )({ fetch, url: new URL(`${PLACEHOLDER}/sitemap.xml`) });
    const xml = await res.text();
    const locs = [...xml.matchAll(/<loc>([^<]*)<\/loc>/g)].map(
      ([, loc]) => loc,
    );
    expect(locs).toContain("https://beachfrontdentistry.com/about");
    expect(
      locs.filter((loc) => !loc.startsWith("https://beachfrontdentistry.com/")),
    ).toEqual([]);
  });
});

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (
      /\.(svelte|ts|js)$/.test(entry) &&
      !/\.(test|spec)\.ts$/.test(entry)
    )
      out.push(full);
  }
  return out;
}

// Where a source file builds an origin from kit's url. Two reads are not
// origins put into output: $lib/seo's own siteOrigin, and PrismicPreview
// comparing a navigation's origin with the current one.
// A line that is only a comment; a block comment before code still counts.
const isComment = (line: string) =>
  /^\s*(\/\/|\*(?!\/)|<!--)/.test(line) ||
  /^\s*\/\*/.test(line.replace(/\/\*.*?\*\//g, "").trimStart() ? "" : line);
const ALLOWED = new Set(["lib/seo.ts", "lib/components/PrismicPreview.svelte"]);

describe("every absolute URL in prerendered output takes siteOrigin", () => {
  it("reads no url.origin outside siteOrigin, except to measure it", () => {
    const offenders = walk(src).flatMap((file) => {
      const rel = relative(src, file).split("\\").join("/");
      if (ALLOWED.has(rel)) return [];
      return readFileSync(file, "utf8")
        .split("\n")
        .flatMap((line, i) =>
          !isComment(line) && /\burl\.origin\b(?!\.length)/.test(line)
            ? [`${rel}:${i + 1}: ${line.trim()}`]
            : [],
        );
    });
    expect(offenders).toEqual([]);
  });

  it("sees a url.origin read when there is one (the instrument's control)", () => {
    expect(
      /\burl\.origin\b(?!\.length)/.test(
        "jsonLd={practiceJsonLd(page.url.origin)}",
      ),
    ).toBe(true);
    expect(
      /\burl\.origin\b(?!\.length)/.test(
        "page.url.href.slice(page.url.origin.length)",
      ),
    ).toBe(false);
  });

  it("builds the sitemap, the practice JSON-LD and the share links on siteOrigin", () => {
    const read = (rel: string) => readFileSync(join(src, rel), "utf8");
    expect(read("routes/sitemap.xml/+server.ts")).toMatch(
      /=\s*siteOrigin\(url\)/,
    );
    expect(read("routes/robots.txt/+server.ts")).toMatch(
      /\$\{siteOrigin\(url\)\}\/sitemap\.xml/,
    );
    expect(read("routes/+layout.svelte")).toMatch(
      /practiceJsonLd\(siteOrigin\(page\.url\)\)/,
    );
    expect(read("lib/components/ProductDetail.svelte")).toMatch(
      /pageUrl = \$derived\(\s*siteOrigin\(page\.url\)/,
    );
  });
});
