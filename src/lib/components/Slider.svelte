<script lang="ts">
  import { useSwipe, type SwipeCustomEvent } from "svelte-gestures";
  import { onMount, type Snippet } from "svelte";
  import { viewport } from "$stores/viewport.svelte";

  interface Props {
    itemCount: number;
    /** Accessible name for the carousel region — say what's inside
     *  ("Customer testimonials"), not "Slider". */
    label: string;
    children: Snippet<[{ index: number }]>;
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
    /** Fixed slide width at ≥768px (e.g. "200px"). Matches a reference carousel
     * whose cells are a fixed size and overflow the container rather than fitting
     * to it — live's team row: 200px cells, 40px gap, first flush-left, last
     * clipped at the right edge. When set, `cardsPerView` is ignored at desktop
     * and how many are visible is measured from the track width. Below 768px the
     * `mobileCardsPerView` fit-to-container layout is used unchanged. */
    itemWidth?: string;
    /** Fixed cell width below 768px (e.g. "120px" — live's team headshots are
     * 200px desktop / 120px mobile, its rem scaled 0.6× under a 40px→24px root).
     * When set, mobile uses fixed cells too; otherwise mobile falls back to the
     * `mobileCardsPerView` fit-to-container layout. */
    mobileItemWidth?: string;
    /** Left offset of the first cell (its distance from the track's left edge),
     * so a full-bleed row can still align its first cell to the content column
     * (live team: 80px at desktop) while the arrows/edge-fades pin to the true
     * screen edges. Only applied when `itemWidth` is set. `trackPadStart` at
     * ≥768px, `mobileTrackPadStart` below. */
    trackPadStart?: string;
    mobileTrackPadStart?: string;
    /** Tailwind duration/easing utilities for the slide/fade movement. */
    transitionClass?: string;
    navigationClass?: string;
    arrowClass?: string;
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
    autoplay = 0,
    showDots = true,
    showArrows = true,
    arrowLayout = "below",
    prevArrow,
    nextArrow,
    edgeFadeColor,
    itemWidth,
    mobileItemWidth,
    trackPadStart,
    mobileTrackPadStart,
    transitionClass = "duration-500 ease-in-out",
    navigationClass = "",
    arrowClass = "",
    pauseClass = "",
    dotClass = "bg-gray-500 group-hover:bg-gray-600 group-active:bg-gray-700",
    activeDotClass = "bg-gray-800",
    class: passedClasses = "",
  }: Props = $props();

  let currentSlide = $state(0);
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

  // Fixed-cell mode (cells a fixed size, overflowing the track). Desktop uses
  // `itemWidth`, mobile `mobileItemWidth`; when the active breakpoint's width is
  // unset, that breakpoint falls back to the fit-to-container layout.
  const activeItemWidth = $derived(
    mode === "fade"
      ? undefined
      : viewport.width >= 768
        ? itemWidth
        : mobileItemWidth,
  );
  const fixedMode = $derived(!!activeItemWidth);
  const currentGap = $derived(viewport.width >= 768 ? gap : mobileGap);
  // The first cell's left offset — only meaningful in fixed-cell mode.
  const currentPadStart = $derived(
    !fixedMode
      ? "0px"
      : viewport.width >= 768
        ? (trackPadStart ?? "0px")
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
    if (currentSlide > maxSlide) currentSlide = maxSlide;
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
      if (currentSlide < maxSlide) {
        currentSlide++;
      } else if (loop) {
        currentSlide = 0;
      }
    }, autoplay);
    return () => clearInterval(id);
  });

  const nextSlide = () => {
    if (currentSlide < maxSlide) {
      currentSlide++;
    } else if (loop) {
      currentSlide = 0;
    }
    autoplayEpoch++;
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      currentSlide--;
    } else if (loop) {
      currentSlide = maxSlide;
    }
    autoplayEpoch++;
  };

  const goToSlide = (index: number) => {
    currentSlide = Math.min(index, maxSlide);
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
        class="flex transition-transform {transitionClass}"
        style="transform: {translateValue}; gap: {currentGap}; padding-left: {currentPadStart};"
      >
        {#each Array(itemCount) as _, i (i)}
          <div
            class="w-full shrink-0"
            role="group"
            aria-roledescription="slide"
            aria-label="{i + 1} of {itemCount}"
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
            {@render children({ index: i })}
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
      Slides {currentSlide + 1} through {currentSlide + responsiveCardsPerView} of
      {itemCount}
    {:else}
      Slide {currentSlide + 1} of {itemCount}
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
          {#each Array(maxSlide + 1) as _, i (i)}
            <!-- 24px hit target (WCAG 2.5.8); the visual dot is the span. -->
            <button
              type="button"
              onclick={() => goToSlide(i)}
              onkeydown={handleKeydown}
              class="group h-6 min-w-6 flex items-center justify-center {currentSlide ===
              i
                ? 'cursor-default'
                : ''}"
              aria-label="Go to slide {i + 1}"
              aria-current={currentSlide === i ? "true" : undefined}
            >
              <span
                class="h-3 rounded-full group-active:-translate-y-1 transition-all duration-200 {currentSlide ===
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
