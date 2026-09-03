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
- **At rest the track is plain** — one copy, index 0 — so the first frame
  (and every gate anchor cut from it) is unchanged. "After the first click":
  the first move in either direction _engages_ three copies of the items
  (`3n` cells; cell `i` renders `children({ index: i % n, clone })` and is
  labelled `${(i % n) + 1} of ${n}`). The `each` is keyed so the cells
  already on screen become the middle copy — same DOM nodes, moved — and the
  index is re-based by `+n` in the same frame; pixels do not change.
- From then on `next`/`prev` (buttons, arrow keys, swipe, autoplay) move one
  step in the pressed direction with no upper/lower bound.
- **Snap.** Before applying a step, if the index is outside `[n, 2n)` it is
  normalised by `±n` with the transition suppressed for one frame: set
  `snapping` (the track gets `transition-none` — merely dropping
  `transition-transform` leaves the CSS default `transition-property: all`
  under the duration utilities, and the snap itself animates), apply the
  normalised index, `await tick()`, force a reflow, clear `snapping`, then
  apply the step. Doing it before the next move rather than on
  `transitionend` makes it independent of transition timing, so it holds
  under reduced motion.
- Copies render with `clone: true`, and every cell renders with `offscreen`:
  whether it was CREATED outside the on-screen window (the fully visible
  cells plus the clipped partial one at the right edge), captured once at
  creation and kept for the cell's life. See §3 for what the card does with
  it.
- Dots: one per item; `goToSlide(i)` targets `n + i` (engaging first if
  needed); the active dot is `((index % n) + n) % n`. The live-region
  announcement uses the same modulus.
- Arrows are never `aria-disabled` in infinite mode.
- A resize that makes everything fit while engaged drops back to a plain
  track on the real index, without a glide.
- Accessibility: the cells outside the visible window are `inert` +
  `aria-hidden` exactly as today, so copies never add tab stops or duplicate
  announcements; the visible window is whichever cells are on screen.

**Checks.**

- `src/lib/components/Slider.test.ts`: plain at rest and three copies with
  modulo labels on the first move; prev from rest goes to `n − 1` (the last
  item) not `maxSlide`; next past the last item continues forward and the
  following move is normalised into the middle copy; dots map modulo;
  arrows never disabled; the prop is a no-op when everything fits.
- `tests/interaction/team-slider-loop.spec.ts` on `/your-first-visit` at
  1440, motion on: the rest frame is one copy with the first card at the
  content gutter; a full lap of next-clicks advances the leftmost card by
  exactly one roster position each time; and MID-transition across the seam,
  in both directions, the last and first cards are on screen together and no
  mid-roster card is — the end state cannot tell a seamless step from a
  rewind, the middle of the motion can.

## 3. One entrance per person (preview feedback, same day)

Tucker on deploy-preview-42: "initial behavior is good, double the length of
the transition in for items that are initially hidden. if I click left twice
the second click retriggers a fadein from all visible items, I assumes that's
moving to a different set of clones, please fix that." And: "for the full
boxes, add the fade effect on the edges that we have on the pure headshot
carousel."

**The retrigger.** The first prev from rest engages the track and slides in
the last item's CLONE (no reveal — clones were disabled). The second prev
first snaps the index by `+n`, which teleports the last item's REAL cell into
the spot the clone occupied. That real cell had been waiting for its reveal
since page load (off screen at rest), so it arrived at opacity 0 and faded
in, and the item beside it did the same as it slid in. The clone/real split
was the wrong unit: an entrance belongs to a PERSON, not a cell.

**Change.** `CollectionList` keeps a reactive `seen: SvelteSet<uid>`. A card
whose uid is seen mounts with `animateIn` `{ disabled: true }`; otherwise it
gets the reveal plus `onReveal: () => seen.add(uid)` (new option: called
when the entrance plays). `disabled` is now also honoured on UPDATE: a cell
still waiting settles to visible in one frame with no transition, its
observer and timers torn down; a reveal already under way is left to finish.
So the first cell of a person to slide in plays the entrance and the person's
other cells never do — including the one the snap teleports in, and clones
created later.

**The doubled fade.** A card created off screen (`offscreen` from the
Slider) reveals with `SLIDE_IN_REVEAL` = LIVE_REVEAL at 2 × 750ms. The cards
on screen at rest keep the page-load reveal and their `index % 3` stagger.
This also gives the prev direction a fade on first appearance (before, a
clone never faded), so the two directions match — which needed one more
thing: the next card to enter from the left waits as a 37px sliver at the
screen edge (cell margin + track padding), and a plain viewport observer
counts that sliver as seen, so the card faded in under the edge fade and
then slid in with nothing left to play (the first run of the browser check
below caught exactly this). Slider cards therefore observe with
`rootMargin: "0px -80px"` (`EDGE_FADE_WIDTH`, exported by the Slider and
also what sizes its fades): a card is seen once it is past the fade band.

**The edge fade.** The first-visit card slider gets the home headshot row's
`edgeFadeColor="#fff"`: two 80px gradients at the screen edges, desktop
only, under the arrows. Live gives only the headshot row this
(`.heads-opacity-gradient`, beachfront.css:7504-7530); on the card slider it
is operator-directed.

**Checks.** `animateIn.test.ts`: `disabled` on update settles a waiting
element (no styles, no marker, observer disconnected, a late intersection
inert), leaves a running reveal alone, `onReveal` fires when the entrance
plays and not on settle. `Slider.test.ts`: the `offscreen` mark at creation
and after the track engages. `team-slider-loop.spec.ts`: two prev clicks
with motion on — mid-step after the second, every card that was on screen is
at opacity 1 and not held hidden, while the newly entering card is mid-fade;
and the edge fades exist at 1440 spanning the track, hidden at 834.

## Ledger

Both are operator-directed deviations from live (live's slider rewinds;
live's name box is the card's padding box) and are recorded in
`matching/LEDGER.md` under this round.
