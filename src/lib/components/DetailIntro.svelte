<script lang="ts">
  import { animateIn, LIVE_REVEAL } from "$lib/actions/animateIn";

  // Live's `.service-page-title-subtitle-section` / question `.headings-section`
  // (identical treatment): a big cyan museo-slab-thin title on the left, then a
  // cyan museo-slab lede indented to the right ~third (live: title x=80; lede
  // x=502 = 33% into the 1280 content box, max-w 845). Colour forced inline so
  // the global `main h1–h3` primary rule can't recolour the title.
  //   • titleSize "xl" → 140px (service, single-line titles).
  //   • titleSize "lg" → 100px (question, longer wrapping titles).
  let {
    title,
    lede,
    titleSize = "xl",
  }: {
    title: string;
    lede?: string;
    titleSize?: "xl" | "lg";
  } = $props();
</script>

<!-- Live places a ~20px MARGIN between the hero and this title band (not
     padding), so the section box itself starts 20px below the wave. -->
<section class="mt-5 w-full">
  <div class="mx-auto max-w-[1440px] px-5 lg:px-20">
    <h1
      class="font-slab font-thin {titleSize === 'xl'
        ? 'text-[48px] leading-[54px] lg:text-[140px] lg:leading-[168px]'
        : 'text-[40px] leading-[46px] lg:text-[100px] lg:leading-[120px]'}"
      style="color:#129ecc"
      use:animateIn={LIVE_REVEAL}
    >
      {title}
    </h1>
    {#if lede}
      <p
        class="font-slab mt-8 text-[18px] leading-[27px] font-light lg:mt-[50px] lg:ml-[33%] lg:max-w-[845px] lg:text-[30px] lg:leading-[45px]"
        style="color:#129ecc"
        use:animateIn={LIVE_REVEAL}
      >
        {lede}
      </p>
    {/if}
  </div>
</section>
