import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";
const b = await chromium.launch();
try {
  const p = await b.newPage({ viewport: { width: 1440, height: 800 } });
  await p.goto("https://www.beachfrontdentistry.com/", {
    waitUntil: "domcontentloaded",
    timeout: 90000,
  });
  await p.waitForTimeout(2000);
  for (const w of [
    390, 479, 480, 600, 767, 768, 769, 800, 834, 900, 991, 992, 1200, 1440,
    1920,
  ]) {
    await p.setViewportSize({ width: w, height: 800 });
    await p.waitForTimeout(220);
    const r = await p.evaluate(() => ({
      root: getComputedStyle(document.documentElement).fontSize,
      body: getComputedStyle(document.body).fontSize,
    }));
    console.log(w, r.root, r.body);
  }
  // dump the html font-size rules
  const rules = await p.evaluate(() => {
    const out = [];
    for (const ss of document.styleSheets) {
      let rs;
      try {
        rs = ss.cssRules;
      } catch {
        continue;
      }
      const walk = (list, ctx) => {
        for (const r of list) {
          if (r.cssRules && r.conditionText !== undefined) {
            walk(r.cssRules, r.conditionText);
          } else if (
            r.selectorText &&
            /(^|,)\s*(html|:root)\s*(,|$)/.test(r.selectorText) &&
            /font-size/.test(r.cssText)
          )
            out.push((ctx ? `@media ${ctx} ` : "") + r.cssText.slice(0, 140));
        }
      };
      walk(rs, "");
    }
    return out;
  });
  console.log(rules.join("\n"));
} finally {
  await b.close();
}
