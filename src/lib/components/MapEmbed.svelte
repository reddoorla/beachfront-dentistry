<script lang="ts">
  // Simple Google Maps embed iframe — no API key required (unlike the Maps JS
  // surface the frozen Blux sites hydrate, gated in svelte.config.js's
  // wantsMapsCsp). Only https://www.google.com needs to be in frame-src.
  interface Props {
    query?: string;
  }

  let {
    query = "Beachfront Dentistry, 1706 S Elena Ave, Redondo Beach, CA",
  }: Props = $props();

  let frame: HTMLIFrameElement | undefined = $state();
  let focusInFrame = $state(false);

  // The map is a tab stop whose focus indicator has to be drawn from outside.
  // `:focus-visible` is impossible: tabbing in moves the focused area into a
  // cross-origin document, so no selector in OUR document matches the iframe.
  // Measured in Chromium 1440x900, headless AND headed, on the loaded embed:
  // `document.activeElement === iframe` but `iframe.matches(":focus")` is
  // false, so the wrapper's `:focus-within` never fires either — the map was
  // the one control on the site with no indicator at all (WCAG 2.4.7).
  // What the parent document DOES get is a `blur` on window at the moment the
  // focus crosses the boundary, with `activeElement` already pointing at the
  // iframe; that pair is the signal. The `focus-within:` classes stay on the
  // wrapper because they cost nothing and do fire for programmatic `.focus()`
  // (and any engine that scopes focus differently) — this is the half that
  // covers keyboard users in the browser the site is actually used in.
  $effect(() => {
    // One rule, re-asked on every event that can move focus across the
    // boundary, rather than a set of enter/leave handlers that have to agree
    // with each other: is the map where focus currently is?
    const sync = () => {
      focusInFrame = document.activeElement === frame;
    };
    // A click elsewhere in the page pulls focus out of the frame, but the blur
    // lands as the event's default action — read `activeElement` after it.
    // (A click INSIDE the map never reaches this document at all, which is why
    // it needs the window `blur` above and not a pointer event here.)
    const syncLater = () => setTimeout(sync);
    window.addEventListener("blur", sync);
    window.addEventListener("focus", sync);
    document.addEventListener("focusin", sync);
    document.addEventListener("pointerdown", syncLater);
    return () => {
      window.removeEventListener("blur", sync);
      window.removeEventListener("focus", sync);
      document.removeEventListener("focusin", sync);
      document.removeEventListener("pointerdown", syncLater);
    };
  });
</script>

<div
  class="rounded ring-primary-deep ring-offset-2 focus-within:ring-2 {focusInFrame
    ? 'ring-2'
    : ''}"
  data-map-focus={focusInFrame ? "true" : undefined}
>
  <!-- z=12 matches live's Webflow map widget (data-widget-zoom="12"): the wider
       South Bay area view, not the street-level default the embed opens at. -->
  <iframe
    bind:this={frame}
    title="Map to Beachfront Dentistry"
    src={"https://www.google.com/maps?q=" +
      encodeURIComponent(query) +
      "&z=12&output=embed"}
    class="block h-[400px] w-full rounded border-0"
    loading="lazy"
    referrerpolicy="no-referrer-when-downgrade"
  ></iframe>
</div>
