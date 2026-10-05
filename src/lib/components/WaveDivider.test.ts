import { render } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";
import WaveDivider from "./WaveDivider.svelte";

describe("WaveDivider", () => {
  it("renders a decorative svg (hidden from AT)", () => {
    const { container } = render(WaveDivider, { props: { fill: "#ffffff" } });
    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg?.closest("[aria-hidden='true']")).not.toBeNull();
    expect(container.querySelector("path")?.getAttribute("fill")).toBe(
      "#ffffff",
    );
  });

  it("flip renders differently from the default", () => {
    const markup = (props: { flip?: boolean }) =>
      render(WaveDivider, { props }).container.innerHTML;
    expect(markup({ flip: true })).not.toBe(markup({}));
  });
});
