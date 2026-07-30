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

  // The footer's pale-teal canvas. The top wave must read as this same edge,
  // so the wave fill defaults to it too — keep the two in sync.
  const FOOTER_BG = "#e8f3f8";

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

<footer class="mt-auto w-full text-dark" style="background-color: {FOOTER_BG}">
  <!-- The top wave is the footer's OWN pale-teal edge dipping up into whatever
       band sits above (the dark closing CTA on home, a light section elsewhere)
       — so its fill defaults to the footer canvas, not the neighbour's. It sits
       flush at the very top before any footer padding. -->
  <WaveDivider fill={waveFill} height={160} width="169%" />

  <div class="px-8 pt-12 pb-12">
    <div class="mx-auto max-w-6xl">
      {#if heading}
        <p class="font-slab text-primary-deep mb-8 text-2xl font-light">
          {heading}
        </p>
      {/if}
      {#if columns?.length}
        <div class="grid gap-10 lg:grid-cols-[1fr_20rem] lg:gap-16">
          <div class="flex flex-col justify-between gap-10 sm:flex-row">
            {#each columns as col, colIndex (colIndex)}
              <div class="flex flex-col gap-2">
                {#each col.items as item, itemIndex (itemIndex)}
                  {#if isImage(item)}
                    {#if item.href}
                      <a {...linkAttrs(item.href)}>{@render logo(item.image)}</a
                      >
                    {:else}
                      {@render logo(item.image)}
                    {/if}
                  {:else if item.href}
                    <a
                      {...linkAttrs(item.href)}
                      class="hover:text-primary-deep transition-colors"
                      >{item.text}</a
                    >
                  {:else}
                    <p class="text-dark/70">{item.text}</p>
                  {/if}
                {/each}
              </div>
            {/each}
          </div>
          {#if showMap}
            <div class="w-full">
              <MapEmbed query={mapQuery} />
            </div>
          {/if}
        </div>
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
