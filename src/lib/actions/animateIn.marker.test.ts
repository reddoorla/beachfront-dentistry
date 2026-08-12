import { describe, it, expect, beforeEach, vi } from "vitest";
import { animateIn } from "./animateIn";

// `data-reveal` is the declarative twin of animateIn's inline hidden state:
// app.css hides `[data-reveal]` at first paint so server-rendered markup can
// carry the attribute and be hidden BEFORE hydration instead of after it. The
// contract the action owes that CSS is narrow and mechanical — mark while
// hidden, unmark the moment it reveals, and never leave a marker behind.

class FakeIntersectionObserver {
  static instances: FakeIntersectionObserver[] = [];
  cb: IntersectionObserverCallback;
  disconnected = false;
  constructor(cb: IntersectionObserverCallback) {
    this.cb = cb;
    FakeIntersectionObserver.instances.push(this);
  }
  observe() {}
  unobserve() {}
  disconnect() {
    this.disconnected = true;
  }
  enter() {
    this.cb(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    );
  }
}

const nextTwoFrames = () =>
  new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  );

let listeners: ((event: MediaQueryListEvent) => void)[] = [];
let reduced = false;

function mockMatchMedia() {
  listeners = [];
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    get matches() {
      return query === "(prefers-reduced-motion: reduce)" ? reduced : false;
    },
    media: query,
    addEventListener: (_: string, fn: (e: MediaQueryListEvent) => void) =>
      listeners.push(fn),
    removeEventListener: (_: string, fn: (e: MediaQueryListEvent) => void) => {
      listeners = listeners.filter((l) => l !== fn);
    },
    addListener: () => {},
    removeListener: () => {},
    onchange: null,
    dispatchEvent: () => false,
  }));
}

const turnReduceOn = () => {
  reduced = true;
  for (const fn of [...listeners]) fn({ matches: true } as MediaQueryListEvent);
};

function element() {
  const el = document.createElement("div");
  document.body.appendChild(el);
  return el;
}

beforeEach(() => {
  FakeIntersectionObserver.instances = [];
  // @ts-expect-error — replacing global for test
  window.IntersectionObserver = FakeIntersectionObserver;
  reduced = false;
  mockMatchMedia();
  Object.defineProperty(window, "innerWidth", {
    value: 1024,
    configurable: true,
  });
});

describe("animateIn — the data-reveal marker", () => {
  it("marks the element while it is hidden", () => {
    const el = element();
    animateIn(el);
    expect(el.hasAttribute("data-reveal")).toBe(true);
    expect(el.style.opacity).toBe("0");
  });

  it("unmarks it when it reveals", async () => {
    const el = element();
    animateIn(el);
    FakeIntersectionObserver.instances[0]!.enter();
    await nextTwoFrames();
    expect(el.hasAttribute("data-reveal")).toBe(false);
    expect(el.style.opacity).toBe("1");
  });

  it("unmarks it when the fail-safe fires instead", async () => {
    vi.useFakeTimers();
    const el = element();
    animateIn(el, { failSafe: 50 });
    expect(el.hasAttribute("data-reveal")).toBe(true);
    vi.advanceTimersByTime(60);
    vi.useRealTimers();
    expect(el.hasAttribute("data-reveal")).toBe(false);
    expect(el.style.opacity).toBe("1");
  });

  it("reveals in place, unmarked, when there is no IntersectionObserver", () => {
    const saved = window.IntersectionObserver;
    // @ts-expect-error — simulating a browser without the API
    delete window.IntersectionObserver;
    try {
      const el = element();
      animateIn(el);
      expect(el.hasAttribute("data-reveal")).toBe(false);
      expect(el.style.opacity).toBe("1");
    } finally {
      window.IntersectionObserver = saved;
    }
  });
});

describe("animateIn — reacting to the reduced-motion preference", () => {
  it("stays a complete no-op when the preference is already on", () => {
    reduced = true;
    const el = element();
    animateIn(el);
    expect(el.hasAttribute("data-reveal")).toBe(false);
    expect(el.style.opacity).toBe("");
    expect(FakeIntersectionObserver.instances).toHaveLength(0);
  });

  it("clears a server-rendered marker when the preference is already on", () => {
    reduced = true;
    const el = element();
    el.setAttribute("data-reveal", "");
    animateIn(el);
    expect(el.hasAttribute("data-reveal")).toBe(false);
    expect(el.style.opacity).toBe("1");
  });

  it("reveals a hidden element when the preference is switched on mid-session", () => {
    const el = element();
    animateIn(el);
    expect(el.style.opacity).toBe("0");

    turnReduceOn();

    // The only safe direction: show it. Re-hiding would strand the content at
    // opacity 0 with the observer already disconnected.
    expect(el.style.opacity).toBe("1");
    expect(el.hasAttribute("data-reveal")).toBe(false);
    expect(FakeIntersectionObserver.instances[0]!.disconnected).toBe(true);
  });

  it("stops reacting once the action is destroyed", () => {
    const el = element();
    const handle = animateIn(el);
    handle.destroy();

    turnReduceOn();

    // A destroyed action must not write to a node Svelte has moved on from.
    // (The matchMedia listener itself is the store's and stays put — that is
    // the whole point of there being one.)
    expect(el.style.opacity).toBe("0");
  });
});
