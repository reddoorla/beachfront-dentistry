import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";
const b = await chromium.launch();
try {
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto("https://www.beachfrontdentistry.com/services", {
    waitUntil: "networkidle",
    timeout: 60000,
  });
  await p.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 300) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 50));
    }
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 300));
  });
  const out = await p.evaluate(() => {
    const r = (el) => {
      const b = el.getBoundingClientRect();
      return { w: Math.round(b.width), h: Math.round(b.height) };
    };
    const panel = [...document.querySelectorAll(".bg-color-primary")].find(
      (el) =>
        el.querySelector('a[href*="/services/"]') &&
        !el.parentElement?.closest(".bg-color-primary"),
    );
    const card = panel?.parentElement;
    const outline = (el) =>
      [...el.children].map((c) => ({
        tag: c.tagName,
        cls: c.className.slice(0, 70),
        ...r(c),
        hasImg: !!c.querySelector("img"),
        text: c.textContent.trim().slice(0, 30),
      }));
    const grid = card?.parentElement;
    const gcs = grid ? getComputedStyle(grid) : null;
    return {
      cardCls: card?.className,
      cardRect: r(card),
      cardChildren: card ? outline(card) : null,
      gridCls: grid?.className,
      gridDisplay: gcs?.display,
      gridCols: gcs?.gridTemplateColumns,
      gridGap: gcs?.gap,
    };
  });
  console.log(JSON.stringify(out, null, 2));
  await p.close();
} finally {
  await b.close();
}
