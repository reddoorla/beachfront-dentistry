import { describe, it, expect, beforeEach, vi } from "vitest";
import { fade, fly, slide } from "./transitions";

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

function element() {
  const el = document.createElement("div");
  document.body.appendChild(el);
  return el;
}

beforeEach(() => {
  mockMatchMedia(false);
});

describe("motion-aware transitions — normal motion", () => {
  it("passes params through to the underlying transition", () => {
    const config = fade(element(), { duration: 350, delay: 40 });
    expect(config.duration).toBe(350);
    expect(config.delay).toBe(40);
  });

  it("keeps svelte's defaults when no params are given", () => {
    const config = fade(element());
    expect(config.duration).toBe(400); // svelte/transition fade default
  });

  it("fly and slide behave the same", () => {
    expect(fly(element(), { duration: 500 }).duration).toBe(500);
    expect(slide(element(), { duration: 500 }).duration).toBe(500);
  });
});

describe("motion-aware transitions — prefers-reduced-motion", () => {
  beforeEach(() => {
    mockMatchMedia(true);
  });

  it("collapses fade duration and delay to zero", () => {
    const config = fade(element(), { duration: 700, delay: 200 });
    expect(config.duration).toBe(0);
    expect(config.delay).toBe(0);
  });

  it("collapses fly duration and delay to zero", () => {
    const config = fly(element(), { duration: 700, delay: 200, y: 40 });
    expect(config.duration).toBe(0);
    expect(config.delay).toBe(0);
  });

  it("collapses slide duration and delay to zero", () => {
    const config = slide(element(), { duration: 700, delay: 200 });
    expect(config.duration).toBe(0);
    expect(config.delay).toBe(0);
  });

  // Zero duration alone is not enough. Svelte samples a config's `css` at t=0
  // and commits that frame even when the transition is zero-length, so a
  // reduced-motion `fly({ y: 22 })` used to paint its full offset for one
  // frame before snapping back — visible motion for someone who asked for
  // none, and a wrong answer for anything measuring layout in that frame (it
  // inflated the nav overlay's scrollHeight by exactly the fly distance).
  // Returning a config with NO style hooks is what makes "instant" literal.
  it("applies no styles at all — nothing for Svelte to paint, not even at t=0", () => {
    for (const config of [
      fade(element(), { duration: 700 }),
      fly(element(), { duration: 700, y: 22 }),
      slide(element(), { duration: 700 }),
    ]) {
      expect(config.css).toBeUndefined();
      expect(config.tick).toBeUndefined();
    }
  });
});

describe("motion-aware transitions — environment guards", () => {
  it("does not crash when matchMedia is unavailable", () => {
    // @ts-expect-error — simulating an environment without matchMedia
    delete window.matchMedia;
    const config = fade(element(), { duration: 250 });
    expect(config.duration).toBe(250);
  });
});
