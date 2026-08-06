import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";

const b = await chromium.launch();
try {
  for (const vw of [1440, 834, 390]) {
    for (const [side, url, sel] of [
      ["ref ", "https://www.beachfrontdentistry.com/ask-the-doctor", ".qa-block"],
      ["cand", "http://localhost:5173/dev/match/ask-the-doctor", "[class*=qa],article"],
    ]) {
      const p = await b.newPage({ viewport: { width: vw, height: 900 } });
      await p.goto(url, { waitUntil: "networkidle", timeout: 60000 });
      await p.evaluate(() => scrollTo(0, 600));
      await p.waitForTimeout(1200);
      const out = await p.evaluate((sel) => {
        const card = document.querySelector(sel);
        if (!card) return "no card";
        const rows = [];
        const r0 = card.getBoundingClientRect();
        rows.push(`card ${Math.round(r0.width)}x${Math.round(r0.height)} bg=${getComputedStyle(card).backgroundColor}`);
        for (const el of card.querySelectorAll("*")) {
          const cs = getComputedStyle(el);
          if (cs.backgroundImage === "none" || !/gradient/.test(cs.backgroundImage)) continue;
          const r = el.getBoundingClientRect();
          rows.push(
            `  grad op=${cs.opacity} ${Math.round(r.width)}x${Math.round(r.height)} :: ${cs.backgroundImage.slice(0, 150)}`,
          );
        }
        return rows.join("\n");
      }, sel);
      console.log(`--- ${side} @${vw}\n${out}`);
      await p.close();
    }
  }
} finally {
  await b.close();
}
