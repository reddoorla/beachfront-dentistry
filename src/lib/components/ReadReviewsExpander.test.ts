import { describe, it, expect } from "vitest";
import { render, fireEvent } from "@testing-library/svelte";
import ReadReviewsExpander from "./ReadReviewsExpander.svelte";

// Queries are container-scoped: testing-library/svelte binds getByRole to
// document.body and instances persist across tests (no auto-cleanup), so
// body-level role queries see stale duplicates.
describe("ReadReviewsExpander", () => {
  it("mounts collapsed: button not expanded, socials row inert", () => {
    const { container } = render(ReadReviewsExpander);
    const button = container.querySelector("button")!;
    expect(button.getAttribute("aria-expanded")).toBe("false");
    const row = container.querySelector(
      `#${button.getAttribute("aria-controls")}`,
    ) as HTMLElement;
    expect(row.inert).toBe(true);
  });

  it("click discloses the three review destinations and toggles back", async () => {
    const { container } = render(ReadReviewsExpander);
    const button = container.querySelector("button")!;

    await fireEvent.click(button);
    expect(button.getAttribute("aria-expanded")).toBe("true");
    const row = container.querySelector(
      `#${button.getAttribute("aria-controls")}`,
    ) as HTMLElement;
    expect(row.inert).toBe(false);
    const links = [...row.querySelectorAll("a")];
    expect(links.map((a) => a.getAttribute("aria-label"))).toEqual([
      "Read our reviews on Google",
      "Read our reviews on Facebook",
      "Read our reviews on Yelp",
    ]);
    // External review links open in a new tab.
    expect(links.every((a) => a.target === "_blank")).toBe(true);

    await fireEvent.click(button);
    expect(button.getAttribute("aria-expanded")).toBe("false");
    expect(row.inert).toBe(true);
  });
});
