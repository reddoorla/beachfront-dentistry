import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";

const VW = Number(process.argv[2] || 650);
const targets = [
  ["CAND", "http://localhost:5190/", "li.qa-item > div"],
  ["REF", "https://www.beachfrontdentistry.com/", ".qa-block"],
];
for (const [tag, url, sel] of targets) {
  const b = await chromium.launch();
  try {
    const p = await b.newPage({ viewport: { width: VW, height: 1000 } });
    await p.goto(url, { waitUntil: "networkidle", timeout: 60000 });
    const h0 = await p.evaluate(() => document.body.scrollHeight);
    for (let y = 0; y < h0; y += 250) { await p.evaluate((yy) => window.scrollTo(0, yy), y); await p.waitForTimeout(80); }
    await p.waitForTimeout(300);
    const info = await p.evaluate((sel) => {
      const cards = [...document.querySelectorAll(sel)];
      const rows = cards.slice(0, 4).map((c) => {
        const r = c.getBoundingClientRect();
        const texts = [...c.querySelectorAll("h1,h2,h3,h4,h5,h6,p,a,span")]
          .filter((e) => (e.textContent || "").trim().length > 3)
          .map((e) => { const rr = e.getBoundingClientRect(); return { t: (e.textContent||"").trim().slice(0,26), top: Math.round(rr.top - r.top), bottom: Math.round(rr.bottom - r.top), vis: rr.height>0 && rr.width>0 }; })
          .filter((x) => x.vis && x.bottom > 0 && x.top < r.height + 2);
        return { w: Math.round(r.width), h: Math.round(r.height), aspect: (r.width/r.height).toFixed(3), texts: texts.slice(0,5) };
      });
      return { count: cards.length, rows };
    }, sel);
    console.log(tag, JSON.stringify(info));
  } finally { await b.close(); }
}
