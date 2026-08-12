<script lang="ts">
  import RichTextBody from "$lib/components/RichTextBody.svelte";
  import PrismicPhoto from "$lib/components/PrismicPhoto.svelte";
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
  import {
    animateIn,
    LIVE_REVEAL,
    ABOVE_FOLD_REVEAL,
  } from "$lib/actions/animateIn";
  import { pillClass } from "$lib/components/OutlineButton.svelte";
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
  // 992 (not 1024) to match the CSS desktop breakpoint (--breakpoint-lg): live
  // renders desktop from 992, so the accordion-card structure must switch there
  // too, or the 992–1023 seam shows stacked mobile cards inside the 3-up grid.
  // Live's `.expanding-text` is `opacity: 0` at rest and only flips to 1 in
  // `@media (max-width: 767px)` — so the click-to-expand card is live's
  // treatment for the ENTIRE 768+ range, tablet included, and the
  // always-visible-copy card is a phone-only layout. Splitting at 992 rendered
  // the phone card across 768–991, which is why the whole band showed body
  // copy live hides and dropped the "+" live shows.
  const isMobile = $derived(viewport.width < 768);

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
  // Live's `.home-floats-section` is `flex-direction: column` at <=991 and only
  // a row at >=992, so the cards stack across the whole tablet band and the
  // grid switches at lg (=992 here) — not md/sm, which would break the stack.
  const colClass: Record<number, string> = {
    2: "lg:grid-cols-2",
    3: "lg:grid-cols-3",
    4: "lg:grid-cols-4",
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
    class="relative isolate w-full pt-[72px] pb-48 text-white md:pt-24 md:pb-64 lg:pt-40 lg:pb-80"
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
      class="absolute top-[72px] right-[20%] z-20 w-[75px] xs:w-[55px] md:top-[8px] md:right-[25%] md:w-[130px] lg:top-[-20px] lg:right-[24.3%] lg:w-[130px]"
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
      class="mx-auto grid max-w-[1400px] grid-cols-1 gap-12 px-[5%] py-6 pb-24 xs:px-[8%] md:grid-cols-2 md:gap-0 md:px-12 md:py-8 md:pb-8 lg:grid-cols-2 lg:px-[60px] lg:py-10 lg:pb-10"
    >
      <!-- `._w-half.su-w-full-mobile.py-2`: 50% at >=768 going full at <=767,
           with padding-y `.5rem` = 12/16/20 (`beachfront.css:4110-4113`). -->
      <div class="py-3 md:py-4 lg:py-5">
        {#if isFilled.richText(primary.heading)}
          <p
            class="font-slab text-[12px] leading-[15px] font-bold tracking-[1.28px] text-white uppercase lg:text-[24px] lg:leading-[30px]"
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
            class="mt-5 mb-5 max-w-[80%] font-light text-white xs:mb-10 [&_p]:text-[20px] [&_p]:leading-[30px] [&_p]:font-light lg:[&_p]:text-[30px] lg:[&_p]:leading-[45px]"
            use:animateIn={REVEAL}
          >
            <RichTextBody field={primary.body} />
          </div>
        {/if}
        {#if hasCta}
          <!-- Live `.button` (white variant): 25px museo-slab in a 67px pill at
               desktop; hover = opacity .6 + a translucent cyan fill — the text
               stays white (a white-fill hover was an invention). -->
          <div use:animateIn={REVEAL}>
            <PrismicLink
              field={primary.cta_link}
              class="{pillClass(
                'white',
              )} focus-visible:ring-offset-primary px-[1em] py-[1.3em] text-[15px] leading-[0] md:text-[20px] lg:text-[25px]"
            >
              {primary.cta_label}
            </PrismicLink>
          </div>
        {/if}
      </div>
      <!-- Live's mobile link pitch is 96px (60px rows + 36px gaps), not the
           cramped gap-4 — measured 2026-08-02. -->
      <ul class="flex flex-col gap-9 md:gap-12 lg:gap-[61px]">
        {#each items as item (item)}
          {@const label = asText(item.item_heading)}
          <li use:animateIn={REVEAL}>
            <!-- Hover moves the row toward where it goes instead of dimming it:
                 fading a link to 80% is the disabled idiom, and these rows are
                 this section's only navigation. `translate` (not `transform`) is
                 the property Tailwind v4 compiles `translate-x-*` to, so that is
                 what transitions. -->
            <PrismicLink
              field={item.item_link}
              class="group flex items-center gap-4 rounded-lg transition-[translate] duration-200 ease-out hover:translate-x-1 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent focus-visible:outline-hidden motion-reduce:transition-none lg:gap-10"
            >
              <!-- Live tooth icons are 60px on mobile (100px on desktop); labels
                   stay one line (mobile ~20px). -->
              <img
                src={toothIcon(label)}
                alt=""
                class="size-[60px] shrink-0 md:size-20 lg:size-[100px]"
              />
              <!-- Live's row label is h3.text-color-white: museo-slab w300,
                   WHITE at both breakpoints — 21px/26px at mobile (measured on
                   live @390), 40px/50px at desktop. -->
              <span
                class="font-slab text-[21px] leading-[26px] font-light text-white lg:text-[40px] lg:leading-[50px]"
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
    class="mx-auto max-w-[1400px] px-[5%] pb-[84px] xs:px-[8%] md:px-12 md:pb-28 lg:px-[60px] lg:pb-[140px]"
  >
    <!-- Live animates the heading+photo block as ONE element, then each step
         and the CTA individually as they enter. -->
    <!-- DEVIATION (MarkUp thread badfa786, pin #6): live top-aligns the two
         `._w-half` columns (50%, beachfront.css:2867-2871; photo column pads
         pt 20 / pb 40 at the 40px root), which parks the circle's center 46px
         ABOVE the h2's center once the 120px heading wraps to 4 lines
         (live's own probed offsets: circle vs headline+subhead block center
         +7.5px @1440, -89px @1294). Tim wants the circle centered on the
         headline block instead, so the row centers its items at lg. -->
    <div class="lg:flex lg:items-center" use:animateIn={REVEAL}>
      <!-- `._w-half.p-4.su-w-full-tablet`: 50% (`beachfront.css:2867-2871`)
           going 100% at <=991, padding `1rem` = 24/32/40. That padding is what
           wraps live's 120px heading to THREE lines at 834 (a 674 column, not
           738); without it ours wrapped to two and the block was 244px short. -->
      <div class="w-full p-6 md:p-8 lg:w-1/2 lg:p-10">
        {#if isFilled.richText(primary.heading)}
          <!-- Live steps its display heading (not a smooth clamp): ~56px on
               mobile, then a flat 120px/140 across the whole tablet+desktop
               range (root 32/40). Our clamp matches the mobile floor and the
               desktop cap but undershot the tablet middle (75px), so md pins
               the flat 120. -->
          <!-- 480–767: live's `.content-width` has %-side-padding (8%/5%,
               beachfront.css:8627) so its heading column is narrower than our
               fixed px-6 — cand wrapped this 120px h2 to fewer lines than live
               (602 vs live's 498 @650), misaligning the block. Cap it to ~live's
               width in the landscape band; md+ the grid column already narrows
               it so reset there. -->
          <h2
            class="h-primary font-slab mb-2.5 text-center text-[clamp(3.5rem,0.5rem+8vw,7.5rem)] leading-[1.25] font-thin [text-wrap:normal] xs:mx-auto xs:max-w-[85%] xs:text-[120px] xs:leading-[1.167] md:mb-4 md:max-w-none md:text-[120px] md:leading-[1.167] lg:mb-5 lg:leading-[1.167]"
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
            class="mt-6 mb-10 text-center text-[20px] leading-[30px] font-light text-[#365b6d] md:mt-8 lg:mt-10 lg:text-[30px] lg:leading-[45px]"
          >
            {primary.subtitle}
          </p>
        {/if}
      </div>
      {#if isFilled.image(primary.side_image)}
        <!-- lg pads are deliberately pt-0/pb-10: under lg:items-center the
             headline+subhead block's center sits (subtitle mb-10)/2 = 20px
             ABOVE its column's center, so the circle column carries
             pb − pt = 40px to land the flex-centered circle exactly on the
             block center — at any lg width, whichever column is taller.
             Sub-lg (stacked) pads are untouched: they match live's probed
             stack (thread badfa786, pin #6). -->
        <div
          class="mx-auto w-full px-6 pt-3 pb-6 md:w-1/2 md:px-8 md:pt-4 md:pb-8 lg:w-1/2 lg:px-10 lg:pt-0 lg:pb-10"
        >
          <!-- The big services circle: half the container at md+, full width
               below. Measured 303/305/560 at 390/834/1440 — the 50% column at
               834 lands almost exactly where the full-width phone does, which
               is why both mid steps are ~305 rather than the viewport. -->
          <PrismicPhoto
            field={primary.side_image}
            fallbackAlt=""
            sizes="(min-width: 1024px) 560px, (min-width: 768px) 305px, 303px"
            class="aspect-square w-full rounded-full object-cover"
          />
        </div>
      {/if}
    </div>
    <ol
      class="flex flex-col gap-10 text-center md:flex-row md:justify-between md:gap-0"
    >
      {#each items as item, i (item)}
        <!-- The home trio used to land on ONE frame — `LIVE_REVEAL.delayMax`
             is 0, so the position heuristic computes 0ms for everything and
             three cards arrive as a slab, which reads as a trigger firing
             rather than as a page laid out deliberately.
             Staggered, not gated on the breakpoint: this `<ol>` is a row at md+
             (where the stagger sequences correctly, all three triggering in the
             same frame) and a COLUMN below it, where item 3 waits 140ms after
             entering the viewport. With three items that penalty is well inside
             the 750ms transition and never reads as stuck — the audit's warning
             about vertical stagger is about long lists, where it would be 420ms
             and would. -->
        <li
          class="md:w-[30%] md:min-w-0"
          use:animateIn={{ ...REVEAL, stagger: 70, index: i }}
        >
          <!-- Live's STEP label is an h6: museo-SLAB 400, 1.28px tracking,
               slate #365b6d at BOTH breakpoints — 12px/15px mobile, 24px/30px
               desktop (the small sans eyebrow was an invention; census caught
               the mobile side still wearing it). Step title: 30px/40px
               weight-100 on mobile, stepping up to 40px/50px weight-300 with
               a 20px top margin on desktop. -->
          <p
            class="font-slab my-2.5 text-[12px] leading-[15px] font-normal tracking-[1.28px] text-[#365b6d] uppercase lg:text-[24px] lg:leading-[30px]"
          >
            Step {pad2(i + 1)}
          </p>
          <!-- text-wrap (builtin) defeats the global h1–h6 `text-wrap: balance`
               (app.css:401): balance split "Receive a No-Pressure Plan" into 2
               even lines, live fills it — the arbitrary [text-wrap:normal] form
               silently no-ops here, the builtin utility works (as in Hero). -->
          <h3
            class="h-primary font-slab mt-2.5 mb-5 text-[30px] leading-[40px] font-thin text-wrap xs:mt-5 xs:mb-2.5 xs:text-[21px] xs:leading-[26px] xs:font-light lg:text-[40px] lg:leading-[50px] lg:font-light"
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
      <div class="mt-12 text-center md:mt-16 lg:mt-20" use:animateIn={REVEAL}>
        <PrismicLink
          field={primary.cta_link}
          class="{pillClass(
            'teal',
          )} px-[1em] py-[1.3em] text-[14px] leading-[0] xs:text-[15px] md:text-[20px] lg:text-[25px]"
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
       of everything in the region. Same reasoning below: live keeps 60px
       (36px mobile) BETWEEN this section and the team section (its inner
       content-width div carries mb-60 which collapses through the section),
       so ours is mb on the section, and the old lg:pb-16 (64px) inside is
       live's rendered 40px (lg:pb-10). -->
  <ContentBand
    sliceType={slice.slice_type}
    variation={slice.variation}
    sectionClass="mb-9 md:mb-12 lg:mt-10 lg:mb-[60px]"
    contentClass="max-w-[1400px] px-[5%] pt-[72px] pb-0 xs:px-[8%] md:px-12 md:pt-0 md:pb-28 lg:px-[60px] lg:pt-0 lg:pb-10"
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
           split into 282/235. heading→cards gap: 36px at ≤479 (24px between
           cards), but live DOUBLES it to 72px across the 480–991 band (settled
           measurement — with 96px between cards there), so xs:mb-[72px]. -->
      <!-- Live's h1 carries `._w-half` — width 50% of the content column, going
           full width only at <=767 (`.su-w-full-mobile`). Measured: 351 (full)
           @390, 369 (half of 738) @834, 640 (half of 1280) @1440. A flat
           max-w-[640px] gave the RIGHT answer at 1440 and 390 and the wrong one
           across 768-991, where it let the heading run 640 wide on one line
           instead of wrapping to two at 369. -->
      <!-- Home's first content heading, and the second reveal target inside the
           first viewport at BOTH widths (measured top=850 @1440, 702 @390) —
           so it takes the server-rendered hidden state like the hero above it. -->
      <div
        data-reveal
        class="h-primary mb-9 [&_h2]:text-[28px] [&_h2]:leading-[38px] [&_h2]:text-wrap xs:mb-[72px] md:mt-8 md:mb-32 md:w-1/2 lg:mb-20 lg:[&_h2]:text-[60px] lg:[&_h2]:leading-[1.2]"
        use:animateIn={ABOVE_FOLD_REVEAL}
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
           (13+397+31+397+31+397+13 ≈ 1279; the inset is `.expanding-box`'s
           `margin: 0 12.5px`, beachfront.css:6927-6928, and the width is the
           page embed's `calc(33% - 25px)`, index.html:88-102; probed first
           card x=92.5 on the reference at 1440). MarkUp d486b3c5 thread
           bdabccea-788f-4df8-9832-12a64544cba5 (pin #3): "Left align image to
           headline above" — the lg row now drops that inset so the first/last
           card edges sit flush on the shared content gutter (cards grow
           397→406 in the same 1280 box, gap stays live's 31px). Deliberate
           deviation from live's inset row; see LEDGER 2026-08-10. -->
      <!-- Below 992 the row is a single column. `.expanding-box` is sized in rem
           against live's stepped root, so the column has its own ladder:
             <=479    100% x 240 (10rem), margin .5rem -> 24px gap, centred
             480-767  16rem x 14rem = 384x336, margin 2rem -> 96px gap
             768-991  16rem x 14rem = 512x448, margin 2rem -> 128px gap
           and at 768-991 it is LEFT-aligned, not centred: live's card sits at
           x=112 = the 48px content gutter + its own 64px margin (measured at
           834; the whole column was centred at x=161 here). Tim's pin is the
           desktop row; live's own deliberate tablet indent stays. -->
      <div
        data-grid-columns={columns}
        class="grid grid-cols-1 gap-6 xs:mx-auto xs:max-w-[403px] xs:gap-[96px] md:mx-0 md:ml-16 md:max-w-[512px] md:gap-[128px] lg:mx-0 lg:ml-0 lg:max-w-none lg:gap-[31px] {colClass[
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
              class="relative h-[240px] overflow-hidden rounded-[25px] bg-[#e7f5fa] shadow-sm xs:h-[336px] md:h-[448px]"
              use:animateIn={REVEAL}
            >
              <!-- The mobile "Finally…" card. Measured 351/480/600 at
                   390/834/1440 — its column narrows at md, which is why the
                   middle step is not simply the viewport. -->
              <PrismicPhoto
                field={item.item_media}
                fallbackAlt=""
                sizes="(min-width: 1024px) 600px, (min-width: 768px) 480px, 351px"
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
                  class="absolute inset-x-0 top-0 p-6 font-light text-white [&_*]:text-white [&_p]:text-[20px] [&_p]:leading-[30px] [&_p]:font-light xs:[&_p]:text-[18px] xs:[&_p]:leading-[27px] md:[&_p]:text-[18px] md:[&_p]:leading-[27px]"
                >
                  <RichTextBody field={item.item_body} />
                </div>
              {/if}
              <!-- Pale label bar overlaid on the bottom of the card. -->
              <div
                class="absolute inset-x-0 bottom-0 flex h-[60px] items-center justify-between bg-[#e7f5fa] px-3"
              >
                <span
                  class="font-slab text-[24px] leading-[36px] font-bold text-[#365b6d] xs:text-[30px] xs:leading-[45px] md:text-[30px] md:leading-[45px] lg:text-[30px] lg:leading-[45px]"
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
            <!-- 14rem tall across 768–991 (448 at that band's 32px root), 7rem
                 at >=992 (280 at 40). -->
            <!-- The WHOLE card toggles, not just its 80px bar. This card is
                 the Q&A card's visual twin on the same page — pale bar, "+",
                 cyan wash, one open — and that one has toggled from anywhere
                 since it shipped (QuestionCard.svelte:156-159). Probed at
                 1440: 406x280 with `cursor: auto`, and a click dispatched on
                 the photo left `aria-expanded="false"`, so 71% of the surface
                 was silently inert. A patient who learns the gesture on one
                 family and tries it on the other should not be told the page
                 is broken. The guard is copied verbatim rather than
                 reimplemented: the bar's own <button>, and any link the body
                 copy carries, must not double-fire through the wrapper. The
                 <button> stays the semantic disclosure — same tab stop, same
                 ARIA, keyboard path unchanged; this is a pointer convenience.
                 The mobile card (isMobile branch above) deliberately has no
                 toggle at all — its copy is already showing — so this is the
                 desktop/tablet structure only. -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div
              onclick={expandable
                ? (e: MouseEvent) => {
                    if ((e.target as HTMLElement).closest("a, button")) return;
                    toggleCard(i);
                  }
                : undefined}
              onkeydown={expandable
                ? (e: KeyboardEvent) => {
                    if (e.key === "Escape" && open) toggleCard(i);
                  }
                : undefined}
              class="group relative h-[448px] overflow-hidden rounded-[25px] bg-[#e7f5fa] shadow-sm lg:h-[280px] {expandable
                ? 'cursor-pointer'
                : ''}"
              use:animateIn={REVEAL}
            >
              <!-- The desktop accordion card. Non-monotonic: 512 wide at 834
                   in the stacked layout, 406 at 1440 once the 3-up grid takes
                   over. A rising ladder would understate the tablet by 106px.
                   Overshoot before this line: 3.5x. -->
              <PrismicPhoto
                field={item.item_media}
                fallbackAlt=""
                sizes="(min-width: 1024px) 406px, (min-width: 768px) 512px, 351px"
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
                <!-- `.expanding-text` insets are live's own rem margins on the
                     stepped root: 1.5rem/1.5rem/1rem at 768–991 (48/48/32, 18px
                     copy) and 1rem 2rem 1rem .5rem at >=992 (40 top, 80 right,
                     20 left — a 297px measure inside the 397px card, NOT the
                     symmetric 50px inset we had). -->
                <div
                  id={panelId}
                  inert={!open}
                  class="absolute inset-x-0 top-0 px-12 pt-12 pb-8 font-light text-white transition-opacity duration-[650ms] motion-reduce:transition-none [&_*]:text-white [&_p]:text-[18px] [&_p]:leading-[27px] [&_p]:font-light lg:pt-10 lg:pr-20 lg:pb-10 lg:pl-5 lg:[&_p]:text-[20px] lg:[&_p]:leading-[30px] {open
                    ? 'opacity-100'
                    : 'opacity-0'}"
                >
                  <RichTextBody field={item.item_body} />
                </div>
                <!-- The bar is what the eye tracks, so it is what acknowledges
                     the pointer: one step brighter (#e7f5fa -> #d9eef7) under
                     `group-hover` from the card, in 200ms. It had no hover
                     rule at all and computed `transition: all / 0s`, so
                     nothing on this card moved until the cursor reached the
                     "+". Same colour and timing as the Q&A card's bar
                     (QuestionCard.svelte) — the two families brighten
                     identically on purpose. -->
                <button
                  type="button"
                  aria-expanded={open}
                  aria-controls={panelId}
                  onclick={() => toggleCard(i)}
                  class="focus-visible:ring-primary-deep absolute inset-x-0 bottom-0 flex h-16 cursor-pointer items-center justify-between gap-4 bg-[#e7f5fa] px-4 text-left transition-colors duration-200 group-hover:bg-[#d9eef7] focus-visible:ring-2 focus-visible:ring-inset focus-visible:outline-hidden motion-reduce:transition-none lg:h-20 lg:px-5"
                >
                  <span
                    class="font-slab text-[30px] leading-[45px] font-bold text-[#365b6d]"
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
                  class="absolute inset-x-0 bottom-0 flex h-16 items-center bg-[#e7f5fa] px-4 lg:h-20 lg:px-5"
                >
                  <span
                    class="font-slab text-[30px] leading-[45px] font-bold text-[#365b6d]"
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
