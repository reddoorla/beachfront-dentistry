import { render, cleanup } from "@testing-library/svelte";
import { afterEach, describe, expect, it } from "vitest";

import Page from "./+page.svelte";

afterEach(() => cleanup());

// The page takes no props — it matches the live /contact-us: a left-aligned
// "Contact Us" photo hero, an info band (Book-Appointment button + CONTACT /
// OFFICE HOURS + map), and the shared CTA. The request-appointment FORM lives
// in the global AppointmentModal (opened via the #appointment anchor); this
// route has no body form of its own.
describe("contact-us page", () => {
  it("has the Contact Us heading (h2, matching live)", () => {
    const { getByRole } = render(Page);
    expect(getByRole("heading", { level: 2, name: "Contact Us" })).toBeTruthy();
  });

  it("renders the CONTACT / OFFICE HOURS info with a phone link", () => {
    const { getByText } = render(Page);

    expect(getByText("Monday - Thursday / 7am - 5pm")).toBeTruthy();
    expect(getByText("Friday / 7am - 2pm")).toBeTruthy();
    expect(getByText("Saturday - Sunday / Closed")).toBeTruthy();

    expect(getByText("1706 S Elena Ave. Suite B")).toBeTruthy();
    expect(getByText("Redondo Beach, CA 90277")).toBeTruthy();

    const tel = getByText("(310) 378-9241").closest("a");
    expect(tel?.getAttribute("href")).toBe("tel:+13103789241");
  });

  it("renders the map embed with its accessible title", () => {
    const { getByTitle } = render(Page);
    expect(getByTitle("Map to Beachfront Dentistry")).toBeTruthy();
  });

  it("funnels the appointment form through the global modal (#appointment), no body form", () => {
    const { container, getByText } = render(Page);
    // No body form on the page — the form is in the global AppointmentModal.
    expect(container.querySelector("form")).toBeNull();
    // The Book Appointment button opens that modal via the #appointment anchor.
    const book = getByText("Book Appointment").closest("a");
    expect(book?.getAttribute("href")).toBe("#appointment");
  });
});
