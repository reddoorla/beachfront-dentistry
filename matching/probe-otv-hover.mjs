import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";

const LIVE = "https://www.beachfrontdentistry.com/our-team";
const CAND = "http://localhost:5173/dev/match/our-team";

const browser = await chromium.launch();
const out = {};
try {
  for (const [name, url] of [["live", LIVE], ["cand", CAND]]) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    await page.goto(url, { waitUntil: "load", timeout: 120000 });
    await page.waitForTimeout(1500);
    const h = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < h; y += 200) { await page.evaluate((yy) => window.scrollTo(0, yy), y); await page.waitForTimeout(50); }
    await page.evaluate(() => window.scrollTo(0, 900));
    await page.waitForTimeout(1200);

    const live = name === "live";
    const sel = live
      ? { card: ".team-list-item", head: "img.team-grid-headshot", name: "h5" }
      : { card: "article.team-list-item", head: "img[class*='rounded-full']", name: "h5" };

    const read = async () =>
      page.evaluate((s) => {
        const c = document.querySelector(s.card);
        const img = c.querySelector(s.head);
        const nm = c.querySelector(s.name);
        const g = (e) => (e ? { op: getComputedStyle(e).opacity, opParent: getComputedStyle(e.parentElement).opacity, tr: getComputedStyle(e.parentElement).transition, col: getComputedStyle(e).color } : null);
        return { img: g(img), name: g(nm) };
      }, sel);

    out[name] = { rest: await read() };
    // hover the headshot
    const headBox = await page.evaluate((s) => {
      const c = document.querySelector(s.card);
      const img = c.querySelector(s.head);
      const r = img.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    }, sel);
    await page.mouse.move(headBox.x, headBox.y);
    await page.waitForTimeout(600);
    out[name].hoverHead = await read();
    // hover the name
    const nameBox = await page.evaluate((s) => {
      const c = document.querySelector(s.card);
      const n = c.querySelector(s.name);
      const r = n.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    }, sel);
    await page.mouse.move(nameBox.x, nameBox.y);
    await page.waitForTimeout(600);
    out[name].hoverName = await read();
    await ctx.close();
  }
} finally { await browser.close(); }
console.log(JSON.stringify(out, null, 1));
