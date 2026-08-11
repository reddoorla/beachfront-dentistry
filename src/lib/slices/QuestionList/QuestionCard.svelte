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
    variant = "numbered",
  }: {
    doc: NewsArticleDoc;
    // null = a featured/hero card (home's first) — no circled number.
    number: number | null;
    // Resolved teaser text (hand-written excerpt or lead-paragraph fallback);
    // the parent owns the TEASERS map + fallback, the card just renders it.
    teaser: string;
    /** Which of live's two `.qa-text` boxes this card uses. They are different
     *  elements, not a responsive step:
     *   • "numbered" (`.qa-text`, beachfront.css:7282-ff) — a FLOW sibling of
     *     `.qa-label`, `height: 8rem` (10rem at ≤767) = 320 / 256 / 240,
     *     `margin-x: 4%`. This is /ask-the-doctor's full list.
     *   • "teaser" (`.qa-text.m-2`, :7292-7301) — ABSOLUTE at `bottom: 0`,
     *     `height: 3rem` = 120 / 96 / 72, `width: 80%`, `margin-left: 1rem`.
     *     This is home's featured row.
     *  The box matters beyond looks: it is the element page-diff cuts on for
     *  the "Beyond the Smile" anchor, so getting it wrong misaligns every
     *  region below it on whichever page uses the other one. */
    variant?: "numbered" | "teaser";
  } = $props();

  const titleText = $derived(asText((doc.data.title ?? []) as RichTextField));
  const pad2 = (n: number): string => String(n).padStart(2, "0");

  let expanded = $state(false);
  const toggle = () => (expanded = !expanded);
  const panelId = $derived(`qa-panel-${doc.uid}`);

  /** The `.qa-text` box, which CLIPS its contents (overflow-hidden).
   *
   *  The teaser variant has two heights on live, not one:
   *      .qa-text.m-2         { height: 3rem }                  (beachfront.css:7292)
   *      .qa-text.m-2.active  { height: 8rem; transition: height .2s }   (:7303)
   *  Only the collapsed 3rem had been implemented, so the box stayed 72/96/120px
   *  while the answer that slides into it is 172-193px tall — the revealed text
   *  was clipped by 73px at 1440, 76px at 834 and 111px at 390, i.e. 61% of the
   *  answer was invisible on a phone. The box is justify-end, so it was the
   *  ANSWER COPY that got cut while the Read More button stayed on screen, which
   *  is why it read as "text cut off" rather than as an empty card.
   *
   *  8rem against live's stepped root (40 / 32 / 24) = 320 / 256 / 192, and that
   *  active rule is never overridden: `.qa-text.m-2.active` (three classes) wins
   *  over the <=767 `.qa-text { height: 10rem }` (one class).
   *
   *  Only the EXPANDED height is new. The collapsed box is untouched on purpose —
   *  it is the element page-diff cuts on for the "Beyond the Smile" anchor
   *  (see the comment on the element below), so changing it would move every
   *  region beneath it.
   *
   *  DEVIATION (MarkUp threads 3d255366-5bb2-4cb1-9a90-439d49ef63ef home pin #9
   *  and bd8c37b0-2e1c-4dc2-a466-8073e204d90c atd pin #1): live's box is FLUSH —
   *  both `.qa-text` (beachfront.css:7282) and `.qa-text.m-2.active` (:7303) end
   *  exactly at the card bottom, so the revealed "Read More" pill touches the
   *  edge. Tim: "It should have the same padding as the headline to the bottom
   *  of box." The headline's ladder is `.qa-question` margin-bottom .5rem
   *  (:7311) = the bottom-3/4/5 = 12/16/20px on the <h3> below, so the box gets
   *  the same pb. It is padding, not a height change: absolute children (the
   *  collapsed title) position off the border box, so collapsed geometry — the
   *  anchor-cut element — is untouched at every width.
   *  Two carve-outs, both probed 2026-08-10:
   *   - teaser base expanded height 192→244: the tallest authored answer panel
   *     is 231px @390 (six-card sweep; ce0c59d's 8rem=192 was verified on a
   *     179px card) — 231 was ALREADY clipped 39px, and +12 pb needs 243.
   *   - numbered gets NO base pb: the ≤479 expanded card is 384px over its
   *     240px flow box, leaving 96px under the pill already, and 240-12=228
   *     would re-clip the 231px panels. md/lg (flush, probed 0px) get 16/20. */
  const textBoxClass = $derived(
    variant === "teaser"
      ? "absolute bottom-0 ml-6 w-4/5 pb-3 transition-[height] duration-200 ease-out motion-reduce:transition-none md:ml-8 md:pb-4 lg:ml-10 lg:pb-5 " +
          (expanded ? "h-[244px] md:h-64 lg:h-80" : "h-18 md:h-24 lg:h-30")
      : "relative mx-[4%] h-60 md:h-64 md:pb-4 lg:h-80 lg:pb-5",
  );
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
      ? 'mt-12 h-[384px] xs:h-[288px] md:mt-16 md:h-[320px] lg:mt-20 lg:h-[400px]'
      : 'h-[288px] md:h-[320px] lg:h-[400px]'}"
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
           the TOP on mobile, flipping to cyan-at-the-BOTTOM from 768 up
           (identical to the 3-C cards' rule). `.box-gradient-overlay`
           (opacity:0) is the HOVER layer — not this one.
           The flip is live's <=767 rule, so it happens at md (768), NOT lg:
           probing live at 834 returns the DESKTOP gradient while ours was
           still painting the mobile one across the whole tablet band. -->
      <div
        class="absolute inset-0 md:hidden"
        style="background:linear-gradient(rgba(18,158,204,0.9) 23%, rgba(5,44,57,0.25) 93%, rgba(0,0,0,0))"
        aria-hidden="true"
      ></div>
      <div
        class="absolute inset-0 hidden md:block"
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
    <!-- Pale header bar — live's `.qa-label`, which is a FLOW child of
         `.qa-block`, not an overlay: `height: 2rem` (beachfront.css:7222-ff)
         against the stepped root = 80 / 64 / 48. When the card opens it rides
         up ABOVE the card box (live's `.qa-label.active` margin-top:-2rem) and
         remains the disclosure toggle. -->
    <button
      type="button"
      aria-expanded={expanded}
      aria-controls={panelId}
      aria-label="{expanded ? 'Collapse' : 'Expand'}: {titleText}"
      onclick={toggle}
      class="focus-visible:ring-primary-deep relative z-10 flex h-12 w-full cursor-pointer items-center justify-between rounded-t-[25px] bg-[#e7f5fa] px-5 transition-transform duration-[650ms] ease-out focus-visible:ring-2 focus-visible:ring-inset focus-visible:outline-hidden motion-reduce:transition-none md:h-16 lg:h-20 lg:px-5 {expanded
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
    <!-- Live's `.qa-text` (beachfront.css:7282-ff): a real FLOW sibling of
         `.qa-label`, `height: 8rem` (10rem at ≤767) = 320 / 256 / 240, with
         `margin-left/right: 4%`, flex-column, justify-end. It holds BOTH the
         question and the answer.

         This wrapper is not cosmetic — it is the element page-diff cuts on.
         Its collapsed text starts with the question, so on live the "Beyond the
         Smile" anchor resolves to this 320px box; we previously had only the
         80px <h3>, so the two pages were cut 220px apart and every atd region
         below was compared against the wrong content. That is the whole of the
         79-83% "colour delta" and of `top`'s 34.6/28.7/36.0% height failure —
         see matching/LEDGER.md "ANCHOR PARITY SWEEP". -->
    <div class="flex flex-col justify-end overflow-hidden {textBoxClass}">
      <!-- `.qa-question`: museo-SANS (not the base h3 slab), absolute inside
           `.qa-text`, `margin-bottom: .5rem` = 12 / 16 / 20. -->
      <h3
        class="absolute inset-x-0 bottom-3 font-sans text-[1.25rem] leading-[30px] font-medium transition-opacity duration-300 motion-reduce:transition-none md:bottom-4 lg:bottom-5 lg:text-[1.875rem] {variant ===
        'teaser'
          ? 'lg:leading-[45px]'
          : 'lg:leading-[40px]'} {expanded ? 'opacity-0' : 'opacity-100'}"
        style="color:#fff"
      >
        {titleText}
      </h3>
      <!-- `.qa-answer`: excerpt + Read More, translated out of the `.qa-text`
           box until opened. `inert` keeps the clipped link untabbable. -->
      <div
        id={panelId}
        inert={!expanded}
        class="transition-transform duration-[650ms] motion-reduce:transition-none {expanded
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
          class="font-slab px-[1em] py-[1.3em] leading-[0] mt-[46px] inline-flex items-center rounded-lg border border-white text-[15px] font-light text-white transition-[opacity,background-color] hover:bg-[#129ecc4a] hover:opacity-60 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:outline-hidden md:text-[20px] lg:mt-[36px] lg:text-[25px]"
        >
          Read More
        </a>
      </div>
    </div>
  </div>
</div>
