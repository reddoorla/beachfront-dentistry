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
  import { Plus } from "@lucide/svelte";

  // QuestionListSlice/QuestionListSliceVariation aren't in the generated
  // Prismic types yet — this is a brand-new slice, and regenerating needs a
  // wired Slice Machine session (same situation Carousel's review/photos
  // variations are in), so the slice + doc shapes are widened locally here.
  type NewsArticleDoc = {
    uid: string;
    data: {
      title?: RichTextField;
      body?: RichTextField;
      media?: ImageField;
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

  // collections-load fetches via a plain `getAllByType` with no ordering, so the
  // slice sorts itself — newest first. This date order is the site's canonical
  // Ask-the-Doctor numbering: a question's 1-based position here is the number
  // live prints on its card (verified: 07/09/16/30/33 match live exactly).
  let sortedDocs = $derived(
    [...(context?.collections?.news_article ?? [])].sort((a, b) =>
      String(b.data.date ?? "").localeCompare(String(a.data.date ?? "")),
    ),
  );

  // Canonical card number = 1-based position in the full date-sorted catalog.
  let canonicalNumber = $derived(
    new Map(sortedDocs.map((doc, i) => [doc.uid, i + 1])),
  );

  // The home teaser is an editorial pick, not "newest N": live features one hero
  // question (no number) then five specific ones, each showing its catalog
  // number. Webflow stored that as a "featured" flag; the import didn't capture
  // it and the news_article model has no such field, so the selection is pinned
  // here by uid, ported verbatim from the live home page. (TODO: promote to a
  // CMS field once Slice Machine is wired.) Other sites reusing this slice fall
  // back to newest-N below.
  const FEATURED_UID = "regular-dental-cleanings-support-your-whole-body-health";
  const CURATED_UIDS = [
    "best-routine-for-my-dental-health",
    "do-teeth-turn-yellow-as-you-age",
    "creating-perfect-smiles-artistry-or-science",
    "tooth-broke-off",
    "why-does-my-tooth-hurt-when-i-bite-down",
  ];

  // Each teaser card carries its doc + the number to print (null = hero card).
  let teaserCards = $derived.by(() => {
    const byUid = new Map(sortedDocs.map((doc) => [doc.uid, doc]));
    const cards: { doc: NewsArticleDoc; number: number | null }[] = [];
    const featured = byUid.get(FEATURED_UID);
    if (featured) cards.push({ doc: featured, number: null });
    for (const uid of CURATED_UIDS) {
      const doc = byUid.get(uid);
      if (doc) cards.push({ doc, number: canonicalNumber.get(uid) ?? null });
    }
    // Fallback for other sites / missing curated docs: newest N, hero first.
    if (cards.length <= 1) {
      const n = isFilled.number(slice.primary.max_items)
        ? slice.primary.max_items
        : sortedDocs.length;
      return sortedDocs
        .slice(0, n)
        .map((doc, i) => ({ doc, number: i === 0 ? null : i + 1 }));
    }
    return cards;
  });
</script>

{#if slice.variation === "teaser"}
  <!-- Live "Ask the Doctor": a centered column of question cards — a pale
       header bar (circled number + "+") over a cyan-tinted question photo with
       the title in white — a cursive "ask the doctor" annotation to the left,
       and the doctor headshot floating down the right edge tracking the topmost
       card. The first card is featured (no number header). -->
  <section
    data-slice-type={slice.slice_type}
    data-slice-variation={slice.variation}
    class="relative mx-auto max-w-4xl px-6 py-20"
    use:animateIn={{ duration: 700, translateY: "2rem" }}
  >
    {#if isFilled.richText(slice.primary.heading)}
      <span
        class="text-dark pointer-events-none absolute top-16 left-2 z-10 hidden -rotate-6 text-2xl lg:inline-block"
        style="font-family:'Caveat','Bradley Hand','Segoe Print',cursive"
        aria-hidden="true"
      >
        {asText(slice.primary.heading).toLowerCase()} ↳
      </span>
    {/if}

    <div class="relative mx-auto max-w-xl">
      {#if isFilled.image(slice.primary.side_image)}
        <!-- Floats along to track the topmost visible .qa-item as the column
             scrolls (ports floating-doc.js). -->
        <div
          use:floatAlong={{ itemSelector: ".qa-item" }}
          class="pointer-events-none absolute top-0 -right-24 z-10 hidden w-36 lg:block xl:-right-40 xl:w-44"
        >
          <PrismicImage
            field={slice.primary.side_image}
            fallbackAlt=""
            class="aspect-square w-full rounded-full object-cover shadow-lg"
          />
        </div>
      {/if}

      <ul class="flex flex-col gap-8">
        {#each teaserCards as card (card.doc.uid)}
          {@const doc = card.doc}
          <li class="qa-item">
            <a
              href="/questions/{doc.uid}"
              class="focus-visible:ring-primary-deep group block overflow-hidden rounded-2xl shadow-md ring-1 ring-black/5 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden"
            >
              {#if card.number !== null}
                <div
                  class="bg-primary/5 flex items-center justify-between px-6 py-3"
                >
                  <span
                    class="text-dark grid size-9 place-items-center rounded-full text-sm font-semibold ring-1 ring-black/15"
                    >{pad2(card.number)}</span
                  >
                  <Plus class="text-primary" size={24} aria-hidden="true" />
                </div>
              {/if}
              <div class="relative">
                {#if isFilled.image(doc.data.media)}
                  <PrismicImage
                    field={doc.data.media}
                    fallbackAlt=""
                    class="aspect-[16/9] w-full object-cover"
                  />
                {:else}
                  <div class="from-primary to-accent aspect-[16/9] w-full bg-gradient-to-br"></div>
                {/if}
                <!-- Cyan wash: the live cards tint every photo toward the brand
                     hue — lighter at the top so the image shows through, deeper
                     at the bottom so the white title reads. -->
                <div
                  class="from-primary/25 to-primary/80 absolute inset-0 bg-gradient-to-b"
                  aria-hidden="true"
                ></div>
                <!-- Inline colour: the unlayered global `main h1–h3` primary
                     rule outranks any Tailwind text utility, so white is set
                     inline to win over it. -->
                <h3
                  class="absolute inset-x-6 bottom-5 text-[1.875rem] leading-tight font-medium"
                  style="color:#fff"
                >
                  {titleText(doc)}
                </h3>
              </div>
            </a>
          </li>
        {/each}
      </ul>

      <div class="mt-12 text-center">
        <a
          href="/ask-the-doctor"
          class="text-dark hover:border-primary hover:text-primary-deep focus-visible:ring-primary-deep inline-block rounded-full border border-black/15 px-8 py-3 font-light transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden"
        >
          View All Questions
        </a>
      </div>
    </div>
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
