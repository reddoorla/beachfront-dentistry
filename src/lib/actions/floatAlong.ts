export type FloatAlongOptions = {
  /** Selector (within the node's parent) for the items the node tracks. */
  itemSelector: string;
};

/** The ask-the-doctor handwriting + doctor headshot pair rides down the
 *  question column as the visitor scrolls, resting 100px below the top of the
 *  top-most fully visible question and hopping to the next as that question
 *  hands over.
 *
 *  FIVE OPERATOR DIRECTIVES SHAPED THIS and they are not all compatible — 3
 *  reverses 1's mechanism, 4 rejects 3's motion, 5 reverses 4 again — so the
 *  whole record is here rather than in git archaeology. Read all five before
 *  changing anything; each was written by someone looking at the result of the
 *  previous one:
 *
 *  1. 2026-08-11 (MarkUp a7c2e0d0-5e13-4cfd-bb17-a21ecee7b188, home pin #7) —
 *     "I like the user experience ... I do not like the jumping from question
 *     to question." Live's floating-doc.js quantized per question and glided
 *     with `.ask-the-doctor-handwriting-anchor { transition: transform 1s
 *     cubic-bezier(.19,1,.22,1) }` (beachfront.css:7670); a 25px scroll step
 *     could move it 420px. The answer then was a CONTINUOUS function of scroll.
 *  2. 2026-08-13 — "anchor to the top fully visible question rather than the
 *     bottom one." Live tracked the bottom-most, putting the pair beside the
 *     question BELOW the one being read. This one has never been reversed and
 *     still holds.
 *  3. 2026-08-13, after seeing (2) deployed — "it should sit in the same place
 *     for each card." Continuous interpolation pins the pair to a fixed SCREEN
 *     position and lets cards slide past it, so its offset within a card sweeps
 *     the card's whole height. Measured on both deployed builds: the offset
 *     relative to a card swept ±190px. Only quantizing travels WITH a card.
 *  4. 2026-09-01 (MarkUp 717b8986-6da3-4a60-9788-14dd67c85f75, home pin #15) —
 *     "jittery ... I just wanted to move smoothly down as you scroll." So the
 *     mapping went continuous again (smoothstep over 70% of each card's pitch).
 *     That satisfied "smooth" and broke (3) a second time.
 *  5. 2026-09-01, after seeing (4) on the deploy preview — "the snap still
 *     feels real weird, stick with one spot per card, ship just the fix with an
 *     eased translation transition [and] probably wants a debounce as well to
 *     avoid jittery feelings."
 *
 *  WHAT RUNS NOW, and why it is not just a re-run of (1): the POSITION is
 *  quantized — one spot per card, so (3) and (5) hold exactly and the pair
 *  never straddles two cards. The MOTION is a CSS transition on transform, not
 *  a per-frame mapping, so (1)'s and (4)'s "jumping"/"jittery" complaint is
 *  answered by easing the hop rather than by spreading it across scroll. (1)
 *  was never a complaint about quantized POSITION; it was a complaint about a
 *  25px scroll step teleporting the pair 420px with a 1s tail behind it. Two
 *  things fix that without going continuous:
 *
 *    - the DEBOUNCE below, which is what makes a flick land once instead of
 *      firing a transition per card it passes, and
 *    - directive 2's top-most anchor, which halves the hop distance versus
 *      live's bottom-most one.
 *
 *  The easing curve and duration are live's own (beachfront.css:7670), not a
 *  taste call: an ease-out that covers most of the distance immediately and
 *  settles with a long tail, which reads as "moved" rather than "snapped".
 *
 *  Decoration only — gated off entirely (no listeners, no transform, no
 *  transition ever written) for reduced-motion users, who get the pair
 *  statically at its authored rest position, and during SSR where there is no
 *  `window`. Until the pair first leaves rung 0 the node's style is untouched,
 *  so the static page (and every gate capture of it) stays byte-identical to
 *  the authored markup. */
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
  // above the first question (full-width cards leave nowhere to glide without
  // covering content). Checked per frame so a resize across the breakpoint
  // parks the pair back at rest.
  const desktop = window.matchMedia("(min-width: 1024px)");

  /** Live's own hop, `.ask-the-doctor-handwriting-anchor` (beachfront.css:7670). */
  const GLIDE = "transform 1s cubic-bezier(.19, 1, .22, 1)";

  /** How long the anchor index must hold still before the pair commits to it.
   *  This is the anti-jitter part of directive 5, and it does two jobs:
   *
   *  1. A fast flick past four cards fires ONE transition to the card you stop
   *     on, instead of four that interrupt each other — interrupted transitions
   *     restart from wherever the last one had got to, which is exactly the
   *     "jittery" reading.
   *  2. It absorbs oscillation at a handover boundary, where a few pixels of
   *     scroll (or a trackpad's rubber-banding) can flip the index back and
   *     forth and would otherwise re-trigger the hop each time.
   *
   *  Debounced on INDEX CHANGE, not on scroll activity: a continuing slow
   *  scroll does not keep pushing the deadline back, so the pair still moves
   *  while you are scrolling. Only a *different* index restarts the clock. */
  const SETTLE_MS = 120;

  // The viewport top is a legitimate line on this page: home's nav is the
  // hamburger-only branch (`position: absolute`, Nav.svelte:257-259), so it
  // scrolls away rather than overlaying y=0. A page with a FIXED nav over this
  // column would need the line moved down to the nav's bottom edge; the pair's
  // own `lg:top-[100px]` rest offset is not enough clearance for one.
  const LINE = 0;

  const items = () => [...parent.querySelectorAll<HTMLElement>(itemSelector)];

  /** The top-most fully visible question — "the first item the viewport's top
   *  edge has not yet cut into", directive 2. Read live rather than cached:
   *  expanding a card and resizing both re-lay-out the column. */
  const indexFor = (scrollY: number, list: HTMLElement[]): number => {
    let j = 0;
    while (j < list.length) {
      const top = list[j].getBoundingClientRect().top + scrollY;
      if (top >= scrollY + LINE) break;
      j++;
    }
    // `j` is now the first item the line has NOT cut into — the anchor itself,
    // not the last cut one. Clamps fall out of the same rule: before the column
    // nothing has passed (j=0, rung 0, authored rest); past it every top has
    // passed (j=length), so it holds at the last rung and never leaves.
    return Math.min(j, Math.max(list.length - 1, 0));
  };

  /** Travel ladder: the items share the node's positioned ancestor, so their
   *  `offsetTop` deltas ARE the distance the pair must move. */
  const rungFor = (j: number, list: HTMLElement[]): number =>
    list.length === 0 ? 0 : list[j].offsetTop - list[0].offsetTop;

  let appliedIndex = -1;
  let hasMoved = false;
  let settle: ReturnType<typeof setTimeout> | undefined;
  let raf = 0;

  /** Paint a rung. `eased` is false for resize, where the column has re-laid
   *  out underneath the pair and gliding to the new number would animate a
   *  change the visitor did not cause. */
  const paint = (index: number, list: HTMLElement[], eased = true) => {
    const offset = rungFor(index, list);
    if (offset === 0 && !hasMoved) {
      // Never left rung 0 — leave the authored markup completely alone.
      appliedIndex = index;
      return;
    }
    hasMoved = true;
    appliedIndex = index;
    node.style.transition = eased ? GLIDE : "";
    // An exact 0 goes back to the authored transform rather than
    // `translateY(0px)`; the transition still interpolates to identity.
    node.style.transform = offset === 0 ? "" : `translateY(${offset}px)`;
  };

  const step = () => {
    raf = 0;
    const list = items();
    if (!desktop.matches) {
      // Below the breakpoint the pair rests in the column flow — park it, and
      // forget any pending handover so it cannot fire after the resize.
      clearTimeout(settle);
      settle = undefined;
      if (hasMoved) paint(0, list, false);
      return;
    }
    if (list.length === 0) return;

    const target = indexFor(window.scrollY, list);
    if (target === appliedIndex) return;

    // Restart the settle clock on every CHANGE of target, so a flick through
    // several cards resolves to one hop once the index stops moving.
    clearTimeout(settle);
    settle = setTimeout(() => {
      settle = undefined;
      const now = items();
      if (now.length === 0) return;
      paint(indexFor(window.scrollY, now), now);
    }, SETTLE_MS);
  };

  // One frame per scroll burst. This is COALESCING, not animation: `step` reads
  // the scroll position and decides an index; the browser owns the motion.
  const wake = () => {
    if (raf) return;
    raf = requestAnimationFrame(step);
  };

  const onResize = () => {
    clearTimeout(settle);
    settle = undefined;
    const list = items();
    if (!desktop.matches) {
      if (hasMoved) paint(0, list, false);
      return;
    }
    if (list.length) paint(indexFor(window.scrollY, list), list, false);
  };

  window.addEventListener("scroll", wake, { passive: true });
  window.addEventListener("resize", onResize);

  // Mount: settle on the right rung immediately and WITHOUT easing — a deep
  // link can land mid-column, and gliding in from rest would be motion nobody
  // scrolled for. At rung 0 this writes nothing at all.
  if (desktop.matches) {
    const list = items();
    if (list.length) paint(indexFor(window.scrollY, list), list, false);
  }

  return {
    destroy() {
      window.removeEventListener("scroll", wake);
      window.removeEventListener("resize", onResize);
      if (raf) cancelAnimationFrame(raf);
      clearTimeout(settle);
    },
  };
}
