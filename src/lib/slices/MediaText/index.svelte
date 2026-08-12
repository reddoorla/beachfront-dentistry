<script lang="ts">
  import RichTextBody from "$lib/components/RichTextBody.svelte";
  import PrismicPhoto from "$lib/components/PrismicPhoto.svelte";
  import ContentBand from "$lib/components/ContentBand.svelte";
  import { PrismicRichText } from "@prismicio/svelte";
  import { isFilled, type Content } from "@prismicio/client";

  let { slice }: { slice: Content.MediaTextSlice } = $props();
  let reverse = $derived(slice.variation === "imageLeft");
  let hasHeading = $derived(isFilled.richText(slice.primary.heading));
  let hasBody = $derived(isFilled.richText(slice.primary.body));
  let hasMedia = $derived(isFilled.image(slice.primary.media));
  let mediaOnly = $derived(hasMedia && !hasHeading && !hasBody);
</script>

{#if mediaOnly}
  <!-- A row with only an image is a full-bleed feature photo, centered — not an
       editorial split with an empty copy column beside it. -->
  <ContentBand
    sliceType={slice.slice_type}
    variation={slice.variation}
    contentClass="max-w-5xl px-6 py-16"
  >
    <!-- Full-bleed body photo on /your-first-visit: measured 390/834/1440 — genuinely the viewport at every tier, so 100vw is right and the win here is `loading=lazy` moving it off the critical path (that page carried 1703KB before scroll at 1440). -->
    <PrismicPhoto
      field={slice.primary.media}
      fallbackAlt=""
      sizes="100vw"
      class="mx-auto h-auto w-full"
    />
  </ContentBand>
{:else}
  <!-- Photo-dominant editorial row: copy ~1/3, image ~2/3, alternating sides
       down the page (see app.css `nth-child(even of …)` rule). -->
  <ContentBand
    sliceType={slice.slice_type}
    variation={slice.variation}
    contentClass="grid max-w-6xl grid-cols-1 items-center gap-10 px-6 py-16 lg:grid-cols-12"
  >
    <div
      class="mt-copy {hasMedia
        ? 'lg:col-span-4'
        : 'text-center lg:col-span-8 lg:col-start-3'} {reverse
        ? 'lg:order-2'
        : ''}"
    >
      {#if hasHeading}
        <PrismicRichText field={slice.primary.heading} />
      {/if}
      <RichTextBody field={slice.primary.body} />
    </div>
    {#if hasMedia}
      <div class="mt-media lg:col-span-8 {reverse ? 'lg:order-1' : ''}">
        <!-- Same block, second image. -->
        <PrismicPhoto
          field={slice.primary.media}
          fallbackAlt=""
          sizes="100vw"
          class="h-auto w-full"
        />
      </div>
    {/if}
  </ContentBand>
{/if}

<!-- The .serif-blurb text14 treatment lives in app.css (always loaded). -->
