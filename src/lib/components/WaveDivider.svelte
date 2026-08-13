<script lang="ts">
  /** The Webflow site's section-divider wave. `fill` should match the
   * neighbouring section's background so the wave reads as its edge.
   *
   * The path lives in a `0 0 1200 120` viewBox with `preserveAspectRatio="none"`,
   * so the CSS height IS the crest amplitude (the old 48px squashed it into a
   * flat, wrong-looking ripple).
   *
   * Live sizes these in REM — `.bot-wave svg{height:3rem}` and the footer arc
   * `height:4rem` — against its stepped root (40px >=993 / 32px 769-992 / 24px
   * <=768). So the real ladders are 72/96/120 and 96/128/160, and they step at
   * 768 and 992, NOT at 992 and 1280. The old 992/1280 defaults left every
   * section wave 24px shallow across the whole 769-991 band and again across
   * 993-1279, so the crest sat ~24px lower into the white on every page.
   *
   * WIDTH IS NOT A PROP (Round H4). The SVG is exactly as wide as its clip box,
   * so the whole viewBox is on screen and the wave completes exactly ONE period
   * across the RENDERED width, at every viewport. Any overflow factor crops it
   * mid-period and reintroduces the defect H4 fixed — see the note on the <svg>
   * below. */
  interface Props {
    fill?: string;
    /** Rotate the divider 180° — live's `.bot-wave` / shape-divider-bottom sit
     * at a section's BOTTOM and are `transform: rotate(180deg)`, so the filled
     * region drops below the wavy edge and the crest pokes UP into the section
     * above (the correct hero→white and FIJI→footer seams). The 180° also
     * mirrors horizontally, which is why the left-aligned overflowing SVG reads
     * right-aligned — no separate alignment control is needed. */
    flip?: boolean;
    /** Mirror horizontally only (live's `.bot-wave.flip` = rotateY(180deg)):
     * the crest's higher side moves to the LEFT while the filled region stays
     * on top — the steps→services seam. Distinct from `flip`, whose rotate-180
     * flips both axes.
     *
     * This is a REAL visual difference again. Under the two-period cosine it
     * was a no-op, because that path was symmetric about its own centre. The
     * single sine is ANTI-symmetric — f(1200−x) = 120 − f(x) — so mirroring
     * swaps which half carries the crest and which carries the trough. Same
     * wave, run backwards; both ends still sit at neutral, so it tiles into
     * the seam identically. */
    mirror?: boolean;
    /** Responsive Tailwind height utilities (see the block comment for live's
     * 72/96/120 vs 96/128/160 rem ladders, stepping at 768 and 992). */
    heightClass?: string;
  }

  let {
    fill = "white",
    flip = false,
    mirror = false,
    heightClass = "h-[72px] md:h-[96px] lg:h-[120px]",
  }: Props = $props();

  /** The wave's painted crest reaches (60 + 32)/120 = 76.67% of the box height
   * up from the box's flat edge. Anything with glyphs that sits nearer than
   * that IS touched by the wave. The rule the mounts enforce is the simpler,
   * strictly safer one — text clears the divider's whole box, i.e. the same
   * 72/96/120 (96/128/160 in the footer) ladder as `heightClass` — which buys
   * a measured 11.8/17.4/23px of daylight at 390/834/1440. Operator, MarkUp
   * thread 7dd0c2f2: "wave should never touch the text". */
</script>

<div
  aria-hidden="true"
  class="pointer-events-none w-full overflow-hidden leading-none {flip
    ? 'rotate-180'
    : ''} {mirror ? '-scale-x-100' : ''}"
>
  <!-- DELIBERATE DEVIATION from the reference (MarkUp thread 7dd0c2f2, pin
       "Flat spot in the curve"). Operator directive, 2026-08-11: "rewiggling
       is fine, I want a real sine wave even if it means we add some height to
       the page. I'm no longer concerned about matching the original webflow."
       So this is a GENUINE sinusoid, not live's asymmetric swoosh
       (matching/spec/detail-svc.html:123).

       ONE PERIOD, NEUTRAL ENDS. Operator, 2026-08-13: "the wave svg has two
       sine wave, I want a single up and then down, coming back to neutral on
       both side, should be the same on any screen size." So:

           y = 60 − 32·sin(πx/600)      x ∈ [0, 1200]

       — a single crest at x=300 (y=28), a single trough at x=900 (y=92), and
       both ends ON the neutral mid-line, y(0) = y(1200) = 60. Exactly two
       turning points across the divider, which is the literal reading of "a
       single up and then down". The previous path was TWO periods of a cosine
       and therefore entered and left on a crest, not at neutral.

       "the same on any screen size" is structural, not a media query: the SVG
       is exactly as wide as its box, so the RENDERED width IS the viewBox
       width and preserveAspectRatio="none" stretches that one period to fit.
       Every viewport shows the whole wave and nothing else — no cropping, no
       varying period count. (The H1 defect was the opposite: an SVG stretched
       to 133%, 169% in the footer, inside an `overflow-hidden` box, so only
       the leading 1/1.33 of the viewBox was ever on screen and the visible run
       was 2.26 periods rather than 3. Ends landed a full amplitude apart —
       measured −19.2px @390, −25.6 @834, −32.0 @1440, and +25.2/+33.7/+42.1
       on the footer arc. Any overflow factor brings that straight back.)

       WHAT THE NEUTRAL ENDS COST, stated because it is a real regression and a
       deliberate one. `calc(100% + 1.3px)` is shape-divider hairline
       insurance, so the visible right edge samples the curve a hair past
       x=1200. The old cosine phase put both ends on an extremum where
       dy/dx = 0, making that a second-order error: ≤0.037px. Ends at neutral
       are ends at MAXIMUM slope, so the same overhang now costs 0.181px @1440,
       0.202 @1294, 0.250 @834, 0.401 @390 — worst case 40% of the 1px budget
       the H4 check enforces, and still ~50x smaller than the amplitude-sized
       delta that budget exists to catch. Sub-pixel at every width, and the
       price of the shape that was actually asked for.

       Fitted with 4 cubic Hermite segments (exact quarter-period knots +
       tangents, dx/3 handles; max deviation from the true sine 0.344 units,
       measured). The path is ANTI-symmetric about x=600 rather than symmetric
       — a crest answered by a trough — so the mirrored services mount reads as
       the same wave run backwards, which is what a single sine looks like
       either way round. The V0 H0 close and the A-round overlap-seam mechanics
       (heights, absolute footer overlay) are unchanged: the fill still hugs the
       full top edge across the full box width, so every seam stays watertight
       even though the fill now meets the ends at mid-height instead of near
       the crest. -->
  <svg
    viewBox="0 0 1200 120"
    preserveAspectRatio="none"
    class="block {heightClass}"
    style="width: calc(100% + 1.3px)"
  >
    <path
      d="M0,60C100,43.24,200,28,300,28C400,28,500,43.24,600,60C700,76.76,800,92,900,92C1000,92,1100,76.76,1200,60V0H0Z"
      {fill}
    />
  </svg>
</div>
