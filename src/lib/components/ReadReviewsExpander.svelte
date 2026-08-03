<script lang="ts">
  import { REVIEW_DESTINATIONS } from "$lib/site";

  /** Live's "Read Reviews" block-link (.social-link-block): the slab label +
   * a 25px plus that crossfades to a minus, disclosing a wider row of the
   * three review destinations (Google / Facebook / Yelp) beneath — opacity
   * 2s on the expo curve, exactly live's .socials-container. Used twice
   * (under the review slider and in the closing CTA band), like live. */
  let { class: className = "" }: { class?: string } = $props();

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
    <span
      class="font-slab mr-3 text-[14px] font-light text-[#365b6d] xs:text-[15px] xs:leading-[41px] md:text-[20px] md:leading-[55px] lg:text-[25px]"
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
    class="absolute top-full left-1/2 mt-[24px] flex w-[264px] -translate-x-1/2 justify-between transition-opacity duration-[2000ms] ease-[cubic-bezier(0.19,1,0.22,1)] motion-reduce:transition-none lg:mt-[41px] lg:w-[440px] {open
      ? 'opacity-100'
      : 'opacity-0'}"
  >
    {#each REVIEW_DESTINATIONS as dest (dest.label)}
      <a
        href={dest.href}
        target="_blank"
        rel="noopener"
        aria-label="Read our reviews on {dest.label}"
        class="transition-opacity hover:opacity-60 focus-visible:ring-2 focus-visible:ring-primary-deep focus-visible:ring-offset-2 focus-visible:outline-hidden"
      >
        <img src={dest.icon} alt="" class="w-12 lg:w-20" />
      </a>
    {/each}
  </div>
</div>
