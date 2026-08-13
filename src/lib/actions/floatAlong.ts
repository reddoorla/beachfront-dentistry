export type FloatAlongOptions = {
  /** Selector (within the node's parent) for the items the node tracks. */
  itemSelector: string;
};

/** The ask-the-doctor handwriting + doctor headshot pair rides down the
 *  question column as the visitor scrolls, holding THE SAME PLACE ON EVERY
 *  CARD: 100px below the top of the top-most fully visible question, travelling
 *  with that card until the next one takes over.
 *
 *  THREE OPERATOR DIRECTIVES SHAPED THIS — the third reverses part of the
 *  first, so the whole record is here rather than in git archaeology:
 *
 *  1. 2026-08-11 (MarkUp thread a7c2e0d0-5e13-4cfd-bb17-a21ecee7b188, home pin
 *     #7) — "I like the user experience of 'Ask The Doctor' and the [floating
 *     Doctor image] of the original site. I do not like the jumping from
 *     question to question." Live's floating-doc.js quantized the pair per
 *     question and glided it with `.ask-the-doctor-handwriting-anchor
 *     { transition: transform 1s cubic-bezier(.19,1,.22,1) }`
 *     (beachfront.css:7670); a 25px scroll step could move it 420px. The
 *     answer then was to make position a CONTINUOUS function of scroll.
 *  2. 2026-08-13 — "anchor to the top fully visible question rather than the
 *     bottom one." Live tracked the bottom-most; that put the pair beside the
 *     question BELOW the one being read.
 *  3. 2026-08-13, after seeing (2) deployed — "it should sit in the same place
 *     for each card." This is what reverses (1)'s mechanism. Continuous
 *     interpolation pins the pair to a FIXED SCREEN POSITION and lets the cards
 *     slide past it, so its offset within a card sweeps the card's whole height
 *     and it spends most of the scroll straddling the gap between two cards.
 *     Measured on the deployed builds: the old continuous mapping held y≈598
 *     and the new one y≈98, and in BOTH the pair's offset relative to a card
 *     swept ±190px. "The same place for each card" is only reachable by
 *     quantizing — the pair must travel WITH a card, not through it.
 *
 *  WHAT RUNS NOW: the target is quantized to the top-most fully visible item's
 *  offset, so the pair is always exactly 100px below some card's top and never
 *  between two. Clamped to [item 0, last item] — it never leaves the column.
 *  The ~150ms critically-damped rAF follow is what keeps (1) honoured in
 *  spirit: the target steps, but the RENDERED position is still continuous in
 *  time, so the handover glides over ~4 frames instead of teleporting. It is
 *  deliberately far shorter than live's 1s expo, which is what made the
 *  original read as a jump.
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

  // QUANTIZED per question: the target is the top-most fully visible item's
  // own offset from item 0 (all items share the node's positioned ancestor, so
  // offsetTop deltas are exactly the travel). "Top-most fully visible" = the
  // first item the viewport's top edge has not yet cut into. Between handovers
  // the target is CONSTANT, so the pair travels with its card and stays a fixed
  // 100px below that card's top — directive 3 above, and the property that
  // continuous interpolation could not provide at any tracking line.
  //
  // Clamps fall out of the same rule: before the column item 0 is itself the
  // top-most fully visible one (offset 0, the authored rest), and once every
  // item's top is above the line there is no uncut item left, so it holds at
  // the last one and never leaves the column. Monotone in scroll by
  // construction — the index only ever advances as the page scrolls down.
  //
  // The viewport top is a legitimate line on this page: home's nav is the
  // hamburger-only branch (`position: absolute`, Nav.svelte:257-259), so it
  // scrolls away rather than overlaying y=0. A page that put a FIXED nav over
  // this column would need the line moved down to the nav's bottom edge; the
  // pair's own `lg:top-[100px]` rest offset is not enough clearance for one.
  const LINE = 0;
  const targetOffset = (): number => {
    const items = [...parent.querySelectorAll<HTMLElement>(itemSelector)];
    if (items.length === 0) return 0;
    const first = items[0];
    let idx = items.findIndex((el) => el.getBoundingClientRect().top >= LINE);
    if (idx === -1) idx = items.length - 1; // whole column scrolled past
    return items[idx].offsetTop - first.offsetTop;
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
