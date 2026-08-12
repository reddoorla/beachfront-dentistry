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
         primary-colour rule (same trap SubpageHero documents).
         failSafe (MarkUp thread 738ad46b-0be6-4d92-a1c0-73a53e4c298e pin #2,
         "Sometimes this name shows up and sometimes it doesn't"): the label's
         only reveal path was the IntersectionObserver — in an embed where it
         never fires (or rAF is throttled to a stop) the name persisted at
         opacity 0. Forces the revealed state within 1.5s of mount; when the
         observer works the reveal is byte-identical to before (LIVE_REVEAL,
         delayMax 0).
         Alignment (same thread, pin #2's other half, operator decode
         2026-08-11: "never aligned correctly" = "horizontal alignment to the
         content width"): the label sits on the SHARED content gutter at every
         width — the same mx-auto max-w-[1400px] px ladder the nav band
         carries (Nav.svelte: 20px @<768, 48px 768–991, then 60px + the 1400
         cap, ≡ max(60px, 50% − 640px) at lg → 80 @1440, 60 @1294). The old
         lg:left-20 was a 1440-only sample: right at 1440, 20px adrift
         everywhere in the 992–1399 band (probed 80 vs 60 @1354/1294). -->
    <!-- Bottom offset (Round H4): `bottom-[10%]` is a fraction of the BAND, so
         it tracked nothing in particular and put the label inside the wave
         divider's box at every width — probed overlap −23.9/−25.0 @390,
         −20.6/−22.6 @834, −44.5/−43.5 @1440 (name / breadcrumb variants).
         Operator, MarkUp thread 7dd0c2f2: "wave should never touch the text".
         The offset is now the divider's own box-height ladder (WaveDivider
         `heightClass`, 72/96/120), so the label clears the whole box with a
         measured 11.8/17.4/23px to spare. Absolute box — the band's height and
         everything below it are untouched. -->
    <!-- `data-detail-label` is the interaction suite's handle on this block.
         It used to select on `[class*="bottom-[10%]"]`, which meant a spacing
         change (H4's) silently broke a test about HORIZONTAL alignment. -->
    <div
      data-detail-label
      class="absolute bottom-[72px] left-5 z-10 md:bottom-[96px] md:left-12 lg:bottom-[120px] lg:left-[max(60px,calc(50%-640px))]"
      use:animateIn={{ ...LIVE_REVEAL, failSafe: 1500 }}
    >
      {#if labelSize === "name"}
        <!-- Live's name h1 (`.hero` title): 25px/38 @390 (must clear the
             headshot on the right) → 60px/72 @1440, museo-slab THIN (w100).
             The md tier is live's own measured 28px/38 — flat right across
             768–991; the 44px here was never calibrated against live. -->
        <h1
          class="font-slab text-[25px] leading-[38px] font-thin md:text-[28px] md:leading-[38px] lg:text-[60px] lg:leading-[72px]"
          style="color:#fff"
        >
          {label}
        </h1>
      {:else}
        <!-- Live's breadcrumb h3: 21px/26 from 390 right through 991, then
             40px/50 at >=992, museo-slab LIGHT (w300 — NOT the name's thin).
             The "20px @390" this comment used to claim was wrong: the style
             census reads 21px there on live. -->
        <p
          class="font-slab text-[21px] leading-[26px] font-light lg:text-[40px] lg:leading-[50px]"
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
