import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, fireEvent, cleanup, act } from "@testing-library/svelte";
import { createRawSnippet } from "svelte";
import Modal from "./Modal.svelte";

afterEach(() => cleanup());

const body = () =>
  createRawSnippet(() => ({
    render: () => "<p>Modal body</p>",
  }));

beforeEach(() => {
  // jsdom < v26 polyfill: ensure showModal/close exist
  if (!HTMLDialogElement.prototype.showModal) {
    HTMLDialogElement.prototype.showModal = function () {
      this.setAttribute("open", "");
    };
    HTMLDialogElement.prototype.close = function () {
      this.removeAttribute("open");
      this.dispatchEvent(new Event("close"));
    };
  }
});

describe("Modal", () => {
  it("renders children when open", () => {
    const { getByText } = render(Modal, { open: true, children: body() });
    expect(getByText("Modal body")).toBeTruthy();
  });

  it("calls onclose when close button is clicked", async () => {
    const onclose = vi.fn();
    const { getByLabelText } = render(Modal, {
      open: true,
      onclose,
      children: body(),
    });

    await fireEvent.click(getByLabelText("Close"));
    expect(onclose).toHaveBeenCalled();
  });

  it("closes on backdrop click (click on dialog itself, not children)", async () => {
    const onclose = vi.fn();
    const { container } = render(Modal, {
      open: true,
      onclose,
      children: body(),
    });

    const dialog = container.querySelector("dialog")!;
    await fireEvent.click(dialog);
    expect(onclose).toHaveBeenCalled();
  });

  it("does not close when clicking the inner content", async () => {
    const onclose = vi.fn();
    const { getByText } = render(Modal, {
      open: true,
      onclose,
      children: body(),
    });

    await fireEvent.click(getByText("Modal body"));
    expect(onclose).not.toHaveBeenCalled();
  });

  it("applies ariaLabel to the dialog (and omits the attribute without one)", () => {
    const { container, unmount } = render(Modal, {
      open: true,
      ariaLabel: "Request an appointment",
      children: body(),
    });
    expect(container.querySelector("dialog")?.getAttribute("aria-label")).toBe(
      "Request an appointment",
    );
    unmount();

    const bare = render(Modal, { open: true, children: body() });
    expect(
      bare.container.querySelector("dialog")?.hasAttribute("aria-label"),
    ).toBe(false);
  });

  it("closes on Escape (native cancel → close event path)", async () => {
    const onclose = vi.fn();
    const { container } = render(Modal, {
      open: true,
      onclose,
      children: body(),
    });
    const dialog = container.querySelector("dialog")!;

    // Neither jsdom's native <dialog> nor the polyfill simulates the UA's
    // Escape handling, so replay the spec sequence a browser performs: a
    // cancelable `cancel` event, then close() when it wasn't prevented.
    const cancel = new Event("cancel", { cancelable: true });
    dialog.dispatchEvent(cancel);
    if (!cancel.defaultPrevented) await act(() => dialog.close());

    // onclose fired AND the dialog stayed shut — proving the `close` event
    // handler synced `open` back to false (a stale true would make the
    // component's $effect immediately re-showModal it).
    expect(onclose).toHaveBeenCalled();
    expect(dialog.open).toBe(false);
  });
});
