<script lang="ts">
  import HeroBackgroundImage from "$lib/components/HeroBackgroundImage.svelte";
  import RichTextBody from "$lib/components/RichTextBody.svelte";
  import ContentBand from "$lib/components/ContentBand.svelte";
  import WaveDivider from "$lib/components/WaveDivider.svelte";
  import { PrismicLink, PrismicRichText } from "@prismicio/svelte";
  import type { Content } from "@prismicio/client";
  import { bandFor, type Presentation } from "$lib/blux/presentation";
  import BluxSectionBand from "$lib/blux/SectionBand.svelte";
  import BandContent from "$lib/blux/BandContent.svelte";
  import BandTitle from "$lib/blux/BandTitle.svelte";

  // The `band` variation is not in the generated prismic types yet
  // (regenerating them needs a wired Prismic repo), so widen the union locally.
  type HeroBandSlice = {
    slice_type: "hero";
    variation: "band";
    primary: {
      band?: number | null;
      heading?: string | null;
      subtitle?: string | null;
      body?: string | null;
    };
    items: unknown[];
  };

  // `cta` is likewise absent from the generated types (same reason). Its
  // primary fields are identical to `default`'s (model.json says so
  // explicitly), so reuse that generated primary shape rather than
  // re-declaring it.
  type HeroCtaSlice = {
    slice_type: "hero";
    variation: "cta";
    primary: Content.HeroSliceDefaultPrimary;
    items: unknown[];
  };

  let {
    slice,
    context,
  }: {
    slice: Content.HeroSlice | HeroBandSlice | HeroCtaSlice;
    context?: { presentation?: Presentation };
  } = $props();

  let hasImage = $derived(
    slice.variation === "default" && !!slice.primary.background_image?.url,
  );

  // `cta` shares `default`'s background_image field but gets its own presence
  // check since it renders through a dedicated markup path, not ContentBand's
  // `hasImage`-gated one below.
  let ctaHasImage = $derived(
    slice.variation === "cta" && !!slice.primary.background_image?.url,
  );

  const band = $derived(
    bandFor(
      context?.presentation,
      (slice.primary as { band?: number | null }).band ?? null,
    ),
  );
</script>

{#if slice.variation === "band"}
  <!-- Blux band hero: background media + block style from the presentation
       manifest, overlay text from the page doc, roles from band.text. Above
       the fold — eagerBackground keeps the LCP image eager and skips the
       scroll reveal. -->
  <BluxSectionBand
    {band}
    eagerBackground
    sliceType={slice.slice_type}
    sliceVariation={slice.variation}
  >
    <BandContent {band} class="relative z-10">
      <BandTitle
        heading={slice.primary.heading}
        subtitle={slice.primary.subtitle}
        text={band?.text}
      />
      {#if slice.primary.body}<p class="txt-role-text1 mt-4">
          {slice.primary.body}
        </p>{/if}
    </BandContent>
  </BluxSectionBand>
{:else if slice.variation === "cta"}
  <!-- Photo CTA band: the site's recurring "Ready for great dental health?"
       band — full-bleed photo, dark scrim, centered slab heading (h1/h2 pick
       up font-slab globally, see app.css), pill CTA, wave divider at the TOP
       only. bg-neutral-900 (same dark canvas the default photo path above
       already sits on) shows through the WaveDivider's transparent negative
       space, so — per WaveDivider's fill-matches-neighbour contract — the
       white fill reads as the light page above seaming into this band. The
       bottom seam deliberately has NO wave here: this band closes every page
       and the Footer renders immediately after with its own top wave that
       owns that exact seam (see Footer.svelte) — a second wave here would
       stack two dividers, and white would be the wrong fill against the dark
       footer anyway. The pill reuses Nav's solid-CTA-on-a-brand-band pairing
       (bg-white text-primary-deep, 5.10:1) rather than the reverse
       (bg-primary-deep text-white would still clear AA on its own, but white
       reads as the stronger "solid" affordance against a photo, and matches
       the CTA everywhere else it already appears in chrome). The focus
       ring's offset is neutral-900 rather than Nav's primary-deep — Nav's
       ring-offset matches its own solid-color band; this band's real
       backdrop behind the pill is the photo+scrim, and neutral-900 (this
       section's own canvas color) is the closer neighbour than an unrelated
       brand blue. -->
  <section
    data-slice-type={slice.slice_type}
    data-slice-variation={slice.variation}
    class="relative isolate w-full overflow-hidden bg-neutral-900 text-white"
  >
    <WaveDivider fill="white" flip />
    <div class="relative w-full" style="min-height: 45vh;">
      {#if ctaHasImage}
        <HeroBackgroundImage
          image={slice.primary.background_image}
          preload={false}
        />
      {/if}
      <!-- Scrim between the photo and the text. /60, not Modal's /50: the
           scrim must guarantee 4.5:1 for white body text over ANY photo, and
           the worst case is a pure-white pixel — black at 50% composites
           that to #808080, only ≈3.95:1 under white (fails AA); at 60% it
           composites to #666666, ≈5.7:1 (passes with margin). -->
      <div class="absolute inset-0 bg-black/60"></div>
      <div class="relative z-10 mx-auto max-w-3xl px-6 py-20 text-center">
        <PrismicRichText field={slice.primary.heading} />
        <RichTextBody field={slice.primary.body} />
        {#if slice.primary.cta_label && slice.primary.cta_link}
          <PrismicLink
            field={slice.primary.cta_link}
            class="mt-6 inline-block rounded-full bg-white px-8 py-3 font-semibold text-primary-deep focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900 focus-visible:outline-hidden"
          >
            {slice.primary.cta_label}
          </PrismicLink>
        {/if}
      </div>
    </div>
  </section>
{:else}
  <!-- Full-bleed image band. When the slice carries a background image we
     stand the band 45vh tall so the photo shows; white overlay copy comes
     from the section class. -->
  <ContentBand
    sliceType={slice.slice_type}
    variation={slice.variation}
    fallbackHeight={hasImage ? "45vh" : undefined}
    sectionClass="hero-band relative isolate overflow-hidden bg-neutral-900 text-white"
    contentClass="relative z-10 max-w-4xl px-6 py-24 text-center"
  >
    {#snippet background()}
      {#if hasImage}
        <HeroBackgroundImage
          image={slice.primary.background_image}
          preload={false}
        />
      {/if}
    {/snippet}
    <PrismicRichText field={slice.primary.heading} />
    <RichTextBody field={slice.primary.body} />
    {#if slice.primary.cta_label && slice.primary.cta_link}
      <PrismicLink
        field={slice.primary.cta_link}
        class="mt-6 inline-block bg-white px-6 py-3 font-medium text-black"
      >
        {slice.primary.cta_label}
      </PrismicLink>
    {/if}
  </ContentBand>
{/if}
