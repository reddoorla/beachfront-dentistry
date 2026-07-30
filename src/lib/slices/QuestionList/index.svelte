<script lang="ts">
  import { PrismicImage, PrismicRichText } from "@prismicio/svelte";
  import {
    asText,
    isFilled,
    type ImageField,
    type RichTextField,
  } from "@prismicio/client";
  import { floatAlong } from "$lib/actions/floatAlong";
  import { animateIn } from "$lib/actions/animateIn";

  // QuestionListSlice/QuestionListSliceVariation aren't in the generated
  // Prismic types yet — this is a brand-new slice, and regenerating needs a
  // wired Slice Machine session (same situation Carousel's review/photos
  // variations are in), so the slice + doc shapes are widened locally here.
  type NewsArticleDoc = {
    uid: string;
    data: {
      title?: RichTextField;
      body?: RichTextField;
      date?: string | null;
    };
  };

  interface Props {
    slice: {
      slice_type: string;
      variation?: string;
      primary: {
        heading?: RichTextField;
        side_image?: ImageField;
        max_items?: number | null;
      };
    };
    context?: { collections?: Record<string, NewsArticleDoc[]> };
  }

  let { slice, context }: Props = $props();

  const titleText = (doc: NewsArticleDoc): string =>
    asText((doc.data.title ?? []) as RichTextField);

  // "Lead paragraph" = the first paragraph-type node in the rich-text body;
  // the numbered list's collapsed-body teaser and the full answer live on
  // the future /questions/<uid> detail page.
  const leadParagraphText = (doc: NewsArticleDoc): string => {
    const nodes = (doc.data.body ?? []) as RichTextField;
    const lead = nodes.find((node) => node.type === "paragraph");
    return lead ? asText([lead] as RichTextField) : "";
  };

  const pad2 = (n: number): string => String(n).padStart(2, "0");

  // collections-load.ts fetches via a plain `getAllByType` with no ordering,
  // so the slice sorts itself — newest first, matching the live site's
  // Ask-the-Doctor listing order (BluxCollection's date-sort idiom).
  let sortedDocs = $derived(
    [...(context?.collections?.news_article ?? [])].sort((a, b) =>
      String(b.data.date ?? "").localeCompare(String(a.data.date ?? "")),
    ),
  );

  let teaserDocs = $derived(
    isFilled.number(slice.primary.max_items)
      ? sortedDocs.slice(0, slice.primary.max_items)
      : sortedDocs,
  );
</script>

{#if slice.variation === "teaser"}
  <section
    data-slice-type={slice.slice_type}
    data-slice-variation={slice.variation}
    class="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-6 py-16 md:grid-cols-2"
    use:animateIn={{ duration: 700, translateY: "2rem" }}
  >
    <div>
      {#if isFilled.richText(slice.primary.heading)}
        <PrismicRichText field={slice.primary.heading} />
      {/if}
      <ul class="mt-6 flex flex-col gap-4">
        {#each teaserDocs as doc (doc.uid)}
          <li class="qa-item">
            <a
              href="/questions/{doc.uid}"
              class="font-semibold underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-primary-deep focus-visible:ring-offset-2 focus-visible:outline-hidden"
            >
              {titleText(doc)}
            </a>
          </li>
        {/each}
      </ul>
    </div>
    {#if isFilled.image(slice.primary.side_image)}
      <!-- Decorative doctor image: floats along to track the topmost visible
           .qa-item as the question list scrolls (ports floating-doc.js). -->
      <div use:floatAlong={{ itemSelector: ".qa-item" }}>
        <PrismicImage
          field={slice.primary.side_image}
          fallbackAlt=""
          class="h-auto w-full"
        />
      </div>
    {/if}
  </section>
{:else if slice.variation === "numbered"}
  <section
    data-slice-type={slice.slice_type}
    data-slice-variation={slice.variation}
    class="mx-auto max-w-3xl px-6 py-16"
    use:animateIn={{ duration: 700, translateY: "2rem" }}
  >
    {#if isFilled.richText(slice.primary.heading)}
      <PrismicRichText field={slice.primary.heading} />
    {/if}
    <div class="divide-light mt-8 flex flex-col divide-y">
      {#each sortedDocs as doc, i (doc.uid)}
        <details class="qa-item group py-4">
          <summary
            class="[&::-webkit-details-marker]:hidden flex cursor-pointer list-none items-baseline gap-3 font-semibold focus-visible:ring-2 focus-visible:ring-primary-deep focus-visible:ring-offset-2 focus-visible:outline-hidden"
          >
            <span class="text-secondary" aria-hidden="true">{pad2(i + 1)}</span>
            <span>{titleText(doc)}</span>
            <span class="ml-auto" aria-hidden="true">
              <span class="hidden group-open:inline">−</span>
              <span class="inline group-open:hidden">+</span>
            </span>
          </summary>
          <div class="mt-3 pl-9">
            <p>{leadParagraphText(doc)}</p>
            <a
              href="/questions/{doc.uid}"
              class="mt-2 inline-block underline focus-visible:ring-2 focus-visible:ring-primary-deep focus-visible:ring-offset-2 focus-visible:outline-hidden"
            >
              Read the full answer
            </a>
          </div>
        </details>
      {/each}
    </div>
  </section>
{/if}
