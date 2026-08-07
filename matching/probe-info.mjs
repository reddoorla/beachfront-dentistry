import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";

const URL = "https://www.beachfrontdentistry.com/contact-us";

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(URL, { waitUntil: "networkidle", timeout: 45000 });
    await page.evaluate(async () => {
      await new Promise((r) => {
        let y = 0;
        const s = () => {
          window.scrollTo(0, y);
          y += 600;
          if (y < document.body.scrollHeight) setTimeout(s, 50);
          else r();
        };
        s();
      });
    });
    await page.waitForTimeout(800);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(400);

    const data = await page.evaluate(() => {
      const norm = (s) => (s || "").replace(/\s+/g, " ").trim();
      const T = (el) => {
        const c = getComputedStyle(el);
        return `${c.fontFamily.split(",")[0].replace(/"/g, "")} ${c.fontSize}/${c.lineHeight} w${c.fontWeight} ls${c.letterSpacing} ${c.textTransform} ${c.color} align:${c.textAlign}`;
      };

      const info = document.querySelector(".info-section");
      const out = {
        infoLayout: null,
        blocks: [],
        iframes: [],
        links: [],
        rawLines: [],
      };
      if (info) {
        const cs = getComputedStyle(info);
        out.infoLayout = {
          display: cs.display,
          gridCols: cs.gridTemplateColumns,
          flex: cs.flexDirection,
          gap: cs.gap,
          padding: cs.padding,
          maxW: cs.maxWidth,
        };
        // direct container children layout
        const inner =
          info.querySelector(
            '.container, [class*="container"], .w-layout-grid, .grid',
          ) || info;
        const ics = getComputedStyle(inner);
        out.innerLayout = {
          cls: inner.className,
          display: ics.display,
          gridCols: ics.gridTemplateColumns,
          flex: ics.flexDirection,
          gap: ics.gap,
        };
        // capture text-bearing leaf-ish elements
        out.rawLines = norm(info.innerText)
          .split("\n")
          .map(norm)
          .filter(Boolean);
        // headings + strong labels + paragraphs with tuples
        [...info.querySelectorAll("h1,h2,h3,h4,h5,h6,p,strong,a,div")].forEach(
          (el) => {
            const t = norm(el.innerText);
            if (!t || t.length > 90) return;
            // only leaf-ish (no child element with same text)
            const kids = [...el.children];
            if (kids.some((k) => norm(k.innerText) === t)) return;
            const r = el.getBoundingClientRect();
            out.blocks.push({
              tag: el.tagName,
              cls: el.className,
              text: t,
              x: Math.round(r.left),
              y: Math.round(r.top + scrollY),
              tuple: T(el),
            });
          },
        );
        out.links = [...info.querySelectorAll("a")].map((a) => ({
          text: norm(a.innerText),
          href: a.getAttribute("href"),
        }));
        out.iframes = [...info.querySelectorAll("iframe")].map((f) => ({
          src: f.getAttribute("src"),
          dataSrc: f.getAttribute("data-src"),
          title: f.getAttribute("title"),
          cls: f.className,
          w: Math.round(f.getBoundingClientRect().width),
          h: Math.round(f.getBoundingClientRect().height),
        }));
      }
      // full raw innerText of info for hours
      return out;
    });
    console.log(JSON.stringify(data, null, 1));
  } finally {
    await browser.close();
  }
})();
