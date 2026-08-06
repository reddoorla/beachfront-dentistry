import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";
const OUT =
  "/Users/tuckerlemos/Documents/GitHub/beachfront-dentistry/matching/";
const browser = await chromium.launch();
try {
  for (const [side, url] of [
    ["live", "https://www.beachfrontdentistry.com/contact-us"],
    ["cand", "http://localhost:5173/contact-us"],
  ]) {
    for (const vp of [1440, 390]) {
      const ctx = await browser.newContext({
        viewport: { width: vp, height: 900 },
        deviceScaleFactor: 1,
      });
      const page = await ctx.newPage();
      await page
        .goto(url, { waitUntil: "networkidle", timeout: 60000 })
        .catch(() => {});
      await page.waitForTimeout(1500);
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 200) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 50));
        }
        window.scrollTo(0, document.body.scrollHeight);
        await new Promise((r) => setTimeout(r, 1200));
        window.scrollTo(0, 0);
        await new Promise((r) => setTimeout(r, 600));
      });
      const heroH = await page.evaluate(
        () =>
          (
            document.querySelector("section.hero.contact") ||
            document.querySelector('section[data-slice-type="hero"]')
          ).getBoundingClientRect().height,
      );
      await page.screenshot({
        path: `${OUT}cu2-${side}-${vp}-hero.png`,
        fullPage: true,
        clip: { x: 0, y: 0, width: vp, height: Math.round(heroH) },
      });
      await page.screenshot({
        path: `${OUT}cu2-${side}-${vp}-info.png`,
        fullPage: true,
        clip: {
          x: 0,
          y: Math.round(heroH),
          width: vp,
          height: vp === 1440 ? 900 : 950,
        },
      });
      console.log(side, vp, "heroH", heroH);
      await ctx.close();
    }
  }
} finally {
  await browser.close();
}
