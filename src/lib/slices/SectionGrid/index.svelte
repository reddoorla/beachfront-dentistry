<script lang="ts">
  import RichTextBody from "$lib/components/RichTextBody.svelte";
  import ContentBand from "$lib/components/ContentBand.svelte";
  import {
    PrismicImage,
    PrismicLink,
    PrismicRichText,
  } from "@prismicio/svelte";
  import { asText, isFilled, type Content } from "@prismicio/client";
  import { slide } from "$lib/transitions";
  import { Plus } from "@lucide/svelte";
  import { SvelteSet } from "svelte/reactivity";

  let { slice }: { slice: Content.SectionGridSlice } = $props();
  let columns = $derived(slice.primary.columns ?? 3);
  const colClass: Record<number, string> = {
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-4",
  };

  type Item = Content.SectionGridSliceDefaultItem;
  const hasText = (i: Item) =>
    isFilled.richText(i.item_heading) || isFilled.richText(i.item_body);
  const hasMedia = (i: Item) => isFilled.image(i.item_media);

  // Accordion state for the `cards` mode (the home "Finally…" trio): each
  // card carries a photo + a label bar; a card whose item_body is filled
  // gets a "+" toggle that expands the body underneath (ports the live
  // site's card-flip disclosure). Mirrors Accordion.svelte's SvelteSet idiom.
  const openCards = new SvelteSet<number>();
  const uid = $props.id();
  const toggleCard = (i: number) =>
    openCards.has(i) ? openCards.delete(i) : openCards.add(i);

  let items = $derived(slice.items as Item[]);

  // Four layouts, chosen by what the items carry (mirrors the original's
  // archetypes): all bare images → tile strip; all image+text → card grid;
  // text plus bare-image items → magazine split; no bare-image items → copy.
  let textItems = $derived(items.filter((i) => hasText(i) || !hasMedia(i)));
  let mediaItems = $derived(items.filter((i) => hasMedia(i) && !hasText(i)));
  let mode = $derived(
    items.length > 0 && items.every((i) => hasMedia(i) && !hasText(i))
      ? "tiles"
      : items.length > 0 && items.every((i) => hasMedia(i) && hasText(i))
        ? "cards"
        : mediaItems.length === 0
          ? "copy"
          : "split",
  );
  // Small images (rule ornaments, logos) render at natural size; photos fill.
  const isSmall = (i: Item) => (i.item_media?.dimensions?.width ?? 9999) < 480;
</script>

<ContentBand
  sliceType={slice.slice_type}
  variation={slice.variation}
  contentClass="max-w-7xl px-6 py-16"
>
  {#if isFilled.richText(slice.primary.heading)}
    <div class="mb-10 text-center">
      <PrismicRichText field={slice.primary.heading} />
    </div>
  {/if}

  {#if mode === "tiles"}
    <div class="grid grid-cols-2 gap-6 md:grid-cols-3">
      {#each items as item (item)}
        <PrismicLink
          field={item.item_link}
          class="flex items-center justify-center bg-surface p-8"
        >
          <PrismicImage
            field={item.item_media}
            fallbackAlt=""
            class="max-h-16 w-auto object-contain"
          />
        </PrismicLink>
      {/each}
    </div>
  {:else if mode === "cards"}
    <!-- Photo cards with a label bar; a card with body copy gets a "+"
         disclosure that expands the copy beneath (live "Finally…" trio). -->
    <div
      data-grid-columns={columns}
      class="grid grid-cols-1 gap-6 sm:grid-cols-2 {colClass[columns] ??
        'md:grid-cols-3'}"
    >
      {#each items as item, i (item)}
        {@const open = openCards.has(i)}
        {@const label = asText(item.item_heading)}
        {@const expandable = isFilled.richText(item.item_body)}
        {@const panelId = `${uid}-card-${i}`}
        <div
          class="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5"
        >
          <PrismicImage
            field={item.item_media}
            fallbackAlt=""
            class="aspect-[4/3] w-full object-cover"
          />
          {#if expandable}
            <button
              type="button"
              aria-expanded={open}
              aria-controls={panelId}
              onclick={() => toggleCard(i)}
              class="flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-4 text-left focus-visible:ring-2 focus-visible:ring-primary-deep focus-visible:ring-offset-2 focus-visible:outline-hidden"
            >
              <span class="font-slab text-lg font-medium text-primary-deep"
                >{label}</span
              >
              <span
                class="grid size-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary-deep"
                aria-hidden="true"
              >
                <Plus
                  size={18}
                  class="transition-transform duration-300 {open
                    ? 'rotate-45'
                    : ''}"
                />
              </span>
            </button>
            {#if open}
              <div id={panelId} transition:slide={{ duration: 400 }}>
                <div class="text-dark/80 px-5 pt-0 pb-5 leading-relaxed">
                  <RichTextBody field={item.item_body} />
                </div>
              </div>
            {/if}
          {:else}
            <div class="px-5 py-4">
              <span class="font-slab text-lg font-medium text-primary-deep"
                >{label}</span
              >
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {:else if mode === "copy"}
    <div class="flex max-w-3xl flex-col gap-6">
      {#each textItems as item (item)}
        <div>
          <PrismicRichText field={item.item_heading} />
          <RichTextBody field={item.item_body} />
        </div>
      {/each}
    </div>
  {:else}
    <div class="grid grid-cols-1 items-start gap-12 lg:grid-cols-12">
      <div class="flex flex-col gap-6 lg:col-span-5">
        {#each textItems as item (item)}
          <div>
            <PrismicRichText field={item.item_heading} />
            {#if hasMedia(item)}
              <PrismicImage
                field={item.item_media}
                fallbackAlt=""
                class="mt-2 h-auto w-auto"
              />
            {/if}
            <RichTextBody field={item.item_body} />
          </div>
        {/each}
      </div>
      <div class="flex flex-col gap-10 lg:col-span-7">
        {#each mediaItems as item, i (item)}
          <PrismicImage
            field={item.item_media}
            fallbackAlt=""
            class="h-auto {isSmall(item) ? 'w-auto' : 'w-full'} {i % 2 === 1
              ? 'lg:ml-12 lg:max-w-[85%]'
              : ''}"
          />
        {/each}
      </div>
    </div>
  {/if}
</ContentBand>
