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
    // Live hard-breaks this heading — `Ready for <br/>great dental <br/>health?`
    // — so it is THREE lines at every width, independent of the box width. That
    // is why its h2 can span the full band (x=0, w=viewport) without the text
    // spreading out. Matching the box without the breaks would drop us to two
    // lines at >=768.
    { type: "heading2", text: "Ready for \ngreat dental \nhealth?", spans: [] },
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
  class="w-full {hasImage ? '-mb-[10%]' : ''}"
>
  {#if hasImage}
    <!-- Live's heading is `h2.text-align-center.my-4` sitting at x=0 spanning
         the FULL band width, with `.my-4{margin:1rem 0}` against the stepped
         root = 24/32/40px above and below. Ours was capped at max-w-5xl (so
         the box was 976 wide at 1440 instead of 1440, changing where the text
         wraps) and had no vertical margin at all, which pulled the whole CTA
         24-40px up into the section above it. -->
    <div class="w-full px-6 text-center lg:px-0">
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
    <!-- `.fiji-section{height:20rem;margin-bottom:-10%}` with a `height:70vw`
         override at <=767. Against the stepped root that is 640px across
         769-991 and 800px at >=993 — the md step was missing, so the band ran
         56px short right through the tablet band. The -10% bottom margin
         resolves against the containing block's WIDTH, reproducing live's
         -144/-83/-60/-39 at 1440/834/600/390 in one declaration (the old flat
         -39px was 44px short at 834). -->
    <div
      class="relative isolate min-h-[70vw] w-full overflow-hidden md:min-h-[640px] lg:min-h-[800px]"
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
             the darker water band of the photo.
             Its line-height is the unitless ratio 1.15, so it tracks the font
             size at every breakpoint (11.5/17.25/23/28.75); the per-breakpoint
             px values that used to sit here were 6px short at desktop. -->
        <p
          class="absolute bottom-[20%] left-[5%] z-10 font-sans text-[10px] leading-[1.15] font-light text-white xs:text-[15px] md:text-[20px] lg:bottom-[31%] lg:left-20 lg:text-[25px]"
          use:animateIn={LIVE_REVEAL}
        >
          {caption}
        </p>
      {/if}
    </div>
  {:else}
    <!-- No-image (detail-route) close: live gives the "Ready" heading ~0 top
         padding — the gap above comes from each page's back-link section — so
         only the bottom padding lives here. -->
    <div class="mx-auto max-w-5xl px-6 pt-0 pb-24 text-center">
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
