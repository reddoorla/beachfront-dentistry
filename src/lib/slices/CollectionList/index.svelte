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
      // Comma-separated uids. A Collection List's sort is a per-LIST setting,
      // so a page whose order differs from `person.order` carries its own here
      // rather than fighting the shared field.
      order_uids?: string | null;
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
  // An explicit per-list uid sequence wins over `person.order`; uids it does
  // not name keep their `order` rank behind the named ones, so a newly added
  // person still renders rather than vanishing from the list.
  const listOrder = $derived(
    ((slice.primary as { order_uids?: string | null }).order_uids ?? "")
      .split(",")
      .map((u) => u.trim())
      .filter(Boolean),
  );
  const rankOf = (doc: CollectionDoc) => {
    const i = listOrder.indexOf(doc.uid);
    return i === -1 ? listOrder.length + teamRank(doc) : i;
  };
  let docs = $derived.by(() => {
    const all =
      context?.collections?.[slice.primary.collection_type ?? ""] ?? [];
    const ordered =
      slice.variation === "team" || slice.variation === "people"
        ? [...all].sort((a, b) => rankOf(a) - rankOf(b))
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

  // The person card IS the navigation on /our-team, and it had no pointer
  // response at all: probed at 1440 the article computed `transition: all 0s`
  // and `box-shadow: none`, and hovering the headshot, the name or READ MORE
  // changed nothing. One restrained affordance for the whole card — a 4px
  // lift plus a shadow, no scale (the headshots are `object-cover object-top`
  // circles and scaling them crops foreheads) — driven from `hover` OR
  // `focus-within`, so a keyboard caret landing on the card's link reads the
  // same as a pointer over it.
  // Reduced motion: app.css clamps every duration to 0.01ms, which turns the
  // lift into an instant 4px jump rather than removing it — worse than either
  // end state. So under `motion-reduce` the transform is pinned to 0 and the
  // shadow alone carries the state: a state change without movement, which is
  // the point of the preference.
  // Applied only when the card has a detail route; a card with nowhere to go
  // must not advertise a click.
  // `translate`, not `transform`, in the transition list: Tailwind v4 compiles
  // `-translate-y-1` to the independent `translate` property (probed — the
  // hovered card computes `translate: 0px -4px` while `transform` stays
  // `none`), so `transition-[box-shadow,transform]` animates nothing and the
  // lift snaps.
  const CARD_AFFORDANCE =
    "transition-[box-shadow,translate] duration-200 ease-out hover:-translate-y-1 hover:shadow-lg focus-within:-translate-y-1 focus-within:shadow-lg motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:focus-within:translate-y-0";
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
       accessible name for AT.
       A hover reveal is the whole name affordance, so on a device with no
       hover the row introduced NOBODY — eleven unlabelled faces on every
       phone and tablet (Tailwind v4 wraps `group-hover:` in
       `@media (hover: hover)`, so the badge stayed at opacity 0 through a
       tap). `[@media(hover:none)]:opacity-100` — Grid.svelte:169's idiom —
       fixes that in one class, but it fixes it by painting a 65% cyan disc
       over the face permanently: probed at 390 the name lands across the
       eyes and every headshot reads as a blue silhouette, which defeats the
       row's actual job. So touch gets a CAPTION under the circle instead:
       face and name at once, which the hover badge can never do. The badge
       keeps its pointer/keyboard behaviour untouched. -->
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
    <!-- aria-hidden: the wrapping link already carries this exact string as
         its aria-label, so the caption is the VISIBLE half of a name AT
         already gets (and WCAG 2.5.3 holds — accessible name === visible
         text). #365b6d, not the card's cyan: cyan on white is 3.1:1 and this
         is 12px bold, which is not large text. -->
    <span
      aria-hidden="true"
      class="font-slab mt-3 hidden text-center text-[12px] leading-[15px] font-bold tracking-[1.28px] text-[#365b6d] uppercase lg:text-[16px] lg:leading-[20px] [@media(hover:none)]:block"
    >
      {asText(doc.data.title as RichTextField)}
    </span>
  {/if}
{/snippet}

{#snippet personCard(
  doc: CollectionDoc,
  variant: "grid" | "slider" = "grid",
  index = 0,
)}
  <!-- live `.team-list-item` (320×480 / 303×384, bg #E7F5FA, radius 20): a
       circular headshot straddling the top edge, then name (cyan slab) / role
       (teal sans caps) / bio teaser (teal, 3-line clamp) / READ MORE, with the
       favorite-beach banner + white caption pinned across the card bottom. -->
  {@const href = hrefFor(doc)}
  {@const name = asText(doc.data.title as RichTextField)}
  <!-- Live clips the AUTHORED `person.teaser` (9 of 11 are a bio prefix with
       ragged "..." cut points, 2 differ outright). MarkUp 4b8d52d2 thread
       4dd560d2-3dad-4240-b5bb-3a5d64a6cedd (yfv pin #5) replaces that with a
       visual 3-line clamp of the REAL bio so the ellipsis always lands
       mid-line-3 — so the card reads `person.body` first and only falls back
       to the teaser for a person with no bio. See LEDGER ROUND C. -->
  {@const bio =
    asText((doc.data.body ?? []) as RichTextField).trim() ||
    doc.data.teaser?.trim()}
  {@const beach = doc.data.gallery?.[0]}
  <!-- Live's `.team-list-item.m-2` is sized in REM against its stepped root:
         <=479    100% x 16rem  mt 4rem            -> 303x384  mt 96
         480-767  16rem x 24rem m 8rem 1rem 1rem   -> 384x576  mt 192 mx 24
         768-991  16rem x 24rem m 8rem 1rem 1rem   -> 512x768  mt 256 mx 32
         >=992    8rem x 12rem  mt 4rem            -> 320x480  mt 160 mx 20
       The yfv Meet-Our-Team SLIDER is the same element plus `.display-inline`,
       which overrides the width at the two EXTREMES only — 8.5rem (340) at
       >=992 and 10rem x 18rem (240x432) at <=479. Between 480 and 991 the two
       are byte-identical, so gating the tablet tiers off for the slider (the
       earlier reading of this) left it rendering the phone card across the
       whole band and cost the section 846px of height at 834.
       ROUND C deviations from that ladder (MarkUp, see LEDGER ROUND C):
       - heights are MIN-heights and the card is a flex column with the beach
         banner in flow, so a card whose content overflows (a two-line name)
         GROWS instead of hiding READ MORE under the banner — thread
         986a647b-badc-4ecc-9bd5-4292bba404ca (our-team pin #3, "The box
         needs to grow"). A card whose content fits renders at exactly the
         live ladder height.
       - the slider's lg cell margin is HALF live's visual gap: our A2 cells
         carried 43.33px each side (86.7px gap, = the reference @1440);
         thread 4dd560d2-3dad-4240-b5bb-3a5d64a6cedd (yfv pin #5, "less
         space in between the two. Like 50% less.") halves that to 21.67px
         (gap 43.3). The Slider itemWidth and trackPadStart compensate below.
       - the slider card's lg mb-5 (live `.m-2`'s .5rem, clipped invisible by
         the 640px holder) is dropped so the holder's auto height still
         equals live's 640 when no card grows. -->
  <!-- The top margin (live `.m-2` `beachfront.css:6538-6540` / ≤991 `:8183-8187`
       / ≤479 `:9271-9276`) stays on the CARD in the grid, where the card is the
       outermost per-card box exactly as it is on live — except at lg, where
       ROUND C moved the grid's margins to the SECTION (30px gaps + pt-40
       first-row clearance, thread 338f6e07 — see the section below). In the
       SLIDER it moves to the Slider's cell (`slideClass` below), because
       there the cell is the outermost per-card box and live has no cell —
       leaving the margin here put our card box 160/256/96px below the box the
       reference draws, which is where page-diff cuts the "Dr. Robert Quan"
       region. -->
  <!-- The 11 person cards had NO reveal at all — /our-team's primary content,
       on the page a nervous patient scrolls slowest, arriving with no entrance
       while the band above and the CTA below both rose. Coverage there was 10%
       at 390 and 30% at 1440.
       `index % 3` is load-bearing, not decoration. animateIn gives each element
       its OWN observer and writes `transitionDelay` once at mount, so the delay
       counts from THAT element's trigger, not the group's. Across a row every
       card triggers in the same frame and the delay sequences them; down a
       column it would leave card 4 sitting invisible for 210ms AFTER it had
       already entered the viewport. Modulo the 3-up row resets the ramp per
       row, so no card ever waits longer than two steps. -->
  <article
    use:animateIn={{ ...LIVE_REVEAL, stagger: 70, index: index % 3 }}
    class="team-list-item group relative mx-6 mb-6 flex flex-col rounded-[20px] bg-[#e7f5fa] xs:min-h-[576px] xs:w-[384px] md:mx-8 md:mb-8 md:min-h-[768px] md:w-[512px] lg:min-h-[480px] {href
      ? CARD_AFFORDANCE
      : ''} {variant === 'slider'
      ? 'min-h-[432px] w-[240px] lg:mx-[21.67px] lg:mb-0 lg:w-[340px]'
      : 'mt-24 min-h-96 w-[303px] xs:mt-[192px] md:mt-[256px] lg:mx-0 lg:mt-0 lg:mb-0 lg:w-[calc((100%-60px)/3)]'}"
  >
    {#if doc.data.media?.url}
      <!-- headshot centred ON the card's top edge (half above, half in).
           Not a link any more: the card carries exactly ONE link (READ MORE,
           below), whose hit area is stretched over the card — so the photo is
           still clickable and still shows a pointer cursor, but it is no
           longer a third tab stop announcing the same destination. -->
      <div
        class="absolute top-0 left-1/2 z-10 block w-[120px] -translate-x-1/2 -translate-y-1/2 rounded-full xs:w-[240px] md:w-[320px] lg:w-[200px]"
      >
        <PrismicImage
          field={doc.data.media as unknown as ImageField}
          fallbackAlt=""
          class="size-[120px] max-w-none rounded-full object-cover object-top xs:size-[240px] md:size-[320px] lg:size-[200px]"
        />
      </div>
    {/if}
    <!-- pb keeps READ MORE clear of the in-flow banner when a grown card's
         content lands flush against it (thread 986a647b, "box grows"); on a
         card whose content fits, the banner's mt-auto absorbs it and nothing
         moves. -->
    <div
      class="flex flex-col px-[18px] pt-[70px] pb-[10px] text-center xs:pt-[130px] md:pt-[170px] lg:px-6 lg:pt-[110px] lg:pb-5"
    >
      <!-- The name was its own link to the same route (one of three per
           card). It is plain text now — the stretched READ MORE link below
           covers it, so pointing at the name still shows a pointer and still
           navigates, and the heading is no longer wrapped in a link that
           duplicated its two siblings for AT and the keyboard. -->
      <!-- `-deep`, not live's brand cyan. The cyan opt-in is only AA-safe on
           WHITE (3.09:1, which clears the 3.0 large-text bar); this name sits
           on the card's own #e7f5fa, where the same colour is 2.78:1 and fails.
           15 of the site's 19 failing nodes were this one line — 11 team names
           on /our-team and 4 on /your-first-visit. #0e7799 here is 4.58:1,
           which clears the body threshold too. Operator-ACKed brand deviation;
           see app.css's `.h-primary` block for the general rule. -->
      <h5
        class="font-slab text-primary-deep text-[30px] leading-[40px] font-light"
      >
        {name}
      </h5>
      {#if doc.data.tags}
        <h6
          class="mt-[10px] text-[16px] leading-[25px] font-light tracking-[1.28px] text-[#365b6d] uppercase"
        >
          {doc.data.tags}
        </h6>
      {/if}
      {#if bio}
        <!-- Live: `.m-2.team-teaser` height 7.5ch + overflow hidden
             (beachfront.css:3770-3773 → 75px at the 16px card font). ROUND C
             deviation (thread 4dd560d2, yfv pin #5): a visual 3-line clamp of
             the full bio, "three lines every time, and then it gets cut off
             somewhere in the third line" — no authored cut point, no orphan
             ellipsis line. -->
        <p
          class="mt-[12px] line-clamp-3 text-left text-[16px] leading-[24px] font-light text-[#365b6d] md:mt-[16px] lg:mt-[20px]"
        >
          {bio}
        </p>
      {/if}
      {#if href}
        <!-- The card's ONE link, and the whole card's hit area.
             `::after` stretches it over the card box and `::before` over the
             headshot circle that straddles the top edge (same box the photo's
             own anchor used to occupy: top-0/left-1/2, the circle's size,
             centred on the edge, `rounded-full` so the hit area is the disc
             and not its bounding square). Both sit at z-20, above the photo's
             z-10 wrapper and the beach banner, and both inherit the link's
             pointer cursor — so a patient pointing at a face or a name gets
             the pointer and the navigation, without a second `<a>` in the
             card. Cost of the pattern: text inside the card can no longer be
             drag-selected.
             `w-fit self-start` is the fix for a ring that was drawing the
             card: the link is a flex item, so `inline-flex` blockified and
             stretched to the full 359px content column while its text is
             131px — the focus ring painted a near-card-width box around the
             words. Shrink the box to the words and the ring hugs them.
             `aria-label` because eleven links called "Read More" is WCAG
             2.4.4; the visible text is contained in the label (2.5.3).
             `draggable="false"`: the yfv slider is swipe-driven
             (Slider.svelte's `useSwipe`), and a link now covers the whole
             card, so a drag across it must not start a native link drag. -->
        <a
          {href}
          aria-label="Read more about {name}"
          draggable="false"
          class="focus-visible:ring-primary-deep mt-[6px] inline-flex w-fit items-center gap-[12px] self-start text-[14.4px] leading-[21.6px] font-light tracking-[1.03px] text-[#365b6d] uppercase before:absolute before:top-0 before:left-1/2 before:z-20 before:size-[120px] before:-translate-x-1/2 before:-translate-y-1/2 before:rounded-full before:content-[''] after:absolute after:inset-0 after:z-20 after:content-[''] md:mt-[8px] md:gap-[16px] md:text-[19.2px] md:leading-[28.8px] xs:before:size-[240px] md:before:size-[320px] lg:mt-[10px] lg:gap-[20px] lg:text-[16px] lg:leading-[24px] lg:before:size-[200px] focus-visible:ring-2 focus-visible:outline-hidden"
        >
          Read More
          <!-- live's real Arrow.svg (white-filled), tinted to cyan via mask so
               we ship the actual vector, never a redraw. The nudge is the
               card-level hover's only echo inside the card, and it mirrors on
               focus so the keyboard sees what the pointer sees. -->
          <span
            aria-hidden="true"
            class="h-[11px] w-[10px] shrink-0 bg-[#365b6d] transition-transform duration-200 group-hover:translate-x-1 group-focus-within:translate-x-1 motion-reduce:transition-none [mask:url(/icons/read-more-arrow.svg)_center/contain_no-repeat] [-webkit-mask:url(/icons/read-more-arrow.svg)_center/contain_no-repeat]"
          ></span>
        </a>
      {/if}
    </div>
    {#if beach?.image?.url}
      <!-- Live pins `.team-grid-beach` absolutely over the card's bottom 30%
           (beachfront.css:6564-6569), which is what buried READ MORE when a
           two-line name pushed the content down. ROUND C (thread 986a647b,
           "box grows"): the banner is IN FLOW at the same fixed heights live's
           30% resolves to against the min-height ladder — 115.2 (grid) /
           129.6 (slider) at <=479, 172.8 xs, 230.4 md, 144 lg — bottom-pinned
           by mt-auto, so a fitting card renders exactly as before and an
           overflowing card grows past it. -->
      <div class="relative mt-auto">
        <img
          src={beach.image.url}
          alt=""
          aria-hidden="true"
          class="{variant === 'slider'
            ? 'h-[129.6px]'
            : 'h-[115.2px]'} w-full rounded-b-[20px] object-cover xs:h-[172.8px] md:h-[230.4px] lg:h-[144px]"
        />
        {#if beach.caption}
          <h6
            class="font-slab absolute bottom-[10px] left-[18px] z-10 text-[12px] leading-[15px] font-light tracking-[1.28px] uppercase lg:bottom-3 lg:left-6 lg:text-[24px] lg:leading-[30px]"
            style="color:#fff"
          >
            {beach.caption}
          </h6>
        {/if}
      </div>
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
             >=992   200px cell, 40px gap, first flush at the content-left
             768-991 160px cell, 32px gap, 48px content-left
             <=767   120px cell, 24px gap, 8%/5% content-left
           The 768-991 band was rendering the 200px DESKTOP cell (measured 200
           vs live's 160 at 834), which is what pinned this region at 45.9%.
           The arrows/fades still pin to the true screen edges. -->
      <!-- MarkUp d486b3c5 thread 234a7635-c747-45c2-b7a2-9cb27cdefb6b
           (pin #4): "Left align image to title 'Meet Your Team' above."
           Live-FIDELITY fix: live sets this rail's padding-left with JS —
           `getContentWidthMargin()` (index.html:177; captured at
           matching/spec/incidental-utils.js:41-50; SPEC §3.3) = the
           `.content-width` left at EVERY width, i.e. 60px + centring excess
           above 1400 (80 at 1440, 60 at 1294/1200 — probed on the reference).
           The old fixed "80px" reproduced only the 1440 sample and left the
           whole 992–1399 band 20px right of the title. max(60px, 50% − 640px)
           of the full-bleed track is that function in pure CSS. -->
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
          trackPadStart="max(60px, calc(50% - 640px))"
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
    class="fv-meet-our-team-section mb-[72px] w-full scroll-mt-24 overflow-x-clip md:mb-24 lg:mb-[120px]"
  >
    {#if slice.primary.heading}
      <!-- Live's h2 sits in `.content-width` (your-first-visit.html:121:
           `<section id="meet" class="fv-meet-our-team-section"><div
           class="content-width"><h2 …>Meet Our Team</h2>`), which is
           max-width 1400 centred + padding 1.5rem (beachfront.css:5858-5867)
           — without the cap our h2 sat at 60@1440 where live has 80
           (probed). Surfaced by MarkUp 4b8d52d2 pin #4, which aligns the
           first card to this heading. -->
      <div
        class="mx-auto mb-3 max-w-[1400px] px-[5%] xs:px-[8%] md:mb-4 md:px-12 lg:mb-5 lg:px-[60px]"
        use:animateIn={LIVE_REVEAL}
      >
        <h2
          class="font-slab h-primary text-[56px] leading-[70px] font-thin md:text-[120px] md:leading-[140px]"
        >
          {asText(slice.primary.heading)}
        </h2>
      </div>
    {/if}
    {#if docs.length > 0}
      <!-- `.team-slider-holder` `beachfront.css:6654-6659` is an explicit
           `height:16rem` viewport with `overflow:hidden`; ≤991 `:8226-8231`
           makes it `35rem` and ≤479 `:9309-9312` `23rem`. Against the stepped
           root that is 640 / 1120 / 552 — and only at 390 does it equal the
           cards' own stack. At 1440 it CLIPS the last 20px (the card's
           `margin-bottom`), and at 834 it is 64px TALLER than the cards, which
           is empty space live reserves and we did not.
           Height only: the ≤991 rule also sets `width:20rem` with auto side
           margins, and applying that width alongside the height is what made
           this region worse on the previous attempt (@390 Δh 18.2 -> 67.5) —
           our track is not live's JS-positioned one and does not survive being
           narrowed to a single-card window. -->
      <!-- ROUND C: lg is min-height, not height — live's fixed 640 viewport
           would clip a GROWN card (thread 986a647b; the slider card's lg mb-5
           is dropped so the auto height still equals live's 640 when nothing
           grows). ≤991 keeps the fixed live heights: their probed slack
           (24/72/96px at sm/xs/md) absorbs every growth case measured. -->
      <div
        class="relative h-[552px] w-full overflow-hidden xs:h-[840px] md:h-[1120px] lg:h-auto lg:min-h-[640px]"
        use:animateIn={LIVE_REVEAL}
      >
        <!-- MarkUp 4b8d52d2 thread e23604c9-fb66-4925-9878-9c3247390b44
             (pin #4): "Should left align to headline above, same spacing
             issue." Requested DEVIATION from live: live pads the track to the
             content gutter and the first CARD then sits a cell margin further
             in (gutter + 43.33 = 123.3@1440, probed — which is what our old
             fixed trackPadStart="80px" reproduced at 1440 only). Tim wants
             the card itself flush with the h2, so the lg pad is the gutter
             MINUS the card's lg cell margin: first-card-left =
             max(60px, 50% − 640px) = the heading's `.content-width` left
             (beachfront.css:5858-5867) at every lg width. ROUND C (thread
             4dd560d2, yfv pin #5) halved that cell margin 43.33 → 21.67px, so
             the compensation and the cell width move with it IN THE SAME
             commit: itemWidth = 340 + 2×21.67 = 383.34, trackPadStart
             − 21.67px. ≤991 tiers untouched. See LEDGER 2026-08-10 A2 + C. -->
        <Slider
          itemCount={docs.length}
          label={asText(slice.primary.heading) || "Meet our team"}
          itemWidth="383.34px"
          tabletItemWidth="640px"
          mobileItemWidth="288px"
          gap="0px"
          tabletGap="0px"
          mobileGap="0px"
          slideClass="mt-24 xs:mt-[192px] md:mt-[256px] lg:mt-40"
          trackPadStart="calc(max(60px, 50% - 640px) - 21.67px)"
          tabletTrackPadStart="129px"
          xsTrackPadStart="8%"
          mobileTrackPadStart="51px"
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
              {@render personCard(doc, "slider")}
            {/if}
          {/snippet}
        </Slider>
      </div>
    {/if}
  </section>
{:else if slice.variation === "people"}
  <!-- live `.team-grid-section` → `.w-dyn-items.w-row` (flex-wrap, justified
       centre): `.w-col-4` cards, 3-up ≥768 / stacked ≤767.
       ROUND C deviation at lg — threads 338f6e07-02bc-4d14-9bad-45c4cd362e6c
       (our-team pin #2: "Width of these can grow so that the margins match
       the text margins on the other page") and
       b7be52f2-11d0-467c-b4ea-ca086b9aa29f (atd pin #2, supersedes the 40:
       "Let's use 30px."). Live justify-centres fixed 320px cards inside a
       1280 box (first card probed x=200@1440 vs the 80px content gutter;
       40px h / 180px v gaps from `.team-list-item.m-2`'s margins,
       beachfront.css:6538-6540). Tim: outer card edges on the shared content
       gutter with 30px gaps both axes — so at lg the section IS the
       `.content-width` box (max-w-1400 + px-[60px], beachfront.css:5858-5867
       = max(60px, 50% − 640px) per edge), the 30px gaps live on the section
       (lg:gap-[30px]), live's 4rem first-row clearance moves from the card
       to lg:pt-40 (:6538-6540), and the card width derives from the box:
       (100% − 2×30px)/3 → 406.7@1440, 371.3@1294. 30 is BOX-to-box: the
       100px headshot overhang means row 2+ circles overlap the row above's
       banner — flagged in LEDGER ROUND C for Tim's resolve reply. ≤991
       (single-column, live's ladder) is untouched. -->
  <section
    data-slice-type={slice.slice_type}
    data-slice-variation={slice.variation}
    class="team-grid-section mx-auto flex w-full max-w-[1400px] flex-wrap justify-center px-5 md:px-12 lg:gap-[30px] lg:px-[60px] lg:pt-40"
  >
    {#each docs as doc, i (doc.uid)}
      {@render personCard(doc, "grid", i)}
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
