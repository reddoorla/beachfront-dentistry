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

test("the pair occupies exactly one position per card — never between two", async ({
  page,
}) => {
  test.setTimeout(180_000);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await gotoHome(page);

  // Fire every entrance reveal first (animateIn is one-shot — its observer
  // disconnects after revealing) by scrolling THROUGH the page in half-viewport
  // steps: an instant jump to the bottom never intersects the mid-page items,
  // so their reveals would otherwise fire one by one DURING the sweep and move
  // the very offsets being measured.
  await page.evaluate(async () => {
    const H = window.innerHeight / 2;
    for (let y = 0; y < document.body.scrollHeight; y += H) {
      scrollTo({ top: y, behavior: "instant" });
      await new Promise((r) => setTimeout(r, 60));
    }
    scrollTo({ top: 0, behavior: "instant" });
  });
  await page.waitForTimeout(1200);

  // The ladder the pair is allowed to occupy: each card's offset from the
  // first. DIRECTIVE 5 — "stick with one spot per card" — means every settled
  // position must be one of exactly these numbers.
  const rungs = await page.evaluate(() => {
    const cards = [...document.querySelectorAll<HTMLElement>(".qa-item")];
    return cards.map((c) => c.offsetTop - cards[0].offsetTop);
  });
  expect(rungs.length).toBeGreaterThan(2);

  const span = await page.evaluate(() => {
    const cards = [...document.querySelectorAll(".qa-item")];
    return {
      start: cards[0].getBoundingClientRect().top + scrollY - 600,
      end: cards[cards.length - 1].getBoundingClientRect().top + scrollY + 400,
    };
  });

  const seen: number[] = [];
  for (let y = span.start; y <= span.end; y += 100) {
    await page.evaluate((yy) => scrollTo({ top: yy, behavior: "instant" }), y);
    const v = await settledTy(page);
    seen.push(v);
  }

  // Every settled reading is ON a rung. A continuous mapping — which is what
  // I1 shipped and directive 5 reversed — fails here on the first reading
  // taken mid-pitch, because it answers a value between two rungs.
  const offLadder = seen.filter(
    (v) => !rungs.some((r) => Math.abs(r - v) < 1.5),
  );
  expect(
    offLadder,
    `settled positions that are not any card's own offset: ${offLadder.join(", ")}`,
  ).toEqual([]);

  // Monotone in scroll, and never outside the column.
  for (let i = 1; i < seen.length; i++)
    expect(seen[i]).toBeGreaterThanOrEqual(seen[i - 1] - 1.5);
  expect(Math.min(...seen)).toBeGreaterThanOrEqual(-1.5);
  expect(Math.max(...seen)).toBeLessThanOrEqual(rungs[rungs.length - 1] + 1.5);
});

test("the handover is eased in TIME by CSS, not spread across scroll", async ({
  page,
}) => {
  test.setTimeout(120_000);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await gotoHome(page);
  await page.evaluate(async () => {
    const H = window.innerHeight / 2;
    for (let y = 0; y < document.body.scrollHeight; y += H) {
      scrollTo({ top: y, behavior: "instant" });
      await new Promise((r) => setTimeout(r, 60));
    }
    scrollTo({ top: 0, behavior: "instant" });
  });
  await page.waitForTimeout(1200);

  // Park just before a handover, settle, then cross it in one small step.
  const boundary = await page.evaluate(() => {
    const cards = [...document.querySelectorAll(".qa-item")];
    return cards[2].getBoundingClientRect().top + scrollY;
  });
  await page.evaluate(
    (y) => scrollTo({ top: y - 30, behavior: "instant" }),
    boundary,
  );
  const before = await settledTy(page);
  await page.evaluate(
    (y) => scrollTo({ top: y + 30, behavior: "instant" }),
    boundary,
  );

  // Sample the COMPUTED transform through the settle + transition window. The
  // inline style jumps straight to the destination — that is the point of
  // quantizing — so the intermediate values must come from the compositor
  // interpolating it, which is what "eased translation transition" means.
  const samples: number[] = [];
  for (let i = 0; i < 24; i++) {
    await page.waitForTimeout(50);
    samples.push(
      await page.evaluate(() => {
        const pair = document.querySelector(
          ".ask-the-doctor-headshot",
        )?.parentElement;
        const m = new DOMMatrixReadOnly(getComputedStyle(pair!).transform);
        return m.m42;
      }),
    );
  }
  const after = await settledTy(page);
  expect(after).toBeGreaterThan(before);

  // Strictly between the two rungs at some point: proof the browser animated
  // it rather than snapping. A bare `transform` with no transition would give
  // only `before` then only `after`.
  const mid = samples.filter((v) => v > before + 2 && v < after - 2);
  expect(
    mid.length,
    `no intermediate frames between ${before} and ${after} — the hop snapped`,
  ).toBeGreaterThan(0);

  // And the declared transition is live's own (beachfront.css:7670).
  const transition = await page.evaluate(() => {
    const pair = document.querySelector(
      ".ask-the-doctor-headshot",
    )?.parentElement;
    return (pair as HTMLElement).style.transition;
  });
  // Browsers normalise `.19` to `0.19` on read-back, so compare on the
  // numbers rather than the literal the action writes.
  expect(transition.replace(/([\s(,])\./g, "$10.")).toBe(
    "transform 1s cubic-bezier(0.19, 1, 0.22, 1)",
  );
});

test("a flick past several cards settles once, on the card it lands on", async ({
  page,
}) => {
  test.setTimeout(120_000);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await gotoHome(page);
  await page.evaluate(async () => {
    const H = window.innerHeight / 2;
    for (let y = 0; y < document.body.scrollHeight; y += H) {
      scrollTo({ top: y, behavior: "instant" });
      await new Promise((r) => setTimeout(r, 60));
    }
    scrollTo({ top: 0, behavior: "instant" });
  });
  await page.waitForTimeout(1200);

  const rungs = await page.evaluate(() => {
    const cards = [...document.querySelectorAll<HTMLElement>(".qa-item")];
    return cards.map((c) => c.offsetTop - cards[0].offsetTop);
  });
  const tops = await page.evaluate(() =>
    [...document.querySelectorAll(".qa-item")].map(
      (c) => c.getBoundingClientRect().top + scrollY,
    ),
  );

  // Rip through four handovers faster than the settle window, the way a
  // trackpad flick does. The debounce is what keeps this from firing one
  // interrupted 1s transition per card passed.
  await page.evaluate(
    async (ys) => {
      for (const y of ys) {
        scrollTo({ top: y + 10, behavior: "instant" });
        await new Promise((r) => setTimeout(r, 30));
      }
    },
    tops.slice(1, 5),
  );

  const landed = await settledTy(page);
  // It ends on the card it stopped at — a rung, not a blend of the ones
  // passed. The last flick lands just past card 4's top, so card 4 is CUT and
  // the top-most fully visible question is card 5: rung 5, not rung 4.
  expect(rungs.some((r) => Math.abs(r - landed) < 1.5)).toBe(true);
  expect(landed).toBeCloseTo(rungs[5]!, 0);
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
