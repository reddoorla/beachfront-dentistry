import { describe, expect, it, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/svelte";
import Hero from "./index.svelte";
import type { Presentation } from "$lib/blux/presentation";

afterEach(() => cleanup());

const presentation: Presentation = {
  bands: {
    "7": {
      style: { "min-height": "80vh" },
      background: { kind: "image", url: "https://cdn/hero-bg.jpg" },
      text: { headingRole: "text5", headingLevel: 2, subtitleRole: "text12" },
    },
  },
};

describe("Hero band variation", () => {
  it("renders overlay heading/subtitle over the manifest background", () => {
    const slice = {
      slice_type: "hero",
      variation: "band",
      primary: { band: 7, heading: "the outdoors", subtitle: "fresh air" },
      items: [],
    } as never;
    const { container, getByText } = render(Hero, {
      props: { slice, context: { presentation } },
    });
    // Display line (subtitle) is the visual <h2>; the heading is the eyebrow.
    expect(container.querySelector("h2")?.textContent).toBe("fresh air");
    expect(getByText("the outdoors")).toBeDefined();
    expect(container.querySelector("img")?.getAttribute("src")).toBe(
      "https://cdn/hero-bg.jpg",
    );
  });

  it("tolerates an absent presentation (unconverted site)", () => {
    const slice = {
      slice_type: "hero",
      variation: "band",
      primary: { band: 7, heading: "the outdoors", subtitle: "fresh air" },
      items: [],
    } as never;
    const { container } = render(Hero, {
      props: { slice, context: {} },
    });
    // No band entry resolvable — still renders the text.
    expect(container.querySelector("h2")?.textContent).toBe("fresh air");
    expect(container.querySelector("img")).toBeNull();
  });
});
