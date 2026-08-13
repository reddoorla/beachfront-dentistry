import { render, cleanup } from "@testing-library/svelte";
import { afterEach, describe, expect, it } from "vitest";
import type { ImageField } from "@prismicio/client";

import Page from "./+page.svelte";

afterEach(() => cleanup());

// The page matches the live /contact-us: a left-aligned "Contact Us" photo
// hero, an info band (Request-Appointment button + CONTACT / OFFICE HOURS +
// map), and the shared CTA. The request-appointment FORM lives in the global
// AppointmentModal (opened via the #appointment anchor); this route has no body
// form of its own.
//
// Its two photographs used to be hand-written ImageField literals inside the
// component, so the page genuinely took no props. They now arrive from the
// `settings` singleton through the root layout load, which is why every render
// here passes `data`.
const photo = (name: string) =>
  ({
    url: `https://images.prismic.io/48bb12d1/abc_${name}.jpg?auto=compress`,
    alt: null,
    dimensions: { width: 1600, height: 1067 },
  }) as unknown as ImageField;

const renderPage = () =>
  render(Page, {
    props: {
      data: {
        siteImages: {
          contactHero: photo("contact-hero"),
          ctaBeach: photo("cta-beach"),
          serviceHero: photo("service-hero"),
          teamMemberHero: photo("team-member-hero"),
        },
      },
    } as never,
  });
describe("contact-us page", () => {
  // Two separate guarantees, deliberately asserted apart: the page title must
  // ANNOUNCE as level 1 (this band carries the only title on the page, and
  // shipping it as a bare h2 left /contact-us with no level-1 heading at all),
  // while the TAG stays h2 because live's global rules key off h1 vs h2 and
  // swapping it would move pixels the matching gate measures.
  it("announces the Contact Us title as the page's level-1 heading", () => {
    const { getByRole } = renderPage();
    expect(getByRole("heading", { level: 1, name: "Contact Us" })).toBeTruthy();
  });

  it("keeps the title's tag as h2, matching live", () => {
    const { getByRole } = renderPage();
    const heading = getByRole("heading", { level: 1, name: "Contact Us" });
    expect(heading.tagName).toBe("H2");
  });

  it("renders the CONTACT / OFFICE HOURS info with a phone link", () => {
    const { getByText } = renderPage();

    expect(getByText("Monday - Thursday / 7am - 5pm")).toBeTruthy();
    expect(getByText("Friday / 7am - 2pm")).toBeTruthy();
    expect(getByText("Saturday - Sunday / Closed")).toBeTruthy();

    expect(getByText("1706 S Elena Ave. Suite B")).toBeTruthy();
    expect(getByText("Redondo Beach, CA 90277")).toBeTruthy();

    const tel = getByText("(310) 378-9241").closest("a");
    expect(tel?.getAttribute("href")).toBe("tel:+13103789241");
  });

  // The wiring, asserted without a network: both photographs must come from
  // the `data` the layout load supplies, not from anything the component holds
  // itself. This is the half of the move that unit tests can see — that the
  // document is actually PUBLISHED is asserted in
  // tests/content/shared-photos.spec.ts, which needs a live repository.
  it("takes both photographs from the settings data, not from the repo", () => {
    const { container } = renderPage();
    const srcs = Array.from(container.querySelectorAll("img")).map(
      (img) => img.getAttribute("src") ?? "",
    );
    const shared = srcs.filter((s) => s.includes("images.prismic.io"));
    expect(shared.length, "the hero and the closing beach both render").toBe(2);
    expect(
      srcs.filter((s) => s.startsWith("/images/")),
      "no photograph is served out of the repo",
    ).toEqual([]);
  });

  it("renders the map embed with its accessible title", () => {
    const { getByTitle } = renderPage();
    expect(getByTitle("Map to Beachfront Dentistry — Contact")).toBeTruthy();
  });

  // This page is the only one that mounts TWO maps — its own plus the footer's
  // — which is live's composition (two `w-widget-map` widgets in
  // matching/spec/contact-us.html) and stays. Live gets away with it because
  // its map iframes are `aria-hidden="true" tabindex="-1"`; ours are focusable
  // and named, so identical titles would be two tab stops a screen-reader user
  // cannot tell apart (WCAG 4.1.2). The page renders without the layout here,
  // so the footer's frame is not in this tree — what this pins is that the
  // page's own map does NOT use the shared default that the footer keeps.
  it("does not reuse MapEmbed's default title, which the footer's map holds", () => {
    const { container } = renderPage();
    const titles = [...container.querySelectorAll("iframe")].map((f) =>
      f.getAttribute("title"),
    );
    expect(titles).not.toContain("Map to Beachfront Dentistry");
    expect(titles.length).toBe(1);
  });

  it("funnels the appointment form through the global modal (#appointment), no body form", () => {
    const { container, getAllByText } = renderPage();
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
