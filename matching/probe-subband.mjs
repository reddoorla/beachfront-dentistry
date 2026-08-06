import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";

const PAGES = ["our-team", "services", "ask-the-doctor"];
const VPS = [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
];
const b = await chromium.launch();
try {
  for (const pg of PAGES) {
    for (const vp of VPS) {
      const p = await b.newPage({ viewport: vp });
      await p.goto(`https://www.beachfrontdentistry.com/${pg}`, {
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
          return `${cs.fontFamily.split(",")[0]} ${cs.fontWeight} ${cs.fontSize}/${cs.lineHeight} ${cs.color}`;
        };
        const r = (el) => {
          const b = el.getBoundingClientRect();
          return { h: Math.round(b.height), top: Math.round(b.top) };
        };
        const head = document.querySelector(
          ".subpage-hero-heading, .meet-heading",
        );
        if (!head) return { none: true };
        // walk up to the band section (first ancestor >= 300px tall spanning full width)
        let band = head;
        for (let i = 0; i < 6 && band.parentElement; i++) {
          band = band.parentElement;
          const b = band.getBoundingClientRect();
          if (b.width >= window.innerWidth - 2 && b.height >= 300) break;
        }
        const bcs = getComputedStyle(band);
        // all big heading lines in the band
        const lines = [...band.querySelectorAll("h1,h2,h3,p")]
          .filter((e) =>
            [...e.childNodes].some(
              (n) => n.nodeType === 3 && n.nodeValue.trim(),
            ),
          )
          .map(
            (e) =>
              `${e.tagName}.${e.className.slice(0, 24)} "${e.textContent.trim().slice(0, 24)}" ${tuple(e)}`,
          );
        return {
          bandCls: band.className.slice(0, 50),
          bandRect: r(band),
          bandBg: bcs.backgroundColor,
          bandBgImg: bcs.backgroundImage.slice(0, 60),
          hasBgImgEl: !!band.querySelector("img"),
          imgSrc:
            band.querySelector("img")?.getAttribute("src")?.slice(0, 70) ||
            null,
          hasWave: !!band.querySelector("svg, [class*='wave']"),
          lines,
        };
      });
      console.log(`\n== ${pg} @${vp.width} ==`);
      console.log(JSON.stringify(info));
      await p.close();
    }
  }
} finally {
  await b.close();
}
