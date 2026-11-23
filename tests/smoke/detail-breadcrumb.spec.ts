import { test, expect } from "@playwright/test";

// The breadcrumb in an article's hero is a way back to the questions grid.
// Live Webflow wraps it in `<a href="/ask-the-doctor">`
// (matching/SPEC.md §B.2.5 and the qa interaction table, from
// `detail-qa.html:113`); the rebuild rendered it as plain text, so a visitor
// clicking it went nowhere (operator, 2026-11-20: "view all posts on the blog
// isn't linked"). Its words were live's "Blog / View All Posts" until Tim,
// 2026-11-23: "'ask the doctor' is the actually category and 'View All
// Questions' should be the link".
//
// Since the 2026-11-23 typography pass (the operator's pick, workspace
// decision 2026-11-23-1947-beachfront-faq-typography-direction) only "View All
// Questions" is the link; "Ask the Doctor" beside it is the category, as text.
//
// Asserted the way a visitor meets it: a link by its accessible name, where it
// points, that the keyboard reaches it, and that following it lands on the
// grid. Nothing here reads a class, a size or a colour.
const ARTICLE = "/questions/how-to-stop-a-toothache-fast";
const CRUMB = "View All Questions";

test(
  "an article's hero breadcrumb links back to the questions grid",
  { tag: "@smoke" },
  async ({ page }) => {
    await page.goto(ARTICLE, { waitUntil: "domcontentloaded" });

    const crumb = page.getByRole("link", { name: CRUMB, exact: true });
    await expect(crumb).toHaveAttribute("href", "/ask-the-doctor");
    // The category reads beside it, in the hero, and is not itself a link.
    const hero = page.locator("[data-detail-label]");
    await expect(hero).toContainText("Ask the Doctor");
    await expect(
      hero.getByRole("link", { name: /Ask the Doctor/ }),
    ).toHaveCount(0);

    // Reached by Tab from the top of the page (a `tabindex="-1"` would take
    // it out of the order, which `focus()` would not notice).
    let reached = false;
    for (let i = 0; i < 20 && !reached; i++) {
      await page.keyboard.press("Tab");
      reached = await crumb.evaluate((el) => el === document.activeElement);
    }
    expect(reached, "Tab reaches the breadcrumb link").toBe(true);
    // Not covered by the wave or anything else: `trial` runs Playwright's
    // actionability checks without clicking. After the Tab walk, because the
    // pointer move resets where Chromium's sequential focus starts.
    await crumb.click({ trial: true });
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/ask-the-doctor\/?$/);
  },
);

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test(
    "the article breadcrumb is still a link to the questions grid",
    { tag: "@smoke" },
    async ({ page }) => {
      await page.goto(ARTICLE, { waitUntil: "domcontentloaded" });
      await expect(
        page.getByRole("link", { name: CRUMB, exact: true }),
      ).toHaveAttribute("href", "/ask-the-doctor");
    },
  );
});
