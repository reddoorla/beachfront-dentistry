import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";
const [url, vw, sel] = [
  process.argv[2],
  Number(process.argv[3]),
  process.argv[4],
];
const b = await chromium.launch();
try {
  const p = await b.newPage({ viewport: { width: vw, height: 900 } });
  await p.goto(url, { waitUntil: "load", timeout: 60000 });
  await p.waitForTimeout(2200);
  await p.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 250) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
    window.scrollTo(0, 0);
  });
  await p.waitForTimeout(3000);
  const out = await p.evaluate((sel) => {
    return [...document.querySelectorAll(sel)].map((el) => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return `${el.tagName}.${(el.className || "").toString().slice(0, 32)} top=${Math.round(r.top + scrollY)} h=${Math.round(r.height)} w=${Math.round(r.width)} mt=${cs.marginTop} mb=${cs.marginBottom}`;
    });
  }, sel);
  console.log(`=== ${url} @${vw} [${sel}] ===`);
  for (const l of out.slice(0, 12)) console.log(l);
} finally {
  await b.close();
}
