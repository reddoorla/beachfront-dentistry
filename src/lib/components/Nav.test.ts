import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, fireEvent, cleanup } from "@testing-library/svelte";
import Nav from "./Nav.svelte";

// jsdom has no WAAPI (Element.animate), so we report reduced motion: the
// $lib/transitions wrappers then collapse durations to 0 and Svelte skips the
// animation machinery entirely. This is the same path real reduced-motion
// users hit in production.
function mockMatchMedia(reducedMotion: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches:
      query === "(prefers-reduced-motion: reduce)" ? reducedMotion : false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    onchange: null,
    dispatchEvent: () => false,
  }));
}

// jsdom performs no layout — treat connected elements as visible so
// trapFocus's getClientRects() filter keeps them.
beforeEach(() => {
  mockMatchMedia(true);
  vi.spyOn(Element.prototype, "getClientRects").mockImplementation(function (
    this: Element,
  ) {
    return (this.isConnected ? [{}] : []) as unknown as DOMRectList;
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const frame = () => new Promise((r) => requestAnimationFrame(r));

// Hash hrefs keep jsdom from attempting (unimplemented) page navigation.
const items = [
  { label: "Services", href: "#services" },
  { label: "About", href: "#about" },
];

// A top item with dropdown children (renders as a desktop dropdown / mobile
// accordion).
const itemsWithDropdown = [
  {
    label: "Products",
    href: "",
    children: [
      { label: "Chairs", href: "#chairs" },
      { label: "Tables", href: "#tables" },
    ],
  },
  { label: "About", href: "#about" },
];

// Flat page-data links (a migrated Blux site). These take precedence over
// `items` and render the focus-trapped mobile menu below.
const navLinks = [
  { text: "Services", href: "#services" },
  { text: "About", href: "#about" },
];

describe("Nav — logo-only mode", () => {
  it("renders no menu button without items", () => {
    const { queryByLabelText, getByText } = render(Nav);
    expect(getByText("Logo")).toBeTruthy();
    expect(queryByLabelText("Open menu")).toBeNull();
  });

  it("renders the resolved logo image when given a logo", () => {
    const { getByAltText } = render(Nav, {
      logo: { url: "https://cdn.example/logo.png", maxWidth: "250px" },
    });
    const img = getByAltText("Home") as HTMLImageElement;
    expect(img.getAttribute("src")).toBe("https://cdn.example/logo.png");
    expect(img.style.maxWidth).toBe("250px");
  });
});

describe("Nav — mobile menu", () => {
  it("opens the menu and moves focus into it", async () => {
    const { getByLabelText, getByRole } = render(Nav, { items });

    await fireEvent.click(getByLabelText("Open menu"));
    const dialog = getByRole("dialog");
    expect(dialog.getAttribute("aria-modal")).toBe("true");

    await frame();
    expect(document.activeElement).toBe(getByLabelText("Close menu"));
  });

  it("wraps Tab from the last link back to the close button", async () => {
    const { getByLabelText, getByRole } = render(Nav, { items });
    await fireEvent.click(getByLabelText("Open menu"));
    await frame();

    const dialog = getByRole("dialog");
    const links = Array.from(dialog.querySelectorAll("a"));
    const last = links[links.length - 1];
    last.focus();

    const e = new KeyboardEvent("keydown", {
      key: "Tab",
      bubbles: true,
      cancelable: true,
    });
    last.dispatchEvent(e);

    expect(e.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(getByLabelText("Close menu"));
  });

  it("closes on Escape and returns focus to the re-mounted trigger", async () => {
    const { getByLabelText, getByRole, queryByRole } = render(Nav, {
      items,
    });
    await fireEvent.click(getByLabelText("Open menu"));
    await frame();

    await fireEvent.keyDown(getByRole("dialog"), { key: "Escape" });
    expect(queryByRole("dialog")).toBeNull();

    // The trigger unmounted while the menu was open; focus lands on the fresh
    // instance one frame after close.
    await frame();
    await frame();
    expect(document.activeElement).toBe(getByLabelText("Open menu"));
  });

  it("closes when a menu link is activated", async () => {
    const { getByLabelText, getByRole, queryByRole } = render(Nav, {
      items,
    });
    await fireEvent.click(getByLabelText("Open menu"));
    await frame();

    const link = Array.from(getByRole("dialog").querySelectorAll("a"))[0];
    await fireEvent.click(link);

    expect(queryByRole("dialog")).toBeNull();
  });

  it("renders duplicate labels/hrefs without crashing (index-keyed each)", () => {
    // Two children pointing at the same href, and repeated top-level labels —
    // both would throw each_key_duplicate at hydration if keyed by label/href.
    const dupes = [
      {
        label: "Company",
        href: "",
        children: [
          { label: "About", href: "/contact" },
          { label: "Team", href: "/contact" },
        ],
      },
      { label: "Company", href: "/company" },
    ];
    expect(() => render(Nav, { items: dupes })).not.toThrow();
  });

  it("renders an empty-href item as non-interactive text, not a dead link", () => {
    const { container, getByText } = render(Nav, {
      items: [{ label: "Heading", href: "" }],
    });
    expect(getByText("Heading").tagName).toBe("SPAN");
    // The only <a> is the logo home link; no <a href=""> leaf.
    const emptyLinks = Array.from(container.querySelectorAll("a")).filter(
      (a) => a.getAttribute("href") === "",
    );
    expect(emptyLinks).toHaveLength(0);
  });

  it("desktop dropdown is a disclosure: aria-expanded toggles, Escape closes", async () => {
    const { container } = render(Nav, { items: itemsWithDropdown });
    // The desktop dropdown toggle carries aria-controls (the mobile menu isn't
    // open, so it's the only such button).
    const toggle = container.querySelector(
      "button[aria-controls]",
    ) as HTMLButtonElement;
    expect(toggle).toBeTruthy();
    // No misleading aria-haspopup (the popup is a list of links, not a menu).
    expect(toggle.getAttribute("aria-haspopup")).toBeNull();
    expect(toggle.getAttribute("aria-expanded")).toBe("false");

    await fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-expanded")).toBe("true");

    await fireEvent.keyDown(toggle, { key: "Escape" });
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
  });

  it("expands a dropdown as an accordion and reveals its children", async () => {
    const { getByLabelText, getByRole } = render(Nav, {
      items: itemsWithDropdown,
    });
    await fireEvent.click(getByLabelText("Open menu"));
    await frame();

    // Scope to the dialog: the desktop dropdown <ul> also holds these links and
    // jsdom applies no stylesheet, so Tailwind's `hidden`/`lg:flex` doesn't hide
    // it — only the dialog's accordion actually collapses its children.
    const dialog = getByRole("dialog");
    expect(dialog.textContent).not.toContain("Chairs");

    const toggle = Array.from(dialog.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Products"),
    )!;
    expect(toggle.getAttribute("aria-expanded")).toBe("false");

    await fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    expect(dialog.textContent).toContain("Chairs");
    expect(dialog.textContent).toContain("Tables");
  });
});

// Beachfront's real site-config nav: 5 flat items (no dropdowns), plus the
// phone + appointment/payment CTAs the live site's nav band carries. Exercises
// the same `items` branch as the dropdown fixtures above, alongside the new
// phone/CTA chrome.
const beachfrontItems = [
  { label: "First Visit", href: "/your-first-visit" },
  { label: "Meet Our Team", href: "/our-team" },
  { label: "Services", href: "/services" },
  { label: "Ask the Doctor", href: "/ask-the-doctor" },
  { label: "Contact", href: "/contact-us" },
];
const beachfrontLogo = { url: "/logo-white.svg", maxWidth: "180px" };

describe("Nav — beachfront chrome (siteConfig items + phone/payment CTAs)", () => {
  it("renders the 5 config items as links", () => {
    const { getByRole } = render(Nav, {
      items: beachfrontItems,
      logo: beachfrontLogo,
    });
    for (const item of beachfrontItems) {
      expect(getByRole("link", { name: item.label }).getAttribute("href")).toBe(
        item.href,
      );
    }
  });

  it("renders the resolved logo image using the provided url", () => {
    const { getByAltText } = render(Nav, {
      items: beachfrontItems,
      logo: beachfrontLogo,
    });
    const img = getByAltText("Home") as HTMLImageElement;
    expect(img.getAttribute("src")).toBe("/logo-white.svg");
  });

  it("renders a tel: phone link on desktop", () => {
    const { getByText } = render(Nav, {
      items: beachfrontItems,
      logo: beachfrontLogo,
    });
    const phone = getByText("(310) 378-9241");
    expect(phone.tagName).toBe("A");
    expect(phone.getAttribute("href")).toBe("tel:+13103789241");
  });

  it("renders a Request Appointment CTA linking to #appointment", () => {
    const { getByRole } = render(Nav, {
      items: beachfrontItems,
      logo: beachfrontLogo,
    });
    const cta = getByRole("link", { name: "Request Appointment" });
    expect(cta.getAttribute("href")).toBe("#appointment");
  });

  it("renders a Make a Payment CTA to Modento in a new tab", () => {
    const { getByRole } = render(Nav, {
      items: beachfrontItems,
      logo: beachfrontLogo,
    });
    const cta = getByRole("link", { name: "Make a Payment" });
    expect(cta.getAttribute("href")).toBe(
      "https://app.modento.io/beachfront-dentistry",
    );
    expect(cta.getAttribute("target")).toBe("_blank");
    expect(cta.getAttribute("rel")).toBe("noopener");
  });

  it("mirrors the phone + CTA links in the mobile menu", async () => {
    const { getByLabelText, getByRole } = render(Nav, {
      items: beachfrontItems,
      logo: beachfrontLogo,
    });
    await fireEvent.click(getByLabelText("Open menu"));
    await frame();

    const dialog = getByRole("dialog");
    const links = Array.from(dialog.querySelectorAll("a"));

    const phone = links.find((a) => a.textContent === "(310) 378-9241");
    expect(phone?.getAttribute("href")).toBe("tel:+13103789241");

    const request = links.find((a) => a.textContent === "Request Appointment");
    expect(request?.getAttribute("href")).toBe("#appointment");

    const payment = links.find((a) => a.textContent === "Make a Payment");
    expect(payment?.getAttribute("href")).toBe(
      "https://app.modento.io/beachfront-dentistry",
    );
    expect(payment?.getAttribute("target")).toBe("_blank");
  });
});

// The flat-links chrome a migrated Blux site renders when it passes `navLinks`
// via page data. Distinct code path from the `items` dropdown nav above.
describe("Nav — navLinks (page-data) mode", () => {
  it("opens the menu and moves focus into it", async () => {
    const { getByLabelText, getByRole } = render(Nav, { navLinks });

    await fireEvent.click(getByLabelText("Open menu"));
    const dialog = getByRole("dialog");
    expect(dialog.getAttribute("aria-modal")).toBe("true");

    await frame();
    expect(document.activeElement).toBe(getByLabelText("Close menu"));
  });

  it("wraps Tab from the last link back to the close button", async () => {
    const { getByLabelText, getByRole } = render(Nav, { navLinks });
    await fireEvent.click(getByLabelText("Open menu"));
    await frame();

    const dialog = getByRole("dialog");
    const links = Array.from(dialog.querySelectorAll("a"));
    const last = links[links.length - 1];
    last.focus();

    const e = new KeyboardEvent("keydown", {
      key: "Tab",
      bubbles: true,
      cancelable: true,
    });
    last.dispatchEvent(e);

    expect(e.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(getByLabelText("Close menu"));
  });

  it("closes on Escape and returns focus to the re-mounted trigger", async () => {
    const { getByLabelText, getByRole, queryByRole } = render(Nav, {
      navLinks,
    });
    await fireEvent.click(getByLabelText("Open menu"));
    await frame();

    await fireEvent.keyDown(getByRole("dialog"), { key: "Escape" });
    expect(queryByRole("dialog")).toBeNull();

    // The trigger unmounted while the menu was open; focus lands on the fresh
    // instance one frame after close.
    await frame();
    await frame();
    expect(document.activeElement).toBe(getByLabelText("Open menu"));
  });

  it("closes when a menu link is activated", async () => {
    const { getByLabelText, getByRole, queryByRole } = render(Nav, {
      navLinks,
    });
    await fireEvent.click(getByLabelText("Open menu"));
    await frame();

    const link = Array.from(getByRole("dialog").querySelectorAll("a"))[0];
    await fireEvent.click(link);

    expect(queryByRole("dialog")).toBeNull();
  });
});
