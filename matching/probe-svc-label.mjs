import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";
const b = await chromium.launch();
try {
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto("https://beachfrontdentistry.com/services", { waitUntil: "networkidle", timeout: 60000 });
  const r = await p.evaluate(() => {
    const a = document.querySelector(".service-block a[href*='/services/']");
    const cs = getComputedStyle(a);
    return { text: a.textContent, transform: cs.textTransform, cls: a.className, parentCls: a.parentElement.className,
      font: `${cs.fontFamily.split(",")[0]} ${cs.fontWeight} ${cs.fontSize}/${cs.lineHeight} ls=${cs.letterSpacing} ${cs.color}` };
  });
  console.log(JSON.stringify(r, null, 1));
  // detail page h1
  await p.goto("https://beachfrontdentistry.com/services/dental-veneers", { waitUntil: "networkidle", timeout: 60000 });
  const h = await p.evaluate(() => [...document.querySelectorAll("h1,h2")].slice(0,4).map(e => ({ tag: e.tagName, cls: e.className, text: e.textContent.trim().slice(0,80), tt: getComputedStyle(e).textTransform })));
  console.log(JSON.stringify(h, null, 1));
} finally { await b.close(); }
