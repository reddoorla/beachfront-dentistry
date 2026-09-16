// The two halves of probe-anchor-parity.mjs that decide a verdict: which
// element an anchor resolves to, and whether the two sides' cuts are
// comparable. Both are pure, and both must model the cut the way the thing
// they audit does — see the probe's header for what happens when they don't.
//
// They live apart from the probe so a test can import them: the probe itself
// imports harness.mjs, whose `import.meta.url` is not a file: URL under
// vitest's transform, and drives a real browser. Nothing here imports
// anything.

/** Runs INSIDE the page (page.evaluate serializes this function), so it must
 *  stay self-contained — no module-scope references, including the selector. */
export const readAnchors = (anchors) => {
  const norm = (s) => (s ?? "").replace(/\s+/g, " ").trim().toLowerCase();
  // EXACTLY lib/capture.mjs:341's selector, not `body *`. They diverged, and
  // the divergence was not cosmetic: this rebuild wraps its sections in a
  // <main> landmark the Webflow reference has no equivalent of, so `body *`
  // resolved the first anchor of a page to <main> (the whole document's
  // height) against the reference's section wrapper, and reported a several-x
  // MISMATCH at every viewport. capture.mjs never considers <main> — it is not
  // in this list — so the real cut was the same element on both sides, and the
  // probe was raising an alarm about a comparison the gate does not make. That
  // fires on the FIRST anchor of EVERY page of EVERY site rebuilt this way, so
  // it is systematic, not incidental. A probe that models the thing it audits
  // differently from the thing itself is worse than no probe: it sends you
  // looking for a cutting artefact instead of the real defect.
  const all = [
    ...document.querySelectorAll(
      "h1,h2,h3,h4,h5,h6,p,a,li,span,div,section,button",
    ),
  ];
  return anchors.map((a) => {
    const hits = all.filter((e) => norm(e.textContent).startsWith(norm(a)));
    const el = hits[0];
    if (!el) return { anchor: a, missing: true, n: 0 };
    const r = el.getBoundingClientRect();
    return {
      anchor: a,
      n: hits.length,
      tag: el.tagName.toLowerCase(),
      cls: (el.className?.toString() ?? "").slice(0, 34),
      y: Math.round(r.top + window.scrollY),
      h: Math.round(r.height),
      // how far the cut element sits above the NEXT hit — the size of the
      // wrapper that only one side may have
      drop: hits[1]
        ? Math.round(
            hits[1].getBoundingClientRect().top +
              window.scrollY -
              (r.top + window.scrollY),
          )
        : 0,
    };
  });
};

/** Are the two resolved cuts comparable? Returns the verdict plus the numbers
 *  the probe prints. */
export function verdict(l, o) {
  const missing = Boolean(l.missing || o.missing);
  // A tag difference is cosmetic — live using <div> where we use <footer> for
  // the same ~710px block changes nothing — and so, on its own, is a height
  // difference: `regionsFromAnchors` (lib/regions.mjs:47-64) cuts on the
  // anchor's TOP Y and nothing else, so a region runs from one anchor's y to
  // the next one's and the cut element's box never enters the arithmetic.
  //
  // So the y delta is the verdict and the height ratio is context for reading
  // it. Flagging on height alone is what produced the false positive above:
  // two sides cut at the same y, boxes 4.6x apart, reported as "every region
  // score below this is suspect". A >4px delta is the same tolerance
  // regionsFromAnchors uses to drop a degenerate region, so anything at or
  // under it cannot move a cut.
  const ratio = missing
    ? Infinity
    : Math.max(l.h, o.h) / Math.max(1, Math.min(l.h, o.h));
  const dy = missing ? Infinity : Math.abs(l.y - o.y);
  const bad = missing || dy > 4;
  const flag = missing
    ? "!! UNRESOLVED"
    : bad
      ? `!! CUT SKEW ${dy}px`
      : ratio >= 1.5
        ? `   ok (cut aligned; boxes differ ${ratio.toFixed(1)}x)`
        : "   ok        ";
  return { bad, ratio, dy, flag };
}
