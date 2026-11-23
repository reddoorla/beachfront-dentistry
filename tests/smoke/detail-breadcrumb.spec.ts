import { test, expect } from "@playwright/test";

// The breadcrumb above an article's title is a way back to the questions grid.
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
// Since Tim's Figma of the same afternoon, the crumb is no longer in the
// photo: "moved it out of the image header and just connected it to the main
// title". It is the line directly above the article's h1, on white.
//
// Asserted the way a visitor meets it: a link by its accessible name, where it
// points, that the keyboard reaches it, and that following it lands on the
// grid. Nothing here reads a class, a size or a colour.
const ARTICLE = "/questions/how-to-stop-a-toothache-fast";
const CRUMB = "View All Questions";

test(
  "an article's breadcrumb links back to the questions grid",
  { tag: "@smoke" },
  async ({ page }) => {
    await page.goto(ARTICLE, { waitUntil: "domcontentloaded" });

    const crumb = page.getByRole("link", { name: CRUMB, exact: true });
    await expect(crumb).toHaveAttribute("href", "/ask-the-doctor");
    // The category reads beside it and is not itself a link.
    const line = page.locator("[data-detail-crumb]");
    await expect(line).toContainText("Ask the Doctor");
    await expect(
      line.getByRole("link", { name: /Ask the Doctor/ }),
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

// Where it sits (Tim's Figma, 2026-11-23): joined to the title, not laid over
// the photo. The line holding the link is the h1's own previous sibling, and
// the hero carries no label at all. Putting the crumb back into the image
// header fails both.
test(
  "an article's breadcrumb sits directly above its title, not in the photo",
  { tag: "@smoke" },
  async ({ page }) => {
    await page.goto(ARTICLE, { waitUntil: "domcontentloaded" });
    // Found by a loose name so that a crumb moved back into the photo, in
    // whatever words, fails on where it is rather than on what it says.
    const crumb = page.getByRole("link", { name: /View All Questions/i });
    const placement = await crumb.evaluate((a) => {
      const h1 = document.querySelector("main h1, h1");
      const line = a.closest("p, div, nav");
      return {
        precedesTitle: !!h1 && h1.previousElementSibling === line,
        inHero: !!a.closest("[data-detail-label]"),
      };
    });
    expect(
      placement.precedesTitle,
      "the crumb's line is right above the h1",
    ).toBe(true);
    expect(placement.inHero, "the crumb is not in the hero").toBe(false);
    await expect(page.locator("[data-detail-label]")).toHaveCount(0);
  },
);
