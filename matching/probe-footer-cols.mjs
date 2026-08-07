import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";

const REF = "https://www.beachfrontdentistry.com/services/dental-exams";
const CAND = "http://localhost:5173/services/dental-exams";

const b = await chromium.launch();
try {
  for (const vw of [768, 834, 991]) {
    for (const [side, url] of [
      ["ref", REF],
      ["cand", CAND],
    ]) {
      const p = await b.newPage({ viewport: { width: vw, height: 900 } });
      await p.goto(url, { waitUntil: "networkidle", timeout: 60000 });
      const H = await p.evaluate(() => document.body.scrollHeight);
      for (let y = 0; y < H; y += 250) {
        await p.evaluate((v) => scrollTo(0, v), y);
        await p.waitForTimeout(50);
      }
      await p.waitForTimeout(900);
      const rows = await p.evaluate(() => {
        const want = [
          "Want to learn more",
          "Your First Visit",
          "Make a Payment",
          "OFFICE HOURS",
          "Office Hours",
          "CONTACT",
          "Contact",
          "Redondo Beach, CA",
          "©2023",
        ];
        const seen = new Set();
        const out = [];
        for (const el of document.querySelectorAll("*")) {
          const t = [...el.childNodes]
            .filter((n) => n.nodeType === 3)
            .map((n) => n.nodeValue.trim())
            .join(" ")
            .trim();
          if (!t) continue;
          const hit = want.find((w) => t.startsWith(w));
          if (!hit || seen.has(hit)) continue;
          const r = el.getBoundingClientRect();
          if (r.width === 0) continue;
          // skip the off-canvas menu clones (negative or fixed-position copies)
          if (r.top + scrollY < 1000) continue;
          seen.add(hit);
          out.push(
            `${hit.padEnd(20)} x=${Math.round(r.left)} y=${Math.round(r.top + scrollY)} w=${Math.round(r.width)}`,
          );
        }
        const map =
          document.querySelector("iframe[src*='map'],iframe[src*='google']") ||
          document.querySelector(".gm-style");
        if (map) {
          const r = map.getBoundingClientRect();
          out.push(
            `${"MAP".padEnd(20)} x=${Math.round(r.left)} y=${Math.round(r.top + scrollY)} w=${Math.round(r.width)}`,
          );
        }
        return out;
      });
      console.log(`\n--- ${side} @${vw}`);
      for (const r of rows) console.log("   " + r);
      await p.close();
    }
  }
} finally {
  await b.close();
}
