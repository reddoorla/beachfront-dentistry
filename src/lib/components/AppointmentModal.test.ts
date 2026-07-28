import { render, screen, cleanup } from "@testing-library/svelte";
import { get } from "svelte/store";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import AppointmentModal from "./AppointmentModal.svelte";
import { appointmentOpen } from "$lib/stores/appointment";

afterEach(() => cleanup());

describe("AppointmentModal", () => {
  beforeEach(() => appointmentOpen.set(false));

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

  it("closes on Escape", async () => {
    render(AppointmentModal);
    appointmentOpen.set(true);
    await screen.findByRole("dialog");
    await new Promise((r) => setTimeout(r));
    window.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );
    expect(get(appointmentOpen)).toBe(false);
  });
});
