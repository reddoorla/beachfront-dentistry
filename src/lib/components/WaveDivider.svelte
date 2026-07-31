<script lang="ts">
  /** The Webflow site's section-divider wave. `fill` should match the
   * neighbouring section's background so the wave reads as its edge.
   *
   * The path lives in a `0 0 1200 120` viewBox with `preserveAspectRatio="none"`,
   * so the CSS height IS the crest amplitude (the old 48px squashed it into a
   * flat, wrong-looking ripple). Live steps the height at 992px and 1280px:
   * the section waves run 72→96→120 and the deeper footer wave 96→128→160, so
   * `heightClass` carries those responsive utilities (default = the section
   * triple). Width is constant across breakpoints — ~133% for the section
   * waves, ~169% for the broad, shallow footer arc. */
  interface Props {
    fill?: string;
    flip?: boolean;
    /** Responsive Tailwind height utilities (see the block comment for live's
     * 72/96/120 vs 96/128/160 steps at the 992px and 1280px breakpoints). */
    heightClass?: string;
    /** CSS width of the stretched SVG (it overflows the container so the crest
     * clears the edges). */
    width?: string;
    /** Which edge of the overflowing SVG sits flush with the container. Live's
     * hero wave is right-aligned (overflow spills left); the footer keeps the
     * default left. Controls which crests land at the visible edges. */
    align?: "left" | "center" | "right";
  }

  let {
    fill = "white",
    flip = false,
    heightClass = "h-[72px] min-[992px]:h-[96px] xl:h-[120px]",
    width = "calc(133% + 1.3px)",
    align = "left",
  }: Props = $props();

  const justify = $derived(
    { left: "justify-start", center: "justify-center", right: "justify-end" }[
      align
    ],
  );
</script>

<div
  aria-hidden="true"
  class="pointer-events-none flex w-full overflow-hidden leading-none {justify} {flip
    ? 'rotate-180'
    : ''}"
>
  <svg
    viewBox="0 0 1200 120"
    preserveAspectRatio="none"
    class="block shrink-0 {heightClass}"
    style="width: {width}"
  >
    <path
      d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
      {fill}
    />
  </svg>
</div>
