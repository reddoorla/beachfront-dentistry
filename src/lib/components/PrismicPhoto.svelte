<script lang="ts">
  import { PrismicImage } from "@prismicio/svelte";
  import { createAttachmentKey } from "svelte/attachments";
  import type { ImageField } from "@prismicio/client";

  // The site's photographs, with the two things @prismicio/svelte's
  // PrismicImage does not give them: a `sizes` hint, and an arrival.
  //
  // WHY `sizes` IS NOT OPTIONAL HERE
  //
  // PrismicImage emits `src`/`srcset`/`width`/`height` and never `sizes`. With
  // a width-descriptor srcset and no `sizes`, the browser is required to assume
  // `100vw` — so a 200px headshot in a 1440px viewport picks the 2048-wide
  // candidate and ships 240KB for a 200px box. Measured on the real pages
  // before this component existed: 4,968KB of images on /ask-the-doctor at 1440
  // before any scroll, 4,057KB on /, 3,405KB on /your-first-visit. The same
  // pages at 390 total 825/691/963KB — the imgix ladder was always working, the
  // browser was simply never told which rung to pick.
  //
  // So `sizes` is a REQUIRED prop. A default would be a guess applied to every
  // call site at once, and a wrong `sizes` is worse than none: understate it
  // and a 2x phone gets a visibly soft photo, which is a defect a reader can
  // see, where oversize is only a defect the network can.
  //
  // AND WHY IT MUST BE MEASURED, NOT REASONED
  //
  // Four of this site's photo boxes are LARGER at 834 than at 1440 — the team
  // card headshot is 120 / 320 / 200 at 390 / 834 / 1440, and its class says so
  // outright (`md:size-[320px] lg:size-[200px]`). Any `sizes` written as a
  // rising ladder ("bigger viewport, bigger image") understates the tablet by
  // 120px, and a 2x tablet asking for 640px gets 200. Read the rendered rect at
  // each tier and write those numbers. Do not infer them from the breakpoints.
  //
  // THE ARRIVAL
  //
  // Every photograph on the site went from nothing to fully opaque in one
  // frame, which reads as a page still assembling itself — and lazy-loading
  // makes that far more visible, because arrival moves from "during load" to
  // "while the reader is looking at it". So this fades in on `load`.
  //
  // The fade is deliberately narrow in three ways:
  //   * It NEVER emits opacity 0 in the server HTML. Hiding a painted image
  //     after hydration would be the same first-paint flash the scroll reveal
  //     was just fixed for (see ABOVE_FOLD_REVEAL).
  //   * It only engages for an image that has NOT finished loading when JS
  //     attaches. A cached image is `complete` already, has real pixels on
  //     screen, and must not be hidden to fade back in.
  //   * It is a CSS transition, not a JS animation, so app.css's
  //     `prefers-reduced-motion` reset flattens it to 0.01ms for free. A raw
  //     Svelte transition or a WAAPI animation would escape that reset.
  //
  // The failure mode to protect against is an invisible photo: anything that
  // starts hidden and never fires `load` must still end visible. Hence the
  // `error` listener and the `complete` short-circuit — the same two guards
  // Img.svelte got right, which is why this reuses its shape rather than
  // inventing one.

  type Props = {
    field: ImageField | null | undefined;
    /** REQUIRED. The rendered box at each tier, measured — see above. */
    sizes: string;
    class?: string;
    /** `eager` only where the image can be above the fold. Everything else
     *  stays lazy, which is the point of the change. */
    loading?: "lazy" | "eager";
    /** Prismic types this as the literal `""` on purpose: the only sanctioned
     *  fallback is "explicitly decorative". Anything else has to be real alt
     *  text on the asset, which is an authoring decision, not a render one. */
    fallbackAlt?: "";
    [key: string]: unknown;
  };

  let {
    field,
    sizes,
    class: passedClasses = "",
    loading = "lazy",
    fallbackAlt = "",
    ...rest
  }: Props = $props();

  /** Whether the fade is in play at all. False on the server and for any image
   *  already decoded when JS attaches — those render plainly. */
  let fading = $state(false);
  let loaded = $state(false);

  // An ATTACHMENT rather than `bind:ref`: PrismicImage does not declare a
  // bindable ref, but it spreads unknown props onto the <img>, and an
  // attachment key is just a prop. It also runs at exactly the right moment —
  // after the element is in the DOM — and returns its own teardown.
  const onMountImg = (el: Element) => {
    const img = el as HTMLImageElement;
    // `complete` is terminal: load OR error already fired and will never
    // refire, so attaching listeners now would strand the image at opacity 0
    // forever. naturalWidth is irrelevant — a failed image is as done as a
    // decoded one, and the error path ends visible either way. A complete
    // image also has real pixels on screen already; hiding it to fade it back
    // in would be a defect, not an arrival.
    if (img.complete) return;
    fading = true;
    const done = () => {
      loaded = true;
    };
    img.addEventListener("load", done);
    img.addEventListener("error", done);
    return () => {
      img.removeEventListener("load", done);
      img.removeEventListener("error", done);
    };
  };

  const style = $derived(
    fading
      ? `opacity:${loaded ? 1 : 0};transition:opacity 400ms ease-out`
      : undefined,
  );

  // Assembled as one spread so `class`/`style`/the attachment reach the <img>
  // through PrismicImage's rest props, which is the only channel it forwards.
  const imgProps = $derived({
    class: passedClasses,
    style,
    [createAttachmentKey()]: onMountImg,
    ...rest,
  });
</script>

<PrismicImage
  {field}
  {sizes}
  {loading}
  {fallbackAlt}
  decoding="async"
  {...imgProps}
/>
