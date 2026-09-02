import { expect, test } from "@playwright/test";

/**
 * The operator corrections on the wave divider, as checks rather than promises
 * (MarkUp thread 7dd0c2f2, plus one direct instruction since):
 *
 *   1. "sine should be only up/down on each page landing at the same height"
 *   2. "wave should never touch the text"
 *   3. 2026-08-13: "I want a single up and then down, coming back to neutral
 *      on both side, should be the same on any screen size" — one crest, one
 *      trough, both ends on the mid-line, at every viewport.
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
 * x=1200.
 *
 * That budget got tighter on 2026-08-13 and the number is worth writing down.
 * Under the two-period cosine both ends sat on an extremum, where dy/dx = 0,
 * so the overhang was a second-order error: ≤0.04px. The operator asked for
 * ends at NEUTRAL ("coming back to neutral on both side"), and neutral is
 * where the sine is steepest, so the same 1.3px now costs 0.181px @1440,
 * 0.202 @1294, 0.250 @834 and 0.401 @390 — computed from the path, and the
 * reason this constant is not tightened to match. 1px still leaves 2.5x
 * headroom at the worst width while catching the failure it exists for: an
 * overflow factor cropping the wave mid-period, whose signature is a delta of
 * one full amplitude (19-43px). */
const MAX_END_DELTA = 1;

/** How far the divider's OPAQUE FILL must reach past the edge it seams into.
 *
 * MarkUp round I2, Tim 2026-09-02 ("still seeing the line", Safari). The line
 * in his screenshot is rgb(182,170,145) — verbatim the terminal stop of the
 * hero's own bottom wash (Hero/index.svelte:359) — and matching his crop's
 * landmarks against our render (H1 last-line ink top → the line → the H2's
 * first blue ink: 60 → 400 → 508 device px, crop scale 1.991) puts it at CSS
 * y 1259.8 where the hero's bottom edge is 1260.0. So the seam the fill is
 * supposed to close is exactly one device row wide, and the row reads FULL
 * sand rather than a blend: the fill is absent from it entirely, which is a
 * whole-row shortfall and not edge antialiasing.
 *
 * The fill could only ever ABUT that edge. Four things land on the same line —
 * the hero's bottom, the wash's bottom, the divider box's bottom and the
 * closing `V0` edge of the path — with zero overlap between them, so any
 * engine that rasterises the rotated SVG onto a different device row than the
 * wash behind it exposes the wash. The horizontal axis has carried explicit
 * hairline insurance since round H4 (`width: calc(100% + 1.3px)`); the
 * vertical axis had none at all.
 *
 * Stated as a property rather than a pixel because it could not be reproduced
 * to a pixel: Playwright WebKit and Chromium (DPR 1 and 2, widths 1440/1293/
 * 1171, viewport heights 890-910, five scroll offsets, viewport and full-page
 * captures) and a real offscreen WKWebView at fifteen window heights all
 * render the seam clean. The defect is in Tim's on-screen compositor, which
 * none of those reach. What IS checkable in every engine is the invariant that
 * makes the raster irrelevant: overlap, not abutment. 1px is the floor — the
 * shortfall observed is one device row, i.e. 0.5 CSS px at his 2x. */
const MIN_SEAM_OVERHANG = 1;

type Mount = {
  mount: string;
  endDelta: number;
  turns: number;
  worstClearance: number;
  worstText: string;
  seamOverhang: number;
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
    // `data-wave-overlap` marks copy the operator has DELIBERATELY placed over
    // a divider, so the blanket clearance rule below does not apply to it.
    // Currently only /our-team's "Our Team" (MARKUP ROUND I1 pin #4 — the
    // Meet↔Our gap IS the divider, so closing it means overlapping it). The
    // rule that replaces clearance for those elements is not "nothing" — it is
    // the pixel assertion in the test at the bottom of this file: their glyphs
    // must land on the wave's WHITE FILL, never on the photograph. Marking the
    // element rather than special-casing a route keeps the exemption visible
    // in the markup that takes it.
    if (el.closest("[data-wave-overlap]")) continue;
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
    "svg[data-wave]",
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

    // TURNING POINTS, not mid-line crossings.
    //
    // Crossings were the right metric while the wave began and ended on a
    // crest. It is the wrong one now that both ends sit exactly ON the
    // mid-line: whether an endpoint counts as a crossing then turns on which
    // side of a strict `>` a floating-point sample lands, so the same wave
    // scores 1 period or 0.5 depending on rounding. Turning points ask the
    // question the operator actually asked — "a single up and then down" is
    // one crest and one trough — and no sample sits near the threshold.
    //
    // The deadband ignores antialiasing wobble on the stretched SVG edge while
    // staying far below a real extremum (amplitude is 19-43px in practice).
    const dead = Math.max(1, (hi - lo) * 0.15);
    let turns = 0;
    let dir = 0;
    let ext = pts[0].y;
    for (const p of pts) {
      if (dir === 0) {
        if (Math.abs(p.y - ext) > dead) {
          dir = Math.sign(p.y - ext);
          ext = p.y;
        }
        continue;
      }
      if (Math.sign(p.y - ext) === dir) {
        ext = p.y;
        continue;
      }
      if (Math.abs(p.y - ext) > dead) {
        turns++;
        dir = -dir;
        ext = p.y;
      }
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

    // How far the fill's flat closing edge reaches PAST the clip box's own
    // edge on the seam side. The flat edge is the viewBox's y-min line (the
    // path closes back along it), and getScreenCTM folds in the stretch and
    // the rotate-180 / -scale-x-100, so this is where the fill actually ends
    // on screen. Whichever clip edge it is nearer IS the seam: `flip` mounts
    // seam at the bottom, the mirrored SectionGrid mount at the top.
    const vb = svg.viewBox.baseVal;
    const flatY = (pt(vb.x, vb.y).y + pt(vb.x + vb.width, vb.y).y) / 2;
    const clipTop = clip.top + scrollY;
    const clipBottom = clip.bottom + scrollY;
    const seamOverhang = R(
      Math.abs(flatY - clipTop) < Math.abs(flatY - clipBottom)
        ? clipTop - flatY
        : flatY - clipBottom,
    );

    out.push({
      seamOverhang,
      mount:
        (svg.closest("footer") && "Footer") ||
        svg
          .closest("[data-section-layout]")
          ?.getAttribute("data-section-layout") ||
        (svg.closest("[data-detail-label]") && "DetailHero") ||
        "hero",
      endDelta: R(pts[pts.length - 1].y - pts[0].y),
      turns,
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
        // ONE period across the RENDERED width is what makes that true for any
        // mount at any width rather than by luck — and "a single up and then
        // down" is exactly one crest plus one trough. Two turns, everywhere.
        // The two-period wave this replaced scored 4 here.
        expect(m.turns, `${where}: turning points on screen`).toBe(2);
        // 2. "wave should never touch the text"
        expect(
          m.worstClearance,
          `${where}: clearance to "${m.worstText}"`,
        ).toBeGreaterThanOrEqual(MIN_CLEARANCE);
        // 3. Tim, 2026-09-02: "still seeing the line" (Safari). The fill must
        // OVERLAP the edge it seams into, never merely meet it.
        expect(
          m.seamOverhang,
          `${where}: fill overhang past the seam edge`,
        ).toBeGreaterThanOrEqual(MIN_SEAM_OVERHANG);
      }
    });
  }
}

// ---------------------------------------------------------------------------
// The rule that REPLACES clearance for `[data-wave-overlap]` copy.
//
// MARKUP ROUND I1 pin #4 (thread c5a1f351…): Tim asked for the Meet↔Our gap to
// close by 70px. That gap IS the hero divider's lg box height (120px, measured
// — the two are the same object), so the only way to close it is to put "Our
// Team" over the divider. Operator ACKed that on 2026-09-01, choosing it over
// shrinking the wave.
//
// So "never touch the text" stops being the right question for THESE elements
// and this is the right one instead: the divider's fill under them is WHITE and
// so is the page, so the headline is legible exactly as long as its GLYPHS land
// on that fill and never on the photograph above it. Clearance would score this
// mount as a failure while it looks perfect; this scores what a reader sees.
//
// Ink, not line box. A 140px face in a 168px line box carries ~20px of leading
// above the cap, so a line-box test would condemn an overlap the letters never
// make. The ascent comes from canvas metrics for the element's own resolved
// font, which is why this needs no image decoding and no new dependency.
const OVERLAP_WIDTHS = [1440, 1294, 1200, 993];

for (const width of OVERLAP_WIDTHS) {
  test(`[data-wave-overlap] copy sits on the divider's white fill — /dev/match/our-team @${width}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/dev/match/our-team", { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
    await page.waitForTimeout(900);

    const rows = await page.evaluate(() => {
      const marked = [
        ...document.querySelectorAll<HTMLElement>("[data-wave-overlap]"),
      ];
      const hero = document.querySelector("section");
      const svg = hero?.querySelector("svg");
      if (!svg || !marked.length) return [];
      const path = svg.querySelector("path")!;
      const ctm = path.getScreenCTM()!;
      const len = path.getTotalLength();
      const box = svg.getBoundingClientRect();
      const top = box.top + scrollY;
      const bottom = box.bottom + scrollY;

      const pts: { x: number; y: number }[] = [];
      for (let i = 0; i <= 1200; i++) {
        const q = path.getPointAtLength((len * i) / 1200);
        const s = new DOMPoint(q.x, q.y).matrixTransform(ctm);
        pts.push({ x: s.x, y: s.y + scrollY });
      }
      // Flipped divider: the white fill runs from the curve DOWN to the box
      // bottom. The worst (latest-starting) fill edge under a run is what the
      // glyphs must clear.
      const fillTopUnder = (x0: number, x1: number) => {
        let worst: number | null = null;
        for (let x = x0; x <= x1; x += 1) {
          const near = pts.filter(
            (q) =>
              Math.abs(q.x - x) < 2 && q.y > top + 0.5 && q.y < bottom - 0.5,
          );
          if (!near.length) continue;
          const c = Math.min(...near.map((q) => q.y));
          if (worst === null || c > worst) worst = c;
        }
        return worst;
      };

      const cv = document.createElement("canvas").getContext("2d")!;
      return marked
        .map((el) => {
          const r = document.createRange();
          r.selectNodeContents(el);
          const b = r.getBoundingClientRect();
          const lineTop = b.top + scrollY;
          const cs = getComputedStyle(el);
          cv.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
          const m = cv.measureText(el.textContent || "");
          const fa = m.fontBoundingBoxAscent;
          const fd = m.fontBoundingBoxDescent;
          const aa = m.actualBoundingBoxAscent;
          const lh = parseFloat(cs.lineHeight);
          // half-leading, then the gap from the font's ascent to the real cap
          const inkTop = lineTop + (lh - (fa + fd)) / 2 + (fa - aa);
          const fill = fillTopUnder(b.left, b.right);
          return {
            text: (el.textContent || "").trim(),
            inkTop: Math.round(inkTop * 10) / 10,
            fillTop: fill === null ? null : Math.round(fill * 10) / 10,
            margin:
              fill === null ? null : Math.round((inkTop - fill) * 10) / 10,
            belowWaveEntirely: lineTop >= bottom,
          };
        })
        .filter((r) => r.fillTop !== null || r.belowWaveEntirely);
    });

    expect(rows.length, "marked headings are present").toBeGreaterThan(0);
    for (const r of rows) {
      if (r.belowWaveEntirely) continue; // clear of the divider altogether
      // Positive margin = the glyphs start below the fill edge, i.e. on white.
      expect(
        r.margin,
        `@${width} "${r.text}": glyph ink must start below the wave's fill edge (ink ${r.inkTop}, fill ${r.fillTop})`,
      ).toBeGreaterThanOrEqual(0);
    }
  });
}
