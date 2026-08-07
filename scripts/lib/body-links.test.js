import { describe, it, expect } from "vitest";
import {
  normalizeBodyLinks,
  stripScaffolding,
  SITE_ORIGIN,
} from "./body-links.mjs";

// This module is the last thing that runs before inherited Webflow copy is
// staged into Prismic, and a mistake here publishes wrong body text or wrong
// links to real patients. Nothing else in the suite can see it: every gate runs
// against /dev/match/*, which reads the fixtures directly and never round-trips
// through the CMS.

const para = (text, spans = []) => ({ type: "paragraph", text, spans });
const link = (start, end, url) => ({
  type: "hyperlink",
  start,
  end,
  data: { url },
});

describe("normalizeBodyLinks — internal links", () => {
  it("rewrites an absolute production url to a root-relative path", () => {
    const [b] = normalizeBodyLinks([
      para("read more", [link(0, 9, `${SITE_ORIGIN}/your-first-visit`)]),
    ]);
    expect(b.spans[0].data.url).toBe("/your-first-visit");
  });

  it("repoints a slug that never existed, by the link's anchor text", () => {
    const [b] = normalizeBodyLinks([
      para("Why do teeth hurt more at night?", [
        link(0, 32, `${SITE_ORIGIN}/questions/why-teeth-hurt-at-night`),
      ]),
    ]);
    expect(b.spans[0].data.url).toBe(
      "/questions/why-do-teeth-hurt-more-at-night",
    );
  });

  it("fixes a link whose anchor names one article and whose href points at another", () => {
    // A 200 at both ends, so no 404 scan would ever surface it.
    const [b] = normalizeBodyLinks([
      para("When tooth pain is a dental emergency", [
        link(
          0,
          37,
          `${SITE_ORIGIN}/questions/why-does-my-tooth-hurt-when-i-bite-down`,
        ),
      ]),
    ]);
    expect(b.spans[0].data.url).toBe(
      "/questions/when-tooth-pain-is-a-dental-emergency",
    );
  });

  it("leaves external and tel: links alone", () => {
    const [b] = normalizeBodyLinks([
      para("call us or read reviews", [
        link(0, 7, "tel:310-378-9241"),
        link(
          13,
          23,
          "https://www.yelp.com/biz/beachfront-dentistry-redondo-beach",
        ),
      ]),
    ]);
    expect(b.spans.map((s) => s.data.url)).toEqual([
      "tel:310-378-9241",
      "https://www.yelp.com/biz/beachfront-dentistry-redondo-beach",
    ]);
  });

  it("drops a 'Pillar:' block outright — it names an article that was never written", () => {
    const out = normalizeBodyLinks([
      para("Pillar: Tooth pain: causes, relief, and when it's an emergency"),
      para("real copy"),
    ]);
    expect(out.map((b) => b.text)).toEqual(["real copy"]);
  });
});

describe("stripScaffolding", () => {
  it("trims the SEO-brief parenthetical but keeps the heading", () => {
    // The exact string in three published articles; it heads a real list of
    // links, so dropping the whole block would take the heading with it.
    expect(
      stripScaffolding(para("Related reading (internal links)")).text,
    ).toBe("Related reading");
  });

  it("returns the very same object when nothing matched", () => {
    const b = para("Related reading");
    expect(stripScaffolding(b)).toBe(b);
  });

  it("keeps spans aligned with the text it shortened", () => {
    const b = para("See (internal links) our guide", [link(21, 30, "/guide")]);
    const out = stripScaffolding(b);
    expect(out.text).toBe("See our guide");
    expect(out.text.slice(out.spans[0].start, out.spans[0].end)).toBe(
      "our guide",
    );
  });

  it("keeps spans aligned when the cut leaves LEADING whitespace", () => {
    // A bare String.trim() here would shift every index in the block by one
    // and silently move the link onto the wrong words.
    const b = para("(internal links) Read our guide", [link(17, 21, "/read")]);
    const out = stripScaffolding(b);
    expect(out.text).toBe("Read our guide");
    expect(out.text.slice(out.spans[0].start, out.spans[0].end)).toBe("Read");
  });

  it("survives a block with no text (an image block)", () => {
    const img = { type: "image", url: "https://example.com/x.png" };
    expect(stripScaffolding(img)).toBe(img);
  });
});
