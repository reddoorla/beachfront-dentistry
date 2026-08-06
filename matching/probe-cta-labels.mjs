import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";

const PATH = "/services/dental-exams";
const b = await chromium.launch();
try {
  for (const vw of [390, 480, 767, 834, 1440]) {
    const line = [];
    for (const [side, base] of [
      ["ref", "https://www.beachfrontdentistry.com"],
      ["cand", "http://localhost:5173"],
    ]) {
      const p = await b.newPage({ viewport: { width: vw, height: 900 } });
      await p.goto(base + PATH, { waitUntil: "networkidle", timeout: 60000 });
      const H = await p.evaluate(() => document.body.scrollHeight);
      for (let y = 0; y < H; y += 250) {
        await p.evaluate((v) => scrollTo(0, v), y);
        await p.waitForTimeout(45);
      }
      await p.waitForTimeout(800);
      const r = await p.evaluate(() => {
        const find = (re) =>
          [...document.querySelectorAll("*")].find((e) =>
            [...e.childNodes].some(
              (n) => n.nodeType === 3 && re.test(n.nodeValue.trim()),
            ),
          );
        const fmt = (e) => {
          if (!e) return "—";
          const cs = getComputedStyle(e);
          const bb = e.getBoundingClientRect();
          return `${cs.fontSize}/${cs.lineHeight} w${cs.fontWeight} h=${Math.round(bb.height)}`;
        };
        return `readReviews=${fmt(find(/^Read Reviews$/i))}  fiji=${fmt(find(/^FIJI ISLANDS$/i))}`;
      });
      line.push(`${side}: ${r}`);
      await p.close();
    }
    console.log(`@${vw}`);
    for (const l of line) console.log("   " + l);
  }
} finally {
  await b.close();
}
