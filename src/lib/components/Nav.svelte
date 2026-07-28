<script lang="ts">
  import { Menu, X, ChevronDown } from "@lucide/svelte";
  import { trapFocus } from "$lib/actions/trapFocus";
  import { fade } from "$lib/transitions";
  import { PHONE, MODENTO_URL } from "$lib/site";
  import type { NavItem } from "$lib/blux/site-config";

  interface NavLink {
    text: string;
    href: string;
  }

  interface Props {
    /** Flat page-data nav links (a migrated Blux site supplies these). When
     * non-empty they take precedence — inline links on desktop, a focus-trapped
     * full-screen menu on mobile. */
    navLinks?: NavLink[];
    /** Nav entries — a leaf is a link; an entry with `children` is a dropdown.
     * Omit for a logo-only bar (the unconverted-starter default). */
    items?: NavItem[];
    /** The site logo (a converted site's resolved logo url); falls back to the
     * "Logo" wordmark. */
    logo?: { url: string; maxWidth?: string };
  }

  let { navLinks = [], items = [], logo }: Props = $props();

  let isMenuOpen = $state(false);
  let openButtonEl = $state<HTMLButtonElement>();
  // Which dropdown is expanded. Desktop click-toggles + hover/focus reveal;
  // mobile is a tap accordion.
  let openMobileIndex = $state<number | null>(null);
  let openDesktopIndex = $state<number | null>(null);

  // A migrated Blux site passes flat `navLinks` via page data → the flat-links
  // chrome wins; every other route falls back to the site-config `items`/`logo`
  // dropdown nav.
  const useNavLinks = $derived(navLinks.length > 0);

  const openMenu = () => (isMenuOpen = true);
  const closeMenu = () => {
    isMenuOpen = false;
    openMobileIndex = null;
  };
</script>

{#if useNavLinks}
  <!-- navLinks (page-data) chrome: inline links on desktop, focus-trapped
       full-screen menu on mobile. -->
  <nav
    class="fixed top-0 left-0 z-50 flex w-full items-center justify-between px-8 py-4"
  >
    <a href="/" class="text-lg font-bold">Logo</a>

    <div class="hidden items-center gap-8 lg:flex">
      {#each navLinks as link (link.href)}
        <a href={link.href}>{link.text}</a>
      {/each}
    </div>

    {#if !isMenuOpen}
      <button
        bind:this={openButtonEl}
        type="button"
        class="flex min-h-11 min-w-11 items-center justify-center lg:hidden"
        onclick={openMenu}
        aria-label="Open menu"
      >
        <Menu size={24} />
      </button>
    {/if}
  </nav>
{:else}
  <!-- site-config (#71) chrome: logo + dropdown nav. Beachfront's live nav is a
       solid brand-blue band with a white wordmark — bg-primary/text-white here,
       not the translucent bg-background/95 band the unstyled starter shipped. -->
  <nav
    class="fixed top-0 left-0 z-50 flex w-full items-center justify-between bg-primary px-8 py-4 text-white"
  >
    <a href="/" class="flex items-center text-lg font-bold">
      {#if logo}
        <img
          src={logo.url}
          alt="Home"
          class="h-8 w-auto"
          style={logo.maxWidth ? `max-width:${logo.maxWidth}` : undefined}
        />
      {:else}
        Logo
      {/if}
    </a>

    {#if items.length > 0}
      <!-- Groups the link list, phone/CTA cluster, and mobile trigger as one
           flex item so `justify-between` on <nav> reads as [logo] ↔ [everything
           else], instead of spreading three separate groups apart. -->
      <div class="flex items-center gap-6">
        <!-- Desktop: inline top items. An item with children is a disclosure —
             click toggles it (aria-expanded), and hover/focus-within also reveal it
             for pointer/keyboard-tab users. Keyed by index: nav labels/hrefs aren't
             unique (two "" heading hrefs or repeated labels would collide and Svelte
             throws each_key_duplicate at hydration). -->
        <ul class="hidden items-center gap-8 lg:flex">
          {#each items as item, i (i)}
            {#if item.children && item.children.length > 0}
              <li class="group relative">
                <button
                  type="button"
                  class="flex items-center gap-1"
                  aria-expanded={openDesktopIndex === i}
                  aria-controls="nav-dropdown-{i}"
                  onclick={() =>
                    (openDesktopIndex = openDesktopIndex === i ? null : i)}
                  onkeydown={(e) => {
                    if (e.key === "Escape") openDesktopIndex = null;
                  }}
                >
                  {item.label}
                  <ChevronDown size={16} aria-hidden="true" />
                </button>
                <ul
                  id="nav-dropdown-{i}"
                  class="absolute top-full left-0 flex min-w-48 flex-col gap-1 bg-background p-2 text-dark shadow-lg transition-opacity group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100"
                  class:invisible={openDesktopIndex !== i}
                  class:opacity-0={openDesktopIndex !== i}
                >
                  {#each item.children as child, ci (ci)}
                    <li>
                      {#if child.href}
                        <a
                          href={child.href}
                          class="block px-3 py-2 hover:opacity-70"
                          >{child.label}</a
                        >
                      {:else}
                        <span class="block px-3 py-2">{child.label}</span>
                      {/if}
                    </li>
                  {/each}
                </ul>
              </li>
            {:else if item.href}
              <li>
                <a href={item.href} class="hover:opacity-80">{item.label}</a>
              </li>
            {:else}
              <li><span>{item.label}</span></li>
            {/if}
          {/each}
        </ul>

        <!-- Phone + appointment/payment CTAs — desktop only; mirrored in the
             mobile menu below. The band itself is primary blue, so the "solid"
             CTA needs to be white-on-blue to read as solid there (bg-primary
             would vanish into the band), and the outline CTA needs a white
             ring instead of the brand-color ring that reads on a light bg. -->
        <div class="hidden items-center gap-4 lg:flex">
          <a href={PHONE.href} class="font-slab">{PHONE.display}</a>
          <a
            href="#appointment"
            class="rounded-full bg-white px-5 py-2 font-semibold text-primary hover:bg-white/90"
            >Request Appointment</a
          >
          <a
            href={MODENTO_URL}
            class="rounded-full border border-white px-5 py-2 text-white hover:bg-white/10"
            target="_blank"
            rel="noopener">Make a Payment</a
          >
        </div>

        {#if !isMenuOpen}
          <button
            bind:this={openButtonEl}
            type="button"
            class="flex min-h-11 min-w-11 items-center justify-center lg:hidden"
            onclick={openMenu}
            aria-label="Open menu"
          >
            <Menu size={24} />
          </button>
        {/if}
      </div>
    {/if}
  </nav>
{/if}

{#if isMenuOpen}
  <!-- The open trigger above unmounts while the menu is open, so the element
       trapFocus captured is detached by close time — `restoreFocus` hands it
       the re-mounted trigger instead. -->
  {#if useNavLinks}
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      class="fixed inset-0 z-50 flex h-dvh w-screen flex-col items-center justify-center gap-8 bg-background lg:hidden"
      transition:fade
      use:trapFocus={{ onEscape: closeMenu, restoreFocus: () => openButtonEl }}
    >
      <button
        type="button"
        class="absolute top-4 right-8 flex min-h-11 min-w-11 items-center justify-center"
        onclick={closeMenu}
        aria-label="Close menu"
      >
        <X size={24} />
      </button>

      {#each navLinks as link (link.href)}
        <a href={link.href} class="px-4 py-3" onclick={closeMenu}>{link.text}</a
        >
      {/each}
    </div>
  {:else}
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      class="fixed inset-0 z-50 flex h-dvh w-screen flex-col items-center justify-center gap-4 overflow-y-auto bg-background py-20 lg:hidden"
      transition:fade
      use:trapFocus={{ onEscape: closeMenu, restoreFocus: () => openButtonEl }}
    >
      <button
        type="button"
        class="absolute top-4 right-8 flex min-h-11 min-w-11 items-center justify-center"
        onclick={closeMenu}
        aria-label="Close menu"
      >
        <X size={24} />
      </button>

      {#each items as item, i (i)}
        {#if item.children && item.children.length > 0}
          <!-- Mobile: a dropdown becomes an accordion — tap to expand its links. -->
          <div class="flex flex-col items-center gap-2">
            <button
              type="button"
              class="flex items-center gap-1 px-4 py-2"
              aria-expanded={openMobileIndex === i}
              onclick={() =>
                (openMobileIndex = openMobileIndex === i ? null : i)}
            >
              {item.label}
              <ChevronDown size={16} aria-hidden="true" />
            </button>
            {#if openMobileIndex === i}
              {#each item.children as child, ci (ci)}
                {#if child.href}
                  <a
                    href={child.href}
                    class="px-4 py-2 opacity-80"
                    onclick={closeMenu}>{child.label}</a
                  >
                {:else}
                  <span class="px-4 py-2 opacity-80">{child.label}</span>
                {/if}
              {/each}
            {/if}
          </div>
        {:else if item.href}
          <a href={item.href} class="px-4 py-3" onclick={closeMenu}
            >{item.label}</a
          >
        {:else}
          <span class="px-4 py-3">{item.label}</span>
        {/if}
      {/each}

      <!-- Phone + CTAs mirrored from the desktop band. This menu sits on the
           light default background, so these use the brand-solid/brand-outline
           pairing directly — no white-on-band override needed here. -->
      <a href={PHONE.href} class="px-4 py-3 font-slab" onclick={closeMenu}
        >{PHONE.display}</a
      >
      <a
        href="#appointment"
        class="rounded-full bg-primary px-6 py-3 text-white"
        onclick={closeMenu}>Request Appointment</a
      >
      <a
        href={MODENTO_URL}
        class="rounded-full border border-primary px-6 py-3 text-primary"
        target="_blank"
        rel="noopener"
        onclick={closeMenu}>Make a Payment</a
      >
    </div>
  {/if}
{/if}
