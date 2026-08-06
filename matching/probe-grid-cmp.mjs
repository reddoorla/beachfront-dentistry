import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";
const b = await chromium.launch();
const settle = async (p) =>
  p.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 400) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 40));
    }
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 300));
  });
try {
  for (const w of [1440, 390]) {
    const out = { vw: w };
    // LIVE
    let p = await b.newPage({ viewport: { width: w, height: 900 } });
    await p.goto("https://www.beachfrontdentistry.com/ask-the-doctor", {
      waitUntil: "networkidle",
      timeout: 60000,
    });
    await settle(p);
    out.live = await p.evaluate(() => {
      const c = [...document.querySelectorAll(".qa-block")];
      const box = (el) => {
        const b = el.getBoundingClientRect();
        return {
          x: Math.round(b.x),
          y: Math.round(b.y + window.scrollY),
          w: Math.round(b.width),
          h: Math.round(b.height),
        };
      };
      return {
        count: c.length,
        first4: c.slice(0, 4).map(box),
        last: c.length ? box(c[c.length - 1]) : null,
      };
    });
    await p.close();
    // CAND
    p = await b.newPage({ viewport: { width: w, height: 900 } });
    await p.goto("http://localhost:5190/dev/match/ask-the-doctor", {
      waitUntil: "networkidle",
      timeout: 60000,
    });
    await settle(p);
    out.cand = await p.evaluate(() => {
      const c = [...document.querySelectorAll(".qa-item")];
      const box = (el) => {
        const b = el.getBoundingClientRect();
        return {
          x: Math.round(b.x),
          y: Math.round(b.y + window.scrollY),
          w: Math.round(b.width),
          h: Math.round(b.height),
        };
      };
      return {
        count: c.length,
        first4: c.slice(0, 4).map(box),
        last: c.length ? box(c[c.length - 1]) : null,
      };
    });
    await p.close();
    console.log(JSON.stringify(out, null, 1));
  }
} finally {
  await b.close();
}
