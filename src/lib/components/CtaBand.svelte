<script lang="ts">
  import HeroBackgroundImage from "$lib/components/HeroBackgroundImage.svelte";
  import ReadReviewsExpander from "$lib/components/ReadReviewsExpander.svelte";
  import RichTextBody from "$lib/components/RichTextBody.svelte";
  import { animateIn, LIVE_REVEAL } from "$lib/actions/animateIn";
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
    // Live's closing-band button reads "Book Appointment" (no "an") — the
    // detail routes render <CtaBand/> with no label and must match it.
    ctaLabel = "Book Appointment",
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
  <div
    class="mt-0 flex flex-col items-center gap-[65px] lg:mt-10 lg:gap-[30px]"
    use:animateIn={LIVE_REVEAL}
  >
    {#if ctaLabel && ctaLink}
      <!-- Live's `.button.text-color-primary-dark`: 25px museo-slab in a 67px
           pill, and the hover is opacity .6 + a translucent cyan fill (the
           border/text colours do NOT change). -->
      <PrismicLink
        field={ctaLink}
        class="font-slab focus-visible:ring-primary-deep inline-flex h-[41px] items-center rounded-lg border border-[#365b6d] px-[14px] text-[14px] font-light text-[#365b6d] transition-[opacity,background-color] hover:bg-[#129ecc4a] hover:opacity-60 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden xs:text-[15px] md:text-[20px] lg:h-[67px] lg:px-[25px] lg:text-[25px]"
      >
        {ctaLabel}
      </PrismicLink>
    {/if}
    <!-- Live's "Read Reviews" expander — discloses the Google/Facebook/Yelp
         row (same block as under the review slider). -->
    <ReadReviewsExpander class="mb-20 lg:mb-24" />
  </div>
{/snippet}

<section
  data-slice-type={sliceType}
  data-slice-variation={sliceVariation}
  class="w-full {hasImage ? '-mb-[39px] lg:-mb-36' : ''}"
>
  {#if hasImage}
    <!-- Heading on white; live's CTA band has ~0 top padding (the gap above
         comes from the section above; its mobile H2 sits flush at the section
         top with 24px below to the photo). -->
    <div class="mx-auto max-w-5xl px-6 pt-0 pb-6 text-center lg:pt-2 lg:pb-8">
      <!-- [&_h2]:text-wrap defeats the global `text-wrap: balance` (app.css:401)
           — live FILLS this heading ("Ready for great / dental health?", 2 lines
           @650) but balance spread ours over 3 even lines, pushing the pill +
           Read-Reviews stack down and misaligning the whole band (Hero/steps
           headings undo the same rule). -->
      <div
        class="display-xl h-primary [&_h2]:text-wrap"
        use:animateIn={LIVE_REVEAL}
      >
        <PrismicRichText field={heading} />
      </div>
      <RichTextBody field={body} />
    </div>
    <!-- Fiji photo. Live's `.fiji-section` is `height:70vw` at ≤767
         (beachfront.css:8679) — 273px@390 (the value we'd hard-coded, matching
         by luck), but 336@480 / 455@650, so a fixed 273 ran short across the
         landscape band (page-diff Ready Δh 9–12%). 70vw tracks it; desktop keeps
         the measured ~800px (20rem at the scaled root). Its white-faded top
         carries the CTAs. -->
    <div
      class="relative isolate min-h-[70vw] w-full overflow-hidden lg:min-h-[800px]"
    >
      <HeroBackgroundImage image={backgroundImage} preload={false} />
      <!-- White for the top ~18% fading to clear by ~60%, so the heading above
           dissolves into the beach and the CTAs read on white (fade into FIJI). -->
      <div
        class="pointer-events-none absolute inset-x-0 top-0 z-[1] h-3/5"
        style="background:linear-gradient(#fff, #fff 18%, rgba(255,255,255,0))"
        aria-hidden="true"
      ></div>
      <div
        class="relative z-10 mx-auto max-w-5xl px-6 pt-5 text-center lg:pt-4"
      >
        {@render ctaButtons()}
      </div>
      {#if caption}
        <!-- Live's `.cta-beach-label`: museo-sans w300 white, 25px desktop /
             10px small, absolute at bottom 20% (which clears the footer wave
             that overlaps the photo's bottom edge — a lower anchor hides under
             it), 60px / 5% from the left. No scrim on live; the label sits on
             the darker water band of the photo. -->
        <p
          class="absolute bottom-[20%] left-[5%] z-10 font-sans text-[10px] leading-[1.15] font-light text-white xs:text-[15px] xs:leading-[17px] md:text-[20px] md:leading-[23px] lg:bottom-[31%] lg:left-20 lg:text-[25px]"
          use:animateIn={LIVE_REVEAL}
        >
          {caption}
        </p>
      {/if}
    </div>
  {:else}
    <div class="mx-auto max-w-5xl px-6 py-24 text-center">
      <!-- [&_h2]:text-wrap defeats the global `text-wrap: balance` (app.css:401)
           — live FILLS this heading ("Ready for great / dental health?", 2 lines
           @650) but balance spread ours over 3 even lines, pushing the pill +
           Read-Reviews stack down and misaligning the whole band (Hero/steps
           headings undo the same rule). -->
      <div
        class="display-xl h-primary [&_h2]:text-wrap"
        use:animateIn={LIVE_REVEAL}
      >
        <PrismicRichText field={heading} />
      </div>
      <RichTextBody field={body} />
      {@render ctaButtons()}
    </div>
  {/if}
</section>
