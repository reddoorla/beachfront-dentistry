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

  $effect(() => {
    const el = video;
    if (!el) return;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduce) return; // keep the poster still, no motion
    // muted playback is allowed to autostart; ignore the promise rejection that
    // some browsers throw if the tab is backgrounded at mount.
    el.play().catch(() => {});
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
<video
  bind:this={video}
  {poster}
  muted
  loop
  playsinline
  preload="none"
  aria-hidden="true"
  tabindex="-1"
  class={passedClasses}
>
  <source src={webm} type="video/webm" />
  <source src={mp4} type="video/mp4" />
</video>
