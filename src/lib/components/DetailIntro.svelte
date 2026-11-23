<script lang="ts">
  import { animateIn, ABOVE_FOLD_REVEAL } from "$lib/actions/animateIn";

  // Live's `.service-page-title-subtitle-section` / question `.headings-section`
  // (identical treatment): a big cyan museo-slab-thin title on the left, then a
  // cyan museo-slab lede indented to the right ~third (live: title x=80; lede
  // x=502 = 33% into the 1280 content box, max-w 845). Colour forced inline so
  // the global `main h1–h3` primary rule can't recolour the title.
  //   • titleSize "xl" → 140px (service, single-line titles).
  //   • titleSize "lg" → 100px (question, longer wrapping titles).
  // variant "editorial" (questions only; the operator's pick, 2026-11-23,
  // workspace decision 2026-11-23-1947-beachfront-faq-typography-direction):
  // a light deep-teal title on a calmer 36→56→72 scale, and the lede as a
  // left-ruled deep-teal pull quote instead of live's right-indented cyan.
  // Deep teal (#0e7799, 5.1:1 on white) because the cyan lede was 3.09:1 at
  // 20px, below AA for normal-size text at 390 and 834.
  let {
    title,
    lede,
    titleSize = "xl",
    variant = "live",
  }: {
    title: string;
    lede?: string;
    titleSize?: "xl" | "lg";
    variant?: "live" | "editorial";
  } = $props();

  const editorial = $derived(variant === "editorial");
  const titleClass = $derived(
    editorial
      ? "max-w-[900px] pt-[8px] text-[36px] leading-[44px] font-light text-balance md:text-[56px] md:leading-[64px] lg:text-[72px] lg:leading-[80px]"
      : titleSize === "xl"
        ? "font-thin text-[56px] leading-[70px] md:text-[72px] md:leading-[80px] lg:text-[140px] lg:leading-[168px]"
        : "font-thin pt-[20px] text-[50px] leading-[60px] md:text-[100px] md:leading-[120px] lg:text-[100px] lg:leading-[120px]",
  );
  const ledeClass = $derived(
    editorial
      ? "mt-[24px] max-w-[720px] border-l-4 border-primary pl-4 text-[20px] leading-[32px] font-light md:text-[24px] md:leading-[36px] lg:max-w-[760px] lg:text-[28px] lg:leading-[42px]"
      : "mt-[30px] text-[20px] leading-[30px] font-light md:ml-[33%] md:w-[66%] lg:max-w-[845px] lg:text-[30px] lg:leading-[45px]",
  );
  const ink = $derived(editorial ? "#0e7799" : "#129ecc");
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
      class="font-slab {titleClass}"
      data-reveal
      style="color:{ink}"
      use:animateIn={ABOVE_FOLD_REVEAL}
    >
      {title}
    </h1>
    {#if lede}
      <!-- Live's lede is `.text-body-large`: 20px/30 mobile → 30px/45 desktop
           (right-indented ~⅓ at desktop), 30px below the title box. -->
      <p
        class="font-slab {ledeClass}"
        data-reveal
        style="color:{ink}"
        use:animateIn={ABOVE_FOLD_REVEAL}
      >
        {lede}
      </p>
    {/if}
  </div>
</section>
