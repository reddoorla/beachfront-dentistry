import { test, expect } from "@playwright/test";

/**
 * The home team row's names were a hover reveal, and Tailwind v4 wraps
 * `group-hover:` in `@media (hover: hover)` — so on every phone and tablet
 * the row that exists to introduce the staff introduced nobody. No gate on
 * this project could see it: they never emulate an input mode without hover.
 */

test.describe("the team row names a face without hover", () => {
  // The device options that matter here, spelled out rather than spread from
  // `devices["iPhone 13"]` — that preset carries `defaultBrowserType`, which
  // Playwright refuses inside a describe. `isMobile` + `hasTouch` are what
  // flip Chromium to `(hover: none)` / `(pointer: coarse)`.
  test.use({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 3,
  });

  test("every headshot carries a visible name, and the cyan badge stays off the face", async ({
    page,
  }) => {
    await page.goto("/");
    expect(await page.evaluate(() => matchMedia("(hover: none)").matches)).toBe(
      true,
    );
    const row = page.locator('section[data-slice-variation="team"]');
    await row.scrollIntoViewIfNeeded();
    const captions = row.locator("a > span:not(.group)");
    const n = await captions.count();
    expect(n).toBeGreaterThan(1);
    for (let i = 0; i < n; i++) {
      await expect(captions.nth(i)).toBeVisible();
      expect(
        (await captions.nth(i).textContent())?.trim().length,
      ).toBeGreaterThan(0);
    }
    // the hover badge is the pointer affordance and stays one: permanently on,
    // it paints a 65% cyan disc over every face
    const badge = row.locator("span[aria-hidden='true'].absolute").first();
    expect(await badge.evaluate((el) => getComputedStyle(el).opacity)).toBe(
      "0",
    );
  });

  test("tapping a name navigates to that person", async ({ page }) => {
    await page.goto("/");
    const row = page.locator('section[data-slice-variation="team"]');
    await row.scrollIntoViewIfNeeded();
    const caption = row.locator("a > span:not(.group)").first();
    const href = await caption
      .locator("xpath=ancestor::a")
      .first()
      .getAttribute("href");
    await caption.tap();
    await page.waitForURL(`**${href}`);
    expect(new URL(page.url()).pathname).toBe(href);
  });
});
