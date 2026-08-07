import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";
const VW = Number(process.argv[2] ?? 834);
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
const b = await chromium.launch();
try {
  for (const [name, url, sel] of [
    ["live", "https://www.beachfrontdentistry.com/services", ".service-block"],
    ["ours", "http://localhost:5173/dev/match/services", ".service-block"],
  ]) {
    const p = await b.newPage({ viewport: { width: VW, height: 900 } });
    await p.goto(url, { waitUntil: "networkidle", timeout: 60000 });
    await settle(p);
    const r = await p.evaluate((sel) => {
      const bx = (el) => {
        if (!el) return "—";
        const b = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        return `${Math.round(b.width)}x${Math.round(b.height)} x=${Math.round(b.x)} y=${Math.round(b.y + scrollY)} m=${cs.margin} p=${cs.padding} r=${cs.borderRadius}`;
      };
      const cards = [...document.querySelectorAll(sel)];
      const grid = cards[0]?.parentElement;
      const out = [
        `grid ${bx(grid)} disp=${grid ? getComputedStyle(grid).display : "-"} cols=${grid ? getComputedStyle(grid).gridTemplateColumns : "-"} gap=${grid ? getComputedStyle(grid).gap : "-"}`,
      ];
      cards.slice(0, 3).forEach((c, i) => {
        const h = c.querySelector("h1,h2,h3,h4,h5");
        const p0 = c.querySelector("p");
        const panel = [...c.querySelectorAll("div")].find((d) =>
          d.querySelector("a[href*='/services/']"),
        );
        const link = c.querySelector("a[href*='/services/']");
        const icon = c.querySelector("img");
        out.push(`card${i} ${bx(c)}`);
        out.push(
          `   head ${bx(h)} fs=${h ? getComputedStyle(h).fontSize + "/" + getComputedStyle(h).lineHeight : "-"}`,
        );
        out.push(
          `   intro ${bx(p0)} fs=${p0 ? getComputedStyle(p0).fontSize + "/" + getComputedStyle(p0).lineHeight : "-"}`,
        );
        out.push(`   panel ${bx(panel)}`);
        out.push(
          `   link ${bx(link)} fs=${link ? getComputedStyle(link).fontSize + "/" + getComputedStyle(link).lineHeight : "-"}`,
        );
        out.push(`   icon ${bx(icon)}`);
      });
      return out.join("\n  ");
    }, sel);
    console.log(`===== ${name} @${VW}\n  ${r}`);
    await p.close();
  }
} finally {
  await b.close();
}
