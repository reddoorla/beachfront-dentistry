import { expect, test, type Page } from "@playwright/test";

// THE SCROLL REVEAL'S HIDDEN STATE BELONGS TO THE FIRST PAINT (app.css +
// app.html + animateIn + the `data-reveal` attributes in the slices).
//
// animateIn can only hide its targets from JS at hydration, which on a
// mid-range phone is most of a second after the browser has already painted
// them: the headline arrived, sat there, then dropped and vanished before
// drifting back — a page that looks like it is breaking. The fix is a CSS
// hidden state (`[data-reveal]` under `prefers-reduced-motion: no-preference`)
// that server-rendered markup carries, so the element is hidden before the
// first paint instead of after it, and animateIn's inline write becomes a
// byte-identical no-op.
//
// These tests used to INJECT `data-reveal` into the response HTML, because the
// attribute had not landed in the slices yet. It has, so they no longer inject:
// a test that fabricates its own subject cannot fail when the real markup is
// missing the attribute, which is the regression most worth catching. Every
// page below is asserted on what the server actually sends.

/** One page per template — the flash is a property of the template's above-fold
 *  markup, not of the content in it. */
const PAGES = [
  { path: "/", name: "home (video hero)" },
  { path: "/your-first-visit", name: "group-photo hero" },
  { path: "/our-team", name: "subpage hero" },
  { path: "/services", name: "subpage hero + category band" },
  { path: "/ask-the-doctor", name: "subpage hero + question grid" },
  { path: "/contact-us", name: "hand-built route" },
  { path: "/team-members/dr-robert-quan", name: "detail hero + headshot" },
  { path: "/services/invisalign", name: "detail hero + intro" },
];

/** Per-frame opacity of the FIRST server-hidden reveal target, sampled from
 *  before the first script the page ships.
 *
 *  The element reference is captured once and held: animateIn REMOVES
 *  `data-reveal` the moment it reveals, so re-querying the selector each frame
 *  would silently stop tracking exactly when the interesting part happens. */
async function traceFirstRevealTarget(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as { __trace: number[] };
    w.__trace = [];
    let held: Element | null = null;
    const t0 = performance.now();
    const tick = () => {
      held ??= document.querySelector("[data-reveal]");
      if (held) w.__trace.push(Number(getComputedStyle(held).opacity));
      if (performance.now() - t0 < 4000) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

for (const { path, name } of PAGES) {
  test(`${name} — the server ships a hidden above-fold target, and it never flashes (${path})`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });

    // 1. The attribute is in the SSR bytes, not added by hydration. Without
    //    this the opacity trace below could pass on a page that simply has no
    //    reveal target above the fold.
    const html = await (await page.request.get(path)).text();
    expect(
      (html.match(/data-reveal=""/g) ?? []).length,
      `${path} server-renders at least one hidden reveal target`,
    ).toBeGreaterThan(0);

    await traceFirstRevealTarget(page);
    await page.goto(path, { waitUntil: "networkidle" });

    await expect
      .poll(
        () =>
          page.evaluate(() => {
            const t = (window as unknown as { __trace: number[] }).__trace;
            return t.length > 5 && t[t.length - 1] === 1;
          }),
        { timeout: 6000, message: `${path}: the reveal never completed` },
      )
      .toBe(true);

    const trace: number[] = await page.evaluate(
      () => (window as unknown as { __trace: number[] }).__trace,
    );

    // Hidden from the very first frame the element exists in.
    expect(trace[0], `${path}: first painted frame`).toBe(0);
    // And never the other way round: no visible frame with a hidden frame after
    // it. That single assertion IS the "content paints, then vanishes" bug.
    const flashAt = trace.findIndex(
      (o, i) => i > 0 && trace[i - 1]! > 0.5 && o < 0.5,
    );
    expect(
      flashAt,
      `${path}: opacity went ${trace[flashAt - 1]} → ${trace[flashAt]} at frame ${flashAt}`,
    ).toBe(-1);
    expect(trace[trace.length - 1], `${path}: ends visible`).toBe(1);
  });
}

test("with scripting off, the same markup paints at full opacity", async ({
  browser,
}) => {
  // The whole hidden state is gated on a <noscript> style in app.html. A
  // browser that will never run the reveal must never be shown less content
  // than a crawler reading the SSR HTML gets.
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/", { waitUntil: "domcontentloaded" });

  const states = await page.evaluate(() =>
    Array.from(document.querySelectorAll("[data-reveal]")).map((el) => {
      const cs = getComputedStyle(el);
      return { opacity: cs.opacity, transform: cs.transform };
    }),
  );

  expect(states.length, "the page ships data-reveal markup").toBeGreaterThan(0);
  for (const s of states) {
    expect(s.opacity).toBe("1");
    expect(s.transform).toBe("none");
  }
  await context.close();
});

test("content still ends visible when the observer never fires", async ({
  page,
}) => {
  // Pre-hidden content depends on JS to ever appear, which is the price of the
  // fix and the reason every server-hidden target is paired with a `failSafe`.
  // Strip the one API the reveal is built on: animateIn must notice and show
  // the element rather than leave it at opacity 0 forever.
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.addInitScript(() => {
    // @ts-expect-error — removing a global on purpose
    delete window.IntersectionObserver;
  });
  await page.goto("/", { waitUntil: "networkidle" });

  await expect
    .poll(
      () =>
        page.evaluate(() =>
          Array.from(document.querySelectorAll("[data-reveal]")).length === 0
            ? "all revealed"
            : "still hidden",
        ),
      { timeout: 6000 },
    )
    .toBe("all revealed");
});

test("the failSafe rescues a target whose observer callback never runs", async ({
  page,
}) => {
  // The subtler failure the option exists for: IntersectionObserver EXISTS, is
  // constructed, and simply never calls back — a sandboxed review iframe, or a
  // background tab whose rAF is throttled to a stop. Nothing in the reveal path
  // can notice that on its own, so only the timer can end it.
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.addInitScript(() => {
    class DeadObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return [];
      }
      root = null;
      rootMargin = "";
      thresholds = [];
    }
    // @ts-expect-error — swapping in a deliberately inert implementation
    window.IntersectionObserver = DeadObserver;
  });
  await page.goto("/", { waitUntil: "networkidle" });

  // Assert on ONE known server-hidden element — the home hero wrapper — not on
  // "every `[data-reveal]`". Two facts make the broad version wrong:
  //
  //  * animateIn writes `data-reveal` ITSELF while an element is hidden
  //    (applyHidden), so after hydration the selector matches every hidden
  //    target, server-marked or not. It is not a marker of SSR origin.
  //  * Below-fold targets carry no `failSafe` by design, so with a dead
  //    observer they correctly stay hidden forever — nothing painted them
  //    visible, so there is nothing to rescue, and a blanket timer would
  //    pre-reveal content nobody has scrolled to.
  //
  // An earlier version of this assertion demanded every `[data-reveal]` clear
  // and failed on ~29 below-fold elements behaving exactly as intended.
  //
  // ABOVE_FOLD_REVEAL's failSafe is 2500ms; allow the frame after it.
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const el = document.querySelector("h1")?.parentElement;
          return el ? getComputedStyle(el).opacity : null;
        }),
      {
        timeout: 8000,
        message:
          "the home hero stayed hidden with a dead observer — its failSafe never fired",
      },
    )
    .toBe("1");
});
