import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";

const TARGET = "https://www.beachfrontdentistry.com/ask-the-doctor";
const VIEWPORTS = [
  { width: 1440, height: 900 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
];

const b = await chromium.launch();
try {
  for (const vp of VIEWPORTS) {
    const p = await b.newPage({ viewport: vp });
    await p.goto(TARGET, { waitUntil: "networkidle", timeout: 60000 });
    // settle: scroll through so reveals fire
    await p.evaluate(async () => {
      const step = 300;
      for (let y = 0; y < document.body.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 60));
      }
      window.scrollTo(0, 0);
      await new Promise((r) => setTimeout(r, 300));
    });

    const info = await p.evaluate(() => {
      // Find the repeating question cards. Live's card class from home was
      // .qa-block; the grid wrapper is likely a .w-dyn-items or collection list.
      const cards = [...document.querySelectorAll(".qa-block")];
      const first = cards[0];
      const gridWrap = first?.closest(
        ".w-dyn-items, .collection-list, [class*='grid'], [class*='qa']",
      );
      const cs = (el) => (el ? getComputedStyle(el) : null);
      const rect = (el) => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { w: Math.round(r.width), h: Math.round(r.height) };
      };
      const gw = cs(gridWrap);
      return {
        cardCount: cards.length,
        gridWrap: gridWrap
          ? {
              tag: gridWrap.tagName,
              cls: gridWrap.className,
              display: gw.display,
              gridTemplateColumns: gw.gridTemplateColumns,
              gap: gw.gap || `${gw.rowGap} / ${gw.columnGap}`,
              flexWrap: gw.flexWrap,
              maxWidth: gw.maxWidth,
              width: rect(gridWrap)?.w,
            }
          : null,
        firstCard: first ? { cls: first.className, ...rect(first) } : null,
        // parent chain of the grid, for container padding/max-width
        chain: (() => {
          let el = gridWrap?.parentElement;
          const out = [];
          for (let i = 0; i < 4 && el; i++) {
            const c = getComputedStyle(el);
            out.push({
              tag: el.tagName,
              cls: el.className,
              display: c.display,
              maxWidth: c.maxWidth,
              padding: c.padding,
              width: Math.round(el.getBoundingClientRect().width),
            });
            el = el.parentElement;
          }
          return out;
        })(),
        // page heading above the grid
        h1: document.querySelector("h1")?.textContent?.trim()?.slice(0, 60),
      };
    });
    console.log(`\n===== ${vp.width}x${vp.height} =====`);
    console.log(JSON.stringify(info, null, 2));
    await p.close();
  }
} finally {
  await b.close();
}
