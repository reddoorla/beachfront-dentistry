import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";
const VW = Number(process.argv[2] ?? 834);
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
  for (const [name, url, sel] of [
    ["live", "https://www.beachfrontdentistry.com/", ".home-services-section"],
    [
      "ours",
      "http://localhost:5173/dev/match/home",
      '[data-section-layout="services"]',
    ],
  ]) {
    const p = await b.newPage({ viewport: { width: VW, height: 900 } });
    await p.goto(url, { waitUntil: "networkidle", timeout: 60000 });
    await settle(p);
    const r = await p.evaluate((sel) => {
      const root = document.querySelector(sel);
      if (!root) return "MISSING " + sel;
      const bx = (el) => {
        const b = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        return `${Math.round(b.width)}x${Math.round(b.height)} y=${Math.round(b.y + scrollY)} m=${cs.marginTop}/${cs.marginBottom} p=${cs.paddingTop}/${cs.paddingBottom} fs=${cs.fontSize}/${cs.lineHeight}`;
      };
      const rows = [`ROOT ${bx(root)}`];
      const walk = (el, d) => {
        if (d > 5) return;
        for (const c of el.children) {
          const r = c.getBoundingClientRect();
          if (r.height < 1) continue;
          rows.push(
            `${"  ".repeat(d)}${c.tagName.toLowerCase()}.${String(c.className).split(" ").slice(0, 2).join(".").slice(0, 40)} ${bx(c)} "${(c.textContent || "").replace(/\s+/g, " ").trim().slice(0, 32)}"`,
          );
          walk(c, d + 1);
        }
      };
      walk(root, 1);
      return rows.join("\n  ");
    }, sel);
    console.log(`===== ${name} @${VW}\n  ${r}`);
    await p.close();
  }
} finally {
  await b.close();
}
