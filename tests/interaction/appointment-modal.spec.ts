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
