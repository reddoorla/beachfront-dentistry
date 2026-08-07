import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";
const URL = "https://www.beachfrontdentistry.com/our-team";
async function settle(page) {
  await page.evaluate(async () => {
    await new Promise((r) => {
      let y = 0;
      const s = () => {
        scrollTo(0, y);
        y += 250;
        if (y < document.body.scrollHeight) setTimeout(s, 40);
        else {
          scrollTo(0, 0);
          setTimeout(r, 300);
        }
      };
      s();
    });
  });
  await page.waitForTimeout(500);
}
const b = await chromium.launch();
try {
  const out = {};
  for (const width of [1440, 390]) {
    const p = await b.newPage({ viewport: { width, height: 900 } });
    await p.goto(URL, { waitUntil: "networkidle", timeout: 60000 });
    await settle(p);
    out[width] = await p.evaluate(() => {
      const Y = (el) =>
        el ? Math.round(el.getBoundingClientRect().y + scrollY) : null;
      const H = (el) =>
        el ? Math.round(el.getBoundingClientRect().height) : null;
      const sub = document.querySelector(".our-team-subtitle-section");
      const subHeads = sub
        ? [...sub.querySelectorAll("h1,h2,h3,h4,h5,h6,p")].map((e) => ({
            t: e.tagName.toLowerCase(),
            txt: (e.innerText || "").trim().slice(0, 20),
            y: Y(e),
            h: H(e),
            mt: getComputedStyle(e).marginTop,
            mb: getComputedStyle(e).marginBottom,
            fs: getComputedStyle(e).fontSize,
            lh: getComputedStyle(e).lineHeight,
          }))
        : null;
      const gridSec = document.querySelector(".team-grid-section");
      const wrow =
        document.querySelector(".w-dyn-items.w-row") ||
        document.querySelector('[class*="w-row"]');
      const cards = [...document.querySelectorAll(".team-list-item")];
      const cardData = cards.map((c) => {
        const hs = c.querySelector(".team-grid-headshot");
        return {
          y: Y(c),
          h: H(c),
          x: Math.round(c.getBoundingClientRect().x),
          hsY: Y(hs),
          hsH: H(hs),
          mt: getComputedStyle(c).marginTop,
          mb: getComputedStyle(c).marginBottom,
          ml: getComputedStyle(c).marginLeft,
        };
      });
      return {
        subtitle: sub
          ? {
              y: Y(sub),
              h: H(sub),
              padT: getComputedStyle(sub).paddingTop,
              padB: getComputedStyle(sub).paddingBottom,
            }
          : null,
        subHeads,
        gridSec: gridSec
          ? {
              y: Y(gridSec),
              h: H(gridSec),
              padT: getComputedStyle(gridSec).paddingTop,
              padB: getComputedStyle(gridSec).paddingBottom,
            }
          : null,
        wrow: wrow
          ? { y: Y(wrow), h: H(wrow), padT: getComputedStyle(wrow).paddingTop }
          : null,
        cardYs: cardData,
      };
    });
    await p.close();
  }
  console.log(JSON.stringify(out, null, 1));
} finally {
  await b.close();
}
