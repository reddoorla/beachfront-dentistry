<script lang="ts">
  import HeroBackgroundImage from "$lib/components/HeroBackgroundImage.svelte";
  import RichTextBody from "$lib/components/RichTextBody.svelte";
  import CtaBand from "$lib/components/CtaBand.svelte";
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
       band. The markup + the a11y/contrast decisions (scrim math, wave
       placement, pill-button pairing, focus-ring offset) live in
       CtaBand.svelte, which this variation shares with the
       services/questions/team-members detail routes (they render it with no
       props and get its defaults; this slice passes its own primary fields
       through instead). -->
  <CtaBand
    heading={slice.primary.heading}
    body={slice.primary.body}
    ctaLabel={slice.primary.cta_label}
    ctaLink={slice.primary.cta_link}
    backgroundImage={slice.primary.background_image}
    sliceType={slice.slice_type}
    sliceVariation={slice.variation}
  />
{:else}
  <!-- Full-bleed photographic opening hero. Bottom-left slab heading over the
       photo (a video-poster still on home), a bottom-weighted gradient scrim
       for legibility, a pill CTA, and the wave divider seaming into the white
       section below. `hero-band` drives the 100vh first-child height and the
       white heading colour (app.css). The band stays `bg-dark` so it reads as
       a deliberate dark canvas if a photo is ever absent, rather than blank. -->
  <section
    data-slice-type={slice.slice_type}
    data-slice-variation={slice.variation}
    class="hero-band relative isolate flex min-h-[80vh] w-full items-end overflow-hidden bg-dark text-white"
  >
    {#if hasImage}
      <HeroBackgroundImage
        image={slice.primary.background_image}
        preload={true}
      />
    {/if}
    <div
      class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/5"
    ></div>
    <div class="relative z-10 mx-auto w-full max-w-6xl px-6 pt-36 pb-28">
      <div class="max-w-3xl">
        <PrismicRichText field={slice.primary.heading} />
        <RichTextBody field={slice.primary.body} />
        {#if slice.primary.cta_label && slice.primary.cta_link}
          <PrismicLink
            field={slice.primary.cta_link}
            class="mt-8 inline-block rounded-full bg-white px-8 py-3 font-semibold text-primary-deep focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-dark focus-visible:outline-hidden"
          >
            {slice.primary.cta_label}
          </PrismicLink>
        {/if}
      </div>
    </div>
    <div class="absolute bottom-0 left-0 z-10 w-full">
      <WaveDivider fill="white" />
    </div>
  </section>
{/if}
