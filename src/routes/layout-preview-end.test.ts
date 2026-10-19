import { describe, it, expect, afterEach, vi } from "vitest";

vi.setConfig({ testTimeout: 60_000 });
import { render, cleanup } from "@testing-library/svelte";
import { createRawSnippet } from "svelte";
import { goto } from "$app/navigation";

vi.mock("$app/navigation", () => ({
  afterNavigate: vi.fn(),
  beforeNavigate: vi.fn(),
  goto: vi.fn(() => Promise.resolve()),
  refreshAll: vi.fn(() => Promise.resolve()),
}));
// The layout mounts the appointment modal, whose Turnstile widget reads the
// public env; no sitekey, so it renders nothing.
vi.mock("$app/env/public", () => ({ PUBLIC_TURNSTILE_SITE_KEY: undefined }));
vi.mock("$app/state", () => ({
  page: {
    data: {},
    url: new URL("https://example.com/"),
    params: {},
    status: 200,
  },
}));

// The root layout's server load also returns the shared photographs; none are
// needed to mount the preview component.
const siteImages = {
  ctaBeach: null,
  contactHero: null,
  serviceHero: null,
  teamMemberHero: null,
};

const page = createRawSnippet(() => ({ render: () => "<p>page</p>" }));

afterEach(() => {
  cleanup();
  vi.mocked(goto).mockClear();
});

function endPreview(path: string) {
  window.history.replaceState(null, "", path);
  window.dispatchEvent(
    new CustomEvent("prismicPreviewEnd", { cancelable: true }),
  );
}

describe("ending a Prismic preview on SvelteKit 3", () => {
  it("navigates with kit 3's options: reset false, never noScroll or keepFocus", async () => {
    const { default: Layout } = await import("./+layout.svelte");
    render(Layout, {
      data: { isPreviewSession: true, siteImages },
      children: page,
    });
    endPreview("/preview/about");

    expect(goto).toHaveBeenCalledTimes(1);
    const [url, opts] = vi.mocked(goto).mock.calls[0];
    expect(String(url)).toBe(`${window.location.origin}/about`);
    expect(opts).toMatchObject({ reset: false, refreshAll: true });
    expect(opts).not.toHaveProperty("noScroll");
    expect(opts).not.toHaveProperty("keepFocus");
  });

  it("strips a bare /preview to the home page", async () => {
    const { default: Layout } = await import("./+layout.svelte");
    render(Layout, {
      data: { isPreviewSession: true, siteImages },
      children: page,
    });
    endPreview("/preview");

    expect(String(vi.mocked(goto).mock.calls[0][0])).toBe(
      `${window.location.origin}/`,
    );
  });

  it("mounts nothing that listens when there is no preview session", async () => {
    const { default: Layout } = await import("./+layout.svelte");
    render(Layout, {
      data: { isPreviewSession: false, siteImages },
      children: page,
    });
    endPreview("/about");

    expect(goto).not.toHaveBeenCalled();
  });
});
