import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";
const CAND = "http://localhost:5173/dev/match/our-team";
const browser = await chromium.launch();
try {
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();
  await page.goto(CAND, { waitUntil: "load", timeout: 90000 });
  await page.waitForTimeout(1200);
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < h; y += 200) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(50);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1000);
  const out = await page.evaluate(() => {
    const rows = [];
    document.querySelectorAll("section, footer, header, main").forEach((c) => {
      const r = c.getBoundingClientRect();
      rows.push({
        tag: c.tagName.toLowerCase(),
        cls: (c.className || "").toString().slice(0, 140),
        y: Math.round(r.top + window.scrollY),
        h: Math.round(r.height),
        txt: (c.textContent || "").trim().replace(/\s+/g, " ").slice(0, 60),
      });
    });
    return {
      rows,
      scrollH: document.documentElement.scrollHeight,
      bodyW: document.body.clientWidth,
    };
  });
  console.log(JSON.stringify(out, null, 1));
  // first card markup
  const cardHtml = await page.evaluate(() => {
    const a = document.querySelector("article.team-list-item");
    return a ? a.outerHTML.slice(0, 3000) : "NO CARD";
  });
  console.log("=== CARD ===\n" + cardHtml);
} finally {
  await browser.close();
}
