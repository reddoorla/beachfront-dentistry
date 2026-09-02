<script lang="ts">
  import { PrismicRichText } from "@prismicio/svelte";
  import PrismicPhoto from "$lib/components/PrismicPhoto.svelte";
  import {
    asText,
    isFilled,
    type ImageField,
    type RichTextField,
  } from "@prismicio/client";
  import { animateIn, LIVE_REVEAL } from "$lib/actions/animateIn";
  import QuestionCard from "./QuestionCard.svelte";
  import { pillClass } from "$lib/components/OutlineButton.svelte";

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
      // authored card excerpt (news_article.summary) — see `teaserText`
      summary?: string | null;
      // position in the home page's featured row (news_article.home_order)
      home_order?: number | null;
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

  // "Lead paragraph" = the first paragraph-type node in the rich-text body;
  // the numbered list's collapsed-body teaser and the full answer live on
  // the future /questions/<uid> detail page.
  const leadParagraphText = (doc: NewsArticleDoc): string => {
    const nodes = (doc.data.body ?? []) as RichTextField;
    const lead = nodes.find((node) => node.type === "paragraph");
    return lead ? asText([lead] as RichTextField) : "";
  };

  // The card excerpt is AUTHORED (`news_article.summary`), not the article
  // body's lead paragraph: 18 of the 40 live summaries are not even a prefix
  // of their body, and the 22 that are all cut at a different point. It is a
  // real CMS field, so it is read from the document; the lead paragraph stays
  // as the fallback for a doc whose summary an author hasn't filled in.
  const teaserText = (doc: NewsArticleDoc): string =>
    doc.data.summary?.trim() || leadParagraphText(doc);

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

  // The home row is an editorial pick, not "newest N": one hero question then
  // five specific ones, each still showing its CATALOG number. That selection
  // is authored (`news_article.home_order`, 1 = hero) — a doc with no
  // home_order simply isn't featured. Sites that haven't filled the field in
  // fall back to newest-N below, so the slice still works uncurated.
  let teaserCards = $derived.by(() => {
    const cards = sortedDocs
      .filter((doc) => isFilled.number(doc.data.home_order))
      .sort((a, b) => (a.data.home_order ?? 0) - (b.data.home_order ?? 0))
      .map((doc) => ({ doc, number: canonicalNumber.get(doc.uid) ?? null }));
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
    class="relative -mt-[193px] mx-auto max-w-4xl px-[19.5px] py-20 md:-mt-64 lg:-mt-80 lg:px-6"
  >
    <!-- Live's .qa-block width is 480px across the WHOLE ≤991 range (100% capped
         at max-width:20rem), widening to 600 only at desktop (≥992). An earlier
         `base 600, md:480` split was wrong at 650: base 600 didn't bind there
         (the max-w-4xl section is ~600 wide) so the card blew out to 600 and,
         with a fixed aspect, to 492 tall — overlapping the answer. Cap base 480. -->
    <div class="relative mx-auto max-w-[480px] lg:max-w-[600px]">
      {#if isFilled.richText(slice.primary.heading) || isFilled.image(slice.primary.side_image)}
        <!-- Live's .ask-the-doctor-handwriting-anchor: ONE anchor holds the
             hand-drawn "ask the doctor" annotation (real PNG asset, NOT a
             redrawn cursive font) AND the doctor headshot at the SAME height,
             flanking the question column 100px below its top.

             SIX OPERATOR DIRECTIVES SHAPED THIS and they are not compatible —
             3 reverses 1, 4 reverses 3, 5 reverses 4, 6 reverses 5 and lands
             back on 1. The whole record lives here because each was written by
             someone looking at the result of the previous one, and without it
             a seventh round re-derives a mechanism that has already been
             rejected:

             1. 2026-08-11 (MarkUp a7c2e0d0…, home pin #7) — "I do not like the
                jumping from question to question." Live's floating-doc.js
                quantized per question and glided with
                `.ask-the-doctor-handwriting-anchor { transition: transform 1s
                cubic-bezier(.19,1,.22,1) }` (beachfront.css:7670); a 25px
                scroll step could move it 420px. → continuous function of
                scroll.
             2. 2026-08-13 — "anchor to the top fully visible question rather
                than the bottom one." Never reversed; moot under 6, which
                tracks no question at all.
             3. 2026-08-13, after seeing 2 — "it should sit in the same place
                for each card." → quantized again.
             4. 2026-09-01 (MarkUp 717b8986…, home pin #15) — "jittery … I just
                wanted to move smoothly down as you scroll." → continuous
                again (smoothstep over 70% of each card's pitch).
             5. 2026-09-01, after seeing 4 — "the snap still feels real weird,
                stick with one spot per card, ship just the fix with an eased
                translation transition [and] probably wants a debounce."
             6. 2026-09-02, Discord, after seeing 5 — "these elements still
                jump from question to question" … "sticky on scroll through
                that section."
             7. 2026-09-02, Discord, on the build that shipped 6 — "Can we get
                the doc image and text to stop sooner" [screenshot: the pair
                still stuck over the next section's "Ready for…" headline] …
                "it also starts high" [headshot's top level with the first
                card's top] "should start here" [headshot down on the first
                card's photo]. Not a new mechanism — 6's GEOMETRY was an
                approximation of live's, and 7 is live's: see the sticky box
                below.

             6 is what runs, and it runs as `position: sticky` rather than as
             JS: the pair holds one viewport position while this column scrolls
             past and releases at its end. Every earlier mechanism was a
             mapping from scroll to transform, and every complaint (1, 4, 6)
             was about how that mapping felt. Deleting the mapping is the only
             answer that cannot be tuned wrong. Checked in
             tests/interaction/float-drift.spec.ts; do not re-litigate from
             this comment.

             Live x-geometry at 1440: handwriting's right edge 10px left of the
             column, headshot overlapping 40px INTO the column's right edge. -->
        <!-- MOBILE (measured live @390): the pair rests IN PLACE above the
             first card, right-aligned — 120px headshot 24px from the content's
             right edge with its bottom 12px above the card, the 120×70
             handwriting flush against its left edge (sticky is `lg:`-gated).
             DESKTOP: flanks the column and sticks. -->
        <!-- z-30, not z-10. The card header button is `relative z-10` and the
             cards come AFTER this wrapper in the DOM, so at equal z-index the
             tie breaks in the headers' favour and they paint over the doctor
             wherever he overlaps the column's right edge (`lg:-ml-10`, 40px).
             Live does not have this tie: its `.qa-header` computes to z-index
             5 and `.ask-the-doctor-headshot` to 9 — the doctor is four levels
             clear of the cards on purpose. Nothing here creates a stacking
             context to contain the header either: the card is `relative` with
             z-auto, and it only LOOKED contained while animateIn left an inline
             transform on it forever (a transform makes a stacking context).
             I1 made that transform release on transitionend, which is what
             exposed the tie. -->
        <!-- DIRECTIVE 6 (Tim, 2026-09-02, Discord): "these elements still jump
             from question to question" … "sticky on scroll through that
             section". The pair holds ONE viewport position while this column
             scrolls past and releases at its end — real `position: sticky`,
             not a JS emulation of it, which is why there is no longer an
             action here. `floatAlong` is deleted, not disabled.

             This reverses directives 3 and 5 and reinstates the mechanism 1
             asked for; all six are recorded above and in
             tests/interaction/float-drift.spec.ts, which is the check.

             DIRECTIVE 7 fixed the geometry to live's, which is what decides
             where the pair STARTS and where it STOPS (beachfront.css):
               :7664-7672  .ask-the-doctor-handwriting-anchor — sticky, top:0,
                           height:10rem (400px at live's ≥993 root of 40px)
               :7786       .collection-list-wrapper-4 { margin-top:-10rem } —
                           the cards are pulled up UNDER the box, so the box
                           and the first card share a top edge
               :7700       .ask-the-doctor-headshot margin-top:2.5rem = 100px
               :7682       .ask-the-doctor-handwriting margin-top:3rem = 120px
             So at rest the pair sits 100/120px down the first card, and the
             box releases when ITS bottom meets the column's — 400px before
             the column ends, i.e. with the headshot still on the last card.
             The 6 port had a zero-height box with the children at its top
             edge and the 100px moved into the sticky `top`: same stuck
             position, but 100px too high at rest and 300px too late letting
             go, which is exactly the two things Tim saw. `lg:inset-x-auto`
             undoes the mobile `inset-x-0`: on a sticky box left/right are
             stick constraints, not offsets, and the children hang off this
             box's edges via `right-full` / `left-full`. -->
        <div
          data-doctor-float
          aria-hidden="true"
          class="pointer-events-none absolute inset-x-0 top-0 z-30 lg:sticky lg:inset-x-auto lg:top-0 lg:h-[400px]"
        >
          {#if isFilled.richText(slice.primary.heading)}
            <!-- Live ships the raw handwriting PNG and turns it dark blue with
                 `.filter-to-primary-dark` — the exact computed chain below
                 (read off live 2026-08-02), not a recoloured asset. -->
            <img
              src="/annotations/ask-the-doctor.png"
              alt=""
              class="absolute right-[144px] bottom-[26px] w-[120px] max-w-none lg:top-[120px] lg:right-full lg:bottom-auto lg:mr-[10px] lg:w-[210px]"
              style="filter:brightness(0) saturate(1) invert(0.29) sepia(0.33) saturate(5.99) hue-rotate(155deg) brightness(1) contrast(0.87)"
              use:animateIn={LIVE_REVEAL}
            />
          {/if}
          {#if isFilled.image(slice.primary.side_image)}
            <div
              class="ask-the-doctor-headshot absolute right-6 bottom-[12px] w-[120px] lg:top-[100px] lg:right-auto lg:bottom-auto lg:left-full lg:-ml-10 lg:w-[200px]"
              use:animateIn={LIVE_REVEAL}
            >
              <!-- The doctor headshot beside home's question column. Measured 120/120/200 — overshoot 7.2x. -->
              <PrismicPhoto
                field={slice.primary.side_image}
                fallbackAlt=""
                sizes="(min-width: 1024px) 200px, 120px"
                class="aspect-square w-full rounded-full object-cover object-top shadow-lg"
              />
            </div>
          {/if}
        </div>
      {/if}

      <!-- Live's card gap: 12px mobile, 20px desktop (measured — the collection
           item is 300/420 tall around a 288/400 card). Each card is the shared
           QuestionCard (live's `.qa-block`); the parent only decides the column
           layout and which cards are featured. -->
      <!-- lg:-mt-[400px] = live's .collection-list-wrapper-4 margin-top:-10rem (beachfront.css:7786): the cards start under the sticky box, not after it. -->
      <ul class="flex flex-col gap-3 lg:-mt-[400px] lg:gap-5">
        {#each teaserCards as card (card.doc.uid)}
          <li>
            <QuestionCard
              doc={card.doc}
              number={card.number}
              teaser={teaserText(card.doc)}
              variant="teaser"
            />
          </li>
        {/each}
      </ul>

      <!-- Live "View All Questions" = `.button.text-color-primary`: the
           light-blue (#129ecc) bordered slab pill, 67px tall at desktop —
           not a neutral rounded-full ghost.
           DEVIATION (MarkUp thread ce17fba0-94d6-4e22-9863-8ee192b92ecc, home
           pin #10): live butts this row against the last collection item
           (probed 0px at 1440/834/390 — the `.qa-collection-list` has no
           bottom margin); Tim: "add 40px of space between button and last
           question" — the stated 40px is the mt-10. -->
      <div class="mt-10 text-center" use:animateIn={LIVE_REVEAL}>
        <a
          href="/ask-the-doctor"
          class="{pillClass(
            'cyan',
          )} px-[1em] py-[1.3em] text-[14px] leading-[0] xs:text-[15px] md:text-[20px] lg:text-[25px]"
        >
          View All Questions
        </a>
      </div>
    </div>
  </section>
{:else if slice.variation === "numbered"}
  <!-- Live "/ask-the-doctor" index: EVERY question as the same `.qa-block`
       card, laid out in a Webflow 2-column `.w-col-6` row (stacking to 1 at
       ≤767) inside `.content-width` (max-w 1400, side padding 60/36/19.5px
       measured, 8%/5% at mobile). The inter-card spacing deviates from live's
       `.w-col-6` gutter by request — see the grid comment below (MarkUp atd
       pin #2). No headshot/handwriting, no featured hero, no "View
       All" — this IS the full list. Each card's number is its canonical
       date-sorted position, the same value the home teaser prints. -->
  <section
    data-slice-type={slice.slice_type}
    data-slice-variation={slice.variation}
    class="mx-auto max-w-[1400px] px-[5%] min-[480px]:px-[8%] md:px-12 lg:px-[60px]"
  >
    {#if isFilled.richText(slice.primary.heading)}
      <div class="mb-8" use:animateIn={LIVE_REVEAL}>
        <PrismicRichText field={slice.primary.heading} />
      </div>
    {/if}
    <!-- live's `.content-width.my-8` = 2rem block margins against the stepped
         root (48/64/80px), NOT the flat 32px section padding we had: the whole
         40-card grid sat 48/32/16px high and lost the same again below.
         DEVIATION (MarkUp thread b7be52f2-11d0-467c-b4ea-ca086b9aa29f, atd
         pin #2): live spaces the cells with `.w-col-6` padding 0 10px (20px
         column gutter) and the fixed 520px `.ask-the-doctor-collection-item`
         over a 400px card (~120px empty below each card at desktop, 96px
         tablet, 12px mobile — the qa-block's own margin). Tim: "get the
         spacing between to match consistent vertically and horizontally
         between these 'modules'… Let's use 30px" — one true gap-[30px] on
         both axes at every width, per-cell padding gone. An opened card grows
         (margin-top + the ≤479 re-height) INSIDE its own grid cell, so auto
         rows push the rows below and the 30px gap holds in the open state —
         probed no-overlap at 1440/834/390. -->
    <div
      class="my-12 grid grid-cols-1 gap-[30px] md:my-16 md:grid-cols-2 lg:my-20"
    >
      {#each sortedDocs as doc, i (doc.uid)}
        <!-- `i < 2` is measured, not a round number: two cards sit inside the
             first viewport on /ask-the-doctor at BOTH widths — one column at
             390 stacks two into 900px, and the md 2-column grid puts two side
             by side. The other 38 cards stay JS-hidden. -->
        <QuestionCard
          {doc}
          number={canonicalNumber.get(doc.uid) ?? null}
          teaser={teaserText(doc)}
          firstFold={i < 2}
        />
      {/each}
    </div>
    <!-- Live closes the list with a `.content-width` row carrying a cyan
         outline `Back to Top` pill (`<a href="#hero" class="button
         text-color-primary">`). It was the only whole element missing from
         this page — and because the gate anchors on it, its absence hard-failed
         the whole ask-the-doctor run. Rect matched per the ledgered pill
         convention (match the RENDERED box, not live's line-height:0 trick):
         116.6x41 <=767 / 154.8x54 tablet / 193x67 desktop. -->
    <div class="flex items-center justify-center">
      <a
        href="#hero"
        class="{pillClass(
          'cyan',
        )} px-[1em] py-[1.3em] text-[14px] leading-[0] whitespace-nowrap xs:text-[15px] md:text-[20px] lg:text-[25px]"
      >
        Back to Top
      </a>
    </div>
  </section>
{/if}
