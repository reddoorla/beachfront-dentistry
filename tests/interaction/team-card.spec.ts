import { test, expect } from "@playwright/test";

/**
 * Two defects that no gate on this project could see, because both live in
 * an INPUT MODE the gates never emulate:
 *
 *  1. the /our-team person cards were three links to one route with no
 *     pointer response at all — the page's only navigation looked inert;
 *  2. the home team row's names were a hover reveal, and Tailwind v4 wraps
 *     `group-hover:` in `@media (hover: hover)`, so on every phone and tablet
 *     the row that introduces the staff introduced nobody.
 *
 * These assert the parts that are deterministic headless. The ANIMATION of
 * the lift is asserted as a class contract in CollectionList.test.ts instead:
 * probed on this Playwright/Chromium, a running transition can read frozen at
 * its start value in headless, so asserting an eased end state here would be
 * flaky. Under `prefers-reduced-motion` there is no transition to race, which
 * is why the hover assertion below runs reduced — and it is the state that
 * matters most anyway: shadow without movement.
 */

test.describe("the person card is one card-wide link", () => {
  test("one link per card, named for the person, with a ring that hugs its words", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/our-team");
    const cards = page.locator("article.team-list-item");
    const n = await cards.count();
    expect(n).toBeGreaterThan(1);

    // one accessible link per card — it used to be three (headshot, name,
    // READ MORE), i.e. 3n tab stops all announcing the same destination
    expect(await page.locator("section.team-grid-section a").count()).toBe(n);

    const card = cards.first();
    const link = card.locator("a");
    const label = await link.getAttribute("aria-label");
    const name = (await card.locator("h5").textContent())?.trim() ?? "";
    expect(name.length).toBeGreaterThan(0);
    expect(label).toContain(name); // not eleven links called "Read More"
    expect(await link.textContent()).toContain("Read More"); // WCAG 2.5.3

    // the focus ring paints on the link's own box: it must hug the words, not
    // draw a near-card-width rectangle around 131px of text
    const lb = (await link.boundingBox())!;
    const cb = (await card.boundingBox())!;
    expect(lb.width).toBeLessThan(cb.width * 0.5);

    // the photo and the name are outside the link (no nested interactives)
    expect(
      await card
        .locator("img")
        .first()
        .evaluate((el) => !!el.closest("a")),
    ).toBe(false);
    expect(
      await card
        .locator("h5")
        .first()
        .evaluate((el) => !!el.closest("a")),
    ).toBe(false);
  });

  test("the pointer lands on the link over the photo, the name and the body", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/our-team");
    const card = page.locator("article.team-list-item").first();
    await card.scrollIntoViewIfNeeded();
    for (const sel of ["img", "h5", "p"]) {
      const box = (await card.locator(sel).first().boundingBox())!;
      const hit = await page.evaluate(
        ([x, y]) => {
          const el = document.elementFromPoint(x as number, y as number);
          return {
            link: !!el?.closest("a"),
            cursor: el ? getComputedStyle(el).cursor : "",
          };
        },
        [box.x + box.width / 2, box.y + box.height / 2],
      );
      expect(hit, `${sel} is part of the card link`).toEqual({
        link: true,
        cursor: "pointer",
      });
    }
  });

  test("reduced motion keeps the state and drops the movement", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/our-team");
    const card = page.locator("article.team-list-item").first();
    await card.scrollIntoViewIfNeeded();
    const state = () =>
      card.evaluate((el) => {
        const s = getComputedStyle(el);
        return { lift: s.translate, shadowed: s.boxShadow !== "none" };
      });
    expect(await state()).toEqual({ lift: "none", shadowed: false });

    const photo = (await card.locator("img").first().boundingBox())!;
    await page.mouse.move(
      photo.x + photo.width / 2,
      photo.y + photo.height / 2,
    );
    await expect.poll(async () => (await state()).shadowed).toBe(true);
    // the shadow says "interactive"; nothing jumps, which is the point of the
    // preference (app.css clamps durations to 0.01ms, so an unpinned
    // translate would snap 4px rather than ease)
    expect((await state()).lift).toBe("0px");
  });
});

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

// Tucker, 2026-09-02: "Dr. Michael Hopkins goes to two lines on his card, can
// we relax the padding on that name, it can go a bit wider than the text if it
// keeps everything inline height wise." The widest name is 295px on one line;
// the slider card's text column is 292px at every desktop width (340px card,
// 24px side padding). The name's box may extend into that padding; a name
// that still does not fit wraps and the card grows (ROUND C), so this holds
// the ROW level rather than forbidding growth outright. Spec:
// docs/superpowers/specs/2026-09-02-team-slider-infinite-loop-and-name-design.md
test.describe("the slider card row stays level", () => {
  for (const width of [1440, 1200, 1024]) {
    test(`@${width}: no name wraps and every card is the same height`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/your-first-visit", { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);
      const r = await page.evaluate(() => {
        const cards = Array.from(
          document.querySelectorAll("#meet-our-team .team-list-item"),
        );
        const heights = cards.map((c) => c.getBoundingClientRect().height);
        const wrapped: string[] = [];
        for (const c of cards) {
          const h = c.querySelector("h5");
          if (!h) continue;
          const range = document.createRange();
          range.selectNodeContents(h);
          const tops = new Set(
            Array.from(range.getClientRects()).map((x) => Math.round(x.top)),
          );
          if (tops.size > 1)
            wrapped.push(`${h.textContent?.trim()} (${tops.size} lines)`);
        }
        return {
          cards: cards.length,
          wrapped,
          spread: Math.max(...heights) - Math.min(...heights),
        };
      });
      expect(r.cards, "slider cards present").toBeGreaterThan(1);
      expect(r.wrapped, "names on more than one line").toEqual([]);
      expect(r.spread, "card height spread across the row").toBeLessThan(1);
    });
  }
});
