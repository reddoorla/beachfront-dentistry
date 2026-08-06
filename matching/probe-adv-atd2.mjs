import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";
import { writeFileSync } from "node:fs";

const LIVE = "https://www.beachfrontdentistry.com/ask-the-doctor";
const CAND = "http://localhost:5173/dev/match/ask-the-doctor";

async function grab(page, isLive) {
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 200) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 45));
    }
    window.scrollTo(0, document.body.scrollHeight);
    await new Promise((r) => setTimeout(r, 1200));
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 300));
  });
  return await page.evaluate((isLive) => {
    const norm = (s) => s.replace(/\s+/g, " ").trim();
    const cardSel = isLive ? ".qa-block" : ".qa-item > div";
    const cards = [...document.querySelectorAll(cardSel)].map((c) => {
      const num = c.querySelector(isLive ? ".qa-circle" : "button span");
      const title = c.querySelector(isLive ? ".qa-question" : "h3");
      const p = c.querySelector(isLive ? ".qa-answer p" : "p");
      const a = c.querySelector(
        isLive ? ".qa-answer a" : 'a[href^="/questions/"]',
      );
      return {
        n: num ? norm(num.textContent) : null,
        t: title ? norm(title.textContent) : null,
        teaser: p ? norm(p.textContent) : null,
        href: a ? a.getAttribute("href") : null,
      };
    });
    // top-level section census
    const root = document.querySelector("body");
    const secs = [...root.querySelectorAll("body > * , main > *")]
      .filter((e) => e.getBoundingClientRect().height > 4)
      .map((e) => {
        const r = e.getBoundingClientRect();
        return {
          tag: e.tagName.toLowerCase(),
          cls: (e.className || "").toString().slice(0, 70),
          y: +(r.y + window.scrollY).toFixed(0),
          h: +r.height.toFixed(0),
          txt: norm(e.textContent).slice(0, 60),
        };
      });
    return { cards, secs, pageH: document.documentElement.scrollHeight };
  }, isLive);
}

const browser = await chromium.launch();
const out = {};
try {
  for (const [side, url, isLive] of [
    ["live", LIVE, true],
    ["cand", CAND, false],
  ]) {
    const ctx = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1,
    });
    const page = await ctx.newPage();
    await page.goto(url, { waitUntil: "networkidle", timeout: 90000 });
    await page.waitForTimeout(1200);
    out[side] = await grab(page, isLive);
    await ctx.close();
  }
} finally {
  await browser.close();
}
writeFileSync(
  "/Users/tuckerlemos/Documents/GitHub/beachfront-dentistry/matching/adv-atd2.json",
  JSON.stringify(out, null, 1),
);
const L = out.live.cards,
  C = out.cand.cards;
console.log("card counts", L.length, C.length);
let nDiff = 0,
  tDiff = 0,
  hDiff = 0,
  teDiff = 0;
for (let i = 0; i < Math.max(L.length, C.length); i++) {
  const l = L[i] || {},
    c = C[i] || {};
  if (l.n !== c.n) {
    nDiff++;
    console.log(`NUM ${i}: L=${l.n} C=${c.n}`);
  }
  if (l.t !== c.t) {
    tDiff++;
    console.log(`TITLE ${i}: L="${l.t}" C="${c.t}"`);
  }
  if (l.href !== c.href) {
    hDiff++;
    console.log(`HREF ${i}: L=${l.href} C=${c.href}`);
  }
  if (l.teaser !== c.teaser) teDiff++;
}
console.log(
  `diffs: num=${nDiff} title=${tDiff} href=${hDiff} teaser=${teDiff} of ${L.length}`,
);
console.log("\n--- teaser samples ---");
for (const i of [4, 9, 12, 27, 38]) {
  console.log(`#${i + 1} L: ${(L[i] || {}).teaser}`);
  console.log(`#${i + 1} C: ${(C[i] || {}).teaser}`);
}
console.log("\n=== LIVE SECTIONS ===");
for (const s of out.live.secs)
  console.log(`${s.y}\t${s.h}\t${s.tag}.${s.cls}\t${s.txt}`);
console.log("\n=== CAND SECTIONS ===");
for (const s of out.cand.secs)
  console.log(`${s.y}\t${s.h}\t${s.tag}.${s.cls}\t${s.txt}`);
