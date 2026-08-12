<script lang="ts">
  import { asLink, isFilled } from "@prismicio/client";
  import DetailHero from "$lib/components/DetailHero.svelte";
  import DetailIntro from "$lib/components/DetailIntro.svelte";
  import DetailBody from "$lib/components/DetailBody.svelte";
  import OutlineButton from "$lib/components/OutlineButton.svelte";
  import CtaBand from "$lib/components/CtaBand.svelte";
  import { splitLede } from "./lede";
  import type { PageData } from "./$types";

  // Matches live `/services/<uid>`: a shared reception-photo hero with a
  // "Services / <category>" breadcrumb, then the big cyan title + cyan
  // right-indented lede, then the dark body, then the shared closing CTA.

  let { data }: { data: PageData } = $props();

  // The body's opening paragraph reads as the page's lede — split out of body
  // (collection_item has no separate excerpt field), never duplicated. See
  // $lib/detail-lede.
  const split = $derived(splitLede(data.doc.data.body));

  // Live's service hero is the service's OWN image (an <img> over the `.hero
  // .reception` band — e.g. dental-exams shows "running-into-our-golden-years",
  // implants show the implant diagram). doc.data.media is the Prismic-migrated
  // version. The shared reception photo is only the base that shows through
  // when a service has no media; it now comes from the `settings` singleton
  // rather than /static, so the fallback rides the same imgix ladder the
  // service's own image always did. See $lib/site-settings.
  const heroImage = $derived(
    isFilled.image(data.doc.data.media)
      ? data.doc.data.media
      : data.siteImages.serviceHero,
  );
  const crumb = $derived(
    `Services${data.category ? ` / ${data.category}` : ""}`,
  );

  // The live site embeds a YouTube player via this doc's `link` field on
  // services that have one — anything else (or an unfilled field) renders none.
  const linkHref = $derived(asLink(data.doc.data.link));
  const youtubeUrl = $derived(
    linkHref?.includes("youtube.com/embed") ? linkHref : undefined,
  );
</script>

<DetailHero backgroundImage={heroImage} label={crumb} labelSize="crumb" />

<DetailIntro title={data.title} lede={split.lede} titleSize="xl" />

<!-- Live's `.service-page-body-section`: ~263px above the body heading, then
     the body copy, then a centered "Back to All Services" pill (~80px above and
     below) before the closing CTA. -->
<!-- Top gap is a MARGIN, not padding: page-diff cuts the region at this
     section's box top, so padding-top would fold the gap into the body region
     (mismatching live, whose gap sits above the "What to expect" heading). -->
<section
  class="mx-auto mt-14 max-w-[1440px] px-5 md:px-12 lg:mt-[100px] lg:px-20"
>
  <!-- Live's body column is `._w-80pc.su-w-full-mobile.w-richtext`: 80%
       (`beachfront.css:3561-3563`) dropping to 100% at <=767 (`:8426-8428`).
       `max-w-[1024px]` happens to equal 80% at 1440 and nowhere else — at 834
       it left the column 738 wide against live's 590, so the same copy wrapped
       to 306px less height. -->
  <DetailBody field={split.rest} class="w-full md:w-4/5" />

  {#if youtubeUrl}
    <div class="mt-8 aspect-video w-full max-w-[1020px]">
      <iframe
        src={youtubeUrl}
        title={`${data.title} video`}
        loading="lazy"
        class="h-full w-full rounded"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowfullscreen
      ></iframe>
    </div>
  {/if}
</section>

<!-- Live wraps the back-link in
     `div.content-width.flex-align-center.flex-justify-center.my-8`, and `.my-8`
     is `margin: 2rem 0` (`beachfront.css:3839-3842`) = 48 / 64 / 80. BOTH halves
     are margin: page-diff cuts at this box's top, so the top gap belongs to the
     body region above it and the bottom gap collapses into the CTA band. We had
     invented 86/130 above and 108/80 below. -->
<div
  class="mx-auto my-12 flex max-w-[1440px] justify-center px-5 md:my-16 md:px-12 lg:my-20 lg:px-20"
>
  <!-- This back-link is `.button.text-color-primary-dark` with no `.mt-2`, so
       the <=767 rule `beachfront.css:8636-8638` gives it `margin-bottom:60px`
       — inside the flex holder, so live's holder is 98 tall at 390 against our
       38. (The team back-link carries `.mt-2`, which overrides that margin to
       0 and adds 12/16 above instead; the questions one has neither. Measured
       on all three templates 2026-08-05.) -->
  <OutlineButton
    label="Back to All Services"
    link="/services"
    variant="teal"
    class="mb-[60px] md:mb-0"
  />
</div>

<CtaBand backgroundImage={data.siteImages.ctaBeach} caption="FIJI ISLANDS" />
