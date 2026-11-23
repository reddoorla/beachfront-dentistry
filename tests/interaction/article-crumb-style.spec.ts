import { test, expect, type Page } from "@playwright/test";

// Scaffold tier (untagged): computed styles, which the gate never reads.
//
// Tim's Figma, 2026-11-23: the Ask the Doctor crumb above an article's title
// uses "a heading style from the home page", the "Meet Your Team" eyebrow.
// This holds the two together element to element, at a desktop and a phone
// width, without naming a single value: if either drifts, or the crumb is given
// another class, they stop matching. The link inherits the line's type.
const PROPS = [
  "font-family",
  "font-weight",
  "font-size",
  "line-height",
  "letter-spacing",
  "text-transform",
  "color",
] as const;

async function typeOf(page: Page, selector: string) {
  const el = page.locator(selector).first();
  await expect(el).toBeAttached();
  return el.evaluate(
    (node, props) =>
      Object.fromEntries(
        props.map((p) => [p, getComputedStyle(node).getPropertyValue(p)]),
      ),
    [...PROPS],
  );
}

for (const width of [1280, 390]) {
  test(`the article crumb wears the homepage "Meet Your Team" eyebrow @${width}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const home = await typeOf(
      page,
      `[data-slice-type] p:text-is("Meet Your Team")`,
    );
    await page.goto("/questions/how-to-stop-a-toothache-fast", {
      waitUntil: "domcontentloaded",
    });
    const crumb = await typeOf(page, "[data-detail-crumb]");
    const link = await typeOf(page, "[data-detail-crumb] a");
    expect(crumb).toEqual(home);
    expect(link).toEqual(home);
  });
}
