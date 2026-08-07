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
];
