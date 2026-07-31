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
  import { animateIn } from "$lib/actions/animateIn";
  import { Plus } from "@lucide/svelte";
  import { SvelteSet } from "svelte/reactivity";
  import { viewport } from "$lib/stores/viewport.svelte";
  import { onMount } from "svelte";

  const REVEAL = { duration: 700, translateY: "2rem" } as const;

  onMount(() => viewport.subscribe());
  // Live's "Finally…" cards show their body copy overlaid on the photo on
  // mobile, but collapse to a "+" accordion on desktop. Gate the mobile overlay
  // on the viewport store (JS, not a `lg:hidden` CSS class) so it isn't in the
  // DOM at the test's default 1024px width — the accordion test asserts the body
  // is absent until the toggle is clicked, which must stay true on desktop.
  const isMobile = $derived(viewport.width < 1024);

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

  // The live site's three tooth badges (icon=tooth 1/2/3) — self-contained
  // circular SVGs served from static/. Cosmetic gets the sparkle tooth (tooth-3,
  // matching live); implant→2; general/other→the plain tooth-1.
  const toothIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes("cosmetic")) return "/icons/tooth-3.svg";
    if (n.includes("implant")) return "/icons/tooth-2.svg";
    return "/icons/tooth-1.svg";
  };

  const hasCta = $derived(
    !!primary.cta_label && isFilled.link(primary.cta_link),
  );
</script>

{#if layout === "services"}
  <!-- Teal→sand gradient services band: a wave seam at the TOP (fill = the
       white neighbour above) with the tooth badge straddling it, and a soft
       fade-to-white at the BOTTOM (live has no bottom wave — the band dissolves
       into the section below). Ports the live Services section. -->
  <section
    data-slice-type={slice.slice_type}
    data-slice-variation={slice.variation}
    data-section-layout="services"
    class="from-primary to-accent relative isolate w-full overflow-hidden bg-gradient-to-r text-white"
  >
    <WaveDivider fill="white" />
    <!-- The tooth badge (a self-contained cyan disc + white tooth, 130px
         native) straddles the top wave right-of-centre, sitting on the crest —
         matching live. Rendered at native size, not shrunk inside a wrapper. -->
    <img
      src="/icons/tooth-badge.svg"
      alt=""
      aria-hidden="true"
      class="absolute top-0 left-[68%] z-20 size-32 -translate-x-1/2 -translate-y-1/2 drop-shadow-md"
    />
    <div
      class="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-6 pt-20 pb-24 lg:grid-cols-2 lg:items-center lg:pt-12 lg:pb-12"
      use:animateIn={REVEAL}
    >
      <div>
        {#if isFilled.richText(primary.heading)}
          <p class="font-slab text-[24px] font-bold tracking-[0.06em] text-white uppercase">
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
            class="focus-visible:ring-offset-primary font-slab mt-8 inline-block rounded-lg border border-white px-[25px] py-[14px] text-[25px] font-light text-white transition-colors hover:bg-white hover:text-primary-deep focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:outline-hidden"
          >
            {primary.cta_label}
          </PrismicLink>
        {/if}
      </div>
      <ul class="flex flex-col gap-8 lg:gap-[61px]">
        {#each items as item (item)}
          {@const label = asText(item.item_heading)}
          <li>
            <PrismicLink
              field={item.item_link}
              class="group flex items-center gap-5 rounded-lg transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent focus-visible:outline-hidden"
            >
              <img src={toothIcon(label)} alt="" class="size-[100px] shrink-0" />
              <span class="font-slab text-[25px] font-light text-[#365b6d]"
                >{label}</span
              >
            </PrismicLink>
          </li>
        {/each}
      </ul>
    </div>
    <!-- Live has NO bottom wave here: the teal→sand band dissolves into the
         white "ask the doctor" section below via a soft vertical fade (the
         question cards float up over the faded tail). Match that instead of a
         hard wave seam. -->
    <div
      class="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-56 bg-gradient-to-b from-transparent to-white"
      aria-hidden="true"
    ></div>
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
    class="mx-auto max-w-6xl px-6 pt-24 pb-48"
    use:animateIn={REVEAL}
  >
    <div class="grid grid-cols-1 items-center gap-10 md:grid-cols-[1.1fr_1fr]">
      <div>
        {#if isFilled.richText(primary.heading)}
          <h2
            class="h-primary font-slab text-center text-[clamp(2.75rem,0.5rem+8vw,7.5rem)] leading-[1.167] font-thin [text-wrap:normal]"
          >
            {asText(primary.heading)}
          </h2>
        {/if}
        {#if primary.subtitle}
          <!-- Inline font-size: the unlayered global `main p` rule outranks any
               Tailwind text utility (unlayered beats @layer), so the 30px live
               subtitle size has to be set inline to win. -->
          <p
            class="mt-4 text-center font-light text-[#365b6d]"
            style="font-size:1.875rem;line-height:1.25"
          >
            {primary.subtitle}
          </p>
        {/if}
      </div>
      {#if isFilled.image(primary.side_image)}
        <div class="mx-auto w-full max-w-[560px]">
          <PrismicImage
            field={primary.side_image}
            fallbackAlt=""
            class="aspect-square w-full rounded-full object-cover"
          />
        </div>
      {/if}
    </div>
    <ol class="mt-12 grid grid-cols-1 gap-10 text-center sm:grid-cols-3">
      {#each items as item, i (item)}
        <li>
          <p
            class="text-secondary text-sm font-bold tracking-[0.2em] uppercase"
          >
            Step {pad2(i + 1)}
          </p>
          <h3 class="h-primary font-slab mt-2 text-3xl font-light">
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
          class="font-slab hover:border-primary hover:text-primary-deep focus-visible:ring-primary-deep inline-block rounded-lg border border-[#365b6d] px-[25px] py-[14px] text-[25px] font-light text-[#365b6d] transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden"
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
    contentClass="max-w-7xl px-6 pt-2 pb-16"
    reveal
  >
    {#if isFilled.richText(slice.primary.heading)}
      <!-- Live's "Finally…" heading sits ~10px from the band top with a wide
           ~128px gap to the card row below (measured): near-zero top padding on
           the band (pt-2) + mb-20 here. -->
      <div class="h-primary mb-8 max-w-2xl lg:mb-20">
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
          <!-- Pale-blue card: photo over a #e7f5fa label bar (30px/700 #365B6D
               label + a plain blue "+" disclosure), radius 20px — measured off
               the live "Finally…" cards. -->
          <div class="overflow-hidden rounded-[20px] bg-[#e7f5fa] shadow-sm">
            <div class="relative">
              <PrismicImage
                field={item.item_media}
                fallbackAlt=""
                class="aspect-[7/5] w-full object-cover"
              />
              <!-- Cyan bottom-fade (measured off live) that blends the photo
                   into the #e7f5fa label bar below. -->
              <div
                class="absolute inset-0"
                style="background:linear-gradient(rgba(18,158,204,0),rgba(18,158,204,0.9) 92%)"
                aria-hidden="true"
              ></div>
              {#if isMobile && expandable}
                <!-- Mobile: body copy overlaid on the photo (live). Desktop keeps
                     the collapsed +/accordion below. -->
                <div
                  class="absolute inset-x-0 bottom-0 p-5 text-[15px] leading-snug font-light text-white [&_*]:text-white"
                >
                  <RichTextBody field={item.item_body} />
                </div>
              {/if}
            </div>
            {#if expandable}
              <button
                type="button"
                aria-expanded={open}
                aria-controls={panelId}
                onclick={() => toggleCard(i)}
                class="focus-visible:ring-primary-deep flex w-full cursor-pointer items-center justify-between gap-4 p-5 text-left focus-visible:ring-2 focus-visible:ring-inset focus-visible:outline-hidden"
              >
                <span class="font-slab text-3xl font-bold text-[#365b6d]">{label}</span>
                <Plus
                  size={30}
                  class="text-primary shrink-0 transition-transform duration-300 {open
                    ? 'rotate-45'
                    : ''}"
                  aria-hidden="true"
                />
              </button>
              {#if open}
                <div id={panelId} transition:slide={{ duration: 400 }}>
                  <div class="px-5 pt-0 pb-5 leading-relaxed text-[#365b6d]/90">
                    <RichTextBody field={item.item_body} />
                  </div>
                </div>
              {/if}
            {:else}
              <div class="p-5">
                <span class="font-slab text-3xl font-bold text-[#365b6d]">{label}</span>
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
