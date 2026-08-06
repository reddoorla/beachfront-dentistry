import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";

const OUT = "/Users/tuckerlemos/Documents/GitHub/beachfront-dentistry/matching/cards";
const VW = Number(process.argv[2] || 1440);
const targets = [
  ["cand", "http://localhost:5190/", "figure"],
  ["ref", "https://www.beachfrontdentistry.com/", ".big-review"],
];
for (const [tag, url, sel] of targets) {
  const b = await chromium.launch();
  try {
    const p = await b.newPage({ viewport: { width: VW, height: 1000 }, deviceScaleFactor: 2 });
    await p.goto(url, { waitUntil: "networkidle", timeout: 60000 });
    const h0 = await p.evaluate(() => document.body.scrollHeight);
    for (let y = 0; y < h0; y += 250) { await p.evaluate((yy) => window.scrollTo(0, yy), y); await p.waitForTimeout(90); }
    await p.waitForTimeout(300);
    const box = await p.evaluate(({ sel, VW }) => {
      const cands = [...document.querySelectorAll(sel)].filter((e) => (e.textContent || "").includes("favorite dentistry team"));
      // pick the on-screen slide (not a Slider clone parked off-canvas)
      let c = cands.find((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.left >= -5 && r.left < VW; }) || cands[0];
      if (!c) return null;
      c.scrollIntoView({ block: "center" });
      const r = c.getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height };
    }, { sel, VW });
    if (!box) { console.log(`MISS ${tag}`); continue; }
    const pad = 40;
    await p.screenshot({ path: `${OUT}/${tag}-${VW}-reviewcard.png`, clip: { x: Math.max(0, box.x - pad), y: Math.max(0, box.y - pad), width: Math.min(VW, box.w + pad * 2), height: box.h + pad * 2 } });
    console.log(`OK ${tag}-${VW}-reviewcard.png`);
  } finally { await b.close(); }
}
