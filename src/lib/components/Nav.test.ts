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
    // Scoped to the dropdown's own id prefix: the menu trigger carries
    // aria-controls too (it points at the overlay — see the aria-state suite
    // below), so a bare `button[aria-controls]` no longer names one button.
    const toggle = container.querySelector(
      'button[aria-controls^="nav-dropdown-"]',
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

  it("menu overlay renders only leaf links (live's modal has no accordion) plus a Home Page link", async () => {
    const { getByLabelText, getByRole } = render(Nav, {
      items: itemsWithDropdown,
    });
    await fireEvent.click(getByLabelText("Open menu"));
    await frame();

    // Live's dropdown-modal is a flat column of links — an item that is only
    // a dropdown parent (no href) simply doesn't appear in the overlay.
    const dialog = getByRole("dialog");
    expect(dialog.textContent).not.toContain("Chairs");
    const home = Array.from(dialog.querySelectorAll("a")).find(
      (a) => a.textContent === "Home Page",
    );
    expect(home?.getAttribute("href")).toBe("/");
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

    // Live's modal CTA is labelled "Book an Appointment"; MarkUp pin 5980c9d7
    // #3 renames every Book CTA to "Request", keeping this instance's "an"
    // (the desktop pill stays the article-less "Request Appointment").
    const book = links.find((a) => a.textContent === "Request an Appointment");
    expect(book?.getAttribute("href")).toBe("#appointment");

    const payment = links.find((a) => a.textContent === "Make a Payment");
    expect(payment?.getAttribute("href")).toBe(
      "https://app.modento.io/beachfront-dentistry",
    );
    expect(payment?.getAttribute("target")).toBe("_blank");
  });
});

// The menu trigger unmounts while the overlay is open and the overlay renders
// its own Close in the same slot, so no single element can carry a flipping
// aria-expanded. Both buttons carry the pair instead, pointing at the dialog's
// id — which is what makes `[aria-controls="nav-menu"]` a stable handle whose
// aria-expanded reads false → true across the swap.
describe("Nav — the trigger announces the menu's state", () => {
  const MENU_ID = "nav-menu";
  const stateButton = (container: HTMLElement | Document) =>
    (container as HTMLElement).querySelector(
      `button[aria-controls="${MENU_ID}"]`,
    ) as HTMLButtonElement;

  for (const [mode, props] of [
    ["site-config items", { items }],
    ["page-data navLinks", { navLinks }],
  ] as const) {
    it(`(${mode}) aria-expanded flips false → true and aria-controls names the dialog`, async () => {
      const { getByLabelText, getByRole } = render(Nav, props);

      const trigger = getByLabelText("Open menu");
      expect(trigger.getAttribute("aria-controls")).toBe(MENU_ID);
      expect(trigger.getAttribute("aria-expanded")).toBe("false");

      await fireEvent.click(trigger);
      await frame();

      // The id the trigger pointed at is the dialog that actually mounted.
      const dialog = getByRole("dialog");
      expect(dialog.id).toBe(MENU_ID);

      // Same handle, now the Close button, now expanded.
      const open = stateButton(document.body);
      expect(open.getAttribute("aria-label")).toBe("Close menu");
      expect(open.getAttribute("aria-expanded")).toBe("true");

      await fireEvent.click(open);
      await frame();
      await frame();
      expect(stateButton(document.body).getAttribute("aria-expanded")).toBe(
        "false",
      );
    });
  }
});

// A tap that looks like nothing happened gets tapped again. `:active` alone is
// not enough — probed with a real dispatched touchStart, Chromium never matched
// it — so the press state is driven by pointer events and surfaced as
// `data-pressed`, which the pill/glyph classes key off.
describe("Nav — the trigger acknowledges a press", () => {
  it("sets data-pressed on pointerdown and clears it on every release path", async () => {
    const { getByLabelText } = render(Nav, {
      items,
      hamburgerOnly: true,
    });
    const trigger = getByLabelText("Open menu");
    expect(trigger.hasAttribute("data-pressed")).toBe(false);

    for (const release of [
      "pointerUp",
      "pointerCancel",
      "pointerLeave",
      "blur",
    ] as const) {
      await fireEvent.pointerDown(trigger);
      expect(trigger.hasAttribute("data-pressed")).toBe(true);
      await fireEvent[release](trigger);
      expect(trigger.hasAttribute("data-pressed")).toBe(false);
    }
  });

  it("presses the Close button independently of the trigger", async () => {
    const { getByLabelText } = render(Nav, { items, hamburgerOnly: true });
    await fireEvent.click(getByLabelText("Open menu"));
    await frame();

    const close = getByLabelText("Close menu");
    await fireEvent.pointerDown(close);
    expect(close.hasAttribute("data-pressed")).toBe(true);
    await fireEvent.pointerUp(close);
    expect(close.hasAttribute("data-pressed")).toBe(false);
  });
});

// `hamburgerOnly` collapses the bar to logo + trigger at every breakpoint. The
// inline link list and the phone/CTA cluster used to render anyway under a bare
// `hidden` with no `lg:flex` to un-hide them — eight controls that were
// display:none on every page, forever. They must not be in the DOM at all.
describe("Nav — hamburgerOnly ships no permanently-hidden controls", () => {
  const barLinks = (container: HTMLElement) =>
    Array.from(container.querySelectorAll("nav a")).map((a) =>
      a.getAttribute("href"),
    );

  it("renders only the logo link beside the trigger", () => {
    const { container } = render(Nav, {
      items: beachfrontItems,
      logo: beachfrontLogo,
      hamburgerOnly: true,
    });
    expect(barLinks(container)).toEqual(["/"]);
    expect(container.querySelectorAll("nav button")).toHaveLength(1);
  });

  it("still renders the fleet default chrome when hamburgerOnly is off", () => {
    const { container } = render(Nav, {
      items: beachfrontItems,
      logo: beachfrontLogo,
    });
    // logo + 5 items + phone + 2 CTAs
    expect(barLinks(container)).toHaveLength(9);
  });
});

// The overlay's two pills take the shared language's WHITE colourway: on the
// #129ecc menu wash a translucent cyan fill composites to nothing, so the fill
// is the brand deep blue (white label 5.10:1 held, measured on the rendered
// pixels; the old `hover:opacity-60` took it to 1.9:1).
describe("Nav — the menu pills speak the shared hover language", () => {
  it("fill + border + press, and no opacity fade", async () => {
    const { getByLabelText, getByRole } = render(Nav, {
      items: beachfrontItems,
      logo: beachfrontLogo,
      hamburgerOnly: true,
    });
    await fireEvent.click(getByLabelText("Open menu"));
    await frame();

    const dialog = getByRole("dialog");
    for (const label of ["Request an Appointment", "Make a Payment"]) {
      const pill = Array.from(dialog.querySelectorAll("a")).find(
        (a) => a.textContent?.trim() === label,
      ) as HTMLAnchorElement;
      expect(pill, label).toBeTruthy();
      expect(pill.className).toContain("hover:bg-[#0e7799]");
      expect(pill.className).toContain("active:translate-y-px");
      expect(pill.className).toContain("ease-[var(--transition-out-expo)]");
      // `translate`, not `transform` — Tailwind v4 compiles the utility to the
      // independent property, and `transform` is what the row's own `fly`
      // intro drives, so the two must not name the same channel.
      expect(pill.className).toContain("translate]");
      expect(pill.className).not.toContain("transform]");
      expect(pill.className).not.toMatch(/opacity/);
    }
  });
});

// One hover treatment for the brand mark, identical in both menu states. It
// used to compound the anchor's 0.60 with the img's 0.50 to an effective 0.30
// closed, while the same img rule was dead in the overlay (no `group` on its
// anchor) so the open-menu logo hovered to 0.60 — the same control behaving
// differently by menu state.
describe("Nav — the logo has one hover treatment", () => {
  it("closed and open logo links carry the same classes, and neither img fades", async () => {
    const { getByLabelText, getByAltText, getByRole } = render(Nav, {
      items: beachfrontItems,
      logo: beachfrontLogo,
      hamburgerOnly: true,
    });

    const closedImg = getByAltText("Home") as HTMLImageElement;
    const closedLink = closedImg.closest("a") as HTMLAnchorElement;
    expect(closedImg.className).not.toMatch(/opacity/);
    expect(closedLink.className).toContain("hover:opacity-85");

    await fireEvent.click(getByLabelText("Open menu"));
    await frame();

    const openImg = getByRole("dialog").querySelector(
      "img[alt='Home']",
    ) as HTMLImageElement;
    const openLink = openImg.closest("a") as HTMLAnchorElement;
    expect(openImg.className).not.toMatch(/opacity/);
    expect(openLink.className).toBe(
      closedLink.className.replace(/ ?text-lg font-bold$/, ""),
    );
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
