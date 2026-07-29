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

  let ticking = false;

  const align = () => {
    ticking = false;
    const items = [...parent.querySelectorAll<HTMLElement>(itemSelector)];
    const top =
      items.find((el) => el.getBoundingClientRect().bottom > 0) ?? items[0];
    // offsetTop is relative to the item's offsetParent while the transform is
    // relative to the node's own resting spot — the alignment only holds while
    // node and items share an offsetParent (true for the teaser's plain-div
    // grid). If a positioned ancestor ever splits them the image drifts
    // silently, which is an acceptable failure for a pure decoration.
    if (top) node.style.transform = `translateY(${top.offsetTop}px)`;
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
