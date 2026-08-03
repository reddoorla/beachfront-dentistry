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
  import { animateIn, LIVE_REVEAL } from "$lib/actions/animateIn";
  import { SvelteSet } from "svelte/reactivity";
  import { viewport } from "$lib/stores/viewport.svelte";
  import { onMount } from "svelte";

  // Live reveals PER ELEMENT (each card, each step, each copy block rises as
  // IT enters the viewport), not per section — wired below accordingly.
  const REVEAL = LIVE_REVEAL;

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
    class="relative isolate w-full pt-[72px] pb-48 text-white lg:pt-40 lg:pb-80"
    style="background:linear-gradient(to right, rgb(18,158,204), rgb(182,170,145))"
  >
    <!-- The top wave seam OVERLAYS the band — live's services section has no
         wave in its own flow (its three children are the two gradients and the
         content box), so leaving ours in flow added 120px/72px of dead space at
         the top and pushed the whole band down relative to live. `mirror`
         reproduces live's `.bot-wave.flip` rotateY(180deg): the crest's higher
         side sits on the LEFT. -->
    <div class="pointer-events-none absolute inset-x-0 top-0">
      <WaveDivider fill="white" mirror />
    </div>
    <!-- The tooth badge (live's big-teal-tooth.svg, byte-identical, 130px
         native) overlaps the section seam: top edge 20px ABOVE the section
         line, riding over the white wave (its z beats the wave's), right edge
         ~25% in from the right — live's .big-teal-tooth placement. The section
         must NOT clip (live's overflow is visible); the wave clips its own
         overflow inside WaveDivider. -->
    <img
      src="/icons/big-teal-tooth.svg"
      alt=""
      aria-hidden="true"
      class="absolute top-[72px] right-[20%] z-20 w-[75px] lg:top-[-20px] lg:right-[24.3%] lg:w-[130px]"
    />
    <!-- Live's `.home-services-transe-to-white-gradient`: a FULL-HEIGHT overlay
         that is transparent to 50% then fades to solid white, so the teal→sand
         band dissolves into the white section below. It sits BEFORE the content
         in DOM order, so the copy and the service list render on top of it at
         full contrast. (A fixed-height bar pinned to the bottom at z-10 — what
         this was — paints over the lower list items and greys them out.) -->
    <div
      class="pointer-events-none absolute inset-0"
      style="background:linear-gradient(rgba(0,0,0,0) 50%, rgb(255,255,255))"
      aria-hidden="true"
    ></div>
    <div
      class="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-6 pb-24 lg:grid-cols-2 lg:pt-12 lg:pb-12"
    >
      <div>
        {#if isFilled.richText(primary.heading)}
          <p
            class="font-slab text-[24px] font-bold tracking-[0.06em] text-white uppercase"
            use:animateIn={REVEAL}
          >
            {asText(primary.heading)}
          </p>
        {/if}
        {#if isFilled.richText(primary.body)}
          <!-- Live body: 20px/30 white at mobile in an 80%-width box
               (`_w-80pc`, 281px at 390 — full-width wraps too wide), 30px/45
               desktop. The [&_p] overrides are load-bearing: RichTextBody's
               <p> is styled DIRECTLY by the base `main :where(p)` clamp
               (17.4-19px), which beats values merely inherited from this
               wrapper. -->
          <div
            class="mt-4 max-w-[80%] font-light text-white lg:max-w-xl [&_p]:text-[20px] [&_p]:leading-[30px] [&_p]:font-light lg:[&_p]:text-[30px] lg:[&_p]:leading-[45px]"
            use:animateIn={REVEAL}
          >
            <RichTextBody field={primary.body} />
          </div>
        {/if}
        {#if hasCta}
          <!-- Live `.button` (white variant): 25px museo-slab in a 67px pill at
               desktop; hover = opacity .6 + a translucent cyan fill — the text
               stays white (a white-fill hover was an invention). -->
          <div class="mt-8" use:animateIn={REVEAL}>
            <PrismicLink
              field={primary.cta_link}
              class="focus-visible:ring-offset-primary font-slab inline-flex h-[41px] items-center rounded-lg border border-white px-[15px] text-[15px] font-light text-white transition-[opacity,background-color] hover:bg-[#129ecc4a] hover:opacity-60 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:outline-hidden lg:h-[67px] lg:px-[25px] lg:text-[25px]"
            >
              {primary.cta_label}
            </PrismicLink>
          </div>
        {/if}
      </div>
      <!-- Live's mobile link pitch is 96px (60px rows + 36px gaps), not the
           cramped gap-4 — measured 2026-08-02. -->
      <ul class="flex flex-col gap-9 lg:gap-[61px]">
        {#each items as item (item)}
          {@const label = asText(item.item_heading)}
          <li use:animateIn={REVEAL}>
            <PrismicLink
              field={item.item_link}
              class="group flex items-center gap-4 rounded-lg transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent focus-visible:outline-hidden lg:gap-5"
            >
              <!-- Live tooth icons are 60px on mobile (100px on desktop); labels
                   stay one line (mobile ~20px). -->
              <img
                src={toothIcon(label)}
                alt=""
                class="size-[60px] shrink-0 lg:size-[100px]"
              />
              <!-- Live's row label is h3.text-color-white: museo-slab w300
                   40px/50px WHITE at desktop (the 25px slate value belonged to
                   a different element). Mobile keeps the measured 20px. -->
              <span
                class="font-slab text-[20px] font-light text-[#365b6d] lg:text-[40px] lg:leading-[50px] lg:text-white"
                >{label}</span
              >
            </PrismicLink>
          </li>
        {/each}
      </ul>
    </div>
    <!-- Live has NO bottom wave here — the band dissolves into the white
         section below purely via the full-height fade above. -->
  </section>
{:else if layout === "steps"}
  <!-- Display heading + subtitle beside a circular photo, then numbered steps,
       then a CTA. Ports the live "Your Path to Oral Health" section. The
       heading is rendered as a plain element (not PrismicRichText) so the large
       display sizing can override the global h2 scale. -->
  <!-- Live geometry (2026-08-02, root 40px): content box 1280 (1400 − 60px
       pads), steps 384 wide at 30% with space-between, steps→CTA gap 80px,
       CTA→section-end 140px. -->
  <section
    data-slice-type={slice.slice_type}
    data-slice-variation={slice.variation}
    data-section-layout="steps"
    class="mx-auto max-w-[1400px] px-6 pt-24 pb-48 lg:px-[60px] lg:pt-[60px] lg:pb-[140px]"
  >
    <!-- Live animates the heading+photo block as ONE element, then each step
         and the CTA individually as they enter. -->
    <div
      class="grid grid-cols-1 items-center gap-10 md:grid-cols-[1.1fr_1fr]"
      use:animateIn={REVEAL}
    >
      <div>
        {#if isFilled.richText(primary.heading)}
          <h2
            class="h-primary font-slab text-center text-[clamp(3.5rem,0.5rem+8vw,7.5rem)] leading-[1.25] font-thin [text-wrap:normal] lg:leading-[1.167]"
          >
            {asText(primary.heading)}
          </h2>
        {/if}
        {#if primary.subtitle}
          <!-- Live subtitle is 20px/30px on mobile, 30px on desktop, with a
               40px top margin (its mt-4 = 1rem at the 40px root). The global
               `main :where(p)` rule is 0-specificity (:where), so an arbitrary
               text-[] utility outranks it — no inline needed. -->
          <p
            class="mt-4 text-center text-[20px] leading-[30px] font-light text-[#365b6d] lg:mt-10 lg:text-[30px] lg:leading-[45px]"
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
    <ol class="mt-12 grid grid-cols-1 gap-10 text-center sm:grid-cols-3 lg:gap-16">
      {#each items as item, i (item)}
        <li use:animateIn={REVEAL}>
          <!-- Live's STEP label is an h6: museo-SLAB 400 24px/30px, 1.28px
               tracking, slate #365b6d at desktop (the small sans eyebrow was
               an invention). Step title: 30px/40px weight-100 on mobile,
               stepping up to 40px/50px weight-300 with a 20px top margin on
               desktop. -->
          <p
            class="text-secondary text-xs font-bold tracking-[0.2em] uppercase lg:font-slab lg:text-[24px] lg:leading-[30px] lg:font-normal lg:tracking-[1.28px] lg:text-[#365b6d]"
          >
            Step {pad2(i + 1)}
          </p>
          <h3
            class="h-primary font-slab mt-2 text-[30px] leading-[40px] font-thin lg:mt-5 lg:text-[40px] lg:leading-[50px] lg:font-light"
          >
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
      <!-- Live: 80px from the steps row to the CTA; the button is
           `.button.text-color-primary-dark` (67px pill, live hover). -->
      <div class="mt-12 text-center lg:mt-20" use:animateIn={REVEAL}>
        <PrismicLink
          field={primary.cta_link}
          class="font-slab focus-visible:ring-primary-deep inline-flex h-[41px] items-center rounded-lg border border-[#365b6d] px-[14px] text-[14px] font-light text-[#365b6d] transition-[opacity,background-color] hover:bg-[#129ecc4a] hover:opacity-60 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden lg:h-[67px] lg:px-[25px] lg:text-[25px]"
        >
          {primary.cta_label}
        </PrismicLink>
      </div>
    {/if}
  </section>
{:else}
  <!-- reveal={false}: live animates the heading and each card individually
       (per-element), not the whole band as one block. -->
  <!-- lg:mt-10 on the SECTION: live's settled "Finally…" heading starts 40px
       below the hero's bottom edge (measured AFTER scroll-settling both pages —
       the raw scroll-0 read is +160px on both, the un-fired reveal translate;
       the old pt-2 sat the heading only 8px under the hero wave). It's a
       section MARGIN, not content padding, because live's 40px sits BETWEEN
       sections with the heading flush at its section top — and the page-diff
       anchor cuts at the section box, so inner padding reads as a 40px shift
       of everything in the region. -->
  <ContentBand
    sliceType={slice.slice_type}
    variation={slice.variation}
    sectionClass="lg:mt-10"
    contentClass="max-w-[1400px] px-[19.5px] pt-[72px] pb-0 lg:px-[60px] lg:pt-0 lg:pb-16"
    reveal={false}
  >
    {#if isFilled.richText(slice.primary.heading)}
      <!-- Live's "Finally…" heading sits ~10px from the band top with a wide
           gap to the card row below — measured ~132px on mobile (heading top 663
           → card top 871, heading ~76 tall), ~128px on desktop. -->
      <!-- [text-wrap:normal] undoes the global h1–h6 `text-wrap: balance`:
           balancing evens the two lines ("Finally have a dentist / that puts
           you first") where live fills the first line ("...dentist that / puts
           you first"), which shifts every card below it. -->
      <!-- [&_h2]:text-[28px]: live's mobile heading is EXACTLY 28px; the
           global clamp lands at 28.07px, just enough to flip the line break
           ("...dentist that /" → "...dentist /") and shift the whole band.
           [&_h2]:text-wrap (the BUILT-IN utility, computed `wrap`) undoes the
           global h1-h6 `text-wrap: balance` — the arbitrary-property form
           `[text-wrap:normal]` silently never applied (computed stayed
           `balance`, measured 2026-08-02), re-balancing live's 342/175 line
           split into 282/235. mb-9: live's heading→cards gap is 36px at
           mobile (with 24px between cards — not the other way round). -->
      <div
        class="h-primary mb-9 max-w-[640px] [&_h2]:text-[28px] [&_h2]:leading-[38px] [&_h2]:text-wrap lg:mb-20 lg:[&_h2]:text-[60px] lg:[&_h2]:leading-[1.2]"
        use:animateIn={REVEAL}
      >
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
           disclosure that reveals the copy over the photo (live "Finally…"
           trio's .expanding-box pattern). -->
      <!-- Desktop row geometry from live (2026-08-02): cards are 397 wide in
           the 1280 content box — a 13px inset each side + 31px gaps
           (13+397+31+397+31+397+13 ≈ 1279), not a flush gap-24 row. -->
      <div
        data-grid-columns={columns}
        class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:gap-[31px] lg:px-[13px] {colClass[
          columns
        ] ?? 'md:grid-cols-3'}"
      >
        {#each items as item, i (item)}
          {@const open = openCards.has(i)}
          {@const label = asText(item.item_heading)}
          {@const expandable = isFilled.richText(item.item_body)}
          {@const panelId = `${uid}-card-${i}`}
          <!-- Pale-blue card. Live's real mobile card is a single 351x240 box
               with the photo object-cover-centred across the WHOLE card (crop
               ar 1.462, cover, 50% 50% — verified against live), the cyan
               .box-gradient wash, the body copy overlaid on the photo, and the
               pale #e7f5fa label bar overlaid on the bottom. A stacked
               photo+bar can't hold both that crop AND the 240px height, so mobile
               uses the overlaid structure and desktop keeps the accordion. -->
          {#if isMobile}
            <div
              class="relative aspect-[351/240] overflow-hidden rounded-[25px] bg-[#e7f5fa] shadow-sm"
              use:animateIn={REVEAL}
            >
              <PrismicImage
                field={item.item_media}
                fallbackAlt=""
                class="absolute inset-0 h-full w-full object-cover object-center"
              />
              <!-- Live's `.box-gradient` is BREAKPOINT-DEPENDENT (read from the
                   live DOM 2026-07-31). At mobile it runs cyan-0.9 at the TOP
                   (23%) through a faint dark teal to transparent at the bottom —
                   that dark ground is what the white body copy overlaid above
                   reads against (live keeps `.expanding-text` visible at mobile,
                   opacity 1; on desktop it's 0 until the accordion opens, and
                   the gradient flips to cyan-at-the-bottom). -->
              <div
                class="absolute inset-0"
                style="background:linear-gradient(rgba(18,158,204,0.9) 23%, rgba(5,44,57,0.25) 93%, rgba(0,0,0,0))"
                aria-hidden="true"
              ></div>
              {#if expandable}
                <!-- Live body copy: 20px/30px weight-300 white, 24px inset
                     (width 303) — not the 15px we had. The [&_p] overrides are
                     load-bearing: RichTextBody's <p> is styled DIRECTLY by the
                     base `main :where(p)` clamp (17.4px at 390), which beats
                     values merely inherited from this wrapper. -->
                <div
                  class="absolute inset-x-0 top-0 p-6 font-light text-white [&_*]:text-white [&_p]:text-[20px] [&_p]:leading-[30px] [&_p]:font-light"
                >
                  <RichTextBody field={item.item_body} />
                </div>
              {/if}
              <!-- Pale label bar overlaid on the bottom of the card. -->
              <div
                class="absolute inset-x-0 bottom-0 flex h-[60px] items-center justify-between bg-[#e7f5fa] px-3"
              >
                <span
                  class="font-slab text-[24px] leading-[36px] font-bold text-[#365b6d] lg:text-[30px] lg:leading-[45px]"
                  >{label}</span
                >
                <!-- Live hides the +/- control on these cards at mobile (its
                     .plus-minus-block computes to 0x0 there — the class is
                     literally `display-block-desk-none-mobile`), because the
                     mobile card already shows its body copy uncollapsed. -->
              </div>
            </div>
          {:else}
            <!-- Live's desktop card (.expanding-box, re-measured at rest
                 2026-08-02): a single FIXED 397×280 box — the photo fills all
                 280px and the pale label bar OVERLAYS its bottom 80px (so
                 ~200px of photo shows). Opening does NOT grow the card (the
                 earlier slide-open accordion with dark copy was an invention):
                 a heavier cyan wash (.box-gradient-overlay: transparent →
                 0.78 cyan @31% → 0.9 @80%) fades in over the photo and the
                 body copy fades in as white 20px/30px w300 text at the TOP of
                 the box — 40px down, 50px side insets (live's 297/397 text
                 box) — while the label bar stays put. -->
            <div
              class="relative h-[280px] overflow-hidden rounded-[25px] bg-[#e7f5fa] shadow-sm"
              use:animateIn={REVEAL}
            >
              <PrismicImage
                field={item.item_media}
                fallbackAlt=""
                class="absolute inset-0 h-full w-full object-cover"
              />
              <div
                class="absolute inset-0"
                style="background:linear-gradient(rgba(18,158,204,0),rgba(18,158,204,0.9) 90%)"
                aria-hidden="true"
              ></div>
              {#if expandable}
                <div
                  class="absolute inset-0 transition-opacity duration-[650ms] motion-reduce:transition-none {open
                    ? 'opacity-100'
                    : 'opacity-0'}"
                  style="background:linear-gradient(rgba(0,0,0,0), rgba(16,137,177,0.78) 31%, rgba(18,158,204,0.9) 80%)"
                  aria-hidden="true"
                ></div>
                <div
                  id={panelId}
                  inert={!open}
                  class="absolute inset-x-0 top-0 px-[50px] pt-10 font-light text-white transition-opacity duration-[650ms] motion-reduce:transition-none [&_*]:text-white [&_p]:text-[20px] [&_p]:leading-[30px] [&_p]:font-light {open
                    ? 'opacity-100'
                    : 'opacity-0'}"
                >
                  <RichTextBody field={item.item_body} />
                </div>
                <button
                  type="button"
                  aria-expanded={open}
                  aria-controls={panelId}
                  onclick={() => toggleCard(i)}
                  class="focus-visible:ring-primary-deep absolute inset-x-0 bottom-0 flex h-20 cursor-pointer items-center justify-between gap-4 bg-[#e7f5fa] px-5 text-left focus-visible:ring-2 focus-visible:ring-inset focus-visible:outline-hidden"
                >
                  <span
                    class="font-slab text-[24px] leading-[36px] font-bold text-[#365b6d] lg:text-[30px] lg:leading-[45px]"
                    >{label}</span
                  >
                  <!-- Live swaps + for − when open (not a rotated ×) — its
                       own Plus.svg / minus.svg assets, 25px wide. -->
                  {#if open}
                    <img
                      src="/icons/minus.svg"
                      alt=""
                      class="w-[25px] shrink-0"
                      aria-hidden="true"
                    />
                  {:else}
                    <img
                      src="/icons/plus.svg"
                      alt=""
                      class="w-[25px] shrink-0"
                      aria-hidden="true"
                    />
                  {/if}
                </button>
              {:else}
                <div
                  class="absolute inset-x-0 bottom-0 flex h-20 items-center bg-[#e7f5fa] px-5"
                >
                  <span
                    class="font-slab text-[24px] leading-[36px] font-bold text-[#365b6d] lg:text-[30px] lg:leading-[45px]"
                    >{label}</span
                  >
                </div>
              {/if}
            </div>
          {/if}
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
