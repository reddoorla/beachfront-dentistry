<script lang="ts">
  import { PrismicRichText } from "@prismicio/svelte";
  import { isFilled, type RichTextField, type LinkField } from "@prismicio/client";
  import { animateIn, LIVE_REVEAL } from "$lib/actions/animateIn";
  import OutlineButton from "$lib/components/OutlineButton.svelte";

  // your-first-visit `.fv-toc-section`: a 2-col opener. LEFT = an intro
  // paragraph (museo-slab 30/45 teal) + two outline buttons (Book Appointment →
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
  <!-- `.visit-list-item`: flex row, hover opacity .67, 1.5rem below. -->
  <a
    href={hrefOf(card.target) ?? "#"}
    class="visit-list-item mb-6 flex w-full items-center gap-3 no-underline transition-opacity hover:opacity-[0.67] focus-visible:outline-hidden"
  >
    <span
      class="font-slab text-[20px] leading-[30px] font-bold tracking-[1.92px] text-[#365b6d] lg:text-[24px]"
      >{card.number}</span
    >
    <h3
      class="font-slab px-2 text-[24px] leading-[32px] font-light text-[#129ecc] lg:text-[40px] lg:leading-[50px]"
    >
      {card.title}
    </h3>
    <img
      src="/icons/download-arrow.svg"
      alt=""
      aria-hidden="true"
      class="ml-auto size-[50px] shrink-0"
    />
  </a>
{/snippet}

<section
  data-slice-type={slice.slice_type}
  data-slice-variation={slice.variation}
  class="fv-toc-section w-full pt-9 lg:pt-[60px]"
>
  <div class="mx-auto max-w-[1400px] px-5 lg:px-20">
    <div class="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-8">
      <!-- LEFT: intro + buttons. Live pins the two buttons near the section
           bottom (y≈947 in a 497px section), so the column reserves height and
           pushes them down with mt-auto. -->
      <div class="flex flex-col lg:min-h-[430px]" use:animateIn={LIVE_REVEAL}>
        {#if isFilled.richText(p.intro)}
          <div
            class="max-w-[490px] [&_p]:font-slab [&_p]:text-[20px] [&_p]:leading-[30px] [&_p]:font-light [&_p]:text-[#365b6d] lg:[&_p]:text-[30px] lg:[&_p]:leading-[45px]"
          >
            <PrismicRichText field={p.intro} />
          </div>
        {/if}
        <div class="mt-10 flex flex-col items-start gap-4 lg:mt-auto lg:pt-8">
          {#if p.book_label}
            <OutlineButton
              label={p.book_label}
              link={p.book_link}
              variant="teal"
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

      <!-- RIGHT: numbered nav cards -->
      <div use:animateIn={LIVE_REVEAL}>
        {#each cards as card (card.number)}
          {@render navCard(card)}
        {/each}
      </div>
    </div>
  </div>
</section>
