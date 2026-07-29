import { render, cleanup } from "@testing-library/svelte";
import { afterEach, describe, expect, it, vi } from "vitest";

// The form pulls in TurnstileWidget, which reads $env/dynamic/public at
// instance init — same mock as TurnstileWidget.test.ts, unset here so the
// widget stays dark (no network / no Cloudflare script injection in jsdom).
vi.mock("$env/dynamic/public", () => ({ env: {} }));

import Page from "./+page.svelte";

afterEach(() => cleanup());

const data = { formTs: 1700000000000, title: "Contact" };

describe("contact-us page", () => {
  it("has the Contact Us h1", () => {
    const { getByRole } = render(Page, {
      props: { data: data as never, form: null },
    });
    expect(getByRole("heading", { level: 1 }).textContent).toBe("Contact Us");
  });

  it("renders an info column with hours, address, and a phone link", () => {
    const { getByText } = render(Page, {
      props: { data: data as never, form: null },
    });

    expect(getByText("Monday - Thursday")).toBeTruthy();
    expect(getByText("7am - 5pm")).toBeTruthy();
    expect(getByText("Friday")).toBeTruthy();
    expect(getByText("7am - 2pm")).toBeTruthy();

    expect(getByText("1706 S Elena Ave. Suite B")).toBeTruthy();
    expect(getByText("Redondo Beach, CA 90277")).toBeTruthy();

    const tel = getByText("(310) 378-9241").closest("a");
    expect(tel?.getAttribute("href")).toBe("tel:+13103789241");
  });

  it("renders the map embed with its accessible title", () => {
    const { getByTitle } = render(Page, {
      props: { data: data as never, form: null },
    });
    expect(getByTitle("Map to Beachfront Dentistry")).toBeTruthy();
  });

  it("still renders the contact form with the anti-spam fields", () => {
    const { container } = render(Page, {
      props: { data: data as never, form: null },
    });
    const form = container.querySelector("form");
    expect(form).toBeTruthy();
    expect(form?.querySelector('input[name="ts"]')).toBeTruthy();
    expect(form?.querySelector('input[name="bot-field"]')).toBeTruthy();
  });
});
