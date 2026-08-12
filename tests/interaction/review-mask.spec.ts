import { test, expect, type Page } from "@playwright/test";

// ROUND G4 CONTRACT — the review slider's motion is Tim's redesign (MarkUp
// thread 29e4fcac-8dee-4cfe-a3f5-4ef9e4c79524, home board pin #5; operator
// directive: follow Tim over live). Tim: "the light blue background stays
// the same … the content, all except for the overlapping logo, slides out
// as if this light blue background was a mask … the overlapping logo …
// just dissolves."
//
// Live's own carousel translates the WHOLE card (`.big-review-slider`
// transition transform 2s cubic-bezier(.19,1,.22,1), beachfront.css:
// 7563-7572), so the quote slid across the holder and "randomly
// disappear[ed]" at its clip edge. The G4 mask carousel in
// src/lib/slices/Carousel/index.svelte overrides that by design direction,
// and this suite pins the new contract:
//   1. scroll-rest: the pale-blue card is untransformed and the track sits
//      at identity — the static gate captures depend on the resting render
//      byte-for-byte;
//   2. during a Next transition the card and the badge never move: only the
//      track's transform is mid-flight, and it settles at exactly one card
//      width (the mask clips the slide at the card's own box — probing just
//      outside both card edges never hits track content);
//   3. the badge layer cross-dissolves in place (wrapper opacities cross
//      between 0 and 1, rects frozen) — Tim's simpler "just dissolves"
//      variant, chosen over the slide-down/up alternative;
//   4. a full wrap-around cycle returns to a pixel-identical resting state;
//   5. prefers-reduced-motion: the swap is instant (src/app.css:490-497
//      flattens both transitions) — no glide is ever observable.
//
// The home teaser's team slider answers "Next slide" too and sits EARLIER
// in the DOM, so every selector here is scoped to the review section.

const VIEWPORT = { width: 1440, height: 900 };
const SECTION = '[data-slice-variation="review"]';
const NEXT = `${SECTION} button[aria-label="Next slide"]`;

type Rect = { x: number; y: number; w: number; h: number };

const gotoReviews = async (page: Page) => {
  await page.setViewportSize(VIEWPORT);
  await page.goto("/", { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate((sel) => {
    document
      .querySelector(sel)
      ?.scrollIntoView({ block: "center", behavior: "instant" });
  }, SECTION);
  // Let the section's one-shot entrance reveal finish (same probe rule as
  // float-drift.spec.ts: an unrevealed block's rects move on their own).
  await page.waitForTimeout(1400);
};

/** Card rect, track transform, badge-wrapper rects/opacities, and
 *  just-outside-the-card hit tests, all in one atomic evaluate. */
const state = (page: Page) =>
  page.evaluate((sel) => {
    const section = document.querySelector(sel)!;
    const track = section.querySelector<HTMLElement>(".transition-transform")!;
    const mask = track.parentElement!;
    const card = mask.parentElement!;
    const r = (el: Element): Rect => {
      const b = el.getBoundingClientRect();
      return { x: b.x, y: b.y, w: b.width, h: b.height };
    };
    const cb = card.getBoundingClientRect();
    const hitsTrack = (x: number, y: number) => {
      const hit = document.elementFromPoint(x, y);
      return !!hit && track.contains(hit);
    };
    const tx = (() => {
      const t = getComputedStyle(track).transform;
      if (t === "none") return 0;
      const m = /matrix\(1, 0, 0, 1, (-?[\d.]+), 0\)/.exec(t);
      return m ? parseFloat(m[1]!) : NaN;
    })();
    return {
      card: r(card),
      maskOverflow: getComputedStyle(mask).overflow,
      tx,
      badges: [
        ...card.querySelectorAll<HTMLElement>(":scope > div.absolute"),
      ].map((w) => ({
        rect: r(w),
        opacity: parseFloat(getComputedStyle(w).opacity),
      })),
      leftHitsTrack: hitsTrack(cb.x - 15, cb.y + cb.height / 2),
      rightHitsTrack: hitsTrack(cb.x + cb.width + 15, cb.y + cb.height / 2),
    };
  }, SECTION);

type State = Awaited<ReturnType<typeof state>>;

const expectStill = (sample: State, rest: State) => {
  // The card is the mask: it must not move by a fraction of a pixel…
  expect(sample.card).toEqual(rest.card);
  // …and neither may any badge wrapper (they dissolve, never translate).
  expect(sample.badges.map((b) => b.rect)).toEqual(
    rest.badges.map((b) => b.rect),
  );
  // Nothing of the sliding content is visible outside the card's box.
  expect(sample.leftHitsTrack).toBe(false);
  expect(sample.rightHitsTrack).toBe(false);
};

test("scroll-rest: card untransformed, track at identity, one badge exposed", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await gotoReviews(page);
  const rest = await state(page);
  expect(rest.tx).toBe(0);
  expect(rest.maskOverflow).toBe("hidden");
  // 1440: live .big-review geometry — 600x400 (SPEC.md §4.3).
  expect(rest.card.w).toBe(600);
  expect(rest.card.h).toBe(400);
  const exposed = rest.badges.filter((b) => b.opacity === 1);
  expect(exposed).toHaveLength(1);
  const cardStyle = await page.evaluate((sel) => {
    const track = document
      .querySelector(sel)!
      .querySelector<HTMLElement>(".transition-transform")!;
    const card = track.parentElement!.parentElement as HTMLElement;
    return {
      inline: card.style.transform,
      computed: getComputedStyle(card).transform,
    };
  }, SECTION);
  expect(cardStyle.inline).toBe("");
  expect(cardStyle.computed).toBe("none");
});

test("Next: the card is the mask — content glides inside it, card and badge frozen", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await gotoReviews(page);
  const rest = await state(page);

  await page.click(NEXT);

  // Mid-flight samples are SCRUBBED, not raced. Sampling by wall clock
  // ("read at 300ms") assumes the transition has progressed as far as the
  // clock says, which is false whenever the machine is busy: under a full
  // parallel suite the read can land after the 2s glide already settled,
  // and a settled `tx` fails the strictly-between assertion below. So pause
  // the CSSTransitions the click created and set their currentTime — the
  // browser then reports exactly the frame we asked for, on any hardware.
  // The transitions exist only once the click's style change is recalculated,
  // so wait for them rather than assuming they are already running.
  await page.waitForFunction(
    (sel) =>
      (document.querySelector(sel) as Element).getAnimations({ subtree: true })
        .length > 0,
    SECTION,
  );
  const scrubTo = async (fraction: number) => {
    await page.evaluate(
      ([sel, f]) => {
        const section = document.querySelector(sel as string)!;
        for (const anim of section.getAnimations({ subtree: true })) {
          const duration = anim.effect?.getComputedTiming().duration;
          if (typeof duration !== "number" || duration === 0) continue;
          anim.pause();
          anim.currentTime = (f as number) * duration;
        }
      },
      [SECTION, fraction] as const,
    );
    return state(page);
  };

  // 15% / 40% / 70% of the glide: the track transform is strictly between
  // the endpoints while everything static holds still.
  const a = await scrubTo(0.15);
  const b = await scrubTo(0.4);
  const c = await scrubTo(0.7);
  for (const s of [a, b, c]) expectStill(s, rest);
  for (const s of [a, b]) {
    expect(s.tx).toBeLessThan(0);
    expect(s.tx).toBeGreaterThan(-rest.card.w);
  }
  // The glide is monotone toward exactly one card width…
  expect(b.tx).toBeLessThanOrEqual(a.tx);
  expect(c.tx).toBeLessThanOrEqual(b.tx);
  // Let the paused transitions run to their end and commit — `finish()` puts
  // each at its end frame without waiting out the remaining wall-clock time.
  await page.evaluate((sel) => {
    for (const anim of document
      .querySelector(sel)!
      .getAnimations({ subtree: true }))
      anim.finish();
  }, SECTION);
  const settled = await state(page);
  expectStill(settled, rest);
  expect(settled.tx).toBe(-rest.card.w);

  // …while the badge layer cross-dissolved in place: at both mid samples the
  // outgoing wrapper is mid-fade and the incoming one is its complement
  // rising, and they land swapped.
  for (const s of [a, b]) {
    expect(s.badges[0]!.opacity).toBeGreaterThan(0);
    expect(s.badges[0]!.opacity).toBeLessThan(1);
    expect(s.badges[1]!.opacity).toBeGreaterThan(0);
    expect(s.badges[1]!.opacity).toBeLessThan(1);
  }
  expect(b.badges[0]!.opacity).toBeLessThan(a.badges[0]!.opacity);
  expect(b.badges[1]!.opacity).toBeGreaterThan(a.badges[1]!.opacity);
  expect(settled.badges[0]!.opacity).toBe(0);
  expect(settled.badges[1]!.opacity).toBe(1);
});

test("a full wrap-around cycle returns to a pixel-identical resting state", async ({
  page,
}) => {
  test.setTimeout(60_000);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await gotoReviews(page);
  const clip = await page.evaluate((sel) => {
    const b = document
      .querySelector(sel)!
      .querySelector('[aria-roledescription="carousel"]')!
      .getBoundingClientRect();
    const x = Math.max(0, b.x - 40);
    const y = Math.max(0, b.y - 60);
    return {
      x,
      y,
      width: Math.min(innerWidth - x, b.width + 80),
      height: Math.min(innerHeight - y, b.height + 110),
    };
  }, SECTION);
  const before = await page.screenshot({ clip });
  for (let i = 0; i < 5; i++) {
    await page.click(NEXT);
    await page.waitForTimeout(2250);
  }
  // Park the mouse off the arrow: its hover tint (transition-colors 200ms)
  // is real paint and would fail the comparison for the wrong reason.
  await page.mouse.move(5, 5);
  await page.waitForTimeout(600);
  const after = await page.screenshot({ clip });
  expect(after.equals(before)).toBe(true);
});

test("prefers-reduced-motion: the swap is instant — no glide, no dissolve", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await gotoReviews(page);
  const rest = await state(page);
  await page.click(NEXT);
  await page.waitForTimeout(150);
  const s = await state(page);
  expectStill(s, rest);
  // Already settled: app.css's global reduce reset flattens the 2s glide and
  // the 2s dissolve to 0.01ms.
  expect(s.tx).toBe(-rest.card.w);
  expect(s.badges[0]!.opacity).toBe(0);
  expect(s.badges[1]!.opacity).toBe(1);
});
