import { test, expect } from "@playwright/test";

// The "Blog / View All Posts" breadcrumb in an article's hero is a way back to
// the posts grid. Live Webflow wraps it in `<a href="/ask-the-doctor">`
// (matching/SPEC.md §B.2.5 and the qa interaction table, from
// `detail-qa.html:113`); the rebuild rendered it as plain text, so a visitor
// clicking it went nowhere (operator, 2026-11-20: "view all posts on the blog
// isn't linked").
//
// Asserted the way a visitor meets it: a link by its accessible name, where it
// points, that the keyboard reaches it, and that following it lands on the
// grid. Nothing here reads a class, a size or a colour.
const ARTICLE = "/questions/how-to-stop-a-toothache-fast";
const CRUMB = "Blog / View All Posts";

test(
  "an article's hero breadcrumb links back to the posts grid",
  { tag: "@smoke" },
  async ({ page }) => {
    await page.goto(ARTICLE, { waitUntil: "domcontentloaded" });

    const crumb = page.getByRole("link", { name: CRUMB, exact: true });
    await expect(crumb).toHaveAttribute("href", "/ask-the-doctor");

    await crumb.focus();
    await expect(crumb).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/ask-the-doctor\/?$/);
  },
);

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test(
    "the article breadcrumb is still a link to the posts grid",
    { tag: "@smoke" },
    async ({ page }) => {
      await page.goto(ARTICLE, { waitUntil: "domcontentloaded" });
      await expect(
        page.getByRole("link", { name: CRUMB, exact: true }),
      ).toHaveAttribute("href", "/ask-the-doctor");
    },
  );
});
