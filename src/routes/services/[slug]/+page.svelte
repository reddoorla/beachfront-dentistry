<script lang="ts">
  import { asLink, isFilled } from "@prismicio/client";
  import DetailHero from "$lib/components/DetailHero.svelte";
  import DetailIntro from "$lib/components/DetailIntro.svelte";
  import RichTextBody from "$lib/components/RichTextBody.svelte";
  import CtaBand from "$lib/components/CtaBand.svelte";
  import { CTA_BEACH } from "$lib/cta-beach";
  import { animateIn, LIVE_REVEAL } from "$lib/actions/animateIn";
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

<!-- Live's `.service-page-body-section` carries generous whitespace before the
     closing CTA (~236px gap @1440); match it so the page isn't compact. -->
<section
  class="mx-auto max-w-[1440px] px-5 pt-10 pb-16 lg:px-20 lg:pt-16 lg:pb-[190px]"
>
  <!-- Live body copy: 12px/18 mobile → 20px/30 desktop, 10px paragraph gap,
       capped ~1024px. Paragraphs inherit the wrapper font-size. -->
  <div
    class="max-w-[1024px] text-[#333] [&_p+p]:mt-[10px] [&_p]:text-[12px] [&_p]:leading-[18px] lg:[&_p]:text-[20px] lg:[&_p]:leading-[30px]"
    use:animateIn={LIVE_REVEAL}
  >
    <RichTextBody field={split.rest} />
  </div>

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

<CtaBand backgroundImage={CTA_BEACH} caption="FIJI ISLANDS" />
