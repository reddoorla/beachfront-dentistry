import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { animateIn } from "./animateIn";

class FakeIntersectionObserver {
  static instances: FakeIntersectionObserver[] = [];
  callback: IntersectionObserverCallback;
  observed: Element[] = [];
  disconnected = false;
  constructor(cb: IntersectionObserverCallback) {
    this.callback = cb;
    FakeIntersectionObserver.instances.push(this);
  }
  observe(el: Element) {
    this.observed.push(el);
  }
  disconnect() {
    this.disconnected = true;
  }
  unobserve() {}
  takeRecords() {
    return [];
  }
  // Test helper — trigger an intersection event.
  trigger(isIntersecting: boolean) {
    this.callback(
      [
        {
          isIntersecting,
          target: this.observed[0],
        } as IntersectionObserverEntry,
      ],
      this as unknown as IntersectionObserver,
    );
  }
}

/** Reveal defers two animation frames (so the hidden state commits before the
 * transition target) — tests that assert the revealed styles await this. */
const nextTwoFrames = () =>
  new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  );

function mockMatchMedia(reducedMotion: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches:
      query === "(prefers-reduced-motion: reduce)" ? reducedMotion : false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    onchange: null,
    dispatchEvent: () => false,
  }));
}

beforeEach(() => {
  FakeIntersectionObserver.instances = [];
  // @ts-expect-error — replacing global for test
  window.IntersectionObserver = FakeIntersectionObserver;
  mockMatchMedia(false);
  Object.defineProperty(window, "innerWidth", {
    value: 1024,
    configurable: true,
  });
});

describe("animateIn — viewport mode", () => {
  it("applies initial hidden styles on mount", () => {
    const el = document.createElement("div");
    document.body.appendChild(el);

    animateIn(el);

    expect(el.style.opacity).toBe("0");
    expect(el.style.transform).toBe("translateY(50%)");
    expect(el.style.transition).toContain(
      "opacity 2400ms var(--transition-out-expo)",
    );
    expect(el.style.transition).toContain(
      "transform 2400ms var(--transition-out-expo)",
    );
  });

  it("reveals on intersection and disconnects the observer", async () => {
    const el = document.createElement("div");
    document.body.appendChild(el);

    animateIn(el);
    const observer = FakeIntersectionObserver.instances[0];
    expect(observer).toBeDefined();
    expect(observer.observed[0]).toBe(el);

    observer.trigger(true);
    // Reveal is deferred two animation frames so the hidden state commits
    // first (otherwise same-frame observer fires collapse into one recalc
    // and the transition never plays).
    await nextTwoFrames();

    expect(el.style.opacity).toBe("1");
    expect(el.style.transform).toBe("translateY(0)");
    expect(observer.disconnected).toBe(true);
  });

  it("does not reveal when not intersecting", () => {
    const el = document.createElement("div");
    document.body.appendChild(el);

    animateIn(el);
    FakeIntersectionObserver.instances[0].trigger(false);

    expect(el.style.opacity).toBe("0");
    expect(FakeIntersectionObserver.instances[0].disconnected).toBe(false);
  });

  it("disconnects the observer on destroy", () => {
    const el = document.createElement("div");
    document.body.appendChild(el);

    const ret = animateIn(el);
    const observer = FakeIntersectionObserver.instances[0];
    ret.destroy();

    expect(observer.disconnected).toBe(true);
  });

  it("sets transition-delay based on horizontal position", () => {
    const el = document.createElement("div");
    document.body.appendChild(el);
    // Element 25% across a 1000px viewport, delayMax 400 → 100ms delay.
    Object.defineProperty(window, "innerWidth", {
      value: 1000,
      configurable: true,
    });
    el.getBoundingClientRect = () =>
      ({
        left: 250,
        top: 0,
        right: 0,
        bottom: 0,
        width: 0,
        height: 0,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }) as DOMRect;

    animateIn(el);

    expect(el.style.transitionDelay).toBe("100ms");
  });

  it("honors a custom delayMax", () => {
    const el = document.createElement("div");
    document.body.appendChild(el);
    Object.defineProperty(window, "innerWidth", {
      value: 1000,
      configurable: true,
    });
    el.getBoundingClientRect = () =>
      ({
        left: 500,
        top: 0,
        right: 0,
        bottom: 0,
        width: 0,
        height: 0,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }) as DOMRect;

    animateIn(el, { delayMax: 800 });

    expect(el.style.transitionDelay).toBe("400ms");
  });

  it("staggers by index x step when `stagger` is set", () => {
    const el = document.createElement("div");
    document.body.appendChild(el);

    animateIn(el, { stagger: 120, index: 3 });

    expect(el.style.transitionDelay).toBe("360ms");
  });

  it("treats a missing index as 0 (no delay) when staggering", () => {
    const el = document.createElement("div");
    document.body.appendChild(el);

    animateIn(el, { stagger: 120 });

    expect(el.style.transitionDelay).toBe("0ms");
  });

  it("index-based stagger overrides the position-based delay", () => {
    const el = document.createElement("div");
    document.body.appendChild(el);
    Object.defineProperty(window, "innerWidth", {
      value: 1000,
      configurable: true,
    });
    // Positioned where the horizontal heuristic would give 200ms...
    el.getBoundingClientRect = () =>
      ({
        left: 500,
        top: 0,
        right: 0,
        bottom: 0,
        width: 0,
        height: 0,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }) as DOMRect;

    // ...but an explicit index/stagger wins.
    animateIn(el, { stagger: 100, index: 4 });

    expect(el.style.transitionDelay).toBe("400ms");
  });

  it("still reveals a staggered element on intersection", async () => {
    const el = document.createElement("div");
    document.body.appendChild(el);

    animateIn(el, { stagger: 100, index: 2 });
    FakeIntersectionObserver.instances[0].trigger(true);
    await nextTwoFrames();

    expect(el.style.opacity).toBe("1");
    expect(el.style.transitionDelay).toBe("200ms");
  });
});

describe("animateIn — viewport fail-safe", () => {
  // The timer path never touches requestAnimationFrame (that suspension is
  // one of the failure modes it guards), so fake setTimeout is sufficient.
  afterEach(() => {
    vi.useRealTimers();
  });

  it("force-reveals after `failSafe` ms when the observer never fires", () => {
    vi.useFakeTimers();
    const el = document.createElement("div");
    document.body.appendChild(el);

    animateIn(el, { failSafe: 1500 });
    expect(el.style.opacity).toBe("0");

    vi.advanceTimersByTime(1499);
    expect(el.style.opacity).toBe("0");

    vi.advanceTimersByTime(1);
    expect(el.style.opacity).toBe("1");
    expect(el.style.transform).toBe("translateY(0)");
    expect(FakeIntersectionObserver.instances[0].disconnected).toBe(true);
  });

  it("arms no timer without `failSafe` (below-fold stays unrevealed)", () => {
    vi.useFakeTimers();
    const el = document.createElement("div");
    document.body.appendChild(el);

    animateIn(el);
    vi.advanceTimersByTime(60_000);

    expect(el.style.opacity).toBe("0");
    expect(vi.getTimerCount()).toBe(0);
  });

  it("normal intersection reveal is unchanged when it wins the race", async () => {
    const el = document.createElement("div");
    document.body.appendChild(el);

    animateIn(el, { failSafe: 1500 });
    FakeIntersectionObserver.instances[0].trigger(true);
    await nextTwoFrames();

    expect(el.style.opacity).toBe("1");
    expect(el.style.transform).toBe("translateY(0)");
    expect(FakeIntersectionObserver.instances[0].disconnected).toBe(true);
  });

  it("destroy cancels a pending fail-safe", () => {
    vi.useFakeTimers();
    const el = document.createElement("div");
    document.body.appendChild(el);

    const ret = animateIn(el, { failSafe: 1000 });
    ret.destroy();
    vi.advanceTimersByTime(5000);

    expect(el.style.opacity).toBe("0");
  });

  it("reveals in place when IntersectionObserver does not exist at all", () => {
    // @ts-expect-error — simulating an environment with no IO constructor.
    delete window.IntersectionObserver;
    const el = document.createElement("div");
    document.body.appendChild(el);

    animateIn(el);

    expect(el.style.opacity).toBe("1");
    expect(el.style.transform).toBe("translateY(0)");
  });
});

describe("animateIn — triggered mode", () => {
  it("mounts hidden when trigger is false (boolean shorthand)", () => {
    const el = document.createElement("div");
    document.body.appendChild(el);

    animateIn(el, false);

    expect(el.style.opacity).toBe("0");
    expect(el.style.transform).toBe("translateY(50%)");
    expect(FakeIntersectionObserver.instances.length).toBe(0);
  });

  it("mounts visible when trigger is true (boolean shorthand)", () => {
    const el = document.createElement("div");
    document.body.appendChild(el);

    animateIn(el, true);

    expect(el.style.opacity).toBe("1");
    expect(el.style.transform).toBe("translateY(0)");
    expect(FakeIntersectionObserver.instances.length).toBe(0);
  });

  it("mounts visible when options have trigger: true", () => {
    const el = document.createElement("div");
    document.body.appendChild(el);

    animateIn(el, { trigger: true });

    expect(el.style.opacity).toBe("1");
    expect(FakeIntersectionObserver.instances.length).toBe(0);
  });

  it("does not set transition-delay in triggered mode", () => {
    const el = document.createElement("div");
    document.body.appendChild(el);

    animateIn(el, false);

    expect(el.style.transitionDelay).toBe("");
  });

  it("flips to visible when update passes trigger: true", () => {
    const el = document.createElement("div");
    document.body.appendChild(el);

    const ret = animateIn(el, false);
    expect(el.style.opacity).toBe("0");

    ret.update(true);
    expect(el.style.opacity).toBe("1");
    expect(el.style.transform).toBe("translateY(0)");
  });

  it("flips back to hidden when update passes trigger: false", () => {
    const el = document.createElement("div");
    document.body.appendChild(el);

    const ret = animateIn(el, true);
    ret.update(false);

    expect(el.style.opacity).toBe("0");
    expect(el.style.transform).toBe("translateY(50%)");
  });

  it("update is a no-op in viewport mode", () => {
    const el = document.createElement("div");
    document.body.appendChild(el);

    const ret = animateIn(el);
    ret.update({ duration: 500 });

    // Still the default duration — viewport mode ignores updates.
    expect(el.style.transition).toContain("2400ms");
  });
});

describe("animateIn — options overrides", () => {
  it("applies a custom duration in the transition", () => {
    const el = document.createElement("div");
    document.body.appendChild(el);

    animateIn(el, { duration: 1200 });

    expect(el.style.transition).toContain(
      "opacity 1200ms var(--transition-out-expo)",
    );
    expect(el.style.transition).toContain(
      "transform 1200ms var(--transition-out-expo)",
    );
  });

  it("applies a custom translateY on the hidden transform", () => {
    const el = document.createElement("div");
    document.body.appendChild(el);

    animateIn(el, { translateY: "24px" });

    expect(el.style.transform).toBe("translateY(24px)");
  });

  it("passes duration through in triggered mode too", () => {
    const el = document.createElement("div");
    document.body.appendChild(el);

    animateIn(el, { trigger: false, duration: 800 });

    expect(el.style.transition).toContain("800ms");
  });
});

// MARKUP ROUND I1 pin #2 (our-team board, thread 20a4af72…): the reveal's
// inline transition used to outlive the reveal, so it stayed the element's
// transition list forever and silently disabled every class-declared hover
// transition on anything that reveals. The team card's `-translate-y-1` raise
// snapped because the inline list names `transform`, not `translate`.
describe("animateIn — hands the element back to its stylesheet", () => {
  it("releases the inline reveal styles when the reveal transition ends", async () => {
    const el = document.createElement("div");
    document.body.appendChild(el);

    animateIn(el);
    expect(el.style.transition).not.toBe("");

    FakeIntersectionObserver.instances[0].trigger(true);
    await nextTwoFrames();
    // Still owned by the action while the reveal is actually running.
    expect(el.style.transition).not.toBe("");
    expect(el.style.opacity).toBe("1");

    el.dispatchEvent(
      new TransitionEvent("transitionend", {
        propertyName: "opacity",
        bubbles: true,
      }),
    );

    expect(el.style.transition).toBe("");
    expect(el.style.transitionDelay).toBe("");
    expect(el.style.transform).toBe("");
    expect(el.style.opacity).toBe("");
  });

  it("ignores a descendant's transitionend", async () => {
    const el = document.createElement("div");
    const child = document.createElement("span");
    el.appendChild(child);
    document.body.appendChild(el);

    animateIn(el);
    FakeIntersectionObserver.instances[0].trigger(true);
    await nextTwoFrames();

    // A child finishing its own transition must not strip the parent's reveal
    // mid-flight — transitionend bubbles, so this is a real path, not a
    // hypothetical one.
    child.dispatchEvent(
      new TransitionEvent("transitionend", {
        propertyName: "opacity",
        bubbles: true,
      }),
    );
    expect(el.style.transition).not.toBe("");
  });

  it("releases on a timer when no transition ever runs", async () => {
    vi.useFakeTimers();
    const el = document.createElement("div");
    document.body.appendChild(el);

    animateIn(el, { duration: 400 });
    FakeIntersectionObserver.instances[0].trigger(true);
    await vi.advanceTimersByTimeAsync(0);
    // The double-rAF reveal is patched to timers under fake timers; drive past
    // duration + slack and the release must have happened anyway.
    await vi.advanceTimersByTimeAsync(1200);

    expect(el.style.transition).toBe("");
    vi.useRealTimers();
  });
});

describe("animateIn — prefers-reduced-motion", () => {
  it("skips animation when reduced motion is preferred (viewport mode)", () => {
    mockMatchMedia(true);
    const el = document.createElement("div");
    document.body.appendChild(el);

    animateIn(el);

    expect(el.style.opacity).toBe("");
    expect(el.style.transform).toBe("");
    expect(el.style.transition).toBe("");
    expect(FakeIntersectionObserver.instances.length).toBe(0);
  });

  it("skips animation when reduced motion is preferred (triggered mode)", () => {
    mockMatchMedia(true);
    const el = document.createElement("div");
    document.body.appendChild(el);

    animateIn(el, false);

    expect(el.style.opacity).toBe("");
    expect(el.style.transition).toBe("");
  });
});
