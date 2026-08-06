import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";
const b = await chromium.launch();
const settle = async (p) => {
  await p.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 250) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 80));
    }
    window.scrollTo(0, 0);
    for (let i = 0; i < 60; i++) {
      await new Promise((r) => setTimeout(r, 100));
      if (document.getAnimations().every((a) => a.playState !== "running"))
        break;
    }
    await new Promise((r) => setTimeout(r, 400));
  });
};
try {
  for (const vw of [1440, 834, 390]) {
    const p = await b.newPage({ viewport: { width: vw, height: 900 } });
    await p.goto("https://www.beachfrontdentistry.com/your-first-visit", {
      waitUntil: "networkidle",
      timeout: 60000,
    });
    await settle(p);
    const r = await p.evaluate(() => {
      const sec = document.querySelector(".fv-meet-our-team-section");
      const bx = (el) => {
        if (!el) return "—";
        const b = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        return `${Math.round(b.width)}x${Math.round(b.height)} x=${Math.round(b.x)} y=${Math.round(b.y + scrollY)} m=${cs.margin} p=${cs.padding}`;
      };
      const h = sec.querySelector("h1,h2,h3");
      const cards = [...sec.querySelectorAll(".team-list-item")];
      const holder = cards[0]?.parentElement;
      return [
        `section ${bx(sec)}`,
        `heading ${bx(h)} fs=${h ? getComputedStyle(h).fontSize + "/" + getComputedStyle(h).lineHeight : "-"}`,
        `holder ${bx(holder)} ov=${holder ? getComputedStyle(holder).overflow : "-"} disp=${holder ? getComputedStyle(holder).display : "-"}`,
        ...cards
          .slice(0, 3)
          .map(
            (c, i) =>
              `card${i} ${bx(c)} cls=${String(c.className).slice(0, 60)}`,
          ),
      ].join("\n  ");
    });
    console.log(`== live @${vw}\n  ${r}`);
    await p.close();
  }
} finally {
  await b.close();
}
