<script lang="ts">
  import { bandFor, type Presentation } from "$lib/blux/presentation";
  import SectionBand from "$lib/blux/SectionBand.svelte";
  import CarouselFrames, {
    type CarouselFrame,
  } from "$lib/blux/CarouselFrames.svelte";
  import ContentBand from "$lib/components/ContentBand.svelte";
  import ReadReviewsExpander from "$lib/components/ReadReviewsExpander.svelte";
  import Slider from "$lib/components/Slider.svelte";
  import { PrismicImage, PrismicRichText } from "@prismicio/svelte";
  import {
    isFilled,
    asLink,
    asText,
    type RichTextField,
    type ImageField,
    type LinkField,
  } from "@prismicio/client";

  // `review` and `photos` are native Prismic fields (not Blux-manifest-driven)
  // and aren't in the generated prismic types yet — regenerating them needs a
  // wired Slice Machine session, so their shape is widened locally here (same
  // approach as Hero's `band` variation).
  type TrackItem = {
    caption?: string | null;
    subcaption?: string | null;
    quote?: string | null;
    reviewer_name?: string | null;
    reviewer_place?: string | null;
    reviewer_photo?: ImageField;
    review_url?: LinkField;
    image?: ImageField;
  };

  type Props = {
    slice: {
      slice_type: string;
      variation?: string;
      primary: {
        band?: number | null;
        label?: string | null;
        heading?: RichTextField;
        // your-first-visit Office Tour: a full-bleed single-image slider
        // (100vw slides, 8 dots, edge arrows) rather than the capped multi-up
        // review strip. `layout: "fullbleed"` selects it on the photos variation.
        layout?: string | null;
      };
      items?: TrackItem[];
    };
    context?: { presentation?: Presentation };
  };
  let { slice, context = {} }: Props = $props();

  // `review` and `photos` render on the shared Slider — the same track the
  // default variation already rides via CarouselFrames. This ports the live
  // site's big-review.js translateX carousel (no jQuery) and gets Slider's
  // touch swipe, ArrowLeft/Right keyboard nav, and aria-live position
  // announcements for free. `default` stays entirely on the Blux-manifest
  // band path below, untouched.
  const isTrackVariation = $derived(
    slice.variation === "review" || slice.variation === "photos",
  );
  // Office Tour: photos variation in full-bleed mode.
  const isFullbleedTour = $derived(
    slice.variation === "photos" && slice.primary.layout === "fullbleed",
  );
  // `.home-ssb-section { margin-bottom: 1.5rem }` (beachfront.css:7140-7142)
  // exists ONLY on the home page — the class name says so and index.html is the
  // only document carrying it. your-first-visit renders the same
  // `.review-slider-holder` with NO section wrapper, so applying this margin to
  // the shared slice put 36–60px onto yfv that live does not have (it cost yfv
  // a region: 5/24 → 4/24 in matching/out-spec3-yfv). Home opts in explicitly.
  const isHomeSsb = $derived(
    slice.variation === "review" && slice.primary.layout === "home",
  );
  const trackItems = $derived(isTrackVariation ? (slice.items ?? []) : []);
  const trackCount = $derived(trackItems.length);

  // Each review card carries its SOURCE's logo badge (live ships the Yelp
  // logo on every card, even the Google-linked ones — corrected here per
  // design direction: Google-sourced reviews get the Google G).
  const isYelp = (url: string | null): boolean => /yelp\./i.test(url ?? "");
  const badgeFor = (url: string | null) =>
    isYelp(url)
      ? { icon: "/icons/yelp-logo.png", label: "Yelp" }
      : { icon: "/icons/google-g.svg", label: "Google" };

  const hasHeading = $derived(isFilled.richText(slice.primary.heading));
  const headingText = $derived(hasHeading ? asText(slice.primary.heading) : "");
  const trackLabel = $derived(
    slice.variation === "photos"
      ? slice.primary.label || "Office photos"
      : headingText || "Patient reviews",
  );

  const band = $derived(
    bandFor(context.presentation, slice.primary.band ?? null),
  );
  // Caption TEXT is Prismic-editable in the slice's items, zipped to the
  // manifest slides by index; the manifest carries the media + caption role.
  const frames = $derived(
    band?.carousel
      ? band.carousel.slides.map((s, i): CarouselFrame => {
          const caption = slice.items?.[i]?.caption || undefined;
          const subcaption = slice.items?.[i]?.subcaption || undefined;
          return {
            media: s.media,
            ...(caption ? { caption } : {}),
            ...(s.caption?.role ? { role: s.caption.role } : {}),
            ...(subcaption ? { subcaption } : {}),
            ...(s.subcaption?.role ? { subrole: s.subcaption.role } : {}),
          };
        })
      : null,
  );
</script>

<!-- Live's review-slider arrow assets (big-review-arrow-left/right, 30×33). -->
{#snippet reviewArrowLeft()}
  <img src="/icons/review-arrow-left.svg" alt="" class="h-[33px] w-[30px]" />
{/snippet}
{#snippet reviewArrowRight()}
  <img src="/icons/review-arrow-right.svg" alt="" class="h-[33px] w-[30px]" />
{/snippet}

{#if isFullbleedTour}
  <!-- your-first-visit `.fv-virtual-tour-section`: a full-bleed single-image
       w-slider. Live heading "Office Tour" is a museo-slab cyan 60px h1 at the
       content margin (x=80); each slide is 100vw of a 4:3 photo clipped to a
       900px-tall mask; 8 dots below + edge chevron arrows. Photos themselves
       are a documented pipeline/CSP floor — geometry + dots/arrows are the
       spec here. -->
  <section
    id="office-tour"
    data-slice-type={slice.slice_type}
    data-slice-variation={slice.variation}
    class="mb-10 w-full scroll-mt-24 lg:mb-24 lg:pb-4"
  >
    <div class="mb-6 px-5 lg:px-20">
      <!-- cyan by the global main h1–h3 primary rule; no inline colour needed. -->
      <h1
        class="font-slab text-[25px] leading-[38px] font-light lg:text-[60px] lg:leading-[72px]"
      >
        {trackLabel}
      </h1>
    </div>
    {#if trackCount > 0}
      <Slider
        itemCount={trackCount}
        label={trackLabel}
        showDots={true}
        arrowLayout="sides"
        gap="0px"
        mobileGap="0px"
        arrowClass="h-full !top-0 !translate-y-0 w-14 lg:w-20 text-white [text-shadow:0_1px_4px_rgba(0,0,0,0.4)] hover:bg-black/10 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-hidden"
        dotClass="bg-primary/40"
        activeDotClass="bg-primary"
      >
        {#snippet children({ index }: { index: number })}
          {@const item = trackItems[index]}
          {#if item && isFilled.image(item.image)}
            <div
              class="h-[293px] w-full overflow-hidden md:h-[560px] lg:h-[900px]"
            >
              <PrismicImage
                field={item.image}
                fallbackAlt=""
                class="h-full w-full object-cover object-center"
              />
            </div>
          {/if}
        {/snippet}
      </Slider>
    {/if}
  </section>
{:else if isTrackVariation}
  {#if trackCount > 0}
    <ContentBand
      sliceType={slice.slice_type}
      variation={slice.variation}
      contentClass="max-w-7xl px-[19.5px] text-center lg:px-6"
      sectionClass={isHomeSsb ? "mb-9 md:mb-12 lg:mb-[60px]" : ""}
      reveal
    >
      {#if hasHeading && slice.primary.heading}
        <!-- Live is `h1.text-align-center.mb-8`. `.mb-8` is a SPACING utility
             that also carries `font-size: 1rem` inside the ≤991 block
             (beachfront.css:7972-7974), so against the stepped root this
             heading has THREE sizes — 60 @1440 / 32 across the whole 769–991
             band / 24 @≤768 — not two. Line-height: h1 :2111 = 72, ≤991 :7855
             = 38. Bottom margin is `.mb-8` = 2rem (:3998-4000) → 80/64/48; we
             had a flat 48.

             Live's h1 also carries `margin-top: 20px` (:2106) — do NOT
             reproduce it. `.content-width` has no padding, so that margin
             COLLAPSES out of `.home-ssb-section` and lands in the gap above,
             which is why live's anchor sits at the section's border-box top.
             Adding it as a wrapper margin here double-counts: it pushed our
             anchor 20px down, and since page-diff cuts AT the anchor that
             shortened the region from the top (Serving @834 Δh 15.5% → 18.5%,
             gate run matching/out-spec1-home). -->
        <div
          class="h-primary mb-12 md:mb-16 lg:mb-20 [&_h2]:text-[24px] [&_h2]:leading-[38px] md:[&_h2]:text-[32px] md:[&_h2]:leading-[38px] lg:[&_h2]:text-[3.75rem] lg:[&_h2]:leading-[1.2]"
        >
          <PrismicRichText field={slice.primary.heading} />
        </div>
      {/if}
      <!-- `.review-slider-holder` margin-top is TABLET-ONLY: `4rem` lives in
           the ≤991 block (beachfront.css:8338) and is reset to 0 at ≤767
           (:8940), with no rule at all ≥992 — so the ladder is 0 / 128 / 0,
           not a two-tier step. Against the 32px root at 834 that is 128px, and
           it collapses with the heading's 64px bottom margin to 128 total. -->
      <div class="relative mx-auto max-w-3xl md:mt-32 lg:mt-0">
        {#if slice.variation === "review"}
          <!-- Live's real hand-drawn "what they say" mark + curved arrow (PNG/SVG
               assets, NOT redrawn) pointing to the review card. -->
          <div
            aria-hidden="true"
            class="pointer-events-none absolute -top-4 -left-32 z-10 hidden w-56 -rotate-6 lg:block xl:-left-52"
          >
            <img src="/annotations/what-they-say.png" alt="" class="w-full" />
            <img
              src="/annotations/what-they-say-arrow.svg"
              alt=""
              class="mt-1 ml-10 w-16"
            />
          </div>
        {/if}
        <!-- The slide movement (Slider's transition-transform utility) is a
             plain CSS transition, so app.css's global prefers-reduced-motion
             reset flattens it for reduced-motion users — no local gate needed.
             Timing is live's .big-review-slider rule verbatim: transform 2s
             cubic-bezier(0.19,1,0.22,1) — the long expo glide, not a quick
             ease-in-out. Arrows are live's own left-arrow/right-arrow SVGs. -->
        <Slider
          itemCount={trackCount}
          label={trackLabel}
          showDots={false}
          gap="0px"
          mobileGap="0px"
          arrowLayout={slice.variation === "review" ? "sides" : "below"}
          arrowClass="text-primary hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-primary-deep focus-visible:ring-offset-2 focus-visible:outline-hidden"
          transitionClass="duration-[2000ms] ease-[cubic-bezier(0.19,1,0.22,1)]"
          prevArrow={slice.variation === "review" ? reviewArrowLeft : undefined}
          nextArrow={slice.variation === "review"
            ? reviewArrowRight
            : undefined}
        >
          {#snippet children({ index }: { index: number })}
            {@const item = trackItems[index]}
            {#if item}
              {#if slice.variation === "review"}
                <!-- Live's mobile slide: viewport 337 inside 351 (7px each
                     side); the holder reserves only ~12px below the card (the
                     badge's 20px overhang draws over the pulled-up expander
                     row, same as live's .shift-up overlap). -->
                <div class="px-[7px] pb-3 md:pb-16 lg:px-4 lg:pb-20">
                  <!-- Pale-blue quote card (live .big-review, 600×400 at
                       desktop, #e7f5fa, 25px radius, padding 24px tablet /
                       30px desktop): the quote sits on TOP with the reviewer
                       row beneath, and the source's logo badge overhangs the
                       bottom-right edge. Order is NOT breakpoint-dependent —
                       live is quote-on-top at every width (probe-verified
                       column/QUOTE-top at 390/834/1440), so DOM order
                       (blockquote then figcaption) maps 1:1 to paint order
                       with plain flex-col; no reverse anywhere. justify-between
                       + the fixed tablet/desktop heights open the gap live
                       shows between the two blocks. -->
                  <figure
                    class="relative mx-auto mb-12 flex max-w-[600px] flex-col justify-between rounded-[25px] bg-[#e7f5fa] p-[18px] text-left xs:mb-0 md:h-[320px] md:max-w-[480px] md:p-6 lg:h-[400px] lg:max-w-[600px] lg:p-[30px]"
                  >
                    {#if isFilled.link(item.review_url)}
                      {@const badge = badgeFor(asLink(item.review_url))}
                      <!-- Live .social-logo-big-review: an 80×80 logo anchor
                           poking 20px below the card's bottom edge, 30px in
                           from the right — no card chrome of its own. -->
                      <a
                        href={asLink(item.review_url)}
                        target="_blank"
                        rel="noopener"
                        aria-label="Read this review on {badge.label}"
                        class="focus-visible:ring-primary-deep absolute -bottom-5 right-6 transition-opacity hover:opacity-60 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden lg:right-[30px]"
                      >
                        <img
                          src={badge.icon}
                          alt={badge.label}
                          class="h-14 w-14 object-contain lg:h-20 lg:w-20"
                        />
                      </a>
                    {/if}
                    <!-- Direct [&_p] hits: the base main :where(p) clamp rule
                         beats inherited sizes on the inner <p>, so the
                         blockquote's own text-[16px] never reached it
                         (computed 17.365/19px until pinned here). -->
                    <blockquote
                      class="[&_p]:text-[16px] [&_p]:leading-[24px] text-[#365b6d] lg:[&_p]:text-[20px] lg:[&_p]:leading-[30px] lg:font-light"
                    >
                      <p>{item.quote}</p>
                    </blockquote>
                    <figcaption
                      class="mb-[10px] flex items-center gap-4 lg:mb-0 lg:gap-5"
                    >
                      {#if isFilled.image(item.reviewer_photo)}
                        <PrismicImage
                          field={item.reviewer_photo}
                          fallbackAlt=""
                          class="h-[72px] w-[72px] rounded-full object-cover lg:h-[120px] lg:w-[120px]"
                        />
                      {/if}
                      <div class="flex-1">
                        <p
                          class="text-[16px] leading-[24px] font-medium text-[#365b6d] xs:text-[20px] xs:leading-[30px] md:text-[20px] md:leading-[60px] lg:text-[30px] lg:leading-[40px]"
                        >
                          {item.reviewer_name}
                        </p>
                        {#if item.reviewer_place}
                          <p
                            class="text-[10px] leading-[15px] font-light xs:text-[16px] xs:leading-[24px] md:text-[16px] md:leading-[25px] text-[#365b6d] uppercase lg:mt-1 lg:text-[16px] lg:leading-[25px]"
                          >
                            {item.reviewer_place}
                          </p>
                        {/if}
                      </div>
                    </figcaption>
                  </figure>
                </div>
              {:else if isFilled.image(item.image) || item.caption}
                <div class="px-4">
                  {#if isFilled.image(item.image)}
                    <PrismicImage
                      field={item.image}
                      fallbackAlt=""
                      class="h-auto w-full object-cover"
                    />
                  {/if}
                  {#if item.caption}
                    <p class="text-secondary mt-4 text-sm">{item.caption}</p>
                  {/if}
                </div>
              {/if}
            {/if}
          {/snippet}
        </Slider>
      </div>
      {#if slice.variation === "review"}
        <!-- Live's .shift-up block: the expander sits tight under the slider
             (mt -1rem) with 3rem reserved below for the disclosed logo row. -->
        <div class="-mt-6 mb-18 lg:mt-[-16px] lg:mb-28">
          <ReadReviewsExpander />
        </div>
      {/if}
    </ContentBand>
  {/if}
{:else if frames && frames.length > 0}
  <SectionBand
    {band}
    sliceType={slice.slice_type}
    sliceVariation={slice.variation}
  >
    <CarouselFrames
      {frames}
      label={slice.primary.label || "Photo slideshow"}
      columns={band?.carousel?.columns ?? 1}
    />
  </SectionBand>
{/if}
