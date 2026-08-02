import { describe, it, expect, vi, afterEach } from "vitest";
import { floatAlong } from "./floatAlong";

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

  it("glides to the BOTTOM-MOST fully visible item, measured from item 0", () => {
    mockMatchMedia(false);
    const { parent, node } = makeDom(3);
    const items = [
      ...parent.querySelectorAll<HTMLElement>(".qa-item"),
    ] as HTMLElement[];
    // Items 0-1 fully inside the viewport, item 2 hanging below it — the
    // pair must target item 1 (bottom-most FULLY visible), translated by its
    // offset from item 0 (the pair's authored resting position). jsdom rects
    // default to all-zero, so these stubs are what exercise the predicate.
    const rect = (top: number, bottom: number) => ({ top, bottom }) as DOMRect;
    items[0]!.getBoundingClientRect = () => rect(10, 410);
    items[1]!.getBoundingClientRect = () => rect(430, 750);
    items[2]!.getBoundingClientRect = () => rect(770, 1190);
    Object.defineProperty(items[0]!, "offsetTop", {
      value: 0,
      configurable: true,
    });
    Object.defineProperty(items[1]!, "offsetTop", {
      value: 420,
      configurable: true,
    });

    floatAlong(node, { itemSelector: ".qa-item" });

    expect(node.style.transform).toBe("translateY(420px)");
  });

  it("holds its current target while NO item is fully visible (no twitching)", () => {
    mockMatchMedia(false);
    const { parent, node } = makeDom(2);
    const items = [
      ...parent.querySelectorAll<HTMLElement>(".qa-item"),
    ] as HTMLElement[];
    // A tall card straddles the top edge and the next hangs off the bottom:
    // nothing is fully visible, so the pair stays where it is (index 0 =
    // resting position = no transform written).
    const rect = (top: number, bottom: number) => ({ top, bottom }) as DOMRect;
    items[0]!.getBoundingClientRect = () => rect(-40, 380);
    items[1]!.getBoundingClientRect = () => rect(700, 1120);

    floatAlong(node, { itemSelector: ".qa-item" });

    expect(node.style.transform).toBe("");
  });

  it("parks at rest below the desktop breakpoint (mobile pair sits in place)", () => {
    mockMatchMedia(false, false);
    const { parent, node } = makeDom(3);
    const items = [
      ...parent.querySelectorAll<HTMLElement>(".qa-item"),
    ] as HTMLElement[];
    // Rects that would target item 2 at desktop — mobile must ignore them.
    const rect = (top: number, bottom: number) => ({ top, bottom }) as DOMRect;
    items.forEach((el, i) => {
      el.getBoundingClientRect = () => rect(10 + i * 100, 110 + i * 100);
    });

    floatAlong(node, { itemSelector: ".qa-item" });

    expect(node.style.transform).toBe("");
  });

  it("clamps to the last item once the whole list is scrolled past", () => {
    mockMatchMedia(false);
    const { parent, node } = makeDom(3);
    const items = [
      ...parent.querySelectorAll<HTMLElement>(".qa-item"),
    ] as HTMLElement[];
    const rect = (top: number, bottom: number) => ({ top, bottom }) as DOMRect;
    items[0]!.getBoundingClientRect = () => rect(-900, -500);
    items[1]!.getBoundingClientRect = () => rect(-480, -80);
    items[2]!.getBoundingClientRect = () => rect(-60, -10);
    Object.defineProperty(items[0]!, "offsetTop", {
      value: 0,
      configurable: true,
    });
    Object.defineProperty(items[2]!, "offsetTop", {
      value: 840,
      configurable: true,
    });

    floatAlong(node, { itemSelector: ".qa-item" });

    expect(node.style.transform).toBe("translateY(840px)");
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
