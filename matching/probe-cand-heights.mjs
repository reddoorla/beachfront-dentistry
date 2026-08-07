import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";
const CAND = "http://localhost:5190/dev/match/your-first-visit";
const b = await chromium.launch();
try {
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto(CAND, { waitUntil: "networkidle", timeout: 60000 });
  const h = await p.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < h; y += 250) {
    await p.evaluate((y) => scrollTo(0, y), y);
    await p.waitForTimeout(70);
  }
  await p.evaluate(() => scrollTo(0, 0));
  await p.waitForTimeout(400);
  const out = await p.evaluate(() => {
    const r = (s) => {
      const e = document.querySelector(s);
      if (!e) return null;
      const b = e.getBoundingClientRect();
      return {
        w: Math.round(b.width),
        h: Math.round(b.height),
        y: Math.round(b.y + scrollY),
      };
    };
    return {
      toc: r(".fv-toc-section"),
      tocLeftFirstBtn: (() => {
        const a = document.querySelector(
          ".fv-toc-section a[href='#appointment']",
        );
        return a ? Math.round(a.getBoundingClientRect().y + scrollY) : null;
      })(),
      tourSection: r('[data-slice-variation="photos"]'),
      tourSlide0: (() => {
        const s = document.querySelector(
          '[data-slice-variation="photos"] [aria-roledescription="slide"]',
        );
        return s ? Math.round(s.getBoundingClientRect().height) : null;
      })(),
      tourDotsY: (() => {
        const d = document.querySelector(
          '[data-slice-variation="photos"] [aria-label^="Go to slide"]',
        );
        return d ? Math.round(d.getBoundingClientRect().y + scrollY) : null;
      })(),
      teamSection: r(".fv-meet-our-team-section"),
      teamH2: r(".fv-meet-our-team-section h2"),
      exam: r(".fv-exam-section"),
      examImg: (() => {
        const i = document.querySelector(".fv-exam-section img");
        return i
          ? {
              h: Math.round(i.getBoundingClientRect().height),
              w: Math.round(i.getBoundingClientRect().width),
            }
          : null;
      })(),
      examRightSteps: r(".fv-exam-section .max-w-\\[480px\\]"),
    };
  });
  console.log(JSON.stringify(out, null, 2));
} finally {
  await b.close();
}
