import { render, cleanup, act } from "@testing-library/svelte";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { appointmentOpen } from "$lib/stores/appointment";

// The appointment modal lives in the root layout, so whatever it mounts while
// CLOSED runs on every page for every visitor. The native <dialog> keeps its
// children in the DOM when closed, so before this guard the Turnstile widget
// loaded Cloudflare's api.js and ran a challenge on every page load nobody had
// asked to book from. In headless Chrome that challenge throws
// "TurnstileError 600010", the console error that held the fleet nightly's
// best-practices score at 96. The widget belongs to the open form only.
vi.mock("$app/forms", () => ({
  enhance: () => ({ destroy: () => {} }),
}));
vi.mock("$app/env/public", () => ({
  PUBLIC_TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
}));

const loadTurnstile = vi.hoisted(() => vi.fn());
vi.mock("$lib/turnstile", () => ({ loadTurnstile }));

const AppointmentModal = (await import("./AppointmentModal.svelte")).default;

afterEach(() => cleanup());

beforeEach(() => {
  appointmentOpen.set(false);
  loadTurnstile.mockReset();
  loadTurnstile.mockReturnValue(
    Promise.resolve({ render: () => "w1", remove: () => {} }),
  );
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

describe("AppointmentModal and Turnstile", () => {
  it("does not load Turnstile while the modal is closed", async () => {
    render(AppointmentModal);
    await act();
    expect(loadTurnstile).not.toHaveBeenCalled();
  });

  it("loads Turnstile once the modal opens", async () => {
    render(AppointmentModal);
    await act(() => appointmentOpen.set(true));
    expect(loadTurnstile).toHaveBeenCalledTimes(1);
  });

  it("keeps the widget mounted across close and reopen (no collapse mid-fade, no fresh challenge)", async () => {
    const { container } = render(AppointmentModal);
    await act(() => appointmentOpen.set(true));
    const mount = container.querySelector("form .cf-turnstile");
    expect(mount).not.toBeNull();
    await act(() => appointmentOpen.set(false));
    expect(mount!.isConnected).toBe(true);
    await act(() => appointmentOpen.set(true));
    expect(container.querySelector("form .cf-turnstile")).toBe(mount);
    expect(loadTurnstile).toHaveBeenCalledTimes(1);
  });

  it("starts loading api.js when a pointer or focus reaches an #appointment link, before any click", async () => {
    render(AppointmentModal);
    const cta = document.createElement("a");
    cta.href = "#appointment";
    cta.innerHTML = "<span>Make Appointment</span>";
    document.body.append(cta);
    try {
      await act();
      cta.firstElementChild!.dispatchEvent(
        new Event("pointerover", { bubbles: true }),
      );
      expect(loadTurnstile).toHaveBeenCalledTimes(1);
    } finally {
      cta.remove();
    }
  });

  it("does not warm on other links", async () => {
    render(AppointmentModal);
    const other = document.createElement("a");
    other.href = "/services";
    document.body.append(other);
    try {
      await act();
      other.dispatchEvent(new Event("focusin", { bubbles: true }));
      expect(loadTurnstile).not.toHaveBeenCalled();
    } finally {
      other.remove();
    }
  });
});
