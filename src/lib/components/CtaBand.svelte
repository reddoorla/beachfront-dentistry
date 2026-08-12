<script lang="ts">
  import HeroBackgroundImage from "$lib/components/HeroBackgroundImage.svelte";
  import ReadReviewsExpander from "$lib/components/ReadReviewsExpander.svelte";
  import RichTextBody from "$lib/components/RichTextBody.svelte";
  import { pillClass } from "$lib/components/OutlineButton.svelte";
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
    //
    // The breaks live HERE, in the component, and not in the seeded Prismic
    // content, because the Migration API strips `\n` out of StructuredText on
    // write: the seeded pages came back as one unbroken string and rendered the
    // band 168px short (2 lines, h=336) on all five nav routes while the detail
    // routes — which take this default — stayed correct at 3 lines / h=504.
    // Prismic's serializer turns `\n` into <br> faithfully; it just never gets
    // one. So this band's copy is chrome, identical on every page, owned by one
    // source of truth. An editor CAN still override it per page in Prismic;
    // an override simply wraps naturally instead of hard-breaking.
    { type: "heading2", text: "Ready for \ngreat dental \nhealth?", spans: [] },
  ];
  const DEFAULT_CTA_LINK: LinkField = { link_type: "Web", url: "#appointment" };

  interface Props {
    heading?: RichTextField;
    body?: RichTextField;
    ctaLabel?: string | null;
    ctaLink?: LinkField;
    /** `null` is a real state, not just an omission: the detail routes read
     *  this off the `settings` singleton, which degrades to null rather than
     *  taking every page down when the document is unreachable. Same shape as
     *  DetailHero/SubpageHero, which already accepted it. */
    backgroundImage?: ImageField | null;
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
    // Live's closing-band button reads "Book Appointment" (no "an"), and
    // MarkUp pin 5980c9d7 #3 renames every Book CTA to "Request", keeping each
    // label's article shape — a deliberate deviation from the reference. The
    // detail routes render <CtaBand/> with no label and take this default.
    ctaLabel = "Request Appointment",
    ctaLink = DEFAULT_CTA_LINK,
    backgroundImage = {},
    caption,
    sliceType,
    sliceVariation,
  }: Props = $props();

  const hasImage = $derived(!!backgroundImage?.url);
  // An EMPTY heading field means "this band is chrome — use the shared copy",
  // which is what the seeded nav pages now send. Svelte's prop default only
  // covers `undefined`, and Prismic hands back `[]` for an empty rich text, so
  // the fallback has to be explicit or those pages render a headless band.
  const headingField = $derived(heading?.length ? heading : DEFAULT_HEADING);
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
    class="mt-0 flex flex-col items-center gap-[65px] lg:mt-[29px] lg:gap-[30px]"
    use:animateIn={LIVE_REVEAL}
  >
    {#if ctaLabel && ctaLink}
      <!-- Live's `.button.text-color-primary-dark`: 25px museo-slab in a 67px
           pill. The hover/press language is the shared one — see
           OutlineButton.svelte's module block for the colourways and their
           measured contrast. This band's pill stays a `<PrismicLink>` rather
           than an `<OutlineButton>` because its href is an editor-settable
           field whose external values need the target/rel PrismicLink resolves
           and the component does not model. -->
      <PrismicLink
        field={ctaLink}
        class="closing-cta-button {pillClass(
          'teal',
        )} px-[1em] py-[1.3em] leading-[0] text-[14px] xs:text-[15px] md:text-[20px] lg:text-[25px]"
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
        <PrismicRichText field={headingField} />
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
      <HeroBackgroundImage image={backgroundImage ?? {}} preload={false} />
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
             it). Left ladder on live: 60px inside `.content-width`
             (beachfront.css:6372-6379 → x=80@1440, 60@1294/1200, 60@834),
             8% ≤767 (:8714-8717), 5% ≤479 (:9248-9251). No scrim on live.
             Its line-height is the unitless ratio 1.15, so it tracks the font
             size at every breakpoint (11.5/17.25/23/28.75). -->
        <!-- MarkUp d486b3c5 thread 9ae81c12-aef2-4a2f-bec2-26aacad680f4
             (pin #11): "the Fiji Islands label looks like it's too far right…
             left-align all the way down the page." The label now takes the
             shared content gutter: max(60px, 50% − 640px) at ≥992 (= live's
             own 80/60/60 — the old flat lg:left-20 was 20px right of live
             below 1400), 48px at 768–991 (deliberate deviation: live keeps
             60px there, the gutter is 48), 8%/5% below (= live, and the
             missing xs tier was a 5%-vs-8% infidelity). See LEDGER
             2026-08-10. -->
        <!-- Round H4, operator (MarkUp thread 7dd0c2f2): "wave should never
             touch the text". `bottom-[20%]`/`lg:bottom-[31%]` are fractions of
             the PHOTO, but the thing to clear is the footer's wave, which is
             anchored to the footer's top — and the footer top is not the photo
             bottom: this section's `-mb-[10%]` (a percentage of WIDTH) drags
             the footer up over the photo by 39/83/144px at 390/834/1440. So a
             percentage of the photo's height could never track it, and the
             label sat under the arc: probed overlap −24.0 @834, −14.0 @1440,
             −1.4 @1294. `calc(10vw + Npx)` undoes the overlap exactly, leaving
             N px between the label and the footer's top at every width in the
             band; N is the footer wave's own box height (128/160), the same
             "clear the divider's box" rule the hero mounts take, so the
             clearance is constant (29.9px @md, 37.3px @lg) instead of drifting.
             ≤767 now takes the same rule (footer wave box = 96px there). H4
             left it on `bottom-[20%]` believing the label was unpainted below
             768; it is not — probed at 390/480/700 it renders at opacity 1
             with its baseline 80.4/76.8/68.0px INSIDE the footer wave's box,
             which is the "wave touching the text" this directive forbids. The
             wave-divider spec could not see it because its scroll pass never
             actually scrolled (`scroll-behavior: smooth` ate the jumps) and it
             measured hidden elements' boxes; both are fixed in the same
             commit, and the 8px-clearance assertion now covers 390. -->
        <p
          class="absolute bottom-[calc(10vw_+_96px)] left-[5%] z-10 font-sans text-[10px] leading-[1.15] font-light text-white xs:left-[8%] xs:text-[15px] md:bottom-[calc(10vw_+_128px)] md:left-12 md:text-[20px] lg:bottom-[calc(10vw_+_160px)] lg:left-[max(60px,calc(50%_-_640px))] lg:text-[25px]"
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
        <PrismicRichText field={headingField} />
      </div>
      <RichTextBody field={body} />
      {@render ctaButtons()}
    </div>
  {/if}
</section>
