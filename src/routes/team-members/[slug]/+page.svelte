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
  <!-- Live's circular headshot (320px @1440) overhangs the hero's bottom-right,
       ~13% from the right edge, dipping past the wave into the bio section. -->
  <div
    class="absolute right-4 bottom-[-24px] z-20 size-[130px] overflow-hidden rounded-full border-4 border-white bg-white lg:right-[13%] lg:bottom-[-80px] lg:size-[320px]"
    use:animateIn={LIVE_REVEAL}
  >
    <PrismicImage
      field={data.doc.data.media}
      class="h-full w-full object-cover"
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
  class="mx-auto mt-12 max-w-[1440px] px-5 pb-12 lg:mt-20 lg:px-20 lg:pb-20"
>
  {#if data.role}
    <!-- Role line: teal slab bold (live `.team-member-role`). Inline colour
         defeats the global `main h1–h3` primary rule. -->
    <h2
      class="font-slab text-[24px] leading-[32px] font-bold lg:text-[30px] lg:leading-[45px]"
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
    size="detail"
    class="mt-10"
  />
</section>

<CtaBand backgroundImage={CTA_BEACH} caption="FIJI ISLANDS" />
