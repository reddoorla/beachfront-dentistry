<script lang="ts">
  import { PrismicRichText } from "@prismicio/svelte";
  import { asText, isFilled, type RichTextField } from "@prismicio/client";
  import { animateIn, LIVE_REVEAL } from "$lib/actions/animateIn";

  // ServiceCategoryBandSlice isn't in the generated Prismic types yet — same
  // situation as QuestionList: brand-new slice, regenerating needs a wired
  // Slice Machine session, so the slice + doc shapes are widened locally.
  type CollectionItemDoc = {
    uid: string;
    data: {
      title?: RichTextField;
      tags?: string | null;
    };
  };
  // One category card in the `grid` variation.
  type Category = {
    category_tag?: string | null;
    heading?: RichTextField;
    intro?: RichTextField;
  };

  interface Props {
    slice: {
      slice_type: string;
      variation?: string;
      primary: {
        category_tag?: string | null;
        heading?: RichTextField;
        intro?: RichTextField;
      };
      items?: Category[];
    };
    context?: { collections?: Record<string, CollectionItemDoc[]> };
  }

  let { slice, context }: Props = $props();

  const titleText = (doc: CollectionItemDoc): string =>
    asText((doc.data.title ?? []) as RichTextField);

  // The tags field is a comma-separated STRING on collection_item docs (e.g.
  // "Cosmetic Dentistry" or "General Dentistry, Specialty Services"), not a
  // Prismic tags array — split/trim it into a parsed list per doc.
  const docsFor = (tag?: string | null): CollectionItemDoc[] =>
    (context?.collections?.collection_item ?? []).filter((doc) =>
      (doc.data.tags ?? "")
        .split(",")
        .map((t) => t.trim())
        .includes(tag ?? ""),
    );

  // default variation still shows one category's matching docs.
  let matchingDocs = $derived(docsFor(slice.primary.category_tag));

  const categories = $derived(slice.items ?? []);

  // Live splits a card's links into two `._w-half` columns that stack
  // VERTICALLY (not 2-per-row): a 4-link card is 4+0 (col2 empty), a 9-link
  // card is 5+4 — i.e. col1 fills first (≤4 all in col1), overflow → col2.
  const splitCols = (docs: CollectionItemDoc[]) => {
    const n = docs.length;
    const cut = n <= 4 ? n : Math.ceil(n / 2);
    return [docs.slice(0, cut), docs.slice(cut)];
  };
</script>

{#if slice.variation === "grid"}
  <!-- live /services `.service-blocks-section`: a centered cyan intro (the
       `.we-offer-section`) over the `.service-grid` — a 2-col grid (1-col at
       mobile) of `.service-block` cards, each a tinted rounded box with a
       heading + intro over a cyan link panel, and a tooth icon straddling the
       top-right. -->
  <section
    data-slice-type={slice.slice_type}
    data-slice-variation={slice.variation}
    class="mx-auto max-w-[1400px] px-[5%] md:px-9 lg:px-[60px]"
  >
    {#if isFilled.richText(slice.primary.intro)}
      <!-- `.we-offer-section`: centered cyan slab intro, capped ~620px. -->
      <div
        class="mx-auto my-8 max-w-[620px] text-center font-slab text-[20px] leading-[30px] font-light text-[#129ecc] lg:mb-10 lg:text-[30px] lg:leading-[45px] [&_p]:text-[20px] [&_p]:lg:text-[30px]"
        use:animateIn={LIVE_REVEAL}
      >
        <PrismicRichText field={slice.primary.intro} />
      </div>
    {/if}

    <!-- 2-col grid. Live centers 600×640 cards in 800px row tracks: 160px
         visible gutter BETWEEN rows (gap-y) + 80px of slack above the first
         row and below the last. Mobile: 408px cards in 504px tracks → 96px
         between + 48px top/bottom. gap-y covers the inter-row gutter; the
         edge slack is the container's own py (py-12=48 / lg:py-20=80). -->
    <div
      class="grid grid-cols-1 justify-items-center gap-y-[96px] py-12 md:grid-cols-2 lg:gap-y-[160px] lg:py-20"
    >
      {#each categories as cat (asText((cat.heading ?? []) as RichTextField))}
        {@const [col1, col2] = splitCols(docsFor(cat.category_tag))}
        <article
          class="service-block relative h-[408px] w-full max-w-[312px] rounded-[25px] bg-[#e7f5fa] lg:h-[640px] lg:max-w-[600px]"
          use:animateIn={LIVE_REVEAL}
        >
          <!-- Tooth icon straddling the top-right edge (live `.service-block-teef`,
               real downloaded asset). -->
          <img
            src="/icons/service-tooth.svg"
            alt=""
            aria-hidden="true"
            class="pointer-events-none absolute -top-[30px] right-9 z-10 size-[60px] lg:-top-[50px] lg:right-[60px] lg:size-[100px]"
          />

          <!-- Top 60%: heading (light cyan slab) + intro (slate), left-aligned. -->
          <div class="h-[60%] text-left">
            <div class="mx-[18px] mt-12 lg:mx-[30px] lg:mt-20">
              <div
                class="mb-6 lg:mb-10 [&_h3]:font-slab [&_h3]:text-[21px] [&_h3]:leading-[26px] [&_h3]:font-light [&_h3]:text-[#129ecc] lg:[&_h3]:text-[40px] lg:[&_h3]:leading-[50px]"
              >
                <PrismicRichText field={(cat.heading ?? []) as RichTextField} />
              </div>
              {#if isFilled.richText(cat.intro)}
                <div
                  class="pr-6 lg:pr-10 [&_p]:text-[13px] [&_p]:leading-[19.5px] [&_p]:font-light [&_p]:text-[#365b6d] lg:[&_p]:text-[20px] lg:[&_p]:leading-[30px]"
                >
                  <PrismicRichText field={cat.intro} />
                </div>
              {/if}
            </div>
          </div>

          <!-- Bottom 40%: cyan link panel with the live dark-gradient-up wash;
               two columns of vertically-stacked uppercase slab links. -->
          <div
            class="relative h-[40%] overflow-hidden rounded-b-[25px] px-[6px] lg:px-[10px]"
            style="background:linear-gradient(#129ecc 40%, rgba(54,91,109,0.57))"
          >
            <div class="flex h-full">
              {#each [col1, col2] as col}
                <ul class="w-1/2 pt-3 pl-3 lg:pt-5 lg:pl-5">
                  {#each col as doc (doc.uid)}
                    <li>
                      <a
                        href="/services/{doc.uid}"
                        class="focus-visible:ring-primary-deep flex items-center gap-1 font-slab text-[7px] leading-[19.25px] font-bold tracking-[1.28px] text-white uppercase underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:outline-hidden lg:text-[14px] lg:leading-[38.5px]"
                      >
                        <span>{titleText(doc)}</span>
                        <svg
                          class="w-[10px] shrink-0"
                          viewBox="0 0 10 11"
                          fill="none"
                          aria-hidden="true"
                          ><path
                            d="M1 5.5h7M5 2l3 3.5L5 9"
                            stroke="currentColor"
                            stroke-width="1.2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          /></svg
                        >
                      </a>
                    </li>
                  {/each}
                </ul>
              {/each}
            </div>
          </div>
        </article>
      {/each}
    </div>
  </section>
{:else}
  <section
    data-slice-type={slice.slice_type}
    data-slice-variation={slice.variation}
    class="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-6 py-16 md:grid-cols-2 md:items-start"
  >
    <div>
      {#if isFilled.richText(slice.primary.heading)}
        <PrismicRichText field={slice.primary.heading} />
      {/if}
      {#if isFilled.richText(slice.primary.intro)}
        <div class="mt-4">
          <PrismicRichText field={slice.primary.intro} />
        </div>
      {/if}
    </div>

    <div
      class="bg-primary-deep relative overflow-hidden rounded-lg p-8 md:p-10"
    >
      <div
        class="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20"
        aria-hidden="true"
      ></div>
      <ul class="relative z-10 flex flex-col gap-4">
        {#each matchingDocs as doc (doc.uid)}
          <li>
            <a
              href="/services/{doc.uid}"
              class="focus-visible:ring-offset-primary-deep flex items-center justify-between gap-3 font-semibold text-white underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:outline-hidden"
            >
              <span>{titleText(doc)}</span>
              <span aria-hidden="true">→</span>
            </a>
          </li>
        {/each}
      </ul>
    </div>
  </section>
{/if}
