import { test, expect, type Page } from "@playwright/test";

// THE SCROLL REVEAL'S HIDDEN STATE BELONGS TO THE FIRST PAINT (app.css +
// app.html + animateIn).
//
// animateIn can only hide its targets from JS at hydration, which on a
// mid-range phone is most of a second after the browser has already painted
// them: the headline arrived, sat there, then dropped and vanished before
// drifting back — a page that looks like it is breaking. The fix is a CSS
// hidden state (`[data-reveal]` under `prefers-reduced-motion: no-preference`)
// that server-rendered markup can carry, so the element is hidden before the
// first paint instead of after it, and animateIn's inline write becomes a
// byte-identical no-op.
//
// These tests inject `data-reveal` into the response HTML rather than reading
// it off a component: the attribute belongs beside each `use:animateIn` in the
// slices, which are other people's files. Injecting it here tests the
// MECHANISM against the real page, real CSS and real hydration, and keeps
// telling the truth once the attribute lands in the markup for real.

/** Mark the element that actually carries `use:animateIn` — the wrapper around
 *  the first `<h1>`. Marking the `<h1>` itself would hide an element no action
 *  will ever un-hide, which is the trap this whole contract has to avoid. */
async function markHeroReveal(page: Page) {
  await page.route("**/", async (route) => {
    if (route.request().resourceType() !== "document") return route.continue();
    const response = await route.fetch();
    const html = await response.text();
    const h1 = html.indexOf("<h1");
    const div = html.lastIndexOf("<div", h1);
    if (h1 < 0 || div < 0) return route.fulfill({ response });
    await route.fulfill({
      response,
      body: html.slice(0, div + 4) + " data-reveal" + html.slice(div + 4),
    });
  });
}

const revealTarget = "h1";

/** Per-frame opacity of the reveal wrapper, sampled from before the first
 *  script the page ships. Opacity is not inherited as a computed value, so
 *  this reads the WRAPPER — the element the reveal actually drives. */
async function traceOpacity(page: Page) {
  await page.addInitScript(() => {
    (window as unknown as { __trace: number[] }).__trace = [];
    const t0 = performance.now();
    const tick = () => {
      const el = document.querySelector("h1")?.parentElement;
      if (el) {
        (window as unknown as { __trace: number[] }).__trace.push(
          Number(getComputedStyle(el).opacity),
        );
      }
      if (performance.now() - t0 < 4000) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

test("a server-marked reveal target is hidden on its first painted frame and never after it", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await markHeroReveal(page);
  await traceOpacity(page);
  await page.goto("/", { waitUntil: "networkidle" });

  await page.waitForFunction(() => {
    const el = document.querySelector("h1")?.parentElement;
    return el ? getComputedStyle(el).opacity === "1" : false;
  });
  const trace: number[] = await page.evaluate(
    () => (window as unknown as { __trace: number[] }).__trace,
  );

  expect(trace.length).toBeGreaterThan(5);
  // Hidden from the very first frame the element exists in.
  expect(trace[0]).toBe(0);
  // And never the other way round: no frame is visible with a hidden frame
  // after it. That single assertion IS the "content paints, then vanishes" bug.
  const flashAt = trace.findIndex(
    (o, i) => i > 0 && trace[i - 1]! > 0.5 && o < 0.5,
  );
  expect(
    flashAt,
    `opacity went ${trace[flashAt - 1]} → ${trace[flashAt]} at frame ${flashAt}`,
  ).toBe(-1);
  expect(trace[trace.length - 1]).toBe(1);
  await page.unrouteAll({ behavior: "ignoreErrors" });
});

test("with scripting off, the same markup paints at full opacity", async ({
  browser,
}) => {
  // The whole hidden state is gated on a <noscript> style in app.html. A
  // browser that will never run the reveal must never be shown less content
  // than a crawler reading the SSR HTML gets.
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await markHeroReveal(page);
  await page.goto("/", { waitUntil: "domcontentloaded" });

  const state = await page.evaluate(() => {
    const el = document.querySelector("[data-reveal]");
    if (!el) return null;
    const cs = getComputedStyle(el);
    return { opacity: cs.opacity, transform: cs.transform };
  });

  expect(state, "the injected data-reveal element should exist").not.toBeNull();
  expect(state!.opacity).toBe("1");
  expect(state!.transform).toBe("none");
  expect(await page.locator(revealTarget).first().isVisible()).toBe(true);
  await page.unrouteAll({ behavior: "ignoreErrors" });
  await context.close();
});

test("content still ends visible when the observer never fires", async ({
  page,
}) => {
  // Pre-hidden content depends on JS to ever appear. Strip the one API the
  // reveal is built on: animateIn must notice and show the element in place
  // rather than leave it at opacity 0 forever.
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await markHeroReveal(page);
  await page.addInitScript(() => {
    // @ts-expect-error — removing a global on purpose
    delete window.IntersectionObserver;
  });
  await page.goto("/", { waitUntil: "networkidle" });

  const opacity = await page.evaluate(
    () =>
      getComputedStyle(document.querySelector("h1")!.parentElement!).opacity,
  );
  expect(opacity).toBe("1");
  expect(await page.locator("[data-reveal]").count()).toBe(0);
  await page.unrouteAll({ behavior: "ignoreErrors" });
});

test("under reduced motion nothing is ever hidden, marked or not", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await markHeroReveal(page);
  await page.goto("/", { waitUntil: "networkidle" });

  const state = await page.evaluate(() => {
    const el = document.querySelector("h1")!.parentElement!;
    return {
      opacity: getComputedStyle(el).opacity,
      marked: el.hasAttribute("data-reveal"),
    };
  });
  expect(state.opacity).toBe("1");
  // The CSS hidden state sits inside `no-preference`, and animateIn strips the
  // marker rather than leaving a stale one behind.
  expect(state.marked).toBe(false);
  await page.unrouteAll({ behavior: "ignoreErrors" });
});
