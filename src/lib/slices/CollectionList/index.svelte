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
      // person docs carry a bio (`body`) and a favorite-beach `gallery` group
      // (image + caption) — the `people` variation's teaser + bottom banner.
      body?: RichTextField;
      // authored card excerpt (person.teaser) and editorial roster position
      // (person.order) — see `teamRank` and the personCard snippet.
      teaser?: string | null;
      order?: number | null;
      gallery?: {
        image?: { url?: string; alt?: string | null };
        caption?: string | null;
      }[];
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
      // `people`: "grid" (default, /our-team) or "slider" (your-first-visit's
      // Meet-Our-Team horizontal person-card slider under a big cyan heading).
      layout?: string | null;
    };
    items: unknown[];
  };
  // `people` = the /our-team full person-card grid (headshot / name / role /
  // bio teaser / read-more / favorite-beach banner). Same primary as `team`.
  type PeopleVariation = Omit<TeamVariation, "variation"> & {
    variation: "people";
  };

  interface Props {
    slice: Content.CollectionListSlice | TeamVariation | PeopleVariation;
    context?: { collections?: Record<string, CollectionDoc[]> };
  }

  let { slice, context }: Props = $props();

  // The roster order is editorial (the two doctors first, then staff in a
  // hand-set sequence) and getAllByType returns Prismic's own document order,
  // so the `team`/`people` variations sort on the authored `order` field. A
  // doc with no order keeps its source position, at the end.
  const teamRank = (doc: CollectionDoc) =>
    typeof doc.data.order === "number"
      ? doc.data.order
      : Number.POSITIVE_INFINITY;
  let docs = $derived.by(() => {
    const all =
      context?.collections?.[slice.primary.collection_type ?? ""] ?? [];
    const ordered =
      slice.variation === "team" || slice.variation === "people"
        ? [...all].sort((a, b) => teamRank(a) - teamRank(b))
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
        class="font-slab absolute inset-0 flex items-center justify-center rounded-full bg-[rgba(18,158,204,0.65)] px-2 text-center text-[12px] leading-[15px] font-bold tracking-[1.28px] text-white uppercase opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none lg:text-[24px] lg:leading-[30px]"
      >
        {asText(doc.data.title as RichTextField)}
      </span>
    </span>
  {/if}
{/snippet}

{#snippet personCard(doc: CollectionDoc, tabletTiers = true)}
  <!-- live `.team-list-item` (320×480 / 303×384, bg #E7F5FA, radius 20): a
       circular headshot straddling the top edge, then name (cyan slab) / role
       (teal sans caps) / bio teaser (teal, 3-line clamp) / READ MORE, with the
       favorite-beach banner + white caption pinned across the card bottom. -->
  {@const href = hrefFor(doc)}
  {@const name = asText(doc.data.title as RichTextField)}
  <!-- The card excerpt is AUTHORED (`person.teaser`), not a clamp of the bio:
       9 of live's 11 teasers are a prefix of the body but every cut point is
       different, and 2 don't match the body at all. Read it from the doc; a
       person whose teaser an author hasn't filled falls back to the bio. -->
  {@const bio =
    doc.data.teaser?.trim() || asText((doc.data.body ?? []) as RichTextField)}
  {@const beach = doc.data.gallery?.[0]}
  <!-- Live's `.team-list-item` is sized in REM against its stepped root
       (24/32/40), so the real ladder is four tiers, not two:
         <=479    303x384   mt 96   mx 24 mb 24   (already matched)
         480-767  384x576   mt 192  mx 24 mb 24   (root 24)   <- was missing
         768-991  512x768   mt 256  mx 32 mb 32   (root 32)   <- was missing
         >=992    320x480   mt 160  mx 20 mb 20   (root 40, desktop 3-up)
       The 480-991 half was rendering the MOBILE card, which packed two cards
       per row where live shows one and left the our-team grid 61% short.
       NB the yfv Meet-Our-Team SLIDER uses a different ladder (240x432 at
       <=479) — do not copy one onto the other; that regressed /our-team @390
       from 5.2% to 33% before it was caught. -->
  <article
    class="team-list-item relative mx-6 mt-24 mb-6 h-96 w-[303px] rounded-[20px] bg-[#e7f5fa] lg:mx-5 lg:mt-40 lg:mb-5 lg:h-[480px] lg:w-80 {tabletTiers
      ? 'xs:mt-[192px] xs:h-[576px] xs:w-[384px] md:mx-8 md:mt-[256px] md:mb-8 md:h-[768px] md:w-[512px]'
      : ''}"
  >
    {#if doc.data.media?.url}
      <!-- headshot centred ON the card's top edge (half above, half in). -->
      <a
        {href}
        aria-label={name}
        class="focus-visible:ring-primary-deep absolute top-0 left-1/2 z-10 block w-[120px] -translate-x-1/2 -translate-y-1/2 rounded-full lg:w-[200px] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden {tabletTiers
          ? 'xs:w-[240px] md:w-[320px]'
          : ''}"
      >
        <PrismicImage
          field={doc.data.media as unknown as ImageField}
          fallbackAlt=""
          class="size-[120px] max-w-none rounded-full object-cover object-top lg:size-[200px] {tabletTiers
            ? 'xs:size-[240px] md:size-[320px]'
            : ''}"
        />
      </a>
    {/if}
    <div
      class="flex h-full flex-col px-[18px] pt-[70px] text-center lg:px-6 lg:pt-[110px] {tabletTiers
        ? 'xs:pt-[130px] md:pt-[170px]'
        : ''}"
    >
      <a {href} class="focus-visible:outline-hidden">
        <h5
          class="font-slab text-[30px] leading-[40px] font-light text-[#129ecc]"
        >
          {name}
        </h5>
      </a>
      {#if doc.data.tags}
        <h6
          class="mt-[10px] text-[16px] leading-[25px] font-light tracking-[1.28px] text-[#365b6d] uppercase"
        >
          {doc.data.tags}
        </h6>
      {/if}
      {#if bio}
        <p
          class="mt-[12px] h-[75px] overflow-hidden text-left text-[16px] leading-[24px] font-light text-[#365b6d] md:mt-[16px] lg:mt-[20px]"
        >
          {bio}
        </p>
      {/if}
      {#if href}
        <a
          {href}
          class="focus-visible:ring-primary-deep mt-[6px] inline-flex items-center gap-[12px] text-[16px] leading-[24px] font-light tracking-[1.03px] text-[#365b6d] uppercase md:mt-[8px] md:gap-[16px] lg:mt-[10px] lg:gap-[20px] focus-visible:ring-2 focus-visible:outline-hidden"
        >
          Read More
          <!-- live's real Arrow.svg (white-filled), tinted to cyan via mask so
               we ship the actual vector, never a redraw. -->
          <span
            aria-hidden="true"
            class="h-[11px] w-[10px] shrink-0 bg-[#365b6d] [mask:url(/icons/read-more-arrow.svg)_center/contain_no-repeat] [-webkit-mask:url(/icons/read-more-arrow.svg)_center/contain_no-repeat]"
          ></span>
        </a>
      {/if}
    </div>
    {#if beach?.image?.url}
      <img
        src={beach.image.url}
        alt=""
        aria-hidden="true"
        class="absolute bottom-0 left-0 h-[30%] w-full rounded-b-[20px] object-cover"
      />
      {#if beach.caption}
        <h6
          class="font-slab absolute bottom-[10px] left-[18px] z-10 text-[12px] leading-[15px] font-light tracking-[1.28px] uppercase lg:bottom-3 lg:left-6 lg:text-[24px] lg:leading-[30px]"
          style="color:#fff"
        >
          {beach.caption}
        </h6>
      {/if}
    {/if}
  </article>
{/snippet}

{#if slice.variation === "team"}
  <!-- Circular-avatar carousel (live "Meet Your Team"): a row of headshots on
       the shared Slider (cardsPerView + chevron nav), each linking to its
       team-member detail route. The heading renders as a small eyebrow. -->
  <section
    data-slice-type={slice.slice_type}
    data-slice-variation={slice.variation}
    class="overflow-x-clip pt-0 pb-12 md:pb-16 lg:pb-20"
  >
    {#if slice.primary.heading}
      <!-- Live wraps the eyebrow in `.content-width` — max-width 1400 centred,
           padding-x 1.5rem against the stepped root (60px >=992, 48px 768-991)
           stepping to 8% at <=767 and 5% at <=479. Measured content-left:
           80 @1440 / 48 @834 / 19.5 @390. Live reveals the eyebrow and the
           headshot row as separate elements, not the section as one block.
           `mb-4` is 1rem on the same root: 40 / 32 / 24. -->
      <div
        class="mx-auto w-full max-w-[1400px] px-[5%] xs:px-[8%] md:px-12 lg:px-[60px]"
        use:animateIn={LIVE_REVEAL}
      >
        <p
          class="font-slab mb-6 text-[12px] leading-[15px] font-medium tracking-[1.28px] text-[#365b6d] uppercase md:mb-8 lg:mb-10 lg:text-[24px] lg:leading-[30px]"
        >
          {asText(slice.primary.heading)}
        </p>
      </div>
    {/if}
    {#if docs.length > 0}
      <!-- Full-bleed row that reaches both screen edges, with live's white
           edge-fade gradients (.heads-opacity-gradient) so the headshots
           dissolve at the margins. Live's cell is `.heads{width:5rem;
           height:5rem;margin-right:1rem}` with NO media override — so against
           its stepped root (40/32/24) the real ladder is three sizes, not two:
             >=992   200px cell, 40px gap, first flush at the 80px content-left
             768-991 160px cell, 32px gap, 48px content-left
             <=767   120px cell, 24px gap, 8%/5% content-left
           The 768-991 band was rendering the 200px DESKTOP cell (measured 200
           vs live's 160 at 834), which is what pinned this region at 45.9%.
           The arrows/fades still pin to the true screen edges. -->
      <div class="relative w-full" use:animateIn={LIVE_REVEAL}>
        <Slider
          itemCount={docs.length}
          label={asText(slice.primary.heading) || "Meet the team"}
          itemWidth="200px"
          tabletItemWidth="160px"
          mobileItemWidth="120px"
          gap="40px"
          tabletGap="32px"
          mobileGap="24px"
          trackPadStart="80px"
          tabletTrackPadStart="48px"
          xsTrackPadStart="8%"
          mobileTrackPadStart="5%"
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
{:else if slice.variation === "people" && slice.primary.layout === "slider"}
  <!-- your-first-visit `.fv-meet-our-team-section`: the SAME person cards as
       /our-team, in a horizontal slider under a big cyan slab heading (h2
       museo-slab wt100 120px, content-left x=80). Cells are the card's own
       width + margins; the first card aligns to the 80px content column while
       arrows pin to the screen edges (live's edge-arrow slider). -->
  <section
    id="meet-our-team"
    data-slice-type={slice.slice_type}
    data-slice-variation={slice.variation}
    class="fv-meet-our-team-section mb-12 w-full scroll-mt-24 overflow-x-clip"
  >
    {#if slice.primary.heading}
      <div class="mb-4 px-5 lg:mb-10 lg:px-20" use:animateIn={LIVE_REVEAL}>
        <h2
          class="font-slab text-[48px] leading-[1.05] font-thin lg:text-[120px] lg:leading-[1]"
        >
          {asText(slice.primary.heading)}
        </h2>
      </div>
    {/if}
    {#if docs.length > 0}
      <!-- extra top room so the cards' straddling headshots + live's larger
           heading-to-card gap clear (live: ~320px from heading top to card). -->
      <div class="relative w-full lg:pt-10" use:animateIn={LIVE_REVEAL}>
        <Slider
          itemCount={docs.length}
          label={asText(slice.primary.heading) || "Meet our team"}
          itemWidth="360px"
          mobileItemWidth="351px"
          gap="0px"
          mobileGap="0px"
          trackPadStart="60px"
          mobileTrackPadStart="0px"
          showDots={false}
          arrowLayout="sides"
          arrowClass="max-lg:hidden hover:opacity-70 focus-visible:ring-primary-deep focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden"
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
              {@render personCard(doc, false)}
            {/if}
          {/snippet}
        </Slider>
      </div>
    {/if}
  </section>
{:else if slice.variation === "people"}
  <!-- live `.team-grid-section` → `.w-dyn-items.w-row` (flex-wrap, justified
       centre): `.w-col-4` cards, 3-up ≥768 / stacked ≤767. gap-y carries the
       inter-row gutter; the top padding + card headshot overhang give the
       first row room for the straddling circles. -->
  <section
    data-slice-type={slice.slice_type}
    data-slice-variation={slice.variation}
    class="team-grid-section mx-auto flex max-w-[1280px] flex-wrap justify-center px-5 md:px-12 lg:px-0"
  >
    {#each docs as doc (doc.uid)}
      {@render personCard(doc)}
    {/each}
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
