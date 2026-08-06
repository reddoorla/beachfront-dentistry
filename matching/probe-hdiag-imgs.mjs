import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const failed = [];
p.on("response", (r) => { if (r.status() >= 400) failed.push(r.status() + " " + r.url()); });
p.on("requestfailed", (r) => failed.push("FAIL " + r.failure()?.errorText + " " + r.url()));
try {
  await p.goto("http://localhost:5173/dev/match/home", { waitUntil: "networkidle", timeout: 90000 });
  const H = await p.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < H; y += 200) { await p.evaluate((v) => scrollTo(0, v), y); await p.waitForTimeout(60); }
  await p.waitForTimeout(2500);
  const imgs = await p.evaluate(() => [...document.querySelectorAll("img")].map(i => ({
    src: i.currentSrc || i.src, nw: i.naturalWidth, nh: i.naturalHeight, comp: i.complete,
    w: Math.round(i.getBoundingClientRect().width), h: Math.round(i.getBoundingClientRect().height),
  })));
  console.log("BROKEN:");
  for (const i of imgs.filter(i => i.comp && i.nw === 0 && i.w > 2)) console.log("  ", i.w + "x" + i.h, i.src);
  console.log("OK count:", imgs.filter(i => i.nw > 0).length, "/", imgs.length);
  console.log("NETWORK FAILURES:"); for (const f of [...new Set(failed)]) console.log("  ", f);
} finally { await b.close(); }
