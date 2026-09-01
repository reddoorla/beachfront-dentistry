// The failures we have already established are NOT geometry. Shared by
// next.mjs (which reports them separately from the backlog) and strikes.mjs
// (which must not report them as stalled — a region that cannot move is flat
// by definition, and three strikes on one is noise that hides a real stall).
// Every entry needs a matching LEDGER entry to stay honest.

/** Reference behaviour we cannot reproduce (declared floors). */
export const FLOORS = [
  {
    match: (r) => r.label === "Want to learn more",
    why: "declared [floor-live-embed] cross-origin map iframe",
  },
];

/** Regions the OPERATOR has looked at and chosen to leave failing. These are
 *  not floors and are not silently dropped: next.mjs prints them under their
 *  own heading with the decision, so the number never quietly improves. */
export const ACCEPTED = [
  // The 2026-08-05 @390 entry here (the "Apointment" typo wrapping the button
  // pair onto a second row, +76.8px) is RESOLVED, not deleted quietly: removing
  // the dead "Registration Form" button on 2026-08-07 left one button in the
  // row, so the wrap cannot happen. Re-probed after the change — the TOC
  // section is h=474.2 on BOTH pages with every internal row at an identical
  // offset, and every anchor from "Office Tour" down is within 1px of live.
  // The correct spelling still ships; it simply no longer costs a line box.
  {
    match: (r) =>
      r.label === "We want you to feel comfortable" && r.viewport === 1440,
    why:
      'ACK 2026-08-07: "remove both buttons" — /your-first-visit\'s ' +
      '"Registration Form" and "Download Forms" were href="#" on live too, ' +
      "with no forms destination anywhere in the reference to point them at. " +
      "Live STACKS the pair at desktop, so dropping one shortens this region " +
      "by 84px (ref 557 -> cand 473, Δh=15.1%) and shifts every anchor below " +
      "up 84px. Pixels are at 0.4% — the content that remains matches. This " +
      "is the price of the removal, not geometry: do not chase it.",
  },
  // NOTE the second matcher argument. Region records carry `label` and
  // `viewport` but not the page, and the entry above gets away with that only
  // because its label is unique site-wide. "top" is not — every page has one —
  // so an entry keyed on label+viewport alone would silently accept the `top`
  // failure on all nine pages and hide eight real ones. next.mjs and
  // strikes.mjs now pass the page key as the second argument.
  {
    match: (r, page) =>
      r.label === "top" && r.viewport === 1440 && page === "our-team",
    why:
      'ACK 2026-09-01 (MARKUP ROUND I1, pin #4): "decrease the space between ' +
      "\"Meet\" and \"Our\"… ideally 'Meet' comes down 30px and 'Our' comes up " +
      '40px." That gap IS the hero divider — 120px of gap over a 120px lg ' +
      "box — so closing it is a deliberate departure from live's geometry, " +
      "not an approximation of it. We ship 56px where live ships 120, which " +
      'puts our "Our" anchor 30px ABOVE live\'s (cand 435 vs ref 465) where ' +
      "it used to sit 10px below. PIXELS IMPROVED on this change (11.0% -> " +
      "8.6%); it is the HEIGHT delta that now fails, at 6.5%, and that " +
      "number is the deviation itself, priced. Do not chase it, and do not " +
      "widen maxHeightDelta to hide it — the operator asked for the gap to " +
      "close and live is no longer the authority on this one distance.",
  },
];
