import { test, expect } from "@playwright/test";

declare global {
  interface Window {
    __cspViolations?: string[];
  }
}

// Svelte 5 server-renders `onload="this.__e=event" onerror="this.__e=event"`
// on every load/error element that carries a spread attribute or a `use:`
// directive — i.e. every Prismic image this site renders. The stub stashes an
// event that fires BEFORE hydration so the component can replay it once it is
// alive; hydration then strips the attribute, which is why it cannot be
// counted in the live DOM. Under a nonce CSP the inline attribute is refused
// unless `script-src` also carries `'unsafe-hashes'` + the stub's SHA-256 (see
// SVELTE_EVENT_REPLAY_HASH in @reddoorla/maintenance/configs/svelte — which
// this site's svelte.config.js must carry itself, because it overrides
// `script-src` wholesale).
//
// When refused: the pre-hydration load/error is silently dropped, Chromium
// logs "Refused to execute inline event handler", and it POSTs one violation
// report to /api/csp-report per image that loads before hydration — 56 on `/`
// alone in dev, measured 2026-09-02. The smoke suite never saw it because the
// handler is only compiled (and so only refused) when the event fires, which
// is a race against hydration that the smoke tests happen to lose.
//
// So this test does not rely on the race. It (1) confirms the served markup
// really carries the stub, (2) inserts ONE image with the identical stub and a
// data: source after the page is up, and asserts the handler ran and no
// violation fired, and (3) asserts the real navigation produced no reports.
const ROUTES = ["/", "/our-team"];
const GIF =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

for (const path of ROUTES) {
  test(`${path}: Svelte's image event-replay stub runs without a CSP violation`, async ({
    page,
  }) => {
    // (1) the served markup carries the stub — otherwise this test is about
    // nothing and must say so rather than pass.
    const html = await (await page.request.get(path)).text();
    const stubs = (html.match(/onload="this\.__e=event"/g) ?? []).length;
    expect(
      stubs,
      "images carrying Svelte's replay stub in the SSR HTML",
    ).toBeGreaterThan(0);

    const reports: string[] = [];
    page.on("request", (req) => {
      if (req.method() === "POST" && req.url().includes("/api/csp-report")) {
        reports.push(req.postData() ?? "");
      }
    });
    const refused: string[] = [];
    page.on("console", (msg) => {
      const text = msg.text();
      if (/Content Security Policy|Refused to execute/i.test(text)) {
        refused.push(`[${msg.type()}] ${text}`);
      }
    });
    await page.addInitScript(() => {
      window.__cspViolations = [];
      document.addEventListener("securitypolicyviolation", (e) => {
        window.__cspViolations?.push(
          `${e.violatedDirective} ${e.blockedURI} ${e.sample ?? ""}`.trim(),
        );
      });
    });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(path, { waitUntil: "networkidle" });

    // (2) the deterministic probe: the exact stub, parser-inserted, on an image
    // that loads immediately. Either the policy lets it run (`__e` is set) or
    // the browser refuses it (a securitypolicyviolation event fires).
    const probe = await page.evaluate(async (gif) => {
      const before = window.__cspViolations?.length ?? 0;
      document.body.insertAdjacentHTML(
        "beforeend",
        `<img data-csp-probe onload="this.__e=event" src="${gif}" alt="">`,
      );
      const img = document.querySelector(
        "img[data-csp-probe]",
      ) as HTMLImageElement & {
        __e?: Event;
      };
      await new Promise<void>((resolve) => {
        if (img.complete) resolve();
        else img.addEventListener("load", () => resolve(), { once: true });
      });
      await new Promise((r) => setTimeout(r, 0));
      return {
        ran: img.__e?.type ?? null,
        violations: (window.__cspViolations ?? []).slice(before),
      };
    }, GIF);

    expect(
      probe.violations,
      "securitypolicyviolation events for the stub",
    ).toEqual([]);
    expect(probe.ran, "the stub ran and stashed the event").toBe("load");

    // (3) and the real page load reported nothing either.
    expect(refused, "CSP refusals logged to the console").toEqual([]);
    expect(reports, "violation reports POSTed to /api/csp-report").toEqual([]);
  });
}
