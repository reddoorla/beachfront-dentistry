<script lang="ts">
  import { PrismicImage, PrismicRichText } from "@prismicio/svelte";
  import {
    asText,
    isFilled,
    type ImageField,
    type RichTextField,
  } from "@prismicio/client";
  import { floatAlong } from "$lib/actions/floatAlong";
  import { animateIn, LIVE_REVEAL } from "$lib/actions/animateIn";
  import { SvelteSet } from "svelte/reactivity";

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

  // Live's card excerpt is a hand-written Webflow teaser, NOT the article
  // body's lead paragraph (verified against live 2026-08-02: only 1 of the 6
  // leads matches its card's excerpt). The import didn't capture that field
  // and news_article has no summary field, so — like the curated selection
  // below — live's teasers are pinned verbatim by uid, with the lead
  // paragraph as the fallback for other docs. (TODO: promote to a CMS field
  // once Slice Machine is wired.)
  const TEASERS: Record<string, string> = {
    "regular-dental-cleanings-support-your-whole-body-health":
      "Routine cleanings aren’t just about keeping your smile bright—they’re a powerful tool for protecting your entire body",
    "best-routine-for-my-dental-health":
      "This simple and effective daily routine will keep your smile healthy and bright between visits.",
    "do-teeth-turn-yellow-as-you-age":
      'Tooth discoloration and "Do Teeth Turn Yellow As You Age?" is one of the most common patient concerns/questions that we hear each day. There are a number of reasons why your teeth may...',
    "creating-perfect-smiles-artistry-or-science":
      "We’re often asked: Is cosmetic dentistry more of an art or a science? Our answer? It’s both—beautifully intertwined.",
    "tooth-broke-off":
      "If your tooth broke off, it is a serious dental problem, whether or not it hurts. The lack of pain implies that you have only a minor break; however, even these sorts of tooth injuries...",
    "why-does-my-tooth-hurt-when-i-bite-down":
      "Pain when biting down can signal a cracked tooth, cavity, or infection. Learn common causes, what helps, and when dental care is needed.",
  };
  const teaserText = (doc: NewsArticleDoc): string =>
    TEASERS[doc.uid] ?? leadParagraphText(doc);

  // Live's teaser cards are click-to-expand IN PLACE (measured 2026-08-02):
  // the card box stays fixed (mobile grows 288→384), a heavier cyan wash fades
  // in, the title fades out, and the answer excerpt + "Read More" slide up
  // from below the card's clip edge. The card itself is NOT a link on live —
  // only "Read More" navigates — so the toggle lives on the header bar.
  const expandedCards = new SvelteSet<string>();
  const toggleExpanded = (uid: string) =>
    expandedCards.has(uid) ? expandedCards.delete(uid) : expandedCards.add(uid);

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
  const FEATURED_UID =
    "regular-dental-cleanings-support-your-whole-body-health";
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
    if (featured)
      cards.push({
        doc: featured,
        number: canonicalNumber.get(FEATURED_UID) ?? 1,
      });
    for (const uid of CURATED_UIDS) {
      const doc = byUid.get(uid);
      if (doc) cards.push({ doc, number: canonicalNumber.get(uid) ?? null });
    }
    // Fallback for other sites / missing curated docs: newest N, hero first.
    if (cards.length <= 1) {
      const n = isFilled.number(slice.primary.max_items)
        ? slice.primary.max_items
        : sortedDocs.length;
      return sortedDocs.slice(0, n).map((doc, i) => ({ doc, number: i + 1 }));
    }
    return cards;
  });
</script>

{#if slice.variation === "teaser"}
  <!-- Live "Ask the Doctor": a centered column of question cards — a pale
       header bar (circled number + "+") over a cyan-tinted question photo with
       the title in white — a cursive "ask the doctor" annotation to the left,
       and the doctor headshot floating down the right edge tracking the topmost
       card. The first card is featured (no number header).
       The negative top margin reproduces live's OVERLAP: the first card starts
       240px (desktop) / 49px (mobile) BEFORE the services band above ends, so
       the cards sit on that band's faded-to-white tail rather than below it.
       Measured from live; the values absorb this section's own 80px pt. -->
  <section
    data-slice-type={slice.slice_type}
    data-slice-variation={slice.variation}
    class="relative -mt-[193px] mx-auto max-w-4xl px-[19.5px] py-20 lg:-mt-[320px] lg:px-6"
  >
    <!-- Live's .qa-block is 600px wide at desktop (351 on mobile, where the
         375-wide content box already constrains it) — max-w-xl (576) rendered
         the whole card stack a size too narrow. -->
    <div class="relative mx-auto max-w-[600px]">
      {#if isFilled.richText(slice.primary.heading) || isFilled.image(slice.primary.side_image)}
        <!-- Live's .ask-the-doctor-handwriting-anchor: ONE anchor holds the
             hand-drawn "ask the doctor" annotation (real PNG asset, NOT a
             redrawn cursive font) AND the doctor headshot at the SAME height,
             flanking the question column ~100px below the tracked card's top.
             floatAlong glides the whole pair to the bottom-most fully visible
             question, quantized per question, with live's own anchor motion
             (transform 1s cubic-bezier(0.19,1,0.22,1)). Live x-geometry at
             1440: handwriting's right edge 10px left of the column, headshot
             overlapping 40px INTO the column's right edge. -->
        <!-- MOBILE (measured live @390): the pair rests IN PLACE above the
             first card, right-aligned — 120px headshot 24px from the content's
             right edge with its bottom 12px above the card, the 120×70
             handwriting flush against its left edge (float gated off in
             floatAlong). DESKTOP: flanks the column and glides. -->
        <div
          use:floatAlong={{ itemSelector: ".qa-item" }}
          aria-hidden="true"
          class="pointer-events-none absolute inset-x-0 top-0 z-10 transition-transform duration-1000 ease-[cubic-bezier(0.19,1,0.22,1)] motion-reduce:transition-none lg:top-[100px]"
        >
          {#if isFilled.richText(slice.primary.heading)}
            <!-- Live ships the raw handwriting PNG and turns it dark blue with
                 `.filter-to-primary-dark` — the exact computed chain below
                 (read off live 2026-08-02), not a recoloured asset. -->
            <img
              src="/annotations/ask-the-doctor.png"
              alt=""
              class="absolute right-[144px] bottom-[26px] w-[120px] max-w-none lg:top-0 lg:right-full lg:bottom-auto lg:mr-[10px] lg:w-[210px]"
              style="filter:brightness(0) saturate(1) invert(0.29) sepia(0.33) saturate(5.99) hue-rotate(155deg) brightness(1) contrast(0.87)"
              use:animateIn={LIVE_REVEAL}
            />
          {/if}
          {#if isFilled.image(slice.primary.side_image)}
            <div
              class="ask-the-doctor-headshot absolute right-6 bottom-[12px] w-[120px] lg:top-0 lg:right-auto lg:bottom-auto lg:left-full lg:-ml-10 lg:w-[200px]"
              use:animateIn={LIVE_REVEAL}
            >
              <PrismicImage
                field={slice.primary.side_image}
                fallbackAlt=""
                class="aspect-square w-full rounded-full object-cover object-top shadow-lg"
              />
            </div>
          {/if}
        </div>
      {/if}

      <!-- Live's card gap: 12px mobile, 20px desktop (measured — the collection
           item is 300/420 tall around a 288/400 card). -->
      <ul class="flex flex-col gap-3 lg:gap-5">
        {#each teaserCards as card (card.doc.uid)}
          {@const doc = card.doc}
          {@const expanded = expandedCards.has(doc.uid)}
          {@const panelId = `qa-panel-${doc.uid}`}
          <!-- Per-card reveal: live raises each .qa-block as IT enters. -->
          <li class="qa-item" use:animateIn={LIVE_REVEAL}>
            <!-- Not a link: live's .qa-block has no wrapping <a> — only the
                 "Read More" inside the revealed answer navigates. The WHOLE
                 card is the toggle (live's .qa-block carries cursor:pointer +
                 the click interaction); the header-bar <button> stays as the
                 semantic disclosure for keyboard/AT, so this div click is a
                 pointer convenience only. Opening reproduces live's mechanics:
                 the card drops 48px/80px (margin-top .65s ease-out) while the
                 label bar slides up out of the clip. Mobile's card box also
                 grows 288→384 (measured); desktop's 400 is fixed. -->
            <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
            <div
              onclick={(e) => {
                if ((e.target as HTMLElement).closest("a, button")) return;
                toggleExpanded(doc.uid);
              }}
              onkeydown={(e) => {
                if (e.key === "Escape" && expanded) toggleExpanded(doc.uid);
              }}
              class="relative block cursor-pointer overflow-hidden rounded-[25px] shadow-md ring-1 ring-black/5 transition-[margin-top,opacity] duration-[650ms] ease-out hover:opacity-80 motion-reduce:transition-none lg:aspect-[3/2] {expanded
                ? 'mt-12 aspect-[351/384] lg:mt-20'
                : 'aspect-[351/288]'}"
            >
              <!-- Live's real card (.qa-block) is a single fixed-aspect box
                   (351×288 mobile / 600×400 desktop) with the photo (.qa-image)
                   object-cover-centred across the WHOLE card, a full-card wash on
                   top, the pale bar overlaid on the top 48px/80px, and the title
                   overlaid at the bottom. Filling the whole card (not just below
                   the bar) is what makes the centre crop match live — a
                   below-the-bar image is a wider box and crops the photo
                   differently. -->
              {#if isFilled.image(doc.data.media)}
                <PrismicImage
                  field={doc.data.media}
                  fallbackAlt=""
                  class="absolute inset-0 h-full w-full object-cover object-center"
                />
              {:else}
                <div
                  class="from-primary to-accent absolute inset-0 bg-gradient-to-br"
                ></div>
              {/if}
              <!-- Live's real visible wash, read off `.box-gradient.qa`
                   (2026-07-31). It is BREAKPOINT-DEPENDENT and identical to the
                   3-C cards' rule: cyan-0.9 at the TOP on mobile, flipping to
                   cyan-at-the-BOTTOM on desktop. Verified against live's rendered
                   pixels (desktop 28% down = rgb(148,210,232), 95% down =
                   rgb(37,162,201); mobile just-below-bar = rgb(44,167,208)).
                   NB an earlier pass mis-read this as a near-white veil, from
                   sampling a transition instead of reading the rule.
                   `.box-gradient-overlay` (opacity:0) is the HOVER layer — not
                   this one — and must not be copied. -->
              <div
                class="absolute inset-0 lg:hidden"
                style="background:linear-gradient(rgba(18,158,204,0.9) 23%, rgba(5,44,57,0.25) 93%, rgba(0,0,0,0))"
                aria-hidden="true"
              ></div>
              <div
                class="absolute inset-0 hidden lg:block"
                style="background:linear-gradient(rgba(0,0,0,0), rgba(18,158,204,0.9) 90%)"
                aria-hidden="true"
              ></div>
              <!-- Expanded-state wash: live's `.box-gradient-overlay.qa` (the
                   opacity-0 layer noted below) fades to 1 when the card opens,
                   deepening the cyan so the white answer copy reads. -->
              <div
                class="absolute inset-0 transition-opacity duration-[650ms] motion-reduce:transition-none {expanded
                  ? 'opacity-100'
                  : 'opacity-0'}"
                style="background:linear-gradient(rgba(0,0,0,0), rgba(16,137,177,0.78) 31%, rgba(18,158,204,0.9) 80%)"
                aria-hidden="true"
              ></div>
              <!-- Answer panel: excerpt + Read More, sliding up from beyond the
                   card's clip edge exactly like live's .qa-answer
                   (translateY(400px) → 0 over 0.65s). Insets/typography are
                   live's measured values: text box 281/351 mobile & 480/600
                   desktop, copy 16/24 → 20/30 w300 white; button 109×41 →
                   180×67, museo-slab 15px → 25px, white 1px border, radius 8.
                   `inert` keeps the clipped link untabbable while closed. -->
              <div
                id={panelId}
                inert={!expanded}
                class="absolute inset-x-[35px] top-12 transition-transform duration-[650ms] motion-reduce:transition-none lg:inset-x-[60px] lg:top-20 {expanded
                  ? 'translate-y-0'
                  : 'translate-y-[400px]'}"
              >
                <p
                  class="text-[16px] leading-[24px] font-light text-white lg:text-[20px] lg:leading-[30px]"
                >
                  {teaserText(doc)}
                </p>
                <a
                  href="/questions/{doc.uid}"
                  class="font-slab mt-[46px] inline-flex h-[41px] items-center rounded-lg border border-white px-[15px] text-[15px] font-light text-white transition-[opacity,background-color] hover:bg-[#129ecc4a] hover:opacity-60 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:outline-hidden lg:mt-[36px] lg:h-[67px] lg:px-[25px] lg:text-[25px]"
                >
                  Read More
                </a>
              </div>
              <!-- Pale header bar overlaid on the top of the card — live's
                   .qa-label. When the card opens it slides up out of the clip
                   (live's .qa-label.active margin-top:-2rem) — `inert` pulls
                   the hidden button from the tab order; the card div's click +
                   Escape handle closing. -->
              <button
                type="button"
                aria-expanded={expanded}
                aria-controls={panelId}
                aria-label="{expanded ? 'Collapse' : 'Expand'}: {titleText(
                  doc,
                )}"
                inert={expanded}
                onclick={() => toggleExpanded(doc.uid)}
                class="focus-visible:ring-primary-deep absolute inset-x-0 top-0 flex h-12 cursor-pointer items-center justify-between rounded-t-[25px] bg-[#e7f5fa] px-5 transition-transform duration-[650ms] ease-out focus-visible:ring-2 focus-visible:ring-inset focus-visible:outline-hidden motion-reduce:transition-none lg:h-20 lg:px-5 {expanded
                  ? '-translate-y-full'
                  : ''}"
              >
                {#if card.number !== null}
                  <!-- Live's .qa-circle: an h6 in museo-slab BOLD 25px/30px,
                       a full-strength 1px #365b6d ring, ~52px disc at desktop. -->
                  <span
                    class="font-slab grid size-10 place-items-center rounded-full border border-[#365b6d] text-lg font-bold text-[#365b6d] lg:size-[52px] lg:text-[25px]"
                    >{pad2(card.number)}</span
                  >
                {:else}
                  <span aria-hidden="true"></span>
                {/if}
                <!-- Live's card +/−: its own Plus.svg / minus.svg assets
                     (25×25 and 25×5), 15px wide at mobile, 25px at desktop. -->
                {#if expanded}
                  <img
                    src="/icons/minus.svg"
                    alt=""
                    class="w-[15px] lg:w-[25px]"
                    aria-hidden="true"
                  />
                {:else}
                  <img
                    src="/icons/plus.svg"
                    alt=""
                    class="w-[15px] lg:w-[25px]"
                    aria-hidden="true"
                  />
                {/if}
              </button>
              <!-- Title is a direct child of the card box (a sibling of the
                   image wrapper, not nested inside it) so it mirrors live's
                   standalone `.qa-text` block. This keeps the page-diff anchor
                   resolving to the title's low position (near the card bottom)
                   the way live's does, instead of jumping up to a text-bearing
                   image wrapper and shifting the whole stack by one card.
                   Inline colour: the unlayered global `main h1–h3` primary rule
                   outranks any Tailwind text utility. Live title is museo-SANS
                   (not the base h3 slab), 20px/30px @390 → 30px/45px @1440, w500
                   (measured 2026-07-31 with the type probe).
                   BOX: live's .qa-text is 80% of the card width, inset 6.8% from
                   its left (281/351 mobile, 480/600 desktop — both exactly 0.80).
                   That narrower measure is what makes live wrap these titles onto
                   two lines; a full-width title box fits them on one and the
                   whole card stack then drifts out of vertical alignment. -->
              <h3
                class="absolute bottom-4 left-[6.8%] w-4/5 font-sans text-[1.25rem] leading-[30px] font-medium transition-opacity duration-300 motion-reduce:transition-none lg:bottom-5 lg:text-[1.875rem] lg:leading-[45px] {expanded
                  ? 'opacity-0'
                  : 'opacity-100'}"
                style="color:#fff"
              >
                {titleText(doc)}
              </h3>
            </div>
          </li>
        {/each}
      </ul>

      <!-- Live "View All Questions" = `.button.text-color-primary`: the
           light-blue (#129ecc) bordered slab pill, 67px tall at desktop —
           not a neutral rounded-full ghost. -->
      <div class="mt-12 text-center" use:animateIn={LIVE_REVEAL}>
        <a
          href="/ask-the-doctor"
          class="font-slab focus-visible:ring-primary-deep inline-flex h-[41px] items-center rounded-lg border border-[#129ecc] px-[15px] text-[15px] font-light text-[#129ecc] transition-[opacity,background-color] hover:bg-[#129ecc4a] hover:opacity-60 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden lg:h-[67px] lg:px-[25px] lg:text-[25px]"
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
    use:animateIn={LIVE_REVEAL}
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
