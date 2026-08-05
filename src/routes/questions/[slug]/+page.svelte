<script lang="ts">
  import DetailHero from "$lib/components/DetailHero.svelte";
  import DetailIntro from "$lib/components/DetailIntro.svelte";
  import DetailBody from "$lib/components/DetailBody.svelte";
  import OutlineButton from "$lib/components/OutlineButton.svelte";
  import CtaBand from "$lib/components/CtaBand.svelte";
  import { CTA_BEACH } from "$lib/cta-beach";
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

<!-- Live's lede→body gap is 20px mobile / 40px desktop, as a MARGIN (page-diff
     cuts at this section's box top, so padding would fold the gap into the body
     region instead of above the "At Beachfront" heading). -->
<section
  class="mx-auto mt-[20px] max-w-[1440px] px-5 md:mt-[40px] md:px-12 lg:mt-[40px] lg:px-20"
>
  <!-- The Q&A bodies were authored with a trailing <br> above each sub-heading
       rather than the empty block the service bodies use (28px vs 38px) — see
       DetailBody. -->
  <DetailBody field={split.rest} class="max-w-[1024px]" subheadingGap="break" />
</section>

<!-- Live's `.other-questions-section`: a centered cyan "Have another question?"
     `.button` outline pill back to the Ask-the-Doctor grid, ~80px above and
     below before the closing CTA. -->
<!-- Top gap is a MARGIN (page-diff cuts at this box's top, so padding-top would
     count into the pill region instead of the body above it); the pill→CTA gap
     stays padding, inside the pill region. -->
<div
  class="mx-auto mt-[86px] flex max-w-[1440px] justify-center px-5 md:px-12 lg:mt-[130px] lg:px-20"
>
  <OutlineButton
    label="Have another question?"
    link="/ask-the-doctor"
    variant="cyan"
    size="detail"
  />
</div>

<CtaBand backgroundImage={CTA_BEACH} caption="FIJI ISLANDS" />
