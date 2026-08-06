import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";
import fs from "node:fs";

const VPS = [1440, 834, 390];
const TARGETS = {
  live: "https://www.beachfrontdentistry.com/contact-us",
  cand: "http://localhost:5173/contact-us",
};

async function settle(page) {
  await page.evaluate(async () => {
    const step = 200;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 50));
    }
    window.scrollTo(0, document.body.scrollHeight);
    await new Promise((r) => setTimeout(r, 1000));
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 300));
  });
}

const census = () => {
  const out = [];
  const root = document.body;
  const walk = (el, depth) => {
    for (const c of el.children) {
      const tag = c.tagName.toLowerCase();
      if (["script", "style", "noscript", "link", "meta"].includes(tag))
        continue;
      const r = c.getBoundingClientRect();
      const sy = window.scrollY;
      const cs = getComputedStyle(c);
      if (cs.display === "none") continue;
      if (cs.display === "contents" || (r.height === 0 && c.children.length)) {
        walk(c, depth);
        continue;
      }
      if (r.height === 0) continue;
      out.push({
        depth,
        tag,
        cls: (c.className || "").toString().slice(0, 90),
        id: c.id || "",
        x: Math.round(r.x),
        y: Math.round(r.y + sy),
        w: Math.round(r.width),
        h: Math.round(r.height),
        txt: (c.innerText || "").replace(/\s+/g, " ").trim().slice(0, 70),
      });
      if (depth < 2) walk(c, depth + 1);
    }
  };
  walk(root, 0);
  return {
    scrollHeight: document.documentElement.scrollHeight,
    bodyScrollHeight: document.body.scrollHeight,
    clientWidth: document.body.clientWidth,
    rootFont: getComputedStyle(document.documentElement).fontSize,
    rows: out,
  };
};

const result = {};
const browser = await chromium.launch();
try {
  for (const [name, url] of Object.entries(TARGETS)) {
    result[name] = {};
    for (const vp of VPS) {
      const ctx = await browser.newContext({
        viewport: { width: vp, height: 900 },
        deviceScaleFactor: 1,
      });
      const page = await ctx.newPage();
      await page
        .goto(url, { waitUntil: "networkidle", timeout: 60000 })
        .catch(() => {});
      await page.waitForTimeout(1500);
      await settle(page);
      result[name][vp] = await page.evaluate(census);
      await ctx.close();
    }
  }
} finally {
  await browser.close();
}
fs.writeFileSync(
  "/Users/tuckerlemos/Documents/GitHub/beachfront-dentistry/matching/cu-diag.json",
  JSON.stringify(result, null, 1),
);
for (const vp of VPS) {
  console.log(
    `vp=${vp} live sh=${result.live[vp].scrollHeight} cw=${result.live[vp].clientWidth} root=${result.live[vp].rootFont} | cand sh=${result.cand[vp].scrollHeight} cw=${result.cand[vp].clientWidth} root=${result.cand[vp].rootFont}`,
  );
}
