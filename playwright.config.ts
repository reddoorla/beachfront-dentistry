import { defineConfig } from "@playwright/test";
import base from "@reddoorla/maintenance/configs/playwright-a11y";

// Emulate reduced motion in tests: instant scrollIntoView (no long animated
// smooth-scroll that flakes Playwright's actionability checks under parallel
// load) and view transitions fall back to instant. Pairs with the
// prefers-reduced-motion gate on scroll-behavior in src/app.css.
//
// R1.1 (health-gate): the central `smoke` audit (reddoor-maintenance
// src/audits/smoke.ts) allocates a free port and passes it as
// REDDOOR_SMOKE_PORT so a zombie vite already squatting the default 5173 can't
// silently hijack the run and green a stale build. When it's set, bind vite to
// exactly that port with --strictPort (forwarded through `npm run vite:dev` so
// it stays portable across pnpm/npm) and aim Playwright's baseURL + readiness
// probe at it. Unset (local `pnpm test:smoke`) → the shared base's fixed 5173.
const smokePort = process.env.REDDOOR_SMOKE_PORT;

export default defineConfig({
  ...base,
  use: {
    ...base.use,
    // `reducedMotion: "reduce"` used to sit here and DID NOTHING: probed on this
    // Playwright/Chromium, `matchMedia("(prefers-reduced-motion: reduce)")`
    // reports false under the option at config, project and test.use level, and
    // true only after an explicit `page.emulateMedia({ reducedMotion })`. So
    // every spec that believed it ran reduced was running with motion ON — the
    // line asserted a guarantee it never delivered. Removing it changes no
    // runtime behaviour (there was none to change); specs that need reduced
    // motion call emulateMedia themselves, as nav-menu and review-mask do.
    ...(smokePort ? { baseURL: `http://localhost:${smokePort}` } : {}),
  },
  ...(smokePort
    ? {
        webServer: {
          command: `npm run vite:dev -- --port ${smokePort} --strictPort`,
          url: `http://localhost:${smokePort}/dev/a11y-fixtures`,
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
        },
      }
    : {}),
});
