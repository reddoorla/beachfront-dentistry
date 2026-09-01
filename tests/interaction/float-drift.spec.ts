import { test, expect, type Page } from "@playwright/test";

// ROUND G3 CONTRACT — the floating doctor+handwriting pair drifts
// CONTINUOUSLY with scroll (MarkUp thread a7c2e0d0-5e13-4cfd-bb17-a21ecee7b188,
// home board pin #7; operator directive 2026-08-11: Tim over live). Tim: "I
// like the user experience of 'Ask The Doctor' and the [floating Doctor
// image] of the original site. I do not like the jumping from question to
// question."
//
// Live's floating-doc.js hopped the pair per-question to the bottom-most
// fully visible card, glided by `.ask-the-doctor-handwriting-anchor
// { transition: transform 1s cubic-bezier(.19,1,.22,1) }`
// (beachfront.css:7670) — a step function of scroll: the probed BEFORE showed
// 420px jumps inside a single 25px scroll step.
//
// TWO LATER DIRECTIVES (both 2026-08-13) settled where it sits and how:
// "anchor to the top fully visible question rather than the bottom one", then,
// after that shipped, "it should sit in the same place for each card". The
// second one is why the target is QUANTIZED again. Continuous interpolation
// pins the pair to a fixed SCREEN position and lets the cards slide past it —
// measured on the deployed builds, its offset within a card swept ±190px at
// BOTH tracking lines, so it spent most of the scroll straddling a card gap.
// Travelling with a card requires a target that does not move while that card
// owns the viewport top.
//
// ROUND I1 SUPERSEDES THE MECHANISM ABOVE (2026-09-01, MarkUp thread
// 717b8986-6da3-4a60-9788-14dd67c85f75, home pin #15). Tim, third pass on this
// one behaviour: "I still don't like how jittery the doctor's photo and the ask
// the doctor handwriting moves down from one question to the next. I just
// wanted to move smoothly down as you scroll."
//
// The quantized target put the pair in the right PLACE and gave it the wrong
// MOTION, and the rAF follow could not fix that because it smoothed in TIME:
// it softened the handover's edges but never its SIZE. Probed at 1440 in 40px
// scroll steps: 57 of 87 steps moved the pair 0px, and each handover then moved
// it ~345px inside a SINGLE step — 8.6x the input.
//
// Position is now a pure, continuous function of SCROLL: hold a card's offset
// for the first 30% of that card's pitch, then glide to the next across the
// remaining 70% on a smoothstep, landing exactly as the index advances. Both
// standing directives survive — (3) "the same place for each card" as the
// holds, (1)/(4) "no jumping / smooth" by construction, since output continuous
// in input admits no step. Measured after: worst 85.2px per 40px step (2.13x,
// the designed peak of 1.5/0.7), 44 of 87 steps still perfectly still.
//
// This suite pins that contract:
//   1. scroll 0: the pair's authored rest state is untouched (no transform) —
//      the static gate captures depend on it byte-for-byte;
//   2. continuous in scroll: no scroll step commands disproportionate travel
//      (<=2.5x), AND the pair still HOLDS on a meaningful share of steps, so a
//      mapping that went fully continuous — which directive 3 rejected — fails
//      just as a quantized one does. Monotone, and it covers the column, so
//      neither assertion can go vacuous;
//   3. the handover is spread across SCROLL, sampled in scroll rather than in
//      time: intermediate positions exist, and no 15px notch moves the pair
//      more than a modest share of the 420px pitch;
//   4. nothing moves while the page is still — the property that makes a
//      time-decayed catch-up impossible to reintroduce silently;
//   5. bounds: past the column the pair clamps exactly to the last item's
//      offset — it never leaves the column;
//   6. opening a card mid-drift does not move the pair (G2's frozen cards
//      keep every item offset, so the mapping's input never changes);
//   7. prefers-reduced-motion: the pair is pinned statically at rest — no
//      listeners, no transform, no drift.
//
// The pair mounts ONLY on the home teaser: live's /ask-the-doctor page has no
// `.ask-the-doctor-handwriting-anchor` at all (SPEC.md D.4 — FloatingDoctor
// throws there and must not be ported), so the numbered variation is guarded
// pair-free below.

const VIEWPORT = { width: 1440, height: 900 };

const pairTy = (page: Page) =>
  page.evaluate(() => {
    const pair = document.querySelector(
      ".ask-the-doctor-headshot",
    )?.parentElement;
    if (!pair) return null;
    const t = (pair as HTMLElement).style.transform;
    if (!t) return 0;
    const m = /translateY\((-?[\d.]+)px\)/.exec(t);
    return m ? parseFloat(m[1]!) : NaN;
  });

/** Poll the pair's transform until it is stable across two 150ms reads (the
 *  rAF follow snaps to its exact target when settled, so this converges). */
const settledTy = async (page: Page): Promise<number> => {
  let prev: number | null = null;
  for (let i = 0; i < 20; i++) {
    await page.waitForTimeout(150);
    const v = await pairTy(page);
    if (v !== null && v === prev) return v;
    prev = v;
  }
  return prev ?? NaN;
};

const gotoHome = async (page: Page) => {
  await page.setViewportSize(VIEWPORT);
  await page.goto("/", { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
};

test("scroll 0: the pair rests in its authored position, untransformed", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await gotoHome(page);
  const state = await page.evaluate(() => {
    const pair = document.querySelector(
      ".ask-the-doctor-headshot",
    )?.parentElement;
    if (!pair) return null;
    return {
      inline: (pair as HTMLElement).style.transform,
      computed: getComputedStyle(pair).transform,
    };
  });
  expect(state).not.toBeNull();
  expect(state!.inline).toBe("");
  expect(state!.computed).toBe("none");
});

test("the pair glides continuously in scroll, rests between cards, monotone and column-bounded", async ({
  page,
}) => {
  test.setTimeout(180_000);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await gotoHome(page);

  // Fire every entrance reveal first (animateIn is one-shot — its observer
  // disconnects after revealing) by scrolling THROUGH the page in
  // half-viewport steps: an instant jump to the bottom never intersects the
  // mid-page items, so their reveals would otherwise fire one by one DURING
  // the sweep. The `.qa-item`s themselves carry the reveal transform, so an
  // unrevealed card's rect moves on its own for ~1s and the sweep would
  // measure that reveal motion on top of the drift this contract is about.
  await page.evaluate(async () => {
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
    for (let y = 0; y <= document.body.scrollHeight; y += innerHeight / 2) {
      window.scrollTo({ top: y, behavior: "instant" });
      await sleep(60);
    }
    window.scrollTo({ top: 0, behavior: "instant" });
  });
  await page.waitForTimeout(1500);
  await settledTy(page);

  const range = await page.evaluate(() => {
    const pair = document.querySelector(
      ".ask-the-doctor-headshot",
    )!.parentElement!;
    const items = [...pair.parentElement!.querySelectorAll(".qa-item")];
    // Handovers happen as each item's TOP crosses y=0, so the window runs from
    // just before the first item's top reaches it to just after the last one's.
    const topOf = (el: Element) => el.getBoundingClientRect().top + scrollY;
    const first = items[0] as HTMLElement;
    const last = items[items.length - 1] as HTMLElement;
    return {
      start: Math.max(0, Math.round(topOf(first) - 50)),
      end: Math.round(topOf(last) + 50),
      colTravel: last.offsetTop - first.offsetTop,
      // the card ladder the glide interpolates between
      stops: (items as HTMLElement[]).map(
        (el) => el.offsetTop - first.offsetTop,
      ),
    };
  });
  expect(range.colTravel).toBeGreaterThan(500);
  expect(range.stops.length).toBeGreaterThanOrEqual(4);

  // Settle fully at the sweep's first position: the reveal animations shift
  // the cards between load and first paint, so the mapping can already be
  // >0 here — without this, the first samples measure the follow's catch-up
  // transient instead of the drift the contract is about.
  await page.evaluate(
    (y) => window.scrollTo({ top: y, behavior: "instant" }),
    range.start,
  );
  await settledTy(page);

  // Sampled at a 60px scroll increment — seven samples per 420px card, so
  // neither a hold nor a glide can hide between them.
  //
  // No settle wait is needed any more, and that is itself the point: nothing
  // is animated in time, so one frame after the scroll the position is final.
  // The 1500ms this used to need was for the exponential follow that no longer
  // exists.
  const step = 60;
  const samples: number[] = [];
  for (let y = range.start; y <= range.end; y += step) {
    await page.evaluate(
      (y) => window.scrollTo({ top: y, behavior: "instant" }),
      y,
    );
    await page.waitForTimeout(120);
    samples.push((await pairTy(page))!);
  }
  expect(samples.length).toBeGreaterThanOrEqual(30);

  const deltas = samples
    .slice(1)
    .map((v, i) => Math.round((v - samples[i]!) * 100) / 100);

  // 1. CONTINUOUS IN SCROLL — the property pin #15 is about. A `step` of
  // scroll may never command a disproportionate amount of travel. The mapping
  // holds for 30% of a card's pitch and glides across the other 70% on a
  // smoothstep, whose peak slope is 1.5, so the designed worst case is
  // 1.5/0.7 = 2.14x the scroll. 2.5x is that with headroom, and it is still
  // FAR below what the quantized mapping scored here: ~345px inside a single
  // 40px step, i.e. 8.6x.
  const worst = Math.max(...deltas.map(Math.abs));
  expect(
    worst,
    `worst travel per ${step}px of scroll: ${worst}px`,
  ).toBeLessThanOrEqual(step * 2.5);

  // 2. …but NOT merely continuous: it still rests. Directive 3 ("it should sit
  // in the same place for each card") survives as the holds between glides, so
  // a mapping that had gone fully continuous — the thing directive 3 rejected —
  // fails here even though it would sail through (1).
  const held = deltas.filter((d) => Math.abs(d) < 0.5).length;
  expect(
    held / deltas.length,
    `fraction of scroll steps where the pair holds still: ${held}/${deltas.length}`,
  ).toBeGreaterThanOrEqual(0.15);

  // 3. monotone (never drifts back up while scrolling down)…
  for (const d of deltas) expect(d).toBeGreaterThanOrEqual(-0.5);
  // …the pair really travelled the column, so none of this is vacuous…
  const travelled = samples[samples.length - 1]! - samples[0]!;
  expect(travelled).toBeGreaterThan(range.colTravel * 0.8);
  // …it moved through more than one card…
  expect(new Set(samples).size).toBeGreaterThanOrEqual(3);
  // …it never left the column…
  expect(Math.max(...samples)).toBeLessThanOrEqual(range.colTravel + 0.5);
  // …and every sample sits on the ladder or between two of its rungs, so the
  // glide interpolates the same stops the quantized mapping used to land on
  // rather than inventing positions outside them.
  for (const v of samples) {
    expect(v).toBeGreaterThanOrEqual(-0.5);
    expect(v).toBeLessThanOrEqual(range.colTravel + 0.5);
  }

  // 4. NOTHING MOVES WHILE THE PAGE IS STILL. Position is a pure function of
  // scroll, so holding the page steady must hold the pair steady — this is
  // what makes a time-decayed catch-up (the old mechanism) impossible to
  // reintroduce without failing a test.
  await page.evaluate(
    (y) => window.scrollTo({ top: y, behavior: "instant" }),
    Math.round((range.start + range.end) / 2),
  );
  await page.waitForTimeout(150);
  const still = (await pairTy(page))!;
  await page.waitForTimeout(700);
  expect(await pairTy(page)).toBe(still);

  // Past the column the pair clamps exactly to the last item's offset.
  await page.evaluate(
    (y) => window.scrollTo({ top: y, behavior: "instant" }),
    range.end + 600,
  );
  expect(await settledTy(page)).toBe(range.colTravel);
});

test("the handover is spread across scroll, not concentrated in one step", async ({
  page,
}) => {
  test.setTimeout(180_000);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await gotoHome(page);
  await page.evaluate(async () => {
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
    for (let y = 0; y <= document.body.scrollHeight; y += innerHeight / 2) {
      window.scrollTo({ top: y, behavior: "instant" });
      await sleep(60);
    }
    window.scrollTo({ top: 0, behavior: "instant" });
  });
  await page.waitForTimeout(1500);

  // Park just BEFORE item 2's top reaches the line, and settle on item 2.
  const marks = await page.evaluate(() => {
    const items = [...document.querySelectorAll<HTMLElement>(".qa-item")];
    const first = items[0]!;
    return {
      before: Math.round(items[2]!.getBoundingClientRect().top + scrollY) - 8,
      after: Math.round(items[2]!.getBoundingClientRect().top + scrollY) + 8,
      from: items[2]!.offsetTop - first.offsetTop,
      to: items[3]!.offsetTop - first.offsetTop,
      pitch: items[2]!.offsetTop - items[1]!.offsetTop,
    };
  });
  // The handover is spread across SCROLL, so it is sampled in scroll — not in
  // time. This is the substantive change from the version this replaces, which
  // parked either side of the handover and sampled fast enough to catch the
  // rAF follow's intermediate FRAMES. That proved the render was smoothed; it
  // could not see that one notch of wheel still commanded a whole card of
  // travel, which is the thing pin #15 was actually about.
  // The glide runs FORWARD from the handover — it begins as item 2's top
  // crosses the line and occupies the first 70% of the interval that follows —
  // so the window has to reach well PAST `after`, not stop just beyond it.
  const from = marks.before - Math.round(marks.pitch * 0.3);
  const to = marks.after + Math.round(marks.pitch * 0.8);
  const stepPx = 15;
  const walk: { y: number; v: number }[] = [];
  for (let y = from; y <= to; y += stepPx) {
    await page.evaluate(
      (y) => window.scrollTo({ top: y, behavior: "instant" }),
      y,
    );
    await page.waitForTimeout(90);
    walk.push({ y, v: (await pairTy(page))! });
  }

  // Intermediate POSITIONS exist — the pair is genuinely found between the two
  // card offsets at some scroll positions, rather than only ever on one of
  // them.
  const between = walk.filter(
    (s) => s.v > marks.from + 1 && s.v < marks.to - 1,
  );
  expect(
    between.length,
    `scroll positions with the pair strictly between ${marks.from} and ${marks.to}`,
  ).toBeGreaterThan(3);

  // …and no single 15px notch of scroll moves it more than a modest share of
  // the 420px pitch. Under the quantized mapping this was ~345px in one step.
  const jumps = walk.slice(1).map((s, i) => Math.abs(s.v - walk[i]!.v));
  const worst = Math.max(...jumps);
  expect(
    worst,
    `worst travel per ${stepPx}px of scroll across a handover: ${worst}px`,
  ).toBeLessThanOrEqual(stepPx * 2.5);

  // Once the glide's 70% band is behind it, the pair holds EXACTLY on the next
  // rung for the remaining 30% of the interval — "the same place for each
  // card", asserted as an exact equality rather than a tolerance. (A full
  // pitch further would be inside the NEXT glide, not on this rung.)
  await page.evaluate(
    (y) => window.scrollTo({ top: y, behavior: "instant" }),
    marks.after + Math.round(marks.pitch * 0.85),
  );
  expect(await settledTy(page)).toBe(marks.to);
});

test("opening a card mid-drift does not move the pair", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await gotoHome(page);

  // Park mid-column and settle.
  await page.evaluate(() => {
    const items = [...document.querySelectorAll<HTMLElement>(".qa-item")];
    const mid = items[Math.floor(items.length / 2)]!;
    window.scrollTo({
      top: mid.getBoundingClientRect().top + scrollY - innerHeight / 2,
      behavior: "instant",
    });
  });
  const before = await settledTy(page);
  expect(Number.isNaN(before)).toBe(false);

  // Open the card nearest the viewport centre (a real click, real motion
  // preferences — G2's frozen footprint is what keeps the mapping's input
  // geometry unchanged).
  const opened = await page.evaluate(() => {
    const items = [...document.querySelectorAll<HTMLElement>(".qa-item")];
    const centre = innerHeight / 2;
    const best = items
      .map((el) => {
        const r = el.getBoundingClientRect();
        return { el, d: Math.abs((r.top + r.bottom) / 2 - centre) };
      })
      .sort((a, b) => a.d - b.d)[0];
    const btn = best?.el.querySelector<HTMLElement>("button[aria-expanded]");
    if (!btn) return false;
    btn.click();
    return true;
  });
  expect(opened).toBe(true);

  await page.waitForTimeout(800);
  const after = await settledTy(page);
  expect(Math.abs(after - before)).toBeLessThanOrEqual(1);
});

test("prefers-reduced-motion: the pair is pinned statically at rest", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await gotoHome(page);

  await page.evaluate(() => {
    const pair = document.querySelector(
      ".ask-the-doctor-headshot",
    )!.parentElement!;
    const items = [...pair.parentElement!.querySelectorAll(".qa-item")];
    const last = items[items.length - 1]!;
    window.scrollTo({
      top: last.getBoundingClientRect().bottom + scrollY - innerHeight,
      behavior: "instant",
    });
  });
  await page.waitForTimeout(800);
  expect(await pairTy(page)).toBe(0);
});

test("the numbered /ask-the-doctor variation stays pair-free (SPEC D.4)", async ({
  page,
}) => {
  await page.setViewportSize(VIEWPORT);
  await page.goto("/ask-the-doctor", { waitUntil: "networkidle" });
  expect(await page.locator(".ask-the-doctor-headshot").count()).toBe(0);
});
