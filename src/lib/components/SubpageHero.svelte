<script lang="ts">
  import HeroBackgroundImage from "$lib/components/HeroBackgroundImage.svelte";
  import WaveDivider from "$lib/components/WaveDivider.svelte";
  import { animateIn, ABOVE_FOLD_REVEAL } from "$lib/actions/animateIn";
  import {
    asText,
    type ImageField,
    type RichTextField,
  } from "@prismicio/client";

  // The recurring subpage opener (live's `.hero.<page>` band): a page-specific
  // photo cover-filling a short band, a bottom-anchored centered THIN slab
  // heading in white, and the flip wave seaming into the white section below.
  // Shared by every subpage via Hero's `subpage` variation so the treatment
  // (height ladder, heading scale, wave, legibility scrim) lives in one place.
  //
  // Height ladder read off live `.hero`/`.hero.redondo`: 33vw (≥992, =475@1440)
  // / 60vw (768–991) / 70vw (480–767) / 95vw (≤479, =371@390). Heading is the
  // absolute `.subpage-hero-heading`: white font-weight-100 museo-slab, centered
  // full-width at desktop, left-aligned at 80%/left-10% below 992 (measured
  // 140px/168 @1440 → 56px/70 @390).
  let {
    heading,
    backgroundImage,
    subtitle,
    subheadings,
    intro,
    align = "center",
    headingStyle = "subpage",
    imagePosition = "center",
    wash = true,
    botGradient = "base",
    ariaLevel = 1,
  }: {
    heading?: RichTextField | null;
    backgroundImage?: ImageField | null;
    // optional cyan intro line some subpages carry directly under the heading
    subtitle?: string | null;
    // our-team's `.our-team-subtitle-section` (below the wave): stacked
    // dark-teal slab headings ("Our" / "Team") over a cyan slab intro line.
    subheadings?: string[] | null;
    intro?: RichTextField | null;
    // most subpage heroes centre the heading at desktop; contact-us keeps it
    // LEFT-aligned (live `.hero.contact`).
    align?: "center" | "left";
    /** Which of live's three heading treatments this hero uses. They are
     *  genuinely different CSS classes on live, not variations of one:
     *   • "subpage" (`.subpage-hero-heading`) — bottom:2% + margin-bottom:5%,
     *     centred full-width at >=992, left-aligned at 80%/left-10% below it.
     *   • "meet" (`.meet-heading`, our-team only) — bottom:.75rem, centred and
     *     full-width at EVERY width (grep confirms no media override).
     *   • "contact" (`.contact-heading`) — bottom:1rem, left, its own 50/75/140
     *     size ladder and padding-right:33%. Selected by align="left".
     */
    headingStyle?: "subpage" | "meet";
    /** object-position for the band photo. Live sets this PER PAGE, not once:
     *    .hero.redondo      (our-team, services)  background-position: 0 100%
     *    .hero.contact      (contact-us)          background-position: 50% 50%
     *    .hero.ask-a-dentist(ask-the-doctor)      background-position: 50% 0
     *  Applying one of them to all of them swaps which slice of the photo you
     *  see — a blanket left-bottom put plants where live's contact hero shows
     *  the office sign. */
    imagePosition?: "center" | "left-bottom" | "top";
    /** Whether this hero paints live's cyan wash at all. `/services` is the ONE
     *  page whose hero markup has NEITHER gradient div: its whole hero is
     *  `<section class="hero redondo"><div class="bot-wave">…</div><h2
     *  class="subpage-hero-heading">Services</h2></section>`
     *  (`matching/spec/services-top.html`). Counting the divs across the saved
     *  documents: index/our-team/ask-the-doctor/your-first-visit/contact-us all
     *  carry both, services carries zero. Painting them there covered ~half the
     *  region in cyan at dE 40-90. */
    wash?: boolean;
    /** Which bottom-gradient stop. Live has two and they are NOT interchangeable:
     *   • "base" (`.hero-bot-gradient`, beachfront.css:6484-6490) —
     *     `linear-gradient(#0000, #129ecccc)`, alpha 0.8, never closes.
     *   • "dark" (`.hero-bot-gradient.dark`, :6492-6494) —
     *     `linear-gradient(#0000, #129ecc 77%)`, OPAQUE from 77% down.
     *  Grepping the saved documents for `hero-bot-gradient dark`: contact-us is
     *  the only page that has it. We were emitting the opaque `.dark` stop on
     *  every subpage, which is most of the `top` mismatch on the others. */
    botGradient?: "base" | "dark";
    /** Announced heading level for the page title.
     *
     *  This band carries the ONLY title on /our-team, /services,
     *  /ask-the-doctor and /contact-us, and it renders as an `h2` to inherit
     *  live's global h2 size ladder. That left those four pages with no
     *  level-1 heading at all (verified against the prerendered build), so
     *  screen-reader users navigating by top-level heading got nothing and the
     *  document outline started at level 2 with no root.
     *
     *  Overriding the ANNOUNCED level rather than the tag keeps the visual size
     *  byte-identical — the same technique RichTextHeading.svelte:24 already
     *  uses. `role="heading"` is emitted alongside so axe's
     *  `page-has-heading-one` rule, which matches `h1` or
     *  `[role=heading][aria-level=1]`, is satisfied too. */
    ariaLevel?: number;
  } = $props();

  /** Scroll target for the "Back to Top" pill that closes the question list.
   *
   *  Live carries `id="hero"` on exactly one page — `<section id="hero"
   *  class="hero ask-a-dentist">` on /ask-the-doctor — because that is the only
   *  page whose content ends in `<a href="#hero">`. We copied the pill verbatim
   *  (QuestionList/index.svelte:242) but never the id, so the link went
   *  nowhere AND `pnpm build` hard-failed: SvelteKit's prerenderer resolves
   *  every in-page anchor and errors on a missing target.
   *
   *  Emitted here rather than only on ask-the-doctor because an `id` is inert —
   *  invisible to the pixel gate and the style census — and scoping it would
   *  mean teaching the hero which sibling slices its page has. The divergence
   *  is one unused attribute on three subpage heroes; the alternative is a dead
   *  link on the page live actually uses it. */
  const ANCHOR_ID = "hero";

  const objectPos = $derived(
    imagePosition === "left-bottom"
      ? "object-left-bottom"
      : imagePosition === "top"
        ? "object-top"
        : "object-center",
  );

  const headingText = $derived(asText((heading ?? []) as RichTextField));
  const introText = $derived(asText((intro ?? []) as RichTextField));
</script>

<section
  id={ANCHOR_ID}
  data-slice-type="hero"
  data-slice-variation="subpage"
  class="relative isolate flex min-h-[95vw] w-full items-center justify-center overflow-hidden bg-dark text-white xs:min-h-[70vw] md:min-h-[60vw] lg:min-h-[33vw]"
>
  {#if backgroundImage?.url}
    <!-- Anchor per live's own per-page rule — see `imagePosition`. -->
    <HeroBackgroundImage
      image={backgroundImage}
      preload={true}
      class="absolute bottom-0 left-0 h-full w-full object-cover {objectPos}"
    />
  {/if}
  <!-- Live's hero overlay is a CYAN wash, not a neutral scrim: a cyan top-tint
       fading out over the top QUARTER (`.hero-top-gradient{height:25%}`,
       beachfront.css:6477-6482) plus a transparent→cyan bottom wash over the
       bottom half (`.hero-bot-gradient`, :6484-6490). Both are real <div>s in
       live's markup, so a page that omits them gets no wash at all — see
       `wash`. -->
  {#if wash}
    <div
      class="pointer-events-none absolute inset-x-0 top-0 h-1/4"
      style="background:linear-gradient(rgba(18,158,204,0.8), rgba(0,0,0,0))"
      aria-hidden="true"
    ></div>
    <!-- base = `linear-gradient(#0000, #129ecccc)` (alpha 0.8, never closes);
         dark = `linear-gradient(#0000, #129ecc 77%)` (opaque from 77% down) and
         is contact-us ONLY. See `botGradient`. -->
    <div
      class="pointer-events-none absolute inset-x-0 bottom-0 h-1/2"
      style="background:linear-gradient(rgba(0,0,0,0), {botGradient === 'dark'
        ? '#129ecc 77%'
        : 'rgba(18,158,204,0.8)'})"
      aria-hidden="true"
    ></div>
  {/if}
  <!-- Live's three heading treatments (see `headingStyle`). They used to carry
       live's own bottom rem values against its stepped root (24/32/40):
         subpage  bottom:2%      + margin-bottom:5% of the hero WIDTH
         meet     bottom:.75rem  → 18/24/30 + the h2's 10px = 28/34/40 measured
         contact  bottom:1rem    → 24/32/40 + the h2's 10px = 34/42/50 measured
       All three put the heading INSIDE the wave divider's box, and the white
       crest cut through it at every width — probed overlap, worst per variant:
         subpage (services, ask-the-doctor)  −27.3 @390  −24.9 @834  −10.5 @1440
         meet    (our-team)                  −26.2 @390  −31.7 @834  −42.9 @1440
         contact                             −16.2 @390  −36.6 @834  −42.0 @1440
       Operator, MarkUp thread 7dd0c2f2: "wave should never touch the text". So
       the bottom offset is now the divider's own box-height ladder
       (WaveDivider `heightClass`, 72/96/120) on all three — the heading clears
       the whole box, which is 30% more room than the crest strictly needs and
       is the version anyone can check by eye. Live's ladder is a DELIBERATE
       DEVIATION now (see matching/LEDGER.md, MARKUP ROUND H4): the wave is no
       longer held to the webflow reference, so neither is the clearance it
       demands. The band's height does not change — these are absolute boxes,
       so nothing below the hero moves. -->
  <div
    class="absolute z-10 bottom-[72px] md:bottom-[96px] lg:bottom-[120px] {align ===
    'left'
      ? 'mx-auto w-full max-w-[1400px] px-[5%] xs:px-[8%] md:px-[48px] lg:px-[60px]'
      : headingStyle === 'meet'
        ? 'left-0 w-full'
        : 'left-[10%] w-4/5 lg:left-0 lg:w-full'}"
    data-reveal
    use:animateIn={ABOVE_FOLD_REVEAL}
  >
    <!-- Inline white: the unlayered global `main h1–h3` primary-colour rule
         outranks a `text-white` utility (same trap as the QA card title), so
         force the live white heading with an inline style.
         Size ladder — live's GLOBAL h2 rule, which has no <=767 block, so 72/80
         holds flat all the way from 480 to 991 (an md tier at 90/108 was
         inventing a step live does not have, and wrapped "Ask the Doctor" to
         two lines at 768):
           <=479  56/70      480-991  72/80      >=992  140/168
         contact overrides the SIZE only (50 <=767, 75 at 480-991, 140 >=992). -->
    <!-- role="heading" is redundant on an h2 for screen readers, which honour
         aria-level on the native element regardless. It is kept deliberately
         because axe's `page-has-heading-one` matches only `h1:not([role])` or
         `[role=heading][aria-level=1]` — an `h2 aria-level="1"` alone would
         satisfy assistive tech but still be reported as a page with no level-1
         heading by Lighthouse or a best-practice axe run. The tag itself cannot
         become an h1: live's global rules key off h1 vs h2 (the `main h1-h3`
         cyan rule, `h1{margin-bottom:10px}`), so swapping it would move pixels. -->
    <!-- svelte-ignore a11y_no_redundant_roles -->
    <h2
      class="font-slab font-thin {align === 'left'
        ? 'text-left text-[50px] leading-[70px] xs:leading-[80px] md:text-[75px] md:leading-[80px] lg:pr-[33%] lg:text-[140px] lg:leading-[168px]'
        : headingStyle === 'meet'
          ? 'text-center text-[56px] leading-[70px] xs:text-[72px] xs:leading-[80px] lg:text-[140px] lg:leading-[168px]'
          : 'text-left text-[56px] leading-[70px] xs:text-[72px] xs:leading-[80px] lg:text-center lg:text-[140px] lg:leading-[168px]'}"
      style="color:#fff"
      role="heading"
      aria-level={ariaLevel}
    >
      {headingText}
    </h2>
    {#if subtitle}
      <p
        class="font-slab mt-2 text-left text-[20px] leading-[30px] font-light text-white lg:text-center lg:text-[30px] lg:leading-[45px]"
      >
        {subtitle}
      </p>
    {/if}
  </div>
  <!-- Live's hero wave (`.bot-wave.flip`): rotate(180) so the white
       next-section edge waves UP into the band. -->
  <div class="absolute bottom-0 left-0 z-10 w-full">
    <WaveDivider fill="white" flip />
  </div>
</section>

{#if subheadings?.length || introText}
  <!-- `.our-team-subtitle-section`: below the wave on white — two stacked slab
       headings (dark-teal #365B6D, same 56/70 → 140/168 scale as the band
       heading) over the cyan slab intro (#129ECC). Colours forced inline for
       the same reason as the band heading (global `main h1–h3` primary rule). -->
  <!-- Above the fold on /our-team at both 390 and 1440 (measured: it is the
       second reveal target inside the first viewport there), so it takes the
       server-rendered hidden state too. -->
  <section
    data-reveal
    class="w-full bg-white px-5 text-center"
    use:animateIn={ABOVE_FOLD_REVEAL}
  >
    {#each subheadings ?? [] as line (line)}
      <!-- The first heading used to carry `-mt-[10px]` — "nudges up 10px into
           the wave, matching live". Round H4 removed it: it was the only text
           on the site sitting INSIDE a divider's box from below, which is the
           same defect as the headings that sat inside it from above (operator,
           MarkUp thread 7dd0c2f2: "wave should never touch the text"). Probed
           overlap with the wave's painted extent was −10.0 @390/@1294/@1440 and
           −14.0 @834; against the wave's visible CURVED edge the margin was
           6.8px @390, under the 8px this round enforces. At 0 the heading
           clears that edge by 16.8/18.4/28px. DELIBERATE DEVIATION from live —
           the nudge existed only to tuck the heading under a wave the operator
           has since released from the reference. Costs our-team 10px of height,
           all of it inside the hero's own `top` region.
           Same global h2 ladder as the band heading: 56/70 -> 72/80 (480-991,
           flat) -> 140/168. -->
      <h2
        class="font-slab text-[56px] leading-[70px] font-thin xs:text-[72px] xs:leading-[80px] lg:text-[140px] lg:leading-[168px]"
        style="color:#365b6d"
      >
        {line}
      </h2>
    {/each}
    {#if introText}
      <!-- capped narrow so it wraps to ~5 lines exactly as live does. -->
      <!-- Live keeps 20/30 from 480-767 (its `.text-align-center.max-w-620px`
           rule) and only steps to the global h3 21/26 at 768-991. -->
      <h3
        class="font-slab mx-auto mt-5 mb-[10px] max-w-[620px] text-[20px] leading-[30px] font-light md:text-[21px] md:leading-[26px] lg:text-[40px] lg:leading-[50px]"
        style="color:#129ecc"
      >
        {introText}
      </h3>
    {/if}
  </section>
{/if}
