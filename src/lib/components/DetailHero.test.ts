import { render, cleanup } from "@testing-library/svelte";
import { describe, it, expect, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import DetailHero from "./DetailHero.svelte";

afterEach(() => cleanup());

// The detail-hero breadcrumb sits over each page's own photo. White text on
// the cyan wash alone measured below AA on every sampled article and service
// (worst 1.47:1, where it crossed a light face, sand or sea), and no shadow
// fixed it, because the photo still shows through. So the crumb carries its
// own opaque backing (the operator, 2026-11-20, the workspace decision
// 2026-11-20-2308-beachfront-detail-crumb-contrast). What this asserts is the
// property, not the colour: the backing is opaque, so no photo can reach the
// text, and the text clears AA on it.

/** The theme's colours, read from app.css's `@theme` block. */
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

const hexRgb = (hex: string) =>
  [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as Rgb;

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

const BG =
  /^bg-(?:\[(#[0-9a-f]{6})([0-9a-f]{2})?\]|([a-z][a-z0-9-]*))(?:\/(\d+))?$/i;

/** A `bg-*` class's colour and alpha (a theme token or `[#rrggbb]`, with any
 *  `/<pct>`), or undefined when the utility is not a colour. */
function fill(utility: string) {
  const m = BG.exec(utility);
  const hex = m && (m[1] ?? THEME[m[3]]);
  if (!m || !hex) return undefined;
  const alpha =
    (m[2] ? parseInt(m[2], 16) / 255 : 1) *
    (m[4] === undefined ? 1 : Number(m[4]) / 100);
  return { rgb: hexRgb(hex), alpha };
}

/** Every background the crumb can show: its one unprefixed `bg-*` (two would
 *  leave the winner to CSS order, so that fails), plus any state variant
 *  (`hover:`, `focus-visible:`, `active:` …) that replaces it. An inline
 *  background or an `opacity-*` on the crumb or its wrapper would let the
 *  photo through, so either fails too. */
function backings(el: HTMLElement) {
  expect(
    el.style.background + el.style.backgroundColor,
    "no inline background",
  ).toBe("");
  for (const node of [el, el.parentElement!]) {
    const fades = node.className
      .split(/\s+/)
      .filter((c) => /(^|:)opacity-/.test(c));
    expect(fades, "no opacity class on the crumb or its wrapper").toEqual([]);
  }
  const classes = el.className.split(/\s+/);
  const base = classes.filter((c) => fill(c));
  expect(base, "exactly one base background").toHaveLength(1);
  const states = classes
    .filter((c) => c.includes(":") && BG.test(c.split(":").pop()!))
    .map((c) => ({ state: c, f: fill(c.split(":").pop()!) }));
  return [{ state: "rest", f: fill(base[0]) }, ...states];
}

/** The inline text colour (`#fff` or `rgb(…)`). */
function inkOf(el: HTMLElement): Rgb {
  const c = el.style.color;
  const m = /^rgb\((\d+), (\d+), (\d+)\)$/.exec(c);
  if (m) return [Number(m[1]), Number(m[2]), Number(m[3])];
  expect(c, "crumb has an inline colour").toMatch(/^#[0-9a-f]{3,6}$/i);
  const h =
    c.length === 4 ? "#" + [...c.slice(1)].map((x) => x + x).join("") : c;
  return hexRgb(h);
}

describe("DetailHero breadcrumb", () => {
  for (const [variant, props] of [
    [
      "single-link (no page uses it since 2026-11-23)",
      { label: "Ask the Doctor / View All Questions", href: "/ask-the-doctor" },
    ],
    ["plain (a service's)", { label: "Services / General Dentistry" }],
  ] as const) {
    it(`the ${variant} crumb has an opaque backing it clears AA on`, () => {
      const { getByText } = render(DetailHero, {
        props: { ...props, labelSize: "crumb" },
      });
      const crumb = getByText(props.label);
      for (const { state, f } of backings(crumb)) {
        expect(f, `${state}: a colour`).toBeDefined();
        expect(f!.alpha, `${state}: no photo shows through it`).toBe(1);
        expect(
          contrast(inkOf(crumb), f!.rgb),
          `${state}: text contrast`,
        ).toBeGreaterThanOrEqual(4.5);
      }
    });
  }

  // An article's crumb since 2026-11-23: "Ask the Doctor" as plain text and
  // only "View All Questions" as the link, both inside the one tag. The link
  // paints on the tag, so its own ink must clear AA on the tag's backing too,
  // and it must not bring a backing of its own that could differ.
  it("the split (an article's) crumb's tag and link both clear AA on an opaque backing", () => {
    const { container, getByRole } = render(DetailHero, {
      props: {
        label: "Ask the Doctor",
        linkLabel: "View All Questions",
        href: "/ask-the-doctor",
        labelSize: "crumb",
      },
    });
    const tag = container.querySelector<HTMLElement>(
      "[data-detail-label] > *",
    )!;
    const link = getByRole("link", { name: "View All Questions" });
    expect(tag.contains(link), "the link sits inside the tag").toBe(true);
    expect(
      link.className.split(/\s+/).filter((c) => fill(c.split(":").pop()!)),
      "the link has no backing of its own",
    ).toEqual([]);
    for (const { state, f } of backings(tag)) {
      expect(f, `${state}: a colour`).toBeDefined();
      expect(f!.alpha, `${state}: no photo shows through it`).toBe(1);
      for (const [what, el] of [
        ["category text", tag],
        ["link text", link],
      ] as const) {
        expect(
          contrast(inkOf(el), f!.rgb),
          `${state}: ${what} contrast`,
        ).toBeGreaterThanOrEqual(4.5);
      }
    }
  });
});
