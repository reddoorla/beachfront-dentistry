import { render, screen, cleanup, act } from "@testing-library/svelte";
import { get } from "svelte/store";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import AppointmentModal from "./AppointmentModal.svelte";
import { appointmentOpen } from "$lib/stores/appointment";

afterEach(() => cleanup());

beforeEach(() => {
  appointmentOpen.set(false);
  // jsdom < v26 polyfill (same guard as Modal.test.ts): ensure showModal/close
  // exist for the native <dialog> the Modal primitive renders through.
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

describe("AppointmentModal", () => {
  it("renders nothing while closed", () => {
    render(AppointmentModal);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("opens as a labelled dialog with the form posting to /contact-us", async () => {
    render(AppointmentModal);
    appointmentOpen.set(true);
    const dialog = await screen.findByRole("dialog");
    expect(dialog.getAttribute("aria-label")).toMatch(/appointment/i);
    expect(dialog.querySelector("form")?.getAttribute("action")).toBe(
      "/contact-us",
    );
  });

  it("closes on Escape (native dialog cancel → close path), syncing the store", async () => {
    render(AppointmentModal);
    appointmentOpen.set(true);
    const dialog = (await screen.findByRole("dialog")) as HTMLDialogElement;

    // jsdom's <dialog> doesn't simulate the UA's Escape handling, so replay
    // the spec sequence a browser performs on Escape: a cancelable `cancel`
    // event, then close() when it wasn't prevented (same path Modal.test.ts
    // covers on the primitive).
    const cancel = new Event("cancel", { cancelable: true });
    dialog.dispatchEvent(cancel);
    if (!cancel.defaultPrevented) await act(() => dialog.close());

    expect(get(appointmentOpen)).toBe(false);
  });
});
