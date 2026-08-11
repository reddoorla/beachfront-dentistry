<script lang="ts">
  import SubpageHero from "$lib/components/SubpageHero.svelte";
  import CtaBand from "$lib/components/CtaBand.svelte";
  import MapEmbed from "$lib/components/MapEmbed.svelte";
  import { ADDRESS, HOURS, PHONE } from "$lib/site";
  import type { ImageField, RichTextField } from "@prismicio/client";

  // Matches the live /contact-us: a left-aligned "Contact Us" photo hero, then
  // an info band (a Request-Appointment button + CONTACT/OFFICE-HOURS columns
  // + a Google map), then the shared closing CTA. There is NO body form — the
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
  // (the assembly pages resolve it through Prismic). Same "Request
  // Appointment" label (MarkUp pin 5980c9d7 #3 — live says "Book") +
  // #appointment target as the rest of the site.
  const ctaBeach: ImageField = {
    url: "/images/cta-beach.jpg",
    alt: null,
    copyright: null,
    dimensions: { width: 1600, height: 1067 },
    id: "cta-beach",
    edit: { x: 0, y: 0, zoom: 1, background: "transparent" },
  };
  const ctaHeading: RichTextField = [
    { type: "heading2", text: "Ready for \ngreat dental \nhealth?", spans: [] },
  ];
</script>

<!-- contact-us is the ONLY page carrying `.hero-bot-gradient.dark`
     (beachfront.css:6492-6494, opaque cyan from 77% down). Every other subpage
     uses the base 0.8-alpha stop, so that is SubpageHero's default. -->
<SubpageHero
  {heading}
  backgroundImage={officePhoto}
  align="left"
  botGradient="dark"
/>

<section
  data-section="info"
  class="info-section mx-auto max-w-[1400px] px-[5%] pt-9 text-[#365b6d] xs:px-[8%] md:px-12 md:pt-12 lg:px-[60px] lg:pt-[60px]"
>
  <!-- Live `.button.text-color-primary-dark`, wired to the global appointment
       modal via the #appointment anchor (same handler the CTAs use). -->
  <a
    href="#appointment"
    class="font-slab focus-visible:ring-primary-deep inline-flex items-center rounded-lg border border-[#365b6d] px-[1em] py-[1.3em] text-[14px] leading-[0] font-light text-[#365b6d] transition-[opacity,background-color] hover:bg-[#129ecc4a] hover:opacity-60 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden mb-[60px] xs:text-[15px] md:mb-0 md:text-[20px] lg:text-[25px]"
  >
    Request Appointment
  </a>

  <!-- CONTACT + OFFICE HOURS: side-by-side on desktop, stacked on mobile. -->
  <div class="mt-9 flex flex-col md:mt-12 md:flex-row lg:mt-[60px]">
    <div class="mb-6 md:mr-16 md:mb-8 lg:mr-20 lg:mb-10">
      <h2
        class="font-slab text-[16px] leading-[32px] font-medium text-[#365b6d] uppercase lg:text-[20px] lg:leading-[40px]"
      >
        Contact
      </h2>
      <a
        href={PHONE.href}
        class="focus-visible:ring-primary-deep block text-[12px] leading-[24px] font-light underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:outline-hidden md:text-[16px] md:leading-[32px] lg:text-[20px] lg:leading-[40px]"
      >
        {PHONE.display}
      </a>
      <address
        class="font-light not-italic [&_p]:text-[12px] [&_p]:leading-[24px] md:[&_p]:text-[16px] md:[&_p]:leading-[32px] lg:[&_p]:text-[20px] lg:[&_p]:leading-[40px]"
      >
        <p>{ADDRESS.line1}</p>
        <p>{ADDRESS.line2}</p>
      </address>
    </div>

    <div class="mb-6 md:mb-8 lg:mb-10">
      <h2
        class="font-slab text-[16px] leading-[32px] font-medium text-[#365b6d] uppercase lg:text-[20px] lg:leading-[40px]"
      >
        Office Hours
      </h2>
      {#each HOURS as [days, time] (days)}
        <p
          class="text-[12px] leading-[24px] font-light md:text-[16px] md:leading-[32px] lg:text-[20px] lg:leading-[40px]"
        >
          {days} / {time}
        </p>
      {/each}
    </div>
  </div>

  <!-- Live's map column is `div._w-40pc.su-w-full-tablet`: 40%
       (`beachfront.css:3530-3532`) at >=992 and 100% at <=991 (`:8215-8217`).
       `max-w-[512px]` equals 40% at 1440 and nowhere else — at 834 it left the
       map 512 wide inside live's 738, which is 226x400px of the region wrong
       and most of its 18.8%. -->
  <div class="mt-9 w-full md:mt-12 lg:mt-[60px] lg:w-2/5">
    <MapEmbed />
  </div>
</section>

<CtaBand
  heading={ctaHeading}
  ctaLabel="Request Appointment"
  ctaLink={{ link_type: "Web", url: "#appointment" }}
  backgroundImage={ctaBeach}
  caption="FIJI ISLANDS"
/>
