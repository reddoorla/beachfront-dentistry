<script lang="ts">
  import HeroBackgroundImage from "$lib/components/HeroBackgroundImage.svelte";
  import RichTextBody from "$lib/components/RichTextBody.svelte";
  import ContentBand from "$lib/components/ContentBand.svelte";
  import CtaBand from "$lib/components/CtaBand.svelte";
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
  <!-- Full-bleed image band. When the slice carries a background image we
     stand the band 45vh tall so the photo shows; white overlay copy comes
     from the section class. -->
  <ContentBand
    sliceType={slice.slice_type}
    variation={slice.variation}
    fallbackHeight={hasImage ? "45vh" : undefined}
    sectionClass="hero-band relative isolate overflow-hidden bg-dark text-white"
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
        class="mt-6 inline-block bg-white px-6 py-3 font-medium text-primary-deep"
      >
        {slice.primary.cta_label}
      </PrismicLink>
    {/if}
  </ContentBand>
{/if}
