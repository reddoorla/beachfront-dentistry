<script lang="ts">
  import { PrismicImage, PrismicRichText } from "@prismicio/svelte";
  import {
    asText,
    isFilled,
    type RichTextField,
    type ImageField,
    type LinkField,
  } from "@prismicio/client";
  import { animateIn, LIVE_REVEAL } from "$lib/actions/animateIn";
  import OutlineButton from "$lib/components/OutlineButton.svelte";

  // your-first-visit `#exam.fv-exam-section` — census §11-13, and the largest
  // gate region on the page. Live's composition is TWO rows inside
  // `.content-width`, not the 2-column grid we had:
  //
  //   row 1  .w-layout-hflex._w-full.mb-4.su-flex-v-tablet.flex-justify-between
  //            div._w-30pc.su-w-60pc-tablet.su-w-full-mobile   h3 + intro p
  //            img._w-60pc.su-w-full-mobile
  //   row 2  .w-layout-hflex._w-full.flex-justify-between.su-flex-v-tablet
  //            div.registration-forms-box        (step 00 + its two buttons)
  //            div.first-exam-step-container     (.exam-step x 6)
  //
  // Both rows are `su-flex-v-tablet` — a COLUMN at <=991 (`beachfront.css:8004`)
  // with `align-items:center` (`._w-full.flex-justify-between.su-flex-v-tablet`
  // `:7886-7888`) — and a row above that (`.w-layout-hflex` `:2056-2060` is
  // `row / flex-start`). The old build merged the intro column with the
  // registration box and hung the six steps off the photo, which is why the
  // section came out 458px short at 834 with the wrong x on every child.
  //
  // Not in the generated Prismic types yet — widen locally.
  type Step = {
    number?: string | null;
    minutes?: string | null;
    title?: RichTextField;
    body?: RichTextField;
  };
  let {
    slice,
  }: {
    slice: {
      slice_type: string;
      variation?: string;
      primary: {
        heading?: RichTextField;
        intro?: RichTextField;
        image?: ImageField;
        book_label?: string | null;
        book_link?: LinkField;
        form_label?: string | null;
        form_link?: LinkField;
      };
      items?: Step[];
    };
  } = $props();

  // items[0] is live's `00 / 15 min / Registration Forms` — the content of the
  // registration box, not a seventh step in the ladder.
  const regStep = $derived(slice.items?.[0]);
  const steps = $derived((slice.items ?? []).slice(1));
  const p = $derived(slice.primary);
</script>

<!-- `.circle-time-holder.mr-2` — a plain BLOCK, not a flex column: the only
     base rule is `.circle-time-holder.p-2` (`beachfront.css:6706-6710`) and the
     markup carries `.mr-2`, so that rule does not match. `.mr-2` is
     `margin-right:.5rem` (`:3941-3943`) = 12 / 16 / 20 and <=479 adds
     `padding-top:.5rem` = 12 (`:9328-9330`).
     `.step-circle` `:6712-6719` is 2rem square, <=991 4rem (`:8252-8255`),
     <=767 3rem (`:8797-8800`), <=479 2rem (`:9332-9335`) -> 48 / 128 / 80.
     `.circle-time-number` `:6722-6727` is 45px/1em, 30px <=767 (`:8802-8804`)
     — the ONLY break is at 767, so the whole 768-991 band renders 45px. -->
{#snippet badge(number: string, minutes?: string | null)}
  <div class="circle-time-holder mr-3 pt-3 xs:pt-0 md:mr-4 lg:mr-5">
    <div
      class="step-circle flex size-12 items-center justify-center rounded-full bg-[#129ecc] xs:size-18 md:size-32 lg:size-20"
    >
      <div
        class="font-slab text-center text-[30px] leading-none font-light md:text-[45px]"
        style="color:#fff"
      >
        {number}
      </div>
    </div>
    {#if minutes}
      <!-- h6 combo: `.text-align-center.font-weight-bold.slab.font-size-24`
           (`beachfront.css:4487-4489`) is 24px, dropping to 12px <=767
           (`:8417-8419`). The <=991 `h6` rule (`:7872-7875`) loses the font-size
           on specificity but WINS the line-height, so the resolved ladder is
           12/15 · 24/15 · 24/30 — the 834 column is genuinely tighter than
           both of its neighbours. `h6` base (`:2154-2164`) carries the 10px
           block margins, 1.28px tracking, uppercase and `--primary-dark`. -->
      <h6
        class="font-slab my-2.5 text-center text-[12px] leading-[15px] font-medium tracking-[1.28px] text-[#365b6d] uppercase md:text-[24px] lg:leading-[30px]"
      >
        {minutes}
      </h6>
    {/if}
  </div>
{/snippet}

<!-- `.exam-content-holder` has no base rule: it is a BLOCK at 1440 and 834 and
     only becomes a flex column at <=767 (`beachfront.css:8806-8811`, `:9337`).
     `h5` is 30/40 at all three widths with 10px block margins; `p.text-body`
     is 20/30 >=992 and 16/24 below (`:7751-7754`, `:8359-8361`). Step 01's h5
     additionally carries `.heading-19`, whose only live effect here is
     `margin-top:0` at <=479 (`:9547-9549`). -->
{#snippet stepContent(step: Step, first: boolean)}
  <div class="exam-content-holder flex min-w-0 flex-col items-start md:block">
    <h5
      class="font-slab mb-2.5 text-[30px] leading-[40px] font-light text-[#129ecc] {first
        ? 'mt-0 xs:mt-2.5'
        : 'mt-2.5'}"
    >
      {asText(step.title as RichTextField)}
    </h5>
    {#if isFilled.richText(step.body)}
      <div
        class="mb-2.5 [&_p]:text-[16px] [&_p]:leading-[24px] [&_p]:font-light [&_p]:text-[#365b6d] lg:[&_p]:text-[20px] lg:[&_p]:leading-[30px]"
      >
        <PrismicRichText field={step.body} />
      </div>
    {/if}
  </div>
{/snippet}

<!-- `#exam.fv-exam-section` `beachfront.css:6642-6645`: `margin-bottom:2rem`
     = 48 / 64 / 80. We had a flat `mb-8` (32px). -->
<section
  data-slice-type={slice.slice_type}
  data-slice-variation={slice.variation}
  id="first-exam"
  class="fv-exam-section mb-12 w-full scroll-mt-24 text-[#365b6d] md:mb-16 lg:mb-20"
>
  <!-- `.content-width`: max-width 1400 centred, padding-x 1.5rem = 60/48/36
       against the stepped root, stepping to 8% <=767 and 5% <=479. Measured
       inner width 351 / 738 / 1280. -->
  <div class="mx-auto max-w-[1400px] px-[5%] xs:px-[8%] md:px-12 lg:px-[60px]">
    <!-- ROW 1 — `.mb-4` is `margin-bottom:1rem` (`beachfront.css:3985-3988`)
         = 24 / 32 / 40. Live reveals this row as one unit (`data-w-id`); the
         second row has none and does not reveal. -->
    <div
      class="mb-6 flex flex-col items-center justify-between md:mb-8 lg:mb-10 lg:flex-row lg:items-start"
      use:animateIn={LIVE_REVEAL}
    >
      <!-- `._w-30pc` (`:3526-3528`) 30%, `.su-w-60pc-tablet` <=991 60%
           (`:7956-7958`), `.su-w-full-mobile` <=767 100% (`:8405-8407`).
           Measured 351 / 443 / 384. The h3's 20px top margin does NOT collapse
           out here — the column is a flex item and therefore a BFC root — so it
           is part of the column's height (270 / 186 / 210). -->
      <div class="w-full md:w-[60%] lg:w-[30%]">
        <!-- cyan by the global main h1–h3 primary rule. `h3` is 40/50 >=992
             (`beachfront.css:2124-2132`) and 21/26 <=991 (`:7863-7866`), with
             the Webflow heading margins `20px 0 10px`. -->
        <h3
          class="font-slab mt-5 mb-2.5 text-[21px] leading-[26px] font-light lg:text-[40px] lg:leading-[50px]"
        >
          {asText(p.heading as RichTextField)}
        </h3>
        {#if isFilled.richText(p.intro)}
          <div
            class="mb-2.5 [&_p]:text-[16px] [&_p]:leading-[24px] [&_p]:font-light [&_p]:text-[#365b6d] lg:[&_p]:text-[20px] lg:[&_p]:leading-[30px]"
          >
            <PrismicRichText field={p.intro} />
          </div>
        {/if}
      </div>

      <!-- `img._w-60pc.su-w-full-mobile` — 60% >=768 (`:3540-3542`), 100%
           <=767 (`:8426-8428`), no object-fit and no fixed aspect: the img is
           `max-width:100%` at its natural aspect. Measured 351x246 / 443x311 /
           768x539. -->
      {#if isFilled.image(p.image)}
        <PrismicImage
          field={p.image}
          fallbackAlt=""
          class="h-auto w-full md:w-[60%]"
        />
      {/if}
    </div>

    <!-- ROW 2 -->
    <div
      class="flex flex-col items-center justify-between lg:flex-row lg:items-start"
    >
      <!-- `.registration-forms-box` `beachfront.css:6693-6704`: 12rem square,
           `padding:1rem`, `margin-bottom:3rem`, radius 25, `--primary-light`,
           and `position:sticky; top:1rem`. <=991 (`:8245-8250`) 20rem x 16rem,
           margin-bottom 2rem and **static**; <=767 (`:8791-8795`) 100% capped
           at 20rem. Resolved 351x384 / 640x512 / 480x480, padding 24/32/40,
           margin-bottom 48/64/120. The sticky exists ONLY at >=992, where it
           pins while the six steps scroll past. -->
      {#if regStep}
        <div
          class="registration-forms-box mb-12 flex h-96 w-full max-w-[480px] justify-start rounded-[25px] bg-[#e7f5fa] p-6 md:mb-16 md:h-[512px] md:w-[640px] md:max-w-none md:p-8 lg:sticky lg:top-10 lg:mb-[120px] lg:h-[480px] lg:w-[480px] lg:p-10"
        >
          {@render badge(regStep.number ?? "00", regStep.minutes)}
          <div
            class="exam-content-holder flex min-w-0 flex-col items-start md:block"
          >
            <h5
              class="font-slab my-2.5 text-[30px] leading-[40px] font-light text-[#129ecc]"
            >
              {asText(regStep.title as RichTextField)}
            </h5>
            {#if isFilled.richText(regStep.body)}
              <div
                class="mb-2.5 [&_p]:text-[16px] [&_p]:leading-[24px] [&_p]:font-light [&_p]:text-[#365b6d] lg:[&_p]:text-[20px] lg:[&_p]:leading-[30px]"
              >
                <PrismicRichText field={regStep.body} />
              </div>
            {/if}
            <!-- Both buttons carry `.mt-2` = `margin-top:.5rem` (`:3901-3903`)
                 = 12 / 16 / 20. Only the second (`.text-color-primary.mt-2
                 .show-form` `:6069-6071`) has a margin-bottom, a flat 20px. -->
            {#if p.form_label}
              <OutlineButton
                label={p.form_label}
                link={p.form_link}
                variant="teal"
                class="mt-3 md:mt-4 lg:mt-5"
              />
            {/if}
            {#if p.book_label}
              <OutlineButton
                label={p.book_label}
                link={p.book_link}
                variant="cyan"
                class="mt-3 mb-5 md:mt-4 lg:mt-5"
              />
            {/if}
          </div>
        </div>
      {/if}

      <!-- `.first-exam-step-container` `beachfront.css:6729-6731` 12rem, <=991
           20rem (`:8257-8259`), <=767 100% capped at 20rem (`:8813-8816`)
           -> 351 / 640 / 480. -->
      <div
        class="first-exam-step-container w-full max-w-[480px] md:w-[640px] md:max-w-none lg:w-[480px]"
      >
        {#each steps as step, i (step.number)}
          <!-- `.exam-step` `beachfront.css:6733-6736`: `padding:1rem 0 0;
               display:flex`. <=991 adds `height:10rem` (`:8261-8263`) — a FIXED
               320px box that exists only in the 480-991 band, so six steps are
               1920px at 834 against 1590px at 1440 for the same copy. <=767
               (`:8818-8826`) goes back to auto height with padding-bottom and
               padding-x 1rem; <=479 (`:9343-9347`) zeroes the top padding and
               halves the sides. -->
          <div
            class="exam-step flex px-3 pt-0 pb-6 xs:px-6 xs:pt-6 md:h-80 md:px-0 md:pt-8 md:pb-0 lg:h-auto lg:pt-10"
          >
            {@render badge(step.number ?? "", step.minutes)}
            {@render stepContent(step, i === 0)}
          </div>
        {/each}
      </div>
    </div>
  </div>
</section>
