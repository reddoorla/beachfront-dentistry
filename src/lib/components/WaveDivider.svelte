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
   * so the whole viewBox is on screen and the wave completes a whole number of
   * periods across the RENDERED width. Any overflow factor reintroduces the
   * defect H4 fixed — see the CLEARANCE/ENDS note on the <svg> below. */
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
     * flips both axes. Since H4 the path is symmetric about its own centre, so
     * this is a visual no-op; it is kept because the class is part of the
     * services-band DOM the gates measure. */
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

       ENDS (Round H4, operator: "sine should be only up/down on each page
       landing at the same height"). H1's path was y = 60 − 32·sin(2π·3x/1200)
       inside an SVG stretched to 133% (169% in the footer) of a clip box that
       is `overflow-hidden`. Only the leading 1/1.33 of the viewBox was ever on
       screen, so the visible run was 2.26 periods, not 3: the wave entered at
       the mid-line and left on a crest, a full amplitude higher. Measured
       right-end minus left-end before the fix: −19.2px @390, −25.6 @834,
       −32.0 @1440 on every hero/detail divider and +25.2/+33.7/+42.1 on the
       169% footer arc. The wave was climbing across every divider on the site.

       The fix is structural, not a tuned number:
         · the SVG is exactly as wide as its box (`calc(100% + 1.3px)`, the
           1.3px being the shape-divider hairline insurance), so the RENDERED
           width is the viewBox width and nothing is cropped mid-period;
         · TWO whole periods across that width — y = 60 − 32·cos(πx/300);
         · COSINE, not sine, so both ends sit on an extremum where dy/dx = 0.
           The 1.3px of overhang is therefore a second-order error: the visible
           right end differs from the left by ≤0.037px at every width and every
           box height, versus 0.36–0.80px for the sine phase. Ends are level by
           construction at every mount, at every viewport, with no per-mount
           arithmetic to keep in sync.
       The visible wavelength barely moves (0.44W→0.50W on the section waves,
       0.56W→0.50W in the footer), so the divider keeps its character while
       every mount now draws the same wave.

       Fitted with 4 cubic Hermite segments per period (exact quarter-period
       knots + tangents, dx/3 handles; max deviation from the true cosine
       0.35px). y(0) = y(1200) = 28 and the path is symmetric about x=600, so
       both the mirrored services mount and the rotated ones tile seamlessly.
       The V0 H0 close and the A-round overlap-seam mechanics (heights,
       absolute footer overlay) are unchanged — the fill still hugs the full
       top edge across the full box width, so every seam stays watertight. -->
  <svg
    viewBox="0 0 1200 120"
    preserveAspectRatio="none"
    class="block {heightClass}"
    style="width: calc(100% + 1.3px)"
  >
    <path
      d="M0,28C50,28,100,43.24,150,60C200,76.76,250,92,300,92C350,92,400,76.76,450,60C500,43.24,550,28,600,28C650,28,700,43.24,750,60C800,76.76,850,92,900,92C950,92,1000,76.76,1050,60C1100,43.24,1150,28,1200,28V0H0Z"
      {fill}
    />
  </svg>
</div>
