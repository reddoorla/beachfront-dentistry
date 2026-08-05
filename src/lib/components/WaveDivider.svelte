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
  <svg
    viewBox="0 0 1200 120"
    preserveAspectRatio="none"
    class="block {heightClass}"
    style="width: {width}"
  >
    <path
      d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
      {fill}
    />
  </svg>
</div>
