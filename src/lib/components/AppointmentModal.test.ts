import { render, screen, cleanup, act } from "@testing-library/svelte";
import { tick } from "svelte";
import { get } from "svelte/store";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { appointmentOpen } from "$lib/stores/appointment";

// `use:enhance` would run a real fetch to /contact-us, which jsdom cannot
// serve, so the SUBMIT RESULT is the thing under test and there is no way to
// observe it without standing in for SvelteKit here. This mock is the smallest
// faithful stand-in: it captures the callback the component returns from its
// enhance handler, so a test can hand it the exact `result` shape the action
// produces — fail(502, { error }) and friends — and then assert what the
// visitor sees. Hoisted by vitest above the component import, hence the
// import-after-mock ordering below.
let submitResult: ((arg: unknown) => Promise<void>) | null = null;
/** Stands in for SvelteKit's `update()`, which RESETS the form by default —
 *  the behaviour that made the old failure path wipe what had been typed. */
let update: (opts?: { reset?: boolean }) => Promise<void> = async () => {};
vi.mock("$app/forms", () => ({
  enhance: (
    form: HTMLFormElement,
    submitFn: (arg: unknown) => unknown | Promise<unknown>,
  ) => {
    const onSubmit = async (e: Event) => {
      e.preventDefault();
      update = async ({ reset = true } = {}) => {
        if (reset) form.reset();
      };
      const cb = await submitFn({
        formElement: form,
        formData: new FormData(form),
        action: new URL("http://localhost/contact-us"),
        cancel: () => {},
        submitter: null,
      });
      submitResult = cb as (arg: unknown) => Promise<void>;
    };
    form.addEventListener("submit", onSubmit);
    return { destroy: () => form.removeEventListener("submit", onSubmit) };
  },
}));

// The mounted TurnstileWidget reads $env/dynamic/public at module scope; that
// virtual module is undefined outside a built app (CI), so stand it in with an
// empty env — no sitekey → the widget renders nothing in these tests (same
// mock TurnstileWidget.test.ts uses).
vi.mock("$env/dynamic/public", () => ({ env: {} }));

const AppointmentModal = (await import("./AppointmentModal.svelte")).default;

afterEach(() => cleanup());

beforeEach(() => {
  appointmentOpen.set(false);
  submitResult = null;
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

  it("opens onto the Name field, not the ✕", async () => {
    // Modal's ✕ is first in the DOM, so without the autofocus marker the
    // spec's dialog-focusing steps land there: the keyboard path to booking
    // an appointment used to start on the exit.
    render(AppointmentModal);
    appointmentOpen.set(true);
    const dialog = await screen.findByRole("dialog");
    await tick();
    await tick();
    expect(document.activeElement).toBe(
      dialog.querySelector('input[name="name"]'),
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

// The failure path. `createIngestAction` answers a rejection with
// fail(400|500|502, { error }) — copy it has already chosen — and this modal
// used to discard it: the enhance callback called `update()`, which re-renders
// the form and sets `form` on the PAGE, and nothing here ever read it. A
// visitor whose booking was rejected therefore saw the modal sit completely
// unchanged: same fields, same button, no message. They either assumed it
// worked or clicked again. On the one form this practice uses to take
// bookings, that is a patient lost with no trace on either end.
describe("AppointmentModal submit results", () => {
  /** Open the modal, type a name, submit, and return the pieces to assert on. */
  const openAndSubmit = async () => {
    render(AppointmentModal);
    appointmentOpen.set(true);
    const dialog = await screen.findByRole("dialog");
    const form = dialog.querySelector("form") as HTMLFormElement;
    const name = dialog.querySelector('input[name="name"]') as HTMLInputElement;

    await act(() => {
      name.value = "Casey Patient";
      name.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await act(() =>
      form.dispatchEvent(new Event("submit", { cancelable: true })),
    );
    return { dialog, form, name };
  };

  const finish = (result: unknown) =>
    act(() => submitResult!({ result, update }));

  it("captures the enhance callback (guards the stand-in itself)", async () => {
    await openAndSubmit();
    expect(typeof submitResult).toBe("function");
  });

  it("shows the server's OWN error copy on a failure", async () => {
    await openAndSubmit();
    await finish({
      type: "failure",
      status: 502,
      data: { error: "Something went wrong sending your message." },
    });
    const alert = screen.getByRole("alert");
    expect(alert.textContent).toContain("Something went wrong sending your");
  });

  it("offers the phone number when the form itself is broken", async () => {
    // A 500 means the ingest config is missing — retrying cannot help, so the
    // only useful thing the modal can do is give them another way to reach us.
    await openAndSubmit();
    await finish({
      type: "failure",
      status: 500,
      data: { error: "This form is temporarily unavailable." },
    });
    const link = screen.getByRole("alert").querySelector('a[href^="tel:"]');
    expect(link).not.toBeNull();
  });

  it("falls back to its own copy when the failure carries no error string", async () => {
    await openAndSubmit();
    await finish({ type: "failure", status: 400, data: {} });
    expect(screen.getByRole("alert").textContent).toMatch(/went wrong/i);
  });

  it("reports a thrown error too, which has no data at all", async () => {
    await openAndSubmit();
    await finish({ type: "error", error: new Error("boom") });
    expect(screen.getByRole("alert").textContent).toMatch(/went wrong/i);
  });

  it("keeps the form up and the typed values intact, so a retry is one click", async () => {
    const { dialog, name } = await openAndSubmit();
    await finish({ type: "failure", status: 502, data: { error: "nope" } });
    expect(dialog.querySelector("form")).not.toBeNull();
    expect(name.value).toBe("Casey Patient");
  });

  it("re-enables the button after a failure", async () => {
    const { dialog } = await openAndSubmit();
    await finish({ type: "failure", status: 502, data: { error: "nope" } });
    const button = dialog.querySelector(
      'button[type="submit"]',
    ) as HTMLButtonElement;
    expect(button.disabled).toBe(false);
  });

  it("swaps in the confirmation on success, and does not show an alert", async () => {
    await openAndSubmit();
    await finish({ type: "success", status: 200, data: { success: true } });
    expect(screen.getByRole("status").textContent).toMatch(/thanks/i);
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("moves focus to the confirmation, not to <body>", async () => {
    // The submit button it was on has just been removed from the DOM; without
    // this a keyboard or screen-reader user is dropped at the top of the
    // document with no idea whether the request went through.
    await openAndSubmit();
    await finish({ type: "success", status: 200, data: { success: true } });
    expect(document.activeElement).toBe(screen.getByRole("status"));
  });

  it("puts the failure alert ABOVE the fields, not between them and the button", async () => {
    // The alert used to render between the last field and the submit button.
    // Probed at 1440x900: that moved the button's top 416 → 498, an 82px jump
    // in the half-second after a failure — with the pointer still over the
    // button and about to click again. DOM order is the part a unit test can
    // hold; the geometry is pinned in tests/interaction/appointment-modal.spec.ts.
    const { dialog } = await openAndSubmit();
    await finish({ type: "failure", status: 502, data: { error: "nope" } });

    const alert = screen.getByRole("alert");
    const nameField = dialog.querySelector('input[name="name"]')!;
    const submit = dialog.querySelector('button[type="submit"]')!;

    expect(
      alert.compareDocumentPosition(nameField) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      alert.compareDocumentPosition(submit) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("marks the button aria-busy while the request is in flight", async () => {
    // `disabled` alone changes only the accessible name ("Sending…"), silently.
    const { dialog } = await openAndSubmit();
    const button = dialog.querySelector(
      'button[type="submit"]',
    ) as HTMLButtonElement;

    expect(button.getAttribute("aria-busy")).toBe("true");
    expect(button.textContent?.trim()).toBe("Sending…");

    await finish({ type: "failure", status: 502, data: { error: "nope" } });
    expect(button.getAttribute("aria-busy")).toBe("false");
  });

  it("clears a previous error when the modal is reopened", async () => {
    await openAndSubmit();
    await finish({ type: "failure", status: 502, data: { error: "nope" } });
    expect(screen.queryByRole("alert")).not.toBeNull();

    appointmentOpen.set(false);
    await act(() => appointmentOpen.set(true));
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
