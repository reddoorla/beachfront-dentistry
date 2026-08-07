import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";
const A = [
  "Have a Complete Exam",
  "Want to learn more",
  "Read Reviews",
  "Fiji Islands",
];
const b = await chromium.launch();
try {
  for (const w of [768, 834]) {
    const p = await b.newPage({ viewport: { width: w, height: 1000 } });
    await p.goto("https://www.beachfrontdentistry.com/", {
      waitUntil: "networkidle",
      timeout: 60000,
    });
    const h0 = await p.evaluate(() => document.body.scrollHeight);
    for (let y = 0; y < h0; y += 300) {
      await p.evaluate((yy) => scrollTo(0, yy), y);
      await p.waitForTimeout(50);
    }
    const r = await p.evaluate(
      (a) =>
        a.map((x) => {
          const e = [
            ...document.querySelectorAll(
              "h1,h2,h3,h4,h5,h6,p,span,a,div,strong",
            ),
          ].find(
            (el) =>
              (el.textContent || "")
                .replace(/\s+/g, " ")
                .trim()
                .toLowerCase()
                .startsWith(x.toLowerCase()) &&
              [...el.childNodes].some(
                (n) => n.nodeType === 3 && n.nodeValue.trim(),
              ),
          );
          if (!e) return `${x}: MISS`;
          const c = getComputedStyle(e);
          return `${x}: ${c.fontSize}/${c.lineHeight} w${c.fontWeight}`;
        }),
      A,
    );
    console.log(`REF @${w}:`);
    r.forEach((x) => console.log("  " + x));
    await p.close();
  }
} finally {
  await b.close();
}
