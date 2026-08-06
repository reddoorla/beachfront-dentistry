import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";

const LIVE = "https://www.beachfrontdentistry.com/services";
const CAND = "http://localhost:5173/dev/match/services";
const VPS = [1440, 834, 390];

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
  const root = document.querySelector("main") || document.body;
  const walk = (el, depth) => {
    for (const c of el.children) {
      const r = c.getBoundingClientRect();
      const sy = window.scrollY;
      if (r.height < 4) { if (depth < 3) walk(c, depth + 1); continue; }
      const cs = getComputedStyle(c);
      const txt = (c.innerText || "").trim().replace(/\s+/g, " ").slice(0, 70);
      out.push({
        d: depth,
        tag: c.tagName.toLowerCase(),
        cls: (c.className && typeof c.className === "string" ? c.className : "").slice(0, 90),
        y: Math.round(r.top + sy),
        h: Math.round(r.height),
        w: Math.round(r.width),
        x: Math.round(r.left),
        bg: cs.backgroundColor,
        txt,
      });
      if (depth < 2) walk(c, depth + 1);
    }
  };
  walk(root, 0);
  return out;
};

const run = async () => {
  const b = await chromium.launch();
  try {
    for (const vp of VPS) {
      for (const [name, url] of [["LIVE", LIVE], ["CAND", CAND]]) {
        const ctx = await b.newContext({ viewport: { width: vp, height: 900 }, deviceScaleFactor: 1 });
        const page = await ctx.newPage();
        await page.goto(url, { waitUntil: "networkidle", timeout: 90000 }).catch(() => {});
        await page.waitForTimeout(1500);
        await settle(page);
        const info = await page.evaluate(() => ({
          sh: document.documentElement.scrollHeight,
          bodyW: document.body.clientWidth,
          rootFs: getComputedStyle(document.documentElement).fontSize,
        }));
        const rows = await page.evaluate(census);
        console.log(`\n===== ${name} @${vp} scrollHeight=${info.sh} bodyW=${info.bodyW} rootFontSize=${info.rootFs} =====`);
        for (const r of rows) {
          console.log(`${" ".repeat(r.d * 2)}[${r.d}] ${r.tag}.${r.cls} y=${r.y} h=${r.h} x=${r.x} w=${r.w} bg=${r.bg} :: ${r.txt}`);
        }
        await ctx.close();
      }
    }
  } finally {
    await b.close();
  }
};
run();
