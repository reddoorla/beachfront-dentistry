import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";
const WIDTHS = [390, 480, 650, 834, 1440];
const OUT =
  "/Users/tuckerlemos/Documents/GitHub/beachfront-dentistry/matching/cards";
for (const [tag, url, sel] of [
  ["REF", "https://www.beachfrontdentistry.com/", ".big-teal-tooth"],
  ["CAND", "http://localhost:5190/", 'img[src*="big-teal-tooth"]'],
]) {
  for (const w of WIDTHS) {
    const b = await chromium.launch();
    try {
      const p = await b.newPage({
        viewport: { width: w, height: 1000 },
        deviceScaleFactor: 2,
      });
      await p.goto(url, { waitUntil: "networkidle", timeout: 60000 });
      const h0 = await p.evaluate(() => document.body.scrollHeight);
      for (let y = 0; y < h0; y += 300) {
        await p.evaluate((yy) => scrollTo(0, yy), y);
        await p.waitForTimeout(50);
      }
      const info = await p.evaluate((sel) => {
        let t =
          document.querySelector(sel) ||
          [...document.querySelectorAll("img")].find(
            (e) =>
              /big-teal-tooth|tooth/i.test(e.src || "") &&
              e.getBoundingClientRect().width > 40,
          );
        if (!t) return null;
        const op = t.offsetParent || t.parentElement;
        const tr = t.getBoundingClientRect(),
          pr = op.getBoundingClientRect();
        return {
          topInParent: Math.round(tr.top - pr.top),
          parentTag:
            op.tagName +
            "." +
            (op.className || "").toString().replace(/\s+/g, ".").slice(0, 25),
          toothTopVpAbs: Math.round(tr.top + window.scrollY),
          toothCx: Math.round(tr.left + tr.width / 2),
          tw: Math.round(tr.width),
        };
      }, sel);
      if (info) {
        // screenshot clip around tooth
        await p.evaluate((ta) => scrollTo(0, ta - 300), info.toothTopVpAbs);
        await p.waitForTimeout(200);
        const box = await p.evaluate((sel) => {
          let t =
            document.querySelector(sel) ||
            [...document.querySelectorAll("img")].find(
              (e) =>
                /tooth/i.test(e.src || "") &&
                e.getBoundingClientRect().width > 40,
            );
          const r = t.getBoundingClientRect();
          return { x: r.left, y: r.top, w: r.width, h: r.height };
        }, sel);
        await p.screenshot({
          path: `${OUT}/${tag.toLowerCase()}-${w}-tooth.png`,
          clip: {
            x: Math.max(0, box.x - 120),
            y: Math.max(0, box.y - 90),
            width: Math.min(w, box.w + 240),
            height: box.h + 180,
          },
        });
      }
      console.log(`${tag} @${w}:`, JSON.stringify(info));
    } finally {
      await b.close();
    }
  }
}
