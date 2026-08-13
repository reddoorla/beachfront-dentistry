export type FloatAlongOptions = {
  /** Selector (within the node's parent) for the items the node tracks. */
  itemSelector: string;
};

/** The ask-the-doctor handwriting + doctor headshot pair drifts down the
 *  question column as the visitor scrolls — CONTINUOUSLY, as a function of
 *  scroll position, per MarkUp thread a7c2e0d0-5e13-4cfd-bb17-a21ecee7b188
 *  (home board, pin #7): "I like the user experience of 'Ask The Doctor' and
 *  the [floating Doctor image] of the original site. I do not like the
 *  jumping from question to question." Operator directive 2026-08-11: Tim's
 *  instruction outranks the live behaviour.
 *
 *  THE LIVE BEHAVIOUR THIS OVERRIDES (kept in kind, changed in motion): live's
 *  floating-doc.js (live ships the class with its instantiation commented
 *  out, so the operator's spec was the authority) glided the pair to the
 *  BOTTOM-MOST FULLY VISIBLE question — movement quantized per question, the
 *  transform only changing when the target index changed, the glide itself
 *  CSS (live's anchor rule `.ask-the-doctor-handwriting-anchor { transition:
 *  transform 1s cubic-bezier(.19,1,.22,1) }`, beachfront.css:7670). Those
 *  per-question hops are exactly the "jumping" the pin rejects.
 *
 *  WHAT RUNS NOW: continuous, and anchored to the TOP fully visible question.
 *  The viewport's TOP edge is the tracking line; its position between
 *  consecutive item TOPS is interpolated piecewise-linearly onto the items'
 *  offsetTop ladder, so the pair passes through every position the old code
 *  hopped between and every position in between. Clamped to [item 0, last
 *  item] — the pair never leaves the column. A short critically-damped follow
 *  (rAF, ~150ms time constant) keeps the float soft without reintroducing a
 *  step: the target is continuous in scroll, the follow is continuous in time,
 *  so there is no input for which the position can jump.
 *
 *  Which END is tracked is the second operator directive on this behaviour
 *  (2026-08-13): "make the doctor anchor to the top fully visible question
 *  rather than the bottom one". Until then the line was the viewport BOTTOM
 *  over item bottoms — live's own choice of end, kept when the motion was made
 *  continuous. The pair now sits beside the question the reader is actually
 *  on, roughly one card higher up the column.
 *
 *  Decoration only — gated off entirely (no listeners, no transform ever
 *  written) for reduced-motion users, who get the pair statically at its
 *  authored rest position, and during SSR, where there is no `window`. At
 *  scroll 0 the mapping is 0 and the node's style is left untouched, so the
 *  static page (and every gate capture of it) is byte-identical to the
 *  authored markup. */
export function floatAlong(
  node: HTMLElement,
  { itemSelector }: FloatAlongOptions,
) {
  // SSR-safe complete no-op: no window, or no matchMedia to consult — without
  // it we can't honour reduced-motion, so the decoration stays static.
  if (typeof window === "undefined") return;
  if (typeof window.matchMedia !== "function") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const parent = node.parentElement;
  if (!parent) return;

  // The float is desktop-only: live's mobile pair rests in the column flow
  // above the first question (full-width cards leave nowhere to glide
  // without covering content). Checked per frame so a resize across the
  // breakpoint parks the pair back at rest.
  const desktop = window.matchMedia("(min-width: 1024px)");

  // Continuous scroll→offset mapping. Piecewise-linear over the items'
  // viewport-TOP crossings: when the viewport top sits between top(item i) and
  // top(item i+1), the offset interpolates between those items' offsetTop
  // distances from item 0 (the pair's authored rest — all items share the
  // node's positioned ancestor, so offsetTop deltas are exactly the travel).
  // Clamped to 0 before the column and to the last item's offset past it.
  // Monotone in scroll by construction: item tops and offsetTops are both
  // non-decreasing down the column.
  //
  // TOP, not bottom — operator directive 2026-08-13: "make the doctor anchor
  // to the top fully visible question rather than the bottom one". The tracked
  // question is the first one not yet cut off by the top of the viewport, so
  // at t=0 of each segment the pair sits beside the card whose top has just
  // reached the viewport top — the reader's current question, rather than the
  // last one to have fully entered from below. It rides ~one card higher in
  // the column than it used to (cards are 400px on a 420px pitch).
  //
  // The viewport top is a legitimate line on this page: home's nav is the
  // hamburger-only branch (`position: absolute`, Nav.svelte:257-259), so it
  // scrolls away rather than overlaying y=0. A page that put a FIXED nav over
  // this column would need the line moved down to the nav's bottom edge; the
  // pair's own `lg:top-[100px]` rest offset is not enough clearance for one.
  const targetOffset = (): number => {
    const items = [...parent.querySelectorAll<HTMLElement>(itemSelector)];
    if (items.length === 0) return 0;
    const first = items[0];
    const last = items[items.length - 1];
    const tops = items.map((el) => el.getBoundingClientRect().top);
    const line = 0;
    if (tops[0] >= line) return 0;
    if (tops[tops.length - 1] <= line) {
      return last.offsetTop - first.offsetTop;
    }
    let i = 0;
    while (i + 1 < tops.length && tops[i + 1] <= line) i++;
    const span = tops[i + 1] - tops[i];
    const t = span > 0 ? Math.min(Math.max((line - tops[i]) / span, 0), 1) : 1;
    const a = items[i].offsetTop - first.offsetTop;
    const b = items[i + 1].offsetTop - first.offsetTop;
    return a + (b - a) * t;
  };

  let current = 0;
  let raf = 0;
  let lastTs = 0;
  // Time constant of the exponential follow — soft enough to keep the old
  // glide's floaty character, short enough that the pair never trails a
  // whole card behind the scroll (the old CSS glide was a 1s expo).
  const TAU = 150;

  const apply = (v: number) => {
    // An exact 0 restores the authored style so the rest state stays
    // byte-identical to the server-rendered markup.
    node.style.transform =
      v === 0 ? "" : `translateY(${Math.round(v * 100) / 100}px)`;
  };

  const step = (ts: number) => {
    raf = 0;
    if (!desktop.matches) {
      // Below the breakpoint the pair rests in the column flow — park it.
      current = 0;
      lastTs = 0;
      apply(0);
      return;
    }
    const goal = targetOffset();
    const dt = lastTs ? Math.min(ts - lastTs, 100) : 16;
    lastTs = ts;
    current += (goal - current) * (1 - Math.exp(-dt / TAU));
    if (Math.abs(goal - current) < 0.05) {
      // Settled — snap to the exact mapped position and go dormant until the
      // next scroll/resize wakes the loop.
      current = goal;
      lastTs = 0;
      apply(current);
      return;
    }
    apply(current);
    raf = requestAnimationFrame(step);
  };

  const wake = () => {
    if (raf) return;
    lastTs = 0;
    raf = requestAnimationFrame(step);
  };

  window.addEventListener("scroll", wake, { passive: true });
  window.addEventListener("resize", wake);

  // Mount: snap straight to the mapped position — a deep link can land
  // mid-column, and gliding in from rest would be motion nobody scrolled
  // for. At scroll 0 the mapping is 0, so `apply` leaves the DOM untouched.
  if (desktop.matches) {
    current = targetOffset();
    apply(current);
  }

  return {
    destroy() {
      window.removeEventListener("scroll", wake);
      window.removeEventListener("resize", wake);
      if (raf) cancelAnimationFrame(raf);
    },
  };
}
