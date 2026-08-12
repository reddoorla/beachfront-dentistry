import { expect, test } from "@playwright/test";

/**
 * MARKUP ROUND H4 — the two operator corrections on the wave divider, as
 * checks rather than promises (MarkUp thread 7dd0c2f2):
 *
 *   1. "sine should be only up/down on each page landing at the same height"
 *   2. "wave should never touch the text"
 *
 * Both are properties of the RENDERED divider, so neither can be guarded by a
 * unit test on the path string: correction 1 broke because the SVG was 133%
 * (169% in the footer) of an `overflow-hidden` box, which cropped the wave
 * mid-period and landed its two visible ends a full amplitude apart; and
 * correction 2 depends on where each mount's own headings sit. Both are
 * measured here, on the real routes, at the four widths the round was signed
 * off at — including 1294, which the pixel gate's 1440/834/390 matrix never
 * sees and which is where the footer arc's end delta was worst relative to the
 * text around it.
 *
 * The four routes between them mount every WaveDivider caller: Hero's
 * full-bleed and group-photo variants, SectionGrid (mirrored), SubpageHero,
 * DetailHero and Footer.
 */
const ROUTES = [
  "/dev/match/home", // Hero full-bleed + SectionGrid (mirror) + Footer
  "/dev/match/your-first-visit", // Hero group-photo + Footer
  "/dev/match/our-team", // SubpageHero + Footer
  "/team-members/dr-robert-quan", // DetailHero + Footer
];
const WIDTHS = [1440, 1294, 834, 390];

/** Distance we require between any glyph box and the wave's visible curved
 * edge. 8px is the site's smallest spacing step (Tailwind `2`) and is eight
 * times the worst antialiasing/rounding error of the stretched SVG edge, so it
 * stays a gap the eye can see at any device pixel ratio. */
const MIN_CLEARANCE = 8;

/** Ends must land level. The tolerance is 1px rather than 0 because the
 * `calc(100% + 1.3px)` hairline-seam overhang samples the curve just past
 * x=1200; the cosine phase makes that a second-order error (measured ≤0.04px
 * at every width and box height), so 1px is ~25x the real budget and still
 * catches any return of an overflow factor, whose signature is a delta of one
 * full amplitude (19-43px). */
const MAX_END_DELTA = 1;

type Mount = {
  mount: string;
  endDelta: number;
  periods: number;
  worstClearance: number;
  worstText: string;
};

const measure = () => {
  const R = (n: number) => Math.round(n * 100) / 100;
  const out: Mount[] = [];

  const texts: {
    t: string;
    left: number;
    right: number;
    top: number;
    bottom: number;
  }[] = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const s = n.nodeValue;
    if (!s || !s.trim()) continue;
    const el = n.parentElement;
    if (!el || el.closest("[aria-hidden='true']")) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || cs.display === "none") continue;
    // `checkVisibility`, not `cs.opacity`: the scroll reveal sets opacity on a
    // WRAPPER, so a text node's immediate parent reads 1 while the text is
    // invisible. Measuring it anyway meant the spec policed the boxes of
    // hidden elements at their pre-reveal offset — which is how trimming the
    // reveal travel (5d76b70) "broke" four passing cases without changing a
    // single rendered pixel.
    if (!el.checkVisibility({ opacityProperty: true })) continue;
    const range = document.createRange();
    range.selectNodeContents(n);
    for (const r of range.getClientRects()) {
      if (r.width < 1 || r.height < 1) continue;
      texts.push({
        t: s.trim().slice(0, 30),
        left: r.left,
        right: r.right,
        top: r.top + scrollY,
        bottom: r.bottom + scrollY,
      });
    }
  }

  for (const svg of document.querySelectorAll<SVGSVGElement>(
    'svg[viewBox="0 0 1200 120"]',
  )) {
    const path = svg.querySelector("path")!;
    const clip = svg.parentElement!.getBoundingClientRect();
    const m = svg.getScreenCTM()!;
    const pt = (x: number, y: number) => {
      const p = new DOMPoint(x, y).matrixTransform(m);
      return { x: p.x, y: p.y + scrollY };
    };
    // Sample the wave's own boundary — the leading run of the path, before it
    // turns back along the V0/H0 closing edges. getScreenCTM folds in the
    // stretch, the clip box's own size and the rotate-180 / -scale-x-100, so
    // this is what a reader actually sees, not what the `d` says.
    const total = path.getTotalLength();
    const pts: { x: number; y: number }[] = [];
    let lastX = -1;
    for (let i = 0; i <= 1600; i++) {
      const p = path.getPointAtLength((total * i) / 1600);
      if (p.x < lastX - 0.5) break;
      if (p.y <= 0.01 && pts.length > 4) break;
      lastX = p.x;
      const c = pt(p.x, p.y);
      if (c.x >= clip.left - 1 && c.x <= clip.right + 1) pts.push(c);
    }
    pts.sort((a, b) => a.x - b.x);
    const ys = pts.map((p) => p.y);
    const lo = Math.min(...ys);
    const hi = Math.max(...ys);
    const mid = (lo + hi) / 2;
    let crossings = 0;
    let prev: number | null = null;
    for (const p of pts) {
      const side = p.y > mid ? 1 : -1;
      if (prev !== null && side !== prev) crossings++;
      prev = side;
    }

    let worstClearance = Infinity;
    let worstText = "";
    for (const t of texts) {
      const seg = pts.filter((p) => p.x >= t.left - 1 && p.x <= t.right + 1);
      if (!seg.length) continue;
      const sy = seg.map((p) => p.y);
      const eLo = Math.min(...sy);
      const eHi = Math.max(...sy);
      let gap: number;
      if (t.bottom <= eLo) gap = eLo - t.bottom;
      else if (t.top >= eHi) gap = t.top - eHi;
      else gap = -(Math.min(t.bottom, eHi) - Math.max(t.top, eLo));
      // only text in the divider's own neighbourhood can be "touched" by it
      if (gap > clip.height * 2) continue;
      if (gap < worstClearance) {
        worstClearance = gap;
        worstText = t.t;
      }
    }

    out.push({
      mount:
        (svg.closest("footer") && "Footer") ||
        svg
          .closest("[data-section-layout]")
          ?.getAttribute("data-section-layout") ||
        (svg.closest("[data-detail-label]") && "DetailHero") ||
        "hero",
      endDelta: R(pts[pts.length - 1].y - pts[0].y),
      periods: R(crossings / 2),
      worstClearance: Number.isFinite(worstClearance) ? R(worstClearance) : 999,
      worstText,
    });
  }
  return out;
};

for (const width of WIDTHS) {
  for (const route of ROUTES) {
    test(`wave dividers land level and clear the text — ${route} @${width}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(route, { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);
      // every mount's neighbouring copy is revealed on scroll; an unrevealed
      // heading is opacity 0 and would be skipped, hiding the very collision
      // this test exists to catch
      await page.evaluate(async () => {
        const step = 600;
        for (let y = 0; y < document.body.scrollHeight; y += step) {
          // `behavior: "instant"` is load-bearing: `html` sets
          // `scroll-behavior: smooth`, so the plain `scrollTo(0, y)` this used
          // to call animated instead of jumping and never got past ~122px of an
          // 8000px page in its 30ms budget. The pass that exists to fire every
          // reveal fired almost none of them.
          scrollTo({ top: y, behavior: "instant" });
          await new Promise((r) => setTimeout(r, 30));
        }
        scrollTo({ top: 0, behavior: "instant" });
        // Wait for the reveals themselves to land rather than guessing: a
        // revealed element measured mid-transition is still displaced.
        const settled = async () => {
          for (let i = 0; i < 40; i++) {
            const running = document
              .getAnimations()
              .filter((a) => a.playState === "running");
            if (!running.length && !document.querySelector("[data-reveal]"))
              return;
            await new Promise((r) => requestAnimationFrame(() => r(null)));
          }
        };
        await settled();
      });

      const mounts = await page.evaluate(measure);
      expect(mounts.length, `${route} renders wave dividers`).toBeGreaterThan(
        0,
      );

      for (const m of mounts) {
        const where = `${route} @${width} · ${m.mount}`;
        // 1. "only up/down … landing at the same height"
        expect(Math.abs(m.endDelta), `${where}: end delta`).toBeLessThanOrEqual(
          MAX_END_DELTA,
        );
        // a whole number of periods across the RENDERED width is what makes
        // that true for any mount, at any width, rather than by luck
        expect(m.periods, `${where}: whole periods on screen`).toBe(2);
        // 2. "wave should never touch the text"
        expect(
          m.worstClearance,
          `${where}: clearance to "${m.worstText}"`,
        ).toBeGreaterThanOrEqual(MIN_CLEARANCE);
      }
    });
  }
}
