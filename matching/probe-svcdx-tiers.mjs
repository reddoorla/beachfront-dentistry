import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";
const LIVE = "https://www.beachfrontdentistry.com/services";
const CAND = "http://localhost:5173/dev/match/services";
const run = async () => {
  const b = await chromium.launch();
  try {
    for (const vp of [1280, 992, 991, 768, 767, 600, 480, 479]) {
      const out = [];
      for (const [name, url, isLive] of [
        ["LIVE", LIVE, true],
        ["CAND", CAND, false],
      ]) {
        const ctx = await b.newContext({
          viewport: { width: vp, height: 900 },
        });
        const page = await ctx.newPage();
        await page
          .goto(url, { waitUntil: "domcontentloaded", timeout: 60000 })
          .catch(() => {});
        await page.waitForTimeout(900);
        const d = await page.evaluate((isLive) => {
          const root = getComputedStyle(document.documentElement).fontSize;
          const card = document.querySelector(
            isLive ? ".service-block" : "article.service-block",
          );
          const cr = card ? card.getBoundingClientRect() : null;
          const wave = document.querySelector(
            isLive ? ".bot-wave svg" : "section svg[data-wave]",
          );
          const h2 = document.querySelector(
            isLive ? ".subpage-hero-heading" : "main section h2",
          );
          return {
            root,
            card: cr
              ? `${Math.round(cr.width)}x${Math.round(cr.height)}@x${Math.round(cr.left)}`
              : "-",
            wave: wave ? Math.round(wave.getBoundingClientRect().height) : "-",
            h2: h2
              ? getComputedStyle(h2).fontSize +
                "/" +
                getComputedStyle(h2).lineHeight
              : "-",
            sh: document.documentElement.scrollHeight,
          };
        }, isLive);
        out.push(
          `${name} root=${d.root} card=${d.card} wave=${d.wave} h2=${d.h2} sh=${d.sh}`,
        );
        await ctx.close();
      }
      console.log(`@${vp}\n  ${out.join("\n  ")}`);
    }
  } finally {
    await b.close();
  }
};
run();
