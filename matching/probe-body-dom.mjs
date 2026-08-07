import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";

const PATHS = {
  svc: "/services/dental-exams",
  qa: "/questions/regular-dental-cleanings-support-your-whole-body-health",
};
const which = process.argv[2] || "svc";

const b = await chromium.launch();
try {
  const p = await b.newPage({ viewport: { width: 390, height: 900 } });
  await p.goto("https://www.beachfrontdentistry.com" + PATHS[which], {
    waitUntil: "networkidle",
    timeout: 60000,
  });
  const H = await p.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < H; y += 200) {
    await p.evaluate((v) => scrollTo(0, v), y);
    await p.waitForTimeout(50);
  }
  await p.evaluate(() => scrollTo(0, 0));
  await p.waitForTimeout(1000);
  const out = await p.evaluate(() => {
    const rt = document.querySelector(".w-richtext, .dynamic-content-body");
    if (!rt) return ["no .w-richtext found"];
    return [...rt.children].map((el, i) => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      const brs = el.querySelectorAll("br").length;
      const txt = el.textContent.replace(/\s+/g, " ").trim();
      return (
        `${String(i).padStart(2)} <${el.tagName.toLowerCase()}> y=${Math.round(r.top + scrollY)} h=${Math.round(r.height)} ` +
        `m=${cs.marginTop}/${cs.marginBottom} br=${brs} len=${txt.length} "${txt.slice(0, 42)}"`
      );
    });
  });
  console.log(`=== live ${which} .w-richtext children @390`);
  for (const l of out) console.log("  " + l);
  await p.close();
} finally {
  await b.close();
}
