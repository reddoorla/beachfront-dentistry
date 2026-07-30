<script lang="ts">
  /** The Webflow site's section-divider wave. `fill` should match the
   * neighbouring section's background so the wave reads as its edge.
   *
   * `height` is the rendered wave height in px. The path lives in a
   * `0 0 1200 120` viewBox with `preserveAspectRatio="none"`, so the CSS
   * height IS the crest amplitude — the live site renders these at 120px
   * (deeper 160px for the closing/footer wave). Rendering shorter (the old
   * 48px) vertically squashes the crest into a flat, wrong-looking ripple,
   * so the default matches live's 120px. */
  interface Props {
    fill?: string;
    flip?: boolean;
    height?: number;
    /** CSS width of the stretched SVG (it overflows the container so the crest
     * clears the edges). Live renders the section waves at ~133% (a defined
     * crest) and the deeper closing/footer wave at ~169%, which stretches the
     * same path into the broad, shallow arc that reads at the footer seam. */
    width?: string;
  }

  let {
    fill = "white",
    flip = false,
    height = 120,
    width = "calc(133% + 1.3px)",
  }: Props = $props();
</script>

<div
  aria-hidden="true"
  class="pointer-events-none w-full overflow-hidden leading-none {flip
    ? 'rotate-180'
    : ''}"
>
  <svg
    viewBox="0 0 1200 120"
    preserveAspectRatio="none"
    class="block"
    style="height: {height}px; width: {width}"
  >
    <path
      d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
      {fill}
    />
  </svg>
</div>
