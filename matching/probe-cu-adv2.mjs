import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";
import fs from "node:fs";

const LIVE = "https://www.beachfrontdentistry.com/contact-us";
const CAND = "http://localhost:5173/contact-us";
const VPS = [1440, 390];

async function settle(page) {
  await page.evaluate(async () => {
    const step = 200;
    const h = document.documentElement.scrollHeight;
    for (let y = 0; y < h; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 50));
    }
    window.scrollTo(0, h);
    await new Promise((r) => setTimeout(r, 1000));
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 400));
  });
}

const out = {};
const browser = await chromium.launch();
try {
  for (const vp of VPS) {
    out[vp] = {};
    for (const [side, url] of [
      ["live", LIVE],
      ["cand", CAND],
    ]) {
      const ctx = await browser.newContext({
        viewport: { width: vp, height: 900 },
        deviceScaleFactor: 1,
      });
      const page = await ctx.newPage();
      try {
        await page.goto(url, { waitUntil: "networkidle", timeout: 90000 });
      } catch {
        await page.goto(url, { waitUntil: "load", timeout: 90000 });
      }
      await page.waitForTimeout(1500);
      await settle(page);
      out[vp][side] = await page.evaluate(() => {
        const sy = window.scrollY;
        const n = (v) => Math.round(v * 10) / 10;
        const rows = [];
        // every element that is a direct child of body or of a top-level wrapper
        const walk = (el, depth) => {
          for (const c of el.children) {
            const t = c.tagName.toLowerCase();
            if (["script", "style", "link", "noscript"].includes(t)) continue;
            const r = c.getBoundingClientRect();
            if (r.height < 4) continue;
            const cls = (
              c.className && c.className.baseVal !== undefined
                ? c.className.baseVal
                : c.className || ""
            )
              .toString()
              .slice(0, 60);
            rows.push({
              d: depth,
              t,
              cls,
              y: n(r.y + sy),
              h: n(r.height),
              x: n(r.x),
              w: n(r.width),
              txt: (c.textContent || "").replace(/\s+/g, " ").trim().slice(0, 55),
            });
            if (depth < 1) walk(c, depth + 1);
          }
        };
        walk(document.body, 0);
        // headings census
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
          text: document.body.innerText.replace(/\s+/g, " ").slice(0, 4000),
        };
      });
      await ctx.close();
    }
    console.error("done", vp);
  }
} finally {
  await browser.close();
}
fs.writeFileSync(
  "/Users/tuckerlemos/Documents/GitHub/beachfront-dentistry/matching/cu-adv2.json",
  JSON.stringify(out, null, 1),
);
console.log("ok");
