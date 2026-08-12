import { expect, test } from "@playwright/test";

/**
 * The menu overlay's contrast, measured on the pixels a reader actually sees.
 *
 * This exists because `pages.spec.ts` structurally CANNOT catch it, twice over:
 *
 *  1. The overlay is closed on load, so axe never walks it. Every page in that
 *     suite audits a document in which this dialog does not exist.
 *  2. Even opened, axe's color-contrast rule gives up on a `background-image`
 *     ground — it can determine a background COLOUR, not a gradient composited
 *     over a photograph — and returns "incomplete", which is not a violation.
 *     The wash is exactly that: a 92%-opaque flat colour over /menu-beach.jpg.
 *
 * So the menu sat at 2.85-2.96:1 on white text — all nine links, at both
 * widths — through an a11y suite that was green, and through a design review.
 * The audit that finally surfaced it reported it as a defect of the two pills;
 * measuring showed it was the entire overlay.
 *
 * The mechanism here is the one the wash requires: rebuild `background-size:
 * cover` on a canvas, composite the wash over it at its real alpha, and take
 * the WORST pixel under each link's box. That is deliberately conservative —
 * the box includes padding where no glyph sits, so a real glyph's ground is
 * never worse than what this asserts.
 *
 * Failing this means the wash, the photo, or a link's type size moved. Do not
 * relax the thresholds; they are WCAG 2.1 AA (1.4.3), not a house preference.
 */

const WIDTHS = [390, 1440];

/** A press affordance has to be SEEN. 1.00 is literally invisible (fill equal
 *  to its ground); the two brand tones against each other measure 1.56-1.65,
 *  and 1.2 is the floor below which the pill has stopped being feedback. This
 *  is not a WCAG number — no criterion covers a decorative press fill — it is
 *  the property the fix was made for, and it is the one that silently inverts
 *  if the wash tone is ever changed without changing the pill with it. */
const MIN_PILL_VISIBILITY = 1.2;

type Row = {
  label: string;
  fontPx: number;
  worst: number;
  bold: boolean;
};

const measure = async () => {
  const lum = ([r, g, b]: number[]) => {
    const f = (c: number) => {
      c /= 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const ratio = (a: number[], b: number[]) => {
    const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
    return (x + 0.05) / (y + 0.05);
  };

  const dialog = document.querySelector<HTMLElement>('[role="dialog"]')!;
  const bg = getComputedStyle(dialog).backgroundImage;
  const m = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/)!;
  const washRGB = [Number(m[1]), Number(m[2]), Number(m[3])];
  const washA = m[4] === undefined ? 1 : Number(m[4]);
  const photoURL = (bg.match(/url\("([^"]+)"\)/) || [])[1];

  const W = dialog.clientWidth;
  const H = dialog.clientHeight;

  const img = new Image();
  img.src = photoURL;
  await img.decode();

  // `background-size: cover; background-position: 50%`, reproduced exactly.
  const scale = Math.max(W / img.naturalWidth, H / img.naturalHeight);
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const g = canvas.getContext("2d", { willReadFrequently: true })!;
  g.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
  const data = g.getImageData(0, 0, W, H).data;

  const composite = (x: number, y: number) => {
    const i = (W * y + x) << 2;
    return [0, 1, 2].map((k) =>
      Math.round(washRGB[k] * washA + data[i + k] * (1 - washA)),
    );
  };

  const white = [255, 255, 255];
  const rows: Row[] = [];
  for (const a of Array.from(dialog.querySelectorAll("a"))) {
    const label = (a.textContent || "").trim();
    if (!label) continue;
    const r = a.getBoundingClientRect();
    const cs = getComputedStyle(a);
    let worst = Infinity;
    for (
      let y = Math.max(0, Math.ceil(r.top));
      y < Math.min(H, r.bottom);
      y += 2
    ) {
      for (
        let x = Math.max(0, Math.ceil(r.left));
        x < Math.min(W, r.right);
        x += 2
      ) {
        const v = ratio(white, composite(x, y));
        if (v < worst) worst = v;
      }
    }
    rows.push({
      label: label.slice(0, 30),
      fontPx: parseFloat(cs.fontSize),
      bold: Number(cs.fontWeight) >= 700,
      worst: Math.round(worst * 100) / 100,
    });
  }

  // The Close button's press pill against the same ground.
  const pill = dialog.querySelector<HTMLElement>(
    '[aria-label="Close menu"] span span',
  );
  let pillRatio: number | null = null;
  let pillColour: string | null = null;
  if (pill) {
    const pr = pill.getBoundingClientRect();
    pillColour = getComputedStyle(pill).backgroundColor;
    const rgb = pillColour.match(/\d+/g)!.slice(0, 3).map(Number);
    const ground = composite(
      Math.min(W - 1, Math.max(0, Math.round(pr.left + pr.width / 2))),
      Math.min(H - 1, Math.max(0, Math.round(pr.top + pr.height / 2))),
    );
    pillRatio = Math.round(ratio(rgb, ground) * 100) / 100;
  }

  return { rows, pillRatio, pillColour, washRGB, washA };
};

for (const width of WIDTHS) {
  test(`the open menu holds AA on every link @${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    // Reduce, so nothing is sampled mid-fade — a half-opaque link would blend
    // toward the wash and report a spurious failure. It is also the honest
    // baseline: this is exactly the surface a motion-averse visitor gets.
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/", { waitUntil: "networkidle" });
    await page.getByLabel("Open menu").click();
    await expect(page.getByRole("dialog")).toBeVisible();

    const { rows, pillRatio, pillColour } = await page.evaluate(measure);

    // Guard the guard: if the overlay ever renders fewer links, a per-link loop
    // would pass vacuously.
    expect(rows.length, "links measured in the overlay").toBeGreaterThanOrEqual(
      9,
    );

    for (const r of rows) {
      // WCAG 2.1 AA 1.4.3: large text (>=24px, or >=18.66px bold) needs 3.0:1,
      // everything else 4.5:1. The mobile pill labels are 15px — the reason the
      // wash could not simply stay a lighter tone.
      const large = r.fontPx >= 24 || (r.bold && r.fontPx >= 18.66);
      const need = large ? 3.0 : 4.5;
      expect(
        r.worst,
        `"${r.label}" at ${r.fontPx}px needs ${need}:1 on the menu wash`,
      ).toBeGreaterThanOrEqual(need);
    }

    // The press pill must not be the ground it sits on. This is the assertion
    // that catches the coupling: darkening the wash to the pill's own colour
    // would leave every other assertion here green and the affordance gone.
    expect(
      pillRatio,
      `close-button press pill (${pillColour}) vs the wash`,
    ).not.toBeNull();
    expect(
      pillRatio!,
      `close-button press pill (${pillColour}) vs the wash`,
    ).toBeGreaterThanOrEqual(MIN_PILL_VISIBILITY);
  });
}
