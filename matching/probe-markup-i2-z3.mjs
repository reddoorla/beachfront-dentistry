// Sweep: at every 120px of scroll through the ATD section, raise-z test BOTH
// halves of the pair (headshot right of the column, handwriting left of it).
// Reports the scroll positions where either is painted over, and by what.
import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";
import { PNG } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/pngjs/lib/png.js";

const BASE = process.env.BASE || "http://localhost:5173";
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();
await p.goto(`${BASE}/`, { waitUntil: "networkidle", timeout: 60000 });
await p.evaluate(() => document.fonts.ready);

const span = await p.evaluate(() => {
  const cards = [...document.querySelectorAll(".qa-item")];
  const f = cards[0].getBoundingClientRect(),
    l = cards[cards.length - 1].getBoundingClientRect();
  return {
    start: Math.max(0, f.top + scrollY - 700),
    end: l.bottom + scrollY - 200,
    n: cards.length,
  };
});

const SEL = {
  headshot: ".ask-the-doctor-headshot",
  handwriting: "img[src*='ask-the-doctor']",
};
const hits = [];
for (let y = span.start; y <= span.end; y += 120) {
  await p.evaluate((yy) => scrollTo({ top: yy, behavior: "instant" }), y);
  await p.waitForTimeout(400);
  for (const [name, sel] of Object.entries(SEL)) {
    const rect = await p.evaluate((s) => {
      const e = document.querySelector(s);
      if (!e) return null;
      const r = e.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight || r.width < 2) return null;
      return {
        x: Math.max(0, Math.round(r.left)),
        y: Math.max(0, Math.round(r.top)),
        width: Math.min(
          Math.round(r.width),
          1440 - Math.max(0, Math.round(r.left)),
        ),
        height: Math.min(
          Math.round(r.height),
          900 - Math.max(0, Math.round(r.top)),
        ),
      };
    }, sel);
    if (!rect || rect.width < 2 || rect.height < 2) continue;

    const before = await p.screenshot({ clip: rect });
    // What sits on top? Ask the document at the rect's centre, ignoring the
    // pair itself (it is pointer-events:none, so this returns whatever paints
    // there for hit-testing purposes — a good name for the culprit).
    const over = await p.evaluate(
      ({ r }) => {
        const el = document.elementFromPoint(
          r.x + r.width / 2,
          r.y + r.height / 2,
        );
        if (!el) return null;
        return (
          el.tagName.toLowerCase() +
          (typeof el.className === "string" && el.className
            ? "." + el.className.trim().split(/\s+/).slice(0, 3).join(".")
            : "")
        );
      },
      { r: rect },
    );

    await p.evaluate((s) => {
      const e = document.querySelector(s);
      const w = e.closest("[class*='pointer-events-none']") || e;
      w.dataset.zsave = w.style.zIndex;
      w.style.zIndex = "99999";
    }, sel);
    await p.waitForTimeout(120);
    const after = await p.screenshot({ clip: rect });
    await p.evaluate((s) => {
      const e = document.querySelector(s);
      const w = e.closest("[class*='pointer-events-none']") || e;
      w.style.zIndex = w.dataset.zsave || "";
    }, sel);

    const A = PNG.sync.read(before),
      B = PNG.sync.read(after);
    let changed = 0;
    for (let i = 0; i < A.data.length; i += 4)
      if (
        Math.abs(A.data[i] - B.data[i]) > 6 ||
        Math.abs(A.data[i + 1] - B.data[i + 1]) > 6 ||
        Math.abs(A.data[i + 2] - B.data[i + 2]) > 6
      )
        changed++;
    const pct = +((changed / (A.width * A.height)) * 100).toFixed(1);
    if (pct > 1)
      hits.push({
        scrollY: y,
        which: name,
        pctOccluded: pct,
        paintedOverBy: over,
        rect,
      });
  }
}
await ctx.close();
await b.close();
console.log(
  JSON.stringify({ span, sweptEvery: 120, occlusions: hits }, null, 1),
);
