<!--
  TransitionOverlay — a brief wash of colour ACROSS a client navigation. It
  mounts when SvelteKit starts navigating and lifts once the incoming route has
  painted (unlike PreNavTransition, which cancels the nav to cover the OUTGOING
  page first — use one or the other, never both).

  Usage (root +layout.svelte):
    <TransitionOverlay class="fixed top-0 left-0 z-50 h-screen w-screen bg-white" />

  The cover is `real navigation latency + visibleDuration + fadeOutDuration`.
  It used to be `latency + 1050 + 700`: measured at 1440x900 against the dev
  server, a nav that committed at 247ms was opaque from 17ms to 1309ms and only
  gone at 1998ms — nearly two seconds of white over a page that had been ready
  for 1.7s of it, and (with no `pointer-events-none`) two seconds during which
  `elementFromPoint` returned this div, so a second tap was silently eaten.
  With the durations below the same navigation is covered for 464ms against a
  production build (24ms of it real latency), 677ms throttled to 4x CPU and
  Fast 3G, 675ms against the dev server. The worry that the long hold was
  masking the home hero's poster-then-video pop does not survive measurement:
  arriving at / throttled, the cover lifts at 1408ms onto a hero already fully
  painted — the poster is preloaded at fetchpriority=high and is frame 0 of the
  clip that follows it, so what the hold was hiding was its own delay.

  Which navigations get a wash is `shouldIntercept` — the same predicate that
  governs PreNavTransition, so the pair cannot disagree about it. Every clause
  applies here for its own reason, documented at the util: reduced motion wants
  no full-screen flash at all; back/forward should feel instant; and an
  unloading navigation (external link, full reload) is the one case that could
  strand the sheet, since `afterNavigate` never arrives to lift it.
-->
<script lang="ts">
  import { afterNavigate, beforeNavigate } from "$app/navigation";
  import { fade, prefersReducedMotion } from "$lib/transitions";
  import { shouldIntercept } from "$lib/utils/preNavIntercept";

  interface Props {
    /** ms the cover holds once the incoming route has arrived. */
    visibleDuration?: number;
    /** ms the cover takes to wash in once navigation starts. */
    fadeInDuration?: number;
    /** ms the cover takes to lift. */
    fadeOutDuration?: number;
    class?: string;
  }

  let {
    // Not 0: `afterNavigate` runs before the browser has painted the incoming
    // route, so lifting immediately shows one frame of the old page. A couple
    // of frames of hold is the whole job.
    visibleDuration = 140,
    fadeInDuration = 140,
    fadeOutDuration = 320,
    class: passedClasses = "h-screen w-screen fixed z-50 bg-black top-0 left-0",
  }: Props = $props();

  /** Ceiling on the cover for a navigation that never completes. Past this the
   *  sheet is doing more harm than the swap it hides, so it lifts regardless
   *  and the outgoing page becomes usable again. */
  const MAX_COVER_MS = 3000;

  let isTransitioning = $state(false);
  let hideTimer: ReturnType<typeof setTimeout> | undefined;
  let failsafeTimer: ReturnType<typeof setTimeout> | undefined;

  const lift = () => {
    isTransitioning = false;
  };

  const clearTimers = () => {
    clearTimeout(hideTimer);
    clearTimeout(failsafeTimer);
  };

  beforeNavigate((nav) => {
    // A second navigation started while the first was still covered. Its
    // timers belong to a swap that is no longer happening — left running, the
    // stale hide fires mid-cover and flashes the outgoing page through.
    clearTimers();
    if (!shouldIntercept(nav, { reducedMotion: prefersReducedMotion() })) {
      lift();
      return;
    }
    isTransitioning = true;
    failsafeTimer = setTimeout(lift, MAX_COVER_MS);
  });

  afterNavigate(() => {
    clearTimers();
    hideTimer = setTimeout(lift, visibleDuration);
  });

  $effect(() => {
    return clearTimers;
  });
</script>

{#if isTransitioning}
  <!-- pointer-events-none so a tap during the wash still reaches the link under
       it (the old sheet ate it); decorative, so hidden from assistive tech.
       Both of those make the sheet unreachable by role or by hit test, so the
       data attribute is how tests/interaction/page-transition.spec.ts holds
       on to it. -->
  <div
    aria-hidden="true"
    data-transition-overlay
    class="pointer-events-none {passedClasses}"
    in:fade={{ duration: fadeInDuration }}
    out:fade={{ duration: fadeOutDuration }}
  ></div>
{/if}
