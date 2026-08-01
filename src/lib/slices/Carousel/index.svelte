<script lang="ts">
  import { bandFor, type Presentation } from "$lib/blux/presentation";
  import SectionBand from "$lib/blux/SectionBand.svelte";
  import CarouselFrames, {
    type CarouselFrame,
  } from "$lib/blux/CarouselFrames.svelte";
  import ContentBand from "$lib/components/ContentBand.svelte";
  import Slider from "$lib/components/Slider.svelte";
  import { PrismicImage, PrismicRichText } from "@prismicio/svelte";
  import { Plus } from "@lucide/svelte";
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
  const trackItems = $derived(isTrackVariation ? (slice.items ?? []) : []);
  const trackCount = $derived(trackItems.length);

  // The live review cards carry a Yelp badge, but the reviews are mixed-source
  // (Yelp + Google Maps). Only Yelp-sourced reviews get the badge; others get a
  // neutral link, so a Google review is never mislabelled as Yelp.
  const isYelp = (url: string | null): boolean => /yelp\./i.test(url ?? "");

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

{#if isTrackVariation}
  {#if trackCount > 0}
    <ContentBand
      sliceType={slice.slice_type}
      variation={slice.variation}
      contentClass="max-w-7xl px-[19.5px] pt-0 pb-9 text-center lg:px-6 lg:py-16"
      reveal
    >
      {#if hasHeading && slice.primary.heading}
        <!-- Live's mobile review heading is 24px/38 (its 3-C sibling is 28/38 —
             Webflow uses per-block sizes, so this one is scoped here rather than
             moved into the global h2 scale). Desktop is unchanged at 60px. -->
        <div
          class="h-primary mb-8 [&_h2]:text-[24px] [&_h2]:leading-[38px] lg:mb-12 lg:[&_h2]:text-[3.75rem] lg:[&_h2]:leading-[1.2]"
        >
          <PrismicRichText field={slice.primary.heading} />
        </div>
      {/if}
      <div class="relative mx-auto max-w-3xl">
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
             reset flattens it for reduced-motion users — no local gate needed. -->
        <Slider
          itemCount={trackCount}
          label={trackLabel}
          showDots={false}
          gap="0px"
          mobileGap="0px"
          arrowLayout={slice.variation === "review" ? "sides" : "below"}
          arrowClass="text-primary hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-primary-deep focus-visible:ring-offset-2 focus-visible:outline-hidden"
          transitionClass="duration-500 ease-in-out"
        >
          {#snippet children({ index }: { index: number })}
            {@const item = trackItems[index]}
            {#if item}
              {#if slice.variation === "review"}
                <!-- Live's mobile slide: viewport 337 inside 351 (7px each
                     side) and 48px of space under the card for the overhanging
                     badge. -->
                <div class="px-[7px] pb-12 lg:px-4 lg:pb-6">
                  <!-- Pale-blue quote card with the reviewer row and the Yelp
                       badge overhanging the bottom-right (live "what they say"
                       card). -->
                  <figure
                    class="relative mx-auto max-w-2xl rounded-2xl bg-[#e8f3f8] p-[18px] text-left lg:p-8 xl:p-10"
                  >
                    <!-- Absolutely-positioned, so DOM order is free — kept as
                         the figure's FIRST child so <figcaption> stays last
                         (a11y_figcaption_index). -->
                    {#if isFilled.link(item.review_url)}
                      {#if isYelp(asLink(item.review_url))}
                        <!-- Yelp-sourced review → the live Yelp badge overhangs
                             the bottom-right. -->
                        <a
                          href={asLink(item.review_url)}
                          target="_blank"
                          rel="noopener"
                          aria-label="Read this review on Yelp"
                          class="focus-visible:ring-primary-deep absolute -bottom-5 right-6 rounded-2xl shadow-md focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden"
                        >
                          <img
                            src="/icons/yelp-logo.png"
                            alt="Yelp"
                            width="56"
                            height="56"
                            class="h-14 w-14 rounded-2xl"
                          />
                        </a>
                      {:else}
                        <!-- Non-Yelp source (e.g. Google) → a neutral link, so a
                             Google review is never mislabelled as Yelp. -->
                        <a
                          href={asLink(item.review_url)}
                          target="_blank"
                          rel="noopener"
                          class="text-primary-deep focus-visible:ring-primary-deep absolute right-6 bottom-4 text-sm font-semibold underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden"
                        >
                          Read review
                        </a>
                      {/if}
                    {/if}
                    <blockquote
                      class="text-dark/90 text-[16px] leading-relaxed lg:text-lg"
                    >
                      <p>{item.quote}</p>
                    </blockquote>
                    <figcaption
                      class="mt-[10px] flex items-center gap-4 lg:mt-8"
                    >
                      {#if isFilled.image(item.reviewer_photo)}
                        <PrismicImage
                          field={item.reviewer_photo}
                          fallbackAlt=""
                          class="h-[72px] w-[72px] rounded-full object-cover lg:h-14 lg:w-14"
                        />
                      {/if}
                      <div class="flex-1">
                        <p
                          class="text-dark text-[16px] font-semibold lg:text-xl"
                        >
                          {item.reviewer_name}
                        </p>
                        {#if item.reviewer_place}
                          <p
                            class="text-secondary text-sm tracking-wide uppercase"
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
      {#if slice.variation === "review" && isFilled.link(trackItems[0]?.review_url)}
        <a
          href={asLink(trackItems[0].review_url)}
          target="_blank"
          rel="noopener"
          class="text-dark hover:text-primary-deep focus-visible:ring-primary-deep mt-12 inline-flex items-center gap-2 text-lg font-light focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden"
        >
          Read Reviews
          <Plus class="text-primary" size={20} aria-hidden="true" />
        </a>
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
