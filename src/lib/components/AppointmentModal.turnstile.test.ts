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
});
