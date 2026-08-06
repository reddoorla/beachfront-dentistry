import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";
const b = await chromium.launch();
const settle = async (p) => {
  await p.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 250) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 700));
  });
};
try {
  for (const vw of [1440, 834, 390]) {
    const p = await b.newPage({ viewport: { width: vw, height: 900 } });
    await p.goto("http://localhost:5173/dev/match/home", {
      waitUntil: "networkidle",
      timeout: 60000,
    });
    await settle(p);
    const r = await p.evaluate(() => {
      const bx = (el) => {
        if (!el) return "MISSING";
        const b = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        return `${Math.round(b.width)}x${Math.round(b.height)} x=${Math.round(b.x)} y=${Math.round(b.y + scrollY)} op=${cs.opacity}`;
      };
      const h = [...document.querySelectorAll("h1,h2,h3")].find((e) =>
        /^Finally have a dentist/.test(
          e.textContent.replace(/\s+/g, " ").trim(),
        ),
      );
      const out = [`heading ${bx(h)}`];
      const labels = ["Comfort", "Comprehensive", "Caring"];
      labels.forEach((L) => {
        const sp = [...document.querySelectorAll("span")].find(
          (e) => e.textContent.trim() === L,
        );
        let card = sp;
        for (let i = 0; i < 8 && card.parentElement; i++) {
          card = card.parentElement;
          const cs = getComputedStyle(card);
          if (
            card.getBoundingClientRect().width > 200 &&
            parseFloat(cs.borderTopLeftRadius) > 10
          )
            break;
        }
        const bar = sp.closest("button,div[class*='bottom-0']");
        const txt = card.querySelector("[id*='card-']");
        out.push(
          `${L} card ${bx(card)} | bar ${bx(bar)} h=${bar ? Math.round(bar.getBoundingClientRect().height) : "-"} | text ${bx(txt)} | labelFs ${getComputedStyle(sp).fontSize}/${getComputedStyle(sp).lineHeight}`,
        );
      });
      return out.join("\n  ");
    });
    console.log(`== ours @${vw}\n  ${r}`);
    await p.close();
  }
} finally {
  await b.close();
}
