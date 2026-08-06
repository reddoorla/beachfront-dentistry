// Chrome-only footer diff: hide the map on BOTH pages (live = .gm-style JS
// widget, ours = a cross-origin iframe that can't composite in a full-page
// capture) and pixel-diff what's left. Answers the question the region score
// can't: does the footer's own structure match, under the embed floor?
import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";
import pixelmatch from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/pixelmatch/index.js";
import { PNG } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/pngjs/lib/png.js";
import fs from "node:fs";

const PAGE = process.argv[2] || "/services/dental-exams";
const VW = Number(process.argv[3] || 390);
const REF = "https://www.beachfrontdentistry.com" + PAGE;
const CAND = "http://localhost:5173" + PAGE;

const shoot = async (b, url, side) => {
  const p = await b.newPage({
    viewport: { width: VW, height: 900 },
    reducedMotion: "reduce",
    deviceScaleFactor: 1,
  });
  await p.goto(url, { waitUntil: "networkidle", timeout: 60000 });
  const H = await p.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < H; y += 250) {
    await p.evaluate((v) => scrollTo(0, v), y);
    await p.waitForTimeout(60);
  }
  await p.waitForTimeout(1200);
  // Paint the map's box flat on both sides so the embed can't score.
  const box = await p.evaluate(() => {
    const el =
      document.querySelector("iframe[src*='map'],iframe[src*='google']") ||
      document.querySelector(".gm-style") ||
      document.querySelector("iframe");
    if (!el) return null;
    const host = el.closest("div") || el;
    host.style.visibility = "hidden";
    const all = [...document.querySelectorAll("*")];
    const h = all.find((e) =>
      [...e.childNodes].some(
        (n) => n.nodeType === 3 && /want to learn more/i.test(n.nodeValue),
      ),
    );
    const top = h ? h.getBoundingClientRect().top + scrollY : 0;
    return { top: Math.round(top) };
  });
  await p.evaluate(() => scrollTo(0, 0));
  await p.waitForTimeout(400);
  const path = `matching/states/chrome-${side}-${VW}.png`;
  await p.screenshot({ path, fullPage: true });
  await p.close();
  return { path, top: box.top };
};

const b = await chromium.launch();
try {
  const r = await shoot(b, REF, "ref");
  const c = await shoot(b, CAND, "cand");
  const A = PNG.sync.read(fs.readFileSync(r.path));
  const B = PNG.sync.read(fs.readFileSync(c.path));
  const w = Math.min(A.width, B.width);
  const h = Math.min(A.height - r.top, B.height - c.top);
  const crop = (src, top) => {
    const out = new PNG({ width: w, height: h });
    for (let y = 0; y < h; y++)
      src.data.copy(
        out.data,
        y * w * 4,
        ((y + top) * src.width + 0) * 4,
        ((y + top) * src.width + w) * 4,
      );
    return out;
  };
  const a = crop(A, r.top);
  const bb = crop(B, c.top);
  const diff = new PNG({ width: w, height: h });
  const n = pixelmatch(a.data, bb.data, diff.data, w, h, { threshold: 0.1 });
  fs.writeFileSync(`matching/states/chrome-diff-${VW}.png`, PNG.sync.write(diff));
  console.log(
    `footer chrome (map hidden both sides) @${VW}  ${PAGE}\n` +
      `  region ${w}x${h}  ref-top=${r.top} cand-top=${c.top}\n` +
      `  mismatch = ${((n / (w * h)) * 100).toFixed(2)}%  (${n} px)`,
  );
} finally {
  await b.close();
}
