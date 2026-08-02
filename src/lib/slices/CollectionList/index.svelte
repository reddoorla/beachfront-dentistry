<script lang="ts">
  import { PrismicImage, PrismicRichText } from "@prismicio/svelte";
  import {
    asText,
    type Content,
    type ImageField,
    type RichTextField,
  } from "@prismicio/client";
  import Slider from "$lib/components/Slider.svelte";
  import { animateIn, LIVE_REVEAL } from "$lib/actions/animateIn";
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

  // Live pins an editorial team order (the two doctors first, then staff in a
  // hand-set sequence). getAllByType returns Prismic's default order, so the
  // `team` variation re-sorts its roster to match live. Pinned by uid, ported
  // verbatim from the live home page; docs not listed keep their source order
  // at the end. (TODO: promote to a CMS ordering field once Slice Machine is
  // wired.)
  const TEAM_ORDER = [
    "dr-robert-quan",
    "dr-michael-hopkins",
    "stacey",
    "enrique",
    "alicia",
    "linda",
    "michelle",
    "christina",
    "sabrina",
    "raquel",
    "lanette",
  ];
  const teamRank = (uid: string) => {
    const i = TEAM_ORDER.indexOf(uid);
    return i === -1 ? Number.POSITIVE_INFINITY : i;
  };
  let docs = $derived.by(() => {
    const all =
      context?.collections?.[slice.primary.collection_type ?? ""] ?? [];
    const ordered =
      slice.variation === "team"
        ? [...all].sort((a, b) => teamRank(a.uid) - teamRank(b.uid))
        : all;
    return ordered.slice(0, slice.primary.max_items ?? 24);
  });
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
  <!-- Live team row shows the headshot only at rest, but hovering reveals the
       name over a cyan circle (.primary-on-hover: rgba(18,158,204,0.65), 0.2s
       fade; .rollover-name: museo-slab w700 white uppercase, centered —
       12px/15 mobile, 24px/30 desktop; measured 2026-08-02). The overlay also
       reveals on keyboard focus, and the wrapping link still carries the
       accessible name for AT. -->
  {#if doc.data.media?.url}
    <span class="group relative block">
      <PrismicImage
        field={doc.data.media as unknown as ImageField}
        fallbackAlt=""
        class="mx-auto aspect-square w-full max-w-[12.5rem] rounded-full object-cover object-top"
      />
      <span
        aria-hidden="true"
        class="font-slab absolute inset-0 flex items-center justify-center rounded-full bg-[rgba(18,158,204,0.65)] px-2 text-center text-[12px] leading-[15px] font-bold text-white uppercase opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none lg:text-[24px] lg:leading-[30px]"
      >
        {asText(doc.data.title as RichTextField)}
      </span>
    </span>
  {/if}
{/snippet}

{#if slice.variation === "team"}
  <!-- Circular-avatar carousel (live "Meet Your Team"): a row of headshots on
       the shared Slider (cardsPerView + chevron nav), each linking to its
       team-member detail route. The heading renders as a small eyebrow. -->
  <section
    data-slice-type={slice.slice_type}
    data-slice-variation={slice.variation}
    class="overflow-x-clip pt-0 pb-9 lg:pb-16"
  >
    {#if slice.primary.heading}
      <!-- Eyebrow aligns to the same 80px content-left as live and as the
           headshot row below it (lg:pl-20). Live reveals the eyebrow and the
           headshot row as separate elements, not the section as one block. -->
      <div class="px-5 lg:pl-20" use:animateIn={LIVE_REVEAL}>
        <p
          class="font-slab mb-6 text-[12px] leading-[15px] font-medium tracking-[1.28px] text-[#365b6d] uppercase lg:mb-10 lg:text-[24px] lg:leading-[30px]"
        >
          {asText(slice.primary.heading)}
        </p>
      </div>
    {/if}
    {#if docs.length > 0}
      <!-- Full-bleed row that reaches both screen edges, with live's white
           edge-fade gradients (.heads-opacity-gradient) so the headshots
           dissolve at the margins. Desktop matches live's fixed-cell carousel
           exactly — 200px headshots, 40px gaps, the first flush with the
           content column (80px) while the arrows/fades pin to the true screen
           edges, the 6th clipped at the right edge. Mobile keeps the px-8
           fit-to-container 3-across layout unchanged. -->
      <div class="relative w-full" use:animateIn={LIVE_REVEAL}>
        <Slider
          itemCount={docs.length}
          label={asText(slice.primary.heading) || "Meet the team"}
          itemWidth="200px"
          mobileItemWidth="120px"
          gap="40px"
          mobileGap="24px"
          trackPadStart="80px"
          mobileTrackPadStart="20px"
          showDots={false}
          arrowLayout="sides"
          edgeFadeColor="#fff"
          arrowClass="max-lg:hidden hover:opacity-70 focus-visible:ring-2 focus-visible:ring-primary-deep focus-visible:ring-offset-2 focus-visible:outline-hidden"
        >
          {#snippet prevArrow()}
            <img src="/icons/team-arrow-left.svg" alt="" class="h-10 w-auto" />
          {/snippet}
          {#snippet nextArrow()}
            <img src="/icons/team-arrow-right.svg" alt="" class="h-10 w-auto" />
          {/snippet}
          {#snippet children({ index }: { index: number })}
            {@const doc = docs[index]}
            {#if doc}
              {@const href = hrefFor(doc)}
              <div class="text-center">
                {#if href}
                  <a
                    {href}
                    aria-label={asText(doc.data.title as RichTextField)}
                    class="focus-visible:ring-primary-deep group block rounded-full focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden"
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
      </div>
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
