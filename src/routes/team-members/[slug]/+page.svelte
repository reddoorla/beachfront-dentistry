<script lang="ts">
  import { isFilled } from "@prismicio/client";
  import { PrismicImage } from "@prismicio/svelte";
  import DetailHero from "$lib/components/DetailHero.svelte";
  import DetailBody from "$lib/components/DetailBody.svelte";
  import OutlineButton from "$lib/components/OutlineButton.svelte";
  import CtaBand from "$lib/components/CtaBand.svelte";
  import { CTA_BEACH } from "$lib/cta-beach";
  import { animateIn, LIVE_REVEAL } from "$lib/actions/animateIn";
  import type { ImageField } from "@prismicio/client";
  import type { PageData } from "./$types";

  // Matches live `/team-members/<uid>`: a beach-photo hero band with the NAME
  // (thin white slab, lower-left) and the person's circular headshot overhanging
  // the bottom-right, then a role + bio section, then the shared closing CTA.

  let { data }: { data: PageData } = $props();

  // Live gives EVERY team-member hero the same shared beach photo (not the
  // headshot). Served from /static so it clears the app CSP (img-src is
  // Prismic-only) — the real asset, not a redraw.
  const heroBeach: ImageField = {
    url: "/images/team-member-hero.jpg",
    alt: null,
    copyright: null,
    dimensions: { width: 1600, height: 900 },
    id: "team-member-hero",
    edit: { x: 0, y: 0, zoom: 1, background: "transparent" },
  };

  const hasHeadshot = $derived(isFilled.image(data.doc.data.media));
</script>

{#snippet headshot()}
  <!-- Live's circular headshot overhangs the hero's bottom-right, dipping past
       the wave into the bio section. Its `.member-page-headshot` rule is
       `width/height: 8rem; bottom: -2rem` against live's own stepped root
       (24/32/40), with two narrow-band overrides — so in px the ladder is
       96 / 144 / 256 / 320 and the overhang -14 / -14 / -64 / -80. Only the
       desktop 320 had been matched; mobile was 130 (36% too big) and the whole
       480–991 range sat at the mobile size.
       Live pins it with `right: auto` + a left offset that lands on 64.2% of
       the viewport at EVERY breakpoint (measured 251/390, 535/834, 925/1440),
       so one left value replaces the old right-4 / right-13% pair.
       No white ring: live's rule has no border — the photo fills the circle.
       `object-position: 50% 0%` anchors a headshot to the top of its crop. -->
  <div
    class="absolute bottom-[-14px] left-[64.2%] z-20 size-[96px] overflow-hidden rounded-full xs:size-[144px] md:bottom-[-64px] md:size-[256px] lg:bottom-[-80px] lg:size-[320px]"
    use:animateIn={LIVE_REVEAL}
  >
    <PrismicImage
      field={data.doc.data.media}
      class="h-full w-full object-cover object-top"
    />
  </div>
{/snippet}

<DetailHero
  backgroundImage={heroBeach}
  label={data.title}
  labelSize="name"
  overlay={hasHeadshot ? headshot : undefined}
/>

<!-- Live's `.bio-section` starts ~48px (mobile) / 80px (desktop) below the
     hero — a MARGIN that also clears the overhanging headshot — so the role
     lands at that offset, not flush to the wave. -->
<section
  class="mx-auto mt-12 max-w-[1440px] px-5 pb-12 md:px-12 lg:mt-20 lg:px-20 lg:pb-20"
>
  {#if data.role}
    <!-- Role line: teal slab bold (live `.team-member-role`). Inline colour
         defeats the global `main h1–h3` primary rule.
         Live measures 16px/24 from 390 all the way through 991, then 30px/45
         at desktop — the 24px/32 here was never checked against live and put
         an 8px drift into every paragraph below it. -->
    <h2
      class="font-slab text-[16px] leading-[24px] font-bold lg:text-[30px] lg:leading-[45px]"
      style="color:#365b6d"
    >
      {data.role}
    </h2>
  {/if}

  <!-- Live's body copy: museo-sans slate #365b6d, 12px/18 mobile → 20px/30
       desktop, 10px between blocks (shared DetailBody). -->
  <DetailBody field={data.doc.data.body} class="mt-6 lg:mt-10" />

  <!-- Live's cyan outline "Back to Team" pill (`.button` skin), left-aligned. -->
  <OutlineButton
    label="Back to Team"
    link="/our-team"
    variant="cyan"
    class="mt-[22px] lg:mt-[30px]"
  />
</section>

<CtaBand backgroundImage={CTA_BEACH} caption="FIJI ISLANDS" />
