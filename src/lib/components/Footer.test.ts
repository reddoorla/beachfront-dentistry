import { render, cleanup } from "@testing-library/svelte";
import { describe, it, expect, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import Footer from "./Footer.svelte";

afterEach(() => cleanup());

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

describe("Footer", () => {
  // --- columns chrome (Blux catalog page-data; takes precedence) ---

  it("default: renders the hardcoded copyright (fleet behavior unchanged)", () => {
    const { container } = render(Footer);
    expect(container.querySelector("footer")).not.toBeNull();
    expect(container.querySelector("footer")?.textContent).toContain(
      "Company Name",
    );
  });

  it("columns prop renders text items with tel/mailto links", () => {
    const { container, getByText } = render(Footer, {
      props: {
        columns: [
          {
            items: [
              { text: "Todd Doney" },
              { text: "213.613.3330", href: "tel:213.593.1360" },
              {
                text: "Todd.Doney@cbre.com",
                href: "mailto:Todd.Doney@cbre.com",
              },
            ],
          },
        ],
      },
    });
    // A no-href text item is a plain <p>, never an anchor.
    const plain = getByText("Todd Doney");
    expect(plain.tagName).toBe("P");
    expect(plain.closest("a")).toBeNull();

    const tel = container.querySelector("a[href='tel:213.593.1360']");
    expect(tel?.textContent).toContain("213.613.3330");
    // tel:/mailto: stay same-tab — no target/rel.
    expect(tel?.getAttribute("target")).toBeNull();
    expect(tel?.getAttribute("rel")).toBeNull();
    expect(container.querySelector("footer")).not.toBeNull();
  });

  it("columns prop renders image items, linked when href present", () => {
    const { container } = render(Footer, {
      props: {
        columns: [
          {
            items: [
              {
                image: {
                  url: "https://cdn/logo.png",
                  maxWidth: "300px",
                  alt: "Burbank Portfolio",
                },
                href: "https://www.theburbankportfolio.com/",
              },
              { image: { url: "https://cdn/plain.png" } },
            ],
          },
        ],
      },
    });
    const linked = container.querySelector(
      "a[href='https://www.theburbankportfolio.com/'] img",
    );
    expect(linked?.getAttribute("src")).toBe("https://cdn/logo.png");
    expect((linked as HTMLElement)?.style.maxWidth).toBe("300px");
    expect(linked?.getAttribute("alt")).toBe("Burbank Portfolio");

    // http(s) logo link opens in a new tab with the safe rel.
    const anchor = container.querySelector(
      "a[href='https://www.theburbankportfolio.com/']",
    );
    expect(anchor?.getAttribute("target")).toBe("_blank");
    expect(anchor?.getAttribute("rel")).toBe("noopener noreferrer");

    // Only the href'd image is wrapped in an anchor.
    const plain = container.querySelector("img[src='https://cdn/plain.png']");
    expect(plain).not.toBeNull();
    expect(plain?.closest("a")).toBeNull();
  });

  it("linked logo exposes its alt as the link's accessible name (a11y)", () => {
    const { getByRole } = render(Footer, {
      props: {
        columns: [
          {
            items: [
              {
                image: {
                  url: "https://cdn/logo.png",
                  alt: "Burbank Portfolio",
                },
                href: "https://www.theburbankportfolio.com/",
              },
            ],
          },
        ],
      },
    });
    // The anchor wrapping only an <img> derives its name from the img alt.
    expect(getByRole("link", { name: "Burbank Portfolio" })).not.toBeNull();
  });

  it("default branch when columns is empty/undefined (fleet default preserved)", () => {
    const { container } = render(Footer, { props: { columns: [] } });
    expect(container.querySelector("footer")?.textContent).toContain(
      "Company Name",
    );
  });

  // --- socials/text chrome (site-config default; used when no columns) ---

  it("falls back to a generic notice with no props", () => {
    const { container, queryByRole } = render(Footer);
    // No socials → no list; the copyright line is always present.
    expect(container.querySelector("ul")).toBeNull();
    expect(container.textContent).toContain("Company Name");
    expect(queryByRole("list")).toBeNull();
  });

  it("renders the supplied rights line verbatim", () => {
    const text = "© Composition Hospitality 2017, All Rights Reserved";
    const { container } = render(Footer, { text });
    expect(container.textContent).toContain(text);
  });

  it("renders a labelled, new-tab link per known social network", () => {
    const { getByLabelText } = render(Footer, {
      socials: [
        { network: "facebook", href: "https://fb.com/x" },
        { network: "instagram", href: "https://ig.com/x" },
      ],
    });
    const fb = getByLabelText("Facebook");
    expect(fb.getAttribute("href")).toBe("https://fb.com/x");
    expect(fb.getAttribute("target")).toBe("_blank");
    expect(fb.getAttribute("rel")).toBe("noopener noreferrer");
    expect(getByLabelText("Instagram")).toBeTruthy();
  });

  it("aliases linkedin-company to the LinkedIn icon", () => {
    const { getByLabelText } = render(Footer, {
      socials: [{ network: "linkedin-company", href: "https://lnkd.in/x" }],
    });
    expect(getByLabelText("LinkedIn")).toBeTruthy();
  });

  it("drops unknown networks and prototype-chain member names", () => {
    const { container } = render(Footer, {
      socials: [
        { network: "myspace" },
        { network: "toString" },
        { network: "constructor" },
        { network: "__proto__" },
      ],
    });
    // None are real networks → no list is rendered and nothing throws.
    expect(container.querySelector("ul")).toBeNull();
  });

  it("renders a hrefless social as a non-interactive glyph, not a dead link", () => {
    const { getByLabelText, container } = render(Footer, {
      socials: [{ network: "youtube" }],
    });
    const yt = getByLabelText("YouTube");
    // No <a> (a href="#" would be a dead link); a labelled role=img span instead.
    expect(yt.tagName).toBe("SPAN");
    expect(yt.getAttribute("role")).toBe("img");
    expect(container.querySelector("a")).toBeNull();
    // The brand glyph still renders.
    expect(container.querySelector("svg")).toBeTruthy();
  });

  // --- beachfront chrome (wave + ink columns) ---

  // Mirrors the real src/lib/blux/site-config.json footer.columns: services +
  // payment links, office hours (plain text), phone/address/reviews/directions.
  const beachfrontColumns = [
    {
      items: [
        { text: "Your First Visit", href: "/your-first-visit" },
        { text: "Our Team", href: "/our-team" },
        { text: "Services", href: "/services" },
        { text: "Ask the Doctor", href: "/ask-the-doctor" },
        {
          text: "Make a Payment",
          href: "https://app.modento.io/beachfront-dentistry",
        },
      ],
    },
    {
      items: [
        { text: "OFFICE HOURS" },
        { text: "Monday - Thursday / 7am - 5pm" },
        { text: "Friday / 7am - 2pm" },
      ],
    },
    {
      items: [
        { text: "(310) 378-9241", href: "tel:+13103789241" },
        { text: "1706 S Elena Ave. Suite B" },
        { text: "Redondo Beach, CA 90277" },
        {
          text: "Yelp Reviews",
          href: "https://www.yelp.com/biz/beachfront-dentistry-redondo-beach",
        },
        {
          text: "Get Directions",
          href: "https://maps.app.goo.gl/u3xjEEDSV9KmAnMq9",
        },
      ],
    },
  ];

  it("renders the OFFICE HOURS heading and address lines as plain text", () => {
    const { getByText } = render(Footer, {
      props: { columns: beachfrontColumns },
    });
    expect(getByText("OFFICE HOURS")).toBeTruthy();
    expect(getByText("1706 S Elena Ave. Suite B")).toBeTruthy();
    expect(getByText("Redondo Beach, CA 90277")).toBeTruthy();
  });

  it("renders the Modento payment link", () => {
    const { getByRole } = render(Footer, {
      props: { columns: beachfrontColumns },
    });
    const link = getByRole("link", { name: "Make a Payment" });
    expect(link.getAttribute("href")).toBe(
      "https://app.modento.io/beachfront-dentistry",
    );
  });

  // The fade this pill used to take, hover:opacity-60, made its label harder
  // to read on hover; the hover fill has to leave the label at AA too.
  it("the payment pill's label clears AA on the footer canvas at rest and on hover", () => {
    const { container, getByRole } = render(Footer, {
      props: { columns: beachfrontColumns },
    });
    const ground = rgbOf(
      container.querySelector("footer")!.style.backgroundColor,
    );
    const { rest, hover } = labelContrast(
      getByRole("link", { name: "Make a Payment" }).className,
      ground,
    );
    expect(rest, "at rest").toBeGreaterThanOrEqual(4.5);
    expect(hover, "on hover").toBeGreaterThanOrEqual(4.5);
  });

  it("renders a wave divider at the footer's top edge", () => {
    const { container } = render(Footer, {
      props: { columns: beachfrontColumns },
    });
    const wave = container.querySelector("[aria-hidden='true'] svg");
    expect(wave).toBeTruthy();
  });

  it("wave fill defaults to the footer canvas and is overridable via waveFill", () => {
    const light = render(Footer, { props: { columns: beachfrontColumns } });
    // Defaults to the footer's own pale-teal canvas so the wave reads as its
    // top edge dipping into whatever band sits above.
    const canvas =
      light.container.querySelector("footer")!.style.backgroundColor;
    expect(canvas).not.toBe("");
    const fill = document.createElement("i");
    fill.style.color =
      light.container.querySelector("path")?.getAttribute("fill") ?? "";
    expect(fill.style.color).toBe(canvas);
    cleanup();

    // A page ending in a dark band passes its own fill through.
    const dark = render(Footer, {
      props: { columns: beachfrontColumns, waveFill: "var(--color-dark)" },
    });
    expect(dark.container.querySelector("path")?.getAttribute("fill")).toBe(
      "var(--color-dark)",
    );
  });
});
