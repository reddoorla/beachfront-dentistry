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

  // your-first-visit `.fv-exam-section`: a 2-col numbered timeline. LEFT = h3
  // "First Exam" + intro + step 00 (Registration, centred badge) + two outline
  // buttons; RIGHT = the DSC_7704 photo then steps 01-06 stacked, each an
  // `.exam-step` row = a cyan circle badge (white number 45px + "N min") beside
  // the step's title (h5 cyan 30px) and paragraph (teal 20/30). Not in the
  // generated Prismic types yet — widen locally.
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

  const steps = $derived(slice.items ?? []);
  const p = $derived(slice.primary);
</script>

{#snippet badge(number: string, minutes?: string | null)}
  <div class="flex flex-col items-center">
    <!-- `.step-circle`: an 80px cyan disc with the white step number (45px). -->
    <div
      class="flex size-20 shrink-0 items-center justify-center rounded-full bg-[#129ecc]"
    >
      <span class="font-slab text-[45px] leading-none font-light" style="color:#fff"
        >{number}</span
      >
    </div>
    {#if minutes}
      <span
        class="font-slab mt-2 text-center text-[24px] leading-[30px] font-normal text-[#365b6d]"
        >{minutes}</span
      >
    {/if}
  </div>
{/snippet}

{#snippet stepBody(step: Step, center: boolean)}
  <div class="flex flex-col {center ? 'items-center text-center' : 'items-start text-left'}">
    <h5 class="font-slab text-[30px] leading-[40px] font-light text-[#129ecc]">
      {asText(step.title as RichTextField)}
    </h5>
    {#if isFilled.richText(step.body)}
      <div
        class="mt-1 [&_p]:text-[20px] [&_p]:leading-[30px] [&_p]:font-light [&_p]:text-[#365b6d]"
      >
        <PrismicRichText field={step.body} />
      </div>
    {/if}
  </div>
{/snippet}

<section
  data-slice-type={slice.slice_type}
  data-slice-variation={slice.variation}
  id="first-exam"
  class="fv-exam-section mb-8 w-full scroll-mt-24 text-[#365b6d]"
>
  <div class="mx-auto max-w-[1400px] px-5 lg:px-20">
    <div class="grid grid-cols-1 gap-10 lg:grid-cols-[480px_1fr] lg:gap-8">
      <!-- LEFT: heading + intro + step 00 + buttons -->
      <div class="flex flex-col" use:animateIn={LIVE_REVEAL}>
        <!-- cyan by the global main h1–h3 primary rule. -->
        <h3 class="font-slab text-[40px] leading-[50px] font-light">
          {asText(p.heading as RichTextField)}
        </h3>
        {#if isFilled.richText(p.intro)}
          <div
            class="mt-4 [&_p]:text-[20px] [&_p]:leading-[30px] [&_p]:font-light [&_p]:text-[#365b6d]"
          >
            <PrismicRichText field={p.intro} />
          </div>
        {/if}
        {#if steps[0]}
          <div class="mt-10 flex flex-col items-center">
            {@render badge(steps[0].number ?? "00", steps[0].minutes)}
            <div class="mt-4">{@render stepBody(steps[0], true)}</div>
          </div>
        {/if}
        <div class="mt-8 flex flex-wrap justify-center gap-4">
          {#if p.form_label}
            <OutlineButton
              label={p.form_label}
              link={p.form_link}
              variant="teal"
            />
          {/if}
          {#if p.book_label}
            <OutlineButton
              label={p.book_label}
              link={p.book_link}
              variant="cyan"
            />
          {/if}
        </div>
      </div>

      <!-- RIGHT: photo then steps 01-06 -->
      <div class="flex flex-col" use:animateIn={LIVE_REVEAL}>
        {#if isFilled.image(p.image)}
          <!-- live's DSC_7704 is 768×539 at the top of the right column; a
               fixed aspect box reserves that height even when the dev CSP
               blocks the webflow-CDN source. -->
          <PrismicImage
            field={p.image}
            fallbackAlt=""
            class="aspect-[768/539] w-full object-cover"
          />
        {/if}
        <div class="mt-8 ml-auto flex w-full max-w-[480px] flex-col gap-4">
          {#each steps.slice(1) as step (step.number)}
            <!-- live `.exam-step` is a 10rem-min flex row (badge + content). -->
            <div class="flex items-start gap-4 py-4 lg:min-h-[10rem]">
              {@render badge(step.number ?? "", step.minutes)}
              <div class="flex-1">{@render stepBody(step, false)}</div>
            </div>
          {/each}
        </div>
      </div>
    </div>
  </div>
</section>
