import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";
const OUT =
  "/Users/tuckerlemos/Documents/GitHub/beachfront-dentistry/matching/cards";
const VW = Number(process.argv[2] || 650);
const b = await chromium.launch();
try {
  const p = await b.newPage({
    viewport: { width: VW, height: 1000 },
    deviceScaleFactor: 2,
  });
  await p.goto("http://localhost:5190/", {
    waitUntil: "networkidle",
    timeout: 60000,
  });
  const h0 = await p.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < h0; y += 250) {
    await p.evaluate((yy) => window.scrollTo(0, yy), y);
    await p.waitForTimeout(80);
  }
  // click first QA card
  const box = await p.evaluate(() => {
    const card = document.querySelector("li.qa-item > div");
    if (!card) return null;
    card.scrollIntoView({ block: "center" });
    card.click();
    return true;
  });
  if (!box) {
    console.log("no card");
  } else {
    await p.waitForTimeout(900); // let the reveal settle
    const info = await p.evaluate(() => {
      const card = document.querySelector("li.qa-item > div");
      const r = card.getBoundingClientRect();
      const a = card.querySelector("a[href^='/questions']");
      const ar = a ? a.getBoundingClientRect() : null;
      return {
        h: Math.round(r.height),
        readMoreBottomInCard: ar ? Math.round(ar.bottom - r.top) : null,
        readMoreVisible: ar
          ? ar.bottom <= r.bottom + 1 && ar.top >= r.top - 1
          : null,
      };
    });
    console.log(`VW=${VW}`, JSON.stringify(info));
    const card = await p.$("li.qa-item > div");
    await card.screenshot({ path: `${OUT}/cand-${VW}-qaopen.png` });
    console.log(`shot cand-${VW}-qaopen.png`);
  }
} finally {
  await b.close();
}
