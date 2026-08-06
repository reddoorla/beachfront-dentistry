import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";
import fs from "node:fs";

const LIVE = "https://www.beachfrontdentistry.com/our-team";
const CAND = "http://localhost:5173/dev/match/our-team";
const DIR = "/Users/tuckerlemos/Documents/GitHub/beachfront-dentistry/matching";

const browser = await chromium.launch();
try {
  for (const [name, url] of [["live", LIVE], ["cand", CAND]]) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    await page.goto(url, { waitUntil: "load", timeout: 120000 });
    await page.waitForTimeout(1500);
    const h = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < h; y += 200) { await page.evaluate((yy) => window.scrollTo(0, yy), y); await page.waitForTimeout(50); }
    await page.waitForTimeout(1200);
    const box = await page.evaluate((live) => {
      const c = document.querySelector(live ? ".team-list-item" : "article.team-list-item");
      const r = c.getBoundingClientRect();
      return { x: r.left + window.scrollX, y: r.top + window.scrollY - 110, width: r.width, height: r.height + 120 };
    }, name === "live");
    await page.screenshot({ path: `${DIR}/otv-card-${name}.png`, clip: box, fullPage: true });
    // sample the darkest pixel inside the arrow rect via canvas of a tiny crop
    const arrowBox = await page.evaluate((live) => {
      const c = document.querySelector(live ? ".team-list-item" : "article.team-list-item");
      const a = live ? c.querySelector("img.read-more-arrow") : c.querySelector("a span[aria-hidden]");
      const r = a.getBoundingClientRect();
      return { x: r.left + window.scrollX, y: r.top + window.scrollY, width: r.width, height: r.height };
    }, name === "live");
    await page.screenshot({ path: `${DIR}/otv-arrow-${name}.png`, clip: arrowBox, fullPage: true });
    console.log(name, "arrowBox", JSON.stringify(arrowBox));
    await ctx.close();
  }
} finally { await browser.close(); }
