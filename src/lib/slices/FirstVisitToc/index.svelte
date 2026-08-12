<script lang="ts">
  import { PrismicRichText } from "@prismicio/svelte";
  import {
    isFilled,
    type RichTextField,
    type LinkField,
  } from "@prismicio/client";
  import { animateIn, ABOVE_FOLD_REVEAL } from "$lib/actions/animateIn";
  import OutlineButton from "$lib/components/OutlineButton.svelte";

  // your-first-visit `.fv-toc-section`: a 2-col opener. LEFT = an intro
  // paragraph (museo-slab 30/45 teal) + two outline buttons (Request Appointment →
  // modal, Registration Form). RIGHT = three numbered `.visit-list-item` nav
  // cards (number 24px teal ls1.92 + h3 title 40px cyan + download-arrow),
  // anchor-linking to the sections below. Not in the generated Prismic types
  // yet — widen locally.
  type NavCard = {
    number?: string | null;
    title?: string | null;
    target?: LinkField | string | null;
  };
  let {
    slice,
  }: {
    slice: {
      slice_type: string;
      variation?: string;
      primary: {
        intro?: RichTextField;
        book_label?: string | null;
        book_link?: LinkField;
        form_label?: string | null;
        form_link?: LinkField;
      };
      items?: NavCard[];
    };
  } = $props();

  const p = $derived(slice.primary);
  const cards = $derived(slice.items ?? []);
  const hrefOf = (t: NavCard["target"]) =>
    typeof t === "string" ? t : undefined;
</script>

{#snippet navCard(card: NavCard)}
  <!-- `.visit-list-item` `beachfront.css:6607-6618`: flex row, align-items
       centre, width 100%, `margin-bottom:1.5rem`, hover opacity .67
       (`:6620-6622`); ≤991 `:8211-8213` drops the margin to `1rem`. Against the
       stepped root that resolves to 60 / 32 / 24 — a THREE-value ladder out of
       two rules, and we had a flat 24.
       `h6.visit-list-number` `:6628-6632` is 24px/1.92px tracking, 20px ≤479
       (`:9297-9299`); the ≤991 `h6` rule (`:7872-7875`) loses the font-size on
       specificity and wins the line-height -> 24/30 · 24/15 · 20/15.
       `h3.px-2.my-0` is 40/50 (`:2124-2132`), 21/26 ≤991 (`:7863-7866`), with
       padding-x `.5rem` = 20/16/12 and no block margin (`.my-0` `:3804-3807`).
       `img.download-icons` `:7806-7808` is `height:100%`, dropping to `1.5rem`
       = 36px at ≤767 (`:9001-9003`). -->
  <a
    href={hrefOf(card.target) ?? "#"}
    class="visit-list-item focus-visible:ring-primary-deep mb-6 flex w-full items-center no-underline transition-opacity hover:opacity-[0.67] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden md:mb-8 lg:mb-[60px]"
  >
    <h6
      class="font-slab text-[20px] leading-[15px] font-bold tracking-[1.92px] text-[#365b6d] uppercase xs:text-[24px] lg:leading-[30px]"
    >
      {card.number}
    </h6>
    <h3
      class="font-slab h-primary-lg px-3 text-[21px] leading-[26px] font-light md:px-4 lg:px-5 lg:text-[40px] lg:leading-[50px]"
    >
      {card.title}
    </h3>
    <img
      src="/icons/download-arrow.svg"
      alt=""
      aria-hidden="true"
      class="ml-auto h-9 w-auto shrink-0 md:h-[50px]"
    />
  </a>
{/snippet}

<!-- Live's space above this section is `.content-width.mt-6` INSIDE it —
     `1.5rem` against the stepped root = 60 / 48 / 36 — and `.fv-toc-section`
     has no padding, so that margin COLLAPSES OUT and the section's border box
     starts 60/48/36 below the hero. We had it as padding-top, which keeps the
     box against the hero. That matters beyond spacing: this section IS the
     "We want you to feel comfortable" anchor, and page-diff cuts on the box, so
     padding-vs-margin was the whole of `top`'s residual height delta
     (10.0 / 7.6 / 8.8%) once the hero ladder was right.
     The BOTTOM margin is the other half of the same rule: `.my-6` on the inner
     flex row (`beachfront.css:3834-3837`) collapses out downwards too, so the
     60/48/36 below this section's border box is live's, not the tour section's
     — the tour section has only `.mb-6` under it. Omitting it left this region
     exactly 60/48/36 short (Δh 10.8 / 9.2 / 7.8%) with the pixels already at
     ~1%. -->
<section
  data-slice-type={slice.slice_type}
  data-slice-variation={slice.variation}
  class="fv-toc-section mt-9 mb-9 w-full md:mt-12 md:mb-12 lg:mt-[60px] lg:mb-[60px]"
>
  <!-- `.content-width` is padding-x 1.5rem = 60/48/36 stepping to 8%/5% below
       768 — `lg:px-20` (80) narrowed the inner row to 1240 where live's is
       1280, and every child inherited the error. -->
  <div class="mx-auto max-w-[1400px] px-[5%] xs:px-[8%] md:px-12 lg:px-[60px]">
    <!-- `.w-layout-hflex.su-flex-v-tablet.my-6.flex-justify-between`
         (`beachfront.css:2056-2060` + `:3008-3011`): a row that becomes a
         COLUMN at ≤991 (`:8004-8006`). Its `my-6` (`:3834-3837`, 60/48/36)
         collapses out of the padding-less `.content-width`, so it does not
         change the section's border box — which is this region's anchor. -->
    <!-- /your-first-visit's first content block, comfortably inside the first
         viewport (measured top=600 @1440) — server-rendered hidden state, same
         as the hero above it. -->
    <div
      data-reveal
      class="flex flex-col justify-between lg:flex-row lg:items-start"
      use:animateIn={ABOVE_FOLD_REVEAL}
    >
      <!-- LEFT is only the lede — `p.text-body-large._w-half.max-w-490px.slab`:
           50% wide capped at 490 (`:2869`, `:7775-7777`), 100% at ≤991
           (`:8216`), museo-slab 30/45 (`:7762-7764`) dropping to 20/30
           (`:8363-8365`), with Webflow's `20px 0 40px` block margins
           (`:7761-7762`; `20px 0 20px` at ≤479, `:9574`). The two buttons are
           NOT here: live keeps them in the right column under the visit list,
           and having them on the left is what left this section 67px short at
           1440 with both columns 36px too narrow.

           MarkUp 4b8d52d2 thread a6fdb602-eefa-4fcc-9760-2470af210a60
           (pin #2): "This should vertically align to the top of the 1, 2, 3
           list on the right. Right now, it's a little low." Requested
           DEVIATION from live: the 20px is `.text-body-large`'s own
           margin-top (`beachfront.css:7761`), and the reference renders the
           same +20 offset (probed tocP 620 vs list 600 on the ref at every
           lg width). `lg:[&_p]:mt-0` zeroes it in the desktop row only; the
           stacked <=991 layout keeps live's margins. See LEDGER 2026-08-10
           A2. -->
      <div
        class="w-full lg:w-1/2 [&_p]:font-slab [&_p]:mt-5 [&_p]:mb-5 [&_p]:max-w-[490px] [&_p]:text-[20px] [&_p]:leading-[30px] [&_p]:font-light [&_p]:text-[#365b6d] xs:[&_p]:mb-10 lg:[&_p]:mt-0 lg:[&_p]:text-[30px] lg:[&_p]:leading-[45px]"
      >
        {#if isFilled.richText(p.intro)}
          <PrismicRichText field={p.intro} />
        {/if}
      </div>

      <!-- RIGHT — `div._w-half.px-4.su-w-full-tablet.su-px-0-tablet`: 50% with
           padding-x `1rem` = 40 at ≥992, 100% with padding-x 0 at ≤991
           (`:7881-7884`). Holds the visit list AND the button pair. -->
      <div class="w-full lg:w-1/2 lg:px-10">
        <div class="flex flex-col items-start">
          {#each cards as card (card.number)}
            {@render navCard(card)}
          {/each}
        </div>
        <!-- §5: an unclassed div holding the two `.button`s. Button 1 carries
             `.mr-4` = `margin-right:1rem` = 40/32/24, and at ≤767
             `.button.text-color-primary-dark` (`:8636-8638`) adds
             `margin-bottom:60px`, which is what wraps the pair to two lines on
             the phone.
             The holder is UNCLASSED, so it keeps live's inherited body type —
             `body{font-size:64px; line-height:1.2em}` (`beachfront.css:2096-2102`)
             — and that 76.8px strut, not the buttons, sets the line-box height:
             the pair measures 167 / 79 / 134 against 133 / 54 / 136 of button.
             Restating it here is the only place on this page where live's
             inherited default is load-bearing. -->
        <div class="text-[64px] leading-[1.2em]">
          {#if p.book_label}
            <OutlineButton
              label={p.book_label}
              link={p.book_link}
              variant="teal"
              class="mr-6 mb-[60px] md:mr-8 md:mb-0 lg:mr-10"
            />
          {/if}
          {#if p.form_label}
            <OutlineButton
              label={p.form_label}
              link={p.form_link}
              variant="cyan"
            />
          {/if}
        </div>
      </div>
    </div>
  </div>
</section>
