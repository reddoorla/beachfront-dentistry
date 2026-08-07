import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";

const TARGET = "https://www.beachfrontdentistry.com/services";
const b = await chromium.launch();
try {
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto(TARGET, { waitUntil: "networkidle", timeout: 60000 });
  await p.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 300) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 50));
    }
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 300));
  });

  const info = await p.evaluate(() => {
    const tuple = (el) => {
      const cs = getComputedStyle(el);
      return `${cs.fontFamily.split(",")[0]} ${cs.fontWeight} ${cs.fontSize}/${cs.lineHeight} ls=${cs.letterSpacing} ${cs.color} ${cs.textTransform}`;
    };
    const rect = (el) => {
      const r = el.getBoundingClientRect();
      return { w: Math.round(r.width), h: Math.round(r.height) };
    };
    // A "category" = the cyan panel wrapper (bg-color-primary). Find them.
    const panels = [...document.querySelectorAll(".bg-color-primary")].filter(
      (el) => el.querySelector('a[href*="/services/"]'),
    );
    // dedupe to top-most cyan panel per category
    const tops = panels.filter(
      (el) => !el.parentElement?.closest(".bg-color-primary"),
    );
    const cats = tops.slice(0, 6).map((panel) => {
      const cs = getComputedStyle(panel);
      const items = [...panel.querySelectorAll('a[href*="/services/"]')];
      // the panel's own heading (category name)
      const catHead =
        panel.querySelector("h1,h2,h3,h4,h5")?.textContent?.trim() || null;
      // grid container holding the _w-half items
      const itemWrap = items[0]?.closest(
        "[class*='w-layout'], [class*='grid'], [class*='flex']",
      );
      const iw = itemWrap ? getComputedStyle(itemWrap) : null;
      return {
        panelCls: panel.className,
        panelRect: rect(panel),
        bg: cs.backgroundColor,
        borderRadius: cs.borderRadius,
        padding: cs.padding,
        catHead,
        itemCount: items.length,
        itemWrapDisplay: iw?.display,
        itemWrapCols: iw?.gridTemplateColumns,
        itemWrapWrap: iw?.flexWrap,
        firstItemRect: items[0] ? rect(items[0]) : null,
        firstItemText: items[0]?.textContent.trim().slice(0, 30),
      };
    });

    // What heads each cyan panel above it (the category title as a sibling)?
    const context = tops.slice(0, 6).map((panel) => {
      let prev = panel.previousElementSibling;
      let hops = 0;
      while (prev && hops < 3 && !prev.querySelector("h1,h2,h3,h4")) {
        prev = prev.previousElementSibling;
        hops++;
      }
      const h = prev?.querySelector?.("h1,h2,h3,h4") || prev;
      return {
        headText: h?.textContent?.trim()?.slice(0, 40),
        headTuple: h && h.tagName?.match(/^H/) ? tuple(h) : null,
      };
    });

    return { catCount: tops.length, cats, context };
  });
  console.log(JSON.stringify(info, null, 2));
  await p.close();
} finally {
  await b.close();
}
