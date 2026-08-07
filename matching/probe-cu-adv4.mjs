import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";

const LIVE = "https://www.beachfrontdentistry.com/contact-us";
const CAND = "http://localhost:5173/contact-us";
const DIR =
  "/Users/tuckerlemos/Documents/GitHub/beachfront-dentistry/matching/";
const browser = await chromium.launch();
try {
  for (const vp of [1440, 390]) {
    for (const [side, url] of [
      ["live", LIVE],
      ["cand", CAND],
    ]) {
      const ctx = await browser.newContext({
        viewport: { width: vp, height: 900 },
        deviceScaleFactor: 1,
      });
      const page = await ctx.newPage();
      await page.goto(url, { waitUntil: "networkidle", timeout: 90000 });
      await page.waitForTimeout(1200);
      await page.evaluate(async () => {
        const h = document.documentElement.scrollHeight;
        for (let y = 0; y < h; y += 200) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 50));
        }
        window.scrollTo(0, h);
        await new Promise((r) => setTimeout(r, 1200));
        window.scrollTo(0, 0);
        await new Promise((r) => setTimeout(r, 500));
      });
      const heroH = await page.evaluate(
        () =>
          document
            .querySelector(
              'section.hero.contact, section[data-slice-type="hero"]',
            )
            .getBoundingClientRect().height,
      );
      await page.screenshot({
        path: `${DIR}adv-${side}-${vp}-hero.png`,
        clip: { x: 0, y: 0, width: vp, height: Math.ceil(heroH) },
      });
      // info-band screenshot
      const box = await page.evaluate(() => {
        const el = document.querySelector(
          'section.info-section, section[data-section="info"]',
        );
        const r = el.getBoundingClientRect();
        return { y: r.y + window.scrollY, h: r.height };
      });
      await page.evaluate((y) => window.scrollTo(0, y - 20), box.y);
      await page.waitForTimeout(600);
      await page.screenshot({
        path: `${DIR}adv-${side}-${vp}-info.png`,
        clip: {
          x: 0,
          y: 20,
          width: vp,
          height: Math.min(880, Math.ceil(box.h)),
        },
      });
      const tip = await page.evaluate(() => {
        const hits = [];
        const w = document.createTreeWalker(
          document.body,
          NodeFilter.SHOW_TEXT,
        );
        let n;
        while ((n = w.nextNode())) {
          if (/find us here/i.test(n.nodeValue)) {
            const p = n.parentElement;
            const r = p.getBoundingClientRect();
            hits.push({
              txt: n.nodeValue.trim().slice(0, 40),
              cls: (p.className || "").toString().slice(0, 60),
              x: Math.round(r.x),
              y: Math.round(r.y + window.scrollY),
              w: Math.round(r.width),
              h: Math.round(r.height),
              vis: getComputedStyle(p).visibility,
              disp: getComputedStyle(p).display,
            });
          }
        }
        return hits;
      });
      console.log(side, vp, "findUsHere:", JSON.stringify(tip));
      await ctx.close();
    }
  }
} finally {
  await browser.close();
}
