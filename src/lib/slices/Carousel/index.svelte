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
      <div class="relative">
        {#if slice.variation === "review"}
          <!-- "what they say:" margin annotation. The exact Typekit script face
               arrives with the font allowlist (fonts deferred for now); a
               cursive fallback stack carries the intent until then. -->
          <span
            aria-hidden="true"
            class="text-primary pointer-events-none absolute -top-4 left-0 z-10 hidden -rotate-6 text-2xl lg:block"
            style="font-family:'Caveat','Bradley Hand','Segoe Print',cursive"
          >
            what they say:
          </span>
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
              {#if slice.variation === "review"}
                <div class="px-4">
                  <figure
                    class="bg-surface mx-auto max-w-2xl rounded-2xl p-8 text-left shadow-sm ring-1 ring-black/5 sm:p-10"
                  >
                    <span
                      aria-hidden="true"
                      class="font-slab text-primary/20 block text-5xl leading-none"
                      >“</span
                    >
                    <blockquote
                      class="text-dark/90 -mt-2 text-lg leading-relaxed"
                    >
                      <p>{item.quote}</p>
                    </blockquote>
                    <figcaption class="mt-6 flex items-center gap-3">
                      {#if isFilled.image(item.reviewer_photo)}
                        <PrismicImage
                          field={item.reviewer_photo}
                          fallbackAlt=""
                          class="h-12 w-12 rounded-full object-cover"
                        />
                      {/if}
                      <div class="flex-1">
                        <p class="text-dark font-semibold">
                          {item.reviewer_name}
                        </p>
                        {#if item.reviewer_place}
                          <p class="text-secondary text-sm">
                            {item.reviewer_place}
                          </p>
                        {/if}
                      </div>
                      {#if isFilled.link(item.review_url)}
                        <a
                          href={asLink(item.review_url)}
                          target="_blank"
                          rel="noopener"
                          class="text-primary-deep shrink-0 text-sm font-semibold underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-primary-deep focus-visible:ring-offset-2 focus-visible:outline-hidden"
                        >
                          Read review
                        </a>
                      {/if}
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
