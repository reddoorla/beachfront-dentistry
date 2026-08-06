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
  {
    match: (r) =>
      r.label === "We want you to feel comfortable" && r.viewport === 390,
    why:
      'ACK 2026-08-05: ships "Book an Appointment" where live has the typo ' +
      '"Apointment". The extra letter makes the button 9px wider than the 6px ' +
      "of slack live's 351px column has, so the pair wraps and one extra " +
      "76.8px line box is the whole Δh. Pixels are at 1.1%.",
  },
];
