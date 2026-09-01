import { describe, it, expect, vi, afterEach } from "vitest";
import { floatAlong } from "./floatAlong";

// ROUND G3 CONTRACT — the pair drifts CONTINUOUSLY with scroll (MarkUp thread
// a7c2e0d0-5e13-4cfd-bb17-a21ecee7b188 home pin #7, operator directive
// 2026-08-11: Tim over live). Live's floating-doc.js hopped the pair
// per-question to the bottom-most fully visible card; Tim: "I do not like the
// jumping from question to question."
//
// SUPERSEDED IN MECHANISM by directive 3 (2026-08-13, after the continuous
// build was deployed): "it should sit in the same place for each card."
// Continuous interpolation pins the pair to a fixed SCREEN position and lets
// the cards slide past, so its offset within a card sweeps the card's whole
// height. Only a quantized target travels WITH a card. The rAF follow is what
// still honours pin #7 — the target steps, the rendered position does not.
//
// These tests pin: the quantized target (never between two cards), that it
// holds across the whole scroll range a card owns, the clamps at both ends,
// and that the follow renders the handover as intermediate frames.

function mockMatchMedia(reducedMotion: boolean, desktop = true) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches:
      query === "(prefers-reduced-motion: reduce)"
        ? reducedMotion
        : // The float is desktop-only; behaviour tests run "at desktop"
          // unless a test opts into the mobile branch.
          query === "(min-width: 1024px)"
          ? desktop
          : false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    onchange: null,
    dispatchEvent: () => false,
  }));
}

/** Build a `<div class="side">` sibling of N `.qa-item` elements under a
 *  shared parent, matching floatAlong's expected DOM shape (node.parentElement
 *  is searched for itemSelector matches). */
function makeDom(itemCount: number) {
  const parent = document.createElement("div");
  for (let i = 0; i < itemCount; i++) {
    const item = document.createElement("div");
    item.className = "qa-item";
    parent.appendChild(item);
  }
  const node = document.createElement("div");
  node.className = "side";
  parent.appendChild(node);
  document.body.appendChild(parent);
  return { parent, node };
}

const rect = (top: number, bottom: number) => ({ top, bottom }) as DOMRect;

const items = (parent: HTMLElement) => [
  ...parent.querySelectorAll<HTMLElement>(".qa-item"),
];

const setOffsetTop = (el: HTMLElement, value: number) =>
  Object.defineProperty(el, "offsetTop", { value, configurable: true });

const ty = (node: HTMLElement): number => {
  const t = node.style.transform;
  if (!t) return 0;
  const m = /translateY\((-?[\d.]+)px\)/.exec(t);
  if (!m) throw new Error(`unexpected transform: ${t}`);
  return parseFloat(m[1]!);
};

/** Every instance is destroyed after its test: an undestroyed instance keeps
 *  its window scroll listener alive across tests, and a later test's scroll
 *  dispatch would wake the zombie too (its step lands first in a stubbed rAF
 *  queue and the assertions read a frame that belongs to nobody). */
const handles: Array<{ destroy(): void } | undefined | void> = [];
const mount = (node: HTMLElement) => {
  const handle = floatAlong(node, { itemSelector: ".qa-item" });
  handles.push(handle);
  return handle;
};

afterEach(() => {
  while (handles.length > 0) handles.pop()?.destroy();
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

// jsdom's viewport height. The mapping's tracking line is the viewport TOP
// (y = 0), so this is only used to build plausible rects — no assertion below
// depends on its value, which is the point: the line no longer moves with the
// window's height.
const VIEWPORT_H = 768;

describe("floatAlong — prefers-reduced-motion: reduce", () => {
  it("attaches no scroll/resize listeners", () => {
    mockMatchMedia(true);
    const { node } = makeDom(3);
    const addSpy = vi.spyOn(window, "addEventListener");

    mount(node);

    expect(addSpy).not.toHaveBeenCalledWith(
      "scroll",
      expect.anything(),
      expect.anything(),
    );
    expect(addSpy).not.toHaveBeenCalledWith("resize", expect.anything());
  });

  it("never sets a transform on the node (statically at rest)", () => {
    mockMatchMedia(true);
    const { node } = makeDom(3);

    mount(node);

    expect(node.style.transform).toBe("");
  });
});

describe("floatAlong — matchMedia unavailable", () => {
  it("is a complete no-op (no listeners, no transform, no handle)", () => {
    const original = window.matchMedia;
    // @ts-expect-error — simulating an environment without matchMedia
    delete window.matchMedia;
    try {
      const { node } = makeDom(2);
      const addSpy = vi.spyOn(window, "addEventListener");

      const handle = floatAlong(node, { itemSelector: ".qa-item" });

      expect(handle).toBeUndefined();
      expect(addSpy).not.toHaveBeenCalled();
      expect(node.style.transform).toBe("");
    } finally {
      window.matchMedia = original;
    }
  });
});

describe("floatAlong — the continuous mapping", () => {
  it("attaches passive scroll and resize listeners on mount", () => {
    mockMatchMedia(false);
    const { node } = makeDom(3);
    const addSpy = vi.spyOn(window, "addEventListener");

    mount(node);

    expect(addSpy).toHaveBeenCalledWith("scroll", expect.any(Function), {
      passive: true,
    });
    expect(addSpy).toHaveBeenCalledWith("resize", expect.any(Function));
  });

  it("leaves the authored style untouched while the first question is still fully visible", () => {
    mockMatchMedia(false);
    const { parent, node } = makeDom(2);
    const [a, b] = items(parent);
    // The first item's TOP is still below the viewport top, so it is the
    // top-most fully visible question and the pair is at rest: mapping is 0,
    // and the node keeps its server-rendered style byte-for-byte (the static
    // gate captures depend on exactly this).
    a!.getBoundingClientRect = () => rect(400, VIEWPORT_H);
    b!.getBoundingClientRect = () => rect(790, 1180);

    mount(node);

    expect(node.style.transform).toBe("");
  });

  it("QUANTIZES to a card — a mid-segment scroll still lands on a card's own offset", () => {
    mockMatchMedia(false);
    const { parent, node } = makeDom(3);
    const [a, b, c] = items(parent);
    // Item 0 is 368px past the viewport top and item 1 has not reached it yet
    // (top=52), so item 1 is the top-most question the viewport top has not cut
    // into: the target is item 1's own offset, 420 — NOT the 368 that the
    // continuous mapping answered here. This is the "same place for each card"
    // contract: the pair is never parked between two cards.
    a!.getBoundingClientRect = () => rect(-368, 32);
    b!.getBoundingClientRect = () => rect(52, 452);
    c!.getBoundingClientRect = () => rect(472, 872);
    setOffsetTop(a!, 0);
    setOffsetTop(b!, 420);
    setOffsetTop(c!, 840);

    mount(node);

    expect(node.style.transform).toBe("translateY(420px)");
  });

  it("holds ONE offset across the whole range a card owns — one spot per card", () => {
    mockMatchMedia(false);
    // DIRECTIVE 5 reverses I1 here. I1 interpolated across the first 70% of
    // each card's pitch so that position was continuous in scroll; the operator
    // saw it on the deploy preview and said "the snap still feels real weird,
    // stick with one spot per card". So within the whole range item 1 owns the
    // answer is item 1's own rung — 420 at every scroll position in it, exact
    // and identical, never a value between two rungs.
    //
    // This is the test that fails if anyone reintroduces a continuous mapping,
    // and it is deliberately swept rather than sampled once: I1's version
    // passed a single-point check at the end of the range and was still wrong
    // through the first 70% of it.
    const at = (topOfA: number) => {
      const { parent, node } = makeDom(3);
      const [a, b, c] = items(parent);
      a!.getBoundingClientRect = () => rect(topOfA, topOfA + 400);
      b!.getBoundingClientRect = () => rect(topOfA + 420, topOfA + 820);
      c!.getBoundingClientRect = () => rect(topOfA + 840, topOfA + 1240);
      setOffsetTop(a!, 0);
      setOffsetTop(b!, 420);
      setOffsetTop(c!, 840);
      mount(node);
      const v = ty(node);
      document.body.innerHTML = "";
      return v;
    };

    // The entire range item 1 owns: from the instant item 0's top is cut to
    // the instant item 1's is. Every one of these is the SAME number.
    for (const topOfA of [-1, -60, -150, -250, -300, -360, -419]) {
      expect(at(topOfA)).toBe(420);
    }
    // One pixel further and item 1's own top is cut, so the anchor advances.
    expect(at(-421)).toBe(840);
  });

  it("tracks the TOP fully visible question, not the bottom one", () => {
    mockMatchMedia(false);
    const { parent, node } = makeDom(3);
    const [a, b, c] = items(parent);
    // Item 0 has scrolled exactly off the top; item 1's top is ON the line, so
    // item 1 is the top-most fully visible question and the pair sits beside
    // it. Item 2 is also fully on screen and is the BOTTOM-most fully visible
    // one — the old rule would have answered 840 for this same geometry.
    a!.getBoundingClientRect = () => rect(-420, -20);
    b!.getBoundingClientRect = () => rect(0, 400);
    c!.getBoundingClientRect = () => rect(420, 820);
    setOffsetTop(a!, 0);
    setOffsetTop(b!, 420);
    setOffsetTop(c!, 840);

    mount(node);

    expect(node.style.transform).toBe("translateY(420px)");
  });

  it("clamps to the last item's offset once the whole column is scrolled past (never leaves the column)", () => {
    mockMatchMedia(false);
    const { parent, node } = makeDom(3);
    const [a, b, c] = items(parent);
    a!.getBoundingClientRect = () => rect(-900, -500);
    b!.getBoundingClientRect = () => rect(-480, -80);
    c!.getBoundingClientRect = () => rect(-60, -10);
    setOffsetTop(a!, 0);
    setOffsetTop(c!, 840);

    mount(node);

    expect(node.style.transform).toBe("translateY(840px)");
  });

  it("parks at rest below the desktop breakpoint (mobile pair sits in place)", () => {
    mockMatchMedia(false, false);
    const { parent, node } = makeDom(3);
    // Rects that would place the pair mid-column at desktop — mobile must
    // ignore them.
    items(parent).forEach((el, i) => {
      el.getBoundingClientRect = () => rect(10 + i * 100, 110 + i * 100);
    });

    mount(node);

    expect(node.style.transform).toBe("");
  });

  it("removes the listeners it added when destroyed", () => {
    mockMatchMedia(false);
    const { node } = makeDom(3);
    const addSpy = vi.spyOn(window, "addEventListener");
    const removeSpy = vi.spyOn(window, "removeEventListener");

    const handle = floatAlong(node, { itemSelector: ".qa-item" });
    const [scrollEvent, scrollHandler] = addSpy.mock.calls.find(
      (c) => c[0] === "scroll",
    ) as [string, EventListener];
    const [resizeEvent, resizeHandler] = addSpy.mock.calls.find(
      (c) => c[0] === "resize",
    ) as [string, EventListener];

    handle?.destroy?.();

    expect(removeSpy).toHaveBeenCalledWith(scrollEvent, scrollHandler);
    expect(removeSpy).toHaveBeenCalledWith(resizeEvent, resizeHandler);
  });
});

describe("floatAlong — nothing moves except scroll", () => {
  it("writes once per scroll burst and never animates on its own", () => {
    mockMatchMedia(false);
    // Manual rAF: frames are driven by hand, so "does a frame move it?" is a
    // question this test can actually ask.
    const frames: FrameRequestCallback[] = [];
    const originalRaf = window.requestAnimationFrame;
    window.requestAnimationFrame = ((cb: FrameRequestCallback) => {
      frames.push(cb);
      return frames.length;
    }) as typeof window.requestAnimationFrame;
    try {
      const { parent, node } = makeDom(3);
      const [a, b, c] = items(parent);
      // Mount geometry: column below the tracking line → rest (0).
      let scrolled = false;
      a!.getBoundingClientRect = () =>
        scrolled ? rect(-900, -500) : rect(400, VIEWPORT_H);
      b!.getBoundingClientRect = () =>
        scrolled ? rect(-480, -80) : rect(790, 1180);
      c!.getBoundingClientRect = () =>
        scrolled ? rect(-60, -10) : rect(1200, 1590);
      setOffsetTop(a!, 0);
      setOffsetTop(b!, 420);
      setOffsetTop(c!, 840);

      // Timers ONLY: vitest's default useFakeTimers also fakes rAF, which
      // would replace the manual frame queue this test is built on.
      vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
      mount(node);
      expect(node.style.transform).toBe("");

      // A jump past the whole column. The frame DECIDES an index; it does not
      // paint. Painting waits out the settle window, which is what stops a
      // flick from firing a transition per card it passes.
      scrolled = true;
      window.dispatchEvent(new Event("scroll"));

      expect(frames.length).toBe(1);
      frames.shift()!(1000);
      expect(node.style.transform).toBe("");

      // NO follow-up frame was scheduled: there is no loop to settle. The
      // browser owns the motion from here; this action only picks rungs.
      expect(frames.length).toBe(0);

      vi.advanceTimersByTime(120);
      expect(node.style.transform).toBe("translateY(840px)");

      // A burst of scroll events at the SAME index coalesces to a single frame
      // and, since the index did not change, writes nothing further.
      window.dispatchEvent(new Event("scroll"));
      window.dispatchEvent(new Event("scroll"));
      window.dispatchEvent(new Event("scroll"));
      expect(frames.length).toBe(1);
      frames.shift()!(1016);
      vi.advanceTimersByTime(120);
      expect(node.style.transform).toBe("translateY(840px)");
      expect(frames.length).toBe(0);
    } finally {
      vi.useRealTimers();
      window.requestAnimationFrame = originalRaf;
    }
  });
});

// DIRECTIVE 5 (2026-09-01): "stick with one spot per card, ship just the fix
// with an eased translation transition ... probably wants a debounce as well to
// avoid jittery feelings." Position is quantized (covered above); these two pin
// the MOTION, which is the half that was actually being complained about.
describe("floatAlong — the hop is eased and debounced", () => {
  /** Manual frames + fake setTimeout. rAF must stay hand-driven (vitest's
   *  default fake timers would swallow it), so only the settle timer is faked. */
  function harness(itemCount = 3) {
    const frames: FrameRequestCallback[] = [];
    const originalRaf = window.requestAnimationFrame;
    window.requestAnimationFrame = ((cb: FrameRequestCallback) => {
      frames.push(cb);
      return frames.length;
    }) as typeof window.requestAnimationFrame;
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    const restore = () => {
      vi.useRealTimers();
      window.requestAnimationFrame = originalRaf;
    };
    const { parent, node } = makeDom(itemCount);
    const list = items(parent);
    list.forEach((el, i) => setOffsetTop(el, i * 420));
    /** Move the column so `cut` items' tops are above the tracking line. */
    const scrollTo = (cut: number) =>
      list.forEach((el, i) => {
        const top = (i - cut) * 420 + (i < cut ? -10 : 10);
        el.getBoundingClientRect = () => rect(top, top + 400);
      });
    const tick = () => {
      window.dispatchEvent(new Event("scroll"));
      while (frames.length) frames.shift()!(0);
    };
    return { node, scrollTo, tick, frames, restore };
  }

  it("uses live's own transition for a hop, and never eases the mount", () => {
    mockMatchMedia(false);
    const h = harness();
    try {
      // Deep link straight into the middle of the column.
      h.scrollTo(1);
      mount(h.node);
      // Positioned immediately, but NOT eased: gliding in from rest would be
      // motion nobody scrolled for.
      expect(h.node.style.transform).toBe("translateY(420px)");
      expect(h.node.style.transition).toBe("");

      // A real handover eases, with live's curve (beachfront.css:7670).
      h.scrollTo(2);
      h.tick();
      vi.advanceTimersByTime(120);
      expect(h.node.style.transform).toBe("translateY(840px)");
      expect(h.node.style.transition).toBe(
        "transform 1s cubic-bezier(.19, 1, .22, 1)",
      );
    } finally {
      h.restore();
    }
  });

  it("a flick past several cards commits ONCE, to the card it lands on", () => {
    mockMatchMedia(false);
    const h = harness(5);
    try {
      h.scrollTo(0);
      mount(h.node);
      expect(h.node.style.transform).toBe("");

      // Four cards blow past inside one settle window. Under a naive
      // implementation each would start its own 1s transition and each would be
      // interrupted mid-flight by the next — restarting from wherever the last
      // had got to, which is exactly the "jittery" reading. Nothing may be
      // painted while the index is still moving.
      for (const cut of [1, 2, 3, 4]) {
        h.scrollTo(cut);
        h.tick();
        vi.advanceTimersByTime(60); // < SETTLE_MS, and the index keeps changing
        expect(h.node.style.transform).toBe("");
      }

      // It settles once, on the card actually landed on — not on any it passed.
      vi.advanceTimersByTime(120);
      expect(h.node.style.transform).toBe("translateY(1680px)");
    } finally {
      h.restore();
    }
  });

  it("absorbs oscillation at a handover boundary without re-firing the hop", () => {
    mockMatchMedia(false);
    const h = harness();
    try {
      h.scrollTo(1);
      mount(h.node);
      expect(h.node.style.transform).toBe("translateY(420px)");

      // Trackpad rubber-banding across the boundary: 2 -> 1 -> 2 inside one
      // settle window. The pair must not chase it.
      for (const cut of [2, 1, 2]) {
        h.scrollTo(cut);
        h.tick();
        vi.advanceTimersByTime(40);
      }
      expect(h.node.style.transform).toBe("translateY(420px)");

      vi.advanceTimersByTime(120);
      expect(h.node.style.transform).toBe("translateY(840px)");
    } finally {
      h.restore();
    }
  });
});
