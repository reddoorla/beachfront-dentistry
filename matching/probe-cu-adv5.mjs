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
      (await page.addStyleTag) === undefined;
      await page.goto(url, { waitUntil: "networkidle", timeout: 90000 });
      await page.addStyleTag({
        content: "html,body,*{scroll-behavior:auto !important}",
      });
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
        await new Promise((r) => setTimeout(r, 800));
        window.scrollTo(0, 0);
        await new Promise((r) => setTimeout(r, 300));
      });
      const info = await page.evaluate(() => {
        const hero = document.querySelector(
          'section.hero.contact, section[data-slice-type="hero"]',
        );
        // hero background element geometry + natural size
        const img = hero.querySelector("img");
        const cs = getComputedStyle(hero);
        let bg = {
          via: "css",
          image: cs.backgroundImage.slice(0, 120),
          size: cs.backgroundSize,
          pos: cs.backgroundPosition,
        };
        if (img) {
          const r = img.getBoundingClientRect();
          bg = {
            via: "img",
            src: img.currentSrc.slice(-90),
            natW: img.naturalWidth,
            natH: img.naturalHeight,
            rect: [
              Math.round(r.x),
              Math.round(r.y + window.scrollY),
              Math.round(r.width),
              Math.round(r.height),
            ],
            objectFit: getComputedStyle(img).objectFit,
            objectPos: getComputedStyle(img).objectPosition,
          };
        }
        return {
          scrollY: window.scrollY,
          heroH: hero.getBoundingClientRect().height,
          bg,
        };
      });
      console.log(side, vp, JSON.stringify(info));
      await page.screenshot({
        path: `${DIR}adv2-${side}-${vp}-hero.png`,
        clip: { x: 0, y: 0, width: vp, height: Math.ceil(info.heroH) },
      });
      await ctx.close();
    }
  }
} finally {
  await browser.close();
}
