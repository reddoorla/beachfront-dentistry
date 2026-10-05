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
 * the lift is not asserted: probed on this Playwright/Chromium, a running
 * transition can read frozen at its start value in headless, so asserting an
 * eased end state here would be flaky. Under `prefers-reduced-motion` there is
 * no transition to race, which is why the hover assertion below runs reduced —
 * and it is the state that matters most anyway: shadow without movement.
 */

test.describe("the person card is one card-wide link", () => {
  test(
    "the card's link is named for the person",
    { tag: "@smoke" },
    async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto("/our-team");
      const cards = page.locator("article.team-list-item");
      const n = await cards.count();
      expect(n).toBeGreaterThan(1);

      const card = cards.first();
      // WCAG 2.5.3: the visible "Read More" is in the link
      const link = card.getByRole("link").filter({ hasText: "Read More" });
      const label = await link.getAttribute("aria-label");
      const name = (await card.locator("h5").textContent())?.trim() ?? "";
      expect(name.length).toBeGreaterThan(0);
      expect(label).toContain(name); // not eleven links called "Read More"

      // one tab stop per person — it used to be three (headshot, name,
      // READ MORE), i.e. 3n tab stops all announcing the same destination
      const href = await link.getAttribute("href");
      expect(href).toBeTruthy();
      await expect(card.locator(`a[href="${href}"]`)).toHaveCount(1);
    },
  );

  test(
    "the pointer lands on the link over the photo, the name and the body",
    { tag: "@smoke" },
    async ({ page }) => {
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
    },
  );

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

  test(
    "every headshot carries a visible name",
    { tag: "@smoke" },
    async ({ page }) => {
      await page.goto("/");
      expect(
        await page.evaluate(() => matchMedia("(hover: none)").matches),
      ).toBe(true);
      const row = page.locator('section[data-slice-variation="team"]');
      await row.scrollIntoViewIfNeeded();
      // The text each headshot link actually paints: opacity 0 counts as unseen.
      const people = await row.evaluate((section) =>
        [...section.querySelectorAll("a")]
          .filter((a) => a.querySelector("img"))
          .map((a) => {
            let painted = "";
            const w = document.createTreeWalker(a, NodeFilter.SHOW_TEXT);
            for (let n = w.nextNode(); n; n = w.nextNode())
              if (
                n.parentElement?.checkVisibility({
                  opacityProperty: true,
                  visibilityProperty: true,
                })
              )
                painted += n.nodeValue;
            return {
              name: (a.getAttribute("aria-label") ?? "").trim(),
              painted: painted.trim(),
            };
          }),
      );
      expect(people.length).toBeGreaterThan(1);
      for (const p of people) {
        expect(p.name.length).toBeGreaterThan(0);
        expect(p.painted, `${p.name} shows its name`).toContain(p.name);
      }
    },
  );

  test(
    "tapping a name navigates to that person",
    { tag: "@smoke" },
    async ({ page }) => {
      await page.goto("/");
      const row = page.locator('section[data-slice-variation="team"]');
      await row.scrollIntoViewIfNeeded();
      const link = row
        .getByRole("link")
        .filter({ has: page.locator("img") })
        .first();
      const href = await link.getAttribute("href");
      // The centre of the first name the link paints, scrolled into view.
      const at = await link.evaluate((a) => {
        const w = document.createTreeWalker(a, NodeFilter.SHOW_TEXT);
        for (let n = w.nextNode(); n; n = w.nextNode()) {
          const el = n.parentElement;
          if (
            !n.nodeValue?.trim() ||
            !el?.checkVisibility({
              opacityProperty: true,
              visibilityProperty: true,
            })
          )
            continue;
          el.scrollIntoView({ block: "center", behavior: "instant" });
          const r = el.getBoundingClientRect();
          return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
        }
        return null;
      });
      expect(at, "the link paints a name to tap").not.toBeNull();
      await page.touchscreen.tap(at!.x, at!.y);
      await page.waitForURL(`**${href}`);
      expect(new URL(page.url()).pathname).toBe(href);
    },
  );
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
