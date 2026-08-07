import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";

const URL = "https://www.beachfrontdentistry.com/";
const WIDTHS = [479, 480, 650, 767, 768, 834, 992];
const ANCHORS = [
  "Path to Oral Health",
  "Comfort",
  "Paul K.",
  "Fiji Islands",
  "Read Reviews",
  "Serving the South Bay",
  "Finally have a dentist",
];

const b = await chromium.launch();
try {
  for (const w of WIDTHS) {
    const p = await b.newPage({ viewport: { width: w, height: 1000 } });
    await p.goto(URL, { waitUntil: "networkidle", timeout: 60000 });
    const h0 = await p.evaluate(() => document.body.scrollHeight);
    for (let y = 0; y < h0; y += 300) {
      await p.evaluate((yy) => window.scrollTo(0, yy), y);
      await p.waitForTimeout(60);
    }
    await p.waitForTimeout(200);
    const out = await p.evaluate((anchors) => {
      const root = getComputedStyle(document.documentElement).fontSize;
      const body = getComputedStyle(document.body).fontSize;
      const rows = anchors.map((a) => {
        const el = [
          ...document.querySelectorAll(
            "h1,h2,h3,h4,h5,h6,p,span,a,div,strong,li",
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
        const cs = getComputedStyle(el);
        return `${a}: ${cs.fontSize}/${cs.lineHeight} w${cs.fontWeight}`;
      });
      return { root, body, rows };
    }, ANCHORS);
    console.log(`\n=== ${w}px | root=${out.root} body=${out.body} ===`);
    out.rows.forEach((r) => console.log("  " + r));
    await p.close();
  }
} finally {
  await b.close();
}
