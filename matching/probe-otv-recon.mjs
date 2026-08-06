import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";

const LIVE = "https://www.beachfrontdentistry.com/our-team";
const CAND = "http://localhost:5173/dev/match/our-team";

async function settle(page) {
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < h; y += 200) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(50);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1000);
}

const recon = () => {
  const out = [];
  const walk = (el, depth) => {
    if (depth > 2) return;
    for (const c of el.children) {
      const t = c.tagName.toLowerCase();
      if (["script", "style", "noscript"].includes(t)) continue;
      const r = c.getBoundingClientRect();
      if (t === "section" || t === "main" || t === "footer" || t === "header" || depth < 1) {
        out.push({
          depth,
          tag: t,
          cls: (c.className || "").toString().slice(0, 110),
          y: Math.round(r.top + window.scrollY),
          h: Math.round(r.height),
          txt: (c.textContent || "").trim().replace(/\s+/g, " ").slice(0, 60),
        });
        walk(c, depth + 1);
      }
    }
  };
  walk(document.body, 0);
  return out;
};

const browser = await chromium.launch();
try {
  const res = {};
  for (const [name, url] of [["live", LIVE], ["cand", CAND]]) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    await page.goto(url, { waitUntil: "load", timeout: 90000 });
    await page.waitForTimeout(1500);
    await settle(page);
    res[name] = await page.evaluate(recon);
    await ctx.close();
  }
  console.log(JSON.stringify(res, null, 1));
} finally {
  await browser.close();
}
