<script lang="ts">
  import type { Snippet } from "svelte";
  import { animateIn } from "$lib/actions/animateIn";

  // The shared shell for the hand-authored Prismic slices: a full-bleed
  // <section> "band" wrapping a centered content box. Layout comes entirely
  // from the Tailwind classes the caller supplies (sectionClass/contentClass).
  // `fallbackHeight` keeps a background-image band (the hero) tall enough for
  // its photo when nothing else gives it a height. `reveal` opts the content
  // box into a scroll-triggered fade/slide-up (viewport mode, reduced-motion
  // aware) — a snappy 700ms/2rem, not the dramatic Blux-band default.
  let {
    sliceType,
    variation,
    sectionClass = "",
    contentClass = "",
    fallbackHeight,
    reveal = false,
    background,
    children,
  }: {
    sliceType?: string;
    variation?: string;
    sectionClass?: string;
    contentClass?: string;
    fallbackHeight?: string;
    reveal?: boolean;
    background?: Snippet;
    children: Snippet;
  } = $props();
</script>

<section
  data-slice-type={sliceType}
  data-slice-variation={variation}
  class="w-full {sectionClass}"
  style={fallbackHeight
    ? `min-height: ${fallbackHeight}; display: flex; flex-direction: column; justify-content: center`
    : undefined}
>
  {@render background?.()}
  {#if reveal}
    <div
      class="mx-auto w-full {contentClass}"
      use:animateIn={{ duration: 700, translateY: "2rem" }}
    >
      {@render children()}
    </div>
  {:else}
    <div class="mx-auto w-full {contentClass}">
      {@render children()}
    </div>
  {/if}
</section>
