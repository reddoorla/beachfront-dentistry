// MarkUp round I1 — pin 7 ("still showing a line when I load the page in
// Safari"). A whole-page sweep in WebKit for any horizontal row that reads as
// a LINE: markedly darker than both neighbours AND near-uniform across x
// (content crossing a seam is dark in a few columns; a rendering hairline is
// dark all the way across). Run at load and after fractional resizes, because
// Tim's report is that resizing makes it come and go.
import {
  webkit,
  chromium,
} from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";
import { PNG } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/pngjs/lib/png.js";

const BASE = process.env.BASE || "http://localhost:5173";
const ROUTES = ["/", "/our-team"];

/** Rows that look like a drawn line rather than content. */
function scanForLines(buf) {
  const png = PNG.sync.read(buf);
  const { width, height, data } = png;
  const lum = (x, y) => {
    const i = (width * y + x) << 2;
    return 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  };
  const rowMean = new Float64Array(height);
  for (let y = 0; y < height; y++) {
    let s = 0;
    for (let x = 0; x < width; x++) s += lum(x, y);
    rowMean[y] = s / width;
  }
  const hits = [];
  for (let y = 2; y < height - 2; y++) {
    const above = rowMean[y - 2];
    const below = rowMean[y + 2];
    const dip = Math.min(above, below) - rowMean[y];
    if (dip < 3) continue; // not darker than its surroundings
    // Uniformity: what FRACTION of columns are themselves darker than their
    // own vertical neighbours by a similar amount? A hairline is ~everywhere.
    let cols = 0;
    for (let x = 0; x < width; x += 2) {
      const d = Math.min(lum(x, y - 2), lum(x, y + 2)) - lum(x, y);
      if (d > 2) cols++;
    }
    const frac = cols / Math.ceil(width / 2);
    if (frac > 0.6) {
      hits.push({ y, dip: +dip.toFixed(1), spanFrac: +frac.toFixed(2) });
    }
  }
  return { height, hits: hits.slice(0, 12) };
}

const out = {};
for (const [name, engine] of [
  ["webkit", webkit],
  ["chromium", chromium],
]) {
  const b = await engine.launch();
  out[name] = {};
  for (const route of ROUTES) {
    const ctx = await b.newContext({ viewport: { width: 1293, height: 956 } });
    const p = await ctx.newPage();
    await p.goto(`${BASE}${route}`, {
      waitUntil: "networkidle",
      timeout: 60000,
    });
    await p.evaluate(() => document.fonts.ready);
    // Sweep so every reveal has fired — an unrevealed band is opacity 0 and
    // would hide whatever the pin is about.
    await p.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 400) {
        scrollTo({ top: y, behavior: "instant" });
        await new Promise((r) => setTimeout(r, 50));
      }
      scrollTo({ top: 0, behavior: "instant" });
    });
    await p.waitForTimeout(1200);

    const atLoad = scanForLines(await p.screenshot({ fullPage: true }));

    // …and after the resizes Tim says make it come and go.
    const afterResize = [];
    for (const w of [1292, 1291.5 | 0, 1200, 1201, 1293]) {
      await p.setViewportSize({ width: w, height: 956 });
      await p.waitForTimeout(500);
      const s = scanForLines(await p.screenshot({ fullPage: true }));
      afterResize.push({
        width: w,
        lineRows: s.hits.length,
        worst: s.hits[0] ?? null,
      });
    }

    out[name][route] = {
      pageHeight: atLoad.height,
      lineRowsAtLoad: atLoad.hits.length,
      atLoad: atLoad.hits,
      afterResize,
    };
    await ctx.close();
  }
  await b.close();
}
console.log(JSON.stringify(out, null, 1));
