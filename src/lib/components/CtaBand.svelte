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
    /** Small location label over the photo (the live "FIJI ISLANDS" whimsy).
     * Only rendered when a background photo is present. */
    caption?: string;
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
    caption,
    sliceType,
    sliceVariation,
  }: Props = $props();

  const hasImage = $derived(!!backgroundImage?.url);
</script>

<!-- The site's recurring closing band, in two live parts:
     1. A brand-blue oversized "Ready for great dental health?" display heading
        (h1/h2 pick up font-slab + primary globally; .display-xl drives the
        140px/w100 size) on the plain white page, with a ghost-pill CTA.
     2. A separate full-bleed photo band underneath carrying only the small
        location caption (the live "FIJI ISLANDS" whimsy) — no heading over it.
     The photo band uses bg-dark behind the WaveDivider's transparent negative
     space so the white fill reads as the white section above seaming into it
     (WaveDivider's fill-matches-neighbour contract). The Footer renders right
     after with its own top wave, so this band has no bottom wave. -->
<section
  data-slice-type={sliceType}
  data-slice-variation={sliceVariation}
  class="w-full"
>
  <div class="mx-auto max-w-5xl px-6 py-24 text-center">
    <div class="display-xl h-primary">
      <PrismicRichText field={heading} />
    </div>
    <RichTextBody field={body} />
    {#if ctaLabel && ctaLink}
      <PrismicLink
        field={ctaLink}
        class="text-dark hover:border-primary hover:text-primary-deep focus-visible:ring-primary-deep mt-10 inline-block rounded-full border border-black/15 px-8 py-3 font-light transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden"
      >
        {ctaLabel}
      </PrismicLink>
    {/if}
  </div>

  {#if hasImage}
    <div class="relative isolate w-full overflow-hidden bg-dark">
      <WaveDivider fill="white" flip />
      <div class="relative w-full" style="min-height: 42vh;">
        <HeroBackgroundImage image={backgroundImage} preload={false} />
        {#if caption}
          <!-- Caption legibility: a small bottom-left scrim guarantees the
               white location label clears AA over any bright photo pixel. -->
          <div
            class="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/50 to-transparent"
          ></div>
          <p
            class="absolute bottom-4 left-5 z-10 text-xs font-bold tracking-[0.2em] text-white uppercase"
          >
            {caption}
          </p>
        {/if}
      </div>
    </div>
  {/if}
</section>
