import { describe, it, expect, vi, afterEach } from "vitest";
import { floatAlong } from "./floatAlong";

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

afterEach(() => {
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("floatAlong — prefers-reduced-motion: reduce", () => {
  it("attaches no scroll/resize listeners", () => {
    mockMatchMedia(true);
    const { node } = makeDom(3);
    const addSpy = vi.spyOn(window, "addEventListener");

    floatAlong(node, { itemSelector: ".qa-item" });

    expect(addSpy).not.toHaveBeenCalledWith(
      "scroll",
      expect.anything(),
      expect.anything(),
    );
    expect(addSpy).not.toHaveBeenCalledWith("resize", expect.anything());
  });

  it("never sets a transform on the node", () => {
    mockMatchMedia(true);
    const { node } = makeDom(3);

    floatAlong(node, { itemSelector: ".qa-item" });

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

describe("floatAlong — motion allowed", () => {
  it("attaches passive scroll and resize listeners on mount", () => {
    mockMatchMedia(false);
    const { node } = makeDom(3);
    const addSpy = vi.spyOn(window, "addEventListener");

    floatAlong(node, { itemSelector: ".qa-item" });

    expect(addSpy).toHaveBeenCalledWith("scroll", expect.any(Function), {
      passive: true,
    });
    expect(addSpy).toHaveBeenCalledWith("resize", expect.any(Function));
  });

  it("aligns the node's transform to the topmost matching item on mount", () => {
    mockMatchMedia(false);
    const { parent, node } = makeDom(2);
    const firstItem = parent.querySelector(".qa-item") as HTMLElement;
    Object.defineProperty(firstItem, "offsetTop", {
      value: 120,
      configurable: true,
    });

    floatAlong(node, { itemSelector: ".qa-item" });

    expect(node.style.transform).toBe("translateY(120px)");
  });

  it("picks the topmost VISIBLE item once earlier items scroll out", () => {
    mockMatchMedia(false);
    const { parent, node } = makeDom(3);
    const items = [
      ...parent.querySelectorAll<HTMLElement>(".qa-item"),
    ] as HTMLElement[];
    // Simulate mid-scroll: item 0 fully above the viewport (bottom <= 0),
    // items 1-2 still visible. jsdom rects default to all-zero, so without
    // these stubs every test would only ever exercise the `?? items[0]`
    // fallback — this is the one test that proves the `.find` predicate.
    const rect = (bottom: number) => ({ bottom, top: bottom - 50 }) as DOMRect;
    items[0]!.getBoundingClientRect = () => rect(-10);
    items[1]!.getBoundingClientRect = () => rect(40);
    items[2]!.getBoundingClientRect = () => rect(90);
    Object.defineProperty(items[1]!, "offsetTop", {
      value: 250,
      configurable: true,
    });

    floatAlong(node, { itemSelector: ".qa-item" });

    expect(node.style.transform).toBe("translateY(250px)");
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
