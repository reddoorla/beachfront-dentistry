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
/** The Slider's edge fades (EDGE_FADE_WIDTH): a card under one is not yet
 *  seen, so its reveal waits — the checks below look past the bands. */
const FADE = 80;

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

/** The cards on screen, with their computed opacity and whether the reveal
 *  action still holds them hidden. Same visibility rule as `visibleNames`. */
async function visibleCards(page: Page, minFraction = 0.5) {
  return page.evaluate(
    ({ REGION, CELL, minFraction }) => {
      const region = document.querySelector(REGION)!.getBoundingClientRect();
      return Array.from(document.querySelectorAll(CELL))
        .map((c) => {
          const card = c.querySelector<HTMLElement>(".team-list-item");
          return {
            name: c.querySelector("h5")?.textContent?.trim() ?? "",
            r: c.getBoundingClientRect(),
            opacity: card ? Number(getComputedStyle(card).opacity) : NaN,
            waiting: card?.hasAttribute("data-reveal") ?? false,
          };
        })
        .filter((c) => {
          const shown =
            Math.min(c.r.right, region.right) - Math.max(c.r.left, region.left);
          return c.r.width > 0 && shown / c.r.width >= minFraction;
        })
        .sort((a, b) => a.r.left - b.r.left)
        .map(({ name, opacity, waiting }) => ({ name, opacity, waiting }));
    },
    { REGION, CELL, minFraction },
  );
}

/** Wait until every card showing past the edge fades is fully revealed. */
async function revealed(page: Page) {
  await page.waitForFunction(
    ({ REGION, CELL, FADE }) => {
      const region = document.querySelector(REGION)!.getBoundingClientRect();
      return Array.from(document.querySelectorAll(CELL)).every((c) => {
        const r = c.getBoundingClientRect();
        const shown =
          Math.min(r.right, region.right - FADE) -
          Math.max(r.left, region.left + FADE);
        if (shown <= 0) return true;
        const card = c.querySelector<HTMLElement>(".team-list-item");
        return (
          !!card &&
          !card.hasAttribute("data-reveal") &&
          getComputedStyle(card).opacity === "1"
        );
      });
    },
    { REGION, CELL, FADE },
    { polling: "raf", timeout: 8_000 },
  );
}

// Tucker, 2026-09-02, on the deploy preview: "if I click left twice the
// second click retriggers a fadein from all visible items … please fix that",
// and "double the length of the transition in for items that are initially
// hidden". Each person is up to three cells on the infinite track and shares
// ONE entrance: the cell that slides in first fades (over 2×, being off screen
// at rest); the person's other cells never do — the snap before the second
// click teleports one of them into the exact spot the reader is looking at.
test("a second prev click fades nothing the reader is already looking at", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/your-first-visit", { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.locator(REGION).scrollIntoViewIfNeeded();
  await settle(page);
  await revealed(page);

  const roster = await page.evaluate((CELL) => {
    return Array.from(document.querySelectorAll(CELL)).map(
      (c) => c.querySelector("h5")?.textContent?.trim() ?? "",
    );
  }, CELL);
  const n = roster.length;
  const prev = page.locator(`${REGION} [aria-label="Previous slide"]`);

  // First prev: the last card, off screen at rest, slides in AND fades in —
  // its first appearance. Sampled mid-transition.
  await prev.click();
  await page.waitForTimeout(150);
  const entering = (await visibleCards(page, 0.1)).find(
    (c) => c.name === roster[n - 1],
  );
  expect(entering, "the last card is entering").toBeDefined();
  expect(
    entering!.opacity,
    "the last card fades in on its first appearance",
  ).toBeLessThan(1);
  await settle(page);
  await revealed(page);
  // The cards fully on screen; each stays at least partly on screen through
  // the next step, where it is sampled again.
  const before = await visibleCards(page, 0.99);
  expect(before.map((c) => c.name)[0]).toBe(roster[n - 1]);
  expect(before.length).toBeGreaterThanOrEqual(3);

  // Second prev: every card that was on screen stays at full opacity through
  // the step; only the newly entering card (its own first appearance) fades.
  await prev.click();
  await page.waitForTimeout(150);
  const during = await visibleCards(page, 0.1);
  for (const was of before) {
    const now = during.find((c) => c.name === was.name);
    expect(now, `"${was.name}" still on screen mid-step`).toBeDefined();
    expect(now!.opacity, `"${was.name}" opacity during the second prev`).toBe(
      1,
    );
    expect(
      now!.waiting,
      `"${was.name}" held hidden during the second prev`,
    ).toBe(false);
  }
  const fresh = during.find((c) => c.name === roster[n - 2]);
  expect(fresh, "the second-to-last card is entering").toBeDefined();
  expect(
    fresh!.opacity,
    "the second-to-last card fades in on its first appearance",
  ).toBeLessThan(1);
  await settle(page);
  await revealed(page);
});

test("the card slider fades at its edges like the headshot row", async ({
  page,
}) => {
  // Tucker, 2026-09-02: "for the full boxes, add the fade effect on the
  // edges that we have on the pure headshot carousel." Desktop only, as on
  // the headshot row: live collapses its gradients at mobile.
  const fades = page.locator(
    `${REGION} [aria-roledescription="carousel"] > div[aria-hidden="true"][style*="linear-gradient"]`,
  );
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/your-first-visit", { waitUntil: "networkidle" });
  await expect(fades).toHaveCount(2);
  const boxes = await fades.evaluateAll((els) =>
    els.map((el) => {
      const r = el.getBoundingClientRect();
      const track = el.parentElement!.getBoundingClientRect();
      return {
        display: getComputedStyle(el).display,
        left: r.left,
        right: r.right,
        width: r.width,
        top: r.top - track.top,
        height: r.height,
        trackHeight: track.height,
      };
    }),
  );
  expect(boxes.map((b) => b.display)).toEqual(["block", "block"]);
  expect(boxes[0].left, "left fade at the screen edge").toBe(0);
  expect(boxes[1].right, "right fade at the screen edge").toBe(1440);
  for (const b of boxes) {
    expect(b.width, "fade width").toBe(80);
    expect(b.top, "fade spans the track").toBe(0);
    expect(b.height, "fade spans the track").toBe(b.trackHeight);
  }
  await page.setViewportSize({ width: 834, height: 900 });
  await expect(fades.first()).toBeHidden();
  await expect(fades.last()).toBeHidden();
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
