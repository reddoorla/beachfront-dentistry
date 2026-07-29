<script lang="ts">
  import { bandFor, type Presentation } from "$lib/blux/presentation";
  import SectionBand from "$lib/blux/SectionBand.svelte";
  import CarouselFrames, {
    type CarouselFrame,
  } from "$lib/blux/CarouselFrames.svelte";
  import ContentBand from "$lib/components/ContentBand.svelte";
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
      contentClass="max-w-5xl px-6 py-16 text-center"
    >
      {#if hasHeading && slice.primary.heading}
        <div class="mb-10">
          <PrismicRichText field={slice.primary.heading} />
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
        arrowClass="text-dark hover:bg-light focus-visible:ring-2 focus-visible:ring-primary-deep focus-visible:ring-offset-2 focus-visible:outline-hidden"
        transitionClass="duration-500 ease-in-out"
      >
        {#snippet children({ index }: { index: number })}
          {@const item = trackItems[index]}
          {#if item}
            <div class="px-4">
              {#if slice.variation === "review"}
                <blockquote class="text-xl italic">
                  <p>{item.quote}</p>
                </blockquote>
                <div class="mt-6 flex items-center justify-center gap-3">
                  {#if isFilled.image(item.reviewer_photo)}
                    <PrismicImage
                      field={item.reviewer_photo}
                      class="h-12 w-12 rounded-full object-cover"
                    />
                  {/if}
                  <div class="text-left">
                    <p class="font-semibold">{item.reviewer_name}</p>
                    <p class="text-sm text-secondary">
                      {item.reviewer_place}
                    </p>
                  </div>
                </div>
                {#if isFilled.link(item.review_url)}
                  <a
                    href={asLink(item.review_url)}
                    target="_blank"
                    rel="noopener"
                    class="mt-4 inline-block underline focus-visible:ring-2 focus-visible:ring-primary-deep focus-visible:ring-offset-2 focus-visible:outline-hidden"
                  >
                    Read review
                  </a>
                {/if}
              {:else if isFilled.image(item.image) || item.caption}
                {#if isFilled.image(item.image)}
                  <PrismicImage
                    field={item.image}
                    class="h-auto w-full object-cover"
                  />
                {/if}
                {#if item.caption}
                  <p class="mt-4 text-sm text-secondary">{item.caption}</p>
                {/if}
              {/if}
            </div>
          {/if}
        {/snippet}
      </Slider>
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
