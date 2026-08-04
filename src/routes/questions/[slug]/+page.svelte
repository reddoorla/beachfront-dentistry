<script lang="ts">
  import DetailHero from "$lib/components/DetailHero.svelte";
  import DetailIntro from "$lib/components/DetailIntro.svelte";
  import RichTextBody from "$lib/components/RichTextBody.svelte";
  import CtaBand from "$lib/components/CtaBand.svelte";
  import { CTA_BEACH } from "$lib/cta-beach";
  import { animateIn, LIVE_REVEAL } from "$lib/actions/animateIn";
  import { splitLede } from "$lib/detail-lede";
  import type { PageData } from "./$types";

  // Matches live `/questions/<uid>`: the question's OWN image as a hero band
  // with a "Blog / View All Posts" breadcrumb, then the big cyan title + cyan
  // right-indented lede, then the dark body, a "Have another question?" link,
  // and the shared closing CTA.

  let { data }: { data: PageData } = $props();

  // First body paragraph reads as the lede (news_article has no excerpt field),
  // never duplicated. See $lib/detail-lede.
  const split = $derived(splitLede(data.doc.data.body));
</script>

<!-- Hero bg is this question's own media (a Prismic imgix url — clears the app
     CSP directly, no static asset needed). -->
<DetailHero
  backgroundImage={data.doc.data.media}
  label="Blog / View All Posts"
  labelSize="crumb"
/>

<DetailIntro title={data.title} lede={split.lede} titleSize="lg" />

<section class="mx-auto max-w-[1440px] px-5 pt-10 lg:px-20 lg:pt-16">
  <!-- Live body copy: 12px/18 mobile → 20px/30 desktop, 10px paragraph gap,
       capped ~1024px. Paragraphs inherit the wrapper font-size. -->
  <div
    class="max-w-[1024px] text-[#333] [&_p+p]:mt-[10px] [&_p]:text-[12px] [&_p]:leading-[18px] lg:[&_p]:text-[20px] lg:[&_p]:leading-[30px]"
    use:animateIn={LIVE_REVEAL}
  >
    <RichTextBody field={split.rest} />
  </div>
</section>

<!-- Live's `.other-questions-section`: a "Have another question?" link back to
     the Ask-the-Doctor grid, over generous whitespace before the CTA (live's
     body→CTA gap is ~197px @1440). -->
<section
  class="mx-auto max-w-[1440px] px-5 pt-10 pb-16 lg:px-20 lg:pt-16 lg:pb-[120px]"
>
  <a
    href="/ask-the-doctor"
    class="font-slab focus-visible:ring-primary-deep text-[24px] font-light transition-opacity hover:opacity-60 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden lg:text-[30px]"
    style="color:#129ecc"
  >
    Have another question?
  </a>
</section>

<CtaBand backgroundImage={CTA_BEACH} caption="FIJI ISLANDS" />
