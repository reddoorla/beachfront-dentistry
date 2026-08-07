import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";

// Section census for a live page: every heading-ish run top-to-bottom with its
// y, so anchor lists can be built one-per-section (and checked for uniqueness
// and document order on BOTH pages).
const PAGES = process.argv[2]
  ? [process.argv[2]]
  : [
      "/",
      "/your-first-visit",
      "/our-team",
      "/services",
      "/ask-the-doctor",
      "/contact-us",
    ];
const VW = Number(process.argv[3] || 1440);

const b = await chromium.launch();
try {
  for (const path of PAGES) {
    const p = await b.newPage({ viewport: { width: VW, height: 900 } });
    await p.goto("https://www.beachfrontdentistry.com" + path, {
      waitUntil: "networkidle",
      timeout: 60000,
    });
    const H = await p.evaluate(() => document.body.scrollHeight);
    for (let y = 0; y < H; y += 250) {
      await p.evaluate((v) => scrollTo(0, v), y);
      await p.waitForTimeout(45);
    }
    await p.evaluate(() => scrollTo(0, 0));
    await p.waitForTimeout(900);
    const rows = await p.evaluate(() => {
      const out = [];
      const seen = new Set();
      for (const el of document.querySelectorAll(
        "h1,h2,h3,h4,h5,h6,.button,[class*=label],[class*=eyebrow],[class*=title]",
      )) {
        const r = el.getBoundingClientRect();
        const y = Math.round(r.top + scrollY);
        if (r.height === 0 || r.width === 0 || y < 0) continue;
        const t = el.textContent.replace(/\s+/g, " ").trim();
        if (!t || t.length > 90) continue;
        const key = t.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({ y, tag: el.tagName.toLowerCase(), t });
      }
      out.sort((a, b) => a.y - b.y);
      return { pageH: document.body.scrollHeight, out };
    });
    console.log(`\n##### ${path}  (pageH=${rows.pageH} @${VW})`);
    for (const r of rows.out)
      console.log(`  y=${String(r.y).padStart(5)} <${r.tag}> "${r.t}"`);
    await p.close();
  }
} finally {
  await b.close();
}
