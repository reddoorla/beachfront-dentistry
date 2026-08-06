import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";

const LIVE = "https://www.beachfrontdentistry.com/our-team";
const CAND = "http://localhost:5173/dev/match/our-team";
const VPS = [650, 992, 768];

async function settle(page) {
  const h = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < h; y += 400) { await page.evaluate((yy) => window.scrollTo(0, yy), y); await page.waitForTimeout(30); }
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(900);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(250);
}

const probe = () => {
  const isLive = location.hostname.includes("beachfront");
  const R = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top + window.scrollY), Math.round(r.width), Math.round(r.height)]; };
  const card = document.querySelector(".team-list-item");
  const cards = [...document.querySelectorAll(".team-list-item")];
  const h2 = isLive ? document.querySelector(".our-team-subtitle-section h2") : document.querySelectorAll('[data-slice-variation="subpage"] ~ section h2, section h2')[1];
  const sub = isLive ? document.querySelector(".our-team-subtitle-section") : null;
  const hh = isLive ? document.querySelector(".meet-heading") : document.querySelector('[data-slice-variation="subpage"] h2');
  const cs = (e) => e ? (() => { const s = getComputedStyle(e); return s.fontSize + "/" + s.lineHeight + " " + s.textAlign; })() : null;
  const hs = isLive ? document.querySelector(".team-grid-headshot") : (card && card.querySelector("img"));
  return {
    root: getComputedStyle(document.documentElement).fontSize,
    pageH: document.documentElement.scrollHeight,
    card: R(card), cardM: card ? getComputedStyle(card).margin + " pt=" + getComputedStyle(card).paddingTop : null,
    cardXs: cards.slice(0, 4).map((c) => Math.round(c.getBoundingClientRect().left)),
    headshot: R(hs),
    heroHeading: R(hh), heroHeadingCs: cs(hh),
    subH2: R(h2), subH2cs: cs(h2),
    subSection: sub ? R(sub) : null,
  };
};

const browser = await chromium.launch();
try {
  for (const vw of VPS) {
    const line = {};
    for (const [name, url] of [["live", LIVE], ["cand", CAND]]) {
      const ctx = await browser.newContext({ viewport: { width: vw, height: 900 }, deviceScaleFactor: 1 });
      const page = await ctx.newPage();
      await page.goto(url, { waitUntil: "networkidle", timeout: 90000 }).catch(() => {});
      await page.waitForTimeout(500);
      await settle(page);
      line[name] = await page.evaluate(probe);
      await ctx.close();
    }
    console.log(`\n=== ${vw}`);
    console.log("  live", JSON.stringify(line.live));
    console.log("  cand", JSON.stringify(line.cand));
  }
} finally { await browser.close(); }
