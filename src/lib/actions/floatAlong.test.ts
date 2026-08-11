import { describe, it, expect, vi, afterEach } from "vitest";
import { floatAlong } from "./floatAlong";

// ROUND G3 CONTRACT — the pair drifts CONTINUOUSLY with scroll (MarkUp thread
// a7c2e0d0-5e13-4cfd-bb17-a21ecee7b188 home pin #7, operator directive
// 2026-08-11: Tim over live). Live's floating-doc.js hopped the pair
// per-question to the bottom-most fully visible card; Tim: "I do not like the
// jumping from question to question." The mapping is now piecewise-linear
// over the items' viewport-bottom crossings — these tests pin the mapping's
// endpoints, its interpolation, and the no-step property of the rAF follow.

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

// jsdom's viewport: the mapping's tracking line is window.innerHeight = 768.
const VIEWPORT_BOTTOM = 768;

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

  it("leaves the authored style untouched while the column is below the tracking line", () => {
    mockMatchMedia(false);
    const { parent, node } = makeDom(2);
    const [a, b] = items(parent);
    // First item's bottom sits ON/below the viewport bottom: mapping is 0,
    // and the node keeps its server-rendered style byte-for-byte (the static
    // gate captures depend on exactly this).
    a!.getBoundingClientRect = () => rect(400, VIEWPORT_BOTTOM);
    b!.getBoundingClientRect = () => rect(790, 1180);

    mount(node);

    expect(node.style.transform).toBe("");
  });

  it("interpolates BETWEEN item bottoms — a mid-segment scroll yields a mid-segment position", () => {
    mockMatchMedia(false);
    const { parent, node } = makeDom(3);
    const [a, b, c] = items(parent);
    // Viewport bottom (768) sits between bottom(item0)=400 and
    // bottom(item1)=820: t = (768-400)/(820-400) = 368/420, mapped onto the
    // offsetTop ladder 0→420 = 368px. The OLD quantized rule could only ever
    // answer 0 or 420 here — this fractional value is the round's point.
    a!.getBoundingClientRect = () => rect(0, 400);
    b!.getBoundingClientRect = () => rect(420, 820);
    c!.getBoundingClientRect = () => rect(840, 1240);
    setOffsetTop(a!, 0);
    setOffsetTop(b!, 420);
    setOffsetTop(c!, 840);

    mount(node);

    expect(node.style.transform).toBe("translateY(368px)");
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

describe("floatAlong — the follow cannot step", () => {
  it("approaches a moved target through strictly intermediate positions, bounded per frame, and settles exactly", () => {
    mockMatchMedia(false);
    // Manual rAF: each frame is driven by hand with its own timestamp, so the
    // exponential follow is fully deterministic here.
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
        scrolled ? rect(-900, -500) : rect(400, VIEWPORT_BOTTOM);
      b!.getBoundingClientRect = () =>
        scrolled ? rect(-480, -80) : rect(790, 1180);
      c!.getBoundingClientRect = () =>
        scrolled ? rect(-60, -10) : rect(1200, 1590);
      setOffsetTop(a!, 0);
      setOffsetTop(b!, 420);
      setOffsetTop(c!, 840);

      mount(node);
      expect(node.style.transform).toBe("");

      // The user scrolls past the whole column in one jump — the TARGET
      // leaps 0→840, the worst case the old code answered with a hop.
      scrolled = true;
      window.dispatchEvent(new Event("scroll"));

      const positions: number[] = [];
      let ts = 1000;
      for (let i = 0; i < 400 && frames.length > 0; i++) {
        const cb = frames.shift()!;
        cb(ts);
        ts += 16;
        positions.push(ty(node));
      }

      // Settled: dormant (no pending frame) at exactly the mapped position.
      expect(frames.length).toBe(0);
      expect(node.style.transform).toBe("translateY(840px)");
      // No step: every frame moves, no frame moves more than the follow's
      // per-frame bound (~10.7% of the remaining gap at 16ms/TAU 150ms —
      // first frame ≈ 85px), and the sequence is strictly monotone up to
      // the settle snap.
      expect(positions.length).toBeGreaterThan(10);
      expect(positions[0]!).toBeGreaterThan(0);
      expect(positions[0]!).toBeLessThan(130);
      for (let i = 1; i < positions.length; i++) {
        const d = positions[i]! - positions[i - 1]!;
        expect(d).toBeGreaterThanOrEqual(0);
        expect(d).toBeLessThan(130);
      }
    } finally {
      window.requestAnimationFrame = originalRaf;
    }
  });
});
