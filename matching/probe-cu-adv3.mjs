import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";
import fs from "node:fs";

const CAND = "http://localhost:5173/contact-us";
const VPS = [1440, 390];
const out = {};
const browser = await chromium.launch();
try {
  for (const vp of VPS) {
    const ctx = await browser.newContext({
      viewport: { width: vp, height: 900 },
      deviceScaleFactor: 1,
    });
    const page = await ctx.newPage();
    await page.goto(CAND, { waitUntil: "networkidle", timeout: 90000 });
    await page.waitForTimeout(1000);
    await page.evaluate(async () => {
      const h = document.documentElement.scrollHeight;
      for (let y = 0; y < h; y += 200) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 50));
      }
      window.scrollTo(0, h);
      await new Promise((r) => setTimeout(r, 1000));
      window.scrollTo(0, 0);
      await new Promise((r) => setTimeout(r, 400));
    });
    out[vp] = await page.evaluate(() => {
      const sy = window.scrollY;
      const n = (v) => Math.round(v * 10) / 10;
      const rows = [];
      const walk = (el, depth) => {
        for (const c of el.children) {
          const t = c.tagName.toLowerCase();
          if (["script", "style", "link", "noscript"].includes(t)) continue;
          const cs = getComputedStyle(c);
          const r = c.getBoundingClientRect();
          if (cs.display === "contents" || (r.height < 4 && depth < 2)) {
            walk(c, depth);
            continue;
          }
          const cls = (c.className || "").toString().slice(0, 55);
          rows.push({
            d: depth,
            t,
            cls,
            y: n(r.y + sy),
            h: n(r.height),
            x: n(r.x),
            w: n(r.width),
            txt: (c.textContent || "").replace(/\s+/g, " ").trim().slice(0, 50),
          });
          if (depth < 1) walk(c, depth + 1);
        }
      };
      walk(document.body, 0);
      const heads = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")]
        .filter((h) => h.getBoundingClientRect().height > 0)
        .map((h) => ({
          t: h.tagName,
          y: n(h.getBoundingClientRect().y + sy),
          txt: (h.textContent || "").replace(/\s+/g, " ").trim().slice(0, 50),
        }));
      return {
        rows,
        heads,
        scrollHeight: document.documentElement.scrollHeight,
      };
    });
    await ctx.close();
    console.error("done", vp);
  }
} finally {
  await browser.close();
}
fs.writeFileSync(
  "/Users/tuckerlemos/Documents/GitHub/beachfront-dentistry/matching/cu-adv3.json",
  JSON.stringify(out, null, 1),
);
console.log("ok");
