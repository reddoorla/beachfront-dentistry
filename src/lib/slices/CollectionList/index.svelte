<script lang="ts">
  import { PrismicImage, PrismicRichText } from "@prismicio/svelte";
  import type { Content, ImageField, RichTextField } from "@prismicio/client";

  type CollectionDoc = {
    uid: string;
    // Real Prismic documents (getAllByType/getByUID) carry `type`; test mocks
    // may omit it, in which case the doc renders card-only, same as any
    // other type this slice doesn't recognize (see HREF_PREFIX below).
    type?: string;
    data: {
      title: unknown;
      // Comma-separated string field, not a Prismic tags array — same shape
      // ServiceCategoryBand/QuestionList/the person/collection_item detail
      // routes already read. Doubles as the team grid's Name + role line.
      tags?: string | null;
      media?: { url?: string; alt?: string | null };
    };
  };

  interface Props {
    slice: Content.CollectionListSlice;
    context?: { collections?: Record<string, CollectionDoc[]> };
  }

  let { slice, context }: Props = $props();
  let docs = $derived(
    (context?.collections?.[slice.primary.collection_type ?? ""] ?? []).slice(
      0,
      slice.primary.max_items ?? 24,
    ),
  );
  let listClass = $derived(
    slice.variation === "list"
      ? "flex flex-col gap-6"
      : "grid grid-cols-1 gap-8 md:grid-cols-3",
  );

  // Doc-type → detail-route prefix — mirrors the individual detail routes
  // (services/[slug], questions/[slug], team-members/[slug]) and the same
  // per-type href idiom already in ServiceCategoryBand/QuestionList/
  // BluxCollection. A doc whose `type` isn't in this map (or has none) renders
  // unlinked, same as this slice's card behavior before links existed.
  const HREF_PREFIX: Record<string, string> = {
    person: "/team-members/",
    news_article: "/questions/",
    collection_item: "/services/",
  };

  const hrefFor = (doc: CollectionDoc): string | undefined => {
    const prefix = doc.type ? HREF_PREFIX[doc.type] : undefined;
    return prefix ? `${prefix}${doc.uid}` : undefined;
  };
</script>

{#snippet card(doc: CollectionDoc)}
  <article>
    {#if doc.data.media?.url}
      <PrismicImage
        field={doc.data.media as unknown as ImageField}
        class="mb-3 h-auto w-full rounded"
      />
    {/if}
    <PrismicRichText field={doc.data.title as RichTextField} />
    {#if doc.data.tags}
      <p class="text-secondary mt-1 text-sm">{doc.data.tags}</p>
    {/if}
  </article>
{/snippet}

<section
  data-slice-type={slice.slice_type}
  data-slice-variation={slice.variation}
  class="mx-auto max-w-6xl px-6 py-12"
>
  <PrismicRichText field={slice.primary.heading} />
  <div class="mt-8 {listClass}">
    {#each docs as doc (doc.uid)}
      {@const href = hrefFor(doc)}
      {#if href}
        <a
          {href}
          class="focus-visible:ring-2 focus-visible:ring-primary-deep focus-visible:ring-offset-2 focus-visible:outline-hidden"
        >
          {@render card(doc)}
        </a>
      {:else}
        {@render card(doc)}
      {/if}
    {/each}
  </div>
</section>
