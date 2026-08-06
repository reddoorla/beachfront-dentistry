import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";

const CAND = "http://localhost:5190/";
const OUT =
  "/Users/tuckerlemos/Documents/GitHub/beachfront-dentistry/matching/cards";
const VW = Number(process.argv[2] || 834);

const b = await chromium.launch();
try {
  const p = await b.newPage({
    viewport: { width: VW, height: 1000 },
    deviceScaleFactor: 2,
  });
  await p.goto(CAND, { waitUntil: "networkidle", timeout: 60000 });
  // settled scroll
  const h = await p.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < h; y += 250) {
    await p.evaluate((yy) => window.scrollTo(0, yy), y);
    await p.waitForTimeout(120);
  }
  await p.evaluate(() => window.scrollTo(0, 0));
  await p.waitForTimeout(400);

  // capture named regions by anchor text
  const targets = [
    ["team", "Our dental team"],
    ["serving", "Serving"],
    ["reviews", "Reviews"],
    ["questions", "Questions"],
  ];
  for (const [name, anchor] of targets) {
    const box = await p.evaluate((a) => {
      const els = [
        ...document.querySelectorAll("h1,h2,h3,h4,h5,h6,p,span,div"),
      ];
      const el = els.find((e) =>
        (e.textContent || "")
          .replace(/\s+/g, " ")
          .trim()
          .toLowerCase()
          .startsWith(a.toLowerCase()),
      );
      if (!el) return null;
      // climb to a section-ish ancestor
      let s = el;
      for (let i = 0; i < 4 && s.parentElement; i++) s = s.parentElement;
      const r = s.getBoundingClientRect();
      return { x: r.x, y: r.y + window.scrollY, w: r.width, h: r.height };
    }, anchor);
    if (!box) {
      console.log(`MISS ${name} (${anchor})`);
      continue;
    }
    await p.evaluate((y) => window.scrollTo(0, Math.max(0, y - 40)), box.y);
    await p.waitForTimeout(300);
    await p.screenshot({ path: `${OUT}/cand-${VW}-${name}.png` });
    console.log(`OK ${name} @${VW} -> cand-${VW}-${name}.png`);
  }
} finally {
  await b.close();
}
