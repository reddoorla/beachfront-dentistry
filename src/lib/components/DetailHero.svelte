<script lang="ts">
  import HeroBackgroundImage from "$lib/components/HeroBackgroundImage.svelte";
  import WaveDivider from "$lib/components/WaveDivider.svelte";
  import { animateIn, LIVE_REVEAL } from "$lib/actions/animateIn";
  import type { ImageField } from "@prismicio/client";
  import type { Snippet } from "svelte";

  // The detail-page opener (live's `.hero` band on team-member / service /
  // question pages): a photo cover-filling the 33vw band (same height ladder as
  // SubpageHero — 95vw→70→60→33), a bottom-left WHITE thin-slab label, the cyan
  // legibility wash, and the flip wave seaming into the white section below.
  //   • labelSize "name"  → the person's NAME as an h1 (64px) — team-member.
  //   • labelSize "crumb" → a small breadcrumb (30px) — service / question,
  //     whose real <h1> title lives in the DetailIntro band below.
  // A person page also overhangs a circular headshot past the wave; it's passed
  // as the `overlay` snippet (which positions itself) so this stays generic.
  let {
    backgroundImage,
    label,
    labelSize = "crumb",
    overlay,
  }: {
    backgroundImage?: ImageField | null;
    label: string;
    labelSize?: "name" | "crumb";
    overlay?: Snippet;
  } = $props();
</script>

<!-- overflow-visible so the overlay headshot can overhang past the wave; the
     inner band clips the photo/wave to the 33vw height. -->
<section class="relative isolate w-full overflow-visible bg-dark text-white">
  <!-- Detail-hero height ladder read off live `.hero`: 70vw (<768, =273@390) /
       60vw (768–991, =461@768) / 33vw (≥992, =475@1440). Shorter than the
       subpage-hero 95vw base. -->
  <div
    class="relative flex min-h-[70vw] w-full overflow-hidden md:min-h-[60vw] lg:min-h-[33vw]"
  >
    {#if backgroundImage?.url}
      <HeroBackgroundImage image={backgroundImage} preload={true} />
    {/if}
    <!-- Same cyan wash as SubpageHero: a top cyan tint fading out + a
         transparent→cyan bottom wash, so the white label reads over the
         photo. -->
    <div
      class="pointer-events-none absolute inset-x-0 top-0 h-1/3"
      style="background:linear-gradient(rgba(18,158,204,0.8), rgba(0,0,0,0))"
      aria-hidden="true"
    ></div>
    <div
      class="pointer-events-none absolute inset-x-0 bottom-0 h-1/2"
      style="background:linear-gradient(rgba(0,0,0,0), rgba(18,158,204,0.8))"
      aria-hidden="true"
    ></div>

    <!-- Bottom-left label. Inline white defeats the global `main h1–h3`
         primary-colour rule (same trap SubpageHero documents). -->
    <div
      class="absolute bottom-[13%] left-5 z-10 lg:left-20"
      use:animateIn={LIVE_REVEAL}
    >
      {#if labelSize === "name"}
        <!-- Live's name @390 is ~24px (must clear the headshot on the right);
             scales to 64px @1440. -->
        <h1
          class="font-slab text-[24px] leading-[30px] font-thin md:text-[44px] md:leading-[52px] lg:text-[64px] lg:leading-[76px]"
          style="color:#fff"
        >
          {label}
        </h1>
      {:else}
        <p
          class="font-slab text-[22px] leading-[28px] font-thin md:text-[26px] md:leading-[34px] lg:text-[30px] lg:leading-[40px]"
          style="color:#fff"
        >
          {label}
        </p>
      {/if}
    </div>

    <!-- Live's hero wave (`.bot-wave.flip`): white next-section edge waving up
         into the band. -->
    <div class="absolute bottom-0 left-0 z-10 w-full">
      <WaveDivider fill="white" flip />
    </div>
  </div>

  {@render overlay?.()}
</section>
