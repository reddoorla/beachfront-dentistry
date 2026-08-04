<script lang="ts">
  import SubpageHero from "$lib/components/SubpageHero.svelte";
  import CtaBand from "$lib/components/CtaBand.svelte";
  import MapEmbed from "$lib/components/MapEmbed.svelte";
  import { ADDRESS, HOURS, PHONE } from "$lib/site";
  import type { ImageField, RichTextField } from "@prismicio/client";

  // Matches the live /contact-us: a left-aligned "Contact Us" photo hero, then
  // an info band (a Book-Appointment button + CONTACT/OFFICE-HOURS columns + a
  // Google map), then the shared closing CTA. There is NO body form — the
  // request-appointment form lives in the global AppointmentModal, opened by
  // the #appointment anchor (and by the footer/CtaBand buttons). The modal
  // POSTs to THIS route's default action (+page.server.ts, untouched), so the
  // form logic stays reachable exactly as before — just funnelled through the
  // modal, per the live design.

  const heading: RichTextField = [
    { type: "heading2", text: "Contact Us", spans: [] },
  ];
  // Static hero photo (live `.hero.contact` bg) — served from /static so it
  // clears the app CSP (img-src is Prismic-only); the real office image, not
  // a redraw.
  const officePhoto: ImageField = {
    url: "/images/contact-hero.jpg",
    alt: null,
    copyright: null,
    dimensions: { width: 1200, height: 1600 },
    id: "contact-hero",
    edit: { x: 0, y: 0, zoom: 1, background: "transparent" },
  };
  // Closing CTA — match the beach composition the assembly pages get from
  // ctaHero (heading over white fading into the FIJI beach). The beach is
  // served from /static so it clears the app CSP on this hand-built route
  // (the assembly pages resolve it through Prismic). Same "Book Appointment"
  // label + #appointment target as the rest of the site.
  const ctaBeach: ImageField = {
    url: "/images/cta-beach.jpg",
    alt: null,
    copyright: null,
    dimensions: { width: 1600, height: 1067 },
    id: "cta-beach",
    edit: { x: 0, y: 0, zoom: 1, background: "transparent" },
  };
  const ctaHeading: RichTextField = [
    { type: "heading2", text: "Ready for great dental health?", spans: [] },
  ];
</script>

<SubpageHero {heading} backgroundImage={officePhoto} align="left" />

<section
  data-section="info"
  class="info-section mx-auto max-w-[1400px] px-5 pt-8 pb-12 text-[#365b6d] min-[480px]:px-8 lg:px-20 lg:pt-14 lg:pb-20"
>
  <!-- Live `.button.text-color-primary-dark`, wired to the global appointment
       modal via the #appointment anchor (same handler the CTAs use). -->
  <a
    href="#appointment"
    class="font-slab focus-visible:ring-primary-deep inline-flex h-[41px] items-center rounded-lg border border-[#365b6d] px-[14px] text-[14px] font-light text-[#365b6d] transition-[opacity,background-color] hover:bg-[#129ecc4a] hover:opacity-60 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden xs:text-[15px] md:text-[20px] lg:h-[67px] lg:px-[25px] lg:text-[25px]"
  >
    Book Appointment
  </a>

  <!-- CONTACT + OFFICE HOURS: side-by-side on desktop, stacked on mobile. -->
  <div class="mt-8 flex flex-col gap-8 sm:flex-row sm:gap-20 lg:mt-14">
    <div>
      <h2
        class="font-slab text-[20px] leading-[40px] font-medium text-[#365b6d] uppercase"
      >
        Contact
      </h2>
      <a
        href={PHONE.href}
        class="focus-visible:ring-primary-deep block text-[20px] leading-[40px] font-light underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:outline-hidden"
      >
        {PHONE.display}
      </a>
      <address class="text-[20px] leading-[40px] font-light not-italic">
        <p>{ADDRESS.line1}</p>
        <p>{ADDRESS.line2}</p>
      </address>
    </div>

    <div>
      <h2
        class="font-slab text-[20px] leading-[40px] font-medium text-[#365b6d] uppercase"
      >
        Office Hours
      </h2>
      {#each HOURS as [days, time] (days)}
        <p class="text-[20px] leading-[40px] font-light">{days} / {time}</p>
      {/each}
    </div>
  </div>

  <!-- Live's `.footer-map` is 512×400 desktop / full-width mobile, left-aligned. -->
  <div class="mt-8 max-w-[512px] lg:mt-14">
    <MapEmbed />
  </div>
</section>

<CtaBand
  heading={ctaHeading}
  ctaLabel="Book Appointment"
  ctaLink={{ link_type: "Web", url: "#appointment" }}
  backgroundImage={ctaBeach}
  caption="FIJI ISLANDS"
/>
