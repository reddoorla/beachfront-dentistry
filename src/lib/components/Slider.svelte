<script lang="ts">
  import { useSwipe, type SwipeCustomEvent } from "svelte-gestures";
  import { onMount, tick, untrack, type Snippet } from "svelte";
  import { viewport } from "$stores/viewport.svelte";

  interface Props {
    itemCount: number;
    /** Accessible name for the carousel region — say what's inside
     *  ("Customer testimonials"), not "Slider". */
    label: string;
    children: Snippet<[{ index: number; clone?: boolean }]>;
    /** Slides visible at once from 768px up. */
    cardsPerView?: number;
    /** Slides visible below 768px (default 1). The live team row keeps several
     * headshots on-screen on mobile rather than one giant one. */
    mobileCardsPerView?: number;
    gap?: string;
    mobileGap?: string;
    /** "slide" translates a track; "fade" cross-dissolves in place
     *  (one slide at a time — cardsPerView is ignored). */
    mode?: "slide" | "fade";
    /** Wrap past the ends. When false, arrows disable at the bounds and
     *  autoplay parks on the last position. */
    loop?: boolean;
    /** Seamless wrap for `loop` in slide mode. At rest the track is plain —
     *  one copy, index 0, the reference's first frame. The FIRST move in either
     *  direction engages three copies of the items with the on-screen cells
     *  becoming the middle copy (same nodes, pixels unchanged), and from then
     *  on every move is one step in the pressed direction, forever: an
     *  invisible snap re-bases the index into the middle copy before the next
     *  move, so there is never a rewind. Copies render `children` with
     *  `clone: true`. Requires `loop`; a no-op when everything already fits.
     *  Tucker, 2026-09-02: "infinite scroll after the first click (in either
     *  direction)". */
    infinite?: boolean;
    /** Auto-advance every N ms. Off by default. Pauses on hover and hidden
     *  tab; focus entering the carousel stops rotation until the user hits
     *  play again (APG); never runs under prefers-reduced-motion. */
    autoplay?: number;
    /** When arrows are hidden, dots render regardless of showDots so the
     *  carousel always keeps a non-swipe control. */
    showDots?: boolean;
    showArrows?: boolean;
    /** "below" (default) puts prev/next in the centered control row under the
     * track; "sides" pins them to the left/right edges, vertically centered on
     * the track (the live team carousel). */
    arrowLayout?: "below" | "sides";
    /** Optional custom glyphs for the "sides" prev/next buttons (e.g. the live
     * team carousel's own arrow assets). Default is the built-in chevron SVG. */
    prevArrow?: Snippet;
    nextArrow?: Snippet;
    /** When set, paints a left/right edge-fade to this colour over the track
     * (below the arrows) so slides dissolve at the margins — live's full-bleed
     * team row. */
    edgeFadeColor?: string;
    /** Fixed slide width at ≥992px (e.g. "200px"). Matches a reference carousel
     * whose cells are a fixed size and overflow the container rather than fitting
     * to it — live's team row: 200px cells, 40px gap, first flush-left, last
     * clipped at the right edge. When set, `cardsPerView` is ignored at desktop
     * and how many are visible is measured from the track width. Below 768px the
     * `mobileCardsPerView` fit-to-container layout is used unchanged. */
    itemWidth?: string;
    /** Fixed cell width in the 768–991 band. A reference sized in REM against a
     * stepped root font (live: 40px ≥992 / 32px 768–991 / 24px ≤767) has THREE
     * tiers, not two — its 5rem headshot is 200/160/120px. Defaults to
     * `itemWidth`, which is the pre-tablet-tier behaviour. */
    tabletItemWidth?: string;
    /** Fixed cell width below 768px (e.g. "120px" — live's team headshots are
     * 200px desktop / 120px mobile, its rem scaled 0.6× under a 40px→24px root).
     * When set, mobile uses fixed cells too; otherwise mobile falls back to the
     * `mobileCardsPerView` fit-to-container layout. */
    mobileItemWidth?: string;
    /** Left offset of the first cell (its distance from the track's left edge),
     * so a full-bleed row can still align its first cell to the content column
     * (live team: 80px at desktop) while the arrows/edge-fades pin to the true
     * screen edges. Only applied when `itemWidth` is set. `trackPadStart` at
     * ≥992px, `tabletTrackPadStart` at 768–991, `mobileTrackPadStart` below. */
    trackPadStart?: string;
    tabletTrackPadStart?: string;
    /** Offset in the 480–767 band. Live's content gutter is a PERCENTAGE below
     * 768 and steps 8% → 5% at 480, so this band needs its own value even
     * though its cell size (a rem against the same 24px root) does not.
     * Defaults to `mobileTrackPadStart`. */
    xsTrackPadStart?: string;
    mobileTrackPadStart?: string;
    /** Gap in the 768–991 band; defaults to `gap`. */
    tabletGap?: string;
    /** Tailwind duration/easing utilities for the slide/fade movement. */
    transitionClass?: string;
    navigationClass?: string;
    arrowClass?: string;
    /** Classes for each slide CELL. A reference whose track has no per-slide
     * wrapper (live's `.team-slider` holds `.team-list-item` cards directly)
     * puts the card's own margin on the card; our generic cell sits between
     * them, so the cell — not the card — is the outermost per-card box, and
     * any margin that belongs to that box has to live here or the two DOMs
     * describe different rectangles. See CollectionList's team slider. */
    slideClass?: string;
    pauseClass?: string;
    /** Style the dot visuals (the button hit areas stay 24px+). */
    dotClass?: string;
    activeDotClass?: string;
    class?: string;
  }

  let {
    itemCount,
    label,
    children,
    cardsPerView = 1,
    mobileCardsPerView = 1,
    gap = "14px",
    mobileGap = "6px",
    mode = "slide",
    loop = true,
    infinite = false,
    autoplay = 0,
    showDots = true,
    showArrows = true,
    arrowLayout = "below",
    prevArrow,
    nextArrow,
    edgeFadeColor,
    itemWidth,
    tabletItemWidth,
    mobileItemWidth,
    trackPadStart,
    tabletTrackPadStart,
    xsTrackPadStart,
    mobileTrackPadStart,
    tabletGap,
    transitionClass = "duration-500 ease-in-out",
    navigationClass = "",
    arrowClass = "",
    slideClass = "",
    pauseClass = "",
    dotClass = "bg-gray-500 group-hover:bg-gray-600 group-active:bg-gray-700",
    activeDotClass = "bg-gray-800",
    class: passedClasses = "",
  }: Props = $props();

  let currentSlide = $state(0);
  /** Infinite mode: has the first move happened (three copies on the track)? */
  let engaged = $state(false);
  /** One frame with the transition suppressed, so a re-base does not glide. */
  let snapping = $state(false);
  let trackEl: HTMLDivElement | undefined = $state();
  let hovered = $state(false);
  let pageHidden = $state(false);
  let reducedMotion = $state(false);
  let userPaused = $state(false);

  onMount(() => viewport.subscribe());

  onMount(() => {
    if (typeof window.matchMedia !== "function") return;
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedMotion = mql.matches;
    const onChange = (e: MediaQueryListEvent) => (reducedMotion = e.matches);
    mql.addEventListener?.("change", onChange);
    return () => mql.removeEventListener?.("change", onChange);
  });

  onMount(() => {
    pageHidden = document.visibilityState === "hidden";
    const onVisibility = () =>
      (pageHidden = document.visibilityState === "hidden");
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  });

  // Fixed-cell mode (cells a fixed size, overflowing the track), keyed to
  // live's own breakpoints (992 / 768 / 480). A reference sized in REM against
  // a stepped root font (40px ≥992, 32px 768–991, 24px ≤767) has three distinct
  // cell sizes, so calibrating only "desktop" and "mobile" leaves the whole
  // 768–991 band rendering the DESKTOP cell — live's 5rem headshot is
  // 200/160/120px and ours was 200px down to 767. The 480 tier exists only for
  // the track offset, whose gutter is a percentage below 768 and steps 8% → 5%.
  // Every tablet/xs prop falls back to its desktop counterpart, so a caller
  // that sets none behaves exactly as before.
  const tier = $derived(
    viewport.width >= 992
      ? "lg"
      : viewport.width >= 768
        ? "md"
        : viewport.width >= 480
          ? "xs"
          : "sm",
  );
  const activeItemWidth = $derived(
    mode === "fade"
      ? undefined
      : tier === "lg"
        ? itemWidth
        : tier === "md"
          ? (tabletItemWidth ?? itemWidth)
          : mobileItemWidth,
  );
  const fixedMode = $derived(!!activeItemWidth);
  const currentGap = $derived(
    tier === "lg" ? gap : tier === "md" ? (tabletGap ?? gap) : mobileGap,
  );
  // The first cell's left offset — only meaningful in fixed-cell mode.
  const currentPadStart = $derived(
    !fixedMode
      ? "0px"
      : tier === "lg"
        ? (trackPadStart ?? "0px")
        : tier === "md"
          ? (tabletTrackPadStart ?? trackPadStart ?? "0px")
          : tier === "xs"
            ? (xsTrackPadStart ?? mobileTrackPadStart ?? "0px")
            : (mobileTrackPadStart ?? "0px"),
  );

  const responsiveCardsPerView = $derived.by(() => {
    if (mode === "fade") return 1;
    if (fixedMode) {
      // How many fixed cells fit across the viewport after the start offset. One
      // extra partial cell is clipped by overflow-hidden (live's 6th headshot),
      // which floor() intentionally excludes from the "fully visible" count.
      // This only bounds arrow travel (maxSlide); the static first frame renders
      // every cell at itemWidth regardless, so an approximate width is fine and
      // avoids a ResizeObserver (unavailable in the test env).
      const iw = parseFloat(activeItemWidth ?? "0");
      const g = parseFloat(currentGap) || 0;
      const pad = parseFloat(currentPadStart) || 0;
      if (!viewport.width || !iw) return 1;
      return Math.max(1, Math.floor((viewport.width - pad + g) / (iw + g)));
    }
    if (viewport.width < 768) return mobileCardsPerView;
    return cardsPerView;
  });

  const maxSlide = $derived(Math.max(0, itemCount - responsiveCardsPerView));

  // ---- infinite mode (see the `infinite` prop) ----
  const mod = (i: number, n: number) => ((i % n) + n) % n;
  const infiniteActive = $derived(
    infinite && loop && mode === "slide" && itemCount > responsiveCardsPerView,
  );
  const copies = $derived(infiniteActive && engaged ? 3 : 1);
  const trackCount = $derived(itemCount * copies);
  /** The item at the leftmost position, whichever copy is on screen. */
  const realIndex = $derived(
    copies === 3 ? mod(currentSlide, itemCount) : currentSlide,
  );
  /** Re-position the track with its transition suppressed for one frame: the
   *  new transform is committed by a forced reflow, so the step that follows
   *  in the same flush animates from it. The suppression must be
   *  `transition-none`, not merely dropping `transition-transform`: the
   *  duration/easing utilities stay on, and with no property list the CSS
   *  default is `all` — the snap itself would animate and the step would
   *  retarget mid-flight, i.e. the very rewind this exists to remove
   *  (probed 2026-09-02: the track glided 0 → −3833px over 500ms). */
  const snapTo = async (index: number, alsoEngage = false) => {
    snapping = true;
    if (alsoEngage) engaged = true;
    currentSlide = index;
    await tick();
    void trackEl?.offsetHeight;
    snapping = false;
  };
  /** First move: three copies, and the index re-based onto the middle one. */
  const engage = () => snapTo(currentSlide + itemCount, true);
  const stepForward = async () => {
    if (!engaged) await engage();
    else if (currentSlide >= 2 * itemCount)
      await snapTo(currentSlide - itemCount);
    currentSlide++;
  };
  const stepBack = async () => {
    if (!engaged) await engage();
    else if (currentSlide < itemCount) await snapTo(currentSlide + itemCount);
    currentSlide--;
  };
  // A resize that makes everything fit while engaged: back to a plain track
  // on the real index, without a glide.
  $effect(() => {
    const on = infiniteActive;
    untrack(() => {
      if (on || !engaged) return;
      snapping = true;
      engaged = false;
      currentSlide = Math.min(mod(currentSlide, itemCount), maxSlide);
      void tick().then(() => {
        void trackEl?.offsetHeight;
        snapping = false;
      });
    });
  });

  // Each step advances one slide width plus one gap. With n cards per view
  // a slide is (100% - (n-1)*gap)/n wide, so the step is (100% + gap)/n —
  // the gap term is divided by n too. (Shifting a full gap per step, the
  // fleet formula, overshoots by gap*(n-1)/n per index and clips slides.)
  // In itemWidth mode a cell is a fixed size, so the step is simply cell+gap.
  const translateValue = $derived.by(() => {
    if (fixedMode) {
      return `translateX(calc(${currentSlide} * (-${activeItemWidth} - ${currentGap})))`;
    }
    const n = responsiveCardsPerView;
    return `translateX(calc(${currentSlide} * (-100% - ${currentGap}) / ${n}))`;
  });

  // Clamp when a resize (or fade mode) shrinks the reachable range out from
  // under the current index — otherwise the track points at empty space.
  $effect(() => {
    if (!infiniteActive && currentSlide > maxSlide) currentSlide = maxSlide;
  });

  // Autoplay wants a pause/play control (WCAG 2.2.2) — but only when rotation
  // can actually happen. Under reduced motion it never starts, so the control
  // would be a dead button.
  const autoplayEligible = $derived(
    autoplay > 0 && maxSlide > 0 && !reducedMotion,
  );
  const autoRotating = $derived(
    autoplayEligible && !userPaused && !hovered && !pageHidden,
  );

  // Re-key the interval on swipe navigation so a gesture restarts the full
  // delay instead of racing the in-flight tick. (Click/keyboard nav focuses
  // a control, which stops rotation outright — see onFocusIn.)
  let autoplayEpoch = $state(0);

  $effect(() => {
    if (!autoRotating) return;
    void autoplayEpoch;
    const id = setInterval(() => {
      if (infiniteActive) {
        void stepForward();
      } else if (currentSlide < maxSlide) {
        currentSlide++;
      } else if (loop) {
        currentSlide = 0;
      }
    }, autoplay);
    return () => clearInterval(id);
  });

  const nextSlide = async () => {
    if (infiniteActive) {
      await stepForward();
    } else if (currentSlide < maxSlide) {
      currentSlide++;
    } else if (loop) {
      currentSlide = 0;
    }
    autoplayEpoch++;
  };

  const prevSlide = async () => {
    if (infiniteActive) {
      await stepBack();
    } else if (currentSlide > 0) {
      currentSlide--;
    } else if (loop) {
      currentSlide = maxSlide;
    }
    autoplayEpoch++;
  };

  const goToSlide = async (index: number) => {
    if (infiniteActive) {
      if (!engaged) await engage();
      else if (currentSlide < itemCount || currentSlide >= 2 * itemCount)
        await snapTo(itemCount + mod(currentSlide, itemCount));
      currentSlide = itemCount + index;
    } else {
      currentSlide = Math.min(index, maxSlide);
    }
    autoplayEpoch++;
  };

  const handleSwipe = (e: SwipeCustomEvent) => {
    if (e.detail.direction === "left") nextSlide();
    if (e.detail.direction === "right") prevSlide();
  };

  // Arrow-key nav when one of the carousel's own controls has focus — avoids
  // needing a tabindex on a non-interactive wrapper.
  const handleKeydown = (e: KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      prevSlide();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      nextSlide();
    }
  };

  // APG: rotation stopped by focus does not resume when focus leaves — only
  // an explicit play press restarts it. Sticky state also can't strand a
  // paused carousel the way a tracked focus-within flag can (no focusout
  // fires when the focused control unmounts).
  const onFocusIn = () => {
    if (autoplayEligible) userPaused = true;
  };

  const arrowsShown = $derived(showArrows && maxSlide > 0);
  const dotsShown = $derived(showDots || !arrowsShown);
  // Arrows in the bottom control row only in the default layout; "sides" pins
  // them to the track edges instead. The bottom row then renders only if it
  // still holds something (dots or the autoplay pause control).
  const bottomArrows = $derived(arrowsShown && arrowLayout !== "sides");
  const sideArrows = $derived(arrowsShown && arrowLayout === "sides");
  const showBottomNav = $derived(
    maxSlide > 0 && (bottomArrows || dotsShown || autoplayEligible),
  );
  const atStart = $derived(!loop && currentSlide === 0);
  const atEnd = $derived(!loop && currentSlide === maxSlide);

  const slideVisible = (i: number) =>
    i >= currentSlide && i < currentSlide + responsiveCardsPerView;
</script>

<div
  class="relative w-full {passedClasses}"
  role="region"
  aria-roledescription="carousel"
  aria-label={label}
  onpointerenter={() => (hovered = true)}
  onpointerleave={() => (hovered = false)}
  onfocusin={onFocusIn}
>
  <div
    class="relative overflow-hidden w-full"
    {...useSwipe(handleSwipe, () => ({
      timeframe: 300,
      minSwipeDistance: 60,
      touchAction: "pan-y",
    }))}
  >
    {#if mode === "slide"}
      <div
        bind:this={trackEl}
        class="flex {snapping
          ? 'transition-none'
          : 'transition-transform'} {transitionClass}"
        style="transform: {translateValue}; gap: {currentGap}; padding-left: {currentPadStart};"
      >
        <!-- Keyed so that when the infinite track engages, the cells already
             on screen BECOME the middle copy (same nodes, moved) and only the
             two copies are new. -->
        {#each Array(trackCount) as _, i (i - (copies === 3 ? itemCount : 0))}
          <div
            class="w-full shrink-0 {slideClass}"
            role="group"
            aria-roledescription="slide"
            aria-label="{(i % itemCount) + 1} of {itemCount}"
            aria-hidden={slideVisible(i) ? undefined : "true"}
            inert={!slideVisible(i)}
            style={fixedMode
              ? `width: ${activeItemWidth};`
              : viewport.width >= 768
                ? `width: calc((100% - ${cardsPerView - 1} * ${gap}) / ${cardsPerView});`
                : mobileCardsPerView > 1
                  ? `width: calc((100% - ${mobileCardsPerView - 1} * ${mobileGap}) / ${mobileCardsPerView});`
                  : ""}
          >
            {@render children({
              index: i % itemCount,
              clone: copies === 3 && (i < itemCount || i >= 2 * itemCount),
            })}
          </div>
        {/each}
      </div>
    {:else}
      <div class="grid">
        {#each Array(itemCount) as _, i (i)}
          <div
            class="col-start-1 row-start-1 transition-opacity {transitionClass} {currentSlide ===
            i
              ? 'opacity-100'
              : 'opacity-0 pointer-events-none'}"
            role="group"
            aria-roledescription="slide"
            aria-label="{i + 1} of {itemCount}"
            aria-hidden={currentSlide === i ? undefined : "true"}
            inert={currentSlide !== i}
          >
            {@render children({ index: i })}
          </div>
        {/each}
      </div>
    {/if}
  </div>

  {#if edgeFadeColor}
    <!-- Edge fades sit above the track but below the z-10 side arrows. Desktop
         only: live collapses its `.heads-opacity-gradient` pair to 0x0 at
         mobile, where the row is a fit-to-container 3-across and a fade would
         just grey out the third headshot. -->
    <div
      class="pointer-events-none absolute inset-y-0 left-0 z-[5] hidden w-20 lg:block"
      style="background:linear-gradient(90deg, {edgeFadeColor}, rgba(255,255,255,0))"
      aria-hidden="true"
    ></div>
    <div
      class="pointer-events-none absolute inset-y-0 right-0 z-[5] hidden w-20 lg:block"
      style="background:linear-gradient(270deg, {edgeFadeColor}, rgba(255,255,255,0))"
      aria-hidden="true"
    ></div>
  {/if}

  {#if sideArrows}
    <!-- Edge-pinned prev/next, vertically centered on the track (live team
         carousel). Same handlers/aria as the bottom-row arrows. -->
    <button
      type="button"
      onclick={prevSlide}
      onkeydown={handleKeydown}
      aria-disabled={atStart ? "true" : undefined}
      class="absolute top-1/2 left-0 z-10 flex -translate-y-1/2 items-center justify-center rounded-full transition-colors duration-200 aria-disabled:cursor-default aria-disabled:opacity-40 {arrowClass}"
      aria-label="Previous slide"
    >
      {#if prevArrow}
        {@render prevArrow()}
      {:else}
        <svg
          class="h-7 w-7"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 19l-7-7 7-7"
          />
        </svg>
      {/if}
    </button>
    <button
      type="button"
      onclick={nextSlide}
      onkeydown={handleKeydown}
      aria-disabled={atEnd ? "true" : undefined}
      class="absolute top-1/2 right-0 z-10 flex -translate-y-1/2 items-center justify-center rounded-full transition-colors duration-200 aria-disabled:cursor-default aria-disabled:opacity-40 {arrowClass}"
      aria-label="Next slide"
    >
      {#if nextArrow}
        {@render nextArrow()}
      {:else}
        <svg
          class="h-7 w-7"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 5l7 7-7 7"
          />
        </svg>
      {/if}
    </button>
  {/if}

  <!-- Announce position to screen readers only when the user is driving;
       a rotating carousel announcing every few seconds is noise (APG). -->
  <div
    class="sr-only"
    aria-live={autoRotating ? "off" : "polite"}
    aria-atomic="true"
  >
    {#if responsiveCardsPerView > 1}
      Slides {realIndex + 1} through {Math.min(
        realIndex + responsiveCardsPerView,
        itemCount,
      )} of
      {itemCount}
    {:else}
      Slide {realIndex + 1} of {itemCount}
    {/if}
  </div>

  {#if showBottomNav}
    <div class="flex justify-center items-center gap-4 mt-8 {navigationClass}">
      {#if autoplayEligible}
        <!-- First control in the carousel's tab order (APG). -->
        <button
          type="button"
          onclick={() => (userPaused = !userPaused)}
          class="w-8 h-8 rounded-full text-gray-700 hover:bg-gray-200 transition-colors duration-200 flex items-center justify-center {pauseClass}"
          aria-label={userPaused ? "Play slides" : "Pause slides"}
        >
          {#if userPaused}
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          {:else}
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
            </svg>
          {/if}
        </button>
      {/if}

      {#if bottomArrows}
        <!-- aria-disabled (not disabled) so the bound arrow keeps focus
             instead of dumping the keyboard user back to <body>. -->
        <button
          type="button"
          onclick={prevSlide}
          onkeydown={handleKeydown}
          aria-disabled={atStart ? "true" : undefined}
          class="w-8 h-8 rounded-full text-gray-700 hover:bg-gray-200 transition-colors duration-200 flex items-center justify-center aria-disabled:opacity-40 aria-disabled:hover:bg-transparent aria-disabled:cursor-default {arrowClass}"
          aria-label="Previous slide"
        >
          <svg
            class="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
      {/if}

      {#if dotsShown}
        <div class="flex gap-2">
          {#each Array(infiniteActive ? itemCount : maxSlide + 1) as _, i (i)}
            <!-- 24px hit target (WCAG 2.5.8); the visual dot is the span. -->
            <button
              type="button"
              onclick={() => goToSlide(i)}
              onkeydown={handleKeydown}
              class="group h-6 min-w-6 flex items-center justify-center {realIndex ===
              i
                ? 'cursor-default'
                : ''}"
              aria-label="Go to slide {i + 1}"
              aria-current={realIndex === i ? "true" : undefined}
            >
              <span
                class="h-3 rounded-full group-active:-translate-y-1 transition-all duration-200 {realIndex ===
                i
                  ? `w-8 ${activeDotClass}`
                  : `w-3 ${dotClass}`}"
              ></span>
            </button>
          {/each}
        </div>
      {/if}

      {#if bottomArrows}
        <button
          type="button"
          onclick={nextSlide}
          onkeydown={handleKeydown}
          aria-disabled={atEnd ? "true" : undefined}
          class="w-8 h-8 rounded-full text-gray-700 hover:bg-gray-200 transition-colors duration-200 flex items-center justify-center aria-disabled:opacity-40 aria-disabled:hover:bg-transparent aria-disabled:cursor-default {arrowClass}"
          aria-label="Next slide"
        >
          <svg
            class="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      {/if}
    </div>
  {/if}
</div>
