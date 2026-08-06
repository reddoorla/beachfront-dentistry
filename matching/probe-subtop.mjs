import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";

const PAGES = ["our-team", "ask-the-doctor", "services"];
const b = await chromium.launch();
try {
  for (const pg of PAGES) {
    const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
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
        return `${cs.fontFamily.split(",")[0]} ${cs.fontWeight} ${cs.fontSize}/${cs.lineHeight} ls=${cs.letterSpacing} ${cs.color} ${cs.textTransform} align=${cs.textAlign}`;
      };
      const r = (el) => {
        const b = el.getBoundingClientRect();
        return {
          x: Math.round(b.x),
          y: Math.round(b.y),
          w: Math.round(b.width),
          h: Math.round(b.height),
        };
      };
      // top-level content sections (children of the main content wrapper),
      // skipping the fixed nav.
      const body = document.body;
      // find first big block after nav
      const all = [...document.querySelectorAll("body *")].filter((el) => {
        const b = el.getBoundingClientRect();
        return (
          b.top < 700 &&
          b.top >= 0 &&
          b.width > 600 &&
          b.height > 80 &&
          !el.closest("nav")
        );
      });
      // the first heading-ish text in the top 700px
      const firstText = [...document.querySelectorAll("h1,h2,h3,h4,p,div")]
        .filter((el) => {
          const b = el.getBoundingClientRect();
          const hasOwnText = [...el.childNodes].some(
            (n) => n.nodeType === 3 && n.nodeValue.trim(),
          );
          return b.top < 600 && b.top >= 40 && hasOwnText && b.width > 100;
        })
        .slice(0, 8)
        .map(
          (el) =>
            `${el.tagName}.${el.className.slice(0, 30)} @y${Math.round(el.getBoundingClientRect().top)} "${el.textContent.trim().slice(0, 35)}" — ${tuple(el)}`,
        );
      // the top hero section box: the outermost section whose top<=0-ish
      const heroSection = document.querySelector(
        "body main > *, body > div > section, section",
      );
      return {
        firstText,
        heroSectionCls: heroSection?.className,
        heroSectionRect: heroSection ? r(heroSection) : null,
        heroBg: heroSection
          ? getComputedStyle(heroSection).backgroundColor
          : null,
        heroBgImg: heroSection
          ? getComputedStyle(heroSection).backgroundImage.slice(0, 70)
          : null,
      };
    });
    console.log(`\n===== ${pg} =====`);
    console.log(JSON.stringify(info, null, 2));
    await p.close();
  }
} finally {
  await b.close();
}
