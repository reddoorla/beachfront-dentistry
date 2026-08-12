<script lang="ts">
  import { animateIn, ABOVE_FOLD_REVEAL } from "$lib/actions/animateIn";

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
  <div class="mx-auto max-w-[1440px] px-5 md:px-12 lg:px-20">
    <!-- Live title sizes (read off `.hero`+title): xl=56px/70 @390, 72/80
         across 768–991, 140/168 desktop; lg=50px/60 @390, 100/120 from 768 up.
         The lg (question) title also carries live's 20px top padding inside
         the box (the xl service title has none), so its text sits 20px lower
         and the box is one pad taller. -->
    <h1
      class="font-slab font-thin {titleSize === 'xl'
        ? 'text-[56px] leading-[70px] md:text-[72px] md:leading-[80px] lg:text-[140px] lg:leading-[168px]'
        : 'pt-[20px] text-[50px] leading-[60px] md:text-[100px] md:leading-[120px] lg:text-[100px] lg:leading-[120px]'}"
      data-reveal
      style="color:#129ecc"
      use:animateIn={ABOVE_FOLD_REVEAL}
    >
      {title}
    </h1>
    {#if lede}
      <!-- Live's lede is `.text-body-large`: 20px/30 mobile → 30px/45 desktop
           (right-indented ~⅓ at desktop), 30px below the title box. -->
      <p
        class="font-slab mt-[30px] text-[20px] leading-[30px] font-light md:ml-[33%] md:w-[66%] lg:max-w-[845px] lg:text-[30px] lg:leading-[45px]"
        data-reveal
        style="color:#129ecc"
        use:animateIn={ABOVE_FOLD_REVEAL}
      >
        {lede}
      </p>
    {/if}
  </div>
</section>
