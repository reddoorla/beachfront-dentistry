// Rich-text body repair for inherited Webflow content.
//
// Pure functions, deliberately in their own module: the seed script reads a
// write token at import time, so anything living beside it could not be unit
// tested (and importing it for a one-line check once fired a real staging run).
// Nothing here touches the network, the filesystem or a credential — see
// body-links.test.js, which is the only mechanical check standing between this
// logic and published body copy.
//
// ---- in-body link repair -----------------------------------------------------
//
// The Webflow import carried article cross-links across as ABSOLUTE urls on the
// production domain (18 of them across 9 paths). Two problems.
//
// 1. They are a latent build-breaker. SvelteKit's prerenderer only crawls
//    SAME-ORIGIN links, and `kit.prerender.origin` comes from Netlify's `URL`.
//    Today that is the *.netlify.app preview domain, so a beachfrontdentistry.com
//    link is external and skipped. The moment the site is served from the real
//    domain those links become internal, get crawled, and `pnpm build` fails on
//    the first one that 404s. Verified: `URL=https://www.beachfrontdentistry.com
//    pnpm build` fails today on a clean tree, while CI (no URL set) passes.
//
// 2. Five of the nine paths 404 — on our site AND on live. They are inherited
//    dead links whose slugs never matched any document.
//
// Rewriting to root-relative paths fixes both: relative links are unambiguously
// internal at every origin, so the build behaves identically in CI, on a preview
// and in production, and there is no domain left to go stale.
export const SITE_ORIGIN = "https://www.beachfrontdentistry.com";

/** Dead slug -> the uid that article actually has. Each mapping is pinned by
 *  the link's own ANCHOR TEXT naming the target article, not by guesswork. */
export const LINK_REDIRECTS = {
  // "Why do teeth hurt more at night?"
  "/questions/why-teeth-hurt-at-night":
    "/questions/why-do-teeth-hurt-more-at-night",
  // "Why does my tooth hurt when I bite down?"
  "/questions/tooth-hurts-when-biting-down":
    "/questions/why-does-my-tooth-hurt-when-i-bite-down",
  // "Signs you may have a tooth infection"
  "/questions/signs-of-tooth-infection":
    "/questions/tooth-infection-symptoms-warning-signs-you-shouldnt-ignore",
  // "How to stop a toothache until you see a dentist"
  "/questions/stop-a-toothache": "/questions/how-to-stop-a-toothache-fast",
};

/** Links whose anchor text names one article while the href points at another.
 *  In tooth-infection-symptoms…, "When tooth pain is a dental emergency" linked
 *  to why-does-my-tooth-hurt-when-i-bite-down — a 200, so no 404 scan would ever
 *  surface it, but the reader lands on the wrong article. Anchor text wins. */
export const ANCHOR_TARGETS = {
  "when tooth pain is a dental emergency":
    "/questions/when-tooth-pain-is-a-dental-emergency",
};

/** Blocks dropped outright. "Pillar: …" is content-strategy scaffolding for a
 *  hub article that was never written — it 404s on live too — so there is no
 *  correct destination to point it at, and leaving it unlinked would publish
 *  the jargon as body copy. */
export const DROP_BLOCK = /^\s*Pillar:\s/i;

/** Editorial scaffolding CUT OUT of copy that is otherwise good.
 *
 *  "Related reading (internal links)" heads a real list of two article links in
 *  three published articles — the heading belongs on the page, the SEO-brief
 *  parenthetical telling the writer what kind of links to put there does not.
 *  Dropping the whole block would take the heading with it, so these trim
 *  rather than delete. Patterns are removed, never substituted: anything that
 *  needs replacing is a rewrite an editor should make in Prismic. */
export const SCAFFOLDING = [/\s*\(internal links?\)/i];

/** Remove a `[start, end)` slice of a block's text, keeping its spans aligned:
 *  a span after the cut shifts left by its length, a span straddling the cut is
 *  clamped to what survives. (Today's one rule matches a trailing parenthetical
 *  in blocks that carry no spans at all, so this is defence for the next rule,
 *  not the current one.) */
function cutText(block, start, end) {
  const len = end - start;
  const shift = (i) => (i <= start ? i : i >= end ? i - len : start);
  return {
    ...block,
    text: block.text.slice(0, start) + block.text.slice(end),
    ...(Array.isArray(block.spans)
      ? {
          spans: block.spans
            .map((s) => ({ ...s, start: shift(s.start), end: shift(s.end) }))
            .filter((s) => s.end > s.start),
        }
      : {}),
  };
}

/** Apply SCAFFOLDING to one block. Returns the block unchanged when nothing
 *  matched, so an untouched body stays reference-equal. */
export function stripScaffolding(block) {
  if (typeof block.text !== "string") return block;
  let out = block;
  for (const pattern of SCAFFOLDING) {
    // Re-match from the top of the REWRITTEN text each pass, so the indices
    // handed to cutText always describe the current string rather than the
    // original one (which a global regex's lastIndex would refer to).
    for (let m; (m = pattern.exec(out.text));) {
      out = cutText(out, m.index, m.index + m[0].length);
    }
  }
  if (out.text === block.text) return block;
  // Trim through cutText, never String.trim(): removing leading whitespace
  // shifts every index in the block, and a bare .trim() would silently
  // desync the spans this function just spent its effort keeping aligned.
  const lead = /^\s+/.exec(out.text);
  if (lead) out = cutText(out, 0, lead[0].length);
  const tail = /\s+$/.exec(out.text);
  if (tail) out = cutText(out, tail.index, out.text.length);
  return out;
}

/** Rewrite one rich-text body: drop dead scaffolding, trim scaffolding out of
 *  copy worth keeping, make internal links relative, repoint the ones whose
 *  slug never existed. */
export function normalizeBodyLinks(body) {
  if (!Array.isArray(body)) return body;
  return body
    .filter((b) => !(typeof b.text === "string" && DROP_BLOCK.test(b.text)))
    .map(stripScaffolding)
    .map((b) => {
      if (!Array.isArray(b.spans) || !b.spans.length) return b;
      return {
        ...b,
        spans: b.spans.map((s) => {
          const url = s.data?.url;
          if (!url || !url.startsWith(SITE_ORIGIN)) return s;
          const anchor = (b.text ?? "").slice(s.start, s.end).trim();
          const byAnchor = ANCHOR_TARGETS[anchor.toLowerCase()];
          const path = url.slice(SITE_ORIGIN.length).replace(/\/+$/, "") || "/";
          const next = byAnchor ?? LINK_REDIRECTS[path] ?? path;
          return { ...s, data: { ...s.data, url: next } };
        }),
      };
    });
}
