<script lang="ts">
  import HeroBackgroundImage from "$lib/components/HeroBackgroundImage.svelte";
  import WaveDivider from "$lib/components/WaveDivider.svelte";
  import { animateIn, LIVE_REVEAL } from "$lib/actions/animateIn";
  import {
    asText,
    type ImageField,
    type RichTextField,
  } from "@prismicio/client";

  // The recurring subpage opener (live's `.hero.<page>` band): a page-specific
  // photo cover-filling a short band, a bottom-anchored centered THIN slab
  // heading in white, and the flip wave seaming into the white section below.
  // Shared by every subpage via Hero's `subpage` variation so the treatment
  // (height ladder, heading scale, wave, legibility scrim) lives in one place.
  //
  // Height ladder read off live `.hero`/`.hero.redondo`: 33vw (≥992, =475@1440)
  // / 60vw (768–991) / 70vw (480–767) / 95vw (≤479, =371@390). Heading is the
  // absolute `.subpage-hero-heading`: white font-weight-100 museo-slab, centered
  // full-width at desktop, left-aligned at 80%/left-10% below 992 (measured
  // 140px/168 @1440 → 56px/70 @390).
  let {
    heading,
    backgroundImage,
    subtitle,
  }: {
    heading?: RichTextField | null;
    backgroundImage?: ImageField | null;
    // optional cyan intro line some subpages carry directly under the heading
    subtitle?: string | null;
  } = $props();

  const headingText = $derived(asText((heading ?? []) as RichTextField));
</script>

<section
  data-slice-type="hero"
  data-slice-variation="subpage"
  class="relative isolate flex min-h-[95vw] w-full items-center justify-center overflow-hidden bg-dark text-white xs:min-h-[70vw] md:min-h-[60vw] lg:min-h-[33vw]"
>
  {#if backgroundImage?.url}
    <HeroBackgroundImage image={backgroundImage} preload={true} />
  {/if}
  <!-- Bottom scrim: live's photo reads plenty dark at the base, but the white
       thin heading needs a touch of contrast insurance (a11y) — a soft
       transparent→dark wash on the bottom third, no design reshape. -->
  <div
    class="pointer-events-none absolute inset-x-0 bottom-0 h-1/2"
    style="background:linear-gradient(rgba(0,0,0,0), rgba(0,0,0,0.28))"
    aria-hidden="true"
  ></div>
  <!-- `.subpage-hero-heading`: absolute bottom 2%, full-width centered at
       desktop, left-aligned 80% (left 10%) below 992. -->
  <div
    class="absolute bottom-[2%] left-[10%] z-10 w-4/5 lg:left-0 lg:w-full"
    use:animateIn={LIVE_REVEAL}
  >
    <!-- Inline white: the unlayered global `main h1–h3` primary-colour rule
         outranks a `text-white` utility (same trap as the QA card title), so
         force the live white heading with an inline style. -->
    <h2
      class="font-slab text-left text-[56px] leading-[70px] font-thin md:text-[90px] md:leading-[108px] lg:text-center lg:text-[140px] lg:leading-[168px]"
      style="color:#fff"
    >
      {headingText}
    </h2>
    {#if subtitle}
      <p
        class="font-slab mt-2 text-left text-[20px] leading-[30px] font-light text-white lg:text-center lg:text-[30px] lg:leading-[45px]"
      >
        {subtitle}
      </p>
    {/if}
  </div>
  <!-- Live's hero wave (`.bot-wave.flip`): rotate(180) so the white
       next-section edge waves UP into the band. -->
  <div class="absolute bottom-0 left-0 z-10 w-full">
    <WaveDivider fill="white" flip />
  </div>
</section>
