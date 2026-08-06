import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";

const PATH =
  "/questions/regular-dental-cleanings-support-your-whole-body-health";
const VW = Number(process.argv[2] || 390);

const b = await chromium.launch();
try {
  for (const [side, base] of [
    ["ref", "https://www.beachfrontdentistry.com"],
    ["cand", "http://localhost:5173"],
  ]) {
    const p = await b.newPage({ viewport: { width: VW, height: 900 } });
    await p.goto(base + PATH, { waitUntil: "networkidle", timeout: 60000 });
    const H = await p.evaluate(() => document.body.scrollHeight);
    for (let y = 0; y < H; y += 200) {
      await p.evaluate((v) => scrollTo(0, v), y);
      await p.waitForTimeout(50);
    }
    await p.evaluate(() => scrollTo(0, 0));
    await p.waitForTimeout(1000);
    const rows = await p.evaluate(() => {
      // the body prose block: every <p> below the intro, in document order
      const ps = [...document.querySelectorAll("p")].filter((el) => {
        const r = el.getBoundingClientRect();
        return (
          r.height > 0 &&
          r.top + scrollY > 600 &&
          el.textContent.trim().length > 20 &&
          r.width > 200
        );
      });
      let prevBottom = null;
      return ps.slice(0, 14).map((el) => {
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        const y = Math.round(r.top + scrollY);
        const gap = prevBottom === null ? "-" : y - prevBottom;
        prevBottom = y + Math.round(r.height);
        const bold = !!el.querySelector("strong");
        const allBold =
          bold &&
          el.querySelector("strong").textContent.trim().length >=
            el.textContent.trim().length - 1;
        return `y=${y} h=${Math.round(r.height)} gap=${String(gap).padStart(3)} lines=${Math.round(r.height / parseFloat(cs.lineHeight))} ${allBold ? "SUBHEAD" : bold ? "has-b  " : "       "} "${el.textContent.trim().slice(0, 34)}"`;
      });
    });
    console.log(`\n===== ${side} @${VW}`);
    for (const r of rows) console.log("  " + r);
    await p.close();
  }
} finally {
  await b.close();
}
