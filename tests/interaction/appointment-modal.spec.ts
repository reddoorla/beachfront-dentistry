import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";

// ===========================================================================
// THE BOOKING MODAL
//
// Four defects from the 2026-08 motion audit, all of them on the one flow this
// practice uses to take bookings. Every number below was probed on this build
// before the fix and is quoted as such — none is a guess.
//
//   A  The dialog had never been centred. Probed at 1440x900 its rect was
//      {x:16, y:0}: Tailwind preflight's `*{margin:0}` beats the UA's
//      `dialog{margin:auto}`, and the old `mx-4` restored the horizontal 16px
//      and nothing else. It also did not lock the page (a 600px wheel over the
//      open modal moved window.scrollY 0 → 600) and it landed focus on the ✕.
//   B  The submit button had transition-duration 0s and a hovered background
//      byte-identical to its resting one, and `disabled:opacity-60` made
//      "Sending…" the least readable state on the site (1.78:1).
//   C  The fields carried a #fafafa border — 1.04:1 on the white card.
//   D  The failure alert rendered between the last field and the submit button,
//      moving the button's top 416 → 498.
//
// NOTHING ELSE IN THIS REPO CAN CATCH THESE. The unit suites run in jsdom,
// which computes no layout, resolves no Tailwind and paints no pixels; the
// a11y suite never opens the modal. Centring, the scroll lock, contrast and
// the button's displacement are all measurements that need a real engine.
// ===========================================================================

const DIALOG = "dialog[open]";
const SUBMIT = 'dialog button[type="submit"]';

/** Click the info band's own "Request Appointment" — a real user path through
 *  the layout's delegated `a[href="#appointment"]` handler, not a store poke.
 *
 *  Retried rather than clicked once: that handler is installed on mount, so a
 *  click that lands before hydration follows the anchor as a plain hash link
 *  and no modal opens. Under `fullyParallel` with four workers that window is
 *  wide enough to hit — it produced exactly one failure in a loaded run and
 *  none in isolation, which is the signature to design out rather than rerun. */
async function openModal(page: Page) {
  const trigger = page.locator('[data-section="info"] a[href="#appointment"]');
  await expect(trigger).toBeVisible();
  await expect(async () => {
    if ((await page.locator(DIALOG).count()) === 0) await trigger.click();
    await expect(page.locator('dialog input[name="name"]')).toBeVisible({
      timeout: 1500,
    });
  }).toPass({ timeout: 15_000 });
  // The entrance is a 240ms CSS transition; let it land before measuring.
  await page.waitForTimeout(400);
}

async function gotoContact(page: Page) {
  await page.goto("/contact-us", { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
}

/** WCAG 2.x relative luminance + contrast, run in-page against COMPUTED
 *  colours, so the numbers are what the engine actually paints rather than
 *  what the class list implies. */
const CONTRAST_FN = `
  (function () {
    const parse = (c) => {
      const m = c.match(/[\\d.]+/g).map(Number);
      return [m[0], m[1], m[2]];
    };
    const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
    const L = (rgb) => 0.2126 * lin(rgb[0]) + 0.7152 * lin(rgb[1]) + 0.0722 * lin(rgb[2]);
    return function contrast(a, b) {
      const la = L(parse(a)), lb = L(parse(b));
      const hi = Math.max(la, lb), lo = Math.min(la, lb);
      return (hi + 0.05) / (lo + 0.05);
    };
  })()
`;

// ---------------------------------------------------------------------------
// A — centring
// ---------------------------------------------------------------------------

for (const vp of [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
]) {
  test(`the dialog is centred on both axes @${vp.width}x${vp.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(vp);
    await gotoContact(page);
    await openModal(page);

    const r = await page.evaluate(() => {
      const d = document.querySelector("dialog")!.getBoundingClientRect();
      return { x: d.x, y: d.y, width: d.width, height: d.height };
    });

    // The whole defect in one pair of numbers: this used to be {x:16, y:0}.
    expect(Math.abs(r.x + r.width / 2 - vp.width / 2)).toBeLessThan(1);
    expect(Math.abs(r.y + r.height / 2 - vp.height / 2)).toBeLessThan(1);
    // …and it still keeps a gutter rather than running edge to edge.
    expect(r.x).toBeGreaterThanOrEqual(15);
    expect(r.width).toBeLessThanOrEqual(Math.min(512, vp.width - 32) + 1);
  });
}

test("the page behind cannot scroll while the modal is open, on every close path", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await gotoContact(page);

  for (const path of ["escape", "backdrop", "close-button"] as const) {
    if (path !== "escape") await openModal(page);
    else await openModal(page);

    const anchored = await page.evaluate(() => window.scrollY);
    expect(await page.evaluate(() => document.body.style.overflow)).toBe(
      "hidden",
    );

    // Probed before the fix: this moved the document 0 → 600.
    await page.mouse.wheel(0, 600);
    await page.waitForTimeout(250);
    expect(await page.evaluate(() => window.scrollY)).toBe(anchored);

    if (path === "escape") await page.keyboard.press("Escape");
    else if (path === "backdrop")
      await page.evaluate(() =>
        (document.querySelector("dialog") as HTMLDialogElement).click(),
      );
    else await page.click('dialog button[aria-label="Close"]');

    await page.waitForTimeout(400);
    // A lock that outlives its modal is the worse bug: the page would be
    // permanently unscrollable. Assert the release, then prove it by scrolling.
    expect(await page.evaluate(() => document.body.style.overflow)).toBe("");
    expect(await page.evaluate(() => document.body.style.paddingRight)).toBe(
      "",
    );
    await page.mouse.wheel(0, 300);
    await page.waitForTimeout(250);
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(anchored);
    await page.evaluate(() => window.scrollTo(0, 0));
  }
});

test("the modal opens onto the Name field, and the ✕ is a real touch target", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await gotoContact(page);
  await openModal(page);

  const s = await page.evaluate(() => {
    const d = document.querySelector("dialog")!;
    const close = d.querySelector<HTMLElement>('button[aria-label="Close"]')!;
    const box = close.getBoundingClientRect();
    return {
      activeName: (document.activeElement as HTMLInputElement)?.name ?? null,
      activeIsCloseButton: document.activeElement === close,
      closeW: box.width,
      closeH: box.height,
    };
  });

  // It used to be the ✕ — the keyboard path to booking started on the exit.
  expect(s.activeIsCloseButton).toBe(false);
  expect(s.activeName).toBe("name");
  // WCAG 2.2 2.5.8 AA wants ≥24x24; the site's own icon controls are 44.
  expect(s.closeW).toBeGreaterThanOrEqual(44);
  expect(s.closeH).toBeGreaterThanOrEqual(44);
});

test("the panel and the scrim arrive and leave together", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await gotoContact(page);
  // Open and close once first. This test samples frame 0 from inside a single
  // evaluate — it cannot use openModal's retry — so the warm-up is what
  // guarantees the delegated opener is hydrated before the measured click.
  // @starting-style applies on every display:none → displayed transition, so
  // measuring the REopen is the same contract.
  await openModal(page);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(500);

  // Frame 0 of the entrance: @starting-style's pre-open frame, both channels.
  const first = await page.evaluate(async () => {
    document
      .querySelector<HTMLElement>(
        '[data-section="info"] a[href="#appointment"]',
      )!
      .click();
    await new Promise((r) => requestAnimationFrame(r));
    await new Promise((r) => requestAnimationFrame(r));
    const d = document.querySelector("dialog")!;
    return {
      opacity: Number(getComputedStyle(d).opacity),
      transform: getComputedStyle(d).transform,
      backdrop: getComputedStyle(d, "::backdrop").backgroundColor,
    };
  });
  // The old keyframe only touched the panel; the ::backdrop computed
  // `animation: none` and hard-cut straight to its full 0.5 alpha.
  expect(first.opacity).toBeLessThan(1);
  expect(first.transform).not.toBe("none");
  const firstAlpha = Number(
    first.backdrop.match(/rgba?\([^)]*?([\d.]+)\)$/)?.[1] ?? 1,
  );
  expect(firstAlpha).toBeLessThan(0.5);

  await page.waitForTimeout(500);
  const settled = await page.evaluate(() => {
    const d = document.querySelector("dialog")!;
    return {
      opacity: Number(getComputedStyle(d).opacity),
      transform: getComputedStyle(d).transform,
      backdrop: getComputedStyle(d, "::backdrop").backgroundColor,
    };
  });
  expect(settled.opacity).toBe(1);
  // `transform: translateY(0) scale(1)` computes to the identity matrix, not
  // to `none` — the rule is still declared, it has just landed.
  expect(settled.transform).toBe("matrix(1, 0, 0, 1, 0, 0)");
  expect(settled.backdrop).toBe("rgba(0, 0, 0, 0.5)");

  // The exit is the half that did not exist at all: one frame after ✕ the
  // dialog used to be `display:none` at `opacity:1`. `overlay` in the
  // transition list is what keeps it in the top layer long enough to be seen.
  const exiting = await page.evaluate(async () => {
    const d = document.querySelector("dialog") as HTMLDialogElement;
    d.querySelector<HTMLElement>('button[aria-label="Close"]')!.click();
    await new Promise((r) => requestAnimationFrame(r));
    await new Promise((r) => requestAnimationFrame(r));
    return { open: d.open, display: getComputedStyle(d).display };
  });
  expect(exiting.open).toBe(false);
  expect(exiting.display).not.toBe("none");

  await page.waitForTimeout(500);
  expect(
    await page.evaluate(
      () => getComputedStyle(document.querySelector("dialog")!).display,
    ),
  ).toBe("none");
});

test("prefers-reduced-motion: both the panel and the scrim collapse to nothing", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await gotoContact(page);
  await openModal(page);

  const collapsed = await page.evaluate(() => {
    const d = document.querySelector("dialog")!;
    const durations = (cs: CSSStyleDeclaration) =>
      cs.transitionDuration.split(",").map((s) => s.trim());
    return {
      panel: durations(getComputedStyle(d)),
      scrim: durations(getComputedStyle(d, "::backdrop")),
      panelProps: getComputedStyle(d).transitionProperty.split(",").length,
      scrimProps: getComputedStyle(d, "::backdrop").transitionProperty.split(
        ",",
      ).length,
      opacity: Number(getComputedStyle(d).opacity),
      backdrop: getComputedStyle(d, "::backdrop").backgroundColor,
    };
  });

  // THE POINT OF THIS TEST: app.css's reduce reset covers `*, *::before,
  // *::after` — which does NOT include `::backdrop`. Without the explicit
  // guard in Modal.svelte the scrim would keep its full 240ms ramp for a user
  // who asked for none, and nothing else in the repo would notice. Assert BOTH
  // lists, so dropping the guard fails here.
  //
  // Chromium serialises the collapsed 0.01ms as "1e-05s", so compare numbers,
  // not strings — 240ms would arrive as "0.24s" and fail this by 4 orders of
  // magnitude either way.
  const seconds = (v: string) =>
    v.endsWith("ms") ? Number(v.slice(0, -2)) / 1000 : Number(v.slice(0, -1));
  // Both still declare all four legs (opacity/transform or bg/filter, plus the
  // discrete display + overlay) — the durations are what collapsed, so
  // open/close stay functional and instant rather than being switched off.
  expect(collapsed.panelProps).toBe(4);
  expect(collapsed.scrimProps).toBe(4);
  for (const d of collapsed.panel)
    expect(seconds(d)).toBeLessThanOrEqual(0.001);
  for (const d of collapsed.scrim)
    expect(seconds(d)).toBeLessThanOrEqual(0.001);
  // Collapsed, not disabled: the modal is fully painted once open.
  expect(collapsed.opacity).toBe(1);
  expect(collapsed.backdrop).toBe("rgba(0, 0, 0, 0.5)");
});

// ---------------------------------------------------------------------------
// C — the fields
// ---------------------------------------------------------------------------

test("a resting field border is visible against the white card (≥3:1)", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await gotoContact(page);
  await openModal(page);
  // Nothing on screen in a focus state, so this is the RESTING border.
  await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
  await page.waitForTimeout(250);

  const measured = await page.evaluate((contrastSrc) => {
    const contrast = eval(contrastSrc) as (a: string, b: string) => number;
    const d = document.querySelector("dialog")!;
    const field = d.querySelector<HTMLElement>('input[name="email"]')!;
    const card =
      d.querySelector<HTMLElement>(".bg-white") ?? field.parentElement!;
    const border = getComputedStyle(field).borderTopColor;
    const bg = getComputedStyle(card).backgroundColor;
    return { border, bg, ratio: contrast(border, bg) };
  }, CONTRAST_FN);

  // `--color-light` (#fafafa) measured 1.04:1 here — the inputs were invisible
  // boxes on white. 3:1 is the WCAG 1.4.11 non-text minimum.
  expect(measured.ratio).toBeGreaterThanOrEqual(3);
});

test("focusing a field steps the border and the ring in together, over 150ms", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await gotoContact(page);
  await openModal(page);

  const before = await page.evaluate(() => {
    const cs = getComputedStyle(
      document
        .querySelector("dialog")!
        .querySelector<HTMLInputElement>('input[name="email"]')!,
    );
    return {
      border: cs.borderTopColor,
      transitionProperty: cs.transitionProperty,
      transitionDuration: cs.transitionDuration,
    };
  });

  await page.focus('dialog input[name="email"]');
  // The 150ms ramp is the feature; read the landed value, not frame 0.
  await page.waitForTimeout(300);

  const s = await page.evaluate(() => {
    const cs = getComputedStyle(
      document
        .querySelector("dialog")!
        .querySelector<HTMLInputElement>('input[name="email"]')!,
    );
    return { afterBorder: cs.borderTopColor, afterShadow: cs.boxShadow };
  });
  const combined = { before, ...s };

  // Probed before the fix: transition-duration 0s, and nothing about the
  // border changed on focus — the ring popped in with no ramp.
  expect(combined.before.transitionProperty).toContain("border-color");
  expect(combined.before.transitionProperty).toContain("box-shadow");
  expect(combined.before.transitionDuration).toBe("0.15s");
  expect(combined.afterBorder).not.toBe(combined.before.border);
  // --color-primary-deep, 5.10:1 on white. Plain --color-primary is 3.09:1,
  // i.e. it clears the non-text bar by 0.09 with nothing left for the ring's
  // own antialiasing.
  expect(combined.afterBorder).toBe("rgb(14, 119, 153)");
  expect(combined.afterShadow).toContain("rgb(14, 119, 153)");
});

test("forced-colors: the focus ring survives (outline-hidden, not outline-none)", async ({
  page,
}) => {
  await page.emulateMedia({ forcedColors: "active" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await gotoContact(page);
  await openModal(page);

  const outline = await page.evaluate(() => {
    const field = document
      .querySelector("dialog")!
      .querySelector<HTMLInputElement>('input[name="email"]')!;
    field.focus();
    const cs = getComputedStyle(field);
    return { style: cs.outlineStyle, width: cs.outlineWidth };
  });

  // Tailwind v4's `outline-none` resolves to `outline-style: none` and takes
  // the forced-colors fallback with it; `outline-hidden` keeps a 2px
  // transparent outline that the forced-colors palette repaints. Under
  // forced colours the box-shadow ring is dropped by the engine, so this
  // outline is the ONLY focus affordance left — which is the whole point.
  expect(outline.style).not.toBe("none");
});

// ---------------------------------------------------------------------------
// B + D — the submit button
// ---------------------------------------------------------------------------

test("the submit button acknowledges hover, press and focus", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await gotoContact(page);
  await openModal(page);

  const resting = await page.evaluate((sel) => {
    const cs = getComputedStyle(document.querySelector(sel)!);
    return {
      bg: cs.backgroundColor,
      transitionProperty: cs.transitionProperty,
      transitionDuration: cs.transitionDuration,
    };
  }, SUBMIT);
  // Probed before the fix: 0s, and hover === rest.
  expect(resting.transitionDuration).toBe("0.15s");
  expect(resting.transitionProperty).toContain("background-color");
  expect(resting.transitionProperty).toContain("transform");

  await page.hover(SUBMIT);
  await page.waitForTimeout(250);
  const hovered = await page.evaluate(
    (sel) => getComputedStyle(document.querySelector(sel)!).backgroundColor,
    SUBMIT,
  );
  expect(hovered).not.toBe(resting.bg);

  // Hover must DARKEN. The audit proposed `hover:bg-primary` (#129ecc), which
  // would have taken the white label to 3.09:1 — hovering the button would
  // have broken AA. Assert the direction, not just the difference.
  const ratios = await page.evaluate(
    ([rest, hover, contrastSrc]) => {
      const contrast = eval(contrastSrc) as (a: string, b: string) => number;
      return {
        rest: contrast("rgb(255,255,255)", rest),
        hover: contrast("rgb(255,255,255)", hover),
      };
    },
    [resting.bg, hovered, CONTRAST_FN] as const,
  );
  expect(ratios.hover).toBeGreaterThanOrEqual(ratios.rest);
  expect(ratios.hover).toBeGreaterThanOrEqual(4.5);

  // Keyboard users get a ring of the button's own. It has to arrive by TAB:
  // `:focus-visible` deliberately does not match a programmatic `.focus()` on
  // a button, so an el.focus() probe would report "no ring" on a button that
  // has one.
  await page.focus('dialog input[name="message"]');
  await page.keyboard.press("Tab");
  await page.waitForTimeout(250);
  const focused = await page.evaluate((sel) => {
    const b = document.querySelector<HTMLElement>(sel)!;
    return {
      isActive: document.activeElement === b,
      shadow: getComputedStyle(b).boxShadow,
    };
  }, SUBMIT);
  expect(focused.isActive).toBe(true);
  expect(focused.shadow).not.toBe("none");
});

test('"Sending…" stays readable — full-strength button, AA label, aria-busy', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await gotoContact(page);

  // Hold the POST open so the in-flight state can actually be measured.
  await page.route("**/contact-us**", async (route) => {
    if (route.request().method() !== "POST") return route.fallback();
    await new Promise((r) => setTimeout(r, 2500));
    await route.fulfill({
      status: 502,
      contentType: "application/json",
      body: JSON.stringify({
        type: "failure",
        status: 502,
        data: '[{"error":1},"We could not send that just now."]',
      }),
    });
  });

  await openModal(page);
  await page.fill('dialog input[name="name"]', "Casey Patient");
  await page.fill('dialog input[name="email"]', "casey@example.com");
  await page.fill('dialog input[name="phone"]', "3103789241");
  await page.click(SUBMIT, { noWaitAfter: true });
  await page.waitForTimeout(500);

  const sending = await page.evaluate(
    ([sel, contrastSrc]) => {
      const contrast = eval(contrastSrc) as (a: string, b: string) => number;
      const b = document.querySelector<HTMLButtonElement>(sel)!;
      const cs = getComputedStyle(b);
      return {
        label: b.textContent?.trim(),
        ariaBusy: b.getAttribute("aria-busy"),
        disabled: b.disabled,
        opacity: cs.opacity,
        ratio: contrast(cs.color, cs.backgroundColor),
      };
    },
    [SUBMIT, CONTRAST_FN] as const,
  );

  expect(sending.label).toBe("Sending…");
  // The state change has to reach a screen reader, not just mutate the name.
  expect(sending.ariaBusy).toBe("true");
  // AppointmentModal.test.ts pins the `disabled` attribute; only its STYLING
  // changed.
  expect(sending.disabled).toBe(true);
  // `disabled:opacity-60` composited the label to 1.78:1 against the faded
  // button — the least readable state on the site, at the exact moment the
  // user is waiting and deciding whether to click again.
  expect(sending.opacity).toBe("1");
  expect(sending.ratio).toBeGreaterThanOrEqual(4.5);
});

test("a failure lands above the fields and barely moves the submit button", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await gotoContact(page);

  await page.route("**/contact-us**", async (route) => {
    if (route.request().method() !== "POST") return route.fallback();
    await route.fulfill({
      status: 502,
      contentType: "application/json",
      body: JSON.stringify({
        type: "failure",
        status: 502,
        data: '[{"error":1},"We could not send that just now."]',
      }),
    });
  });

  await openModal(page);
  await page.fill('dialog input[name="name"]', "Casey Patient");
  await page.fill('dialog input[name="email"]', "casey@example.com");
  await page.fill('dialog input[name="phone"]', "3103789241");

  const before = await page.evaluate((sel) => {
    const d = document.querySelector("dialog")!;
    return {
      submitY: document.querySelector(sel)!.getBoundingClientRect().y,
      panelH: d.getBoundingClientRect().height,
    };
  }, SUBMIT);

  await page.click(SUBMIT);
  await page.waitForSelector('dialog [role="alert"]');
  await page.waitForTimeout(450);

  const after = await page.evaluate((sel) => {
    const d = document.querySelector("dialog")!;
    const alert = d.querySelector('[role="alert"]')!;
    const firstField = d.querySelector('input[name="name"]')!;
    const submit = document.querySelector(sel)!;
    const scroller = d.querySelector(".overflow-y-auto") as HTMLElement;
    const ar = alert.getBoundingClientRect();
    const sr = scroller.getBoundingClientRect();
    return {
      submitY: submit.getBoundingClientRect().y,
      panelH: d.getBoundingClientRect().height,
      // DOCUMENT_POSITION_FOLLOWING === the field comes AFTER the alert.
      alertPrecedesFields: !!(
        alert.compareDocumentPosition(firstField) &
        Node.DOCUMENT_POSITION_FOLLOWING
      ),
      alertPrecedesSubmit: !!(
        alert.compareDocumentPosition(submit) & Node.DOCUMENT_POSITION_FOLLOWING
      ),
      // …and it is inside the visible part of the panel's scroll container.
      alertVisible: ar.top >= sr.top - 1 && ar.bottom <= sr.bottom + 1,
    };
  }, SUBMIT);

  expect(after.alertPrecedesFields).toBe(true);
  expect(after.alertPrecedesSubmit).toBe(true);
  expect(after.alertVisible).toBe(true);

  // THE CONTRACT, stated honestly. The panel grows by the alert's height; a
  // CENTRED panel absorbs half of that growth upward, so the button below the
  // insertion point moves by exactly half — probed 82px before this round
  // (dialog pinned at y:0, so every pixel of growth went downward) and 41px
  // after. Zero is not reachable while the dialog is centred: it would need
  // the panel bottom-anchored, which contradicts the centring contract above.
  const growth = after.panelH - before.panelH;
  const moved = after.submitY - before.submitY;
  expect(growth).toBeGreaterThan(0);
  expect(Math.abs(moved - growth / 2)).toBeLessThanOrEqual(1);
  // Half of an 82px insertion is 41; anything approaching the old number means
  // the panel has stopped being centred.
  expect(moved).toBeLessThan(growth * 0.75);
});
