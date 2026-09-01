// MarkUp round I1 pin #4 verification. The operator chose "let the headline sit
// ON the wave", so the thing that must be proved is no longer "text clears the
// divider box" but the two facts that actually decide legibility:
//   1. "Meet" (WHITE on the photo, above the wave) still clears the wave's INK.
//   2. "Our"/"Team" (DARK TEAL, over the wave) sit entirely on the wave's WHITE
//      FILL — never on the photo, at any x under their own glyphs.
// Both are measured against the painted path via getScreenCTM, the same way
// wave-divider.spec.ts does it, at every width in the lg band plus the two
// tiers that must NOT have moved.
import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";

const BASE = process.env.BASE || "http://localhost:5173";
const b = await chromium.launch();
const out = {};

for (const width of [1440, 1294, 1200, 993, 834, 390]) {
  const ctx = await b.newContext({ viewport: { width, height: 900 } });
  const p = await ctx.newPage();
  await p.goto(`${BASE}/our-team`, {
    waitUntil: "networkidle",
    timeout: 60000,
  });
  await p.evaluate(() => document.fonts.ready);
  await p.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
  await p.waitForTimeout(1200);

  out[width] = await p.evaluate(() => {
    const hero = document.querySelector("section");
    const svg = hero.querySelector("svg");
    const path = svg.querySelector("path");
    const ctm = path.getScreenCTM();
    const len = path.getTotalLength();
    // The painted curve in document space.
    const pts = [];
    for (let i = 0; i <= 1200; i++) {
      const q = path.getPointAtLength((len * i) / 1200);
      const s = new DOMPoint(q.x, q.y).matrixTransform(ctm);
      pts.push({ x: s.x, y: s.y + scrollY });
    }
    const box = svg.getBoundingClientRect();
    const waveTop = box.top + scrollY;
    const waveBottom = box.bottom + scrollY;

    // For a flipped divider the FILL lies BELOW the curve: at a given x the
    // white starts at the curve and runs to the box bottom. So the fill's top
    // edge at x is the curve's y there (max y among samples at that x is the
    // closing edge; the curve itself is the min y of the two strands).
    const curveAt = (x) => {
      const near = pts.filter(
        (q) =>
          Math.abs(q.x - x) < 2 &&
          q.y > waveTop + 0.5 &&
          q.y < waveBottom - 0.5,
      );
      return near.length ? Math.min(...near.map((q) => q.y)) : null;
    };
    /** Worst (lowest / latest-starting) fill edge under a glyph run. */
    const fillTopUnder = (x0, x1) => {
      let worst = null;
      for (let x = Math.max(x0, 0); x <= x1; x += 2) {
        const c = curveAt(x);
        if (c !== null && (worst === null || c > worst)) worst = c;
      }
      return worst;
    };
    const inkTopUnder = (x0, x1) => {
      let hi = null;
      for (let x = Math.max(x0, 0); x <= x1; x += 2) {
        const c = curveAt(x);
        if (c !== null && (hi === null || c < hi)) hi = c;
      }
      return hi;
    };
    const rectOf = (el) => {
      const r = document.createRange();
      r.selectNodeContents(el);
      const b = r.getBoundingClientRect();
      return {
        top: +(b.top + scrollY).toFixed(1),
        bottom: +(b.bottom + scrollY).toFixed(1),
        left: +b.left.toFixed(1),
        right: +b.right.toFixed(1),
      };
    };
    const h2s = [...document.querySelectorAll("h2")];
    const meet = h2s.find((e) => e.textContent.trim() === "Meet");
    const our = h2s.find((e) => /^Our\s*$/.test(e.textContent.trim()));
    const team = h2s.find((e) => /^Team\s*$/.test(e.textContent.trim()));
    const m = meet ? rectOf(meet) : null;
    const o = our ? rectOf(our) : null;
    const t = team ? rectOf(team) : null;

    return {
      heroBottom: +(hero.getBoundingClientRect().bottom + scrollY).toFixed(1),
      waveTop: +waveTop.toFixed(1),
      waveBottom: +waveBottom.toFixed(1),
      meet: m,
      our: o,
      team: t,
      gapMeetToOur: m && o ? +(o.top - m.bottom).toFixed(1) : null,
      // 1. Meet must stay ABOVE the highest ink under its own column.
      meetClearanceToInk:
        m && inkTopUnder(m.left, m.right) !== null
          ? +(inkTopUnder(m.left, m.right) - m.bottom).toFixed(1)
          : null,
      // 2. Our must start BELOW the LOWEST fill edge under its own column,
      //    i.e. the whole run sits on white. Positive = on white.
      ourOnWhiteMargin:
        o && fillTopUnder(o.left, o.right) !== null
          ? +(o.top - fillTopUnder(o.left, o.right)).toFixed(1)
          : null,
      teamBelowWave: t ? +(t.top - waveBottom).toFixed(1) : null,
    };
  });
  await ctx.close();
}
console.log(JSON.stringify(out, null, 1));
await b.close();
