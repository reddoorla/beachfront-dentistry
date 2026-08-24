import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/svelte";
import Analytics from "./Analytics.svelte";

afterEach(() => cleanup());

describe("Analytics", () => {
  it("renders no markup of its own", () => {
    const { container } = render(Analytics);
    expect(container.innerHTML).toBe("");
  });

  it("stays inert outside the production hostname (no loader, no gtag)", () => {
    // jsdom runs on localhost, which shouldLoadAnalytics rejects — the same
    // gate that keeps Netlify previews and the matching dev server silent.
    render(Analytics);
    expect(
      document.head.querySelector('script[src*="googletagmanager.com"]'),
    ).toBeNull();
    expect("gtag" in window).toBe(false);
    expect("dataLayer" in window).toBe(false);
  });
});
