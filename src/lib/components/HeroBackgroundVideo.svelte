<script lang="ts">
  // Full-bleed autoplaying hero video — mirrors the live site's Webflow hero,
  // which plays a muted, looping drone flyover behind the headline. Sibling to
  // HeroBackgroundImage (same full-bleed `object-cover` box, same LCP concern),
  // but for the one hero the reference builds as motion rather than a still.
  //
  // Two deliberate choices:
  //  1. LCP + no-JS fallback is the `poster` frame (a warm frame-0 of the same
  //     video). It's the element the browser paints first, so it carries the
  //     `<link rel="preload" as="image">` for LCP discovery — same rationale as
  //     HeroBackgroundImage's preload.
  //  2. Playback is started from JS, gated on prefers-reduced-motion, rather
  //     than via the `autoplay` attribute. Reduced-motion visitors keep the
  //     static poster with zero motion; everyone else gets the flyover once
  //     hydrated. Without JS the poster simply stays — an acceptable, faithful
  //     still. (This is the fleet's motion-aware default, not Webflow's
  //     always-play.)
  import { reducedMotion } from "$lib/transitions";

  interface Props {
    /** Poster still (also the reduced-motion / no-JS frame). */
    poster: string;
    /** WebM source (smaller; served first). */
    webm: string;
    /** MP4 source (H.264 fallback for Safari/iOS). */
    mp4: string;
    class?: string;
    /** Emit the fetchpriority=high poster preload. One hero per page only. */
    preload?: boolean;
  }

  let {
    poster,
    webm,
    mp4,
    class:
      passedClasses = "absolute bottom-0 left-0 h-full w-full object-cover",
    preload = true,
  }: Props = $props();

  let video: HTMLVideoElement | undefined = $state();

  // --- the loop wrap ---------------------------------------------------------
  //
  // `loop` on a 15.448s three-shot montage cuts from a warm backlit runner at
  // sunset straight back to a cool aerial coastline, once every 15 seconds,
  // behind the h1. MEASURED, mean absolute per-channel difference against the
  // frame the loop returns to: 62.2 / 255 at t=15.4. For scale, the poster
  // still differs from frame 0 by 1.62 — so the wrap is roughly 38x the
  // largest discrepancy anywhere else in this component. It is not subtle.
  //
  // The fix is a dissolve through the poster image, which works because the
  // poster IS frame 0 (verified: diff to t=0 is 1.62 and rises monotonically
  // with time — 3.77 at 0.1s, 8.22 at 0.5s, 69.15 at 2s). So fading the video
  // out near the end reveals exactly the shot playback is about to resume on,
  // and fading back in is a no-op visually. That is why the poster is also
  // rendered as a real <img> underneath rather than left to the `poster`
  // attribute, which the browser discards the moment playback starts.
  //
  // NOT ALSO A POSTER->VIDEO FADE. The audit asked for one on the grounds that
  // "the drone has moved between them", and that turned out to be false — the
  // handoff is already seamless, and fading across it would ADD a visible
  // change where none exists.
  //
  // `timeupdate` fires only ~4x/s, hence a generous 0.7s threshold: at 250ms
  // granularity a tighter window could be stepped over entirely.
  const WRAP_LEAD = 0.7;
  const WRAP_BACK = 0.3;
  let dissolving = $state(false);

  $effect(() => {
    const el = video;
    if (!el) return;
    // The shared live store, not a one-off matchMedia sample: turning Reduce
    // Motion on mid-session must stop this hero the way it stops everything
    // else. The site used to read the preference five different ways.
    const stop = reducedMotion.subscribe((reduce) => {
      if (reduce) {
        // Keep the still, no motion — and make sure a dissolve in flight does
        // not strand the video invisible.
        dissolving = false;
        el.pause();
        return;
      }
      // muted playback is allowed to autostart; ignore the promise rejection
      // that some browsers throw if the tab is backgrounded at mount.
      el.play().catch(() => {});
    });

    const onTime = () => {
      if (!el.duration || Number.isNaN(el.duration)) return;
      const left = el.duration - el.currentTime;
      if (left <= WRAP_LEAD) dissolving = true;
      else if (el.currentTime >= WRAP_BACK) dissolving = false;
    };
    // `seeked` covers the wrap itself: `loop` rewinds without a timeupdate
    // guaranteed at t≈0, and this is what brings the video back.
    const onWrap = () => {
      if (el.currentTime < WRAP_BACK) dissolving = false;
    };
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("seeked", onWrap);
    el.addEventListener("play", onWrap);

    return () => {
      stop();
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("seeked", onWrap);
      el.removeEventListener("play", onWrap);
    };
  });
</script>

<svelte:head>
  {#if preload && poster}
    <link rel="preload" as="image" href={poster} fetchpriority="high" />
  {/if}
</svelte:head>

<!-- preload="none", not "auto". The $effect above already calls el.play(), which
     starts the fetch itself, so autoplay still begins right after hydration —
     but "auto" began pulling the 4.8 MB webm (6.4 MB mp4 on Safari/iOS) as soon
     as the markup parsed, racing the poster this component preloads at
     fetchpriority="high" just above, i.e. competing with its own LCP image. It
     also charged that download to prefers-reduced-motion visitors, for whom the
     effect returns early and the video never plays at all. -->
<!-- The poster as a real element, underneath, in the SAME box as the video.
     The `poster` attribute stays on the <video> for the pre-hydration and
     no-JS cases, but the browser drops it the instant playback starts — so the
     wrap dissolve needs something real to dissolve THROUGH. It costs no extra
     request: this is the image already preloaded above at fetchpriority=high.
     It is also what reduced-motion visitors see, which is the trap the audit
     flagged: fading the video without this would leave them on flat `bg-dark`
     with no photograph at all. -->
<img
  src={poster}
  alt=""
  aria-hidden="true"
  class={passedClasses}
  decoding="async"
/>
<video
  bind:this={video}
  {poster}
  muted
  loop
  playsinline
  preload="none"
  aria-hidden="true"
  tabindex="-1"
  class="{passedClasses} transition-opacity duration-[600ms] ease-out motion-reduce:transition-none"
  style="opacity:{dissolving ? 0 : 1}"
>
  <source src={webm} type="video/webm" />
  <source src={mp4} type="video/mp4" />
</video>
