// MarkUp round I1, part 5 — the pins that need WebKit or exact wave geometry.
//
//  pin 7  the seam line Tim sees in Safari on load, and on resize. Scans the
//         real composited pixels for a row that is darker than the white
//         section it sits in, in WebKit AND Chromium, at load and after
//         several fractional resizes.
//  pin 2  re-verified in the engine that actually paints the focus ring.
//  pin 4  where the wave's ink really is UNDER the "Meet" and "Our" columns,
//         which is what decides whether Tim's ±30/40px is even available.
import {
  webkit,
  chromium,
} from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";
import { PNG } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/pngjs/lib/png.js";

const BASE = process.env.BASE || "http://localhost:5173";
const out = {};

/** Mean luminance per pixel row of a PNG buffer. */
function rowStats(buf) {
  const png = PNG.sync.read(buf);
  const rows = [];
  for (let y = 0; y < png.height; y++) {
    let sum = 0;
    let min = 255;
    for (let x = 0; x < png.width; x++) {
      const i = (png.width * y + x) << 2;
      const l =
        0.299 * png.data[i] + 0.587 * png.data[i + 1] + 0.114 * png.data[i + 2];
      sum += l;
      if (l < min) min = l;
    }
    rows.push({ y, mean: +(sum / png.width).toFixed(2), min: +min.toFixed(1) });
  }
  return rows;
}

/** A "line" = a row markedly darker than BOTH its neighbours inside a band
 *  that should be flat. Returns the worst such row. */
function findLine(rows) {
  let worst = null;
  for (let i = 1; i < rows.length - 1; i++) {
    const dip = Math.min(rows[i - 1].mean, rows[i + 1].mean) - rows[i].mean;
    if (!worst || dip > worst.dip) {
      worst = { y: rows[i].y, dip: +dip.toFixed(2), mean: rows[i].mean };
    }
  }
  return worst;
}

for (const [name, engine] of [
  ["webkit", webkit],
  ["chromium", chromium],
]) {
  const b = await engine.launch();
  const res = { seam: [] };

  // --- pin 7 ---------------------------------------------------------------
  for (const width of [1440, 1327, 1293, 1201, 1101, 993, 834]) {
    const ctx = await b.newContext({ viewport: { width, height: 900 } });
    const p = await ctx.newPage();
    await p.goto(`${BASE}/`, { waitUntil: "networkidle", timeout: 60000 });
    await p.evaluate(() => document.fonts.ready);
    await p.waitForTimeout(400);

    const geo = await p.evaluate(() => {
      const hero = document.querySelector("section");
      const r = hero.getBoundingClientRect();
      return { heroBottom: r.bottom, heroHeight: r.height };
    });
    // A 14px band straddling the hero's bottom edge: wave-white above, section
    // -white below. Anything but flat white in here is the artifact.
    const top = Math.max(0, Math.round(geo.heroBottom) - 6);
    const shot = await p.screenshot({
      clip: { x: 0, y: top, width, height: 14 },
    });
    const line = findLine(rowStats(shot));
    res.seam.push({
      width,
      heroHeight: +geo.heroHeight.toFixed(2),
      heroBottom: +geo.heroBottom.toFixed(2),
      fractional: Math.abs(geo.heroBottom - Math.round(geo.heroBottom)) > 0.01,
      worstRowDip: line.dip,
      worstRowMean: line.mean,
    });
    await ctx.close();
  }

  // --- pin 2 in the engine that paints the ring ----------------------------
  {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
    const p = await ctx.newPage();
    await p.goto(`${BASE}/`, { waitUntil: "networkidle", timeout: 60000 });
    await p.locator('button[aria-label="Open menu"]').first().click();
    await p.waitForTimeout(700);
    res.menuFocus = await p.evaluate(() => {
      const dlg = document.getElementById("nav-menu");
      const logo = dlg?.querySelector('a[href="/"]');
      const a = document.activeElement;
      return {
        activeTag: a?.tagName,
        activeIsDialog: a === dlg,
        activeIsLogo: a === logo,
        logoFocusVisible: logo ? logo.matches(":focus-visible") : null,
        logoShadow: logo ? getComputedStyle(logo).boxShadow : null,
        logoOutline: logo ? getComputedStyle(logo).outlineStyle : null,
      };
    });
    await ctx.close();
  }

  out[name] = res;
  await b.close();
}

// --- pin 4: the wave's ink under each text column ---------------------------
{
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  await p.goto(`${BASE}/our-team`, {
    waitUntil: "networkidle",
    timeout: 60000,
  });
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(600);

  out.pin4 = await p.evaluate(() => {
    const doc = (r) => ({
      top: +(r.top + scrollY).toFixed(1),
      bottom: +(r.bottom + scrollY).toFixed(1),
      left: +r.left.toFixed(1),
      right: +r.right.toFixed(1),
    });
    const hero = document.querySelector("section");
    const svg = hero.querySelector("svg");
    const path = svg.querySelector("path");
    const ctm = path.getScreenCTM();
    const len = path.getTotalLength();
    // Sample the painted curve densely in document space.
    const pts = [];
    for (let i = 0; i <= 400; i++) {
      const q = path.getPointAtLength((len * i) / 400);
      const s = new DOMPoint(q.x, q.y).matrixTransform(ctm);
      pts.push({ x: s.x, y: s.y + scrollY });
    }
    // Topmost ink at a given x (the highest painted point near that column).
    const inkAt = (x0, x1) => {
      const inBand = pts.filter((q) => q.x >= x0 && q.x <= x1);
      return inBand.length
        ? +Math.min(...inBand.map((q) => q.y)).toFixed(1)
        : null;
    };
    const meet = [...document.querySelectorAll("h2")].find(
      (e) => e.textContent.trim() === "Meet",
    );
    const our = [...document.querySelectorAll("h2")].find((e) =>
      /^Our\s*$/.test(e.textContent.trim()),
    );
    // Real glyph extents, not the line box: a Range around the text node.
    const inkBox = (el) => {
      const r = document.createRange();
      r.selectNodeContents(el);
      return doc(r.getBoundingClientRect());
    };
    const mi = inkBox(meet);
    const oi = inkBox(our);
    return {
      heroBottom: +(hero.getBoundingClientRect().bottom + scrollY).toFixed(1),
      waveBox: doc(svg.getBoundingClientRect()),
      meetLineBox: doc(meet.getBoundingClientRect()),
      meetInk: mi,
      ourLineBox: doc(our.getBoundingClientRect()),
      ourInk: oi,
      inkUnderMeet: inkAt(mi.left, mi.right),
      inkUnderOur: inkAt(oi.left, oi.right),
      clearanceMeetToWave: +(inkAt(mi.left, mi.right) - mi.bottom).toFixed(1),
      gapMeetInkToOurInk: +(oi.top - mi.bottom).toFixed(1),
    };
  });
  await b.close();
}

console.log(JSON.stringify(out, null, 1));
