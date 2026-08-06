import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";

const LIVE = "https://www.beachfrontdentistry.com/services";
const CAND = "http://localhost:5173/dev/match/services";

const run = async () => {
  const browser = await chromium.launch();
  const out = {};
  try {
    for (const [name, url] of [
      ["live", LIVE],
      ["cand", CAND],
    ]) {
      const ctx = await browser.newContext({
        viewport: { width: 1440, height: 900 },
      });
      const page = await ctx.newPage();
      await page
        .goto(url, { waitUntil: "networkidle", timeout: 90000 })
        .catch(() => {});
      await page.waitForTimeout(1200);
      await page.evaluate(async () => {
        for (let y = 0; y < document.documentElement.scrollHeight; y += 200) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 40));
        }
        window.scrollTo(0, 0);
        await new Promise((r) => setTimeout(r, 500));
      });
      await page.waitForTimeout(800);
      const link = page.locator(".service-block a").first();
      const before = await link.evaluate((el) => {
        const cs = getComputedStyle(el);
        const inner = el.firstElementChild
          ? getComputedStyle(el.firstElementChild)
          : null;
        return {
          opacity: cs.opacity,
          textDecorationLine: cs.textDecorationLine,
          innerDecoration: inner ? inner.textDecorationLine : null,
          transition: cs.transition,
        };
      });
      await link.hover();
      await page.waitForTimeout(700);
      const after = await link.evaluate((el) => {
        const cs = getComputedStyle(el);
        const inner = el.firstElementChild
          ? getComputedStyle(el.firstElementChild)
          : null;
        return {
          opacity: cs.opacity,
          textDecorationLine: cs.textDecorationLine,
          innerDecoration: inner ? inner.textDecorationLine : null,
        };
      });
      out[name] = { before, after };
      await ctx.close();
    }
  } finally {
    await browser.close();
  }
  console.log(JSON.stringify(out, null, 1));
};
run();
