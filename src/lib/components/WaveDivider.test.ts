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

  it("starts and ends the wave at the same height", () => {
    const d = render(WaveDivider)
      .container.querySelector("path")!
      .getAttribute("d")!;
    const start = d.match(/^M0,([\d.]+)/)![1];
    // the last knot before the V0 H0 Z close
    const end = d.match(/,([\d.]+)V0H0Z$/)![1];
    expect(Number(end)).toBe(Number(start));
  });

  it("carries a whole number of periods with level, flat ends", () => {
    const d = render(WaveDivider)
      .container.querySelector("path")!
      .getAttribute("d")!;
    // y = 60 − 32·cos(πx/300): extrema every 300 units, so the knots alternate
    // 28, 60, 92, 60, 28 … and both ends sit on an extremum (28). Ends with
    // zero slope are what make the calc() hairline overhang a second-order
    // error instead of a visible step.
    // on-curve points only: the M, then the 6th number of every cubic
    const knots = [
      Number(d.match(/^M[\d.]+,([\d.]+)/)![1]),
      ...[...d.matchAll(/C[\d.]+,[\d.]+,[\d.]+,[\d.]+,[\d.]+,([\d.]+)/g)].map(
        (m) => Number(m[1]),
      ),
    ];
    expect(knots[0]).toBe(28);
    expect(knots.at(-1)).toBe(28);
    expect(new Set(knots).size).toBe(3); // 28 / 60 / 92 only
    // 2 full periods = 4 turning points strictly inside plus the two ends
    const extrema = knots.filter((y) => y === 28 || y === 92);
    expect(extrema).toEqual([28, 92, 28, 92, 28]);
  });
});
