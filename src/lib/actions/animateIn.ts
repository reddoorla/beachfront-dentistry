import { reducedMotion } from "$lib/transitions";

/** The site's standard scroll reveal: an element rises `--reveal-travel` on the
 *  shared expo-out curve, with no x-position stagger — same-row elements land
 *  together. Spread into per-element `use:animateIn` calls.
 *
 *  These are OUR numbers, not a transcription of anything. They started as
 *  live's Webflow values (96/160px over 1000ms) and were cut back once the
 *  reveal was measured rather than copied: the travel decides how far INSIDE
 *  the viewport an element must be laid out before the observer will fire on
 *  its transformed box, and 160px turned the bottom fifth of a 720px-tall
 *  laptop viewport into a band where laid-out content was never painted. The
 *  duration went with it — on this curve opacity is already at 0.94 by 425ms,
 *  so the last 40% of a 1000ms reveal was a tail nobody could see. Do not
 *  "restore" the old numbers as a fidelity fix; the pixel-matching program is
 *  over and these were changed on purpose. */
export const LIVE_REVEAL = {
  duration: 750,
  translateY: "var(--reveal-travel)",
  delayMax: 0,
} as const;

/** LIVE_REVEAL for a target that is ABOVE THE FOLD on a cold entry.
 *
 *  Use it together with a literal `data-reveal` attribute on the same element —
 *  the two are one decision and neither works alone:
 *
 *    <div data-reveal use:animateIn={ABOVE_FOLD_REVEAL}>
 *
 *  `data-reveal` in the SERVER markup is what removes the flash. Without it the
 *  element is painted in final position and then yanked to opacity 0 when
 *  hydration runs the action, 150-850ms later, which reads as the page
 *  breaking. app.css hides `[data-reveal]` with the same opacity and the same
 *  `--reveal-travel`, so the hidden state exists at first paint and the
 *  action's write is a byte-identical no-op. That equality is why this preset
 *  must not override `translateY`: CSS would hide it at a different distance
 *  than JS reveals it from.
 *
 *  `failSafe` is what makes shipping the attribute safe. An element hidden by
 *  server markup depends on JS to ever appear, so a broken observer, a
 *  throttled rAF, or a script error would leave it invisible rather than
 *  merely unanimated. 2500ms is far past any real reveal (the transition is
 *  750ms and above-fold targets intersect immediately) and far short of a
 *  reader deciding the page is empty.
 *
 *  ONLY for above-fold targets. Do not reach for it as the default, and do not
 *  fold `failSafe` into LIVE_REVEAL to save the spread — a blanket timer
 *  pre-reveals below-fold content before it is scrolled to, which is the exact
 *  failure the option's own doc warns about. Below the fold the flash is
 *  nearly unobservable anyway (you would have to scroll within ~500ms of
 *  load), so the trade — a certain flash for a possible invisible element —
 *  only pays above it. */
export const ABOVE_FOLD_REVEAL = {
  ...LIVE_REVEAL,
  failSafe: 2500,
} as const;

export type AnimateInOptions = {
  trigger?: boolean;
  duration?: number;
  delayMax?: number;
  translateY?: string;
  /** Fixed per-step reveal delay (ms). When set, the element waits
   *  `index * stagger` before revealing instead of the default delay derived
   *  from its horizontal position — use it for grids and columns, where the
   *  position heuristic doesn't produce a clean sequence. Viewport mode only. */
  stagger?: number;
  /** This element's position in its group; pairs with `stagger`. Default 0. */
  index?: number;
  /** Viewport mode only: force the revealed state this many ms after mount if
   *  the reveal has not run by then. However the reveal machinery fails — an
   *  IntersectionObserver that never fires (sandboxed review iframes), or
   *  requestAnimationFrame throttled to a stop in a background iframe so the
   *  observer's deferred reveal never executes — the element must not persist
   *  at opacity 0. When the normal reveal already ran, the timer is cleared;
   *  a fail-safe reveal still plays the transition from the long-committed
   *  hidden frame, so it fades in rather than popping. Opt-in per element:
   *  a global timer would pre-reveal below-fold content before it scrolls in.
   *  (MarkUp thread 738ad46b-0be6-4d92-a1c0-73a53e4c298e pin #2 — the
   *  team-member hero name intermittently never appeared.) */
  failSafe?: number;
  /** Viewport mode only: the observer's `rootMargin`, e.g. "0px -80px" to
   *  shrink the viewport by 80px on each side so an element under a slider's
   *  edge fade does not count as seen — the infinite team slider's next card
   *  waits as a 37px sliver under the fade, and with the plain viewport it
   *  would reveal there, hidden, and then slide in with nothing left to play.
   *  Default: none (the viewport as is). */
  rootMargin?: string;
  /** The content of this element has already been revealed somewhere else,
   *  so no entrance should play here. At MOUNT: do nothing at all — no hidden
   *  state, no observer, no timers. On UPDATE (the option turning true later,
   *  in viewport mode): an element still waiting for its reveal is settled to
   *  visible in one frame, with no transition, and its observer and timers are
   *  torn down; a reveal already under way is left to finish. Distinct from
   *  `trigger: false`, which HIDES the element until it is triggered.
   *
   *  The case: the infinite Slider renders each item as up to three cells, and
   *  the reader sees an item for the first time in whichever cell slides in.
   *  The other cells of that item must then never fade — in particular the
   *  one the pre-step snap teleports into the exact spot the reader is looking
   *  at (Tucker, 2026-09-02: "the second click retriggers a fadein from all
   *  visible items"). Pair with `onReveal` on the sibling cells. */
  disabled?: boolean;
  /** Called every time this element's entrance plays (viewport intersection,
   *  fail-safe, or a triggered `trigger: true`), synchronously with the
   *  reveal styles. The Slider's team cards use it to record that an item has
   *  been seen, which turns `disabled` on for the item's other cells. */
  onReveal?: () => void;
};

export type AnimateInParam = boolean | AnimateInOptions | undefined;

type ResolvedConfig = {
  mode: "viewport" | "triggered";
  trigger: boolean;
  duration: number;
  delayMax: number;
  translateY: string;
  stagger: number | null;
  index: number;
  failSafe: number | null;
  rootMargin: string | undefined;
  onReveal: (() => void) | null;
};

function resolveConfig(param: AnimateInParam): ResolvedConfig {
  const isTriggered =
    typeof param === "boolean" ||
    (param !== undefined && typeof param === "object" && "trigger" in param);

  const opts: AnimateInOptions =
    typeof param === "object" && param !== null ? param : {};
  const trigger = typeof param === "boolean" ? param : (opts.trigger ?? false);

  return {
    mode: isTriggered ? "triggered" : "viewport",
    trigger,
    duration: opts.duration ?? 2400,
    delayMax: opts.delayMax ?? 400,
    translateY: opts.translateY ?? "50%",
    stagger: opts.stagger ?? null,
    index: opts.index ?? 0,
    failSafe: opts.failSafe ?? null,
    rootMargin: opts.rootMargin,
    onReveal: opts.onReveal ?? null,
  };
}

function applyHidden(node: HTMLElement, cfg: ResolvedConfig) {
  // The attribute is the declarative twin of the two style writes below:
  // app.css hides `[data-reveal]` under `prefers-reduced-motion: no-preference`
  // with the same opacity and the same travel, so markup that ships the
  // attribute from the server is already hidden at FIRST PAINT and this call
  // re-writes byte-identical values instead of yanking a painted element out
  // from under the reader. (Only true for LIVE_REVEAL, which reads the same
  // `--reveal-travel` var: a call site passing its own `translateY` must not
  // put `data-reveal` in its server-rendered markup, because CSS would hide it
  // at a different distance than JS reveals it from.)
  node.setAttribute("data-reveal", "");
  node.style.opacity = "0";
  node.style.transform = `translateY(${cfg.translateY})`;
  // --transition-out-expo = cubic-bezier(0.19,1,0.22,1) — the exact curve
  // live's Webflow reveals run on (read off its anchor transition).
  node.style.transition =
    `opacity ${cfg.duration}ms var(--transition-out-expo), ` +
    `transform ${cfg.duration}ms var(--transition-out-expo)`;
}

function reveal(node: HTMLElement) {
  // Drop the marker before the styles: nothing may be able to describe this
  // element as hidden once it is on its way to visible.
  node.removeAttribute("data-reveal");
  node.style.opacity = "1";
  node.style.transform = "translateY(0)";
}

export function animateIn(node: HTMLElement, param?: AnimateInParam) {
  if (typeof param === "object" && param !== null && param.disabled) {
    return { update() {}, destroy() {} };
  }
  const cfg = resolveConfig(param);
  let observer: IntersectionObserver | undefined;
  let failSafeTimer: ReturnType<typeof setTimeout> | undefined;
  let reduced = false;
  let hidden = false;

  // --- releasing the reveal's inline transition ------------------------------
  //
  // `applyHidden` writes `style.transition` INLINE, and an inline declaration
  // outranks every class. Until this round it was never taken back off, so the
  // reveal's transition list — `opacity, transform`, 2400ms on the expo curve —
  // stayed the element's transition list for the rest of the page's life.
  //
  // That silently disabled the hover motion of anything that both reveals and
  // reacts. MARKUP ROUND I1, thread 20a4af72-a28a-47f2-b628-b3ad11c0e99d
  // (our-team board, pin #2), Tim on the team cards: "I like how these raise but
  // the motion needs to be smooth. Ease the easing."
  //
  // The easing was never the problem — the raise had NO transition at all.
  // `CollectionList`'s CARD_AFFORDANCE asks for `transition-[box-shadow,translate]
  // duration-200 ease-out` and hovers `-translate-y-1`; Tailwind v4 compiles that
  // to the `translate` PROPERTY (the same trap OutlineButton documents for
  // `active:translate-y-px`). The inline list names `transform`, not `translate`,
  // and not `box-shadow` — so both hover channels were unanimated and the card
  // snapped 4px. Probed at 1440: the card reports `transition-property:
  // "opacity, transform"`, `duration: 0.75s` — the reveal's, not the card's
  // (probe-markup-i2.mjs, pin5).
  //
  // So the fix is to hand the element back to its stylesheet once the reveal is
  // over. `transitionend` is the accurate signal; the timer is the fallback for
  // every path where no transition ever runs (reduced motion, the
  // no-IntersectionObserver reveal-in-place, a triggered mount that hides and
  // shows in one frame) and for a `transitionend` lost to a background tab.
  // Re-hiding re-writes all of it, so triggered call sites still work.
  let revealDelay = 0;
  let releaseTimer: ReturnType<typeof setTimeout> | undefined;

  const release = () => {
    node.removeEventListener("transitionend", onTransitionEnd);
    if (releaseTimer !== undefined) {
      clearTimeout(releaseTimer);
      releaseTimer = undefined;
    }
    // Back to the authored markup: the element keeps whatever its classes say.
    node.style.removeProperty("transition");
    node.style.removeProperty("transition-delay");
    node.style.removeProperty("transform");
    node.style.removeProperty("opacity");
  };

  function onTransitionEnd(e: TransitionEvent) {
    // Only this node's own reveal — a descendant's transition bubbles here too,
    // and releasing on one would strip the transition mid-reveal.
    if (e.target !== node) return;
    if (e.propertyName !== "opacity") return;
    release();
  }

  const scheduleRelease = () => {
    node.removeEventListener("transitionend", onTransitionEnd);
    if (releaseTimer !== undefined) clearTimeout(releaseTimer);
    node.addEventListener("transitionend", onTransitionEnd);
    releaseTimer = setTimeout(release, cfg.duration + revealDelay + 300);
  };

  const hide = () => {
    hidden = true;
    // A re-hide must cancel a pending release, or the release lands mid-reveal
    // and strips the transition the new hide just wrote.
    node.removeEventListener("transitionend", onTransitionEnd);
    if (releaseTimer !== undefined) {
      clearTimeout(releaseTimer);
      releaseTimer = undefined;
    }
    applyHidden(node, cfg);
  };
  const show = () => {
    hidden = false;
    reveal(node);
    scheduleRelease();
    cfg.onReveal?.();
  };
  /** `disabled` arriving on update: the content was revealed elsewhere while
   *  this element was still waiting. Visible now, in one frame, no entrance —
   *  the observer, the fail-safe and the inline reveal styles all go, and the
   *  element is handed straight back to its stylesheet. Not `show()`: that
   *  would play the transition from the committed hidden frame. */
  const settle = () => {
    hidden = false;
    observer?.disconnect();
    if (failSafeTimer !== undefined) {
      clearTimeout(failSafeTimer);
      failSafeTimer = undefined;
    }
    node.removeAttribute("data-reveal");
    release();
  };

  // Reduced motion is watched, not sampled, so turning the OS setting on mid-
  // session stops the reveals where the reader is instead of on their next
  // reload. It only ever moves in the SAFE direction: whatever is hidden is
  // revealed and the machinery torn down. Re-applying the hidden state on a
  // switch would strand content at opacity 0 with nothing left running to
  // un-hide it — the exact failure `failSafe` exists to catch.
  const unwatch = reducedMotion.subscribe((value) => {
    reduced = value;
    if (!value) return;
    if (failSafeTimer !== undefined) clearTimeout(failSafeTimer);
    observer?.disconnect();
    // `hidden` is false on the first, synchronous call, so an element that was
    // never touched keeps its untouched inline styles — as before, the action
    // is a complete no-op when the preference is already on. The attribute test
    // catches server-rendered `data-reveal`, whose CSS hidden state does not
    // apply under reduce but whose marker should not linger either.
    if (hidden || node.hasAttribute("data-reveal")) show();
  });

  if (reduced) {
    return {
      update() {},
      destroy() {
        unwatch();
      },
    };
  }

  if (cfg.mode === "triggered") {
    if (cfg.trigger) {
      hide();
      show();
    } else {
      hide();
    }
  } else {
    hide();
    // Explicit index-based stagger (grids/columns) overrides the default
    // horizontal-position heuristic (which only sequences a left-to-right row).
    const delay =
      cfg.stagger !== null
        ? cfg.index * cfg.stagger
        : cfg.delayMax *
          (node.getBoundingClientRect().left / window.innerWidth);
    revealDelay = delay;
    node.style.transitionDelay = `${delay}ms`;

    // No IntersectionObserver at all (stripped-down embed/ancient browser):
    // nothing else can ever reveal this element, and constructing the observer
    // below would throw and break the whole mount. Reveal in place — both
    // style writes land in one synchronous frame, so the element is simply
    // visible (no transition), which beats invisible forever.
    if (typeof IntersectionObserver === "undefined") {
      show();
      return {
        update() {},
        destroy() {
          unwatch();
        },
      };
    }

    observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Double-rAF: for an element already in view at mount the observer
          // fires in the same frame as applyHidden, and hidden+revealed styles
          // collapse into one style recalc — the element pops with no
          // transition. Committing the hidden frame first makes above-fold
          // reveals actually play (live animates them on load too).
          requestAnimationFrame(() =>
            requestAnimationFrame(() => {
              show();
              // Only clear once the reveal has actually executed — an rAF
              // throttled to a stop (background iframe) after the observer
              // fired still needs the fail-safe below to run.
              if (failSafeTimer !== undefined) clearTimeout(failSafeTimer);
            }),
          );
          observer?.disconnect();
        }
      },
      { threshold: 0, rootMargin: cfg.rootMargin },
    );
    observer.observe(node);

    // See AnimateInOptions.failSafe. setTimeout (not rAF) on purpose: timers
    // still fire, if clamped, where rAF is suspended. reveal() is idempotent,
    // so losing the race to the normal reveal is harmless.
    if (cfg.failSafe !== null) {
      failSafeTimer = setTimeout(() => {
        observer?.disconnect();
        show();
      }, cfg.failSafe);
    }
  }

  return {
    /** Two fields of `next` are read: `disabled` (both modes — settles an
     *  element still waiting, see AnimateInOptions.disabled) and, in triggered
     *  mode, `trigger`. Every other option is locked at mount. */
    update(next?: AnimateInParam) {
      if (typeof next === "object" && next !== null && next.disabled) {
        if (hidden) settle();
        return;
      }
      if (cfg.mode !== "triggered") return;
      const nextCfg = resolveConfig(next);
      // Under reduced motion the element must never go back to hidden: the
      // watcher above has already torn everything down, so nothing would be
      // left to reveal it again.
      if (nextCfg.trigger || reduced) {
        show();
      } else {
        hide();
      }
    },
    destroy() {
      unwatch();
      if (failSafeTimer !== undefined) clearTimeout(failSafeTimer);
      if (releaseTimer !== undefined) clearTimeout(releaseTimer);
      node.removeEventListener("transitionend", onTransitionEnd);
      observer?.disconnect();
    },
  };
}
