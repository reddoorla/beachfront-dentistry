<script lang="ts">
  import HeroBackgroundImage from "$lib/components/HeroBackgroundImage.svelte";
  import WaveDivider from "$lib/components/WaveDivider.svelte";
  import { animateIn, LIVE_REVEAL } from "$lib/actions/animateIn";
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
  } = $props();

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
  <!-- Live's hero overlay is a CYAN wash, not a neutral scrim (measured off
       `.hero.contact`): a cyan top-tint fading out over the top third + a
       transparent→solid-cyan bottom wash (full by 77% of its own height). This
       is what makes the white thin heading read over a bright photo (the plain
       dark scrim left "Contact Us" washed out over the loaded office shot). -->
  <!-- `.hero-top-gradient{height:25%}` — a quarter, not a third. -->
  <div
    class="pointer-events-none absolute inset-x-0 top-0 h-1/4"
    style="background:linear-gradient(rgba(18,158,204,0.8), rgba(0,0,0,0))"
    aria-hidden="true"
  ></div>
  <!-- `.hero-bot-gradient.dark{background-image:linear-gradient(#0000,#129ecc 77%)}`
       — SOLID cyan from 77% down, not an 0.8 alpha that never closes. The
       0.8 cap let the office sign in the contact photo read straight through
       a wash live paints out completely. -->
  <div
    class="pointer-events-none absolute inset-x-0 bottom-0 h-1/2"
    style="background:linear-gradient(rgba(0,0,0,0), #129ecc 77%)"
    aria-hidden="true"
  ></div>
  <!-- Live's three heading treatments (see `headingStyle`). The bottom offsets
       are live's own rem values against its stepped root (24/32/40):
         subpage  bottom:2%      + margin-bottom:5% of the hero WIDTH
         meet     bottom:.75rem  → 18/24/30 + the h2's 10px = 28/34/40 measured
         contact  bottom:1rem    → 24/32/40 + the h2's 10px = 34/42/50 measured
       For an abspos box with top:auto and bottom set, a percentage margin-bottom
       resolves against the containing block's WIDTH and shifts the box UP —
       that 5% is why live's subpage headings clear the wave crest and ours sat
       72px lower, right on top of it. -->
  <div
    class="absolute z-10 {align === 'left'
      ? 'bottom-[34px] mx-auto w-full max-w-[1400px] px-[5%] xs:px-[8%] md:bottom-[42px] md:px-[48px] lg:bottom-[50px] lg:px-[60px]'
      : headingStyle === 'meet'
        ? 'bottom-[28px] left-0 w-full md:bottom-[34px] lg:bottom-[40px]'
        : 'bottom-[2%] left-[10%] mb-[5%] w-4/5 lg:left-0 lg:w-full'}"
    use:animateIn={LIVE_REVEAL}
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
    <h2
      class="font-slab font-thin {align === 'left'
        ? 'text-left text-[50px] leading-[70px] xs:leading-[80px] md:text-[75px] md:leading-[80px] lg:pr-[33%] lg:text-[140px] lg:leading-[168px]'
        : headingStyle === 'meet'
          ? 'text-center text-[56px] leading-[70px] xs:text-[72px] xs:leading-[80px] lg:text-[140px] lg:leading-[168px]'
          : 'text-left text-[56px] leading-[70px] xs:text-[72px] xs:leading-[80px] lg:text-center lg:text-[140px] lg:leading-[168px]'}"
      style="color:#fff"
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
  <section class="w-full bg-white px-5 text-center" use:animateIn={LIVE_REVEAL}>
    {#each subheadings ?? [] as line, i (line)}
      <!-- first heading nudges up 10px into the wave, matching live. -->
      <!-- Same global h2 ladder as the band heading: 56/70 -> 72/80 (480-991,
           flat) -> 140/168. -->
      <h2
        class="font-slab text-[56px] leading-[70px] font-thin xs:text-[72px] xs:leading-[80px] lg:text-[140px] lg:leading-[168px] {i ===
        0
          ? '-mt-[10px]'
          : ''}"
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
