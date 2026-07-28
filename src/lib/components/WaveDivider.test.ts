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

  it("flips when flip is set", () => {
    const { container } = render(WaveDivider, { props: { flip: true } });
    expect(container.querySelector(".rotate-180")).not.toBeNull();
  });

  it("does not flip by default", () => {
    const { container } = render(WaveDivider);
    expect(container.querySelector(".rotate-180")).toBeNull();
  });
});
