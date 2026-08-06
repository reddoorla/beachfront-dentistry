import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";

const LIVE = "https://www.beachfrontdentistry.com/";
const CAND = "http://localhost:5173/dev/match/home";

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

const widths = [390, 479, 480, 650, 767, 768, 769, 834, 900, 991, 992, 993, 1200, 1440];

const browser = await chromium.launch();
try {
  const out = {};
  for (const [name, url] of [
    ["live", LIVE],
    ["cand", CAND],
  ]) {
    out[name] = {};
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(url, { waitUntil: "networkidle", timeout: 90000 });
    for (const w of widths) {
      await page.setViewportSize({ width: w, height: 900 });
      await page.waitForTimeout(400);
      await settle(page);
      const r = await page.evaluate(() => ({
        root: getComputedStyle(document.documentElement).fontSize,
        h: document.body.scrollHeight,
        de: document.documentElement.scrollHeight,
        clientW: document.body.clientWidth,
      }));
      out[name][w] = r;
    }
    await ctx.close();
  }
  console.log("width | live root | cand root | live h | cand h | dh | clientW L/C");
  for (const w of widths) {
    const l = out.live[w],
      c = out.cand[w];
    console.log(
      `${w} | ${l.root} | ${c.root} | ${l.de} | ${c.de} | ${c.de - l.de} (${(((c.de - l.de) / l.de) * 100).toFixed(1)}%) | ${l.clientW}/${c.clientW}`
    );
  }
} finally {
  await browser.close();
}
