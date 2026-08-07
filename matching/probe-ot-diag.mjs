import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";
import fs from "node:fs";

const LIVE = "https://www.beachfrontdentistry.com/our-team";
const CAND = "http://localhost:5173/dev/match/our-team";
const VPS = [1440, 834, 390];

async function settle(page) {
  const h = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < h; y += 200) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(50);
  }
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1000);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
}

const census = () => {
  const out = {
    pageH: document.documentElement.scrollHeight,
    bodyClientW: document.body.clientWidth,
    sections: [],
  };
  const root = document.querySelector("main") || document.body;
  // top-level sections: direct children of body/main that are section-like
  const walk = (el, depth) => {
    for (const c of el.children) {
      const r = c.getBoundingClientRect();
      const sy = r.top + window.scrollY;
      if (r.height < 4) continue;
      out.sections.push({
        depth,
        tag: c.tagName.toLowerCase(),
        cls: (c.className && typeof c.className === "string"
          ? c.className
          : ""
        ).slice(0, 110),
        id: c.id || "",
        y: Math.round(sy),
        h: Math.round(r.height),
        x: Math.round(r.left),
        w: Math.round(r.width),
        text: (c.innerText || "").replace(/\s+/g, " ").slice(0, 70),
      });
      if (depth < 1) walk(c, depth + 1);
    }
  };
  walk(document.body, 0);
  return out;
};

const browser = await chromium.launch();
try {
  const res = {};
  for (const [name, url] of [
    ["live", LIVE],
    ["cand", CAND],
  ]) {
    res[name] = {};
    for (const vw of VPS) {
      const ctx = await browser.newContext({
        viewport: { width: vw, height: 900 },
        deviceScaleFactor: 1,
      });
      const page = await ctx.newPage();
      await page
        .goto(url, { waitUntil: "networkidle", timeout: 90000 })
        .catch(() => {});
      await page.waitForTimeout(600);
      await settle(page);
      res[name][vw] = await page.evaluate(census);
      await ctx.close();
    }
  }
  fs.writeFileSync(
    "matching/ot-diag-census.json",
    JSON.stringify(res, null, 1),
  );
  for (const vw of VPS) {
    console.log(
      `\n===== ${vw} =====  live pageH=${res.live[vw].pageH} bodyW=${res.live[vw].bodyClientW}   cand pageH=${res.cand[vw].pageH} bodyW=${res.cand[vw].bodyClientW}`,
    );
    for (const side of ["live", "cand"]) {
      console.log(`--- ${side}`);
      for (const s of res[side][vw].sections) {
        if (s.depth > 0) continue;
        console.log(
          `  y=${String(s.y).padStart(5)} h=${String(s.h).padStart(5)} x=${String(s.x).padStart(4)} w=${String(s.w).padStart(4)} ${s.tag}.${s.cls} | ${s.text}`,
        );
      }
    }
  }
} finally {
  await browser.close();
}
