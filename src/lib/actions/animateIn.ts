/** Live's Webflow scroll-reveal, read off the reference (2026-08-02): each
 *  element rises `--reveal-travel` (96px mobile / 160px desktop — live's 4rem
 *  in its responsive root) over 1s on the shared expo-out curve, with no
 *  x-position stagger — same-row elements land together, exactly like the
 *  Webflow ix2 triggers. Spread into per-element `use:animateIn` calls. */
export const LIVE_REVEAL = {
  duration: 1000,
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
  };
}

function applyHidden(node: HTMLElement, cfg: ResolvedConfig) {
  node.style.opacity = "0";
  node.style.transform = `translateY(${cfg.translateY})`;
  // --transition-out-expo = cubic-bezier(0.19,1,0.22,1) — the exact curve
  // live's Webflow reveals run on (read off its anchor transition).
  node.style.transition =
    `opacity ${cfg.duration}ms var(--transition-out-expo), ` +
    `transform ${cfg.duration}ms var(--transition-out-expo)`;
}

function reveal(node: HTMLElement) {
  node.style.opacity = "1";
  node.style.transform = "translateY(0)";
}

export function animateIn(node: HTMLElement, param?: AnimateInParam) {
  if (
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    return { update() {}, destroy() {} };
  }

  const cfg = resolveConfig(param);
  let observer: IntersectionObserver | undefined;

  if (cfg.mode === "triggered") {
    if (cfg.trigger) {
      applyHidden(node, cfg);
      reveal(node);
    } else {
      applyHidden(node, cfg);
    }
  } else {
    applyHidden(node, cfg);
    // Explicit index-based stagger (grids/columns) overrides the default
    // horizontal-position heuristic (which only sequences a left-to-right row).
    const delay =
      cfg.stagger !== null
        ? cfg.index * cfg.stagger
        : cfg.delayMax *
          (node.getBoundingClientRect().left / window.innerWidth);
    node.style.transitionDelay = `${delay}ms`;

    observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          reveal(node);
          observer?.disconnect();
        }
      },
      { threshold: 0 },
    );
    observer.observe(node);
  }

  return {
    /** In triggered mode, only the `trigger` field of `next` is read — other options are locked at mount. */
    update(next?: AnimateInParam) {
      if (cfg.mode !== "triggered") return;
      const nextCfg = resolveConfig(next);
      if (nextCfg.trigger) {
        reveal(node);
      } else {
        applyHidden(node, cfg);
      }
    },
    destroy() {
      observer?.disconnect();
    },
  };
}
