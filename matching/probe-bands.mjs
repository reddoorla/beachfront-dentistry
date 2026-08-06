import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";

const URL = process.argv[2] || "http://localhost:5190/";
const VW = Number(process.argv[3] || 834);
const TAG = process.argv[4] || "cand";
const OUT =
  "/Users/tuckerlemos/Documents/GitHub/beachfront-dentistry/matching/cards";
const BAND = 1180;

const b = await chromium.launch();
try {
  const p = await b.newPage({
    viewport: { width: VW, height: BAND },
    deviceScaleFactor: 2,
  });
  await p.goto(URL, { waitUntil: "networkidle", timeout: 60000 });
  // settle scroll to fire reveals + lazy load
  const h0 = await p.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < h0; y += 250) {
    await p.evaluate((yy) => window.scrollTo(0, yy), y);
    await p.waitForTimeout(120);
  }
  await p.evaluate(() => window.scrollTo(0, 0));
  await p.waitForTimeout(400);
  const h = await p.evaluate(() => document.body.scrollHeight);
  const n = Math.ceil(h / BAND);
  for (let i = 0; i < n; i++) {
    await p.evaluate((yy) => window.scrollTo(0, yy), i * BAND);
    await p.waitForTimeout(250);
    await p.screenshot({ path: `${OUT}/${TAG}-${VW}-band${i}.png` });
  }
  console.log(`captured ${n} bands (${TAG} @${VW}, pageH=${h})`);
} finally {
  await b.close();
}
