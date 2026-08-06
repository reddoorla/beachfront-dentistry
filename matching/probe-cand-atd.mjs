import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";
const b = await chromium.launch();
try {
  for (const w of [1440, 390]) {
    const p = await b.newPage({ viewport: { width: w, height: 900 } });
    await p.goto("http://localhost:5190/dev/match/ask-the-doctor", {
      waitUntil: "networkidle",
      timeout: 60000,
    });
    await p.evaluate(async () => {
      window.scrollTo(0, 0);
      await new Promise((r) => setTimeout(r, 300));
    });
    const info = await p.evaluate(() => {
      const r = (el) =>
        el
          ? (() => {
              const b = el.getBoundingClientRect();
              return { top: Math.round(b.top), h: Math.round(b.height) };
            })()
          : null;
      const hero = document.querySelector('[data-slice-variation="subpage"]');
      const heroImg = hero?.querySelector("img");
      const nav = document.querySelector("nav, header");
      const firstCard = document.querySelector(".qa-item");
      const qlSection = document.querySelector(
        '[data-slice-type="question_list"]',
      );
      const cta = document.querySelector('[data-slice-variation="cta"]');
      return {
        nav: r(nav),
        hero: r(hero),
        heroImg: heroImg
          ? {
              natW: heroImg.naturalWidth,
              natH: heroImg.naturalHeight,
              complete: heroImg.complete,
              src: heroImg.currentSrc?.slice(0, 90),
              ...r(heroImg),
            }
          : "NO IMG",
        qlSectionTop: r(qlSection),
        firstCard: r(firstCard),
        cta: r(cta),
        bodyH: Math.round(document.body.scrollHeight),
      };
    });
    console.log(`\n== cand @${w} ==`);
    console.log(JSON.stringify(info, null, 2));
    await p.close();
  }
} finally {
  await b.close();
}
