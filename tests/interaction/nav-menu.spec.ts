import { test, expect } from "@playwright/test";

// ROUND H2 CONTRACT — the detail-hero label joins the shared content gutter,
// and the menu column lives in normal flow with its links centered.
//
// MarkUp thread bac4decb-8db3-43c9-b52c-7e06eb179f28 (team board pin #5):
// Tim's capture showed the menu's last items (Make Payment) below the fold
// with no way to scroll. Triage found the dialog DOES scroll today — but the
// links column was absolutely positioned (top-[10%]), i.e. its geometry was
// structurally detached from the scroll container, which is exactly the shape
// of bug that regresses silently. Thread 738ad46b-2b6d-4392-bc58-73e67df1e07e
// (pin #2): "never aligned correctly", operator decode 2026-08-11 — the
// team-member hero name aligns "horizontal[ly] to the content width". The
// menu LINKS stay horizontally centered (operator correction, same day:
// "nav should still have links centered like before") — H2 changed the
// column's STRUCTURE (normal flow), not its centered presentation.
//
// The shared content gutter (Nav.svelte's band, mx-auto max-w-[1400px] +
// px ladder): 20px @<768, 48px 768–991, 60px @>=992 with the 1400px cap —
// i.e. max(60, w/2 - 640) at lg → 80 @1440, 60 @1294/1354.
//
// NOTHING else in this repo could catch a regression here: the pixel gates
// run 1440/834/390 only — and at those exact widths the old lg:left-20 label
// agreed with the gutter (80/48/20), which is why "never aligned correctly"
// survived every gate round. The mismatch lives BETWEEN matrix widths
// (probed 80 vs 60 @1354/1294), and the menu only exists after a click.

const gutter = (w: number) =>
  w >= 992 ? Math.max(60, w / 2 - 640) : w >= 768 ? 48 : 20;

const settle = () =>
  new Promise((r) =>
    requestAnimationFrame(() => requestAnimationFrame(() => r(0))),
  );

// These layout contracts are about the menu's RESTING geometry, so they run
// with motion off — the overlay is then painted complete on the first frame
// and two frames settle everything.
//
// `emulateMedia`, NOT the config. playwright.config.ts sets
// `use: { reducedMotion: "reduce" }`, and that option does not reach the page
// in this Playwright/Chromium: probed 2026-08-12, `matchMedia("(prefers-
// reduced-motion: reduce)").matches` is FALSE under the config option at
// config, project AND file (`test.use`) level, and TRUE only after an explicit
// `page.emulateMedia()`. Everything in this repo that believed it ran reduced
// was running with motion on. It never showed because the overlay's transition
// was dead (see the MENU OVERLAY MOTION block below); the moment it started
// animating, the old two-frame settle began landing mid-cascade and reading a
// scrollHeight 22px tall — the rows' own fly offset.
async function openMenu(page: import("@playwright/test").Page) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/", { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.click('button[aria-label="Open menu"]');
  await page.waitForSelector('[role="dialog"]', { state: "visible" });
  await page.evaluate(settle);
}

const DIALOG = '[role="dialog"]';
const LINKS = `${DIALOG} nav[aria-label="Menu links"] a`;

/** Per-link opacity + vertical offset, the two channels `fly` drives. */
const columnState = (page: import("@playwright/test").Page) =>
  page.evaluate((sel) => {
    return [...document.querySelectorAll<HTMLElement>(sel)].map((a) => {
      const cs = getComputedStyle(a);
      const m = /matrix\(1, 0, 0, 1, -?[\d.]+, (-?[\d.]+)\)/.exec(cs.transform);
      return {
        text: a.textContent?.trim() ?? "",
        opacity: Number(cs.opacity),
        dy: cs.transform === "none" ? 0 : m ? parseFloat(m[1]!) : NaN,
      };
    });
  }, LINKS);

/** Resolves once the LAST row of the cascade has landed — it is the one that
 *  finishes last, so its resting state is the whole column's settle signal.
 *  Polling the DOM beats waiting out 750ms of wall clock, and beats watching
 *  getAnimations(): Svelte runs a delayed transition as TWO animations (a
 *  delay-phase placeholder whose completion creates the real one), so there is
 *  a frame between them where "every animation is finished" is true and the
 *  cascade has not started. */
const settleColumn = (page: import("@playwright/test").Page) =>
  page.waitForFunction((sel) => {
    const links = document.querySelectorAll<HTMLElement>(sel);
    const last = links[links.length - 1];
    if (!last) return false;
    const cs = getComputedStyle(last);
    return cs.opacity === "1" && cs.transform === "none";
  }, LINKS);

// --- menu links are horizontally centered ("like before") ---
for (const vp of [
  { width: 1440, height: 900 },
  { width: 834, height: 1000 },
  { width: 390, height: 844 },
]) {
  test(`menu links are horizontally centered @${vp.width}`, async ({
    page,
  }) => {
    await page.setViewportSize(vp);
    await openMenu(page);
    const centers = await page.evaluate(() => {
      const nav = document.querySelector('nav[aria-label="Menu links"]')!;
      return [...nav.querySelectorAll("a")].map((a) => {
        const r = a.getBoundingClientRect();
        return r.x + r.width / 2;
      });
    });
    expect(centers.length).toBeGreaterThan(0);
    for (const c of centers) expect(Math.abs(c - vp.width / 2)).toBeLessThan(1);
  });
}

// --- normal flow: the structural fix pin #5 demanded ---
test("menu column is in normal flow inside the scrolling dialog", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openMenu(page);
  const s = await page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"]') as HTMLElement;
    const nav = dialog.querySelector(
      'nav[aria-label="Menu links"]',
    ) as HTMLElement;
    return {
      navPosition: getComputedStyle(nav).position,
      dialogOverflowY: getComputedStyle(dialog).overflowY,
    };
  });
  // Absolute positioning is what let the column's geometry detach from the
  // scroll container in the first place.
  expect(s.navPosition).toBe("static");
  expect(s.dialogOverflowY).toBe("auto");
});

// --- scroll contract: every item reachable at short viewports ---
for (const vp of [
  { width: 1280, height: 700 }, // short desktop (Tim's fold complaint shape)
  { width: 390, height: 660 }, // short mobile
]) {
  test(`short viewport ${vp.width}x${vp.height}: last menu item reachable by scrolling`, async ({
    page,
  }) => {
    await page.setViewportSize(vp);
    await openMenu(page);
    const r = await page.evaluate((h) => {
      const dialog = document.querySelector('[role="dialog"]') as HTMLElement;
      const links = dialog.querySelectorAll('nav[aria-label="Menu links"] a');
      const last = links[links.length - 1] as HTMLElement;
      const scrollable = dialog.scrollHeight > dialog.clientHeight;
      dialog.scrollTop = dialog.scrollHeight;
      const rect = last.getBoundingClientRect();
      return {
        scrollable,
        lastText: last.textContent?.trim(),
        lastTop: rect.top,
        lastBottom: rect.bottom,
        viewportH: h,
      };
    }, vp.height);
    // The column overflows these short viewports by design (90px pitch)…
    expect(r.scrollable).toBe(true);
    // …and scrolling the dialog brings the last item fully into view.
    expect(r.lastText).toBe("Make a Payment");
    expect(r.lastTop).toBeGreaterThanOrEqual(0);
    expect(r.lastBottom).toBeLessThanOrEqual(vp.height + 1);
  });
}

// --- Tim's capture size: everything fits with NO scroll at 1354x930 ---
test("1354x930 (the pin's capture size): whole menu fits without scrolling", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1354, height: 930 });
  await openMenu(page);
  const r = await page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"]') as HTMLElement;
    const links = dialog.querySelectorAll('nav[aria-label="Menu links"] a');
    const last = links[links.length - 1].getBoundingClientRect();
    return {
      scrollH: dialog.scrollHeight,
      clientH: dialog.clientHeight,
      lastBottom: last.bottom,
    };
  });
  expect(r.scrollH).toBeLessThanOrEqual(r.clientH);
  expect(r.lastBottom).toBeLessThanOrEqual(930);
});

// --- the DetailHero label joins the same gutter (thread 738ad46b… pin #2) ---
// 1354/1294 are the OFF-MATRIX widths where the old lg:left-20 sat 20px
// adrift; 1440 guards the cap-side value. Shared component — the team name,
// service crumb and question crumb all move together, so one route pins all
// three templates.
for (const w of [1440, 1354, 1294, 834, 390]) {
  test(`team-member hero name sits on the content gutter @${w}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: w, height: 900 });
    await page.goto("/team-members/dr-robert-quan", {
      waitUntil: "networkidle",
    });
    await page.evaluate(() => document.fonts.ready);
    const x = await page.evaluate(() => {
      const el = document.querySelector("[data-detail-label]");
      return el ? el.getBoundingClientRect().x : null;
    });
    expect(x).not.toBeNull();
    expect(Math.abs((x as number) - gutter(w))).toBeLessThan(1);
  });
}

// ===========================================================================
// MENU OVERLAY MOTION
//
// The overlay's entrance is a staggered cascade: the cyan wash cross-fades in
// over 300ms while each row of the column rises 22px over 300ms, 45ms apart,
// starting 90ms in (Nav.svelte's MENU_* constants). The exit is deliberately
// not the entrance reversed — the sheet leaves as one object in 170ms and the
// rows have no outro of their own.
//
// WHY THIS SUITE EXISTS: before this round the overlay's `transition:fly` was
// DEAD. Svelte transitions are local by default — they play when their own
// block is created, not when an ancestor's is — and both overlays sit one
// block deeper (`{#if useNavLinks}` / `{:else}`) than the `{#if isMenuOpen}`
// that toggles them. The directive parsed, type-checked, linted and shipped,
// and animated nothing: probed frame by frame, opacity was 1 and transform
// none from the first frame after the click. `|global` is what makes it run,
// and nothing but a motion-enabled probe can tell the two states apart —
// which is exactly why the whole rest of this file could not catch it (the
// shared playwright config forces `reducedMotion: reduce`, under which a dead
// transition and a correct one are indistinguishable by design).
//
// So every test below opts back INTO motion with emulateMedia.
// ===========================================================================

const STAGGER = 45; // Nav.svelte MENU_LINK_STAGGER
const RISE = 22; // Nav.svelte MENU_LINK_RISE

/** Click the trigger and read the very first frame from INSIDE the page.
 *  A `page.click()` followed by a separate `page.evaluate()` costs two round
 *  trips, and the first row starts moving 90ms in — on a loaded box the read
 *  can land after the cascade has begun. Clicking and sampling in one
 *  evaluate makes the frame-0 assertions deterministic on any hardware. */
async function openAndSampleFirstFrame(page: import("@playwright/test").Page) {
  return page.evaluate(
    async ([dialogSel, linkSel]) => {
      document
        .querySelector<HTMLButtonElement>('button[aria-label="Open menu"]')!
        .click();
      await new Promise((r) => requestAnimationFrame(r));
      const d = document.querySelector<HTMLElement>(dialogSel)!;
      const links = [...document.querySelectorAll<HTMLElement>(linkSel)];
      // 0 when the row has no animations at all — which is precisely the
      // reduced-motion state: $lib/transitions returns a config with no
      // css/tick, so Svelte creates nothing to animate.
      const preroll = (el: Element) =>
        el.getAnimations().reduce((max, a) => {
          const t = a.effect!.getComputedTiming();
          const dur = typeof t.duration === "number" ? t.duration : 0;
          return Math.max(max, (t.delay ?? 0) + dur);
        }, 0);
      return {
        washOpacity: Number(getComputedStyle(d).opacity),
        animationCount: d.getAnimations({ subtree: true }).length,
        rows: links.map((a) => {
          const cs = getComputedStyle(a);
          const m = /matrix\(1, 0, 0, 1, -?[\d.]+, (-?[\d.]+)\)/.exec(
            cs.transform,
          );
          return {
            text: a.textContent?.trim() ?? "",
            opacity: Number(cs.opacity),
            dy: cs.transform === "none" ? 0 : m ? parseFloat(m[1]!) : NaN,
            preroll: preroll(a),
          };
        }),
      };
    },
    [DIALOG, LINKS] as const,
  );
}

test("open: the overlay actually animates — wash mid-fade, every row held below its resting line", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/", { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);

  const first = await openAndSampleFirstFrame(page);

  // The wash + one animation per row. This single number is the regression
  // guard for the local-vs-global defect above: it was 0.
  expect(first.rows).toHaveLength(9);
  expect(first.animationCount).toBe(1 + first.rows.length);
  // The backdrop is mid-reveal, not already painted.
  expect(first.washOpacity).toBeGreaterThanOrEqual(0);
  expect(first.washOpacity).toBeLessThan(1);
  // Every row starts hidden and 22px low — none has popped into place.
  for (const row of first.rows) {
    expect(row.opacity).toBe(0);
    expect(row.dy).toBeCloseTo(RISE, 1);
  }
});

test("open: the rows cascade — each one is delayed exactly one step past the row above", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/", { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);

  const first = await openAndSampleFirstFrame(page);

  // Read the ladder off the animations' own timing rather than sampling
  // opacities on the wall clock, which would race the cascade. Svelte may
  // express a delayed transition either as a native `delay` or as a
  // delay-phase placeholder animation; `delay + duration` is a step ladder
  // under both, so this asserts the SHAPE (a cascade, one step per row)
  // without pinning the implementation.
  const prerolls = first.rows.map((r) => r.preroll);
  for (let i = 1; i < prerolls.length; i++) {
    expect(prerolls[i]! - prerolls[i - 1]!).toBeCloseTo(STAGGER, 1);
  }
  // …and a cascade, not nine simultaneous fades.
  expect(prerolls[prerolls.length - 1]!).toBeGreaterThan(prerolls[0]!);
});

test("close: the sheet leaves as one object — no per-row outro", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/", { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.click('button[aria-label="Open menu"]');
  await settleColumn(page);

  const exiting = await page.evaluate(
    async ([dialogSel, linkSel]) => {
      document
        .querySelector<HTMLButtonElement>('button[aria-label="Close menu"]')!
        .click();
      await new Promise((r) => requestAnimationFrame(r));
      const d = document.querySelector<HTMLElement>(dialogSel);
      if (!d) return null;
      return {
        washOpacity: Number(getComputedStyle(d).opacity),
        rows: [...document.querySelectorAll<HTMLElement>(linkSel)].map((a) => ({
          opacity: Number(getComputedStyle(a).opacity),
          transform: getComputedStyle(a).transform,
        })),
      };
    },
    [DIALOG, LINKS] as const,
  );

  expect(exiting).not.toBeNull();
  // The wash is on its way out…
  expect(exiting!.washOpacity).toBeLessThanOrEqual(1);
  // …while the rows are untouched: they ride the sheet out rather than
  // rewinding the 750ms cascade one by one.
  for (const row of exiting!.rows) {
    expect(row.opacity).toBe(1);
    expect(row.transform).toBe("none");
  }
  // And the overlay is gone — the 170ms outro is well inside this budget, which
  // is what lets trapFocus hand the trigger its focus back promptly.
  await page.waitForSelector(DIALOG, { state: "detached", timeout: 2000 });
});

test("prefers-reduced-motion: the menu opens instantly — no stagger, no movement", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/", { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);

  const first = await openAndSampleFirstFrame(page);

  // Fully painted on the first frame after the click: the $lib/transitions
  // wrappers zero duration AND delay. The delay half is what matters here —
  // app.css's global reduce reset (490-497) flattens durations only, so a
  // CSS-delay cascade would still have left the last row waiting ~450ms.
  expect(first.washOpacity).toBe(1);
  for (const row of first.rows) {
    expect(row.opacity).toBe(1);
    expect(row.dy).toBe(0);
    expect(row.preroll).toBe(0);
  }

  // Nothing is left running or pending afterwards either.
  await page.evaluate(settle);
  const pending = await page.evaluate(
    (sel) =>
      document
        .querySelector(sel)!
        .getAnimations({ subtree: true })
        .filter((a) => a.playState === "running" || a.playState === "paused")
        .length,
    DIALOG,
  );
  expect(pending).toBe(0);
});

// --- the hard-won layout contracts still hold once the motion has landed ----
// The cascade leaves each row's transform at `none`, so the resting geometry
// must be byte-for-byte what the reduced-motion tests above already pin. These
// re-run the same contracts with motion ON, after the column settles.

test("after the cascade settles: rows are centered and the column is still in normal flow", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/", { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.click('button[aria-label="Open menu"]');
  await settleColumn(page);

  const rows = await columnState(page);
  for (const row of rows) {
    expect(row.opacity).toBe(1);
    expect(row.dy).toBe(0);
  }

  const s = await page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"]') as HTMLElement;
    const nav = dialog.querySelector(
      'nav[aria-label="Menu links"]',
    ) as HTMLElement;
    const centers = [...nav.querySelectorAll("a")].map((a) => {
      const r = a.getBoundingClientRect();
      return r.x + r.width / 2;
    });
    return {
      navPosition: getComputedStyle(nav).position,
      dialogOverflowY: getComputedStyle(dialog).overflowY,
      centers,
    };
  });
  expect(s.navPosition).toBe("static");
  expect(s.dialogOverflowY).toBe("auto");
  for (const c of s.centers) expect(Math.abs(c - 1440 / 2)).toBeLessThan(1);
});

for (const vp of [
  { width: 1280, height: 700 },
  { width: 390, height: 660 },
]) {
  test(`after the cascade settles @${vp.width}x${vp.height}: "Make a Payment" is still reachable by scrolling`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.setViewportSize(vp);
    await page.goto("/", { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.click('button[aria-label="Open menu"]');
    await settleColumn(page);

    const r = await page.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"]') as HTMLElement;
      const links = dialog.querySelectorAll('nav[aria-label="Menu links"] a');
      const last = links[links.length - 1] as HTMLElement;
      const scrollable = dialog.scrollHeight > dialog.clientHeight;
      dialog.scrollTop = dialog.scrollHeight;
      const rect = last.getBoundingClientRect();
      return {
        scrollable,
        lastText: last.textContent?.trim(),
        lastTop: rect.top,
        lastBottom: rect.bottom,
      };
    });
    expect(r.scrollable).toBe(true);
    expect(r.lastText).toBe("Make a Payment");
    expect(r.lastTop).toBeGreaterThanOrEqual(0);
    expect(r.lastBottom).toBeLessThanOrEqual(vp.height + 1);
  });
}

test("after the cascade settles @1354x930: the whole menu still fits without scrolling", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 1354, height: 930 });
  await page.goto("/", { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.click('button[aria-label="Open menu"]');
  await settleColumn(page);

  const r = await page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"]') as HTMLElement;
    const links = dialog.querySelectorAll('nav[aria-label="Menu links"] a');
    const last = links[links.length - 1].getBoundingClientRect();
    return {
      scrollH: dialog.scrollHeight,
      clientH: dialog.clientHeight,
      lastBottom: last.bottom,
    };
  });
  expect(r.scrollH).toBeLessThanOrEqual(r.clientH);
  expect(r.lastBottom).toBeLessThanOrEqual(930);
});

// --- the stagger must never gate interactivity (hard requirement) ----------
// `fly` drives opacity + transform only, so a row is hit-testable and
// focusable from its first frame. This pins that: activate the LAST row —
// the one still 450ms from starting — at frame 0 and the menu must respond.

test("a row is clickable from its first frame, long before its own step starts", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 1354, height: 930 });
  await page.goto("/", { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);

  const hit = await page.evaluate(
    async ([linkSel]) => {
      document
        .querySelector<HTMLButtonElement>('button[aria-label="Open menu"]')!
        .click();
      await new Promise((r) => requestAnimationFrame(r));
      const links = [...document.querySelectorAll<HTMLElement>(linkSel)];
      const last = links[links.length - 1]!;
      const box = last.getBoundingClientRect();
      const atPoint = document.elementFromPoint(
        box.x + box.width / 2,
        box.y + box.height / 2,
      );
      last.focus();
      return {
        opacity: Number(getComputedStyle(last).opacity),
        hitTestReachesRow: last.contains(atPoint) || last === atPoint,
        focused: document.activeElement === last,
      };
    },
    [LINKS] as const,
  );

  // Invisible on this frame…
  expect(hit.opacity).toBe(0);
  // …yet already the hit-test target at its own coordinates, and focusable.
  expect(hit.hitTestReachesRow).toBe(true);
  expect(hit.focused).toBe(true);
});

test("Escape still closes the menu while the cascade is mid-flight", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/", { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.click('button[aria-label="Open menu"]');
  await page.waitForSelector(DIALOG, { state: "visible" });
  // No settle: press Escape while rows are still arriving.
  await page.keyboard.press("Escape");
  await page.waitForSelector(DIALOG, { state: "detached", timeout: 2000 });
  // Focus lands back on the re-mounted trigger.
  await expect(page.locator('button[aria-label="Open menu"]')).toBeFocused();
});
