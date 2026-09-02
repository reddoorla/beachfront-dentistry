import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { reducedMotion, prefersReducedMotion } from "./transitions";

// The preference used to be read five different ways — a per-run check here, a
// live listener in Slider, and a once-at-mount sample in animateIn, floatAlong
// (since deleted) and ScreenWidthMedia. Toggling Reduce Motion mid-session updated some of
// them and left the rest on the old setting until a reload. This store is the
// single reading; these tests hold it to being both live and cheap.

type Listener = (event: MediaQueryListEvent) => void;

let listeners: Listener[] = [];
let created = 0;
let matches = false;

function installMatchMedia() {
  listeners = [];
  created = 0;
  window.matchMedia = vi.fn().mockImplementation((query: string) => {
    created += 1;
    return {
      get matches() {
        return query === "(prefers-reduced-motion: reduce)" ? matches : false;
      },
      media: query,
      addEventListener: (_: string, fn: Listener) => listeners.push(fn),
      removeEventListener: (_: string, fn: Listener) => {
        listeners = listeners.filter((l) => l !== fn);
      },
      addListener: () => {},
      removeListener: () => {},
      onchange: null,
      dispatchEvent: () => false,
    } as unknown as MediaQueryList;
  });
}

const flip = (value: boolean) => {
  matches = value;
  for (const fn of [...listeners])
    fn({ matches: value } as MediaQueryListEvent);
};

beforeEach(() => {
  matches = false;
  installMatchMedia();
});

afterEach(() => {
  matches = false;
});

describe("reducedMotion store", () => {
  it("emits the current preference to a new subscriber", () => {
    const seen: boolean[] = [];
    const stop = reducedMotion.subscribe((v) => seen.push(v));
    expect(seen).toEqual([false]);
    stop();
  });

  it("pushes a mid-session change to every subscriber", () => {
    const a: boolean[] = [];
    const b: boolean[] = [];
    const stopA = reducedMotion.subscribe((v) => a.push(v));
    const stopB = reducedMotion.subscribe((v) => b.push(v));

    flip(true);

    expect(a).toEqual([false, true]);
    expect(b).toEqual([false, true]);
    stopA();
    stopB();
  });

  it("stops delivering after unsubscribe", () => {
    const seen: boolean[] = [];
    const stop = reducedMotion.subscribe((v) => seen.push(v));
    stop();
    flip(true);
    expect(seen).toEqual([false]);
  });

  it("survives a subscriber that unsubscribes itself while being notified", () => {
    // animateIn does exactly this: the first `true` tears the action down.
    const seen: boolean[] = [];
    const other: boolean[] = [];
    let stopSelf = () => {};
    stopSelf = reducedMotion.subscribe((v) => {
      seen.push(v);
      if (v) stopSelf();
    });
    const stopOther = reducedMotion.subscribe((v) => other.push(v));

    flip(true);

    expect(seen).toEqual([false, true]);
    expect(other).toEqual([false, true]);
    stopOther();
  });

  it("keeps ONE change listener however many subscribers there are", () => {
    const stops = [1, 2, 3, 4].map(() => reducedMotion.subscribe(() => {}));
    // The point of the store: one listener for the app, not one per consumer.
    // (`created` counts MediaQueryList objects, and `prefersReducedMotion()`
    // deliberately asks for a fresh one on every call, so it is not the
    // invariant here — the listener is.)
    expect(listeners).toHaveLength(1);
    expect(created).toBeGreaterThan(0);
    stops.forEach((s) => s());
  });

  it("emits false and never throws where there is no matchMedia", () => {
    const original = window.matchMedia;
    // @ts-expect-error — simulating an environment without matchMedia
    delete window.matchMedia;
    try {
      const seen: boolean[] = [];
      const stop = reducedMotion.subscribe((v) => seen.push(v));
      expect(seen).toEqual([false]);
      expect(prefersReducedMotion()).toBe(false);
      stop();
    } finally {
      window.matchMedia = original;
    }
  });

  it("re-reads the preference per call in prefersReducedMotion()", () => {
    expect(prefersReducedMotion()).toBe(false);
    matches = true;
    expect(prefersReducedMotion()).toBe(true);
  });
});
