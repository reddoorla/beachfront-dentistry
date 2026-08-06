import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";

const LIVE = "https://www.beachfrontdentistry.com/";
const LOCAL = "http://localhost:5190/";
const VPS = [
  { width: 1440, height: 900 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
];

async function settle(p) {
  await p.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 300) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 50));
    }
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 300));
  });
}

const b = await chromium.launch();
try {
  for (const vp of VPS) {
    const out = { vw: vp.width };
    // LIVE
    let p = await b.newPage({ viewport: vp });
    await p.goto(LIVE, { waitUntil: "networkidle", timeout: 60000 });
    await settle(p);
    out.live = await p.evaluate(() => {
      const c = document.querySelector(".qa-block");
      if (!c) return null;
      const r = c.getBoundingClientRect();
      return { w: Math.round(r.width), h: Math.round(r.height) };
    });
    await p.close();
    // LOCAL
    p = await b.newPage({ viewport: vp });
    await p.goto(LOCAL, { waitUntil: "networkidle", timeout: 60000 });
    await settle(p);
    out.local = await p.evaluate(() => {
      const item = document.querySelector(".qa-item");
      const card = item?.querySelector(":scope > div");
      if (!card) return { cards: document.querySelectorAll(".qa-item").length };
      const r = card.getBoundingClientRect();
      return {
        cards: document.querySelectorAll(".qa-item").length,
        w: Math.round(r.width),
        h: Math.round(r.height),
      };
    });
    // expansion test on local (click the header button of the 2nd card)
    if (vp.width === 1440) {
      out.expandTest = await p.evaluate(async () => {
        const items = [...document.querySelectorAll(".qa-item")];
        const card2 = items[1]?.querySelector(":scope > div");
        const btn = card2?.querySelector("button[aria-expanded]");
        if (!btn) return "no-button";
        const before = Math.round(card2.getBoundingClientRect().height);
        btn.click();
        await new Promise((r) => setTimeout(r, 800));
        const expanded = btn.getAttribute("aria-expanded");
        const after = Math.round(card2.getBoundingClientRect().height);
        // check the answer link is now visible (Read More)
        const link = card2.querySelector('a[href^="/questions/"]');
        const linkVisible = link
          ? getComputedStyle(link).visibility !== "hidden"
          : false;
        return { aria: expanded, hBefore: before, hAfter: after, linkVisible };
      });
    }
    await p.close();
    console.log(JSON.stringify(out));
  }
} finally {
  await b.close();
}
