import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";
const WIDTHS = [390, 480, 650, 834, 1440];
for (const [tag, url, sel] of [
  ["REF", "https://www.beachfrontdentistry.com/", ".big-teal-tooth"],
  ["CAND", "http://localhost:5190/", 'img[src*="big-teal-tooth"]'],
]) {
  for (const w of WIDTHS) {
    const b = await chromium.launch();
    try {
      const p = await b.newPage({ viewport: { width: w, height: 1000 } });
      await p.goto(url, { waitUntil: "networkidle", timeout: 60000 });
      const h0 = await p.evaluate(() => document.body.scrollHeight);
      for (let y = 0; y < h0; y += 300) {
        await p.evaluate((yy) => scrollTo(0, yy), y);
        await p.waitForTimeout(50);
      }
      await p.evaluate(() => scrollTo(0, 0));
      await p.waitForTimeout(150);
      const r = await p.evaluate((sel) => {
        let t = document.querySelector(sel);
        if (!t) {
          t = [...document.querySelectorAll("img")].find(
            (e) =>
              /big-teal-tooth|tooth/i.test(e.src || "") &&
              e.getBoundingClientRect().width > 40,
          );
        }
        if (!t) return "MISS";
        const tr = t.getBoundingClientRect();
        // SERVICES heading as section landmark
        const svc = [
          ...document.querySelectorAll("h1,h2,h3,h4,h5,h6,div,span,p"),
        ].find(
          (e) =>
            (e.textContent || "").trim().toUpperCase().startsWith("SERVICES") &&
            [...e.childNodes].some(
              (n) => n.nodeType === 3 && n.nodeValue.trim(),
            ),
        );
        const sr = svc ? svc.getBoundingClientRect() : null;
        const doc = { sx: window.scrollX, sy: window.scrollY };
        return {
          w: Math.round(tr.width),
          h: Math.round(tr.height),
          centerXpct: +(
            ((tr.left + tr.width / 2) / window.innerWidth) *
            100
          ).toFixed(1),
          rightGapPct: +(
            ((window.innerWidth - tr.right) / window.innerWidth) *
            100
          ).toFixed(1),
          toothTopAbs: Math.round(tr.top + doc.sy),
          svcTopAbs: sr ? Math.round(sr.top + doc.sy) : null,
          toothTopMinusSvcTop: sr ? Math.round(tr.top - sr.top) : null,
        };
      }, sel);
      console.log(`${tag} @${w}:`, JSON.stringify(r));
    } finally {
      await b.close();
    }
  }
}
