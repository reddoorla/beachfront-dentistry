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
// Pin #7 is still honoured by the rAF follow rather than by the mapping: the
// target steps 420px, the RENDERED position crosses it over ~4 frames. This
// suite pins that contract:
//   1. scroll 0: the pair's authored rest state is untouched (no transform) —
//      the static gate captures depend on it byte-for-byte;
//   2. quantized: every settled position down the column is exactly one of the
//      items' offsets — never a value between two cards — and the set of them
//      is monotone and covers the column (the assertion cannot go vacuous);
//   3. smoothed: the handover is rendered as intermediate frames, not a
//      teleport — sampling faster than the follow's settle catches the pair
//      strictly between the two card offsets;
//   4. bounds: past the column the pair clamps exactly to the last item's
//      offset — it never leaves the column;
//   5. opening a card mid-drift does not move the pair (G2's frozen cards
//      keep every item offset, so the mapping's input never changes);
//   6. prefers-reduced-motion: the pair is pinned statically at rest — no
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

test("the pair holds one card's offset at a time, monotone and column-bounded", async ({
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
      // the only offsets a quantized target may ever settle on
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

  // Sampled at a 60px scroll increment — still seven samples per 420px card,
  // so a target that moved WITHIN a card could not hide between them.
  //
  // 1500ms per sample, not the 600ms this first used: the follow is
  // exponential with TAU=150ms, so at 600ms it is still exp(-4) = 1.8% short —
  // on a 420px handover that is ~7px, and every mid-handover sample read 413
  // instead of 420 and failed the grid check as if the TARGET were off-grid.
  // 1500ms leaves exp(-10) ≈ 0.02px, far inside the ±1 tolerance. Each sample
  // must be settled or this assertion is about the follow, not the mapping.
  const step = 60;
  const samples: number[] = [];
  for (let y = range.start; y <= range.end; y += step) {
    await page.evaluate(
      (y) => window.scrollTo({ top: y, behavior: "instant" }),
      y,
    );
    await page.waitForTimeout(1500);
    samples.push((await pairTy(page))!);
  }
  expect(samples.length).toBeGreaterThanOrEqual(30);

  // Quantized: every settled position is one of the cards' own offsets. A
  // continuous mapping fails this on the first mid-segment sample.
  const offGrid = samples.filter(
    (v) => !range.stops.some((s) => Math.abs(s - v) <= 1),
  );
  expect(
    offGrid,
    `settled positions off the card grid: ${offGrid.join(", ")}`,
  ).toEqual([]);

  for (let i = 1; i < samples.length; i++) {
    // monotone (never drifts back up while scrolling down)…
    expect(samples[i]! - samples[i - 1]!).toBeGreaterThanOrEqual(-0.5);
  }
  // …the pair really travelled the column, so none of this is vacuous…
  const travelled = samples[samples.length - 1]! - samples[0]!;
  expect(travelled).toBeGreaterThan(range.colTravel * 0.8);
  // …it visited more than one card, i.e. handovers actually happened…
  expect(new Set(samples).size).toBeGreaterThanOrEqual(3);
  // …and it never left the column.
  expect(Math.max(...samples)).toBeLessThanOrEqual(range.colTravel + 0.5);

  // Past the column the pair clamps exactly to the last item's offset.
  await page.evaluate(
    (y) => window.scrollTo({ top: y, behavior: "instant" }),
    range.end + 600,
  );
  expect(await settledTy(page)).toBe(range.colTravel);
});

test("the handover between cards is glided, not teleported", async ({
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
    };
  });
  await page.evaluate(
    (y) => window.scrollTo({ top: y, behavior: "instant" }),
    marks.before,
  );
  expect(await settledTy(page)).toBe(marks.from);

  // Cross the handover and sample FASTER than the follow settles. The target
  // steps `from`→`to` instantly; the rendered position must not.
  await page.evaluate(
    (y) => window.scrollTo({ top: y, behavior: "instant" }),
    marks.after,
  );
  const mid: number[] = [];
  for (let i = 0; i < 12; i++) {
    const v = await pairTy(page);
    if (v !== null && v > marks.from + 1 && v < marks.to - 1) mid.push(v);
    await page.waitForTimeout(20);
  }

  // At least one frame strictly between the two card offsets — that is the
  // difference between this and live's instant transform swap. (Live's own
  // glide was CSS over 1s; this one is the rAF follow over ~4 frames.)
  expect(
    mid.length,
    `intermediate frames observed between ${marks.from} and ${marks.to}`,
  ).toBeGreaterThan(0);
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
