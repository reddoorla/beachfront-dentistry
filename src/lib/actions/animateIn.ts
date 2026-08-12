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
  const cfg = resolveConfig(param);
  let observer: IntersectionObserver | undefined;
  let failSafeTimer: ReturnType<typeof setTimeout> | undefined;
  let reduced = false;
  let hidden = false;

  const hide = () => {
    hidden = true;
    applyHidden(node, cfg);
  };
  const show = () => {
    hidden = false;
    reveal(node);
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
      { threshold: 0 },
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
    /** In triggered mode, only the `trigger` field of `next` is read — other options are locked at mount. */
    update(next?: AnimateInParam) {
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
      observer?.disconnect();
    },
  };
}
