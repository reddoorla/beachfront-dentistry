<script lang="ts">
  import { Menu, X, ChevronDown } from "@lucide/svelte";
  import { onMount } from "svelte";
  import { cubicIn, expoOut } from "svelte/easing";
  import { trapFocus } from "$lib/actions/trapFocus";
  import { fade, fly } from "$lib/transitions";
  import { PHONE, MODENTO_URL } from "$lib/site";
  import { pillClass } from "$lib/components/OutlineButton.svelte";
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
  //
  // Only the `!hamburgerOnly` chrome reads `navSolid` (the bar's bg ternary and
  // the legibility scrim below), and Beachfront's layout passes `hamburgerOnly`
  // on every route — so before this guard a scroll listener ran on every scroll
  // of every page and its result was discarded. The listener is GATED rather
  // than DELETED because the sticky solid-on-scroll bar is still a live,
  // prop-reachable capability of this component (`hamburgerOnly` defaults to
  // false — that is the fleet default chrome, and Nav.test.ts exercises it);
  // deleting the path would remove a documented feature to fix a wasted
  // listener. Under `hamburgerOnly` nothing subscribes to scroll at all.
  let scrolled = $state(false);
  const navSolid = $derived(!transparentAtTop || scrolled);
  onMount(() => {
    if (hamburgerOnly) return;
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

  // --- menu-overlay motion -------------------------------------------------
  //
  // Character: the site runs everything on `--transition-out-expo`
  // (app.css:70 = cubic-bezier(.19,1,.22,1)) — the carousel's 2s glide, the
  // animateIn reveals, the reviews expander. `expoOut` is that curve's JS
  // twin, so the menu moves in the same hand as the rest of the page.
  //
  // OPEN — two coordinated parts, 750ms nominal for a 9-row column (the last
  // row starts at 90 + 8*45 = 450ms and runs 300ms), though expoOut front-loads
  // so hard that it is perceptually done by ~600ms:
  //   • the cyan wash cross-fades up over 300ms. It does NOT translate — the
  //     overlay's chrome band mirrors the closed bar pixel for pixel, so any
  //     movement of the sheet would slide the logo away from the spot it
  //     already occupies (and the X would not land on the hamburger it
  //     replaces). Holding the sheet still is what makes that swap read as one
  //     control changing state instead of two elements trading places.
  //   • the links cascade up 22px, 300ms each, 45ms apart.
  //
  // The 90ms lead is measured, not guessed: on expoOut the wash is already
  // ~0.88 opaque at 90ms (and 0.97 by 120ms). Any later and the backdrop has
  // visibly finished before the first link moves, which reads as two animations
  // played in sequence rather than one reveal; any earlier and the first links
  // are white-on-half-transparent over the hero still showing through.
  //
  // CLOSE is deliberately NOT the entrance reversed. Rewinding a 9-step cascade
  // is ~750ms of watching a decision you have already made; the sheet instead
  // leaves as one object in 170ms on an ease-IN curve (accelerate away), and
  // the links get no outro of their own.
  //
  // Reduced motion: `fade`/`fly` are the $lib/transitions wrappers, which zero
  // BOTH duration and delay. That is load-bearing for the stagger — the global
  // reset in app.css (490-497) flattens animation/transition *durations* only,
  // so a CSS-delay cascade would still have made the last link wait ~480ms
  // with reduce on. Anything with a delay has to come through this module.
  const MENU_WASH_IN = 300;
  const MENU_WASH_OUT = 170;
  const MENU_LINK_DURATION = 300;
  const MENU_LINK_STAGGER = 45;
  const MENU_LINK_LEAD = 90;
  const MENU_LINK_RISE = 22;
  /** Intro params for the nth link in the overlay column (0-based, top down). */
  const linkIn = (i: number) => ({
    y: MENU_LINK_RISE,
    duration: MENU_LINK_DURATION,
    delay: MENU_LINK_LEAD + i * MENU_LINK_STAGGER,
    easing: expoOut,
  });

  // The overlay column is a FLAT list of leaf links (live's modal has no
  // accordion), so a dropdown-only parent contributes no row. Filtering here
  // rather than with an `{#if}` inside the loop keeps the cascade index equal
  // to the link's real position in the column — a skipped parent would
  // otherwise punch a 45ms hole in the middle of the sequence.
  const menuLeafItems = $derived(items.filter((item) => item.href));

  // --- the bar's icon controls: hover + PRESS affordance --------------------
  //
  // The trigger used to be `transition-opacity hover:opacity-40`, which is two
  // defects in one class. `hover:` compiles behind `@media (hover: hover)`, so
  // a phone got NO feedback at all on the site's only navigation control — and
  // a tap that looks like nothing happened gets tapped again, the second tap
  // landing after the overlay has mounted and closing it. In a mouse context
  // the control faded to 0.4, the browser's own disabled idiom.
  //
  // The replacement is ADDITIVE — a brand pill grows in behind the glyph
  // (0.9 → 1, 0 → .7 opacity) and the glyph itself dips to 0.9 while held —
  // and it is driven by POINTER EVENTS, not by `:active` alone. That is
  // measured, not assumed: dispatching a real `Input.dispatchTouchEvent`
  // touchStart on the trigger (Chromium 1440 and 390, iPhone-13 emulation,
  // held 600ms) leaves `el.matches(":active")` FALSE and the pill at opacity 0.
  // A CSS-only `active:` press is therefore exactly the same class of defect as
  // the `hover:` it replaced: correct on a mouse, invisible on the device the
  // bug is about. `onpointerdown` fires for touch, pen and mouse alike, so the
  // press state below is what the phone actually gets; the `group-active:`
  // variants ride alongside it purely for keyboard Space, which browsers do
  // deliver as `:active` and which produces no pointer event.
  //
  // Reduced-motion callers still get the state change — app.css flattens
  // transition DURATION, not the end state, so the pill appears instantly
  // instead of growing.
  //
  // TONE is per-ground, not per-control: the pill has to be visible against
  // whatever sits behind the bar. Over a hero photo that is `--color-primary`
  // (#129ecc); inside the open menu the ground already IS #129ecc, where a
  // cyan pill would be invisible, so it steps to `--color-primary-deep`.
  // Everything else about the two controls — geometry, timings, curve — is
  // shared, so they read as one control changing state.
  const ICON_BUTTON =
    "group relative flex min-h-11 min-w-11 items-center rounded-full focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary-deep focus-visible:outline-hidden";
  const ICON_GLYPH =
    "relative inline-flex items-center justify-center transition-[opacity,scale] duration-150 ease-[var(--transition-out-expo)] group-active:scale-90 group-active:opacity-90 group-data-[pressed]:scale-90 group-data-[pressed]:opacity-90";
  const ICON_PILL =
    "pointer-events-none absolute inset-[-8px] scale-90 rounded-full opacity-0 transition-[opacity,scale] duration-150 ease-[var(--transition-out-expo)] group-hover:scale-100 group-hover:opacity-70 group-active:scale-100 group-active:opacity-95 group-data-[pressed]:scale-100 group-data-[pressed]:opacity-95";

  /** Which icon control is currently held. Cleared on up/cancel/leave/blur so a
   *  finger that slides off the target, or a drag that the browser turns into a
   *  scroll, never leaves the pill stuck on. */
  let pressedControl = $state<string | null>(null);
  const pressProps = (key: string) => ({
    "data-pressed": pressedControl === key ? "" : undefined,
    onpointerdown: () => (pressedControl = key),
    onpointerup: () => (pressedControl = null),
    onpointercancel: () => (pressedControl = null),
    onpointerleave: () => (pressedControl = null),
    onblur: () => (pressedControl = null),
  });

  // The logo carried TWO fades that multiplied — the anchor's `hover:opacity-60`
  // and the img's `group-hover:opacity-50` — landing the practice's mark at an
  // effective 0.30, which reads as "disabled" or "image failed" rather than
  // "link home". Worse, the open-menu copy of the img rule was dead (its anchor
  // had no `group`), so the same control faded to 0.30 closed and 0.60 open.
  // One treatment now, shared by both: a single 0.85 step plus a 1.04 lift, and
  // the imgs carry no hover rule of their own.
  const LOGO_LINK =
    "flex items-center rounded-sm transition-[opacity,scale] duration-200 ease-[var(--transition-out-expo)] hover:scale-[1.04] hover:opacity-85 active:scale-100 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary-deep focus-visible:outline-hidden";

  // The trigger unmounts while the overlay is open and the overlay renders its
  // own Close in the same slot, so `aria-expanded` cannot flip on one element.
  // Both buttons therefore carry the pair, pointing at the dialog's id: a
  // reader querying `[aria-controls="nav-menu"]` sees false → true across the
  // swap, and either button announces the menu's state on its own.
  const MENU_ID = "nav-menu";
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
        class="{ICON_BUTTON} justify-center lg:hidden"
        onclick={openMenu}
        aria-label="Open menu"
        aria-expanded={isMenuOpen}
        aria-controls={MENU_ID}
        {...pressProps("trigger")}
      >
        <span class={ICON_GLYPH}>
          <span aria-hidden="true" class="{ICON_PILL} bg-primary"></span>
          <Menu size={24} class="relative" />
        </span>
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
      <a href="/" class="{LOGO_LINK} text-lg font-bold">
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
          <!-- The inline link list and the phone/CTA cluster below belong to the
             FLEET default chrome only. `hamburgerOnly` collapses the bar to
             logo + trigger at every breakpoint, and both blocks used to render
             anyway with no `lg:flex` to un-hide them — eight controls that were
             `display:none` on every page of this site, on every render, forever.
             They are not "the desktop copies of the overlay links": under
             `hamburgerOnly` the overlay column below is the ONLY real one.
             An `{#if}` keeps them out of the DOM here while leaving the fleet
             chrome (hamburgerOnly=false) exactly as it was. -->
          {#if !hamburgerOnly}
            <!-- Desktop: inline top items. An item with children is a disclosure —
             click toggles it (aria-expanded), and hover/focus-within also reveal it
             for pointer/keyboard-tab users. Keyed by index: nav labels/hrefs aren't
             unique (two "" heading hrefs or repeated labels would collide and Svelte
             throws each_key_duplicate at hydration). gap-4 until xl: measured at a
             1024px viewport (real museo fonts) the items + both pills fill the band
             to 0px slack at gap-8 and 1px at gap-6 — gap-4 buys ~33px headroom. -->
            <ul class="hidden items-center gap-4 lg:flex xl:gap-8">
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

            <!-- Phone + appointment/payment CTAs — the fleet chrome's desktop
             cluster. It carries the same links as the overlay column below;
             they are two INDEPENDENT chromes, not copies to be kept in sync
             (only one can render: this one needs hamburgerOnly=false, the
             overlay is what hamburgerOnly=true leaves). The band itself is deep
             brand blue, so the "solid" CTA needs to be white-on-blue to read as
             solid there (a blue fill would vanish into the band), and the
             outline CTA needs a white ring instead of the brand-color ring that
             reads on a light bg. The phone number is xl-only (xl = Tailwind's
             default 1280px — the theme's --screen-* vars are width utilities,
             not breakpoints): measured at a 1024px viewport the items + both
             pills alone leave ~33px slack, so adding the phone would force the
             item labels to wrap inside the band. -->
            <div class="hidden items-center gap-4 lg:flex">
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
          {/if}

          {#if !isMenuOpen}
            <!-- justify-END, not center: the min-w-11 box is an a11y tap target
                 we add on top of live's icon, and centring the glyph inside it
                 pushed it 10px inboard of live's right edge at every
                 breakpoint. Ending it keeps the 44px target AND live's x. -->
            <button
              bind:this={openButtonEl}
              type="button"
              class="{ICON_BUTTON} justify-end {hamburgerOnly
                ? ''
                : 'lg:hidden'}"
              onclick={openMenu}
              aria-label="Open menu"
              aria-expanded={isMenuOpen}
              aria-controls={MENU_ID}
              {...pressProps("trigger")}
            >
              <!-- The glyph is `relative` so it paints ABOVE the absolutely
                   positioned pill behind it (both are in the same stacking
                   context; a static child would lose to a positioned sibling
                   regardless of source order). -->
              <span class={ICON_GLYPH}>
                <span aria-hidden="true" class="{ICON_PILL} bg-primary"></span>
                {#if hamburgerSrc}
                  <!-- Live's exact icon (#E7F5FA, thick bars) — matches the
                     reference's weight/colour where the Lucide glyph would not.
                     Its `.header-hamburger` is 1rem of live's stepped root, so
                     it steps 24×19 / 32×25 / 40×31 with the logo. -->
                  <img
                    src={hamburgerSrc}
                    alt=""
                    class="relative w-6 md:w-8 lg:w-10"
                  />
                {:else}
                  <Menu size={28} class="relative" />
                {/if}
              </span>
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
  <!-- Every transition under this `{#if}` is `|global`, and that is not
       decoration. Svelte transitions are LOCAL by default: they play when
       their OWN block is created, not when an ancestor's is. Both overlays sit
       one block deeper (`{#if useNavLinks}` / `{:else}`) than the `{#if
       isMenuOpen}` that actually toggles, so a local directive here is dead
       code — probed 2026-08-12 on the pre-existing `transition:fly={{y:-800,
       duration:700}}`: zero animations on the dialog or any descendant for
       every frame after the click, opacity 1 and transform none from frame 0.
       The menu had been popping open, which is the "abrupt" this round was
       asked to fix. `|global` is what makes the directive run at all. -->
  {#if useNavLinks}
    <div
      id={MENU_ID}
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      class="fixed inset-0 z-50 flex h-dvh w-screen flex-col items-center justify-center gap-8 bg-background lg:hidden"
      transition:fade|global
      use:trapFocus={{ onEscape: closeMenu, restoreFocus: () => openButtonEl }}
    >
      <button
        type="button"
        class="{ICON_BUTTON} absolute top-4 right-8 justify-center"
        onclick={closeMenu}
        aria-label="Close menu"
        aria-expanded={isMenuOpen}
        aria-controls={MENU_ID}
        {...pressProps("close")}
      >
        <span class={ICON_GLYPH}>
          <span aria-hidden="true" class="{ICON_PILL} bg-primary"></span>
          <X size={24} class="relative" />
        </span>
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
      id={MENU_ID}
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      class="fixed inset-0 z-50 h-dvh w-screen overflow-y-auto {hamburgerOnly
        ? ''
        : 'lg:hidden'}"
      style="background-color:#129ecc;background-image:linear-gradient(rgba(18,158,204,0.92), rgba(18,158,204,0.92)),url('/menu-beach.jpg');background-position:0 0,50%;background-size:auto,cover"
      in:fade|global={{ duration: MENU_WASH_IN, easing: expoOut }}
      out:fade|global={{ duration: MENU_WASH_OUT, easing: cubicIn }}
      use:trapFocus={{ onEscape: closeMenu, restoreFocus: () => openButtonEl }}
    >
      <!-- Mirrors the closed bar's content band EXACTLY (same px/py ladder as
           the <nav> band above) so the logo and trigger/X sit on the shared
           content gutter and don't jump when the menu opens. Part of the
           MarkUp-H2 "the menu [aligns to the content width] too" directive. -->
      <div
        class="mx-auto flex max-w-[1400px] items-center justify-between px-5 py-5 md:px-12 md:py-6 lg:h-[120px] lg:px-[60px] lg:py-0"
      >
        {#if logo}
          <a href="/" onclick={closeMenu} class={LOGO_LINK}>
            <img src={logo.url} alt="Home" class={logoClass} />
          </a>
        {:else}
          <span></span>
        {/if}
        <!-- The Close takes the TRIGGER's box and icon ladder (justify-end,
             w-6/8/10) it replaces, so the control does not resize or jump
             sideways in the frame the overlay mounts: the X used to be a flat
             w-10 in a justify-CENTER box, which at 390 grew the glyph 67% and
             moved it 10px inboard in one frame. Its press pill steps to
             `--color-primary-deep`: the ground here IS #129ecc, where the bar's
             `bg-primary` pill would be invisible. -->
        <button
          type="button"
          class="{ICON_BUTTON} justify-end"
          onclick={closeMenu}
          aria-label="Close menu"
          aria-expanded={isMenuOpen}
          aria-controls={MENU_ID}
          {...pressProps("close")}
        >
          <span class={ICON_GLYPH}>
            <span aria-hidden="true" class="{ICON_PILL} bg-primary-deep"></span>
            <img
              src="/icons/menu-close-white.svg"
              alt=""
              class="relative w-6 md:w-8 lg:w-10"
            />
          </span>
        </button>
      </div>

      <!-- MarkUp round H2 (thread bac4decb…/team pin #5): the column lives in
           NORMAL FLOW inside the scrolling dialog — the absolute top-[10%]
           that let the links detach from the dialog's scroll geometry (Tim's
           "Make Payment below the fold, no scroll" capture) is gone, so
           overflow-y-auto above can never miss it. Horizontally the links
           stay CENTERED — H2 briefly left-aligned them onto the content
           gutter, and the operator corrected it same-day: "nav should still
           have links centered like before" (LEDGER MARKUP ROUND H2).
           Rhythm: live's h3 links carried Webflow's 20px/10px block margins
           plus the container's 10px gap — a 40px slot, 90px pitch at the lg
           50px line-height. gap-10 IS that 40px slot, moved off the links so
           the column starts flush under the header band instead of re-adding
           the first link's top margin (which is what keeps everything on one
           screen at 1354×930, Tim's capture size). -->
      <!-- The cascade: each row carries `in:fly` with its own delay (see
           `linkIn` above). `fly` only ever sets opacity + transform, so a row
           is hit-testable and focusable from its first frame — the stagger
           never makes a visible link inert, and trapFocus's focusable() probe
           (getClientRects, not opacity) sees the whole column immediately. No
           `out:` on purpose: the rows leave with the wash. -->
      <nav
        class="flex w-full flex-col items-center gap-10"
        aria-label="Menu links"
      >
        <a
          href="/"
          onclick={closeMenu}
          in:fly|global={linkIn(0)}
          class="font-slab text-[30px] leading-[40px] font-light text-white transition-opacity duration-[350ms] hover:opacity-60 lg:text-[40px] lg:leading-[50px]"
          >Home Page</a
        >
        {#each menuLeafItems as item, i (i)}
          <a
            href={item.href}
            onclick={closeMenu}
            in:fly|global={linkIn(i + 1)}
            class="font-slab text-[30px] leading-[40px] font-light text-white transition-opacity duration-[350ms] hover:opacity-60 lg:text-[40px] lg:leading-[50px]"
            >{item.label}</a
          >
        {/each}
        <a
          href={PHONE.href}
          onclick={closeMenu}
          in:fly|global={linkIn(menuLeafItems.length + 1)}
          class="font-slab text-[30px] leading-[40px] font-light text-white transition-opacity duration-[350ms] hover:opacity-60 lg:text-[40px] lg:leading-[50px]"
          >{PHONE.display}</a
        >
        <a
          href="#appointment"
          onclick={closeMenu}
          in:fly|global={linkIn(menuLeafItems.length + 2)}
          class="{pillClass(
            'white',
          )} px-[1em] py-[1.3em] leading-[0] text-[15px] lg:text-[25px]"
          >Request an Appointment</a
        >
        <a
          href={MODENTO_URL}
          target="_blank"
          rel="noopener"
          onclick={closeMenu}
          in:fly|global={linkIn(menuLeafItems.length + 3)}
          class="{pillClass(
            'white',
          )} px-[1em] py-[1.3em] leading-[0] text-[15px] lg:text-[25px]"
          >Make a Payment</a
        >
      </nav>
    </div>
  {/if}
{/if}
