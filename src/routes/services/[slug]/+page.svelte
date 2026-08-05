<script lang="ts">
  import { asLink, isFilled } from "@prismicio/client";
  import DetailHero from "$lib/components/DetailHero.svelte";
  import DetailIntro from "$lib/components/DetailIntro.svelte";
  import DetailBody from "$lib/components/DetailBody.svelte";
  import OutlineButton from "$lib/components/OutlineButton.svelte";
  import CtaBand from "$lib/components/CtaBand.svelte";
  import { CTA_BEACH } from "$lib/cta-beach";
  import { splitLede } from "./lede";
  import type { ImageField } from "@prismicio/client";
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
  // version (imgix url — clears the app CSP directly). The shared reception
  // photo is only the base that shows through when a service has no media, so
  // it's served from /static (CSP) as the fallback, matching live.
  const heroReception: ImageField = {
    url: "/images/service-hero.jpg",
    alt: null,
    copyright: null,
    dimensions: { width: 1600, height: 1067 },
    id: "service-hero",
    edit: { x: 0, y: 0, zoom: 1, background: "transparent" },
  };
  const heroImage = $derived(
    isFilled.image(data.doc.data.media) ? data.doc.data.media : heroReception,
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
<section class="mx-auto mt-14 max-w-[1440px] px-5 lg:mt-[100px] lg:px-20">
  <DetailBody field={split.rest} class="max-w-[1024px]" />

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

<!-- Live's back-link: a centered teal `.button` outline pill, ~80px above and
     below (mb clears straight into the CTA band). -->
<!-- Top gap is a MARGIN (page-diff cuts at this box's top, so padding-top would
     count into the pill region instead of the body above it); the pill→CTA gap
     stays padding, inside the pill region. -->
<div
  class="mx-auto flex max-w-[1440px] justify-center px-5 mt-[86px] pb-[108px] lg:px-20 lg:mt-[130px] lg:pb-[80px]"
>
  <OutlineButton
    label="Back to All Services"
    link="/services"
    variant="teal"
    size="detail"
  />
</div>

<CtaBand backgroundImage={CTA_BEACH} caption="FIJI ISLANDS" />
