// Probe: which team-card names wrap, and how wide is each name on ONE line?
// The slider card is 340px at lg with 24px side padding (292px column); the
// name is a fixed 30px slab. Prints, per route/width, every `.team-list-item
// h5`: line count now, single-line width (measured with nowrap forced), and
// the column width it has to fit in.
import { chromium } from "@playwright/test";
const BASE = process.env.PROBE_BASE ?? "http://localhost:5199";
const ROUTES = ["/your-first-visit", "/our-team"];
const WIDTHS = [1440, 1200, 1024, 834, 390];
const browser = await chromium.launch();
const page = await browser.newPage();
for (const path of ROUTES) {
  for (const w of WIDTHS) {
    await page.setViewportSize({ width: w, height: 900 });
    await page.goto(BASE + path, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    const rows = await page.evaluate(() => {
      const out = [];
      for (const h of document.querySelectorAll(".team-list-item h5")) {
        const range = document.createRange();
        range.selectNodeContents(h);
        const lines = new Set(
          Array.from(range.getClientRects()).map((r) => Math.round(r.top)),
        ).size;
        const col = h.getBoundingClientRect().width;
        const card = h.closest(".team-list-item").getBoundingClientRect();
        const prev = h.style.whiteSpace;
        h.style.whiteSpace = "nowrap";
        const oneLine = h.scrollWidth;
        h.style.whiteSpace = prev;
        out.push(
          `${(h.textContent || "").trim()} | lines=${lines} | oneLine=${oneLine} | column=${Math.round(col)} | card=${Math.round(card.width)}x${Math.round(card.height)}`,
        );
      }
      return out;
    });
    const wrapped = rows.filter((r) => !r.includes("lines=1"));
    const widest = rows
      .map((r) => Number(/oneLine=(\d+)/.exec(r)?.[1] ?? 0))
      .reduce((a, b) => Math.max(a, b), 0);
    console.log(
      `${path} @${w}: ${rows.length} cards, widest one-line name ${widest}px, column ${/column=(\d+)/.exec(rows[0] ?? "")?.[1]}px, wrapped: ${wrapped.length}`,
    );
    for (const r of wrapped) console.log(`   ${r}`);
  }
}
await browser.close();
