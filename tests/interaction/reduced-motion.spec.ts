import { test, expect } from "@playwright/test";

// THE REDUCED-MOTION RESET COVERS DELAYS, NOT JUST DURATIONS (app.css).
//
// The reset used to zero `animation-duration`, `animation-iteration-count`,
// `transition-duration` and `scroll-behavior` — and nothing else. A component
// with a delay therefore became "wait the full delay, then pop", which is a
// worse experience than the motion it replaced for the exact person the
// accommodation exists to protect. The nav menu ships a 45ms-per-item cascade
// and the unused Animation/* components ship `delay-1000`.
//
// `emulateMedia`, NOT the config: playwright.config.ts no longer claims to set
// `reducedMotion`, because the option was probed and never reached the page.
// Every spec that needs the preference asks for it here.

const DIALOG = '[role="dialog"]';
const LINKS = `${DIALOG} nav[aria-label="Menu links"] a`;

/** Computed delay/duration of a throwaway element that asks for 1200ms of
 *  everything. Inline styles lose to the reset's `!important`, so this reads
 *  the reset itself rather than any component's intent. */
const delaysOf = (page: import("@playwright/test").Page) =>
  page.evaluate(() => {
    const el = document.createElement("div");
    el.style.transition = "opacity 1200ms";
    el.style.transitionDelay = "1200ms";
    el.style.animationName = "spin";
    el.style.animationDuration = "1200ms";
    el.style.animationDelay = "1200ms";
    document.body.appendChild(el);
    const cs = getComputedStyle(el);
    const out = {
      transitionDelay: cs.transitionDelay,
      transitionDuration: cs.transitionDuration,
      animationDelay: cs.animationDelay,
      animationDuration: cs.animationDuration,
    };
    el.remove();
    return out;
  });

test("reduced motion zeroes transition and animation DELAY, not only duration", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/", { waitUntil: "domcontentloaded" });

  const computed = await delaysOf(page);
  expect(computed.transitionDelay).toBe("0s");
  expect(computed.animationDelay).toBe("0s");
  // The two the reset always covered, asserted so a rewrite can't trade one
  // hole for another. 0.01ms serialises as 1e-05s.
  expect(computed.transitionDuration).toBe("1e-05s");
  expect(computed.animationDuration).toBe("1e-05s");
});

test("with motion on, the same element keeps every one of its 1200ms", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/", { waitUntil: "domcontentloaded" });

  const computed = await delaysOf(page);
  expect(computed.transitionDelay).toBe("1.2s");
  expect(computed.animationDelay).toBe("1.2s");
  expect(computed.transitionDuration).toBe("1.2s");
});

test("the nav cascade is fully landed on the first frame under reduced motion", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/", { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);

  // Click and read on the NEXT animation frame — not after a settle. Under
  // reduce there is nothing to settle: every row must already be at opacity 1
  // and offset 0. A row still mid-cascade here is a row whose delay survived.
  const firstFrame = await page.evaluate(async (sel) => {
    document
      .querySelector<HTMLButtonElement>('button[aria-label="Open menu"]')!
      .click();
    for (let i = 0; i < 3; i++) {
      await new Promise((r) => requestAnimationFrame(() => r(0)));
      if (document.querySelectorAll(sel).length > 0) break;
    }
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

  expect(firstFrame.length).toBeGreaterThan(4);
  for (const link of firstFrame) {
    expect(
      link.opacity,
      `"${link.text}" was still fading in on the first frame`,
    ).toBe(1);
    expect(
      link.dy,
      `"${link.text}" was still flying in on the first frame`,
    ).toBe(0);
  }
});
