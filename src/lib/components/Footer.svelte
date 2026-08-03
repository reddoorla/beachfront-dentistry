<script lang="ts">
  import BrandIcon from "./BrandIcon.svelte";
  import WaveDivider from "./WaveDivider.svelte";
  import MapEmbed from "./MapEmbed.svelte";
  import type {
    FooterSocial,
    FooterItem,
    FooterImage,
    FooterColumn,
  } from "$lib/blux/site-config";

  // The footer's pale-teal canvas — live's --primary-light (#e7f5fa, read off
  // the computed .footer-info-section). The top wave must read as this same
  // edge, so the wave fill defaults to it too — keep the two in sync.
  const FOOTER_BG = "#e7f5fa";

  interface Props {
    /** Leasing-contact columns (a migrated Blux site supplies these). When
     * present they take precedence over the site-config socials/text chrome. */
    columns?: FooterColumn[];
    /** Social links from the site config (empty → none rendered). */
    socials?: FooterSocial[];
    /** The copyright / rights line; falls back to a generic notice. */
    text?: string;
    /** Optional heading above the columns (e.g. "Want to learn more?"). */
    heading?: string;
    /** Boilerplate row under the columns ("©2023 …", "All Rights Reserved",
     * "Privacy Policy", "Sitemap"). Live renders these as PLAIN TEXT — not
     * links — spread across the columns' width, so that's all this is. */
    legal?: string[];
    /** Render an embedded location map beside the columns. */
    showMap?: boolean;
    /** Map search query (defaults to MapEmbed's own default address). */
    mapQuery?: string;
    /** Fill for the top-edge wave — defaults to the footer's own canvas so the
     * wave reads as the footer's top edge dipping into whatever sits above. */
    waveFill?: string;
  }

  // `columns` (the shape the Blux catalog pipeline emits in site-config.json)
  // wins when a migrated site supplies it; otherwise the site-config socials +
  // rights line render (the fleet default chrome).
  let {
    columns,
    socials = [],
    text,
    heading,
    legal = [],
    showMap = false,
    mapQuery,
    waveFill = FOOTER_BG,
  }: Props = $props();

  const isImage = (i: FooterItem): i is FooterImage => "image" in i;

  // Only http(s) links open in a new tab; tel:/mailto: stay same-tab (repo
  // idiom, ProductDetail.svelte). Consistent shape — Svelte drops undefined
  // attributes — so target/rel can't drift between the text- and image-link
  // branches.
  const isExternal = (href: string) => /^https?:\/\//i.test(href);
  const linkAttrs = (href: string) => ({
    href,
    target: isExternal(href) ? "_blank" : undefined,
    rel: isExternal(href) ? "noopener noreferrer" : undefined,
  });

  // Blux network id → the BrandIcon glyph + an accessible label. Networks
  // BrandIcon can't draw are dropped rather than rendered as an empty link.
  const NETWORK: Record<string, { platform: string; label: string }> = {
    facebook: { platform: "facebook", label: "Facebook" },
    twitter: { platform: "twitter", label: "Twitter" }, // BrandIcon aliases → X
    x: { platform: "x", label: "X" },
    instagram: { platform: "instagram", label: "Instagram" },
    linkedin: { platform: "linkedin", label: "LinkedIn" },
    "linkedin-company": { platform: "linkedin", label: "LinkedIn" },
    pinterest: { platform: "pinterest", label: "Pinterest" },
    youtube: { platform: "youtube", label: "YouTube" },
    reddit: { platform: "reddit", label: "Reddit" },
  };

  const known = $derived(
    socials
      // `Object.hasOwn` guard: a network literally named "toString" or
      // "constructor" would otherwise resolve to an inherited Object.prototype
      // member (truthy) and slip past the filter, then crash on `.platform`.
      .map((s) => ({
        ...s,
        meta: Object.hasOwn(NETWORK, s.network)
          ? NETWORK[s.network]
          : undefined,
      }))
      .filter(
        (s): s is typeof s & { meta: { platform: string; label: string } } =>
          !!s.meta,
      ),
  );
</script>

{#snippet logo(img: FooterImage["image"])}
  <img
    src={img.url}
    alt={img.alt ?? ""}
    style={img.maxWidth ? `max-width:${img.maxWidth}` : undefined}
  />
{/snippet}

<!-- One config column. Live's footer links: museo-sans, 12px/24 mobile and
     20px/40 desktop, weight 300, with 12px/20px between rows (its labels are
     slab-500 at the same sizes — rendered as <p> below). -->
{#snippet colBlock(col: FooterColumn)}
  <!-- Desktop row rhythm comes from live's own spacing, not a uniform gap:
       links carry .footer-links' 10px margins (60px pitch) while the
       hours/address/label rows are margin-less (the 40px line-height IS the
       pitch). Mobile keeps the measured gap-3. -->
  <div
    class="flex flex-col gap-3 font-sans text-[12px] leading-[24px] font-light text-[#365b6d] md:text-[16px] md:leading-[32px] lg:gap-0 lg:text-[20px] lg:leading-[40px]"
  >
    {#each col.items as item, itemIndex (itemIndex)}
      {#if isImage(item)}
        {#if item.href}
          <a {...linkAttrs(item.href)}>{@render logo(item.image)}</a>
        {:else}
          {@render logo(item.image)}
        {/if}
      {:else if item.href && /make a payment/i.test(item.text)}
        <!-- Live renders Make a Payment as a full
             `.button.text-color-primary-dark` pill (250×66 slab 25px at
             desktop), not a text link. -->
        <a
          {...linkAttrs(item.href)}
          class="font-slab focus-visible:ring-primary-deep mt-2 inline-flex h-[41px] w-fit items-center rounded-lg border border-[#365b6d] px-[14px] text-[14px] font-light whitespace-nowrap text-[#365b6d] transition-[opacity,background-color] hover:bg-[#129ecc4a] hover:opacity-60 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden md:text-[20px] lg:mt-[27px] lg:h-[66px] lg:px-[25px] lg:text-[25px]"
          >{item.text}</a
        >
      {:else if item.href}
        <a
          {...linkAttrs(item.href)}
          class="hover:text-primary-deep transition-colors lg:my-[10px] lg:first:mt-0"
          >{item.text}</a
        >
      {:else if item.text === item.text.toUpperCase()}
        <!-- ALL-CAPS non-link rows are live's column labels (OFFICE HOURS,
             CONTACT): museo-slab, weight 500, 16/32 mobile and 20/40 desktop. -->
        <p
          class="font-slab text-[16px] leading-[32px] font-medium lg:text-[20px] lg:leading-[40px]"
        >
          {item.text}
        </p>
      {:else}
        <!-- Everything else (hours, address lines) is live's
             .footer-contact-info: plain museo-SANS w300 — the same type as the
             links, NOT the slab label style. The column div already carries
             exactly that, so a bare row inherits it. -->
        <p>{item.text}</p>
      {/if}
    {/each}
  </div>
{/snippet}

<footer
  class="relative mt-auto w-full text-dark"
  style="background-color: {FOOTER_BG}"
>
  <!-- The top wave is the footer's OWN pale-teal edge dipping up into whatever
       band sits above (the dark closing CTA on home, a light section elsewhere)
       — so its fill defaults to the footer canvas, not the neighbour's. It's
       an ABSOLUTE overlay above the footer's top edge at EVERY breakpoint
       (live's shape divider is `position:absolute; margin-top:-Hpx` at mobile
       too) — leaving it in flow at mobile ate the CtaBand's -39px overlap and
       pushed every footer line 39px below live's (the desktop version of the
       same bug cost 144px in an earlier round). -->
  <div class="absolute inset-x-0 bottom-full">
    <WaveDivider
      fill={waveFill}
      flip
      heightClass="h-[39px] min-[992px]:h-[128px] lg:h-[160px]"
      width="169%"
    />
  </div>

  <!-- Live gives the copy 20px of lead-in below the wave ("Want to learn
       more?" sits 20px from the info-section top), then 40px more before the
       link columns. -->
  <div class="px-[19.5px] pt-3 pb-6 lg:px-8 lg:pt-5 lg:pb-12">
    <div class="mx-auto max-w-[1280px]">
      {#if heading}
        <!-- Live: 16px/40 mobile, 30px/40 desktop, weight 100, museo-slab, 10px
             below. Colour is the one deliberate deviation — live paints this
             #129ecc, which is only 3.09:1 on white and fails AA at the 16px
             mobile size, so it keeps the AA-safe -deep (see app.css). -->
        <p
          class="font-slab text-primary-deep mb-[10px] text-[16px] leading-[40px] font-thin md:text-[30px] lg:text-[30px]"
        >
          {heading}
        </p>
      {/if}
      {#if columns?.length}
        <!-- Live's .footer-cols is three ~equal columns (422px each in the
             1280 box): col-1 = the page links (+ the Make a Payment button),
             col-2 = the OFFICE HOURS and CONTACT blocks STACKED, col-3 = the
             map. Rendering every config column side-by-side squeezed them to
             ~250px and wrapped the hours/address lines. -->
        <div
          class="grid gap-10 lg:mt-[30px] lg:grid-cols-[1fr_1fr_26rem] lg:gap-4"
        >
          {#if columns[0]}
            {@render colBlock(columns[0])}
          {/if}
          {#if columns.length > 1}
            <div class="contents lg:flex lg:flex-col lg:gap-10">
              {#each columns.slice(1) as col, colIndex (colIndex)}
                {@render colBlock(col)}
              {/each}
            </div>
          {/if}
          {#if showMap}
            <div class="w-full">
              <MapEmbed query={mapQuery} />
            </div>
          {/if}
        </div>
        {#if legal.length > 0}
          <!-- Live's .footer-boiler-holder: one space-between row of plain-text
               items in museo-sans w300 #365b6d — 12px/14.4 desktop, 7px/8.4
               mobile (live's real vw-scaled value, tiny as it is). Placed after
               the grid so on mobile it lands below the map, at the very bottom;
               the desktop max-width reproduces live's row spanning only the
               link-columns area (845px of the 1280 content box), not the map. -->
          <div
            class="mt-12 flex flex-wrap justify-between font-sans text-[7px] leading-[8.4px] font-light text-[#365b6d] md:text-[12px] md:leading-[14px] lg:mt-20 lg:max-w-[845px] lg:text-[12px] lg:leading-[14.4px]"
          >
            {#each legal as item (item)}
              <p>{item}</p>
            {/each}
          </div>
        {/if}
      {:else}
        <div
          class="flex flex-col items-center justify-between gap-4 sm:flex-row"
        >
          {#if known.length > 0}
            <ul class="flex items-center gap-4">
              <!-- Keyed by index: a network can repeat across footer blocks, and
                   a duplicate key throws each_key_duplicate at hydration. -->
              {#each known as social, i (i)}
                <li>
                  {#if social.href}
                    <a
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.meta.label}
                      class="inline-flex min-h-11 min-w-11 items-center justify-center hover:opacity-70"
                    >
                      <BrandIcon
                        platform={social.meta.platform}
                        class="h-5 w-5"
                      />
                    </a>
                  {:else}
                    <!-- No recovered url — render the glyph, but not as a dead link. -->
                    <span
                      class="inline-flex min-h-11 min-w-11 items-center justify-center"
                      aria-label={social.meta.label}
                      role="img"
                    >
                      <BrandIcon
                        platform={social.meta.platform}
                        class="h-5 w-5"
                      />
                    </span>
                  {/if}
                </li>
              {/each}
            </ul>
          {/if}
          <p class="text-dark/60 text-sm">
            {text ?? `© ${new Date().getFullYear()} Company Name`}
          </p>
        </div>
      {/if}
    </div>
  </div>
</footer>
