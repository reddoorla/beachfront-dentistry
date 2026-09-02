# Team slider: seamless infinite loop, and the name that wraps

**Date:** 2026-09-02 · **Asked by:** Tucker (Discord/verbal, on the merged
PR #38 build) · **Approved:** same day, scope "both team sliders".

> Dr. Michael Hopkins goes to two lines on his card, can we relax the padding
> on that name, it can go a bit wider than the text if it keeps everything
> inline height wise. Transitioning to infinite scroll after the first click
> (in either direction) would be great.

## 1. The name

**Where.** `src/lib/slices/CollectionList/index.svelte`, the person card's
`<h5>` (the `.team-list-item` card, both the grid and slider variants).

**Measured** (`matching/probe-team-names.mjs`): the widest name on one line is
"Dr. Michael Hopkins" at 295px (30px museo-slab light). The slider card is
340px wide with 24px side padding at lg, so the column is 292px — three
pixels short, at 1440, 1200 and 1024 alike. The grid card at 1200 is the same
340px. The grid at 1024 is 281px wide and phones are 240px; no padding change
reaches those.

**Change.** `lg:-mx-3` on the `<h5>`: the name's box extends 12px into each
side of the card's padding (316px available), stays centred, keeps its size.
No `nowrap`: a name longer than 316px still wraps and the card still grows,
which is what ROUND C decided ("the box needs to grow", our-team pin #3).

**Result.** The first-visit slider is one line at every desktop width, so
every card is the live ladder height and the row is level. The grid at 1200
is one line too. The grid at 1024 and phones keep wrapping (one card visible
at a time on phones, so nothing reads as misaligned there).

**Check.** `tests/interaction/team-card.spec.ts`: on `/your-first-visit` at
1440/1200/1024, no slider card `h5` has more than one line and every slider
card has the same height.

## 2. Seamless infinite loop

**Where.** `src/lib/components/Slider.svelte`, a new `infinite` prop
(default `false`), enabled on the two team sliders in `CollectionList`: the
home headshot row ("Meet the team") and the first-visit card slider ("Meet
our team"). The office-tour photo carousel and the review carousel (own
machinery) are unchanged.

**Today.** `loop` wraps by index: next on the last position sets the index to
0 and the track slides all the way back — a visible rewind.

**Mechanics.**

- Active only when `mode === "slide"`, `loop`, and `itemCount >
  responsiveCardsPerView`; otherwise the prop is a no-op and behaviour is
  exactly today's.
- The track renders the items three times (`3n` cells; cell `i` renders
  `children({ index: i % n })` and is labelled `${(i % n) + 1} of ${n}`).
- The index starts at `n` (the middle copy's first item). Because the
  translate formula is linear in the index and the first `n` cells are the
  same width as the real ones, the rest frame is pixel-identical to today's.
- `next`/`prev` (buttons, arrow keys, swipe, autoplay) move one step in the
  pressed direction with no upper/lower bound.
- **Snap.** Before applying a step (and after a resize clamps the range), if
  the index is outside `[n, 2n)` it is normalised by `±n` with the
  transition disabled for one frame: set `snapping`, apply the normalised
  index, `await tick()`, force a reflow, clear `snapping`, then apply the
  step. The two frames are identical pixels, so the user sees one ordinary
  step. Doing it before the next move rather than on `transitionend` makes
  it independent of transition timing, so it holds under reduced motion.
- Dots: `goToSlide(i)` targets `n + i`; the active dot is
  `((index % n) + n) % n`. The live-region announcement uses the same
  modulus.
- Arrows are never `aria-disabled` in infinite mode.
- Accessibility: the cells outside the visible window are `inert` +
  `aria-hidden` exactly as today, so copies never add tab stops or duplicate
  announcements; the visible window is whichever cells are on screen.

**Checks.**

- `src/lib/components/Slider.test.ts`: three-copy render with modulo labels;
  rest index `n` in the transform; prev from rest goes to `n − 1` (the last
  item) not `maxSlide`; next from the last real position continues forward
  and the following move is normalised into the middle copy; dots map
  modulo; arrows never disabled; the prop is a no-op when everything fits.
- `tests/interaction/team-slider-loop.spec.ts` on `/your-first-visit` at
  1440: the rest frame's first card sits where it does today; twelve
  next-clicks advance the leftmost card by exactly one roster position each
  time (never back by ten); one prev-click from rest shows the last roster
  member as the leftmost card.

## Ledger

Both are operator-directed deviations from live (live's slider rewinds;
live's name box is the card's padding box) and are recorded in
`matching/LEDGER.md` under this round.
