export type FloatAlongOptions = {
  /** Selector (within the node's parent) for the items the node tracks. */
  itemSelector: string;
};

/** The live site's floating-doctor behaviour (floating-doc.js — live ships
 *  the class with its instantiation commented out, so the operator's spec is
 *  the authority): the ask-the-doctor handwriting + doctor headshot pair
 *  slides down the question column as the visitor scrolls, gliding to the
 *  BOTTOM-MOST FULLY VISIBLE question. Movement is quantized per question —
 *  the transform only changes when the target index changes — and the glide
 *  itself is CSS (the node's own transition, live's anchor rule: transform
 *  1s cubic-bezier(0.19,1,0.22,1); set in the markup, not here).
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

  // The float is desktop-only: live's mobile pair rests in the column flow
  // above the first question (full-width cards leave nowhere to glide
  // without covering content). Checked per align so a resize across the
  // breakpoint parks the pair back at rest.
  const desktop = window.matchMedia("(min-width: 1024px)");

  let currentIndex = 0;
  let ticking = false;

  const align = () => {
    ticking = false;
    if (!desktop.matches) {
      if (currentIndex !== 0) {
        currentIndex = 0;
        node.style.transform = "";
      }
      return;
    }
    const items = [...parent.querySelectorAll<HTMLElement>(itemSelector)];
    if (items.length === 0) return;

    // Bottom-most question fully inside the viewport. When none is fully
    // visible (a tall card straddling both edges, or the section off-screen),
    // clamp to the nearer end if we're past the section — otherwise hold the
    // current target so the pair doesn't twitch through in-between states.
    const fully = items.filter((el) => {
      const r = el.getBoundingClientRect();
      return r.top >= 0 && r.bottom <= window.innerHeight;
    });
    let next = currentIndex;
    if (fully.length > 0) {
      next = items.indexOf(fully[fully.length - 1]);
    } else if (items[0].getBoundingClientRect().top > window.innerHeight) {
      next = 0;
    } else if (items[items.length - 1].getBoundingClientRect().bottom < 0) {
      next = items.length - 1;
    }
    if (next === currentIndex) return;
    currentIndex = next;

    // Translate relative to the FIRST item — the pair's resting position is
    // authored against question 0, and all items share the node's positioned
    // ancestor, so the offsetTop difference is exactly the distance to glide.
    node.style.transform = `translateY(${items[next].offsetTop - items[0].offsetTop}px)`;
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
