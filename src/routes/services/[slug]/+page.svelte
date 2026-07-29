<script lang="ts">
  import { asLink, isFilled } from "@prismicio/client";
  import { PrismicImage } from "@prismicio/svelte";
  import RichTextBody from "$lib/components/RichTextBody.svelte";
  import CtaBand from "$lib/components/CtaBand.svelte";
  import { splitLede } from "./lede";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  // The body's opening paragraph reads as the page's lede — styled larger
  // and set off from the rest, matching the live site (`collection_item`
  // has no separate excerpt field, so it's split out of `body`, never
  // duplicated). Promoted ONLY when a paragraph is the body's FIRST block:
  // hoisting one from deeper in would silently reorder a body that opens
  // with a heading or image. Rule + rationale live in ./lede.ts.
  const split = $derived(splitLede(data.doc.data.body));
  const lede = $derived(split.lede);
  const restBody = $derived(split.rest);

  // The live site embeds a YouTube player via this doc's `link` field on
  // services that have one — anything else in `link` (or an unfilled field)
  // renders no iframe.
  const linkHref = $derived(asLink(data.doc.data.link));
  const youtubeUrl = $derived(
    linkHref?.includes("youtube.com/embed") ? linkHref : undefined,
  );
</script>

<div class="mx-auto max-w-3xl px-6 pt-32 text-sm">
  <nav aria-label="Breadcrumb">
    <a
      href="/services"
      class="font-medium tracking-widest uppercase hover:opacity-70 focus-visible:ring-2 focus-visible:ring-primary-deep focus-visible:ring-offset-2 focus-visible:outline-hidden"
    >
      Services
    </a>
    {#if data.category}<span aria-hidden="true"> / </span>{data.category}{/if}
  </nav>
</div>

<article class="mx-auto max-w-3xl px-6 py-10">
  <h1 class="text-3xl font-light text-dark">{data.title}</h1>
  {#if lede}
    <p class="mt-4 text-lg text-secondary">{lede}</p>
  {/if}

  <div class="richtext-block mt-8">
    <RichTextBody field={restBody} />
  </div>

  {#if isFilled.image(data.doc.data.media)}
    <PrismicImage
      field={data.doc.data.media}
      class="mt-8 h-auto w-full rounded object-cover"
    />
  {/if}

  {#if youtubeUrl}
    <div class="mt-8 aspect-video w-full">
      <iframe
        src={youtubeUrl}
        title={`${data.title} video`}
        loading="lazy"
        class="h-full w-full rounded"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowfullscreen
      ></iframe>
    </div>
  {/if}
</article>

<CtaBand />
