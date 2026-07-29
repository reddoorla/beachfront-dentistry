<script lang="ts">
  import { isFilled } from "@prismicio/client";
  import { PrismicImage } from "@prismicio/svelte";
  import RichTextBody from "$lib/components/RichTextBody.svelte";
  import CtaBand from "$lib/components/CtaBand.svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  const hasPhoto = $derived(isFilled.image(data.doc.data.media));
</script>

<div class="mx-auto max-w-5xl px-6 pt-32">
  <a
    href="/our-team"
    class="text-sm font-medium tracking-widest uppercase hover:opacity-70 focus-visible:ring-2 focus-visible:ring-primary-deep focus-visible:ring-offset-2 focus-visible:outline-hidden"
  >
    <span aria-hidden="true">←</span> Meet Our Team
  </a>
</div>

<article
  class="mx-auto flex max-w-5xl flex-col gap-8 px-6 pt-10 pb-16 md:flex-row md:items-start md:gap-12"
>
  <!-- Info column left, photo column right at md+ (live layout) — mobile
       stacks with the photo first, matching ProductDetail's same
       order-2/order-1 swap for its own image-vs-info split. -->
  <div
    class="order-2 flex flex-col gap-4 md:order-1 {hasPhoto
      ? 'md:w-[55%]'
      : 'md:w-full'}"
  >
    <div>
      <h1 class="text-3xl font-light text-dark">{data.title}</h1>
      {#if data.role}
        <p class="mt-2 text-secondary">{data.role}</p>
      {/if}
    </div>
    <div class="richtext-block">
      <RichTextBody field={data.doc.data.body} />
    </div>
  </div>

  {#if hasPhoto}
    <div class="order-1 md:order-2 md:w-[45%]">
      <PrismicImage
        field={data.doc.data.media}
        class="h-auto w-full rounded object-cover"
      />
    </div>
  {/if}
</article>

<CtaBand />
