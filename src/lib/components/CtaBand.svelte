<script lang="ts">
  import HeroBackgroundImage from "$lib/components/HeroBackgroundImage.svelte";
  import RichTextBody from "$lib/components/RichTextBody.svelte";
  import WaveDivider from "$lib/components/WaveDivider.svelte";
  import { PrismicLink, PrismicRichText } from "@prismicio/svelte";
  import type { ImageField, LinkField, RichTextField } from "@prismicio/client";

  // The site's recurring closing band — extracted from Hero's `cta`
  // variation (see src/lib/slices/Hero/index.svelte) so the typed detail
  // routes (services/questions/team-members) can close on the same band
  // without going through a slice zone. Hero's cta variation renders this
  // unchanged, passing its own slice fields straight through; every other
  // caller renders with no props and gets the live band's defaults below.
  const DEFAULT_HEADING: RichTextField = [
    { type: "heading2", text: "Ready for great dental health?", spans: [] },
  ];
  const DEFAULT_CTA_LINK: LinkField = { link_type: "Web", url: "#appointment" };

  interface Props {
    heading?: RichTextField;
    body?: RichTextField;
    ctaLabel?: string | null;
    ctaLink?: LinkField;
    backgroundImage?: ImageField;
    /** Slice identity — set only by Hero's cta variation (an actual slice
     * instance whose section needs `data-slice-type`/`data-slice-variation`
     * for the slice-zone tooling + its own tests). The detail-route callers
     * aren't slices and simply omit these, so the attributes are absent from
     * their DOM (Svelte drops an attribute whose value is `undefined`). */
    sliceType?: string;
    sliceVariation?: string;
  }

  let {
    heading = DEFAULT_HEADING,
    body = [],
    ctaLabel = "Book an Appointment",
    ctaLink = DEFAULT_CTA_LINK,
    backgroundImage = {},
    sliceType,
    sliceVariation,
  }: Props = $props();

  const hasImage = $derived(!!backgroundImage?.url);
</script>

<!-- Photo CTA band: the site's recurring "Ready for great dental health?"
     band — full-bleed photo, dark scrim, centered slab heading (h1/h2 pick
     up font-slab globally, see app.css), pill CTA, wave divider at the TOP
     only. bg-neutral-900 (the same dark canvas Hero's default photo path
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
  data-slice-type={sliceType}
  data-slice-variation={sliceVariation}
  class="relative isolate w-full overflow-hidden bg-neutral-900 text-white"
>
  <WaveDivider fill="white" flip />
  <div class="relative w-full" style="min-height: 45vh;">
    {#if hasImage}
      <HeroBackgroundImage image={backgroundImage} preload={false} />
    {/if}
    <!-- Scrim between the photo and the text. /60, not Modal's /50: the
         scrim must guarantee 4.5:1 for white body text over ANY photo, and
         the worst case is a pure-white pixel — black at 50% composites
         that to #808080, only ≈3.95:1 under white (fails AA); at 60% it
         composites to #666666, ≈5.7:1 (passes with margin). -->
    <div class="absolute inset-0 bg-black/60"></div>
    <div class="relative z-10 mx-auto max-w-3xl px-6 py-20 text-center">
      <PrismicRichText field={heading} />
      <RichTextBody field={body} />
      {#if ctaLabel && ctaLink}
        <PrismicLink
          field={ctaLink}
          class="mt-6 inline-block rounded-full bg-white px-8 py-3 font-semibold text-primary-deep focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900 focus-visible:outline-hidden"
        >
          {ctaLabel}
        </PrismicLink>
      {/if}
    </div>
  </div>
</section>
