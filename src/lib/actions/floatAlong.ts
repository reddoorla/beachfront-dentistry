export type FloatAlongOptions = {
  /** Selector (relative to the node's parent) for the items the node tracks. */
  itemSelector: string;
};

/** Ports the live site's floating-doc.js: a decorative image column slides to
 *  track the topmost visible question as an Ask-the-Doctor list scrolls.
 *  Decoration only — gated off entirely (no listeners, no initial align) for
 *  reduced-motion users and during SSR, where there is no `window` to attach
 *  scroll listeners to. */
export function floatAlong(
  node: HTMLElement,
  { itemSelector }: FloatAlongOptions,
) {
  // SSR-safe complete no-op: no window, or no matchMedia to consult — without
  // it we can't honour reduced-motion, so the decoration stays static.
  if (typeof window === "undefined") return;
  if (typeof window.matchMedia !== "function") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const parent = node.parentElement;
  if (!parent) return;

  // The image's own resting offsetTop. `transform` is visual only and never
  // changes layout, so offsetTop stays constant — capture it once. Both this
  // and the items' offsetTop are measured from the same offsetParent (the
  // teaser's plain-div grid resolves that to <body>), so the DIFFERENCE is the
  // item's position relative to where the image naturally sits. Translating by
  // the raw item.offsetTop instead would double-count the section's own page
  // offset and fling the image a full page-height down the document.
  const base = node.offsetTop;

  let ticking = false;

  const align = () => {
    ticking = false;
    const items = [...parent.querySelectorAll<HTMLElement>(itemSelector)];
    const top =
      items.find((el) => el.getBoundingClientRect().bottom > 0) ?? items[0];
    // Move the image's top to the topmost visible item's top. If a positioned
    // ancestor ever splits their shared offsetParent the image drifts silently,
    // which is an acceptable failure for a pure decoration.
    if (top) node.style.transform = `translateY(${top.offsetTop - base}px)`;
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(align);
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  align();

  return {
    destroy() {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    },
  };
}
