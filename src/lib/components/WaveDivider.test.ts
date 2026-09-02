import { render } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";
import WaveDivider from "./WaveDivider.svelte";

describe("WaveDivider", () => {
  it("renders a decorative svg (hidden from AT)", () => {
    const { container } = render(WaveDivider, { props: { fill: "#ffffff" } });
    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg?.closest("[aria-hidden='true']")).not.toBeNull();
    expect(container.querySelector("path")?.getAttribute("fill")).toBe(
      "#ffffff",
    );
  });

  it("flips when flip is set", () => {
    const { container } = render(WaveDivider, { props: { flip: true } });
    expect(container.querySelector(".rotate-180")).not.toBeNull();
  });

  it("does not flip by default", () => {
    const { container } = render(WaveDivider);
    expect(container.querySelector(".rotate-180")).toBeNull();
  });

  // --- MARKUP ROUND H4 (thread 7dd0c2f2) ---------------------------------
  // "sine should be only up/down on each page landing at the same height".
  // The rendered proof lives in tests/interaction/wave-divider.spec.ts; these
  // pin the two structural properties that make it true everywhere at once, so
  // a future edit to the path or the width cannot quietly undo it.

  it("draws the SVG at exactly its box width, so nothing is cropped", () => {
    // The H1 defect was an SVG stretched to 133% (169% in the footer) inside an
    // overflow-hidden box: only 1/1.33 of the viewBox was ever on screen, which
    // is what cut the wave mid-period and left its visible ends an amplitude
    // apart. Anything other than a 100% base reintroduces that.
    const { container } = render(WaveDivider);
    const width = container.querySelector("svg")?.getAttribute("style");
    expect(width).toMatch(/width:\s*calc\(100%\s*\+\s*1\.3px\)/);
  });

  /** On-curve points: the M, then the 6th number of every cubic. */
  const knotsOf = (d: string) => [
    Number(d.match(/^M[\d.]+,([\d.]+)/)![1]),
    ...[...d.matchAll(/C[\d.]+,[\d.]+,[\d.]+,[\d.]+,[\d.]+,([\d.]+)/g)].map(
      (m) => Number(m[1]),
    ),
  ];
  const pathD = () =>
    render(WaveDivider).container.querySelector("path")!.getAttribute("d")!;

  it("starts and ends the wave at the same height", () => {
    const d = pathD();
    const start = d.match(/^M0,([\d.]+)/)![1];
    // The last knot before the closing V/H/Z. The V no longer returns to the
    // viewBox's own top: round I2 extended the fill 3 units past it (`V-3`) so
    // it OVERHANGS the seam instead of meeting it — see WaveDivider's markup
    // note and tests/interaction/wave-divider.spec.ts.
    const end = d.match(/,([\d.]+)V-?[\d.]+H0Z$/)![1];
    expect(Number(end)).toBe(Number(start));
  });

  it("starts and ends at NEUTRAL, not on a crest", () => {
    // Operator, 2026-08-13: "coming back to neutral on both side". The previous
    // two-period cosine entered and left on a crest (y=28) — level with itself,
    // but a full amplitude off the mid-line, which is what made the seam read as
    // a wave sliced mid-stroke rather than one that resolves.
    const knots = knotsOf(pathD());
    expect(knots[0]).toBe(60); // 60 = the mid-line of the 0..120 viewBox
    expect(knots.at(-1)).toBe(60);
  });

  it("is a SINGLE up and then down — one crest, one trough", () => {
    // y = 60 − 32·sin(πx/600) over 0..1200: neutral, crest at 300, neutral at
    // 600, trough at 900, neutral. Exactly two turning points. Counting them off
    // the knots is what stops a future edit quietly restoring a second period.
    const knots = knotsOf(pathD());
    expect(knots).toEqual([60, 28, 60, 92, 60]);

    const turns = knots
      .slice(1, -1)
      .filter((y, i) => (y - knots[i]) * (knots[i + 2] - y) < 0);
    expect(turns, "one crest and one trough, nothing else").toEqual([28, 92]);
  });
});
