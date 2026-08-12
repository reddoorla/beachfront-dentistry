<script lang="ts">
  import { isFilled } from "@prismicio/client";
  import PrismicPhoto from "$lib/components/PrismicPhoto.svelte";
  import DetailHero from "$lib/components/DetailHero.svelte";
  import DetailBody from "$lib/components/DetailBody.svelte";
  import OutlineButton from "$lib/components/OutlineButton.svelte";
  import CtaBand from "$lib/components/CtaBand.svelte";
  import { animateIn, ABOVE_FOLD_REVEAL } from "$lib/actions/animateIn";
  import type { PageData } from "./$types";

  // Matches live `/team-members/<uid>`: a beach-photo hero band with the NAME
  // (thin white slab, lower-left) and the person's circular headshot overhanging
  // the bottom-right, then a role + bio section, then the shared closing CTA.

  let { data }: { data: PageData } = $props();

  // Live gives EVERY team-member hero the same shared beach photo (not the
  // headshot). MarkUp round D deviates — threads
  // b7a00984-7a22-4830-ab3a-1fe1b636497e (team-member pin #1, "This should be
  // the same image on their small thumbnail module.") +
  // 17e321d9-3717-4a6a-810f-d9be03e60de2 (our-team pin #4, each member's
  // favorite beach as the hero): the hero is now the person's own gallery[0]
  // (data.heroImage), and this shared photo is the FALLBACK for a person with
  // no gallery. Both are Prismic-hosted now — the fallback used to be a
  // /static file, which is why it was the one of the two that skipped the
  // imgix ladder. See $lib/site-settings.
  const heroBeach = $derived(data.siteImages.teamMemberHero);

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
  <!-- The headshot rides the hero seam and is the second thing in the first
       viewport (measured top=191 @390) — it flashed with the name beside it. -->
  <div
    data-reveal
    class="absolute bottom-[-14px] left-[64.2%] z-20 size-[96px] overflow-hidden rounded-full xs:size-[144px] md:bottom-[-64px] md:size-[256px] lg:bottom-[-80px] lg:size-[320px]"
    use:animateIn={ABOVE_FOLD_REVEAL}
  >
    <!-- The circular headshot straddling the hero seam. Measured 96/256/320 at 390/834/1440 — overshoot 4.5x. eager: it is above the fold on every team-member page. -->
    <PrismicPhoto
      field={data.doc.data.media}
      sizes="(min-width: 1024px) 320px, (min-width: 768px) 256px, 96px"
      loading="eager"
      class="h-full w-full object-cover object-top"
    />
  </div>
{/snippet}

<DetailHero
  backgroundImage={data.heroImage ?? heroBeach}
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
  <!-- Live's role line is `h4.text-color-primary-dark.mt-8.mb-4`, and `.mb-4`
       is `margin-bottom:1rem` (`beachfront.css:3985-3988`) = 24 / 32 / 40.
       MarkUp thread 25b788a1-ecb1-436e-bd80-293ad0f277f4 (pin #4, "Half as
       much vertical space between the job title and the body text. Should be
       consistent between the button and the body text as well") halves it:
       the body now carries the same `.mt-2` half-rem ladder the button below
       already had (`margin-top:.5rem` — `beachfront.css:3901-3903`) = 12 / 16 /
       20, so title→body equals body→button at every tier. Team detail only.
       MarkUp thread b42973fe-6f2a-43d2-ac43-87c8187d9a7e (pin #3, "This text
       width is way too long… Or maybe a max width of 700 pixels, and then as
       the screen size gets smaller, it starts to rag") caps the measure at
       700px — live has no cap below the 1440 container (bio ran 1280px wide
       at 1440). Team detail only; services (w-full md:w-4/5) and questions
       (max-w-[1024px]) keep their live-derived widths. -->
  <DetailBody
    field={data.doc.data.body}
    class="mt-3 max-w-[700px] md:mt-4 lg:mt-5"
  />

  <!-- Live's cyan outline "Back to Team" pill. It carries `.mt-2` —
       `margin-top:.5rem` (`beachfront.css:3901-3903`) = 12 / 16 / 20 — inside a
       `.w-layout-hflex.flex-align-center.mb-8` holder; the 22/30 here was
       probed, not read, and was 6px out at 834. -->
  <OutlineButton
    label="Back to Team"
    link="/our-team"
    variant="cyan"
    class="mt-3 md:mt-4 lg:mt-5"
  />
</section>

<CtaBand backgroundImage={data.siteImages.ctaBeach} caption="FIJI ISLANDS" />
