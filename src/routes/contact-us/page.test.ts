import { render, cleanup } from "@testing-library/svelte";
import { afterEach, describe, expect, it } from "vitest";

import Page from "./+page.svelte";

afterEach(() => cleanup());

// The page takes no props — it matches the live /contact-us: a left-aligned
// "Contact Us" photo hero, an info band (Request-Appointment button + CONTACT /
// OFFICE HOURS + map), and the shared CTA. The request-appointment FORM lives
// in the global AppointmentModal (opened via the #appointment anchor); this
// route has no body form of its own.
describe("contact-us page", () => {
  // Two separate guarantees, deliberately asserted apart: the page title must
  // ANNOUNCE as level 1 (this band carries the only title on the page, and
  // shipping it as a bare h2 left /contact-us with no level-1 heading at all),
  // while the TAG stays h2 because live's global rules key off h1 vs h2 and
  // swapping it would move pixels the matching gate measures.
  it("announces the Contact Us title as the page's level-1 heading", () => {
    const { getByRole } = render(Page);
    expect(getByRole("heading", { level: 1, name: "Contact Us" })).toBeTruthy();
  });

  it("keeps the title's tag as h2, matching live", () => {
    const { getByRole } = render(Page);
    const heading = getByRole("heading", { level: 1, name: "Contact Us" });
    expect(heading.tagName).toBe("H2");
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
    const { container, getAllByText } = render(Page);
    // No body form on the page — the form is in the global AppointmentModal.
    expect(container.querySelector("form")).toBeNull();
    // Both the info-band button and the closing CTA say "Request Appointment"
    // (MarkUp pin 5980c9d7 #3 — live says "Book") and open that modal via the
    // #appointment anchor.
    const books = getAllByText("Request Appointment");
    expect(books.length).toBeGreaterThanOrEqual(1);
    for (const el of books) {
      expect(el.closest("a")?.getAttribute("href")).toBe("#appointment");
    }
  });
});
