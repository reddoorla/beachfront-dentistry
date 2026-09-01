<script lang="ts">
  import { bandFor, type Presentation } from "$lib/blux/presentation";
  import PrismicPhoto from "$lib/components/PrismicPhoto.svelte";
  import { animateIn, LIVE_REVEAL } from "$lib/actions/animateIn";
  import SectionBand from "$lib/blux/SectionBand.svelte";
  import CarouselFrames, {
    type CarouselFrame,
  } from "$lib/blux/CarouselFrames.svelte";
  import ContentBand from "$lib/components/ContentBand.svelte";
  import ReadReviewsExpander from "$lib/components/ReadReviewsExpander.svelte";
  import Slider from "$lib/components/Slider.svelte";
  import { useSwipe, type SwipeCustomEvent } from "svelte-gestures";
  import { ADDRESS, HOURS, PHONE } from "$lib/site";
  import { PrismicImage, PrismicRichText } from "@prismicio/svelte";
  import { cappedWidths } from "@reddoorla/maintenance/images";
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

  // ROUND G4 review-mask carousel state (see the markup comment at the
  // review branch below): the review variation no longer rides the shared
  // Slider — its track moves INSIDE the static card, so the slice owns the
  // index / wrap-around / keyboard / swipe machinery, mirroring Slider's
  // semantics 1:1 (loop always on, ArrowLeft/Right on the arrow buttons,
  // 60px pan-y swipe). `photos` still renders on the shared Slider.
  let reviewSlide = $state(0);
  const reviewLast = $derived(trackCount - 1);
  const reviewNext = () => {
    reviewSlide = reviewSlide < reviewLast ? reviewSlide + 1 : 0;
  };
  const reviewPrev = () => {
    reviewSlide = reviewSlide > 0 ? reviewSlide - 1 : reviewLast;
  };
  const reviewKeydown = (e: KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      reviewPrev();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      reviewNext();
    }
  };
  const reviewSwipe = (e: SwipeCustomEvent) => {
    if (e.detail.direction === "left") reviewNext();
    if (e.detail.direction === "right") reviewPrev();
  };

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

<!-- Live's review-slider arrow assets (big-review-arrow-left/right).
     `.big-review-arrow-left`/`-right` are `width:.75rem`
     (beachfront.css:7594-7600 and :7614-7620) — and .75rem is THREE sizes
     against live's stepped root (24/32/40px), so the asset is 18px ≤767,
     24px 768-991 and 30px ≥992. We had hard-coded the ≥992 value at every
     width, which is how a 30px chevron ended up on a 390px phone. The
     33:30 height ratio is the SVG's own aspect, and reproduces live's
     measured 18×20 / 24×26 / 30×33 boxes. -->
{#snippet reviewArrowLeft()}
  <img
    src="/icons/review-arrow-left.svg"
    alt=""
    class="h-[20px] w-[18px] md:h-[26px] md:w-[24px] lg:h-[33px] lg:w-[30px]"
  />
{/snippet}
{#snippet reviewArrowRight()}
  <img
    src="/icons/review-arrow-right.svg"
    alt=""
    class="h-[20px] w-[18px] md:h-[26px] md:w-[24px] lg:h-[33px] lg:w-[30px]"
  />
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
    class="mb-9 w-full scroll-mt-24 md:mb-12 lg:mb-[60px]"
  >
    <!-- `.content-width`: max-width 1400 centred, padding-x `1.5rem` against the
         stepped root = 60 >=992 / 48 768-991, stepping to 8% <=767 and 5%
         <=479. Measured content-left 80 / 48 / 19.5. `px-5 lg:px-20` happened
         to land 80 at 1440 but put the heading at x=20 where live has x=48. -->
    <div
      class="mx-auto max-w-[1400px] px-[5%] xs:px-[8%] md:px-12 lg:px-[60px]"
    >
      <!-- cyan by the global main h1–h3 primary rule; no inline colour needed.
           The 10px below the heading is live's own `h1{margin-bottom:10px}`
           (`beachfront.css:2104-2108`) — a FIXED px, not a rem, so it does not
           step with the root ladder — and it collapses out of the padding-less
           `.content-width` wrapper exactly as it does here. We had `mb-6` on
           the wrapper: 24px, +14 per viewport. -->
      <!-- Announced as level 2: this is a SECTION heading ("Office Tour"), but
           it renders as `h1` to pick up live's h1 size + the global
           `main h1-h3` cyan rule. On your-first-visit that produced a second
           level-1 heading competing with the page title, so the announced level
           is corrected without touching the tag or a single pixel — same
           technique as RichTextHeading.svelte:24 and SubpageHero's ariaLevel. -->
      <!-- The Office Tour block had zero reveal targets across 1492px. The
           heading is the target; the image TRACK deliberately is not — it is
           one of the two heaviest paint regions on the site, and putting a
           transform on it would composite the whole strip for no gain the
           heading does not already give. -->
      <h1
        class="font-slab h-primary mb-[10px] text-[28px] leading-[38px] font-light lg:text-[60px] lg:leading-[72px]"
        aria-level="2"
        use:animateIn={LIVE_REVEAL}
      >
        {trackLabel}
      </h1>
    </div>
    {#if trackCount > 0}
      <!-- Live ships all 8 `.w-slider-dot`s and then hides the strip:
           `div.display-none.w-slider-nav.w-round`, and `.display-none` is
           `display:none` (`beachfront.css:2214-2216`) — the dots are in the DOM
           and never operable. Ours rendered them in FLOW under the track: 24px
           of dots + a 32px margin = 56px this section does not have. The edge
           arrows stay, so the carousel keeps a non-swipe control. -->
      <Slider
        itemCount={trackCount}
        label={trackLabel}
        showDots={false}
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
            <!-- Live's slider holder carries TWO competing 0,1,0 rules:
                 `.h-half-screen-width` `height:50vw` (beachfront.css:3173-3175)
                 and `.su-h-screen-to-tablet` `height:100vh` (:5656-5658). The
                 second is later in the sheet, so **100vh wins at ≥768** — the
                 box is viewport-HEIGHT dependent, not width dependent. At ≤767
                 `:8554-8556` sets `height:auto` and the image's own height
                 governs. We had fixed pixels (293/560/900), which is why this
                 section was 718px short at 834. -->
            <!-- `.w-slider` is `background:#ddd` (`beachfront.css:1190-1198`).
                 Invisible at 1440 (the photo overflows the mask) and at 390
                 (mask height == photo height), but at 834 the photo is 626 in a
                 900 mask and live letterboxes 274px of grey below it. -->
            <div class="w-full overflow-hidden bg-[#ddd] md:h-screen">
              <!-- Live sets NO object-fit: the img is `max-width:100%`
                   (`beachfront.css:232-236`) inside the block-flow mask, so it
                   renders at container width x natural aspect (measured
                   1440x1080 @1440) and overflows the 900px mask downward,
                   clipped by `.w-slider-mask{overflow:hidden}` (`:1200-1209`).
                   Measured live: 1440x1080 in a 900 mask (overflows 180 and is
                   clipped) but 834x626 in the SAME 900 mask (letterboxed by
                   274) and 390x293 in a 293 mask. No single object-fit does
                   that — `cover` filled the mask at 834 where live leaves it
                   empty. Reproduce the rule, not a fit: width 100%, height
                   auto, top of the block box. -->
              <PrismicImage
                field={item.image}
                fallbackAlt=""
                widths={cappedWidths(item.image)}
                sizes="100vw"
                class="h-auto w-full"
              />
            </div>
          {/if}
        {/snippet}
      </Slider>
    {/if}
    <!-- Live's §8 "Hours + contact pair" — `.content-width >
         div.w-layout-hflex.mt-6.su-flex-v-mobile` holding two
         `.footer-contact-block.mb-4.mr-8`. It lives INSIDE
         `<section id="tour" class="fv-virtual-tour-section">`, i.e. this same
         section, which is why it belongs here and not in its own slice.

         It was missing entirely, and it is 184px of the Office Tour region at
         834. The copy is not new hardcoding — it is the same PHONE/ADDRESS/HOURS
         data `site.ts` already feeds the footer and /contact-us.

         Ladders (all against the stepped root):
           `.mt-6`  margin-top 1.5rem  = 60 / 48 / 36   beachfront.css:3917-3919
           `.mb-4`  margin-bottom 1rem = 40 / 32 / 24   :3985-3988
           `.mr-8`  margin-right 2rem  = 80 / 64 / 48   :3961-3963
           `.su-flex-v-mobile` is `display:flex` (:5291-5293) going
           `flex-direction:column` at ≤767 ONLY (:8434-8436) — still a ROW at 834.
           `.footer-contact-header` 20/40 · 16/32 · 16/32 (:6337-6343, :8130-8132)
           `div.text-body`          20/30 · 16/24 · 16/24 (:7751-7754, :8359-8361)
         The header text carries a non-breaking space in the source
         ("OFFICE&nbsp;HOURS"). -->
    <div
      class="mx-auto mt-9 flex max-w-[1400px] flex-col px-[19.5px] text-[#333] md:mt-12 md:flex-row md:px-12 lg:mt-[60px] lg:px-[60px]"
    >
      <div class="mb-6 md:mr-16 md:mb-8 lg:mr-20 lg:mb-10">
        <div
          class="font-slab text-[16px] leading-[32px] font-medium text-[#365b6d] lg:text-[20px] lg:leading-[40px]"
        >
          OFFICE&nbsp;HOURS
        </div>
        {#each HOURS as [days, time] (days)}
          <div
            class="text-[16px] leading-[24px] lg:text-[20px] lg:leading-[30px]"
          >
            {days} / {time}
          </div>
        {/each}
      </div>
      <div class="mb-6 md:mb-8 lg:mb-10">
        <div
          class="font-slab text-[16px] leading-[32px] font-medium text-[#365b6d] lg:text-[20px] lg:leading-[40px]"
        >
          CONTACT
        </div>
        <div
          class="text-[16px] leading-[24px] lg:text-[20px] lg:leading-[30px]"
        >
          {PHONE.display}
        </div>
        <div
          class="text-[16px] leading-[24px] lg:text-[20px] lg:leading-[30px]"
        >
          {ADDRESS.line1}
        </div>
        <div
          class="text-[16px] leading-[24px] lg:text-[20px] lg:leading-[30px]"
        >
          {ADDRESS.line2}
        </div>
      </div>
    </div>
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
            class="pointer-events-none absolute -top-4 -left-32 z-10 hidden w-60 lg:block xl:top-0 xl:-left-[176px]"
          >
            <img src="/annotations/what-they-say.png" alt="" class="w-full" />
            <img
              src="/annotations/what-they-say-arrow.svg"
              alt=""
              class="mt-[3px] ml-[100px] w-[120px]"
            />
          </div>
        {/if}
        {#if slice.variation === "review"}
          <!-- ROUND G4 (MarkUp thread 29e4fcac-8dee-4cfe-a3f5-4ef9e4c79524,
               home board pin #5; operator directive: follow Tim's redesign).
               Tim: "the light blue background stays the same … the content,
               all except for the overlapping logo, slides out as if this
               light blue background was a mask … the overlapping logo …
               just dissolves." Live's own carousel translates the WHOLE
               card — `.big-review-slider` `transition: transform 2s
               cubic-bezier(.19,1,.22,1)` (beachfront.css:7563-7572) slides
               `.big-review` and its badge across the holder, and the quote
               "randomly disappears" at the holder's clip edge. Overridden
               by design direction:
               • the pale-blue card is STATIC chrome — it never moves;
               • the quote/author content rides a track INSIDE the card's
                 own overflow-hidden rounded mask, so the card clips the
                 slide at its own border box (rounded corners included) and
                 nothing ever paints outside it;
               • the badge layer sits on the card, NOT the track, and
                 cross-dissolves between sources — Tim's simpler "just
                 dissolves" variant (the slide-down/up variant is offered
                 in the pin's resolve reply). The card padding moved onto
                 the track cells so the mask clips at the card edge, not
                 the padding edge; all five cards measure equal heights at
                 every gated width, so the uniform mask box is the same
                 box the static gate always saw.
               Slide timing stays live's .big-review-slider rule verbatim
               (2s expo glide, above); the dissolve runs the same 2000ms
               with ease-in-out because the expo curve front-loads opacity
               and reads as a pop, not a dissolve. Both movements are plain
               CSS transitions, so app.css's global prefers-reduced-motion
               reset (src/app.css:490-497) flattens them to an instant
               swap — no local gate needed. This branch replicates the
               shared Slider's carousel semantics 1:1 (region role, arrow
               labels, ArrowLeft/Right keys, swipe, aria-live position,
               hidden-slide inert); `photos` still rides Slider below. -->
          <div
            class="relative w-full"
            role="region"
            aria-roledescription="carousel"
            aria-label={trackLabel}
          >
            <div
              class="w-full"
              {...useSwipe(reviewSwipe, () => ({
                timeframe: 300,
                minSwipeDistance: 60,
                touchAction: "pan-y",
              }))}
            >
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
                <!-- `.review-slider-holder-viewport{width:15rem}`
                     (beachfront.css:7586-7592) is the card's box, and 15rem is
                     THREE widths against live's stepped root: 360px ≤767,
                     480px 768-991, 600px ≥992. Only ≤479 escapes it, where
                     `width:96%` takes over (:9512-9515) and the card fills its
                     7px-padded wrapper.
                     The 480-767 tier was missing — the ladder was keyed at 768,
                     so the whole band kept the ≤479 fill-the-wrapper behaviour
                     and the card ran 427px wide at 480 against live's 360. That
                     is CLAUDE.md's standing root-font trap, and it is also what
                     dragged the prev/next chevrons onto the quote in that band:
                     probed against the reference, `xs:max-w-[360px]` puts the
                     card at 60..420 @480 and 120..480 @600, matching live to
                     the pixel. -->
                <div
                  class="relative mx-auto mb-12 max-w-[600px] rounded-[25px] bg-[#e7f5fa] text-left xs:mb-0 xs:max-w-[360px] md:h-[320px] md:max-w-[480px] lg:h-[400px] lg:max-w-[600px]"
                >
                  <div class="h-full w-full overflow-hidden rounded-[25px]">
                    <div
                      class="flex h-full transition-transform duration-[2000ms] ease-[cubic-bezier(0.19,1,0.22,1)]"
                      style="transform: translateX(-{reviewSlide * 100}%)"
                    >
                      {#each trackItems as item, i (i)}
                        <div
                          class="h-full w-full shrink-0"
                          role="group"
                          aria-roledescription="slide"
                          aria-label="{i + 1} of {trackCount}"
                          aria-hidden={i === reviewSlide ? undefined : "true"}
                          inert={i !== reviewSlide}
                        >
                          <!-- The card's padding lives here (not on the
                               pale-blue box) so the mask clips the sliding
                               content at the card's border box, not at the
                               padding edge. -->
                          <figure
                            class="flex h-full flex-col justify-between p-[18px] md:p-6 lg:p-[30px]"
                          >
                            <!-- Direct [&_p] hits: the base main :where(p)
                                 clamp rule beats inherited sizes on the inner
                                 <p>, so the blockquote's own text-[16px] never
                                 reached it (computed 17.365/19px until pinned
                                 here). -->
                            <blockquote
                              class="[&_p]:text-[16px] [&_p]:leading-[24px] text-[#365b6d] lg:[&_p]:text-[20px] lg:[&_p]:leading-[30px] lg:font-light"
                            >
                              <p>{item.quote}</p>
                            </blockquote>
                            <figcaption
                              class="mb-[10px] flex items-center gap-4 lg:mb-0 lg:gap-5"
                            >
                              {#if isFilled.image(item.reviewer_photo)}
                                <!-- The worst ratio measured anywhere on the
                                     site: 12.0x. A fixed 72px avatar (120 at
                                     lg) was pulling the 1440-wide candidate. -->
                                <PrismicPhoto
                                  field={item.reviewer_photo}
                                  fallbackAlt=""
                                  sizes="(min-width: 1024px) 120px, 72px"
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
                                    class="text-[10px] font-light xs:text-[16px] xs:leading-[24px] md:text-[16px] md:leading-[25px] text-[#365b6d] uppercase lg:mt-1 lg:text-[16px] {isHomeSsb
                                      ? 'leading-[15px]'
                                      : 'leading-[12px]'} {isHomeSsb
                                      ? 'lg:leading-[25px]'
                                      : 'lg:leading-[19px]'}"
                                  >
                                    {item.reviewer_place}
                                  </p>
                                {/if}
                              </div>
                            </figcaption>
                          </figure>
                        </div>
                      {/each}
                    </div>
                  </div>
                  {#each trackItems as item, i (i)}
                    {#if isFilled.link(item.review_url)}
                      {@const badge = badgeFor(asLink(item.review_url))}
                      <!-- Live .social-logo-big-review: an 80×80 logo anchor
                           poking 20px below the card's bottom edge, 30px in
                           from the right — no card chrome of its own. The
                           wrapper carries the cross-dissolve so the anchor
                           keeps its own quick hover fade (live's
                           `.social-logo-big-review:hover` `opacity: .6`,
                           beachfront.css:6830). -->
                      <div
                        class="absolute right-6 -bottom-5 transition-opacity duration-[2000ms] ease-in-out lg:right-[30px] {i ===
                        reviewSlide
                          ? 'opacity-100'
                          : 'pointer-events-none opacity-0'}"
                        aria-hidden={i === reviewSlide ? undefined : "true"}
                        inert={i !== reviewSlide}
                      >
                        <a
                          href={asLink(item.review_url)}
                          target="_blank"
                          rel="noopener"
                          aria-label="Read this review on {badge.label}"
                          class="focus-visible:ring-primary-deep block transition-opacity hover:opacity-60 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden"
                        >
                          <img
                            src={badge.icon}
                            alt={badge.label}
                            class="h-14 w-14 object-contain lg:h-20 lg:w-20"
                          />
                        </a>
                      </div>
                    {/if}
                  {/each}
                </div>
              </div>
            </div>

            {#if trackCount > 1}
              <!-- Edge-pinned prev/next: same box and classes the shared
                   Slider's side-arrow buttons + the review arrowClass gave
                   them, so the arrows land on the same pixels. Arrows are
                   live's own left-arrow/right-arrow SVGs. -->
              <!-- The flat `mx-6` inset put both chevrons INSIDE the review
                   card on phones, printed straight over the quote — measured
                   at 390 and 360 on / and /your-first-visit, 551px² of overlap
                   on "The staff was excellent. Front desk team". Live never
                   does this: at ≤479 `.big-review-arrow-left{left:-.75rem}` /
                   `-right{right:-.75rem}` (beachfront.css:9517-9526) park the
                   arrows OUTSIDE the holder — probed on the reference at 390
                   they sit at x=2..20 against a card starting at x=27, i.e.
                   25px of clearance, and 24px at 360.
                   Across 480-767 live positions them off the PAGE CENTRE, not
                   the holder: `.big-review-arrow-right{right:-9rem}` (:7594)
                   against a 360px centred card, which is 216px at that band's
                   24px root — probed on the reference the left chevron lands
                   at x=24/84/168 for 480/600/767, i.e. a constant 36px clear
                   of the quote. `calc(50%-216px)` reproduces all three within
                   a pixel. At ≥768 the inset is left alone: live's own
                   desktop rules put the arrows well outside the 480/600px card
                   there (48px clearance at 834, 60px at 1440), and so does
                   ours — the defect is a mobile-band defect only, so the two
                   gated desktop widths keep the geometry they already pass. -->
              <!-- Matching live's `.75rem` asset shrinks the chevron to 18×20
                   on phones, which is BELOW WCAG 2.2 AA 2.5.8's 24×24, so the
                   hit area is restored with a `::before` — an absolutely
                   positioned pseudo-element adds no layout box, so live's
                   geometry above is untouched to the pixel.
                   It is anchored to the button's OUTER edge and grows inward,
                   not centred: a centred 44px box on the right chevron (whose
                   right edge sits 1px off the viewport at 390) pushed
                   scrollWidth to 402 and gave the home page the very sideways
                   scroll this round removed from /services. Growing inward
                   costs nothing — the card behind it holds no other control. -->
              <button
                type="button"
                data-review-arrow="prev"
                onclick={reviewPrev}
                onkeydown={reviewKeydown}
                class="text-primary hover:bg-primary/10 focus-visible:ring-primary-deep absolute top-1/2 -left-[18px] z-10 -mt-16 flex -translate-y-1/2 items-center justify-center rounded-full transition-colors duration-200 before:absolute before:top-1/2 before:left-0 before:h-11 before:w-8 before:-translate-y-1/2 before:content-[''] xs:left-[calc(50%-216px)] md:left-0 md:mx-6 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden"
                aria-label="Previous slide"
              >
                {@render reviewArrowLeft()}
              </button>
              <button
                type="button"
                data-review-arrow="next"
                onclick={reviewNext}
                onkeydown={reviewKeydown}
                class="text-primary hover:bg-primary/10 focus-visible:ring-primary-deep absolute top-1/2 -right-[18px] z-10 -mt-16 flex -translate-y-1/2 items-center justify-center rounded-full transition-colors duration-200 before:absolute before:top-1/2 before:right-0 before:h-11 before:w-8 before:-translate-y-1/2 before:content-[''] xs:right-[calc(50%-216px)] md:right-0 md:mx-6 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden"
                aria-label="Next slide"
              >
                {@render reviewArrowRight()}
              </button>
            {/if}

            <!-- Announce position to screen readers (no autoplay here, so
                 always polite — same rule as the shared Slider). -->
            <div class="sr-only" aria-live="polite" aria-atomic="true">
              Slide {reviewSlide + 1} of {trackCount}
            </div>
          </div>
        {:else}
          <!-- `photos` (non-fullbleed) still rides the shared Slider; its
               movement is a plain CSS transition, so app.css's global
               prefers-reduced-motion reset flattens it — no local gate
               needed. Timing is live's .big-review-slider rule verbatim:
               transform 2s cubic-bezier(0.19,1,0.22,1). -->
          <Slider
            itemCount={trackCount}
            label={trackLabel}
            showDots={false}
            gap="0px"
            mobileGap="0px"
            arrowClass="text-primary hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-primary-deep focus-visible:ring-offset-2 focus-visible:outline-hidden"
            transitionClass="duration-[2000ms] ease-[cubic-bezier(0.19,1,0.22,1)]"
          >
            {#snippet children({ index }: { index: number })}
              {@const item = trackItems[index]}
              {#if item && (isFilled.image(item.image) || item.caption)}
                <div class="px-4">
                  {#if isFilled.image(item.image)}
                    <PrismicImage
                      field={item.image}
                      fallbackAlt=""
                      widths={cappedWidths(item.image)}
                      sizes="100vw"
                      loading="lazy"
                      class="h-auto w-full object-cover"
                    />
                  {/if}
                  {#if item.caption}
                    <p class="text-secondary mt-4 text-sm">{item.caption}</p>
                  {/if}
                </div>
              {/if}
            {/snippet}
          </Slider>
        {/if}
      </div>
      {#if isHomeSsb}
        <!-- Live's .shift-up block: the expander sits tight under the slider
             with room reserved below for the disclosed logo row. Measured on
             live: h 69, margin -40px/120px @1440 · h 55, margin -32px/96px @834.

             HOME ONLY. `.home-ssb-section > .content-width` has THREE children
             on index.html (h1, .review-slider-holder, this row) and only TWO on
             your-first-visit.html — its `.fv-review-section` ends at the
             slider. Rendering it on both is what made our yfv review section
             +53/+31/+15 too tall and cost yfv its Serving region. The holders
             themselves are byte-identical on the two live pages (1280x480 mt=0
             / 738x384 mt=128 / 351x322 mt=0 pb=12), which is how this was
             isolated to content rather than to a rule. -->
        <div class="-mt-6 mb-18 md:-mt-8 md:mb-24 lg:-mt-10 lg:mb-30">
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
