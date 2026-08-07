// Interaction states the OPERATOR has looked at and chosen to keep. Same
// contract as matching/floors.mjs and matching/census-deviations.mjs: nothing
// is hidden, each is counted under its own heading, and each needs a LEDGER
// entry to stay honest.

/** Live's brand cyan; our AA-safe replacements. */
const LIVE_CYAN = "rgb(18, 158, 204)";

export const DECLARED = [
  {
    name: "AA colour on chrome links below 24px",
    // ACK 2026-08-03 (footer heading), extended 2026-08-05 to every element in
    // this class. Live paints its cyan on 16px footer links and on the
    // off-canvas nav links; #129ecc is 3.09:1 on the pale footer, which fails
    // AA for normal-size text. We ship `--primary-dark` (#365b6d) on the footer
    // and white in the dark panel, and live's exact cyan wherever the type is
    // >=24px. The ONLY difference these states report is `color`.
    match: (name, diffs, live) =>
      /footer nav link|footer phone|nav link hover/.test(name) &&
      diffs.length === 1 &&
      diffs[0] === "color" &&
      live.color === LIVE_CYAN,
  },
];
