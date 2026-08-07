import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";
const browser = await chromium.launch();
try {
  for (const [name, url] of [
    ["live", "https://www.beachfrontdentistry.com/ask-the-doctor"],
    ["cand", "http://localhost:5173/dev/match/ask-the-doctor"],
  ]) {
    const ctx = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    const page = await ctx.newPage();
    await page
      .goto(url, { waitUntil: "networkidle", timeout: 90000 })
      .catch(() => {});
    await page.waitForTimeout(1500);
    const r = await page.evaluate(() => {
      const hits = [...document.querySelectorAll("*")].filter(
        (e) =>
          e.children.length === 0 && /read reviews/i.test(e.textContent || ""),
      );
      return {
        count: hits.length,
        tags: hits.map(
          (e) =>
            e.tagName +
            ":" +
            e.className.toString().slice(0, 40) +
            " y=" +
            Math.round(e.getBoundingClientRect().y + scrollY),
        ),
      };
    });
    console.log(name, JSON.stringify(r));
    await ctx.close();
  }
} finally {
  await browser.close();
}
