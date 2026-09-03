import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { render, fireEvent, cleanup } from "@testing-library/svelte";
import { createRawSnippet, tick } from "svelte";
import Slider from "./Slider.svelte";

type MediaListener = (e: { matches: boolean }) => void;

let reducedMotion = false;
const mediaListeners = new Set<MediaListener>();

beforeEach(() => {
  reducedMotion = false;
  mediaListeners.clear();
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query.includes("prefers-reduced-motion") ? reducedMotion : false,
    media: query,
    addEventListener: (_: string, cb: MediaListener) => mediaListeners.add(cb),
    removeEventListener: (_: string, cb: MediaListener) =>
      mediaListeners.delete(cb),
  }));
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const children = createRawSnippet<[{ index: number }]>((args) => ({
  render: () => `<span>Item ${args().index + 1}</span>`,
}));

const renderSlider = (props: Record<string, unknown> = {}) =>
  render(Slider, {
    itemCount: 4,
    label: "Test slides",
    children,
    ...props,
  });

/** All slides, including the ones hidden from assistive tech. */
const allSlides = (getAllByRole: ReturnType<typeof render>["getAllByRole"]) =>
  getAllByRole("group", { hidden: true }) as HTMLElement[];

// jsdom has no inert support, so Svelte sets the DOM property (an expando
// here; reflected to the attribute in real browsers). Assert the property.
const isInert = (el: HTMLElement) => el.inert === true;

const activeDot = (container: HTMLElement) =>
  container.querySelector<HTMLButtonElement>('[aria-current="true"]');

describe("Slider semantics", () => {
  it("exposes a labelled carousel region with one slide group per item", () => {
    const { getByRole, getAllByRole } = renderSlider();
    const region = getByRole("region");
    expect(region.getAttribute("aria-roledescription")).toBe("carousel");
    expect(region.getAttribute("aria-label")).toBe("Test slides");

    const slides = allSlides(getAllByRole);
    expect(slides.length).toBe(4);
    expect(slides[0].getAttribute("aria-roledescription")).toBe("slide");
    expect(slides[0].getAttribute("aria-label")).toBe("1 of 4");
    expect(slides[3].getAttribute("aria-label")).toBe("4 of 4");
  });

  it("hides out-of-view slides from assistive tech and focus", async () => {
    const { getAllByRole, getByLabelText } = renderSlider();
    const slides = allSlides(getAllByRole);

    expect(slides[0].getAttribute("aria-hidden")).toBeNull();
    expect(isInert(slides[0])).toBe(false);
    expect(slides[1].getAttribute("aria-hidden")).toBe("true");
    expect(isInert(slides[1])).toBe(true);

    await fireEvent.click(getByLabelText("Next slide"));

    expect(slides[0].getAttribute("aria-hidden")).toBe("true");
    expect(isInert(slides[0])).toBe(true);
    expect(slides[1].getAttribute("aria-hidden")).toBeNull();
    expect(isInert(slides[1])).toBe(false);
  });

  it("announces the position politely when idle", () => {
    const { container } = renderSlider();
    const status = container.querySelector('[aria-live="polite"]');
    expect(status?.textContent).toContain("Slide 1 of 4");
  });

  it("announces a range when several cards are in view", () => {
    const { container } = renderSlider({ cardsPerView: 2 });
    const status = container.querySelector('[aria-live="polite"]');
    expect(status?.textContent?.replace(/\s+/g, " ")).toContain(
      "Slides 1 through 2 of 4",
    );
  });
});

describe("Slider navigation", () => {
  it("advances with next, retreats with prev, and wraps by default", async () => {
    const { container, getByLabelText } = renderSlider({ itemCount: 3 });
    const next = getByLabelText("Next slide");

    await fireEvent.click(next);
    expect(activeDot(container)?.getAttribute("aria-label")).toBe(
      "Go to slide 2",
    );

    await fireEvent.click(next);
    await fireEvent.click(next); // past the end — wraps home
    expect(activeDot(container)?.getAttribute("aria-label")).toBe(
      "Go to slide 1",
    );

    await fireEvent.click(getByLabelText("Previous slide")); // wraps back
    expect(activeDot(container)?.getAttribute("aria-label")).toBe(
      "Go to slide 3",
    );
  });

  it("marks the arrows aria-disabled at the bounds when loop is off", async () => {
    // aria-disabled instead of disabled: the bound arrow keeps keyboard
    // focus instead of dumping it to <body>, and activating it is a no-op.
    const { container, getByLabelText } = renderSlider({
      itemCount: 3,
      loop: false,
    });
    const prev = getByLabelText("Previous slide") as HTMLButtonElement;
    const next = getByLabelText("Next slide") as HTMLButtonElement;

    expect(prev.getAttribute("aria-disabled")).toBe("true");
    expect(prev.disabled).toBe(false);
    await fireEvent.click(prev); // no-op at the start bound
    expect(activeDot(container)?.getAttribute("aria-label")).toBe(
      "Go to slide 1",
    );

    await fireEvent.click(next);
    expect(prev.getAttribute("aria-disabled")).toBeNull();
    expect(next.getAttribute("aria-disabled")).toBeNull();

    await fireEvent.click(next);
    expect(next.getAttribute("aria-disabled")).toBe("true");
    await fireEvent.click(next); // no-op at the end bound
    expect(activeDot(container)?.getAttribute("aria-label")).toBe(
      "Go to slide 3",
    );
  });

  it("jumps directly via the dots", async () => {
    const { container, getByLabelText } = renderSlider();
    await fireEvent.click(getByLabelText("Go to slide 3"));
    expect(activeDot(container)?.getAttribute("aria-label")).toBe(
      "Go to slide 3",
    );
  });

  it("supports arrow keys on the controls", async () => {
    const { container, getByLabelText } = renderSlider();
    const next = getByLabelText("Next slide");

    await fireEvent.keyDown(next, { key: "ArrowRight" });
    expect(activeDot(container)?.getAttribute("aria-label")).toBe(
      "Go to slide 2",
    );

    await fireEvent.keyDown(next, { key: "ArrowLeft" });
    expect(activeDot(container)?.getAttribute("aria-label")).toBe(
      "Go to slide 1",
    );
  });

  it("renders no controls when everything already fits", () => {
    const { queryByLabelText } = renderSlider({ itemCount: 1 });
    expect(queryByLabelText("Next slide")).toBeNull();
    expect(queryByLabelText("Previous slide")).toBeNull();
    expect(queryByLabelText("Go to slide 1")).toBeNull();
  });

  it("keeps the dots when arrows are hidden, even with showDots off", () => {
    // A carousel must keep a non-swipe control: dots are forced on
    // whenever the arrows are absent.
    const { getByLabelText, queryByLabelText } = renderSlider({
      showArrows: false,
      showDots: false,
    });
    expect(queryByLabelText("Next slide")).toBeNull();
    expect(getByLabelText("Go to slide 2")).toBeTruthy();
  });

  it("counts positions, not items, with multiple cards per view", () => {
    // 4 items, 2 per view (jsdom viewport is desktop-width) → 3 positions.
    const { getByLabelText, queryByLabelText } = renderSlider({
      cardsPerView: 2,
    });
    expect(getByLabelText("Go to slide 3")).toBeTruthy();
    expect(queryByLabelText("Go to slide 4")).toBeNull();
  });
});

describe("Slider fade mode", () => {
  it("stacks slides and exposes only the active one", async () => {
    const { getAllByRole, getByLabelText } = renderSlider({ mode: "fade" });
    const slides = allSlides(getAllByRole);

    expect(isInert(slides[0])).toBe(false);
    expect(isInert(slides[1])).toBe(true);
    expect(slides[1].className).toContain("opacity-0");

    await fireEvent.click(getByLabelText("Next slide"));
    expect(isInert(slides[0])).toBe(true);
    expect(isInert(slides[1])).toBe(false);
  });

  it("ignores cardsPerView — fade is one slide at a time", () => {
    const { getByLabelText } = renderSlider({ mode: "fade", cardsPerView: 3 });
    // 4 items, 1 per view → 4 dot positions, not 2.
    expect(getByLabelText("Go to slide 4")).toBeTruthy();
  });
});

describe("Slider autoplay", () => {
  const advance = async (ms: number) => {
    await vi.advanceTimersByTimeAsync(ms);
    await tick();
  };

  it("advances on the interval and wraps at the end", async () => {
    vi.useFakeTimers();
    const { container } = renderSlider({ itemCount: 3, autoplay: 1000 });

    await advance(1000);
    expect(activeDot(container)?.getAttribute("aria-label")).toBe(
      "Go to slide 2",
    );

    await advance(2000);
    expect(activeDot(container)?.getAttribute("aria-label")).toBe(
      "Go to slide 1",
    );
  });

  it("clears its interval on unmount", async () => {
    vi.useFakeTimers();
    const clearSpy = vi.spyOn(globalThis, "clearInterval");
    const { unmount } = renderSlider({ autoplay: 1000 });

    unmount();
    expect(clearSpy).toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
    clearSpy.mockRestore();
  });

  it("restarts the full delay after manual navigation", async () => {
    // Models swipe-style nav: jsdom clicks don't move focus, so the sticky
    // focus pause doesn't engage — same as a real touch swipe.
    vi.useFakeTimers();
    const { container, getByLabelText } = renderSlider({ autoplay: 1000 });

    await advance(600);
    await fireEvent.click(getByLabelText("Next slide")); // now on 2
    await advance(999); // old tick would have fired at 1000
    expect(activeDot(container)?.getAttribute("aria-label")).toBe(
      "Go to slide 2",
    );
    await advance(1);
    expect(activeDot(container)?.getAttribute("aria-label")).toBe(
      "Go to slide 3",
    );
  });

  it("pauses while hovered and resumes on leave", async () => {
    vi.useFakeTimers();
    const { container, getByRole } = renderSlider({ autoplay: 1000 });
    const region = getByRole("region");

    await fireEvent(region, new Event("pointerenter"));
    await advance(3000);
    expect(activeDot(container)?.getAttribute("aria-label")).toBe(
      "Go to slide 1",
    );

    await fireEvent(region, new Event("pointerleave"));
    await advance(1000);
    expect(activeDot(container)?.getAttribute("aria-label")).toBe(
      "Go to slide 2",
    );
  });

  it("focus stops rotation for good — only the play control resumes it (APG)", async () => {
    vi.useFakeTimers();
    const { container, getByRole, getByLabelText } = renderSlider({
      autoplay: 1000,
    });
    const region = getByRole("region");

    await fireEvent(region, new FocusEvent("focusin", { bubbles: true }));
    await advance(3000);
    expect(activeDot(container)?.getAttribute("aria-label")).toBe(
      "Go to slide 1",
    );

    // Leaving does NOT resume — the pause is sticky, not focus-tracked.
    await fireEvent(
      region,
      new FocusEvent("focusout", { bubbles: true, relatedTarget: null }),
    );
    await advance(3000);
    expect(activeDot(container)?.getAttribute("aria-label")).toBe(
      "Go to slide 1",
    );

    await fireEvent.click(getByLabelText("Play slides"));
    await advance(1000);
    expect(activeDot(container)?.getAttribute("aria-label")).toBe(
      "Go to slide 2",
    );
  });

  it("offers a pause control that stops rotation until played again", async () => {
    vi.useFakeTimers();
    const { container, getByLabelText } = renderSlider({ autoplay: 1000 });

    await fireEvent.click(getByLabelText("Pause slides"));
    await advance(3000);
    expect(activeDot(container)?.getAttribute("aria-label")).toBe(
      "Go to slide 1",
    );

    await fireEvent.click(getByLabelText("Play slides"));
    await advance(1000);
    expect(activeDot(container)?.getAttribute("aria-label")).toBe(
      "Go to slide 2",
    );
  });

  it("mutes the live region while rotating, politely announces when paused", async () => {
    vi.useFakeTimers();
    const { container, getByLabelText } = renderSlider({ autoplay: 1000 });

    expect(container.querySelector('[aria-live="off"]')).toBeTruthy();
    await fireEvent.click(getByLabelText("Pause slides"));
    expect(container.querySelector('[aria-live="polite"]')).toBeTruthy();
  });

  it("never rotates under prefers-reduced-motion — and drops the dead pause button", async () => {
    vi.useFakeTimers();
    reducedMotion = true;
    const { container, queryByLabelText } = renderSlider({ autoplay: 1000 });

    await advance(5000);
    expect(activeDot(container)?.getAttribute("aria-label")).toBe(
      "Go to slide 1",
    );
    expect(queryByLabelText("Pause slides")).toBeNull();
  });

  it("parks at the last position instead of wrapping when loop is off", async () => {
    vi.useFakeTimers();
    const { container, getByLabelText } = renderSlider({
      itemCount: 3,
      autoplay: 1000,
      loop: false,
    });

    await advance(5000);
    expect(activeDot(container)?.getAttribute("aria-label")).toBe(
      "Go to slide 3",
    );
    const next = getByLabelText("Next slide") as HTMLButtonElement;
    expect(next.getAttribute("aria-disabled")).toBe("true");
  });

  it("stops rotating when the tab is hidden", async () => {
    vi.useFakeTimers();
    const { container } = renderSlider({ autoplay: 1000 });

    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => "hidden",
    });
    document.dispatchEvent(new Event("visibilitychange"));
    await advance(3000);
    expect(activeDot(container)?.getAttribute("aria-label")).toBe(
      "Go to slide 1",
    );

    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => "visible",
    });
    document.dispatchEvent(new Event("visibilitychange"));
    await advance(1000);
    expect(activeDot(container)?.getAttribute("aria-label")).toBe(
      "Go to slide 2",
    );
  });
});

describe("Slider infinite mode", () => {
  // Tucker, 2026-09-02: "transitioning to infinite scroll after the first
  // click (in either direction)". The track renders the items three times,
  // rests on the middle copy, and every move is one step in the pressed
  // direction; an invisible snap re-bases the index into the middle copy
  // before the NEXT move, so there is never a visible rewind. Spec:
  // docs/superpowers/specs/2026-09-02-team-slider-infinite-loop-and-name-design.md
  const track = (container: HTMLElement) =>
    container.querySelector<HTMLElement>('[style*="transform"]')!;
  const indexOf = (container: HTMLElement) =>
    Number(/calc\((\d+) \*/.exec(track(container).style.transform)?.[1]);
  const settle = async () => {
    await tick();
    await tick();
  };

  it("rests as a plain track and engages three copies on the first move", async () => {
    const { container, getAllByRole, getByLabelText } = renderSlider({
      infinite: true,
    });
    await settle();
    expect(allSlides(getAllByRole)).toHaveLength(4);
    expect(indexOf(container)).toBe(0);
    expect(activeDot(container)?.getAttribute("aria-label")).toBe(
      "Go to slide 1",
    );

    await fireEvent.click(getByLabelText("Next slide"));
    await settle();
    const slides = allSlides(getAllByRole);
    expect(slides).toHaveLength(12);
    expect(slides[0].getAttribute("aria-label")).toBe("1 of 4");
    expect(slides[4].getAttribute("aria-label")).toBe("1 of 4");
    expect(slides[11].getAttribute("aria-label")).toBe("4 of 4");
    // 0 → engaged at 4 (same pixels) → stepped to 5: the second item leads.
    expect(indexOf(container)).toBe(5);
    expect(activeDot(container)?.getAttribute("aria-label")).toBe(
      "Go to slide 2",
    );
    expect(isInert(slides[5])).toBe(false);
    expect(isInert(slides[1])).toBe(true);
    expect(isInert(slides[4])).toBe(true);
  });

  it("marks a cell created outside the on-screen window as offscreen, for life", async () => {
    // Tucker, 2026-09-02: "double the length of the transition in for items
    // that are initially hidden" — the card reads this mark to pick its
    // reveal. The mark is taken at the cell's creation and never changes,
    // so the originals keep theirs after moving copies, and every cell of
    // the two new copies is born offscreen.
    const marking = createRawSnippet<
      [{ index: number; clone?: boolean; offscreen?: boolean }]
    >((args) => ({
      render: () =>
        `<span data-offscreen="${args().offscreen}">Item ${args().index + 1}</span>`,
    }));
    const marks = (container: HTMLElement) =>
      Array.from(container.querySelectorAll("[data-offscreen]")).map((el) =>
        el.getAttribute("data-offscreen"),
      );
    const { container, getByLabelText } = renderSlider({
      infinite: true,
      cardsPerView: 2,
      children: marking,
    });
    await settle();
    expect(marks(container)).toEqual(["false", "false", "true", "true"]);
    await fireEvent.click(getByLabelText("Next slide"));
    await settle();
    expect(marks(container)).toEqual([
      ...["true", "true", "true", "true"],
      ...["false", "false", "true", "true"],
      ...["true", "true", "true", "true"],
    ]);
  });

  it("prev from rest goes ONE step back to the last item, not to maxSlide", async () => {
    const { container, getByLabelText } = renderSlider({ infinite: true });
    await settle();
    await fireEvent.click(getByLabelText("Previous slide"));
    await settle();
    expect(indexOf(container)).toBe(3);
    expect(activeDot(container)?.getAttribute("aria-label")).toBe(
      "Go to slide 4",
    );
  });

  it("next past the last item keeps going forward, then re-bases before the following move", async () => {
    const { container, getByLabelText } = renderSlider({ infinite: true });
    await settle();
    const next = getByLabelText("Next slide");
    for (let i = 0; i < 4; i++) {
      await fireEvent.click(next);
      await settle();
    }
    // 4 → 8: still moving forward into the third copy, never back to 0.
    expect(indexOf(container)).toBe(8);
    expect(activeDot(container)?.getAttribute("aria-label")).toBe(
      "Go to slide 1",
    );
    // The fifth move snaps 8 → 4 invisibly, then steps to 5.
    await fireEvent.click(next);
    await settle();
    expect(indexOf(container)).toBe(5);
    expect(activeDot(container)?.getAttribute("aria-label")).toBe(
      "Go to slide 2",
    );
  });

  it("never marks an arrow disabled and offers a dot per item", () => {
    const { getByLabelText, queryByLabelText } = renderSlider({
      infinite: true,
    });
    expect(
      getByLabelText("Previous slide").getAttribute("aria-disabled"),
    ).toBeNull();
    expect(
      getByLabelText("Next slide").getAttribute("aria-disabled"),
    ).toBeNull();
    // 4 items, 1 per view: every item can be the leftmost card.
    expect(getByLabelText("Go to slide 4")).toBeTruthy();
    expect(queryByLabelText("Go to slide 5")).toBeNull();
  });

  it("dots target the middle copy", async () => {
    const { container, getByLabelText } = renderSlider({ infinite: true });
    await settle();
    await fireEvent.click(getByLabelText("Go to slide 3"));
    await settle();
    expect(indexOf(container)).toBe(6);
    expect(activeDot(container)?.getAttribute("aria-label")).toBe(
      "Go to slide 3",
    );
  });

  it("is a no-op when everything already fits", () => {
    const { getAllByRole, queryByLabelText } = renderSlider({
      itemCount: 1,
      infinite: true,
    });
    expect(allSlides(getAllByRole)).toHaveLength(1);
    expect(queryByLabelText("Next slide")).toBeNull();
  });
});
