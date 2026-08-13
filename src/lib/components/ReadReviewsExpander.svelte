<script lang="ts">
  import { REVIEW_DESTINATIONS } from "$lib/site";

  /** Live's "Read Reviews" block-link (.social-link-block): the slab label +
   * a 25px plus that crossfades to a minus, disclosing a wider row of the
   * three review destinations (Google / Facebook / Yelp) beneath — opacity
   * 2s on the expo curve, exactly live's .socials-container. Used twice
   * (under the review slider and in the closing CTA band), like live. */
  /** Which way the socials row discloses.
   *
   * `below` is live's own behaviour (`.socials-container.active{bottom:-120%}`,
   * beachfront.css:7553-7556) and is right wherever there is room underneath.
   *
   * `above-sm` flips it upward under 768. The CTA-band mount needs it: below
   * ~560px the downward row lands inside the footer wave's box and the logos
   * are painted over by it — measured on /contact-us, the row overlaps the
   * wave box by 115/97/48px at 360/390/480 while clearing it by 124-162px at
   * 767/834/1440. THE REFERENCE HAS THE SAME DEFECT (probed at 390 on
   * beachfront-dentistry.webflow.io: all three logo centres hit-test to the
   * wave's own svg, and only a sliver of the Google mark clears it), so there
   * is no live rule to copy here and this is a deliberate deviation — see
   * matching/LEDGER.md 2026-08-13.
   *
   * Upward is the only option that costs the CLOSED page nothing: the row is
   * `absolute` and `opacity-0`+`inert` when shut, so nothing in the flow or the
   * painted output moves at any width. The paint-order alternatives were
   * measured and rejected — lifting the band over the footer takes the beach
   * photo with it and the wave stops dipping into it. */
  let {
    class: className = "",
    placement = "below",
  }: { class?: string; placement?: "below" | "above-sm" } = $props();

  let open = $state(false);
  const rowId = $props.id();
</script>

<!-- The socials row is absolutely positioned (live overlays it on whatever
     follows), so the wrapper reserves the overhang: row top sits 41px under
     the label block, icons run ~68px tall at desktop. -->
<div class="relative inline-block {className}">
  <button
    type="button"
    aria-expanded={open}
    aria-controls={rowId}
    onclick={() => (open = !open)}
    class="flex cursor-pointer items-center transition-opacity hover:opacity-60 focus-visible:ring-2 focus-visible:ring-primary-deep focus-visible:ring-offset-2 focus-visible:outline-hidden"
  >
    <!-- Live's label line-height is the unitless ratio 2.75, tracking the font
         size at every breakpoint (38.5 / 41.25 / 55 / 68.75). The per-breakpoint
         px values that used to sit here left mobile at 21px (18px short) and
         desktop at 55px (14px short) — invisible to the pixel gate, caught by
         the style census. -->
    <span
      class="font-slab mr-3 text-[14px] leading-[2.75] font-light text-[#365b6d] xs:text-[15px] md:text-[20px] lg:mr-[30px] lg:text-[25px]"
      >Read Reviews</span
    >
    <!-- Live's plus/minus crossfade: the (pre-rotated) plus fades out over
         .65s while the minus bar sits underneath. -->
    <span class="relative block size-[15px] lg:size-[25px]" aria-hidden="true">
      <img
        src="/icons/minus.svg"
        alt=""
        class="absolute top-[6px] w-full lg:top-[10px]"
      />
      <img
        src="/icons/plus.svg"
        alt=""
        class="absolute inset-0 w-full rotate-90 transition-opacity duration-[650ms] motion-reduce:transition-none {open
          ? 'opacity-0'
          : 'opacity-100'}"
      />
    </span>
  </button>
  <div
    id={rowId}
    inert={!open}
    class="absolute left-1/2 flex w-[264px] -translate-x-1/2 justify-between transition-opacity duration-[2000ms] ease-[cubic-bezier(0.19,1,0.22,1)] motion-reduce:transition-none lg:w-[440px] {placement ===
    'above-sm'
      ? 'bottom-full mb-2 md:top-full md:bottom-auto md:mt-[24px] md:mb-0 lg:mt-[41px]'
      : 'top-full mt-[24px] lg:mt-[41px]'} {open ? 'opacity-100' : 'opacity-0'}"
  >
    {#each REVIEW_DESTINATIONS as dest (dest.label)}
      <a
        href={dest.href}
        target="_blank"
        rel="noopener"
        aria-label="Read our reviews on {dest.label}"
        class="transition-opacity hover:opacity-60 focus-visible:ring-2 focus-visible:ring-primary-deep focus-visible:ring-offset-2 focus-visible:outline-hidden"
      >
        <!-- Live sizes these on the ANCHOR: `._w-8{width:2rem}`
             (beachfront.css:3463-3465) against the stepped root is 80/64/48,
             and `._w-8.clickable.su-w-6-portrait{width:1.5rem}` (:9034-9036)
             takes it to 36 at ≤479. The captured markup carries all three
             classes (matching/spec/index.html, contact-us.html). A flat
             `w-12 lg:w-20` therefore rendered 48 where live renders 36 (≤479)
             and 48 where live renders 64 (768-991) — a standing infidelity the
             pixel gate cannot see, because this row is only ever painted in the
             OPEN state and the gate never opens it. -->
        <img src={dest.icon} alt="" class="w-9 xs:w-12 md:w-16 lg:w-20" />
      </a>
    {/each}
  </div>
</div>
