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

async function openMenu(page: import("@playwright/test").Page) {
  await page.goto("/", { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.click('button[aria-label="Open menu"]');
  await page.waitForSelector('[role="dialog"]', { state: "visible" });
  // fly comes from $lib/transitions: reduced motion (forced by the shared
  // playwright config) collapses it to 0ms — two frames settle everything.
  await page.evaluate(settle);
}

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
