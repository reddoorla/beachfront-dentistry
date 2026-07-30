<script lang="ts">
  import RichTextBody from "$lib/components/RichTextBody.svelte";
  import ContentBand from "$lib/components/ContentBand.svelte";
  import WaveDivider from "$lib/components/WaveDivider.svelte";
  import {
    PrismicImage,
    PrismicLink,
    PrismicRichText,
  } from "@prismicio/svelte";
  import {
    asText,
    isFilled,
    type Content,
    type ImageField,
    type LinkField,
    type RichTextField,
  } from "@prismicio/client";
  import { slide } from "$lib/transitions";
  import {
    Plus,
    Sparkles,
    ShieldPlus,
    Stethoscope,
    HeartPulse,
  } from "@lucide/svelte";
  import { SvelteSet } from "svelte/reactivity";

  let { slice }: { slice: Content.SectionGridSlice } = $props();

  // The `layout` select + its supporting primary fields (subtitle / body /
  // side_image / cta_*) aren't in the generated Prismic types yet (regenerating
  // needs a wired Slice Machine session, same as Hero's band/cta variations),
  // so widen the primary shape locally.
  type ExtraPrimary = {
    layout?: "auto" | "cards" | "steps" | "services" | null;
    subtitle?: string | null;
    body?: RichTextField;
    side_image?: ImageField;
    cta_label?: string | null;
    cta_link?: LinkField;
  };
  const primary = $derived(
    slice.primary as Content.SectionGridSliceDefaultPrimary & ExtraPrimary,
  );

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

  // Accordion state for the `cards` layout (the home "Finally…" trio): each
  // card carries a photo + a label bar; a card whose item_body is filled gets a
  // "+" toggle that expands the body underneath. Mirrors Accordion.svelte.
  const openCards = new SvelteSet<number>();
  const uid = $props.id();
  const toggleCard = (i: number) =>
    openCards.has(i) ? openCards.delete(i) : openCards.add(i);

  let items = $derived(slice.items as Item[]);
  let textItems = $derived(items.filter((i) => hasText(i) || !hasMedia(i)));
  let mediaItems = $derived(items.filter((i) => hasMedia(i) && !hasText(i)));

  // `mode` is the content-shape heuristic (bare images → tiles, image+text →
  // cards, text only → copy, else a magazine split). `layout` lets an editor
  // override it explicitly; the bespoke "steps"/"services" designs have no
  // content signature to infer, so they only ever come from an explicit choice.
  let mode = $derived(
    items.length > 0 && items.every((i) => hasMedia(i) && !hasText(i))
      ? "tiles"
      : items.length > 0 && items.every((i) => hasMedia(i) && hasText(i))
        ? "cards"
        : mediaItems.length === 0
          ? "copy"
          : "split",
  );
  let layout = $derived(
    primary.layout && primary.layout !== "auto" ? primary.layout : mode,
  );

  const isSmall = (i: Item) => (i.item_media?.dimensions?.width ?? 9999) < 480;
  const pad2 = (n: number) => String(n).padStart(2, "0");

  // Service rows carry no icon field; pick a health-themed lucide glyph by name
  // so the three read as distinct. (Exact tooth marks from the live SVGs are a
  // deferred fidelity pass.)
  const serviceIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes("cosmetic")) return Sparkles;
    if (n.includes("implant")) return ShieldPlus;
    if (n.includes("general")) return Stethoscope;
    return HeartPulse;
  };

  const hasCta = $derived(
    !!primary.cta_label && isFilled.link(primary.cta_link),
  );
</script>

{#if layout === "services"}
  <!-- Teal→sand gradient services band: a wave seam top & bottom (fill = the
       white neighbours above/below) with a badge straddling the top wave.
       Ports the live Services section. -->
  <section
    data-slice-type={slice.slice_type}
    data-slice-variation={slice.variation}
    data-section-layout="services"
    class="from-primary to-accent relative isolate w-full overflow-hidden bg-gradient-to-br text-white"
  >
    <WaveDivider fill="white" flip />
    <div
      class="text-primary-deep absolute top-0 left-1/2 z-20 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white shadow-md"
      aria-hidden="true"
    >
      <Sparkles size={26} />
    </div>
    <div
      class="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-6 py-20 lg:grid-cols-2 lg:items-center"
    >
      <div>
        {#if isFilled.richText(primary.heading)}
          <p class="text-sm font-bold tracking-[0.2em] text-white/80 uppercase">
            {asText(primary.heading)}
          </p>
        {/if}
        {#if isFilled.richText(primary.body)}
          <div class="mt-4 max-w-xl text-lg leading-relaxed text-white/90">
            <RichTextBody field={primary.body} />
          </div>
        {/if}
        {#if hasCta}
          <PrismicLink
            field={primary.cta_link}
            class="focus-visible:ring-offset-primary mt-8 inline-block rounded-full border border-white/70 px-7 py-3 font-semibold text-white transition-colors hover:bg-white hover:text-primary-deep focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:outline-hidden"
          >
            {primary.cta_label}
          </PrismicLink>
        {/if}
      </div>
      <ul class="flex flex-col gap-5">
        {#each items as item (item)}
          {@const label = asText(item.item_heading)}
          {@const Icon = serviceIcon(label)}
          <li>
            <PrismicLink
              field={item.item_link}
              class="flex items-center gap-4 rounded-xl bg-white/10 px-5 py-4 ring-1 ring-white/15 transition-colors hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-hidden"
            >
              <span
                class="grid size-11 shrink-0 place-items-center rounded-full bg-white/15 text-white"
              >
                <Icon size={22} />
              </span>
              <span class="font-slab text-xl font-medium">{label}</span>
            </PrismicLink>
          </li>
        {/each}
      </ul>
    </div>
    <WaveDivider fill="white" />
  </section>
{:else if layout === "steps"}
  <!-- Display heading + subtitle beside a circular photo, then numbered steps,
       then a CTA. Ports the live "Your Path to Oral Health" section. The
       heading is rendered as a plain element (not PrismicRichText) so the large
       display sizing can override the global h2 scale. -->
  <section
    data-slice-type={slice.slice_type}
    data-slice-variation={slice.variation}
    data-section-layout="steps"
    class="mx-auto max-w-6xl px-6 py-20"
  >
    <div class="grid grid-cols-1 items-center gap-10 md:grid-cols-2">
      <div>
        {#if isFilled.richText(primary.heading)}
          <h2
            class="font-slab text-primary-deep text-[clamp(2.5rem,1rem+5vw,5rem)] leading-[1.05] font-light"
          >
            {asText(primary.heading)}
          </h2>
        {/if}
        {#if primary.subtitle}
          <p class="text-dark/70 mt-3 text-lg">{primary.subtitle}</p>
        {/if}
      </div>
      {#if isFilled.image(primary.side_image)}
        <div class="mx-auto w-full max-w-sm">
          <PrismicImage
            field={primary.side_image}
            fallbackAlt=""
            class="aspect-square w-full rounded-full object-cover"
          />
        </div>
      {/if}
    </div>
    <ol class="mt-14 grid grid-cols-1 gap-10 text-center sm:grid-cols-3">
      {#each items as item, i (item)}
        <li>
          <p
            class="text-secondary text-sm font-bold tracking-[0.2em] uppercase"
          >
            Step {pad2(i + 1)}
          </p>
          <h3 class="font-slab text-primary-deep mt-2 text-2xl font-light">
            {asText(item.item_heading)}
          </h3>
          {#if isFilled.richText(item.item_body)}
            <div class="text-dark/70 mt-2">
              <RichTextBody field={item.item_body} />
            </div>
          {/if}
        </li>
      {/each}
    </ol>
    {#if hasCta}
      <div class="mt-12 text-center">
        <PrismicLink
          field={primary.cta_link}
          class="bg-primary-deep hover:bg-primary focus-visible:ring-primary-deep inline-block rounded-full px-8 py-3 font-semibold text-white transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden"
        >
          {primary.cta_label}
        </PrismicLink>
      </div>
    {/if}
  </section>
{:else}
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

    {#if layout === "tiles"}
      <div class="grid grid-cols-2 gap-6 md:grid-cols-3">
        {#each items as item (item)}
          <PrismicLink
            field={item.item_link}
            class="bg-surface flex items-center justify-center p-8"
          >
            <PrismicImage
              field={item.item_media}
              fallbackAlt=""
              class="max-h-16 w-auto object-contain"
            />
          </PrismicLink>
        {/each}
      </div>
    {:else if layout === "cards"}
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
                class="focus-visible:ring-primary-deep flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-4 text-left focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden"
              >
                <span class="font-slab text-primary-deep text-lg font-medium"
                  >{label}</span
                >
                <span
                  class="bg-primary/10 text-primary-deep grid size-8 shrink-0 place-items-center rounded-full"
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
                <span class="font-slab text-primary-deep text-lg font-medium"
                  >{label}</span
                >
              </div>
            {/if}
          </div>
        {/each}
      </div>
    {:else if layout === "copy"}
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
{/if}
