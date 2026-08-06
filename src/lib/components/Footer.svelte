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
     slab-500 at the same sizes — rendered as <p> below).

     `linkRhythm` mirrors live's own two footer row classes, which carry
     DIFFERENT vertical rhythm and can't share one container gap:
       .footer-links       (the page-links column) — margins 12/16/20px, so the
                            pitch is line-height + margin = 36/48/60px.
       .footer-contact-info (hours + address, INCLUDING the tel: link) — no
                            margins at all; the 24/32/40px line-height IS the
                            pitch.
     A uniform gap gave the contact rows the link pitch (36 vs live's 24 at
     mobile) and inflated the whole footer; the tel: row is a link but belongs
     to the contact rhythm, so the split is per COLUMN, not per item. -->
{#snippet colBlock(col: FooterColumn, linkRhythm: boolean)}
  <!-- gap-0 at every breakpoint: the rhythm is the rows' own margins (above),
       exactly as live does it. -->
  <div
    class="flex flex-col gap-0 font-sans text-[12px] leading-[24px] font-light text-[#365b6d] md:text-[16px] md:leading-[32px] lg:text-[20px] lg:leading-[40px]"
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
             `.button.text-color-primary-dark` pill, not a text link. Measured
             rects on live: 141×38 / 200×54 / 250×66 (the pill's own lh:0 trick
             is the ledgered deviation — we match the RECT).
             mt = live's last-link → button gap (48/41/37) minus the link row's
             own bottom margin (6/8/10). mb closes the gap to the next stacked
             block: live puts 60px there at mobile and the grid supplies 24. -->
        <a
          {...linkAttrs(item.href)}
          class="font-slab px-[1em] py-[1.3em] leading-[0] focus-visible:ring-primary-deep mt-[42px] mb-[36px] inline-flex w-fit items-center rounded-lg border border-[#365b6d] text-[14px] font-light whitespace-nowrap text-[#365b6d] transition-[opacity,background-color] hover:bg-[#129ecc4a] hover:opacity-60 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden xs:text-[15px] md:mt-[33px] md:mb-0 md:text-[20px] lg:mt-[27px] lg:text-[25px]"
          >{item.text}</a
        >
      {:else if item.href}
        <a
          {...linkAttrs(item.href)}
          class="transition-opacity hover:opacity-60 {linkRhythm
            ? 'my-[6px] first:mt-0 md:my-[8px] lg:my-[10px]'
            : ''}">{item.text}</a
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
      heightClass="h-[96px] md:h-[128px] lg:h-[160px]"
      width="169%"
    />
  </div>

  <!-- Live gives the copy 20px of lead-in below the wave ("Want to learn
       more?" sits 20px from the info-section top), then 40px more before the
       link columns. -->
  <!-- Live's footer gutter, measured off `.footer-cols` at every band: 5% of
       the viewport ≤479 (19.5px at 390), 8% from 480–767, then a flat 48px
       from 768 up (it's `1.5rem` against live's own stepped root; ours is a
       fixed root, so it's written in px). At 1440 the max-w-1280 below still
       wins and centres the box at x=80, exactly as live does. -->
  <div class="px-[5%] pt-3 pb-6 xs:px-[8%] md:px-[48px] lg:pt-5 lg:pb-12">
    <div class="mx-auto max-w-[1280px]">
      {#if heading}
        <!-- Live: 16px/40 mobile, 30px/40 desktop, weight 100, museo-slab, 10px
             below. Colour is the one deliberate deviation — live paints this
             #129ecc, which is only 3.09:1 on white and fails AA at the 16px
             mobile size, so it keeps the AA-safe -deep (see app.css). -->
        <p
          class="font-slab text-primary-deep mb-[10px] text-[16px] leading-[40px] font-thin xs:text-[30px] md:text-[30px] lg:text-[30px]"
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
        <!-- Live's `.footer-cols` is a wrapping flex row of three 33% columns
             whose widths restack per band (read off its own rules in
             matching/spec/beachfront.css and confirmed by computed geometry):
               ≤479      col-1/2/3 100%  → all stacked, full width
               480–767   col-1/2/3 66%   → all stacked, but only 66% wide
               768–991   col-3 66%       → cols 1+2 sit SIDE BY SIDE at 33%
                                            and the map wraps below at 66%
               ≥992      33/33/33        → three across
             The 480–991 half of that ladder was missing here (everything
             stacked full-width), which is why the tablet footer read as one
             tall column against live's two.
             The grid's own gap is the space BETWEEN live's stacked blocks
             (button→OFFICE HOURS, hours→CONTACT, address→map): 24px mobile,
             32px tablet. Horizontal gap is 0 so the spanned map lands on
             exactly 66%. `mt` is live's heading→first-row gap (10/32/40) — it
             collapses with the heading's own mb-[10px], so mobile needs none. -->
        <div
          class="grid gap-6 xs:w-[66%] md:mt-[32px] md:w-full md:grid-cols-3 md:gap-x-0 md:gap-y-8 lg:mt-[40px] lg:grid-cols-[1fr_1fr_26rem] lg:gap-4"
        >
          {#if columns[0]}
            {@render colBlock(columns[0], true)}
          {/if}
          {#if columns.length > 1}
            <!-- OFFICE HOURS + CONTACT are ONE column on live (its col-2),
                 stacked — `contents` only while the whole footer stacks. -->
            <div class="contents md:flex md:flex-col md:gap-8 lg:gap-10">
              {#each columns.slice(1) as col, colIndex (colIndex)}
                {@render colBlock(col, false)}
              {/each}
            </div>
          {/if}
          {#if showMap}
            <!-- Tablet: the map wraps below the two 33% columns, spanning 66%.
                 At lg it must return to normal auto-placement (3rd column of
                 row 1) — `lg:row-start-1` is NOT the reset, it's an explicit
                 placement that claims row 1 col 1 and shunts the real columns
                 one slot right; `row-start-auto` is. -->
            <div
              class="w-full md:col-span-2 md:row-start-2 lg:col-span-1 lg:row-start-auto"
            >
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
          <!-- Live's map→boilerplate gap, measured: 84/112/140px. -->
          <div
            class="mt-[84px] flex flex-wrap justify-between font-sans text-[7px] leading-[8.4px] font-light text-[#365b6d] xs:text-[10px] xs:leading-[12px] md:mt-[112px] md:ml-[16px] md:w-[75%] md:text-[12px] md:leading-[14px] lg:mt-[140px] lg:ml-[20px] lg:w-auto lg:max-w-[845px] lg:text-[12px] lg:leading-[14.4px]"
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
