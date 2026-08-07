import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";

const PATH = process.argv[2] || "/team-members/dr-robert-quan";
const VW = Number(process.argv[3] || 390);

const b = await chromium.launch();
try {
  for (const [side, base] of [
    ["ref", "https://www.beachfrontdentistry.com"],
    ["cand", "http://localhost:5173"],
  ]) {
    const p = await b.newPage({ viewport: { width: VW, height: 900 } });
    await p.goto(base + PATH, { waitUntil: "networkidle", timeout: 60000 });
    await p.waitForTimeout(1500);
    const rows = await p.evaluate(() => {
      const out = [];
      // every visible element in the top 700px that is an img/svg/canvas or a
      // rounded box — the hero's chrome
      for (const el of document.querySelectorAll(
        "img,svg,a,button,div,section",
      )) {
        const r = el.getBoundingClientRect();
        if (r.top + scrollY > 700 || r.width < 12 || r.height < 12) continue;
        const cs = getComputedStyle(el);
        const rounded =
          /9999|50%/.test(cs.borderRadius) || cs.borderRadius.startsWith("9");
        const isMedia = /^(IMG|SVG|CANVAS)$/.test(el.tagName);
        if (!rounded && !isMedia) continue;
        if (r.width > 380 && r.height > 250) continue; // the hero photo itself
        out.push(
          `${el.tagName.toLowerCase().padEnd(4)} x=${Math.round(r.left)} y=${Math.round(r.top + scrollY)} ` +
            `${Math.round(r.width)}x${Math.round(r.height)} br=${cs.borderRadius} ` +
            `cls="${(el.getAttribute("class") || "").slice(0, 46)}" ` +
            `src="${(el.getAttribute("src") || "").split("/").pop()?.slice(0, 34) || ""}"`,
        );
      }
      return out;
    });
    console.log(`\n===== ${side} @${VW}`);
    for (const r of rows) console.log("  " + r);
    await p.close();
  }
} finally {
  await b.close();
}
