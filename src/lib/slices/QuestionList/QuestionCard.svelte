<script lang="ts">
  import { PrismicImage } from "@prismicio/svelte";
  import {
    asText,
    isFilled,
    type ImageField,
    type RichTextField,
  } from "@prismicio/client";
  import {
    animateIn,
    LIVE_REVEAL,
    ABOVE_FOLD_REVEAL,
  } from "$lib/actions/animateIn";
  import { pillClass } from "$lib/components/OutlineButton.svelte";

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
    firstFold = false,
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
    /** True for the cards inside the first viewport on a cold entry. They take
     *  the server-rendered hidden state (`data-reveal` + a failSafe) so they
     *  are hidden before the first paint rather than yanked after hydration;
     *  every card below the fold stays JS-hidden. Set by the parent, which is
     *  the only thing that knows a card's position in the list. */
    firstFold?: boolean;
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
   *  DEVIATION 1 — pb (MarkUp threads 3d255366-5bb2-4cb1-9a90-439d49ef63ef
   *  home pin #9 and bd8c37b0-2e1c-4dc2-a466-8073e204d90c atd pin #1): live's
   *  box is FLUSH — both `.qa-text` (beachfront.css:7282) and
   *  `.qa-text.m-2.active` (:7303) end exactly at the card bottom, so the
   *  revealed "Read More" pill touches the edge. Tim: "It should have the same
   *  padding as the headline to the bottom of box." The headline's ladder is
   *  `.qa-question` margin-bottom .5rem (:7311) = the bottom-3/4/5 =
   *  12/16/20px on the <h3> below, so the box gets the same pb. It is padding,
   *  not a height change: absolute children (the collapsed title) position off
   *  the padding box, so collapsed geometry — the anchor-cut element — is
   *  untouched at every width.
   *
   *  DEVIATION 2 — ROUND G2 FREEZE (same two threads, second half of home pin
   *  #9; operator directive 2026-08-11: Tim's instruction outranks the live
   *  behavior). Tim: "the box expands but I don't think it needs to since the
   *  headline disappears." So an OPEN card keeps its collapsed footprint and
   *  the answer takes only the room the vanished headline and the in-place
   *  label bar leave it: expanded box = card − label = 240 (xs..767) /
   *  256 (md) / 320 (lg). Two live rules are deliberately not reproduced any
   *  more: `.qa-text.m-2.active { height: 8rem }` (:7303) and the
   *  `.qa-label`/`.qa-block` active growth (see the card element below).
   *
   *  Tim's premise was verified, not assumed (probe 2026-08-11: every card on
   *  both pages × 1440/834/390, plus a 650 band check). Panel need (answer +
   *  Read More + the pb above) vs frozen room (card − label):
   *      teaser   need 243/212/243 vs room 320/256/240 — @390 SHORT 3px on
   *               two cards (the same 231px panels Round B measured);
   *      numbered need 243/236/219 vs room 320/256/240 — fits everywhere;
   *      both fit the xs band (worst need 195 @650 vs room 240).
   *  The ONE exception: a <480 teaser card grows 288→291 when open (minimum
   *  that clears 243) and this box gets the matching 243. Clipping is never
   *  reintroduced — tests/interaction/qa-expand.spec.ts sweeps every card on
   *  both pages and asserts scrollHeight == clientHeight on this box.
   *
   *  The pb ladder HOLDS under the freeze, which costs numbered its old base
   *  carve-out: its 12px used to come from the ≤479 card growing 288→384 over
   *  a 240px flow box (96px of card under the pill), and the freeze removes
   *  that cushion — so numbered now takes the base pb-3 like the teaser.
   *  Padding stays invisible collapsed (title absolute, answer translated
   *  out), so the anchor-cut element's collapsed geometry is still untouched. */
  /** What the card transitions, and for how long.
   *
   *  It used to be `transition-[height,opacity] duration-[650ms]` carrying a
   *  `hover:opacity-80`, which had two problems. Dimming a photo card to 80%
   *  is the DISABLED idiom — on a card whose whole job is to invite a click it
   *  says the opposite, and it dims the white headline the reader is mid-way
   *  through. And it did so over 650ms because opacity shared the declaration
   *  with the open/close height: the site's own norm for a pointer state is
   *  150-200ms (a duration census across the six real pages counts 343
   *  declarations at .15s), so on /ask-the-doctor's two-column grid you could
   *  traverse three cards before the first finished fading.
   *
   *  Hover is ADDITIVE now — `hover:shadow-lg hover:ring-black/10` lifting the
   *  card off the page (it already carries shadow-md + ring-black/5), plus the
   *  label bar brightening one step under `group-hover` on the element below.
   *  Both halves are the affordance, so neither may leave without the other.
   *
   *  `height` only belongs in the list for the teaser, and only because of the
   *  ONE declared freeze exception (the <480 card's 288->291, see below) — the
   *  other ~40 cards never change height, so they are out of the layout-
   *  animating set entirely. Where it does apply it runs at the same 200ms as
   *  the text box's own height ladder (:123-127) so the two move as one. */
  const cardTransition = $derived(
    variant === "teaser"
      ? "transition-[height,box-shadow] duration-200 ease-out"
      : "transition-shadow duration-200 ease-out",
  );

  const textBoxClass = $derived(
    variant === "teaser"
      ? "absolute bottom-0 ml-6 w-4/5 pb-3 transition-[height] duration-200 ease-out motion-reduce:transition-none md:ml-8 md:pb-4 lg:ml-10 lg:pb-5 " +
          (expanded
            ? "h-[243px] xs:h-60 md:h-64 lg:h-80"
            : "h-18 md:h-24 lg:h-30")
      : "relative mx-[4%] h-60 pb-3 md:h-64 md:pb-4 lg:h-80 lg:pb-5",
  );
</script>

<!-- Per-card reveal + floatAlong tracking target (`.qa-item`): live raises
     each `.qa-block` as IT enters. -->
<!-- `firstFold` marks the cards that are inside the first viewport on
     /ask-the-doctor (measured: two at 390 and at 1440). Only those get the
     server-rendered hidden state — the other 38 stay JS-hidden, because below
     the fold the flash is nearly unobservable and the trade is not worth
     depending on JS for. -->
<div
  class="qa-item"
  data-reveal={firstFold ? "" : undefined}
  use:animateIn={firstFold ? ABOVE_FOLD_REVEAL : LIVE_REVEAL}
>
  <!-- Not a link: live's .qa-block has no wrapping <a> — only "Read More"
       inside the revealed answer navigates. The WHOLE card is the toggle
       (live's .qa-block carries cursor:pointer); the header-bar <button> stays
       as the semantic disclosure for keyboard/AT, so this div click is a
       pointer convenience only.
       ROUND G2 FREEZE (thread 3d255366-…ef63ef pin #9 second half + operator
       directive — full citation on textBoxClass above): an open card keeps its
       collapsed footprint. Live's active mechanics — the margin-top drop
       (48/64/80, `.qa-block.active`) paired with the label bar riding above
       the card, and the ≤479 re-height 288→384 — are deliberately not
       reproduced: the disappearing headline frees the room instead, so
       neighbours stand still when a card opens. That stillness is the point.
       ONE probed exception (2026-08-11): the <480 TEASER card grows 288→291
       when open — the minimum that clears the two tallest home panels (243px
       need vs 240 room); every other variant × viewport is frozen outright.
       Collapsed ladder unchanged, read off live's `.qa-block` rule: 288 /
       320 (md, measured at the 768 cut) / 400 (lg, 10rem @ the 40px root). -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <!-- Still not overflow-hidden, though nothing protrudes any more now that
       the label bar stays put: the photo and the answer each clip inside
       their own wrappers, and the card box has no third child to contain. -->
  <div
    onclick={(e) => {
      if ((e.target as HTMLElement).closest("a, button")) return;
      toggle();
    }}
    onkeydown={(e) => {
      if (e.key === "Escape" && expanded) toggle();
    }}
    class="group relative block cursor-pointer rounded-[25px] shadow-md ring-1 ring-black/5 hover:shadow-lg hover:ring-black/10 motion-reduce:transition-none {cardTransition} {expanded &&
    variant === 'teaser'
      ? 'h-[291px] xs:h-[288px] md:h-[320px] lg:h-[400px]'
      : 'h-[288px] md:h-[320px] lg:h-[400px]'}"
  >
    <!-- Media + washes clip inside their own rounded box (the card itself
         does not clip). G2 FREEZE: live's `.qa-image.active` radius
         0 0 25 25 no longer applies — it existed because the label bar rode
         above the box and bared the photo's top corners; the bar now stays
         put, so the corners are always covered and the radius is static. -->
    <div class="absolute inset-0 overflow-hidden rounded-[25px]">
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
           when the card opens, deepening the cyan so white answer copy reads.
           450ms/ease-out is not a taste call — it is the answer panel's
           timing (see the panel below); the wash exists to make that copy
           readable, so a slower fade would leave the copy arriving over a
           ground that is still lightening. -->
      <div
        class="absolute inset-0 transition-opacity duration-[450ms] ease-out motion-reduce:transition-none {expanded
          ? 'opacity-100'
          : 'opacity-0'}"
        style="background:linear-gradient(rgba(0,0,0,0), rgba(16,137,177,0.78) 31%, rgba(18,158,204,0.9) 80%)"
        aria-hidden="true"
      ></div>
    </div>
    <!-- Pale header bar — live's `.qa-label`, which is a FLOW child of
         `.qa-block`, not an overlay: `height: 2rem` (beachfront.css:7222-ff)
         against the stepped root = 80 / 64 / 48. G2 FREEZE: live's
         `.qa-label.active` (margin-top:-2rem — the bar riding up ABOVE the
         card) is deliberately not reproduced; the bar stays put as the
         always-visible disclosure toggle, and the answer takes only the room
         below it.
         It is also the half of the hover the eye is meant to land on: the bar
         is the actual control, so it brightens one step (#e7f5fa -> #d9eef7)
         under `group-hover` from the card while the card itself lifts on
         shadow — see cardTransition above for what this replaced. -->
    <button
      type="button"
      aria-expanded={expanded}
      aria-controls={panelId}
      aria-label="{expanded ? 'Collapse' : 'Expand'}: {titleText}"
      onclick={toggle}
      class="focus-visible:ring-primary-deep relative z-10 flex h-12 w-full cursor-pointer items-center justify-between rounded-t-[25px] bg-[#e7f5fa] px-5 transition-colors duration-200 group-hover:bg-[#d9eef7] focus-visible:ring-2 focus-visible:ring-inset focus-visible:outline-hidden motion-reduce:transition-none md:h-16 lg:h-20 lg:px-5"
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
        class="absolute inset-x-0 bottom-3 font-sans text-[1.25rem] leading-[30px] font-medium transition-opacity duration-200 motion-reduce:transition-none md:bottom-4 lg:bottom-5 lg:text-[1.875rem] {variant ===
        'teaser'
          ? 'lg:leading-[45px]'
          : 'lg:leading-[40px]'} {expanded ? 'opacity-0' : 'opacity-100'}"
        style="color:#fff"
      >
        {titleText}
      </h3>
      <!-- `.qa-answer`: excerpt + Read More, translated out of the `.qa-text`
           box until opened. `inert` keeps the clipped link untabbable.
           The collapsed offset is the panel's OWN height plus the box's bottom
           padding, not a magic number: percentages on `translate` resolve
           against the element's border box, so 100% IS the panel whatever the
           answer's length, and the pb-3/4/5 ladder on the box (:123-127) is
           the only other gap between the panel's resting bottom edge and the
           box's. The trailing +1px is deliberate — it parks the panel's top
           one pixel BELOW the clip line so an under-travel leak still fails
           tests/interaction/qa-expand.spec.ts's `top >= box.bottom - 1`.
           This was a flat 400px, which started the panel ~537px below a 183px
           journey: measured 237/246/238ms (home) and 253/253/260ms (atd) at
           1440/834/390 before the answer's first pixel cleared the mask, so a
           third of every open was a blank card. Exact travel over 450ms
           ease-out puts that first pixel on screen within a frame of the
           click. The wash below is retimed to the same 450 so the deepening
           cyan tracks the copy it exists to make readable, and the title fade
           to 200 so the headline is gone before the copy reaches it — the old
           quarter-second of dead travel was what used to hide that overlap. -->
      <div
        id={panelId}
        inert={!expanded}
        class="transition-transform duration-[450ms] ease-out motion-reduce:transition-none {expanded
          ? 'translate-y-0'
          : 'translate-y-[calc(100%+0.75rem+1px)] md:translate-y-[calc(100%+1rem+1px)] lg:translate-y-[calc(100%+1.25rem+1px)]'}"
      >
        <p
          class="text-[16px] leading-[24px] font-light text-white lg:text-[20px] lg:leading-[30px]"
        >
          {teaser}
        </p>
        <a
          href="/questions/{doc.uid}"
          class="{pillClass(
            'white',
          )} mt-[46px] px-[1em] py-[1.3em] text-[15px] leading-[0] md:text-[20px] lg:mt-[36px] lg:text-[25px]"
        >
          Read More
        </a>
      </div>
    </div>
  </div>
</div>
