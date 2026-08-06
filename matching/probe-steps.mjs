import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";
const ANCHORS = [
  "Have a Complete Exam",
  "Step 02",
  "Receive a No",
  "It is our goal",
];
for (const [tag, url] of [
  ["REF", "https://www.beachfrontdentistry.com/"],
  ["CAND", "http://localhost:5190/"],
]) {
  for (const w of [390, 650]) {
    const b = await chromium.launch();
    try {
      const p = await b.newPage({ viewport: { width: w, height: 1000 } });
      await p.goto(url, { waitUntil: "networkidle", timeout: 60000 });
      const h0 = await p.evaluate(() => document.body.scrollHeight);
      for (let y = 0; y < h0; y += 300) {
        await p.evaluate((yy) => scrollTo(0, yy), y);
        await p.waitForTimeout(50);
      }
      const rows = await p.evaluate(
        (anchors) =>
          anchors.map((a) => {
            const el = [
              ...document.querySelectorAll(
                "h1,h2,h3,h4,h5,h6,p,span,div,a,strong",
              ),
            ].find(
              (e) =>
                (e.textContent || "")
                  .replace(/\s+/g, " ")
                  .trim()
                  .toLowerCase()
                  .startsWith(a.toLowerCase()) &&
                [...e.childNodes].some(
                  (n) => n.nodeType === 3 && n.nodeValue.trim(),
                ),
            );
            if (!el) return `${a}: MISS`;
            const c = getComputedStyle(el);
            return `${a}: ${c.fontSize}/${c.lineHeight} w${c.fontWeight}`;
          }),
        ANCHORS,
      );
      console.log(`${tag} @${w}:`);
      rows.forEach((r) => console.log("   " + r));
    } finally {
      await b.close();
    }
  }
}
