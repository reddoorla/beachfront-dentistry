import { test, expect } from "@playwright/test";

// THE ASK-THE-DOCTOR PAIR IS STICKY. Sixth and current operator directive on
// this one behaviour; the five before it are recorded in QuestionList's markup
// comment, because each was written by someone looking at the result of the
// last and the record is the only thing that stops a seventh re-litigation.
//
// Tim, 2026-09-02, on the deploy-preview build that shipped directive 5 (one
// spot per card, eased and debounced):
//
//   Tim:  "these elements still jump from question to question" [screenshot of
//          the handwriting + headshot beside the question column]
//   Tuck: "oh i thought you wanted it smoother … you just want it as a
//          straight scroll?"
//   Tim:  "sticky on scroll through that section"
//
// So the answer is not a better hop. It is no hop: the pair holds ONE viewport
// position while the question column scrolls past it, and releases at the
// column's ends. That is `position: sticky`, and using the real thing rather
// than emulating it in JS is what makes "does not jump" true by construction —
// there is no per-frame mapping left to be jittery, no debounce, no easing
// curve, and nothing to tune. `floatAlong` and its 479 lines of unit tests are
// deleted rather than disabled; a dead action that five directives argued over
// is exactly the thing a seventh round would resurrect by accident.
//
// This reverses directives 3 and 5 ("it should sit in the same place for each
// card") and reinstates the mechanism directive 1 asked for. Tim was shown
// both and chose this one; see LEDGER.
//
// Desktop only, which is unchanged: below lg the pair rests in the column flow
// above the first question (full-width cards leave nowhere to glide without
// covering content), so the sticky class is `lg:`-gated and this spec runs at
// desktop widths only.

const ROUTE = "/dev/match/home";
const WIDTHS = [1440, 1294, 1024];

/** The pair may wander this far from its stuck position while the column owns
 * the viewport. Sticky is exact, so this is only measurement noise: the reveal
 * animation on the two children settles to translate(0) and sub-pixel layout
 * rounding moves the rect by well under a pixel. A single hop of the old
 * mechanism was ~345px, so this catches the failure it exists for by 300x. */
const MAX_DRIFT = 1.5;

for (const width of WIDTHS) {
  test(`the ask-the-doctor pair sticks through the question column — @${width}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(ROUTE, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);

    const samples = await page.evaluate(async () => {
      const anchor = document.querySelector<HTMLElement>("[data-doctor-float]");
      const column = anchor?.parentElement;
      if (!anchor || !column) return null;

      const colTop = column.getBoundingClientRect().top + scrollY;
      const colBottom = column.getBoundingClientRect().bottom + scrollY;

      const rows: { scrollY: number; viewportTop: number; phase: string }[] =
        [];
      // Walk the whole column in 40px steps — the same step the old
      // mechanism's 345px handovers were measured in.
      for (let y = colTop - 400; y < colBottom + 400; y += 40) {
        scrollTo({ top: Math.max(0, y), behavior: "instant" });
        await new Promise((r) => requestAnimationFrame(() => r(null)));
        await new Promise((r) => requestAnimationFrame(() => r(null)));
        const r = anchor.getBoundingClientRect();
        const stuck =
          scrollY > colTop - 100 &&
          r.bottom < column.getBoundingClientRect().bottom;
        rows.push({
          scrollY,
          viewportTop: Math.round(r.top * 100) / 100,
          phase: stuck ? "stuck" : "free",
        });
      }
      return rows;
    });

    expect(samples, "the float anchor is present").not.toBeNull();
    const stuck = samples!.filter((s) => s.phase === "stuck");
    expect(
      stuck.length,
      "the column is long enough to actually stick through",
    ).toBeGreaterThan(5);

    // 1. While stuck, the pair holds ONE viewport position. This is the whole
    //    directive: no jumping from question to question.
    const tops = stuck.map((s) => s.viewportTop);
    const spread = Math.max(...tops) - Math.min(...tops);
    expect(
      spread,
      `@${width}: viewport spread while stuck (${Math.min(...tops)} … ${Math.max(...tops)})`,
    ).toBeLessThanOrEqual(MAX_DRIFT);

    // 2. And it holds it by STICKING, not by being fixed forever: the pair has
    //    to let go at the column's end, or it would ride down the whole page.
    const last = samples![samples!.length - 1];
    expect(
      last.phase,
      `@${width}: the pair releases at the column's bottom`,
    ).toBe("free");

    // 3. No step may move it more than a step. A hop is exactly a step in
    //    scroll producing a jump in position; the old mechanism scored 8.6x.
    let worstStep = 0;
    for (let i = 1; i < samples!.length; i++) {
      if (samples![i].phase !== "stuck" || samples![i - 1].phase !== "stuck")
        continue;
      worstStep = Math.max(
        worstStep,
        Math.abs(samples![i].viewportTop - samples![i - 1].viewportTop),
      );
    }
    expect(
      worstStep,
      `@${width}: worst single-step movement`,
    ).toBeLessThanOrEqual(MAX_DRIFT);
  });
}
