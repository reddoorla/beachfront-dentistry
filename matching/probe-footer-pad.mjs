import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";

const REF = "https://www.beachfrontdentistry.com/services/dental-exams";
const b = await chromium.launch();
try {
  for (const vw of [390, 479, 480, 650, 767, 768, 834, 991, 992, 1440]) {
    const p = await b.newPage({ viewport: { width: vw, height: 900 } });
    await p.goto(REF, { waitUntil: "networkidle", timeout: 60000 });
    const out = await p.evaluate(() => {
      const root = getComputedStyle(document.documentElement).fontSize;
      const sec = document.querySelector(".footer-info-section");
      const cols = document.querySelector(".footer-cols");
      const c1 = document.querySelector(".footer-col-1");
      const c2 = document.querySelector(".footer-col-2");
      const c3 = document.querySelector(".footer-col-3");
      const r = (e) => (e ? Math.round(e.getBoundingClientRect().width) : null);
      const x = (e) => (e ? Math.round(e.getBoundingClientRect().left) : null);
      const cs = sec ? getComputedStyle(sec) : null;
      const cc = cols ? getComputedStyle(cols) : null;
      return {
        root,
        secPad: cs ? `${cs.paddingLeft}/${cs.paddingRight}` : null,
        colsPad: cc ? `${cc.paddingLeft}/${cc.paddingRight}` : null,
        colsW: r(cols),
        colsX: x(cols),
        c1: `${x(c1)}+${r(c1)}`,
        c2: `${x(c2)}+${r(c2)}`,
        c3: `${x(c3)}+${r(c3)}`,
      };
    });
    console.log(
      `@${String(vw).padEnd(5)} root=${String(out.root).padEnd(6)} cols x=${out.colsX} w=${out.colsW} secPad=${out.secPad} colsPad=${out.colsPad}\n        col1=${out.c1}  col2=${out.c2}  col3=${out.c3}`,
    );
    await p.close();
  }
} finally {
  await b.close();
}
