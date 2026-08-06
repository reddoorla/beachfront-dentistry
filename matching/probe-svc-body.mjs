import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";

const PATH = "/services/dental-exams";
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
    const out = await p.evaluate(() => {
      const fontsOK = {
        "sans300": document.fonts.check("300 12px museo-sans"),
        "sans700": document.fonts.check("700 12px museo-sans"),
        "slab100": document.fonts.check("100 25px museo-slab"),
        "slab300": document.fonts.check("300 25px museo-slab"),
      };
      const rows = [];
      for (const el of document.querySelectorAll("p,strong,h1,h2,h3,h4,h5,h6")) {
        const t = el.textContent.trim();
        if (!/^(What to expect|Why are dental exams|During your dental exam|Dental exams are the best)/.test(t))
          continue;
        const r = el.getBoundingClientRect();
        if (r.height === 0) continue;
        const cs = getComputedStyle(el);
        rows.push(
          `${el.tagName.toLowerCase().padEnd(7)} y=${Math.round(r.top + scrollY)} ${Math.round(r.width)}x${Math.round(r.height)} ` +
            `${cs.fontSize}/${cs.lineHeight} w${cs.fontWeight} ls=${cs.letterSpacing} ws=${cs.wordSpacing} ` +
            `fam=${cs.fontFamily.split(",")[0]} lines=${Math.round(r.height / parseFloat(cs.lineHeight))} ` +
            `chars=${t.length} "${t.slice(0, 30)}"`,
        );
      }
      return { fontsOK, rows };
    });
    console.log(`\n===== ${side} @${VW}  fonts=${JSON.stringify(out.fontsOK)}`);
    for (const r of out.rows) console.log("  " + r);
    await p.close();
  }
} finally {
  await b.close();
}
