import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";

const VW = Number(process.argv[2] || 390);
const b = await chromium.launch();
try {
  for (const [side, base] of [
    ["ref", "https://www.beachfrontdentistry.com"],
    ["cand", "http://localhost:5173"],
  ]) {
    const p = await b.newPage({
      viewport: { width: VW, height: 200 },
      deviceScaleFactor: 1,
      reducedMotion: "reduce",
    });
    await p.goto(base + "/services/dental-exams", {
      waitUntil: "networkidle",
      timeout: 60000,
    });
    await p.waitForTimeout(1500);
    await p.screenshot({ path: `matching/states/nav-${side}-${VW}.png` });
    await p.close();
  }
} finally {
  await b.close();
}
console.log("wrote matching/states/nav-{ref,cand}-" + VW + ".png");
