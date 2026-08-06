import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";

const REF = "https://www.beachfrontdentistry.com/services/dental-exams";
const CAND = "http://localhost:5173/services/dental-exams";

const b = await chromium.launch();
try {
  for (const [side, url] of [
    ["ref", REF],
    ["cand", CAND],
  ]) {
    const p = await b.newPage({ viewport: { width: 390, height: 900 } });
    await p.goto(url, { waitUntil: "networkidle", timeout: 60000 });
    const H = await p.evaluate(() => document.body.scrollHeight);
    for (let y = 0; y < H; y += 200) {
      await p.evaluate((v) => scrollTo(0, v), y);
      await p.waitForTimeout(60);
    }
    await p.waitForTimeout(1500);
    // scroll the map itself into view and shoot ONLY it
    const info = await p.evaluate(() => {
      const el =
        document.querySelector("iframe[src*='map'],iframe[src*='google']") ||
        document.querySelector(".gm-style") ||
        document.querySelector("iframe");
      if (!el) return null;
      el.scrollIntoView({ block: "center" });
      const r = el.getBoundingClientRect();
      return {
        tag: el.tagName.toLowerCase(),
        src: (el.getAttribute("src") || "(none — JS widget)").slice(0, 120),
        w: Math.round(r.width),
        h: Math.round(r.height),
      };
    });
    await p.waitForTimeout(2500);
    console.log(side, JSON.stringify(info));
    const el = await p.$("iframe[src*='map'], iframe[src*='google'], .gm-style, iframe");
    if (el) await el.screenshot({ path: `matching/states/map-inview-${side}.png` });
    await p.close();
  }
} finally {
  await b.close();
}
