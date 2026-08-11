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
   * Width is constant across breakpoints — ~133% for the section waves, ~169%
   * for the broad, shallow footer arc. */
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
     * flips both axes. */
    mirror?: boolean;
    /** Responsive Tailwind height utilities (see the block comment for live's
     * 72/96/120 vs 96/128/160 rem ladders, stepping at 768 and 992). */
    heightClass?: string;
    /** CSS width of the stretched SVG (it overflows the container so the crest
     * clears the edges). */
    width?: string;
  }

  let {
    fill = "white",
    flip = false,
    mirror = false,
    heightClass = "h-[72px] md:h-[96px] lg:h-[120px]",
    width = "calc(133% + 1.3px)",
  }: Props = $props();
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
       So this is a GENUINE sine, not live's asymmetric swoosh
       (matching/spec/detail-svc.html:123): y = 60 − 32·sin(2π·3x/1200) —
       three full periods across the viewBox, uniform amplitude 32 (crest 28,
       trough 92, so it fits the existing 120 box with 28px margins and no
       page height had to grow). Fitted with 4 cubic Hermite segments per
       period (exact quarter-period knots + tangents, dx/3 handles; max
       deviation from the true sine 0.35px). Integer periods make y(0)=y(1200),
       so the mirrored usage stays seamless. The V0 H0 close and the A-round
       overlap-seam mechanics (heights, widths, absolute footer overlay) are
       unchanged — the fill still hugs the full top edge, so every seam stays
       watertight. -->
  <svg
    viewBox="0 0 1200 120"
    preserveAspectRatio="none"
    class="block {heightClass}"
    style="width: {width}"
  >
    <path
      d="M0,60C33.33,43.24,66.67,28,100,28C133.33,28,166.67,43.24,200,60C233.33,76.76,266.67,92,300,92C333.33,92,366.67,76.76,400,60C433.33,43.24,466.67,28,500,28C533.33,28,566.67,43.24,600,60C633.33,76.76,666.67,92,700,92C733.33,92,766.67,76.76,800,60C833.33,43.24,866.67,28,900,28C933.33,28,966.67,43.24,1000,60C1033.33,76.76,1066.67,92,1100,92C1133.33,92,1166.67,76.76,1200,60V0H0Z"
      {fill}
    />
  </svg>
</div>
