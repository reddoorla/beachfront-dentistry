<script lang="ts">
  import HeroBackgroundImage from "$lib/components/HeroBackgroundImage.svelte";
  import HeroBackgroundVideo from "$lib/components/HeroBackgroundVideo.svelte";
  import RichTextBody from "$lib/components/RichTextBody.svelte";
  import CtaBand from "$lib/components/CtaBand.svelte";
  import WaveDivider from "$lib/components/WaveDivider.svelte";
  import SubpageHero from "$lib/components/SubpageHero.svelte";
  import { PrismicLink, PrismicRichText } from "@prismicio/svelte";
  import { animateIn, LIVE_REVEAL } from "$lib/actions/animateIn";
  import { pillClass } from "$lib/components/OutlineButton.svelte";
  import {
    asText,
    type Content,
    type ImageField,
    type RichTextField,
  } from "@prismicio/client";
  import { bandFor, type Presentation } from "$lib/blux/presentation";
  import BluxSectionBand from "$lib/blux/SectionBand.svelte";
  import BandContent from "$lib/blux/BandContent.svelte";
  import BandTitle from "$lib/blux/BandTitle.svelte";

  // The `band` variation is not in the generated prismic types yet
  // (regenerating them needs a wired Prismic repo), so widen the union locally.
  type HeroBandSlice = {
    slice_type: "hero";
    variation: "band";
    primary: {
      band?: number | null;
      heading?: string | null;
      subtitle?: string | null;
      body?: string | null;
    };
    items: unknown[];
  };

  // `cta` is likewise absent from the generated types (same reason). Its
  // primary fields are identical to `default`'s (model.json says so
  // explicitly), so reuse that generated primary shape rather than
  // re-declaring it.
  type HeroCtaSlice = {
    slice_type: "hero";
    variation: "cta";
    primary: Content.HeroSliceDefaultPrimary;
    items: unknown[];
  };

  // The `subpage` variation (the shared SubpageHero band) is likewise not in the
  // generated types yet — widen locally, same as `band`/`cta`.
  type HeroSubpageSlice = {
    slice_type: "hero";
    variation: "subpage";
    primary: {
      heading?: RichTextField | null;
      background_image?: ImageField | null;
      subtitle?: string | null;
      // Modeled as StructuredText (heading2 blocks) so it round-trips through
      // Prismic — SubpageHero still takes a plain string[]; we map below.
      subheadings?: RichTextField | null;
      intro?: RichTextField | null;
      // our-team's band uses live's `.meet-heading` (centred and full-width at
      // EVERY width, bottom .75rem) rather than `.subpage-hero-heading`.
      heading_style?: "subpage" | "meet" | null;
      // live sets the band photo anchor per page (see SubpageHero.imagePosition)
      image_position?: "center" | "left-bottom" | "top" | null;
      // `/services` is the one page whose hero markup omits BOTH gradient divs
      // (matching/spec/services-top.html) — see SubpageHero.wash.
      hero_wash?: boolean | null;
    };
    items: unknown[];
  };
  // `groupphoto` = your-first-visit's `.hero.group-photo`: a shorter photo band
  // (min(60vh,60vw) / 95vw) with a LOWER-LEFT thin slab headline, NO CTA.
  type HeroGroupPhotoSlice = {
    slice_type: "hero";
    variation: "groupphoto";
    primary: {
      heading?: RichTextField | null;
      background_image?: ImageField | null;
    };
    items: unknown[];
  };

  let {
    slice,
    context,
  }: {
    slice:
      | Content.HeroSlice
      | HeroBandSlice
      | HeroCtaSlice
      | HeroSubpageSlice
      | HeroGroupPhotoSlice;
    context?: { presentation?: Presentation };
  } = $props();

  // The subpage `subheadings` field is StructuredText (heading2 blocks) so it
  // round-trips through Prismic; SubpageHero wants a plain string[] — pull the
  // text off each block (tolerant of an already-flat string[] from older data).
  const blocksToLines = (rt?: RichTextField | null): string[] =>
    ((rt ?? []) as RichTextField)
      .map((b) => ("text" in b ? b.text : ""))
      .filter((t) => t.length > 0);

  let hasImage = $derived(
    slice.variation === "default" && !!slice.primary.background_image?.url,
  );

  // The home hero is a background VIDEO on the live site (a muted drone
  // flyover); every other `default` hero (e.g. your-first-visit) is a genuine
  // still. The Prismic poster URL for the home hero still carries the source
  // video's name ("homepage_video"), so we use that as the marker to swap in
  // the self-hosted video. Assets live in static/hero/ (see HeroBackgroundVideo).
  const heroImageUrl = $derived(
    slice.variation === "default"
      ? (slice.primary.background_image?.url ?? "")
      : "",
  );
  let isVideoHero = $derived(heroImageUrl.includes("homepage_video"));
  const HERO_VIDEO = {
    poster: "/hero/beachfront-hero-poster.jpg",
    webm: "/hero/beachfront-hero.webm",
    mp4: "/hero/beachfront-hero.mp4",
  };

  const band = $derived(
    bandFor(
      context?.presentation,
      (slice.primary as { band?: number | null }).band ?? null,
    ),
  );

  // Live sets the practice name in bold within the hero headline. The Prismic
  // heading field's model disallows inline bold, so split the brand phrase out
  // and emphasise it at render time; the rest of the h1 keeps the light display
  // weight. Falls back to plain rich text when the phrase isn't present.
  const BRAND = "Beachfront Dentistry";
  const heroHeadingText = $derived(
    slice.variation === "default" ? asText(slice.primary.heading) : "",
  );
  const brandParts = $derived.by(() => {
    const at = heroHeadingText.indexOf(BRAND);
    if (at < 0) return null;
    return {
      before: heroHeadingText.slice(0, at),
      brand: BRAND,
      after: heroHeadingText.slice(at + BRAND.length),
    };
  });
</script>

{#if slice.variation === "band"}
  <!-- Blux band hero: background media + block style from the presentation
       manifest, overlay text from the page doc, roles from band.text. Above
       the fold — eagerBackground keeps the LCP image eager and skips the
       scroll reveal. -->
  <BluxSectionBand
    {band}
    eagerBackground
    sliceType={slice.slice_type}
    sliceVariation={slice.variation}
  >
    <BandContent {band} class="relative z-10">
      <BandTitle
        heading={slice.primary.heading}
        subtitle={slice.primary.subtitle}
        text={band?.text}
      />
      {#if slice.primary.body}<p class="txt-role-text1 mt-4">
          {slice.primary.body}
        </p>{/if}
    </BandContent>
  </BluxSectionBand>
{:else if slice.variation === "cta"}
  <!-- Photo CTA band: the site's recurring "Ready for great dental health?"
       band. The markup + the a11y/contrast decisions (scrim math, wave
       placement, pill-button pairing, focus-ring offset) live in
       CtaBand.svelte, which this variation shares with the
       services/questions/team-members detail routes (they render it with no
       props and get its defaults; this slice passes its own primary fields
       through instead). -->
  <CtaBand
    heading={slice.primary.heading}
    body={slice.primary.body}
    ctaLabel={slice.primary.cta_label}
    ctaLink={slice.primary.cta_link}
    backgroundImage={slice.primary.background_image}
    caption="FIJI ISLANDS"
    sliceType={slice.slice_type}
    sliceVariation={slice.variation}
  />
{:else if slice.variation === "subpage"}
  <!-- Subpage opener: the shared SubpageHero band (measured spec lives in the
       component). Delegates like the `cta` variation does to CtaBand. -->
  <SubpageHero
    heading={slice.primary.heading}
    backgroundImage={slice.primary.background_image}
    subtitle={slice.primary.subtitle}
    subheadings={blocksToLines(slice.primary.subheadings)}
    intro={slice.primary.intro}
    headingStyle={slice.primary.heading_style ?? "subpage"}
    imagePosition={slice.primary.image_position ?? "center"}
    wash={slice.primary.hero_wash ?? true}
  />
{:else if slice.variation === "groupphoto"}
  <!-- The reference hard-breaks this headline after "meet" ("We are excited
       to meet <br>and care for you.", your-first-visit.html:121). The break
       cannot live in the seeded StructuredText — the Migration API strips
       `\n` (docs/migration.md) — so the component restates it, falling back
       to the plain text when the heading doesn't contain "meet". -->
  {@const gpHeading = asText(slice.primary.heading) ?? ""}
  {@const gpBreak = gpHeading.match(/^(.*\bmeet)\s+(\S.*)$/)}
  <!-- your-first-visit `.hero.group-photo`: a short photo band with a
       lower-LEFT thin slab headline in white and NO CTA. Same wave + scrim as
       the other openers.

       It has its OWN four-step height ladder, distinct from the `.hero.redondo`
       one every other subpage uses — and the top step is viewport-HEIGHT based
       while the rest are width-based:
         ≥992  `height:60vh; max-height:60vw`   (beachfront.css:5322-5328) = 540
         ≤991  `height:70vw; max-height:100vw`  (:7984-7990)               = 583.8
         ≤767  `height:80vh; max-height:70vw`   (:8451-8454)
         ≤479  `height:95vw; max-height:none`   (:9082-9086)               = 370.5
       We had only two steps (95vw / min(60vh,60vw)), so the whole 480–991 band
       rendered the DESKTOP value: 500.4 at 834 against live's 583.8. -->
  <section
    data-slice-type={slice.slice_type}
    data-slice-variation={slice.variation}
    class="relative isolate flex min-h-[95vw] w-full items-end overflow-hidden bg-dark text-white xs:min-h-[min(80vh,70vw)] md:min-h-[70vw] lg:min-h-[min(60vh,60vw)]"
  >
    {#if slice.primary.background_image?.url}
      <!-- The ≤991 rule (beachfront.css:7984-7990) does not just change the
           height — it reframes the photo: `background-position: 0%` (left, with
           vertical defaulting to 50%) and `background-size: 115%` (115% of the
           container WIDTH, height auto), where ≥992 is plain
           `background-size: cover; background-position: 50%` (:5322-5328).
           Translated for an <img>: 115% wide, height auto, left-anchored and
           vertically centred — object-fit no longer applies once width and
           height are set explicitly.

           But this is a THREE-step ladder, not two: at ≤479 `:9082-9086` puts
           `background-size` back to `cover` while `background-position: 0%`
           from `:7985` still cascades. So the 115% framing is the 480–991 band
           ONLY. Applying it at ≤479 as well took `top` @390 from 42.2% to
           47.6% (matching/out-spec14-yfv). -->
      <HeroBackgroundImage
        image={slice.primary.background_image}
        preload={true}
        class="absolute inset-0 h-full w-full object-cover object-left lg:object-center xs:max-lg:inset-auto xs:max-lg:top-1/2 xs:max-lg:left-0 xs:max-lg:h-auto xs:max-lg:w-[115%] xs:max-lg:max-w-none xs:max-lg:-translate-y-1/2"
      />
    {/if}
    <!-- Live's group-photo hero carries the SAME two cyan overlay divs as the
         other openers, not a neutral scrim: `.hero-top-gradient`
         `linear-gradient(#129ecccc, #0000)` over the top 25%
         (beachfront.css:6477-6482) and `.hero-bot-gradient`
         `linear-gradient(#0000, #129ecccc)` over the bottom 50% (:6484-6490),
         both at alpha 0.8 — the `.dark` variant is contact-us only. We were
         painting a single `rgba(0,0,0,0.32)` dark wash, which is the bulk of
         this region's 44.7-72.5% mismatch (dE 17.8-29.8). -->
    <div
      class="pointer-events-none absolute inset-x-0 top-0 h-1/4"
      style="background:linear-gradient(rgba(18,158,204,0.8), rgba(0,0,0,0))"
      aria-hidden="true"
    ></div>
    <div
      class="pointer-events-none absolute inset-x-0 bottom-0 h-1/2"
      style="background:linear-gradient(rgba(0,0,0,0), rgba(18,158,204,0.8))"
      aria-hidden="true"
    ></div>
    <!-- MarkUp 4b8d52d2 thread ed09da97-36ac-4ad9-b796-c53c5a0f580c (pin #1):
         "Same left alignment issue, and then this headline should stack. See
         original site." Live-FIDELITY fix: live's h1 is `.first-visit-heading`
         inside `.content-width` with no `left` of its own
         (your-first-visit.html:121; beachfront.css:6593-6605), so its static
         position IS the content gutter — probed on the ref at 80/60/60/48/19.5
         for 1440/1354/1294/834/390. Our `left-5 lg:left-20` (20px fixed,
         80px fixed) matched live at exactly 1440 and nowhere else. Ladder:
         5% ≤479 (beachfront.css:9164-9167), 8% ≤767 (:8627-8630), 48px
         768-991 / max(60px, 50% − 640px) ≥992 (:5858-5867 against the
         stepped root). -->
    <!-- Bottom offset = the wave divider's own box height ladder
         (WaveDivider `heightClass`, 72/96/120). Operator, MarkUp thread
         7dd0c2f2: "wave should never touch the text" — at bottom-[24px] /
         lg:bottom-20 this heading sat INSIDE the divider box and the white
         crest ran straight through it (probed −27.2px @390, −30.0 @834,
         −12.0 @1440 of overlap). Clearing the whole box, rather than just the
         crest's 76.67% of it, keeps the rule checkable by eye and leaves a
         measured 11.8/17.4/23px of daylight. The band's height is unchanged —
         this is an absolute box, so nothing below it moves. -->
    <div
      class="absolute bottom-[72px] left-[5%] z-10 xs:left-[8%] md:bottom-[96px] md:left-12 lg:bottom-[120px] lg:left-[max(60px,calc(50%_-_640px))]"
      use:animateIn={LIVE_REVEAL}
    >
      <!-- Inline white: the global `main h1–h3` primary rule outranks text-white. -->
      <h1
        class="font-slab text-left text-[25px] leading-[38px] font-light lg:text-[60px] lg:leading-[72px]"
        style="color:#fff"
      >
        <!-- Reference keeps the space before the break ("meet <br>and",
             your-first-visit.html:121) — kept so textContent stays two words. -->
        {#if gpBreak}{gpBreak[1]}
          <br />{gpBreak[2]}{:else}{gpHeading}{/if}
      </h1>
    </div>
    <div class="absolute bottom-0 left-0 z-10 w-full">
      <WaveDivider fill="white" flip />
    </div>
  </section>
{:else}
  <!-- Full-bleed opening hero. Bottom-left slab heading over the background
       media — an autoplaying muted flyover video on home (matching the live
       site), a genuine still on every other default hero — plus a
       bottom-weighted gradient scrim for legibility, a pill CTA, and the wave
       divider seaming into the white section below. `hero-band` drives the
       90vh first-child height and the white heading colour (app.css). The band
       stays `bg-dark` so it reads as a deliberate dark canvas if the media is
       ever absent, rather than blank. -->
  <section
    data-slice-type={slice.slice_type}
    data-slice-variation={slice.variation}
    class="hero-band relative isolate flex min-h-[80vh] w-full items-end overflow-hidden bg-dark text-white"
  >
    {#if isVideoHero}
      <HeroBackgroundVideo
        poster={HERO_VIDEO.poster}
        webm={HERO_VIDEO.webm}
        mp4={HERO_VIDEO.mp4}
        preload={true}
      />
    {:else if hasImage}
      <HeroBackgroundImage
        image={slice.primary.background_image}
        preload={true}
      />
    {/if}
    <!-- Live's overlay is THREE BANDS, not three full-height washes (measured
         off the original with the matching-a-page chrome probe: top tint box
         = top 25%, the cyan + sand boxes = the bottom 50%). A cyan top tint
         fades out within the top quarter; the bottom half carries a
         transparent→solid-cyan wash (full at 65% of its OWN height) with a sand
         fade (transparent to 31%, then sand) on top of it. The middle band is
         deliberately left CLEAR so the video reads through — the earlier
         inset-0 layers washed the entire hero cyan (the "overlay's wrong" bug).
         The white headline sits over the solid cyan+sand lower band. -->
    <div
      class="absolute inset-x-0 top-0 h-1/4"
      style="background:linear-gradient(rgba(18,158,204,0.8), rgba(0,0,0,0))"
    ></div>
    <div
      class="absolute inset-x-0 bottom-0 h-1/2"
      style="background:linear-gradient(rgba(0,0,0,0), rgb(18,158,204) 65%)"
    ></div>
    <div
      class="absolute inset-x-0 bottom-0 h-1/2"
      style="background:linear-gradient(rgba(18,158,204,0) 31%, rgb(182,170,145))"
    ></div>
    <!-- Not `relative`: the CTA pill inside anchors to the SECTION at desktop
         (live's .position-absolute-bottom-right offsets from the hero itself);
         z-10 still applies — this is a flex item, which stacks with z-index
         without needing a positioned box. -->
    <!-- MarkUp d486b3c5 thread ebedbcc9-3c30-42e5-b3f4-7089fe36be86 (pin #1):
         "Needs to left align to the headline below and the logo above."
         This is a live-FIDELITY fix, not a deviation: live's h1 sits in the
         `.content-width` gutter (beachfront.css:5858-5867, 8%≤767 :8627-8630,
         5%≤479 :9164-9167 — probed on the reference at 80/60/60/48/19.5 for
         1440/1294/1200/834/390). The original build's box (max-w-1360 + px-6
         → h1 x=64/24/24) matched nothing; the video region's pixel floor hid
         it. See LEDGER 2026-08-10. -->
    <div
      class="z-10 mx-auto flex w-full max-w-[1400px] flex-col items-start gap-8 px-[5%] pt-36 pb-28 xs:px-[8%] xs:pt-16 xs:pb-12 md:flex-row md:items-center md:justify-between md:gap-12 md:px-12 md:pt-36 md:pb-28 lg:px-[60px]"
    >
      <!-- Live reveals the hero h1 with the same rise-in as every other
           element (its H1 sits at opacity 0 / +travel until the ix2 fires). -->
      <!-- [&_h1]:text-wrap (builtin utility — the arbitrary-property form
           never applies): undoes the global h1–h6 `text-wrap: balance`, which
           was wrapping "where you / are" a word earlier than live's plain
           fill ("where you are /"). -->
      <div
        class="max-w-3xl [&_h1]:text-wrap max-lg:[&_h1]:text-[28px] max-lg:[&_h1]:leading-[38px]"
        use:animateIn={LIVE_REVEAL}
      >
        {#if brandParts}
          <h1>
            {brandParts.before}<strong>{brandParts.brand}</strong
            >{brandParts.after}
          </h1>
        {:else}
          <PrismicRichText field={slice.primary.heading} />
        {/if}
        <RichTextBody field={slice.primary.body} />
      </div>
      {#if slice.primary.cta_label && slice.primary.cta_link}
        <!-- Live pins the pill to the hero's bottom-right at desktop
             (.button.position-absolute-bottom-right.home: bottom 4rem/160px,
             right 2rem — beachfront.css:6073-6076 — measured against live's
             `.content-width`, so its right edge sits gutter+20px in:
             1340@1440, 1214@1294). MarkUp d486b3c5 thread
             2c0b1886-c579-43c0-aa70-d8c1f274c520 (pin #2): "right align to
             the hamburger menu" — the hamburger's icon edge IS the content
             gutter, so the pill's right offset is now the gutter itself:
             max(60px, 50% − 640px) of the full-width section = 60px below
             1400, (w−1400)/2+60 above (= 80 at 1440, where the old right-20
             already happened to equal the gutter). Deliberate +20px deviation
             from live below 1400. See LEDGER 2026-08-10. The flex slot still
             positions it on mobile. Hover is live's .button hover. -->
        <PrismicLink
          field={slice.primary.cta_link}
          class="{pillClass(
            'white',
          )} focus-visible:ring-offset-dark shrink-0 px-[1em] py-[1.3em] text-[15px] leading-[0] md:text-[20px] lg:absolute lg:right-[max(60px,calc(50%_-_640px))] lg:bottom-40 lg:text-[25px]"
        >
          {slice.primary.cta_label}
        </PrismicLink>
      {/if}
    </div>
    <!-- Live's hero wave (.bot-wave) sits at the section bottom and is
         transform: rotate(180deg) — the white next-section edge waves UP into
         the hero. `flip` applies that rotation (which also mirrors it
         horizontally, so the overflowing wave reads right-aligned like live). -->
    <div class="absolute bottom-0 left-0 z-10 w-full">
      <WaveDivider fill="white" flip />
    </div>
  </section>
{/if}
