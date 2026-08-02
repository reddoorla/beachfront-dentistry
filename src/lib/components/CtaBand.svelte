<script lang="ts">
  import HeroBackgroundImage from "$lib/components/HeroBackgroundImage.svelte";
  import RichTextBody from "$lib/components/RichTextBody.svelte";
  import { animateIn, LIVE_REVEAL } from "$lib/actions/animateIn";
  import { PrismicLink, PrismicRichText } from "@prismicio/svelte";
  import type { ImageField, LinkField, RichTextField } from "@prismicio/client";
  import { REVIEWS_URL } from "$lib/site";

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

<!-- The site's recurring closing band. On the home page (backgroundImage set)
     it matches live's closing composition: the brand-blue oversized "Ready for
     great dental health?" display heading on white, then a tall (~800px) fiji
     beach photo whose white-faded TOP carries the CTA buttons (so they read on
     white while the beach shows below) — live's "fade into FIJI". The Footer
     renders right after and dips its pale wave up into the photo's bottom.
     The detail routes (services/questions/team-members) render with no image
     and get the plain heading-over-white block with the buttons beneath. -->

{#snippet ctaButtons()}
  <!-- Live reveals the button stack as its own element (rows at op 0 until
       scrolled to), separate from the heading's reveal. -->
  <div class="mt-10 flex flex-col items-center gap-6" use:animateIn={LIVE_REVEAL}>
    {#if ctaLabel && ctaLink}
      <PrismicLink
        field={ctaLink}
        class="font-slab hover:border-primary hover:text-primary-deep focus-visible:ring-primary-deep inline-block rounded-lg border border-[#365b6d] px-[14px] py-[10px] text-[14px] font-light text-[#365b6d] transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden lg:px-[25px] lg:py-[14px] lg:text-[25px]"
      >
        {ctaLabel}
      </PrismicLink>
    {/if}
    <!-- "Read Reviews +" secondary CTA (live) → the Yelp business page. -->
    <a
      href={REVIEWS_URL}
      target="_blank"
      rel="noopener"
      class="text-dark hover:text-primary-deep focus-visible:ring-primary-deep inline-flex items-center gap-2 text-lg font-light focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden"
    >
      Read Reviews
      <!-- Live's own Plus.svg asset (its .plus-minus-block is 25×25). -->
      <img src="/icons/plus.svg" alt="" class="w-[25px]" aria-hidden="true" />
    </a>
  </div>
{/snippet}

<section
  data-slice-type={sliceType}
  data-slice-variation={sliceVariation}
  class="w-full {hasImage ? '-mb-[39px] lg:-mb-36' : ''}"
>
  {#if hasImage}
    <!-- Heading on white; live's CTA band has ~0 top padding (the gap above
         comes from the section above) and a small ~38px gap to the photo. -->
    <div class="mx-auto max-w-5xl px-6 pt-2 pb-8 text-center">
      <div class="display-xl h-primary" use:animateIn={LIVE_REVEAL}>
        <PrismicRichText field={heading} />
      </div>
      <RichTextBody field={body} />
    </div>
    <!-- Fiji photo. Live's band is only ~273px on mobile (a short beach strip),
         growing to ~800px on desktop; the 800px was desktop-only and was pushing
         the whole footer + map off-screen on mobile. Its white-faded top carries
         the CTAs. -->
    <div
      class="relative isolate min-h-[273px] w-full overflow-hidden lg:min-h-[800px]"
    >
      <HeroBackgroundImage image={backgroundImage} preload={false} />
      <!-- White for the top ~18% fading to clear by ~60%, so the heading above
           dissolves into the beach and the CTAs read on white (fade into FIJI). -->
      <div
        class="pointer-events-none absolute inset-x-0 top-0 z-[1] h-3/5"
        style="background:linear-gradient(#fff, #fff 18%, rgba(255,255,255,0))"
        aria-hidden="true"
      ></div>
      <div class="relative z-10 mx-auto max-w-5xl px-6 pt-4 text-center">
        {@render ctaButtons()}
      </div>
      {#if caption}
        <!-- Caption legibility: a small bottom-left scrim guarantees the
             white location label clears AA over any bright photo pixel. -->
        <div
          class="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-24 bg-gradient-to-t from-black/50 to-transparent"
        ></div>
        <p
          class="absolute bottom-4 left-5 z-10 text-xs font-bold tracking-[0.2em] text-white uppercase"
          use:animateIn={LIVE_REVEAL}
        >
          {caption}
        </p>
      {/if}
    </div>
  {:else}
    <div class="mx-auto max-w-5xl px-6 py-24 text-center">
      <div class="display-xl h-primary" use:animateIn={LIVE_REVEAL}>
        <PrismicRichText field={heading} />
      </div>
      <RichTextBody field={body} />
      {@render ctaButtons()}
    </div>
  {/if}
</section>
