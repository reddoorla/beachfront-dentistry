import { test, expect, type Page } from "@playwright/test";

// TransitionOverlay contract — the white wash across a client navigation
// (src/lib/components/TransitionOverlay.svelte, mounted once in +layout.svelte).
//
// It was audited as the worst thing a patient meets on this site: measured at
// 1440x900, a navigation that committed at 247ms was covered from 17ms, opaque
// until 1309ms, and only gone at 1998ms — and because the sheet carried no
// `pointer-events-none`, `document.elementFromPoint` returned it for 1.27s of
// that, so tapping "Services" and then a service card silently lost the second
// tap. This suite pins the four properties the fix rests on:
//
//   1. the sheet is never in the way — `pointer-events: none` and never the
//      result of a hit test, at every frame it exists, so a tap during the wash
//      reaches the link under it;
//   2. it is a wash, not a cut — it arrives on an entrance animation instead of
//      appearing at full opacity in one frame;
//   3. the cover is bounded by the navigation it covers — what the component
//      adds on top of real latency is a fifth of a second, not one and three
//      quarters;
//   4. a second navigation during the wash gets ONE cover, lifted after the
//      LAST navigation. The first version never captured its `afterNavigate`
//      timer, so nav 1's hide fired mid-nav-2 and flashed the in-between page.
//
// Plus reduced motion, where the old sheet was at its worst: the out-fade
// collapsed but the 1050ms hold did not, so those users got the full-screen
// flash with none of the softening. The component now takes the same exit
// `shouldIntercept` gives PreNavTransition — no overlay at all.
//
// Motion is ON by default in this suite (playwright.config.ts no longer sets
// `reducedMotion`, having proved the option never reached the page), so the
// motion tests state it anyway and the reduced one emulates explicitly.
//
// Route choice: /team-members/stacey is short (2850px) and carries BOTH links
// this suite navigates with above the fold — "Back to Team" inside <main>, and
// the header logo, which is layout chrome and so survives a client navigation
// as the same element.

const OVERLAY = "[data-transition-overlay]";
const LOGO = 'nav a[href="/"]';
const START = "/team-members/stacey";
const FIRST = "/our-team"; // "Back to Team", in <main>
const SECOND = "/"; // the header logo, in <nav>

interface Sample {
  t: number;
  present: boolean;
  opacity: number;
  pointerEvents: string;
  ariaHidden: string | null;
  hitsCenter: boolean;
  hitsLogo: boolean;
  path: string;
}

interface Probe {
  /** ms durations of every animation running on the sheet at first paint. */
  durations: number[];
  /** Its opacity with those animations scrubbed to their midpoint. */
  midOpacity: number;
}

interface Recorder {
  __samples?: Sample[];
  __probe?: Probe;
}

const arrive = async (page: Page) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(START, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
};

/** Sample the sheet every frame for 6s. A client navigation never reloads the
 *  document, so one installation spans as many navigations as a test makes. */
const startRecording = (page: Page) =>
  page.evaluate(
    ([sel, logoSel]) => {
      const w = window as Window & Recorder;
      const out: Sample[] = [];
      w.__samples = out;
      const t0 = performance.now();
      const tick = () => {
        const el = document.querySelector(sel);
        const cs = el ? getComputedStyle(el) : null;
        const overlayAt = (x: number, y: number) => {
          const hit = document.elementFromPoint(x, y);
          return !!el && !!hit && (hit === el || el.contains(hit));
        };
        // The logo is the second navigation's target, so it is the point that
        // matters most; the viewport centre is the audit's own probe.
        const logo = document.querySelector(logoSel)?.getBoundingClientRect();
        out.push({
          t: Math.round(performance.now() - t0),
          present: !!el,
          opacity: cs ? parseFloat(cs.opacity) : 0,
          pointerEvents: cs ? cs.pointerEvents : "",
          ariaHidden: el ? el.getAttribute("aria-hidden") : null,
          hitsCenter: overlayAt(innerWidth / 2, innerHeight / 2),
          hitsLogo: logo
            ? overlayAt(logo.x + logo.width / 2, logo.y + logo.height / 2)
            : false,
          path: location.pathname,
        });
        if (performance.now() - t0 < 6000) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    },
    [OVERLAY, LOGO] as const,
  );

const samples = (page: Page) =>
  page.evaluate(() => (window as Window & Recorder).__samples ?? []);

/** Contiguous runs of frames in which the sheet existed. */
const covers = (all: Sample[]) => {
  const runs: { from: number; to: number; frames: Sample[] }[] = [];
  let open = false;
  for (const s of all) {
    if (!s.present) {
      open = false;
      continue;
    }
    if (open) {
      const run = runs[runs.length - 1]!;
      run.to = s.t;
      run.frames.push(s);
    } else {
      runs.push({ from: s.t, to: s.t, frames: [s] });
      open = true;
    }
  }
  return runs;
};

/** When the URL first became `path` — the navigation's real latency. */
const commitAt = (all: Sample[], path: string) =>
  all.find((s) => s.path === path)?.t;

/** Click a link from inside the page (no actionability wait), by href. */
const clickLink = (page: Page, href: string) =>
  page.evaluate((h) => {
    const a = [...document.querySelectorAll("a")].find(
      (el) =>
        el.getAttribute("href") === h && el.getBoundingClientRect().width > 0,
    );
    if (!a) throw new Error(`no visible link to ${h}`);
    a.click();
  }, href);

const gone = (page: Page) =>
  page.waitForFunction((sel) => !document.querySelector(sel), OVERLAY);

test("the wash is never in the way — pointer-events none, hidden from AT, never hit-tested", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await arrive(page);
  await startRecording(page);
  await clickLink(page, FIRST);

  // A real Playwright click, not a synthetic one: its actionability check
  // hit-tests the point and refuses to click through an intercepting element,
  // so this line is itself an assertion that the sheet lets a tap past. The
  // pre-fix overlay covered the logo for 1.3s and would time out here.
  await page.waitForFunction((sel) => !!document.querySelector(sel), OVERLAY);
  await page.click(LOGO);
  await expect(page).toHaveURL(/\/$/);

  await gone(page);
  const frames = (await samples(page)).filter((s) => s.present);
  expect(frames.length).toBeGreaterThan(0);
  for (const f of frames) {
    expect(f.pointerEvents).toBe("none");
    expect(f.ariaHidden).toBe("true");
    expect(f.hitsCenter).toBe(false);
    expect(f.hitsLogo).toBe(false);
  }
});

test("it washes in — an entrance animation, not a cut to white", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await arrive(page);

  // Armed in the page and fired on the first frame the sheet exists: the wash
  // is ~140ms long, which no round trip through the test runner can promise to
  // land inside. Reading the animation rather than racing opacity by wall clock
  // is the same reason review-mask.spec.ts scrubs instead of sleeping.
  await page.evaluate((sel) => {
    const w = window as Window & Recorder;
    const arm = () => {
      const el = document.querySelector(sel);
      const anims = el?.getAnimations() ?? [];
      if (!el || anims.length === 0) {
        requestAnimationFrame(arm);
        return;
      }
      const durations: number[] = [];
      for (const a of anims) {
        const d = a.effect?.getComputedTiming().duration;
        if (typeof d !== "number" || d === 0) continue;
        durations.push(d);
        a.pause();
        a.currentTime = d / 2;
      }
      w.__probe = {
        durations,
        midOpacity: parseFloat(getComputedStyle(el).opacity),
      };
    };
    requestAnimationFrame(arm);
  }, OVERLAY);
  await clickLink(page, FIRST);
  await page.waitForFunction(() => !!(window as Window & Recorder).__probe);

  const probe = (await page.evaluate(
    () => (window as Window & Recorder).__probe,
  ))!;
  // An entrance exists at all — a hard cut has no animation to find…
  expect(probe.durations.length).toBeGreaterThan(0);
  // …it is ~140ms: long enough to read as a wash, short enough to still be
  // washing while a 130-200ms navigation commits underneath it…
  expect(Math.min(...probe.durations)).toBeLessThanOrEqual(250);
  // …and halfway through it the sheet is genuinely translucent.
  expect(probe.midOpacity).toBeGreaterThan(0);
  expect(probe.midOpacity).toBeLessThan(1);
});

test("the cover is bounded by the navigation it covers", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await arrive(page);
  await startRecording(page);
  await clickLink(page, FIRST);
  await page.waitForFunction((sel) => !!document.querySelector(sel), OVERLAY);
  await gone(page);

  const all = await samples(page);
  const runs = covers(all);
  expect(runs).toHaveLength(1);
  const commit = commitAt(all, FIRST);
  expect(commit).toBeDefined();

  // What the component adds on top of the navigation's own latency: the 140ms
  // hold that lets the incoming route paint, plus the 320ms lift. Measured
  // against a production build that is 440ms (a 464ms cover over a 24ms nav)
  // and 441ms throttled to 4x CPU / Fast 3G; against the dev server, 453ms. It
  // was 1734ms before (a 1981ms cover over a 247ms nav).
  expect(runs[0]!.to - commit!).toBeLessThanOrEqual(700);
  // And the failsafe ceiling holds even for a navigation that never completes.
  expect(runs[0]!.to - runs[0]!.from).toBeLessThanOrEqual(3000);
});

test("a second navigation during the wash gets one cover, lifted after the last one", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await arrive(page);
  await startRecording(page);

  // Both clicks are dispatched in the page, the second on the very first frame
  // the sheet exists. (That the sheet does not block a REAL click is the first
  // test's job; this one is about the timer.)
  await page.evaluate(
    ([sel, a, b]) => {
      const link = (href: string) =>
        [...document.querySelectorAll("a")].find(
          (el) =>
            el.getAttribute("href") === href &&
            el.getBoundingClientRect().width > 0,
        );
      link(a)!.click();
      const arm = () => {
        if (document.querySelector(sel)) link(b)!.click();
        else requestAnimationFrame(arm);
      };
      requestAnimationFrame(arm);
    },
    [OVERLAY, FIRST, SECOND] as const,
  );

  await expect(page).toHaveURL(/\/$/);
  await gone(page);
  const all = await samples(page);
  const runs = covers(all);

  // One cover, not two: nav 1's hide timer was cleared when nav 2 started, so
  // the sheet never lifted in between and no stale timer survived to hide it
  // mid-swap.
  expect(runs).toHaveLength(1);
  // It lifted after the SECOND destination had arrived, not the first…
  expect(runs[0]!.frames.at(-1)!.path).toBe(SECOND);
  // …and on the SECOND navigation's clock: a fifth of a second after the swap,
  // not on a hold some earlier navigation scheduled.
  const commit = all.find((s) => s.path === SECOND);
  expect(commit).toBeDefined();
  expect(runs[0]!.to - commit!.t).toBeLessThanOrEqual(700);

  // The sheet must still be COVERING at the frame the page swaps, not already
  // on its way out. This is what the uncaptured timer cost: a hold left over
  // from an earlier navigation fired mid-flight and started the 700ms lift
  // early, so the swap happened at ~35% opacity — the in-between page showing
  // through is the "flash" the audit describes. Opacity may only be rising (or
  // held) up to the commit; never falling.
  expect(commit!.present).toBe(true);
  const before = all.filter((s) => s.present && s.t < commit!.t);
  expect(before.length).toBeGreaterThan(0);
  expect(Math.max(...before.map((s) => s.opacity))).toBeLessThanOrEqual(
    commit!.opacity + 0.01,
  );
  // And nothing is stuck.
  expect(await page.locator(OVERLAY).count()).toBe(0);
});

test("prefers-reduced-motion: no sheet at all, so no hold to sit through", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await arrive(page);
  await startRecording(page);
  await clickLink(page, FIRST);
  await expect(page).toHaveURL(new RegExp(`${FIRST}$`));
  // Proving an absence needs a window: this is well past the old 1050ms hold
  // plus 700ms fade, which reduced motion never gated. If a sheet were coming
  // it would have come and gone by now.
  await page.waitForTimeout(2000);

  const all = await samples(page);
  expect(all.filter((s) => s.present)).toHaveLength(0);
  expect(commitAt(all, FIRST)).toBeDefined();
});
