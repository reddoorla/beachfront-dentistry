import {
  fade as svelteFade,
  fly as svelteFly,
  slide as svelteSlide,
} from "svelte/transition";
import type {
  FadeParams,
  FlyParams,
  SlideParams,
  TransitionConfig,
} from "svelte/transition";

// Svelte's JS-driven transitions (Web Animations API) do NOT honor the CSS
// `prefers-reduced-motion` reset in app.css. These thin wrappers do: when the
// user asks for reduced motion we collapse duration + delay to 0 so the element
// still appears/disappears, just without the animation. Components import
// fade/fly/slide from here instead of "svelte/transition".
//
// Checked per transition run (not at module load), so an OS-level toggle takes
// effect on the next open/close. `matchMedia` is guarded for SSR and jsdom.
/** Live reduced-motion query, exported for components whose BEHAVIOR (not just
 *  animation) changes under reduced motion — e.g. PreNavTransition skips its
 *  artificial pre-navigation delay entirely. */
export const prefersReducedMotion = (): boolean =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** What a transition collapses to under reduced motion: zero-length AND
 *  style-free. Zeroing the duration is NOT sufficient on its own — Svelte
 *  still samples the config's `css` at t=0 and commits that frame, so a
 *  `fly({ y: 22 })` painted its full 22px offset for one frame before snapping
 *  back. That is visible motion for someone who asked for none, and any layout
 *  read landing in that frame is wrong: it inflated the nav overlay's
 *  scrollHeight by exactly the fly distance, which is how it was caught
 *  (tests/interaction/nav-menu.spec.ts, the 1354x930 no-scroll contract, went
 *  intermittently red at 946 > 930 = 924 + 22). With no `css` and no `tick`
 *  there is nothing for Svelte to apply, so the element simply appears. */
const INSTANT: TransitionConfig = { duration: 0, delay: 0 };

export function fade(node: Element, params: FadeParams = {}): TransitionConfig {
  return prefersReducedMotion() ? { ...INSTANT } : svelteFade(node, params);
}

export function fly(node: Element, params: FlyParams = {}): TransitionConfig {
  return prefersReducedMotion() ? { ...INSTANT } : svelteFly(node, params);
}

export function slide(
  node: Element,
  params: SlideParams = {},
): TransitionConfig {
  return prefersReducedMotion() ? { ...INSTANT } : svelteSlide(node, params);
}
