import { render, cleanup } from "@testing-library/svelte";
import { tick } from "svelte";
import { afterEach, describe, expect, it } from "vitest";
import MapEmbed from "./MapEmbed.svelte";

// The map is a tab stop whose focus indicator has to be drawn from outside the
// frame: tabbing in moves the focused area into a cross-origin document, so
// `:focus-visible` cannot match and (measured in Chromium, headless and
// headed) neither can the wrapper's `:focus-within` — the iframe is
// `document.activeElement` but does not match `:focus`. What the host document
// does get is a window `blur` with `activeElement` already pointing at the
// iframe. These tests hold that wiring, including standing back down.

afterEach(() => cleanup());

const wrapper = (c: HTMLElement) =>
  c.querySelector("iframe")!.parentElement as HTMLElement;

/** The exact token, not a substring — `focus-within:ring-2` and `ring-offset-2`
 *  are always on the wrapper and both contain "ring-2". */
const ringed = (c: HTMLElement) => wrapper(c).classList.contains("ring-2");

describe("MapEmbed focus indicator", () => {
  it("has no ring while focus is elsewhere", () => {
    const { container } = render(MapEmbed);
    expect(ringed(container)).toBe(false);
  });

  it("rings the wrapper when focus crosses into the frame", async () => {
    const { container } = render(MapEmbed);
    const frame = container.querySelector("iframe")!;

    frame.focus();
    window.dispatchEvent(new Event("blur"));
    await tick();

    expect(document.activeElement).toBe(frame);
    expect(ringed(container)).toBe(true);
    expect(wrapper(container).getAttribute("data-map-focus")).toBe("true");
  });

  it("drops the ring when focus lands back in this document", async () => {
    const { container } = render(MapEmbed);
    const frame = container.querySelector("iframe")!;
    frame.focus();
    window.dispatchEvent(new Event("blur"));
    await tick();

    const elsewhere = document.createElement("button");
    document.body.appendChild(elsewhere);
    elsewhere.focus();
    document.dispatchEvent(new Event("focusin"));
    await tick();

    expect(ringed(container)).toBe(false);
    expect(wrapper(container).getAttribute("data-map-focus")).toBeNull();
    elsewhere.remove();
  });

  it("ignores a window blur that is the browser losing focus, not the map", async () => {
    const { container } = render(MapEmbed);
    const elsewhere = document.createElement("button");
    document.body.appendChild(elsewhere);
    elsewhere.focus();

    // Switching apps blurs the window while focus stays on a normal element.
    window.dispatchEvent(new Event("blur"));
    await tick();

    expect(ringed(container)).toBe(false);
    elsewhere.remove();
  });
});
