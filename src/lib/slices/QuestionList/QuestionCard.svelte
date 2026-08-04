<script lang="ts">
  import { PrismicImage } from "@prismicio/svelte";
  import {
    asText,
    isFilled,
    type ImageField,
    type RichTextField,
  } from "@prismicio/client";
  import { animateIn, LIVE_REVEAL } from "$lib/actions/animateIn";

  // The one true "Ask the Doctor" question card (live's `.qa-block`): a
  // fixed-height photo card with a pale header bar (circled number + "+"), the
  // title overlaid low, and — on click — an in-place expand where the title
  // fades out and the answer teaser + "Read More" slide up. It is shared by
  // BOTH QuestionList variations so any fidelity change carries globally:
  //   - `teaser`  (home): a centered single column, some cards featured (no
  //                number), the doctor headshot + handwriting floating aside.
  //   - `numbered`(ask-the-doctor index): a 2-column Webflow-`w-col-6` grid of
  //                every question, each numbered by its canonical position.
  // Card owns its own expanded state — the grid has no cross-card coordination.

  type NewsArticleDoc = {
    uid: string;
    data: { title?: RichTextField; media?: ImageField };
  };

  let {
    doc,
    number,
    teaser,
  }: {
    doc: NewsArticleDoc;
    // null = a featured/hero card (home's first) — no circled number.
    number: number | null;
    // Resolved teaser text (hand-written excerpt or lead-paragraph fallback);
    // the parent owns the TEASERS map + fallback, the card just renders it.
    teaser: string;
  } = $props();

  const titleText = $derived(asText((doc.data.title ?? []) as RichTextField));
  const pad2 = (n: number): string => String(n).padStart(2, "0");

  let expanded = $state(false);
  const toggle = () => (expanded = !expanded);
  const panelId = $derived(`qa-panel-${doc.uid}`);
</script>

<!-- Per-card reveal + floatAlong tracking target (`.qa-item`): live raises
     each `.qa-block` as IT enters. -->
<div class="qa-item" use:animateIn={LIVE_REVEAL}>
  <!-- Not a link: live's .qa-block has no wrapping <a> — only "Read More"
       inside the revealed answer navigates. The WHOLE card is the toggle
       (live's .qa-block carries cursor:pointer); the header-bar <button> stays
       as the semantic disclosure for keyboard/AT, so this div click is a
       pointer convenience only. Opening reproduces live's mechanics: the card
       drops 48px/80px (margin-top .65s ease-out) while the label bar slides up
       out of the clip. Mobile's card box also grows 288→384 (measured);
       tablet/desktop stay fixed (live's .qa-block.active only re-heights ≤479).
       Height ladder read off live's `.qa-block` rule: 10rem base (400 @ the
       40px desktop root) / 10rem still at tablet (measured 240) / 12rem ≤767
       (measured 288) — md:h-[240px], NOT 320 (an earlier value verified only
       at 1440/390 that never held at the 768 tablet cut). -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <!-- NOT overflow-hidden: live's .qa-block never clips — when open, the label
       bar rides up ABOVE the card box (into the 48/80px the card's own
       margin-top just vacated). The photo and the answer each clip inside
       their own wrappers instead. -->
  <div
    onclick={(e) => {
      if ((e.target as HTMLElement).closest("a, button")) return;
      toggle();
    }}
    onkeydown={(e) => {
      if (e.key === "Escape" && expanded) toggle();
    }}
    class="relative block cursor-pointer rounded-[25px] shadow-md ring-1 ring-black/5 transition-[margin-top,opacity] duration-[650ms] ease-out hover:opacity-80 motion-reduce:transition-none {expanded
      ? 'mt-12 h-[384px] xs:h-[288px] md:mt-16 md:h-[240px] lg:mt-20 lg:h-[400px]'
      : 'h-[288px] md:h-[240px] lg:h-[400px]'}"
  >
    <!-- Media + washes clip inside their own rounded box (the card itself no
         longer clips). Open: top corners square — live's .qa-image.active
         radius 0 0 25 25, the label bar having ridden above the box. -->
    <div
      class="absolute inset-0 overflow-hidden {expanded
        ? 'rounded-b-[25px]'
        : 'rounded-[25px]'}"
    >
      {#if isFilled.image(doc.data.media)}
        <PrismicImage
          field={doc.data.media}
          fallbackAlt=""
          class="absolute inset-0 h-full w-full object-cover object-center"
        />
      {:else}
        <div
          class="from-primary to-accent absolute inset-0 bg-gradient-to-br"
        ></div>
      {/if}
      <!-- Live's real visible wash, read off `.box-gradient.qa`: cyan-0.9 at
           the TOP on mobile, flipping to cyan-at-the-BOTTOM on desktop
           (identical to the 3-C cards' rule). `.box-gradient-overlay`
           (opacity:0) is the HOVER layer — not this one. -->
      <div
        class="absolute inset-0 lg:hidden"
        style="background:linear-gradient(rgba(18,158,204,0.9) 23%, rgba(5,44,57,0.25) 93%, rgba(0,0,0,0))"
        aria-hidden="true"
      ></div>
      <div
        class="absolute inset-0 hidden lg:block"
        style="background:linear-gradient(rgba(0,0,0,0), rgba(18,158,204,0.9) 90%)"
        aria-hidden="true"
      ></div>
      <!-- Expanded-state wash: live's `.box-gradient-overlay.qa` fades to 1
           when the card opens, deepening the cyan so white answer copy reads. -->
      <div
        class="absolute inset-0 transition-opacity duration-[650ms] motion-reduce:transition-none {expanded
          ? 'opacity-100'
          : 'opacity-0'}"
        style="background:linear-gradient(rgba(0,0,0,0), rgba(16,137,177,0.78) 31%, rgba(18,158,204,0.9) 80%)"
        aria-hidden="true"
      ></div>
    </div>
    <!-- Answer: excerpt + Read More sliding up inside its OWN clip box (live
         clips the answer in the small .qa-text box, not the card). `inert`
         keeps the clipped link untabbable while closed. -->
    <div class="absolute inset-x-0 top-12 bottom-0 overflow-hidden lg:top-20">
      <div
        id={panelId}
        inert={!expanded}
        class="px-[35px] transition-transform duration-[650ms] motion-reduce:transition-none lg:px-[60px] {expanded
          ? 'translate-y-0'
          : 'translate-y-[400px]'}"
      >
        <p
          class="text-[16px] leading-[24px] font-light text-white lg:text-[20px] lg:leading-[30px]"
        >
          {teaser}
        </p>
        <a
          href="/questions/{doc.uid}"
          class="font-slab mt-[46px] inline-flex h-[41px] items-center rounded-lg border border-white px-[15px] text-[15px] font-light text-white transition-[opacity,background-color] hover:bg-[#129ecc4a] hover:opacity-60 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:outline-hidden md:text-[20px] lg:mt-[36px] lg:h-[67px] lg:px-[25px] lg:text-[25px]"
        >
          Read More
        </a>
      </div>
    </div>
    <!-- Pale header bar — live's .qa-label. When the card opens it rides up
         ABOVE the card box (live's .qa-label.active margin-top:-2rem) and
         remains the disclosure toggle. -->
    <button
      type="button"
      aria-expanded={expanded}
      aria-controls={panelId}
      aria-label="{expanded ? 'Collapse' : 'Expand'}: {titleText}"
      onclick={toggle}
      class="focus-visible:ring-primary-deep absolute inset-x-0 top-0 flex h-12 cursor-pointer items-center justify-between rounded-t-[25px] bg-[#e7f5fa] px-5 transition-transform duration-[650ms] ease-out focus-visible:ring-2 focus-visible:ring-inset focus-visible:outline-hidden motion-reduce:transition-none lg:h-20 lg:px-5 {expanded
        ? '-translate-y-full'
        : ''}"
    >
      {#if number !== null}
        <!-- Live's .qa-circle: an h6 in museo-slab BOLD 25px/30px, a
             full-strength 1px #365b6d ring, ~52px disc at desktop. -->
        <span
          class="font-slab grid size-10 place-items-center rounded-full border border-[#365b6d] text-[15px] leading-[15px] font-bold tracking-[1.28px] text-[#365b6d] uppercase md:text-[20px] lg:size-[52px] lg:text-[25px] lg:leading-[30px]"
          >{pad2(number)}</span
        >
      {:else}
        <span aria-hidden="true"></span>
      {/if}
      <!-- Live's card +/−: its own Plus.svg / minus.svg assets. -->
      {#if expanded}
        <img
          src="/icons/minus.svg"
          alt=""
          class="w-[15px] lg:w-[25px]"
          aria-hidden="true"
        />
      {:else}
        <img
          src="/icons/plus.svg"
          alt=""
          class="w-[15px] lg:w-[25px]"
          aria-hidden="true"
        />
      {/if}
    </button>
    <!-- Title overlaid low (live's standalone `.qa-text`), a direct child of
         the card box so the page-diff anchor resolves to its low position.
         museo-SANS (not the base h3 slab), 20px/30px @390 → 30px/45px @1440,
         w500. BOX: 80% card width, inset 6.8% left (that narrower measure is
         what wraps these titles onto two lines like live). -->
    <h3
      class="absolute bottom-4 left-[6.8%] w-4/5 font-sans text-[1.25rem] leading-[30px] font-medium transition-opacity duration-300 motion-reduce:transition-none lg:bottom-5 lg:text-[1.875rem] lg:leading-[45px] {expanded
        ? 'opacity-0'
        : 'opacity-100'}"
      style="color:#fff"
    >
      {titleText}
    </h3>
  </div>
</div>
