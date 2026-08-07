// Style-census rows the OPERATOR has looked at and chosen to keep. Same
// contract as matching/floors.mjs: nothing is hidden, everything is counted
// under its own heading, and every entry needs a LEDGER entry to stay honest.
//
//   node matching/census-count.mjs <log>   -> "<real> <ambiguous> <declared>"
//
// Without this, `census.sh` can never reach zero and a "48 remaining" figure
// says nothing about how much work is left — 27 of those 48 were one permanent
// decision counted once per page per viewport.

/** Live's brand cyan #129ecc = rgb(18,158,204); our AA-safe swap is
 *  #0e7799 = rgb(14,119,153). */
const LIVE_CYAN = "rgb(18, 158, 204)";
const OURS_DEEP = "rgb(14, 119, 153)";

/** A row is `{ label, ref, cand }`, each of ref/cand a "fam | wt | size | lh |
 *  ls | transform | colour" tuple string. */
export const DECLARED = [
  {
    name: "AA colour swap on headings below 24px",
    // ACK 2026-08-03 (footer "Want to learn more?") and extended 2026-08-05 to
    // every heading in this class: the service-category cards and yfv's TOC and
    // exam h3s. Live uses its cyan at 21px, which is 3.09:1 on the pale canvas
    // — AA-safe for LARGE text only. We ship live's exact cyan at >=24px (the
    // `.h-primary` / `.h-primary-lg` opt-ins) and the darker #0e7799 below it.
    // Deliberate, permanent, and the ONLY difference is the colour field.
    match: (r) => {
      const f = (t) => t.split("|").map((s) => s.trim());
      const R = f(r.ref),
        C = f(r.cand);
      if (R.length !== C.length) return false;
      const differing = R.map((v, i) => (v === C[i] ? null : i)).filter(
        (i) => i !== null,
      );
      return (
        differing.length === 1 &&
        differing[0] === R.length - 1 &&
        R.at(-1) === LIVE_CYAN &&
        C.at(-1) === OURS_DEEP
      );
    },
  },
  {
    name: "a11y size floor on the review card's place line",
    // Ledgered a11y deviation ("slider live-region 16->20 + place 10->16"):
    // live sets this label at 13px in the 768-991 band, below our legibility
    // floor of 16. While that floor stands the tuple cannot match, so the row
    // is a deviation rather than outstanding work. It is scoped tightly — the
    // exact pair, not "any size difference on an uppercase teal line".
    match: (r) =>
      /beach, ca$/i.test(r.label.replace(/"/g, "").trim()) &&
      r.ref.includes("13px | 15px") &&
      r.cand.includes("16px | 25px"),
  },
];
