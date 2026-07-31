<script lang="ts">
  import { PrismicImage, PrismicRichText } from "@prismicio/svelte";
  import {
    asText,
    type Content,
    type ImageField,
    type RichTextField,
  } from "@prismicio/client";
  import Slider from "$lib/components/Slider.svelte";
  import { animateIn } from "$lib/actions/animateIn";
  import { ENTITY_ROUTE_PREFIX } from "$lib/blux-catalog/entity-routes";

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

  // The `team` variation isn't in the generated Prismic types yet (regenerating
  // needs a wired Slice Machine session), so widen the union locally — same
  // approach as Hero's band/cta variations. Its primary is identical to the
  // grid/list variations'.
  type TeamVariation = {
    slice_type: "collection_list";
    variation: "team";
    primary: {
      heading?: RichTextField;
      collection_type?: string | null;
      max_items?: number | null;
    };
    items: unknown[];
  };

  interface Props {
    slice: Content.CollectionListSlice | TeamVariation;
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
  // BluxCollection. A doc whose `type` isn't in the shared map (or has none)
  // renders unlinked, same as this slice's card behavior before links existed.
  const hrefFor = (doc: CollectionDoc): string | undefined => {
    const prefix = doc.type ? ENTITY_ROUTE_PREFIX[doc.type] : undefined;
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

{#snippet avatar(doc: CollectionDoc)}
  <!-- Live team row shows the headshot only (name/role live on the detail
       page); the wrapping link carries the accessible name. -->
  {#if doc.data.media?.url}
    <PrismicImage
      field={doc.data.media as unknown as ImageField}
      fallbackAlt=""
      class="mx-auto aspect-square w-full max-w-[12.5rem] rounded-full object-cover transition-transform duration-300 hover:scale-[1.03]"
    />
  {/if}
{/snippet}

{#if slice.variation === "team"}
  <!-- Circular-avatar carousel (live "Meet Your Team"): a row of headshots on
       the shared Slider (cardsPerView + chevron nav), each linking to its
       team-member detail route. The heading renders as a small eyebrow. -->
  <section
    data-slice-type={slice.slice_type}
    data-slice-variation={slice.variation}
    class="mx-auto max-w-7xl px-6 py-16"
    use:animateIn={{ duration: 700, translateY: "2rem" }}
  >
    {#if slice.primary.heading}
      <p
        class="mb-10 text-sm font-bold tracking-[0.2em] text-[#333] uppercase"
      >
        {asText(slice.primary.heading)}
      </p>
    {/if}
    {#if docs.length > 0}
      <Slider
        itemCount={docs.length}
        label={asText(slice.primary.heading) || "Meet the team"}
        cardsPerView={6}
        showDots={false}
        arrowLayout="sides"
        class="px-0 sm:px-10"
        arrowClass="text-primary hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-primary-deep focus-visible:ring-offset-2 focus-visible:outline-hidden"
      >
        {#snippet children({ index }: { index: number })}
          {@const doc = docs[index]}
          {#if doc}
            {@const href = hrefFor(doc)}
            <div class="px-2 text-center">
              {#if href}
                <a
                  {href}
                  aria-label={asText(doc.data.title as RichTextField)}
                  class="block rounded-full focus-visible:ring-2 focus-visible:ring-primary-deep focus-visible:ring-offset-2 focus-visible:outline-hidden"
                >
                  {@render avatar(doc)}
                </a>
              {:else}
                {@render avatar(doc)}
              {/if}
            </div>
          {/if}
        {/snippet}
      </Slider>
    {/if}
  </section>
{:else}
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
{/if}
