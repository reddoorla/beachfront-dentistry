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
// 420px jumps inside a single 25px scroll step. floatAlong now maps scroll to
// position piecewise-linearly with a short rAF follow, so position is a
// continuous function of scroll.
//
// WHICH END — operator directive 2026-08-13: "anchor to the top fully visible
// question rather than the bottom one". The crossings are the items' VIEWPORT
// TOP crossings; the pair rides beside the question the reader is on, about
// one card higher than before. This suite pins that contract:
//   1. scroll 0: the pair's authored rest state is untouched (no transform) —
//      the static gate captures depend on it byte-for-byte;
//   2. continuity: sampled every 25px of scroll down the column, the settled
//      position is monotone and every per-step delta stays far below one
//      card hop (bound 60px vs the old 420px), while total travel spans the
//      column (the assertion cannot go vacuous);
//   3. bounds: past the column the pair clamps exactly to the last item's
//      offset — it never leaves the column;
//   4. opening a card mid-drift does not move the pair (G2's frozen cards
//      keep every item offset, so the mapping's input never changes);
//   5. prefers-reduced-motion: the pair is pinned statically at rest — no
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

test("the drift is a continuous, monotone, column-bounded function of scroll", async ({
  page,
}) => {
  test.setTimeout(120_000);
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
    // The tracking line is the viewport TOP over item TOPS (operator directive
    // 2026-08-13), so the drift window runs from just before the first item's
    // top reaches y=0 to just after the last item's does. Sweeping the OLD
    // bottom-edge window would now sample mostly clamped rest at one end.
    const topOf = (el: Element) => el.getBoundingClientRect().top + scrollY;
    const first = items[0] as HTMLElement;
    const last = items[items.length - 1] as HTMLElement;
    return {
      start: Math.max(0, Math.round(topOf(first) - 50)),
      end: Math.round(topOf(last) + 50),
      colTravel: last.offsetTop - first.offsetTop,
    };
  });
  expect(range.colTravel).toBeGreaterThan(500);

  // Settle fully at the sweep's first position: the reveal animations shift
  // the cards between load and first paint, so the mapping can already be
  // >0 here — without this, the first samples measure the follow's catch-up
  // transient instead of the drift the contract is about.
  await page.evaluate(
    (y) => window.scrollTo({ top: y, behavior: "instant" }),
    range.start,
  );
  await settledTy(page);

  // >=40 samples at a 25px scroll increment. 250ms per step: the follow has
  // closed >80% of each 25px step's ~equal position delta by then, and
  // because it only ever approaches the (monotone) target from behind, the
  // sampled sequence stays monotone even before full settle.
  const step = 25;
  const samples: number[] = [];
  for (let y = range.start; y <= range.end; y += step) {
    await page.evaluate(
      (y) => window.scrollTo({ top: y, behavior: "instant" }),
      y,
    );
    await page.waitForTimeout(250);
    samples.push((await pairTy(page))!);
  }
  expect(samples.length).toBeGreaterThanOrEqual(40);

  let maxDelta = 0;
  for (let i = 1; i < samples.length; i++) {
    const d = samples[i]! - samples[i - 1]!;
    // monotone (never drifts back up while scrolling down)…
    expect(d).toBeGreaterThanOrEqual(-0.5);
    if (d > maxDelta) maxDelta = d;
  }
  // …continuous: no 25px of scroll ever moves the pair more than 60px — the
  // old quantized glide answered 420px here (one full card hop).
  expect(maxDelta).toBeLessThanOrEqual(60);
  // …and the assertion is not vacuous: the pair really travelled the column.
  const travelled = samples[samples.length - 1]! - samples[0]!;
  expect(travelled).toBeGreaterThan(range.colTravel * 0.8);
  // …without ever leaving it.
  expect(Math.max(...samples)).toBeLessThanOrEqual(range.colTravel + 0.5);

  // Past the column the pair clamps exactly to the last item's offset.
  await page.evaluate(
    (y) => window.scrollTo({ top: y, behavior: "instant" }),
    range.end + 600,
  );
  expect(await settledTy(page)).toBe(range.colTravel);
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
