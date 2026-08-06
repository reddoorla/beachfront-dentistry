import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";
async function settle(page) {
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 200) {
      scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 40));
    }
    scrollTo(0, document.body.scrollHeight);
    await new Promise((r) => setTimeout(r, 1000));
    scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 300));
  });
}
const b = await chromium.launch();
try {
  for (const vp of [1440, 834, 390]) {
    const o = {};
    for (const [n, u] of [
      ["live", "https://www.beachfrontdentistry.com/ask-the-doctor"],
      ["cand", "http://localhost:5173/dev/match/ask-the-doctor"],
    ]) {
      const ctx = await b.newContext({ viewport: { width: vp, height: 900 } });
      const p = await ctx.newPage();
      await p
        .goto(u, { waitUntil: "networkidle", timeout: 90000 })
        .catch(() => {});
      await p.waitForTimeout(900);
      await settle(p);
      o[n] = await p.evaluate(() => {
        const R = (e) => {
          if (!e) return null;
          const r = e.getBoundingClientRect();
          return {
            x: +r.x.toFixed(1),
            y: +(r.y + scrollY).toFixed(1),
            w: +r.width.toFixed(1),
            h: +r.height.toFixed(1),
          };
        };
        const h2 = [...document.querySelectorAll("h2")].find((e) =>
          /ready for/i.test(e.textContent || ""),
        );
        const qs =
          document.querySelector("section.questions-section") ||
          document.querySelector("[data-slice-type='question_list']");
        const wave =
          document.querySelector("section.hero .bot-wave svg") ||
          document.querySelector("[data-slice-type='hero'] svg");
        return {
          readyH2: R(h2),
          readyMT: h2 ? getComputedStyle(h2).marginTop : null,
          qs: R(qs),
          wave: R(wave),
          pageH: document.body.scrollHeight,
        };
      });
      await ctx.close();
    }
    console.log(vp, "LIVE", JSON.stringify(o.live));
    console.log(vp, "CAND", JSON.stringify(o.cand));
  }
} finally {
  await b.close();
}
