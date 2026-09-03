import { test, expect, type Page } from "@playwright/test";

// Tucker, 2026-09-02: "transitioning to infinite scroll after the first click
// (in either direction) would be great." The first-visit team slider loops
// SEAMLESSLY: next on the last card slides one step to the first, prev from
// rest slides one step to the last. Before this the slider "looped" by
// rewinding the whole track. At rest nothing changes — the loop engages on the
// first click. Spec:
// docs/superpowers/specs/2026-09-02-team-slider-infinite-loop-and-name-design.md
//
// A rewind and a seamless step both END on the same card, so the end state
// proves nothing. What differs is what is on screen MID-transition: a seamless
// step across the seam shows the last and first cards side by side; a rewind
// races back through the middle of the roster. So motion is ON here (the suite
// default is reduced) and the visible cards are sampled while the track moves.

const REGION = "#meet-our-team";
const CELL = `${REGION} [role="group"][aria-roledescription="slide"]`;

/** Cards on screen, left to right. `minFraction` is how much of a card must be
 *  inside the region to count: 0.5 for a settled frame (a stepped-out card
 *  leaves a 37px sliver at the left edge, which is not "the leftmost card"),
 *  0.1 mid-transition (a card entering from the seam is what we are after). */
async function visibleNames(page: Page, minFraction = 0.5): Promise<string[]> {
  return page.evaluate(
    ({ REGION, CELL, minFraction }) => {
      const region = document.querySelector(REGION)!.getBoundingClientRect();
      return Array.from(document.querySelectorAll(CELL))
        .map((c) => ({
          name: c.querySelector("h5")?.textContent?.trim() ?? "",
          r: c.getBoundingClientRect(),
        }))
        .filter((c) => {
          const shown =
            Math.min(c.r.right, region.right) - Math.max(c.r.left, region.left);
          return c.r.width > 0 && shown / c.r.width >= minFraction;
        })
        .sort((a, b) => a.r.left - b.r.left)
        .map((c) => c.name);
    },
    { REGION, CELL, minFraction },
  );
}

/** Wait until the track's transform is identical across three frames. */
async function settle(page: Page) {
  await page.waitForFunction(
    (CELL) => {
      const track = document.querySelector(CELL)!.parentElement!;
      const w = window as unknown as { __t?: string[] };
      const t = getComputedStyle(track).transform;
      w.__t = [...(w.__t ?? []), t].slice(-3);
      return w.__t.length === 3 && w.__t.every((x) => x === t);
    },
    CELL,
    { polling: "raf", timeout: 5_000 },
  );
  await page.evaluate(() => {
    (window as unknown as { __t?: string[] }).__t = [];
  });
}

test("the first-visit team slider steps across the seam in both directions instead of rewinding", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/your-first-visit", { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.locator(REGION).scrollIntoViewIfNeeded();
  await settle(page);

  // The roster in DOM order. At rest the track is plain — one copy — so this
  // is also the check that nothing is duplicated before the first click.
  const roster = await page.evaluate((CELL) => {
    return Array.from(document.querySelectorAll(CELL)).map(
      (c) => c.querySelector("h5")?.textContent?.trim() ?? "",
    );
  }, CELL);
  expect(new Set(roster).size, "one copy at rest").toBe(roster.length);
  expect(roster.length, "roster size").toBeGreaterThan(4);
  const n = roster.length;
  const first = roster[0];
  const last = roster[n - 1];

  // Rest: the first card leads, at the content gutter it has always sat on.
  const rest = await visibleNames(page);
  expect(rest[0], "leftmost card at rest").toBe(first);
  const firstLeft = await page
    .locator(`${REGION} .team-list-item`, { hasText: first })
    .first()
    .evaluate((el) => el.getBoundingClientRect().left);
  expect(firstLeft, "first card's left edge at 1440").toBeCloseTo(80, 0);

  const next = page.locator(`${REGION} [aria-label="Next slide"]`);
  const prev = page.locator(`${REGION} [aria-label="Previous slide"]`);

  // Forward, one full lap: the leftmost card advances by exactly one every
  // time, including the step from the last card back to the first.
  for (let i = 1; i <= n; i++) {
    await next.click();
    if (i === n) {
      // Mid-transition across the seam: last and first side by side, nothing
      // from the middle of the roster.
      await page.waitForTimeout(150);
      const mid = await visibleNames(page, 0.1);
      expect(mid, "cards on screen while crossing the seam").toContain(last);
      expect(mid, "cards on screen while crossing the seam").toContain(first);
      for (const name of roster.slice(4, n - 1)) {
        expect(
          mid,
          `mid-roster card "${name}" on screen during the seam step`,
        ).not.toContain(name);
      }
    }
    await settle(page);
    const now = await visibleNames(page);
    expect(now[0], `leftmost card after ${i} next-click(s)`).toBe(
      roster[i % n],
    );
  }

  // Backward from rest: one step to the last card, through the seam.
  await page.reload({ waitUntil: "networkidle" });
  await page.locator(REGION).scrollIntoViewIfNeeded();
  await settle(page);
  await prev.click();
  await page.waitForTimeout(150);
  const mid = await visibleNames(page, 0.1);
  expect(mid, "cards on screen while stepping back across the seam").toContain(
    last,
  );
  expect(mid, "cards on screen while stepping back across the seam").toContain(
    first,
  );
  await settle(page);
  expect(
    (await visibleNames(page))[0],
    "leftmost card after prev from rest",
  ).toBe(last);
});

test("the arrows never disable — there is no end to reach", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/your-first-visit", { waitUntil: "networkidle" });
  const next = page.locator(`${REGION} [aria-label="Next slide"]`);
  const prev = page.locator(`${REGION} [aria-label="Previous slide"]`);
  for (let i = 0; i < 14; i++) {
    await next.click();
    await expect(next).not.toHaveAttribute("aria-disabled", "true");
  }
  for (let i = 0; i < 16; i++) {
    await prev.click();
    await expect(prev).not.toHaveAttribute("aria-disabled", "true");
  }
});
