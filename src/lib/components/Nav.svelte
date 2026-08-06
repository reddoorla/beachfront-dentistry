<script lang="ts">
  import { Menu, X, ChevronDown } from "@lucide/svelte";
  import { onMount } from "svelte";
  import { fly } from "svelte/transition";
  import { quintOut } from "svelte/easing";
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
    /** Tailwind sizing for the logo <img> (default fleet size is `h-8`).
     * Beachfront's compact circular badge runs larger to match the live bar. */
    logoClass?: string;
    /** On a page that opens with a full-bleed dark hero, start the bar
     * transparent (over the hero) and turn it solid once scrolled. */
    transparentAtTop?: boolean;
    /** Collapse to a logo + hamburger bar at every breakpoint (no inline links
     * or CTA pills on desktop), opening the same full-screen menu. Matches the
     * live Beachfront chrome; other fleet sites leave this false and keep their
     * inline desktop nav. */
    hamburgerOnly?: boolean;
    /** Optional menu-trigger icon URL. When set, the hamburger renders this
     * exact asset (e.g. Beachfront's live `menu=white` svg) instead of the
     * generic Lucide glyph — matching the reference's own icon weight/colour. */
    hamburgerSrc?: string;
  }

  let {
    navLinks = [],
    items = [],
    logo,
    logoClass = "h-8 w-auto",
    transparentAtTop = false,
    hamburgerOnly = false,
    hamburgerSrc,
  }: Props = $props();

  // The bar is solid unless it's explicitly a transparent-over-hero page AND
  // still at the top. `scrolled` flips after a small threshold; it starts false
  // (matching SSR, where the page always loads at the top → no hydration jump).
  let scrolled = $state(false);
  const navSolid = $derived(!transparentAtTop || scrolled);
  onMount(() => {
    const onScroll = () => (scrolled = window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  });

  let isMenuOpen = $state(false);
  let openButtonEl = $state<HTMLButtonElement>();
  // Which desktop dropdown is expanded (click-toggles + hover/focus reveal).
  let openDesktopIndex = $state<number | null>(null);

  // A migrated Blux site passes flat `navLinks` via page data → the flat-links
  // chrome wins; every other route falls back to the site-config `items`/`logo`
  // dropdown nav.
  const useNavLinks = $derived(navLinks.length > 0);

  const openMenu = () => (isMenuOpen = true);
  const closeMenu = () => (isMenuOpen = false);
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
  <!-- site-config (#71) chrome: logo + dropdown nav. Live's `.header` is an
       ABSOLUTE transparent overlay (z-10, 120px tall) that scrolls away with
       the page — never sticky, never solid (the hero's own top gradient
       carries logo legibility). The hamburgerOnly (Beachfront) chrome matches
       that; the fleet default keeps the sticky solid-on-scroll band. -->
  <nav
    class="top-0 left-0 z-50 isolate w-full text-white {hamburgerOnly
      ? 'absolute bg-transparent'
      : `fixed transition-colors duration-300 ${navSolid ? 'bg-primary-deep' : 'bg-transparent'}`}"
  >
    <!-- Legibility scrim while transparent over a bright hero; it sits behind
         the content (-z-10, above only the nav's own bg) and fades out as the
         bar goes solid. Live's beachfront header has no scrim — its heroes
         paint their own top gradient — so the hamburgerOnly chrome skips it. -->
    {#if transparentAtTop && !hamburgerOnly}
      <div
        aria-hidden="true"
        class="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-black/40 to-transparent transition-opacity duration-300 {navSolid
          ? 'opacity-0'
          : 'opacity-100'}"
      ></div>
    {/if}
    <!-- Content sits in live's `content-width` band: capped at 1400px and
         centred (so on wide screens the logo/hamburger don't hug the edges),
         with 60px side padding at desktop. The nav itself stays full-bleed so
         its solid band spans edge to edge. Live's bar is 120px tall at
         desktop (.header height 3rem at the 40px root). -->
    <!-- Live's bar gutter matches its content gutter: 20px @390, 48px across
         the tablet band, then 60px + the 1400 cap (= x-80 at 1440). -->
    <div
      class="mx-auto flex max-w-[1400px] items-center justify-between px-5 py-5 md:px-12 md:py-6 lg:h-[120px] lg:px-[60px] lg:py-0"
    >
      <a href="/" class="flex items-center text-lg font-bold">
        {#if logo}
          <img
            src={logo.url}
            alt="Home"
            class={logoClass}
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
             throws each_key_duplicate at hydration). gap-4 until xl: measured at a
             1024px viewport (real museo fonts) the items + both pills fill the band
             to 0px slack at gap-8 and 1px at gap-6 — gap-4 buys ~33px headroom. -->
          <ul
            class="hidden items-center gap-4 xl:gap-8 {hamburgerOnly
              ? ''
              : 'lg:flex'}"
          >
            {#each items as item, i (i)}
              {#if item.children && item.children.length > 0}
                <li class="group relative">
                  <button
                    type="button"
                    class="flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary-deep focus-visible:outline-hidden"
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
                  <a
                    href={item.href}
                    class="hover:opacity-80 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary-deep focus-visible:outline-hidden"
                    >{item.label}</a
                  >
                </li>
              {:else}
                <li><span>{item.label}</span></li>
              {/if}
            {/each}
          </ul>

          <!-- Phone + appointment/payment CTAs — desktop only; mirrored in the
             mobile menu below (the two clusters carry the same links — edit
             them together). The band itself is deep brand blue, so the "solid"
             CTA needs to be white-on-blue to read as solid there (a blue fill
             would vanish into the band), and the outline CTA needs a white
             ring instead of the brand-color ring that reads on a light bg.
             The phone number is xl-only (xl = Tailwind's default 1280px — the
             theme's --screen-* vars are width utilities, not breakpoints):
             measured at a 1024px viewport the items + both pills alone leave
             ~33px slack, so adding the phone would force the item labels to
             wrap inside the band. -->
          <div
            class="items-center gap-4 {hamburgerOnly
              ? 'hidden'
              : 'hidden lg:flex'}"
          >
            <a
              href={PHONE.href}
              class="hidden font-slab focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary-deep focus-visible:outline-hidden xl:inline"
              >{PHONE.display}</a
            >
            <a
              href="#appointment"
              class="rounded-full bg-white px-5 py-2 font-semibold text-primary-deep hover:bg-white/90 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary-deep focus-visible:outline-hidden"
              >Request Appointment</a
            >
            <a
              href={MODENTO_URL}
              class="rounded-full border border-white px-5 py-2 text-white hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary-deep focus-visible:outline-hidden"
              target="_blank"
              rel="noopener">Make a Payment</a
            >
          </div>

          {#if !isMenuOpen}
            <!-- justify-END, not center: the min-w-11 box is an a11y tap target
                 we add on top of live's icon, and centring the glyph inside it
                 pushed it 10px inboard of live's right edge at every
                 breakpoint. Ending it keeps the 44px target AND live's x. -->
            <button
              bind:this={openButtonEl}
              type="button"
              class="flex min-h-11 min-w-11 items-center justify-end {hamburgerOnly
                ? ''
                : 'lg:hidden'}"
              onclick={openMenu}
              aria-label="Open menu"
            >
              {#if hamburgerSrc}
                <!-- Live's exact icon (#E7F5FA, thick bars) — matches the
                   reference's weight/colour where the Lucide glyph would not.
                   Its `.header-hamburger` is 1rem of live's stepped root, so
                   it steps 24×19 / 32×25 / 40×31 with the logo. -->
                <img src={hamburgerSrc} alt="" class="w-6 md:w-8 lg:w-10" />
              {:else}
                <Menu size={28} />
              {/if}
            </button>
          {/if}
        </div>
      {/if}
    </div>
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
    <!-- Live's .dropdown-modal: a full-screen cyan wash (#129ecc @ 92%) over
         the beach photo (its own asset), sliding down from the top. Links are
         white museo-slab h3s (hover opacity .5) in a 60vh justify-between
         column starting at 10% down; the phone rides the same style; the two
         CTAs are the white-outlined .button.nav pills. Logo badge stays
         top-left, live's own X icon top-right. -->
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      class="fixed inset-0 z-50 h-dvh w-screen overflow-y-auto {hamburgerOnly
        ? ''
        : 'lg:hidden'}"
      style="background-color:#129ecc;background-image:linear-gradient(rgba(18,158,204,0.92), rgba(18,158,204,0.92)),url('/menu-beach.jpg');background-position:0 0,50%;background-size:auto,cover"
      transition:fly={{ y: -800, duration: 700, easing: quintOut }}
      use:trapFocus={{ onEscape: closeMenu, restoreFocus: () => openButtonEl }}
    >
      <div
        class="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-4 lg:h-[120px] lg:px-[60px] lg:py-0"
      >
        {#if logo}
          <a
            href="/"
            onclick={closeMenu}
            class="transition-opacity hover:opacity-60"
          >
            <img src={logo.url} alt="Home" class={logoClass} />
          </a>
        {:else}
          <span></span>
        {/if}
        <button
          type="button"
          class="flex min-h-11 min-w-11 items-center justify-center transition-opacity hover:opacity-60"
          onclick={closeMenu}
          aria-label="Close menu"
        >
          <img src="/icons/menu-close-white.svg" alt="" class="w-10" />
        </button>
      </div>

      <!-- Live's column is NOT spread by its 60vh box — the h3 links carry
           Webflow's 20px/10px block margins plus the container's 10px gap, a
           90px pitch that naturally overflows the box (measured off the open
           modal). -->
      <nav
        class="absolute top-[10%] flex w-full flex-col items-center gap-2.5"
        aria-label="Menu links"
      >
        <a
          href="/"
          onclick={closeMenu}
          class="font-slab mt-5 mb-2.5 text-[30px] leading-[40px] font-light text-white transition-opacity duration-[350ms] hover:opacity-60 lg:text-[40px] lg:leading-[50px]"
          >Home Page</a
        >
        {#each items as item, i (i)}
          {#if item.href}
            <a
              href={item.href}
              onclick={closeMenu}
              class="font-slab mt-5 mb-2.5 text-[30px] leading-[40px] font-light text-white transition-opacity duration-[350ms] hover:opacity-60 lg:text-[40px] lg:leading-[50px]"
              >{item.label}</a
            >
          {/if}
        {/each}
        <a
          href={PHONE.href}
          onclick={closeMenu}
          class="font-slab mt-5 mb-2.5 text-[30px] leading-[40px] font-light text-white transition-opacity duration-[350ms] hover:opacity-60 lg:text-[40px] lg:leading-[50px]"
          >{PHONE.display}</a
        >
        <a
          href="#appointment"
          onclick={closeMenu}
          class="font-slab mt-5 mb-2.5 inline-flex h-[41px] items-center rounded-lg border border-white px-[14px] text-[15px] font-light text-white transition-[opacity,background-color] hover:bg-[#129ecc4a] hover:opacity-60 lg:h-[67px] lg:px-[25px] lg:text-[25px]"
          >Book an Appointment</a
        >
        <a
          href={MODENTO_URL}
          target="_blank"
          rel="noopener"
          onclick={closeMenu}
          class="font-slab mt-5 mb-2.5 inline-flex h-[41px] items-center rounded-lg border border-white px-[14px] text-[15px] font-light text-white transition-[opacity,background-color] hover:bg-[#129ecc4a] hover:opacity-60 lg:h-[67px] lg:px-[25px] lg:text-[25px]"
          >Make a Payment</a
        >
      </nav>
    </div>
  {/if}
{/if}
