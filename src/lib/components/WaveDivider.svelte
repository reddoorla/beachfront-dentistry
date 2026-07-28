<script lang="ts">
  /** The Webflow site's section-divider wave. `fill` should match the
   * neighbouring section's background so the wave reads as its edge. */
  interface Props {
    fill?: string;
    flip?: boolean;
  }

  let { fill = "white", flip = false }: Props = $props();
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
    class="block h-12 w-[calc(133%+1.3px)]"
  >
    <path
      d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
      {fill}
    />
  </svg>
</div>
