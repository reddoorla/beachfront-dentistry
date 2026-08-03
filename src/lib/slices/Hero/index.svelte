<script lang="ts">
  import HeroBackgroundImage from "$lib/components/HeroBackgroundImage.svelte";
  import HeroBackgroundVideo from "$lib/components/HeroBackgroundVideo.svelte";
  import RichTextBody from "$lib/components/RichTextBody.svelte";
  import CtaBand from "$lib/components/CtaBand.svelte";
  import WaveDivider from "$lib/components/WaveDivider.svelte";
  import { PrismicLink, PrismicRichText } from "@prismicio/svelte";
  import { animateIn, LIVE_REVEAL } from "$lib/actions/animateIn";
  import { asText, type Content } from "@prismicio/client";
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

  let {
    slice,
    context,
  }: {
    slice: Content.HeroSlice | HeroBandSlice | HeroCtaSlice;
    context?: { presentation?: Presentation };
  } = $props();

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
    <div
      class="z-10 mx-auto flex w-full max-w-[1360px] flex-col items-start gap-8 px-6 pt-36 pb-28 md:flex-row md:items-center md:justify-between md:gap-12"
    >
      <!-- Live reveals the hero h1 with the same rise-in as every other
           element (its H1 sits at opacity 0 / +travel until the ix2 fires). -->
      <!-- [&_h1]:text-wrap (builtin utility — the arbitrary-property form
           never applies): undoes the global h1–h6 `text-wrap: balance`, which
           was wrapping "where you / are" a word earlier than live's plain
           fill ("where you are /"). -->
      <div class="max-w-3xl [&_h1]:text-wrap" use:animateIn={LIVE_REVEAL}>
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
             right 2rem/80px of the SECTION) — the flex slot only positions it
             on mobile. Hover is live's .button hover (opacity + cyan fill). -->
        <PrismicLink
          field={slice.primary.cta_link}
          class="focus-visible:ring-offset-dark inline-flex h-[41px] shrink-0 items-center rounded-lg border border-white px-[14px] font-slab text-[15px] font-light text-white transition-[opacity,background-color] hover:bg-[#129ecc4a] hover:opacity-60 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:outline-hidden lg:absolute lg:right-20 lg:bottom-40 lg:h-[67px] lg:px-[25px] lg:text-[25px]"
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
