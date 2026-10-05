import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/svelte";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import Field from "./Field.svelte";

afterEach(() => cleanup());

type Rgb = [number, number, number];
const WHITE: Rgb = [255, 255, 255];

/** `#rgb` or `#rrggbb` as sRGB. */
const fromHex = (hex: string): Rgb => {
  const full = hex.length === 4 ? hex.replace(/[0-9a-f]/gi, "$&$&") : hex;
  return [1, 3, 5].map((i) => parseInt(full.slice(i, i + 2), 16)) as Rgb;
};

/** CSS `oklch(L% C H)` as sRGB, clipped to the gamut. */
function fromOklch(l: number, c: number, h: number): Rgb {
  const [a, b] = [Math.cos, Math.sin].map((f) => c * f((h * Math.PI) / 180));
  const [lms, mms, sms] = [
    l + 0.3963377774 * a + 0.2158037573 * b,
    l - 0.1055613458 * a - 0.0638541728 * b,
    l - 0.0894841775 * a - 1.291485548 * b,
  ].map((v) => v ** 3);
  return [
    4.0767416621 * lms - 3.3077115913 * mms + 0.2309699292 * sms,
    -1.2684380046 * lms + 2.6097574011 * mms - 0.3413193965 * sms,
    -0.0041960863 * lms - 0.7034186147 * mms + 1.707614701 * sms,
  ].map((v) => {
    const x = Math.min(1, Math.max(0, v));
    return 255 * (x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055);
  }) as Rgb;
}

/** Every `--color-*` in a CSS text whose value is a hex, white/black or oklch(). */
function colourTokens(css: string): Record<string, Rgb> {
  const out: Record<string, Rgb> = {};
  for (const m of css.matchAll(
    /--color-([a-z0-9-]+):\s*(?:(#[0-9a-f]{3}(?:[0-9a-f]{3})?)|(white|black)|oklch\(([\d.]+)%\s+([\d.]+)\s+([\d.]+|none)\))\s*;/gi,
  )) {
    out[m[1]] = m[2]
      ? fromHex(m[2])
      : m[3]
        ? fromHex(m[3] === "white" ? "#ffffff" : "#000000")
        : fromOklch(
            Number(m[4]) / 100,
            Number(m[5]),
            m[6] === "none" ? 0 : Number(m[6]),
          );
  }
  return out;
}

/** The colours a class can name: Tailwind's default palette, overridden by
 *  app.css's `@theme` block (cwd-relative: under jsdom `import.meta.url` is not
 *  a file: URL). */
const THEME: Record<string, Rgb> = (() => {
  const read = (path: string) =>
    readFileSync(resolve(process.cwd(), path), "utf8");
  const app = read("src/app.css");
  return {
    ...colourTokens(read("node_modules/tailwindcss/theme.css")),
    ...colourTokens(/@theme\s*\{([\s\S]*?)\n\}/.exec(app)?.[1] ?? ""),
  };
})();

/** A `border-<colour>[/<alpha>]` class's colour as painted over white: a named
 *  colour or an arbitrary `border-[#rrggbb]`. Anything else is not a colour. */
function borderColour(cls: string): Rgb | undefined {
  const m =
    /^border-(?:\[(#[0-9a-f]{3}(?:[0-9a-f]{3})?)\]|([a-z][a-z0-9-]*))(?:\/(\d+))?$/i.exec(
      cls,
    );
  if (!m) return undefined;
  const rgb = m[1] ? fromHex(m[1]) : THEME[m[2]];
  if (!rgb) return undefined;
  const alpha = m[3] === undefined ? 1 : Number(m[3]) / 100;
  return rgb.map((v) => alpha * v + (1 - alpha) * 255) as Rgb;
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

describe("Field", () => {
  it("renders a label associated with the input", () => {
    const { getByLabelText } = render(Field, { name: "email", label: "Email" });
    const input = getByLabelText("Email") as HTMLInputElement;
    expect(input).toBeTruthy();
    expect(input.tagName).toBe("INPUT");
    expect(input.name).toBe("email");
  });

  it("marks required fields with aria + visible indicator", () => {
    const { getByLabelText, getByText } = render(Field, {
      name: "email",
      label: "Email",
      required: true,
    });
    const input = getByLabelText(/Email/) as HTMLInputElement;
    expect(input.required).toBe(true);
    expect(getByText("(required)")).toBeTruthy();
  });

  it("links description via aria-describedby", () => {
    const { getByLabelText, getByText } = render(Field, {
      name: "email",
      label: "Email",
      description: "We never share it.",
    });
    const input = getByLabelText("Email") as HTMLInputElement;
    const description = getByText("We never share it.");
    expect(input.getAttribute("aria-describedby")).toContain(description.id);
  });

  it("links error via aria-describedby and sets aria-invalid", () => {
    const { getByLabelText, getByRole } = render(Field, {
      name: "email",
      label: "Email",
      error: "Required",
    });
    const input = getByLabelText("Email") as HTMLInputElement;
    const alert = getByRole("alert");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.getAttribute("aria-describedby")).toContain(alert.id);
    expect(alert.textContent).toBe("Required");
  });

  // Modal.svelte finds its initial-focus target by `[autofocus]`; without one
  // a dialog opens on its own ✕. Opt-in, and off by default so no page ever
  // grabs focus on load by accident.
  it("carries no autofocus attribute unless asked", () => {
    const { getByLabelText } = render(Field, { name: "email", label: "Email" });
    expect(
      (getByLabelText("Email") as HTMLInputElement).hasAttribute("autofocus"),
    ).toBe(false);
  });

  it("marks the control as the dialog's focus target when autofocus is set", () => {
    const { getByLabelText } = render(Field, {
      name: "name",
      label: "Name",
      autofocus: true,
    });
    expect(
      (getByLabelText("Name") as HTMLInputElement).hasAttribute("autofocus"),
    ).toBe(true);
  });

  it("draws a resting border that clears the 3:1 non-text minimum on the white card", () => {
    // WCAG 1.4.11. `--color-light` (#fafafa) measured 1.04:1 here — the
    // inputs were invisible boxes — and the input and the textarea had to be
    // fixed separately, so both are measured.
    for (const type of ["text", "textarea"] as const) {
      const { getByLabelText, unmount } = render(Field, {
        name: "a",
        label: "A",
        type,
      });
      const cls = getByLabelText("A").getAttribute("class") ?? "";
      unmount();
      const borders = cls
        .split(/\s+/)
        .filter((c) => !c.includes(":"))
        .map(borderColour)
        .filter((rgb): rgb is Rgb => rgb !== undefined);
      expect(borders, `the ${type}'s resting border colour`).not.toEqual([]);
      for (const rgb of borders) {
        expect(contrast(rgb, WHITE), type).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it("gives the textarea the input's focus indicator, forced-colors fallback included", () => {
    // The browser tests only ever focus the input; the textarea is a separate
    // element that has taken one-sided fixes before. In Tailwind v4
    // `outline-none` resolves to `outline-style: none`, which takes the
    // forced-colors outline with it — the only focus affordance left there.
    const classes = (type: "text" | "textarea") => {
      const { getByLabelText, unmount } = render(Field, {
        name: "a",
        label: "A",
        type,
      });
      const cls = (getByLabelText("A").getAttribute("class") ?? "").split(
        /\s+/,
      );
      unmount();
      return cls;
    };
    const focus = (cls: string[]) =>
      cls.filter((c) => /^focus(-visible|-within)?:/.test(c));
    const [input, textarea] = [classes("text"), classes("textarea")];
    expect(focus(textarea)).toEqual(expect.arrayContaining(focus(input)));
    for (const cls of [input, textarea]) {
      expect(cls.filter((c) => /(^|:)outline-none$/.test(c))).toEqual([]);
    }
  });

  it("renders a textarea when type=textarea", () => {
    const { getByLabelText } = render(Field, {
      name: "msg",
      label: "Message",
      type: "textarea",
    });
    const textarea = getByLabelText("Message") as HTMLTextAreaElement;
    expect(textarea.tagName).toBe("TEXTAREA");
  });
});
