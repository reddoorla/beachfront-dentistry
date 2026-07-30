import { render, cleanup } from "@testing-library/svelte";
import { afterEach, describe, expect, it } from "vitest";
import type { Content } from "@prismicio/client";
import Hero from "./index.svelte";

// render() queries default to document.body, so without cleanup between
// tests, renders from earlier `it`s in this file accumulate and later
// getByRole/getByText queries match multiple elements (same reason
// HeroBand.test.ts cleans up between its two tests).
afterEach(() => cleanup());

// The `cta` variation is not in the generated prismic types yet (same
// situation as the `band` variation) — widen the union locally by casting
// through `unknown`, matching Hero.test.ts's convention for `default`.
const slice = {
  slice_type: "hero",
  variation: "cta",
  primary: {
    heading: [
      {
        type: "heading2",
        text: "Ready for great dental health?",
        spans: [],
      },
    ],
    body: [
      {
        type: "paragraph",
        text: "Book your visit with our Redondo Beach team today.",
        spans: [],
      },
    ],
    background_image: {
      url: "https://img.example/beach.jpg",
      alt: "Beachfront office exterior",
      dimensions: { width: 1600, height: 900 },
    },
    cta_label: "Book an Appointment",
    cta_link: { link_type: "Web", url: "#appointment" },
  },
  items: [],
} as unknown as Content.HeroSlice;

describe("Hero cta variation", () => {
  it("renders the band with the cta variation attribute", () => {
    const { container } = render(Hero, { props: { slice } });
    const section = container.querySelector("[data-slice-type='hero']");
    expect(section?.getAttribute("data-slice-variation")).toBe("cta");
  });

  it("renders the heading text", () => {
    const { container } = render(Hero, { props: { slice } });
    expect(container.textContent).toContain("Ready for great dental health?");
  });

  it("renders the CTA anchor with an href the appointment-modal handler matches", () => {
    const { getByRole } = render(Hero, { props: { slice } });
    const link = getByRole("link", { name: "Book an Appointment" });
    expect(link.getAttribute("href")).toBe("#appointment");
  });

  it("renders no wave divider — the photo band seams straight (live), Footer owns the wave", () => {
    const { container } = render(Hero, { props: { slice } });
    // Live seams the white closing section straight into the FIJI photo (no
    // wave on either edge of the band), and the Footer that renders right after
    // carries the single pale wave at that boundary — so the cta band draws
    // none itself. A wave here would be an extra seam live doesn't have.
    const waveSvgs = container.querySelectorAll("[aria-hidden='true'] svg");
    expect(waveSvgs.length).toBe(0);
  });
});
