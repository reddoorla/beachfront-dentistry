import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, fireEvent, cleanup, within } from "@testing-library/svelte";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import Nav from "./Nav.svelte";

/** The theme's colours, read from app.css's `@theme` block (cwd-relative:
 *  under jsdom `import.meta.url` is not a file: URL). */
const THEME: Record<string, string> = (() => {
  const css = readFileSync(resolve(process.cwd(), "src/app.css"), "utf8");
  const body = /@theme\s*\{([\s\S]*?)\n\}/.exec(css)?.[1] ?? "";
  const out: Record<string, string> = {};
  for (const m of body.matchAll(
    /--color-([a-z0-9-]+):\s*(#[0-9a-f]{6}|white|black)\s*;/gi,
  )) {
    out[m[1]] =
      m[2] === "white" ? "#ffffff" : m[2] === "black" ? "#000000" : m[2];
  }
  return out;
})();

type Rgb = [number, number, number];

const over = (top: Rgb, alpha: number, ground: Rgb) =>
  top.map((v, i) => alpha * v + (1 - alpha) * ground[i]) as Rgb;

/** An element's inline `rgb(r, g, b)` colour. */
function rgbOf(css: string): Rgb {
  const m = /^rgb\((\d+), (\d+), (\d+)\)$/.exec(css);
  expect(m, `"${css}" is not an opaque rgb()`).not.toBeNull();
  return [Number(m![1]), Number(m![2]), Number(m![3])];
}

/** A `text-`/`bg-` class's colour and alpha: a theme token or an arbitrary
 *  `[#rrggbb]` / `[#rrggbbaa]`, with any `/<pct>`. Anything else
 *  (`text-[15px]`, `bg-transparent`) is not a colour. */
function colour(cls: string, utility: "text" | "bg") {
  const m = new RegExp(
    `^${utility}-(?:\\[(#[0-9a-f]{6})([0-9a-f]{2})?\\]|([a-z][a-z0-9-]*))(?:/(\\d+))?$`,
    "i",
  ).exec(cls);
  const hex = m && (m[1] ?? THEME[m[3]]);
  if (!m || !hex) return undefined;
  const rgb = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as Rgb;
  const alpha =
    (m[2] ? parseInt(m[2], 16) / 255 : 1) *
    (m[4] === undefined ? 1 : Number(m[4]) / 100);
  return { rgb, alpha };
}

/** WCAG 2.x contrast between two sRGB colours. */
function contrast(a: Rgb, b: Rgb): number {
  const luminance = (rgb: Rgb) => {
    const [r, g, bl] = rgb.map((v) => {
      const c = v / 255;
      return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** A control's label against its own fill over `ground`, at rest and on hover.
 *  The hover fill replaces the rest fill, the hover ink falls back to the rest
 *  ink, and an `opacity-*` fades label and fill together toward the ground. */
function labelContrast(className: string, ground: Rgb) {
  const under = (variant: string) =>
    className.split(/\s+/).flatMap((c) => {
      const at = c.lastIndexOf(":");
      return c.slice(0, Math.max(at, 0)) === variant ? [c.slice(at + 1)] : [];
    });
  const first = <T>(variant: string, read: (c: string) => T | undefined) =>
    [variant, ""]
      .flatMap(under)
      .map(read)
      .find((v) => v !== undefined);
  const fade = (c: string) => {
    const m = /^opacity-(\d+)$/.exec(c);
    return m ? Number(m[1]) / 100 : undefined;
  };
  const measure = (variant: string) => {
    const fill = first(variant, (c) => colour(c, "bg"));
    const ink = first(variant, (c) => colour(c, "text"));
    if (!ink) return NaN;
    const box = fill ? over(fill.rgb, fill.alpha, ground) : ground;
    const label = over(ink.rgb, ink.alpha, box);
    const alpha = first(variant, fade) ?? 1;
    return contrast(over(label, alpha, ground), over(box, alpha, ground));
  };
  return { rest: measure(""), hover: measure("hover") };
}

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
    // The DIALOG takes focus, not the first control inside it: it carries
    // `data-autofocus` + `tabindex="-1"` so that opening the menu never rings a
    // real destination — MARKUP ROUND I1 pin #2, where the ring landed on the
    // logo (see the note on the dialog element in Nav.svelte).
    //
    // This assertion used to name the Close button, and that is precisely why
    // the defect was invisible here: `focusable()[0]` is the Close button only
    // because THIS render passes no `logo` prop, so the logo anchor that
    // precedes it on every real page of the site does not exist in the tree.
    // The test agreed with the browser about the element and disagreed about
    // the page.
    expect(document.activeElement).toBe(dialog);
    expect(dialog.getAttribute("tabindex")).toBe("-1");
  });

  // The shape of the page the pin was actually filed against: a logo IS
  // present, so the logo anchor is the overlay's first focusable and was what
  // trapFocus handed the ring to. Rendering it here is the whole point.
  it("does not focus the logo when one is present (MarkUp I1 pin #2)", async () => {
    const { getByLabelText, getByRole, getAllByAltText } = render(Nav, {
      items,
      logo: { url: "https://cdn.example/logo.png" },
    });

    await fireEvent.click(getByLabelText("Open menu"));
    const dialog = getByRole("dialog");
    await frame();

    const logoLink = getAllByAltText("Home")
      .map((img) => img.closest("a"))
      .find((a) => dialog.contains(a));
    expect(logoLink).toBeTruthy();
    expect(document.activeElement).not.toBe(logoLink);
    expect(document.activeElement).toBe(dialog);
  });

  it("wraps Tab from the last link back to the first control", async () => {
    const { getByLabelText, getByRole } = render(Nav, { items });
    await fireEvent.click(getByLabelText("Open menu"));
    await frame();

    const dialog = getByRole("dialog");
    const focusables = Array.from(
      dialog.querySelectorAll<HTMLElement>("a[href], button"),
    );
    const last = focusables[focusables.length - 1];
    last.focus();

    const e = new KeyboardEvent("keydown", {
      key: "Tab",
      bubbles: true,
      cancelable: true,
    });
    last.dispatchEvent(e);

    expect(e.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(focusables[0]);
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

  it("menu overlay renders no dead link for a dropdown parent, plus a Home Page link", async () => {
    const { getByLabelText, getByRole } = render(Nav, {
      items: itemsWithDropdown,
    });
    await fireEvent.click(getByLabelText("Open menu"));
    await frame();

    const dialog = getByRole("dialog");
    expect(dialog.querySelector('a[href=""]')).toBeNull();
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

  it("renders none of the nav items in the bar, beside the trigger", () => {
    const { container, getByLabelText } = render(Nav, {
      items: beachfrontItems,
      logo: beachfrontLogo,
      hamburgerOnly: true,
    });
    const links = barLinks(container);
    for (const { href } of beachfrontItems) expect(links).not.toContain(href);
    expect(getByLabelText("Open menu")).toBeTruthy();
  });

  it("still renders the fleet default chrome when hamburgerOnly is off", () => {
    const { container } = render(Nav, {
      items: beachfrontItems,
      logo: beachfrontLogo,
    });
    expect(barLinks(container)).toEqual(
      expect.arrayContaining([
        "/",
        ...beachfrontItems.map((item) => item.href),
        "tel:+13103789241",
        "#appointment",
        "https://app.modento.io/beachfront-dentistry",
      ]),
    );
  });
});

// The overlay's pills sit on the deep wash and invert on hover: the fill turns
// white, so the label has to change ink with it or it goes white-on-white.
describe("Nav — the menu pills stay legible on hover", () => {
  it("each pill's label clears AA on the wash at rest and on hover", async () => {
    const { getByLabelText, getByRole } = render(Nav, {
      items: beachfrontItems,
      logo: beachfrontLogo,
      hamburgerOnly: true,
    });
    await fireEvent.click(getByLabelText("Open menu"));
    await frame();

    const dialog = getByRole("dialog");
    const ground = rgbOf(dialog.style.backgroundColor);
    for (const name of ["Request an Appointment", "Make a Payment"]) {
      const pill = within(dialog).getByRole("link", { name });
      const { rest, hover } = labelContrast(pill.className, ground);
      expect(rest, `${name} at rest`).toBeGreaterThanOrEqual(4.5);
      expect(hover, `${name} on hover`).toBeGreaterThanOrEqual(4.5);
    }
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

  it("wraps Tab from the last link back to the first control", async () => {
    const { getByLabelText, getByRole } = render(Nav, { navLinks });
    await fireEvent.click(getByLabelText("Open menu"));
    await frame();

    const dialog = getByRole("dialog");
    const focusables = Array.from(
      dialog.querySelectorAll<HTMLElement>("a[href], button"),
    );
    const last = focusables[focusables.length - 1];
    last.focus();

    const e = new KeyboardEvent("keydown", {
      key: "Tab",
      bubbles: true,
      cancelable: true,
    });
    last.dispatchEvent(e);

    expect(e.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(focusables[0]);
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
