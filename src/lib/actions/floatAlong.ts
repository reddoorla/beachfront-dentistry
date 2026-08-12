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
 *  WHAT RUNS NOW: the same anchor semantics, made continuous. The viewport's
 *  bottom edge is the tracking line (the same edge that decided "fully
 *  visible" before); its position between consecutive item BOTTOMS is
 *  interpolated piecewise-linearly onto the items' offsetTop ladder, so the
 *  pair passes through every position the old code hopped between and every
 *  position in between. Clamped to [item 0, last item] — the pair never
 *  leaves the column. A short critically-damped follow (rAF, ~150ms time
 *  constant) keeps the float soft without reintroducing a step: the target
 *  is continuous in scroll, the follow is continuous in time, so there is no
 *  input for which the position can jump.
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
  // viewport-bottom crossings: when the viewport bottom sits between
  // bottom(item i) and bottom(item i+1), the offset interpolates between
  // those items' offsetTop distances from item 0 (the pair's authored rest —
  // all items share the node's positioned ancestor, so offsetTop deltas are
  // exactly the travel). Clamped to 0 before the column and to the last
  // item's offset past it. Monotone in scroll by construction: item bottoms
  // and offsetTops are both non-decreasing down the column.
  const targetOffset = (): number => {
    const items = [...parent.querySelectorAll<HTMLElement>(itemSelector)];
    if (items.length === 0) return 0;
    const first = items[0];
    const last = items[items.length - 1];
    const bottoms = items.map((el) => el.getBoundingClientRect().bottom);
    const line = window.innerHeight;
    if (bottoms[0] >= line) return 0;
    if (bottoms[bottoms.length - 1] <= line) {
      return last.offsetTop - first.offsetTop;
    }
    let i = 0;
    while (i + 1 < bottoms.length && bottoms[i + 1] <= line) i++;
    const span = bottoms[i + 1] - bottoms[i];
    const t =
      span > 0 ? Math.min(Math.max((line - bottoms[i]) / span, 0), 1) : 1;
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
