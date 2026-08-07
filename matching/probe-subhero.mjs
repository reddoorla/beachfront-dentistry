import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";

const PAGES = ["our-team", "services", "ask-the-doctor"];
const VPS = [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
];
const b = await chromium.launch();
try {
  for (const page of PAGES) {
    for (const vp of VPS) {
      const p = await b.newPage({ viewport: vp });
      await p.goto(`https://www.beachfrontdentistry.com/${page}`, {
        waitUntil: "networkidle",
        timeout: 60000,
      });
      await p.evaluate(async () => {
        window.scrollTo(0, 0);
        await new Promise((r) => setTimeout(r, 400));
      });
      const info = await p.evaluate(() => {
        const tuple = (el) => {
          const cs = getComputedStyle(el);
          return `${cs.fontFamily.split(",")[0]} ${cs.fontWeight} ${cs.fontSize}/${cs.lineHeight} ls=${cs.letterSpacing} ${cs.color} ${cs.textTransform} align=${cs.textAlign}`;
        };
        // The hero is the first full-width section under the nav.
        const h1 = document.querySelector("h1");
        const hero =
          h1?.closest("section, .hero, [class*='hero'], .subpage, header") ||
          h1?.parentElement?.parentElement;
        const hcs = hero ? getComputedStyle(hero) : null;
        const hr = hero?.getBoundingClientRect();
        // gather every text style in the hero
        const texts = hero
          ? [...hero.querySelectorAll("h1,h2,h3,h4,h5,h6,p")]
              .filter((e) =>
                [...e.childNodes].some(
                  (n) => n.nodeType === 3 && n.nodeValue.trim(),
                ),
              )
              .slice(0, 6)
              .map(
                (e) =>
                  `${e.tagName} "${e.textContent.trim().slice(0, 30)}" — ${tuple(e)}`,
              )
          : [];
        const wave = hero?.querySelector("svg, [class*='wave']") ? true : false;
        const bgImg = hcs?.backgroundImage;
        return {
          heroCls: hero?.className,
          heroHeight: hr ? Math.round(hr.height) : null,
          bg: hcs?.backgroundColor,
          bgImg: bgImg && bgImg !== "none" ? bgImg.slice(0, 80) : "none",
          hasWave: wave,
          texts,
        };
      });
      console.log(`\n=== ${page} @${vp.width} ===`);
      console.log(JSON.stringify(info, null, 2));
      await p.close();
    }
  }
} finally {
  await b.close();
}
