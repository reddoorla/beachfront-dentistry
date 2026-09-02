import { test, expect } from "@playwright/test";

// A pill label renders on ONE line, always. Live's `.button` is `line-height:0`
// (beachfront.css:6028-6040) — the box is exactly 2.6em of padding, which is
// how it tracks the font-size ladder — and OutlineButton keeps that. The cost
// of that choice is that a label which WRAPS does not grow the pill: the
// second line lands on the same baseline as the first and the words paint on
// top of each other.
//
// Tim, Discord, 2026-09-02 20:43, /your-first-visit, screenshot of the
// registration box: "Request" drawn over "Appointment". Live never showed it
// because live's label is "Book Appointment" (283px at 25px); MarkUp pin
// 5980c9d7 #3 renamed it to "Request Appointment" (315px), and the box's copy
// column beside the "15 MIN" badge is 300px at >=1100 and 275px at 1024. Both
// engines wrapped it; nobody saw, because nothing measured it.
//
// So: every pill on these routes has exactly one text fragment. `line-height:
// 0` is the signature of a pill — measuring by that rather than by class
// means a pill added anywhere on the route is covered without editing this.
const ROUTES = ["/your-first-visit", "/"];
const WIDTHS = [390, 834, 1024, 1200, 1440];

for (const path of ROUTES) {
  for (const width of WIDTHS) {
    test(`${path} @${width}: no pill label breaks onto a second line`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(path, { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);
      const stacked = await page.evaluate(() => {
        const out: string[] = [];
        for (const a of Array.from(document.querySelectorAll("a"))) {
          if (getComputedStyle(a).lineHeight !== "0px") continue;
          const label = (a.textContent ?? "").trim();
          if (!label) continue;
          const range = document.createRange();
          range.selectNodeContents(a);
          const frags = Array.from(range.getClientRects()).filter(
            (r) => r.width > 0,
          );
          if (frags.length > 1) {
            const r = a.getBoundingClientRect();
            out.push(
              `"${label}" in ${frags.length} fragments (pill ${Math.round(r.width)}px, parent ${Math.round(a.parentElement!.getBoundingClientRect().width)}px)`,
            );
          }
        }
        return out;
      });
      expect(stacked, "pill labels painted on more than one line").toEqual([]);
    });
  }
}
