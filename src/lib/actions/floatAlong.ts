export type FloatAlongOptions = {
  /** Selector (within the node's parent) for the items the node tracks. */
  itemSelector: string;
};

/** The ask-the-doctor handwriting + doctor headshot pair rides down the
 *  question column as the visitor scrolls, resting 100px below the top of the
 *  top-most fully visible question and gliding to the next as that question
 *  hands over.
 *
 *  FOUR OPERATOR DIRECTIVES SHAPED THIS, and they are not all compatible — the
 *  third reverses the first's mechanism and the fourth rejects the third's
 *  motion — so the whole record is here rather than in git archaeology. Read
 *  all four before changing the mapping; each one was written by someone
 *  looking at the result of the previous one:
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
 *  4. 2026-09-01 (MarkUp thread 717b8986-6da3-4a60-9788-14dd67c85f75, home pin
 *     #15) — "I still don't like how jittery the doctor's photo and the ask the
 *     doctor handwriting moves down from one question to the next. I just
 *     wanted to move smoothly down as you scroll." Third pass on this one
 *     behaviour, and the reason (3)'s mechanism could not simply be kept:
 *     quantizing put the pair in the right PLACE and gave it the wrong MOTION.
 *     Measured before this change (1440, 40px scroll steps): 57 of 87 steps
 *     moved the pair 0px, and each handover then moved it ~345px inside a
 *     SINGLE 40px step — an 8.6:1 ratio of output to input, which is the
 *     definition of a lurch rather than a glide. The ~150ms rAF follow was
 *     smoothing in TIME, so it could soften the handover's edges but never its
 *     size; scrolling one notch still commanded a whole card of travel.
 *
 *  WHAT RUNS NOW (operator ACK 2026-09-01, chosen over reverting to (1)):
 *  position is a pure, continuous function of SCROLL — not a time-decayed
 *  chase of a stepped target. Within each card the pair HOLDS a fixed offset
 *  for the first 30% of that card's pitch, then glides to the next card's
 *  offset across the remaining 70% on a smoothstep, landing exactly as the
 *  index advances. So (3) still holds where it is visible — the pair sits in
 *  the same place on a card for the part of the scroll you are reading it —
 *  and (4) holds by construction: output is continuous in input, so no scroll
 *  gesture, however coarse, can produce a step. Nothing is animated in time at
 *  all; the rAF is only there to coalesce scroll events into one write per
 *  frame, which is why there is no loop to settle and no way for the pair to
 *  move while the page is still.
 *  Clamped to [item 0, last item] — it never leaves the column.
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

  // The ladder is still the items' own offsets from item 0 (they share the
  // node's positioned ancestor, so `offsetTop` deltas ARE the travel), and the
  // anchor is still the top-most fully visible question — "the first item the
  // viewport's top edge has not yet cut into", directive 2. What changed in I1
  // is only HOW the pair gets from one rung to the next: it is interpolated
  // across scroll instead of jumped and then chased in time.
  //
  // Clamps fall out of the same rule: before the column, no item's top has
  // passed the line, so the pair is at the authored rest (0); once every top is
  // above it, there is no uncut item left and it holds at the last rung and
  // never leaves the column. Monotone in scroll by construction — the anchor
  // index only advances as the page scrolls down, and smoothstep is monotone
  // on [0,1].
  //
  // The viewport top is a legitimate line on this page: home's nav is the
  // hamburger-only branch (`position: absolute`, Nav.svelte:257-259), so it
  // scrolls away rather than overlaying y=0. A page that put a FIXED nav over
  // this column would need the line moved down to the nav's bottom edge; the
  // pair's own `lg:top-[100px]` rest offset is not enough clearance for one.
  const LINE = 0;

  /** Fraction of a card's pitch spent gliding to the next card's offset; the
   *  rest of that pitch the pair holds still. 0 would be the pure step this
   *  replaces, 1 the pure continuous mapping directive 3 rejected. */
  const GLIDE = 0.7;
  /** 3t²−2t³ — zero slope at both ends, so the glide starts and ends without a
   *  corner and the ramp joins the holds smoothly. */
  const smoothstep = (t: number) => t * t * (3 - 2 * t);

  /** Position as a pure function of scroll. See the header for why. */
  const offsetFor = (scrollY: number): number => {
    const items = [...parent.querySelectorAll<HTMLElement>(itemSelector)];
    if (items.length === 0) return 0;
    const first = items[0];
    // Travel ladder (what the pair may occupy) and the scroll positions the
    // handovers happen at. Both read per call: G2 froze the cards' offsets
    // while one is open, and a resize re-lays them out.
    const rung = items.map((el) => el.offsetTop - first.offsetTop);
    const handover = items.map(
      (el) => el.getBoundingClientRect().top + scrollY,
    );

    // `j` is the top-most fully visible item — the index directive 2 anchors
    // to — i.e. how many items' tops the line has already passed.
    let j = 0;
    while (j < handover.length && handover[j] < scrollY + LINE) j++;
    if (j <= 0) return 0; // before the column: authored rest
    if (j >= items.length) return rung[items.length - 1]; // past it: clamped

    // The glide runs FORWARD from the handover it belongs to, occupying the
    // first `GLIDE` of the interval that item `j` owns, and then holds at
    // rung[j] for the remainder. Running it forward rather than backward into
    // the NEXT handover is what keeps directive 2 intact: a backward ramp
    // would have the pair arriving at the next card's rung up to a whole band
    // BEFORE that card reached the line, i.e. anchored to the wrong question
    // for most of the scroll. (It cost a round to see: both are continuous,
    // and only one is correct.)
    const pitch =
      j + 1 < handover.length
        ? handover[j] - handover[j - 1]
        : handover[j - 1] - handover[Math.max(0, j - 2)];
    const band = Math.min(GLIDE * pitch, pitch);
    if (!(band > 0)) return rung[j];

    const p = (scrollY + LINE - handover[j - 1]) / band;
    if (p <= 0) return rung[j - 1];
    if (p >= 1) return rung[j];
    return rung[j - 1] + smoothstep(p) * (rung[j] - rung[j - 1]);
  };

  let raf = 0;

  const apply = (v: number) => {
    // An exact 0 restores the authored style so the rest state stays
    // byte-identical to the server-rendered markup.
    node.style.transform =
      v === 0 ? "" : `translateY(${Math.round(v * 100) / 100}px)`;
  };

  const step = () => {
    raf = 0;
    if (!desktop.matches) {
      // Below the breakpoint the pair rests in the column flow — park it.
      apply(0);
      return;
    }
    apply(offsetFor(window.scrollY));
  };

  // One frame per scroll burst. This is COALESCING, not animation: `step`
  // reads the scroll position and writes the mapped offset, so no frame ever
  // moves the pair on its own and there is no loop to settle.
  const wake = () => {
    if (raf) return;
    raf = requestAnimationFrame(step);
  };

  window.addEventListener("scroll", wake, { passive: true });
  window.addEventListener("resize", wake);

  // Mount: evaluate the mapping straight away — a deep link can land
  // mid-column, and gliding in from rest would be motion nobody scrolled
  // for. At scroll 0 the mapping is 0, so `apply` leaves the DOM untouched.
  if (desktop.matches) apply(offsetFor(window.scrollY));

  return {
    destroy() {
      window.removeEventListener("scroll", wake);
      window.removeEventListener("resize", wake);
      if (raf) cancelAnimationFrame(raf);
    },
  };
}
