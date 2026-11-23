<script lang="ts">
  import DetailHero from "$lib/components/DetailHero.svelte";
  import DetailIntro from "$lib/components/DetailIntro.svelte";
  import DetailBody from "$lib/components/DetailBody.svelte";
  import OutlineButton from "$lib/components/OutlineButton.svelte";
  import CtaBand from "$lib/components/CtaBand.svelte";
  import { splitLede } from "$lib/detail-lede";
  import type { PageData } from "./$types";

  // Live `/questions/<uid>`'s order: the question's OWN image as a hero band,
  // then (since 2026-11-23, above the title) the crumb back to the questions
  // grid, the editorial title and pull-quote lede, then the body, a "Have another
  // question?" link, and the shared closing CTA.

  let { data }: { data: PageData } = $props();

  // First body paragraph reads as the lede (news_article has no excerpt field),
  // never duplicated. See $lib/detail-lede.
  const split = $derived(splitLede(data.doc.data.body));
</script>

<!-- The crumb reads "Ask the Doctor / View All Questions" (Tim, 2026-11-23:
     "ask the doctor" is the category, "View All Questions" the link). Live
     Webflow said "Blog / View All Posts", but there is no blog: every
     news_article renders here, under the one category, and /blog is a 404.
     news_article has no category field. Its `tags` Text field (which the
     service crumb reads as its category) is empty on all 41 published
     articles (2026-11-23) and is labelled as comma-separated keywords, so it
     is not read here: the route is the category.
     Hero bg is this question's own media (a Prismic imgix url — clears the app
     CSP directly, no static asset needed). -->
<!-- 2026-11-23 typography pass (the operator's pick, "B · Editorial" with the
     split crumb; workspace decision
     2026-11-23-1947-beachfront-faq-typography-direction): "Ask the Doctor" is
     plain text and only "View All Questions" links; the title, lede and body
     take the editorial scale, and the body column is 640px (73 characters a
     line, where live's 1024px read 111). -->
<!-- Tim's Figma, 2026-11-23: the crumb "moved out of the image header and
     just connected it to the main title", in "a heading style from the home
     page" (the "Meet Your Team" eyebrow). The hero is now the photo and wave
     alone; the crumb sits above the h1 in DetailIntro, on white. Its words are
     unchanged from #168. -->
<DetailHero backgroundImage={data.doc.data.media} />

<DetailIntro
  title={data.title}
  lede={split.lede}
  titleSize="lg"
  variant="editorial"
  crumb={{
    label: "Ask the Doctor",
    linkLabel: "View All Questions",
    href: "/ask-the-doctor",
  }}
/>

<!-- Live's lede→body gap is 20px mobile / 40px desktop, as a MARGIN (page-diff
     cuts at this section's box top, so padding would fold the gap into the body
     region instead of above the "At Beachfront" heading). -->
<section
  class="mx-auto mt-[20px] max-w-[1440px] px-5 md:mt-[40px] md:px-12 lg:mt-[40px] lg:px-20"
>
  <!-- The Q&A bodies were authored with a trailing <br> above each sub-heading
       (live's 28px gap); the editorial variant sets its own 40/48/56px above a
       sub-heading and ignores `subheadingGap` — see DetailBody. -->
  <DetailBody field={split.rest} class="max-w-[640px]" variant="editorial" />
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
  />
</div>

<CtaBand backgroundImage={data.siteImages.ctaBeach} caption="FIJI ISLANDS" />
