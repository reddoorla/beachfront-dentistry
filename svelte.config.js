import { readFileSync, readdirSync } from "node:fs";
import adapter from "@sveltejs/adapter-netlify";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import { SVELTE_EVENT_REPLAY_HASH } from "@reddoorla/maintenance/configs/svelte";

const slicemachine = JSON.parse(
  readFileSync(new URL("./slicemachine.config.json", import.meta.url), "utf-8"),
);
const isPlaceholderRepo =
  (process.env.VITE_PRISMIC_ENVIRONMENT || slicemachine.repositoryName) ===
  "your-prismic-repo-name";

// A frozen Blux site commits page artifacts under src/lib/blux-frozen/frozen.
// Its prerendered pages keep dead Blux link artifacts — JS-driven `#n` slider
// anchors whose targets never existed statically — so tolerate missing fragment
// ids during the crawl rather than failing the build (a native site still fails
// loudly on a genuine broken in-page anchor).
let isFrozenSite = false;
try {
  isFrozenSite = readdirSync(
    new URL("./src/lib/blux-frozen/frozen", import.meta.url),
  ).some((f) => f.endsWith(".html"));
} catch {
  // no frozen artifact dir → not a frozen site
}

// Google Maps CSP surface — per Google's documented Maps-JS requirements.
// These wildcards meaningfully widen script-src (storage.googleapis.com and
// *.googleusercontent.com host arbitrary user-uploaded content, and google.com
// exposes known JSONP gadgets), so they are added ONLY where a map can
// actually hydrate: frozen Blux sites, or any build carrying
// VITE_GOOGLE_MAPS_KEY — the same key that gates runtime hydration. Keyless
// native sites keep the tight baseline policy.
const wantsMapsCsp = isFrozenSite || !!process.env.VITE_GOOGLE_MAPS_KEY;

// DEV ONLY. `/dev/match/<uid>` is the matching-gate surface: it renders the
// canonical page assemblies with live's own image URLs (webflow's CDN) so the
// page-diff gates can run without publishing the Prismic Migration release.
// Without this host the hero photos are CSP-blocked and every subpage's `top`
// region diffs a BLACK band against live's photo — which read as a 49-76%
// "defect" on our-team/services/ask-the-doctor and hid the real geometry
// underneath it. Production never serves these URLs (the seed uploads the
// images to Prismic), so this is gated to `vite dev` and cannot ship.
const isDev = process.env.NODE_ENV !== "production";
const devMatchImgHosts = isDev ? ["https://cdn.prod.website-files.com"] : [];
const mapsHosts = [
  "https://*.googleapis.com",
  "https://*.gstatic.com",
  "https://*.google.com",
  "https://*.ggpht.com",
  "https://*.googleusercontent.com",
];

/** @type {import('@sveltejs/kit').Config} */
const config = {
  compilerOptions: {
    warningFilter: (warning) =>
      warning.code !== "element_invalid_self_closing_tag",
  },
  kit: {
    adapter: adapter(),
    // Until a clone is wired to a real Prismic repo, every Prismic-backed
    // route returns 404 during prerender. Tolerate that on the placeholder
    // so `pnpm build` (and Netlify CI) succeed; real sites still fail loudly
    // because `repositoryName` no longer matches the sentinel.
    prerender: {
      // Prerendered endpoints (robots.txt, sitemap.xml) bake `url.origin` into
      // their output at build time; without this it would be SvelteKit's
      // "http://sveltekit-prerender" placeholder. Netlify sets URL to the
      // site's production origin during builds. Local builds keep the
      // placeholder, which only shows up in build/ output, never in dev.
      ...(process.env.URL ? { origin: process.env.URL } : {}),
      handleHttpError: ({ path, status, message, referrer }) => {
        if (isPlaceholderRepo && status === 404) {
          return;
        }
        // Cloudflare infrastructure paths are never prerenderable routes. Frozen
        // Blux HTML keeps a dead `/cdn-cgi/l/email-protection` link (Cloudflare's
        // email-obfuscation, only resolvable behind Cloudflare) — a 404 on it
        // during the crawl is expected, not a build failure. Frozen-only: on a
        // native site a /cdn-cgi/ link can only be pasted CMS content, and the
        // build should keep failing loudly so it gets fixed.
        if (isFrozenSite && status === 404 && path.startsWith("/cdn-cgi/")) {
          return;
        }
        throw new Error(
          `${status} ${path}${referrer ? ` (linked from ${referrer})` : ""}: ${message}`,
        );
      },
      // `/dev/*` fidelity gates prerender foreign fixture content (e.g. the
      // the-pointe catalog gate) whose in-page anchors (`/#n`) target ids that
      // exist on that content's own origin, not on this site's home. Those
      // routes are robots-excluded dev tooling, so a missing id is tolerated
      // only when every referrer is a dev gate — content routes keep failing
      // loudly on genuine broken anchors. (Latent until a native site first
      // prerendered `/` with real content: placeholder builds 404 `/`, so the
      // id check never ran against it.)
      handleMissingId: isFrozenSite
        ? "warn"
        : ({ referrers, message }) => {
            if (referrers.every((r) => r.startsWith("/dev/"))) return;
            throw new Error(message);
          },
      // A malformed URL in CMS-pasted rich text (e.g. a school name typed into a
      // hyperlink) is unparseable — it can never be a real route to crawl, and
      // one editor's typo must not fail the whole build. Warn (so it surfaces
      // for cleanup) and keep prerendering. Unlike handleHttpError's fail-loud
      // 404 policy, an invalid URL has no valid interpretation to preserve.
      // (Latent until /our-team's team grid began linking into team-member bios
      // that carry such migrated artifacts.)
      handleInvalidUrl: ({ href, referrer, message }) => {
        console.warn(
          `[prerender] skipped invalid URL ${JSON.stringify(href)}` +
            `${referrer ? ` (linked from ${referrer})` : ""} — fix the CMS link` +
            `${message ? ` [${message}]` : ""}`,
        );
      },
    },
    alias: {
      $components: "src/lib/components",
      "$components/*": "src/lib/components/*",
      $utils: "src/lib/utils",
      "$utils/*": "src/lib/utils/*",
      $stores: "src/lib/stores",
      "$stores/*": "src/lib/stores/*",
      $assets: "src/lib/assets",
      "$assets/*": "src/lib/assets/*",
    },
    // Baseline CSP for Prismic + Vimeo. Extend per project — any new CDN or
    // analytics host must be added to the relevant directive. SvelteKit
    // automatically adds nonces/hashes for inline scripts and styles it emits.
    csp: {
      mode: "auto",
      // Violations POST to /api/csp-report. To stage a stricter policy without
      // blocking, copy `directives` below into a sibling `reportOnly: { ... }`
      // block — SvelteKit will then emit a Content-Security-Policy-Report-Only
      // header alongside the enforced one.
      directives: {
        "default-src": ["self"],
        "script-src": [
          "self",
          "https://static.cdn.prismic.io",
          "https://player.vimeo.com",
          // Svelte 5 server-renders `onload="this.__e=event"` (and onerror) on
          // every image with a spread attribute: the pre-hydration event-replay
          // stub. A nonce policy refuses that inline handler unless the hash of
          // its exact text is listed AND 'unsafe-hashes' extends hash matching
          // to event handlers. Without both, the pre-hydration load is dropped
          // and the browser POSTs one report to /api/csp-report per image on
          // every page view (56 on `/` in dev, 2026-09-02). The shared baseline
          // has carried them since @reddoorla/maintenance 0.85.2; this file
          // overrides script-src wholesale, so it must carry them itself — the
          // upstream NOTE says exactly that. Only this one-liner is allowed;
          // pairing with 'unsafe-inline' would void the guarantee.
          // tests/interaction/csp-event-replay.spec.ts probes the served policy.
          "unsafe-hashes",
          SVELTE_EVENT_REPLAY_HASH,
          // Cloudflare Turnstile contact-form widget (enable via PUBLIC_TURNSTILE_SITE_KEY).
          "https://challenges.cloudflare.com",
          // GA4 gtag.js loader (Analytics.svelte). Wildcard per Google's CSP
          // guide — gtag chain-loads from more than one googletagmanager host.
          "https://*.googletagmanager.com",
          // Google Maps JS API — map hydration (VITE_GOOGLE_MAPS_KEY); see
          // wantsMapsCsp above for why this set is conditional.
          ...(wantsMapsCsp ? ["blob:", ...mapsHosts] : []),
        ],
        // Modern Maps JS spawns blob: workers; without this directive the
        // worker-src→script-src→default-src fallback lands on 'self' and
        // blocks them. Maps-gated: the baseline keeps no worker-src, exactly
        // as before the frozen layer.
        ...(wantsMapsCsp ? { "worker-src": ["self", "blob:"] } : {}),
        // Google Fonts stylesheet host — frozen Blux sites load their type from
        // fonts.googleapis.com (paired with fonts.gstatic.com under font-src).
        // Adobe Typekit stylesheet hosts — museo-sans/museo-slab (see app.html).
        // The kit css at use.typekit.net chain-loads p.css from p.typekit.net,
        // so both hosts need style-src (p.typekit.net also serves fonts).
        "style-src": [
          "self",
          "unsafe-inline",
          "https://fonts.googleapis.com",
          "https://use.typekit.net",
          "https://p.typekit.net",
        ],
        "img-src": [
          "self",
          "data:",
          "https://images.prismic.io",
          "https://*.prismic.io",
          // GA4 falls back to image beacons when sendBeacon/fetch is blocked.
          "https://*.google-analytics.com",
          "https://*.googletagmanager.com",
          // Google Maps tiles, markers, and My-Maps KML pin sprites (pins are
          // served from mt.google.com / maps.google.com, not maps.gstatic).
          ...(wantsMapsCsp ? mapsHosts : []),
          // dev-only matching-gate host — see devMatchImgHosts above
          ...devMatchImgHosts,
        ],
        // Prismic hosts non-image media (e.g. migrated .mp4 assets) on
        // <repo>.cdn.prismic.io — first-party content, same origin family as
        // images.prismic.io already allowed under img-src.
        "media-src": ["self", "https://*.vimeocdn.com", "https://*.prismic.io"],
        "frame-src": [
          "self",
          "https://player.vimeo.com",
          // Cloudflare Turnstile renders its challenge in an iframe from this host.
          "https://challenges.cloudflare.com",
          // YouTube embeds on the services detail route (collection_item's
          // `link` field, when it's a youtube.com/embed URL).
          "https://www.youtube.com",
          // Simple Google Maps embed iframe (MapEmbed.svelte, /contact-us) —
          // needs no API key, so it stays unconditional. Unlike the Maps-JS
          // wildcard below (gated because it widens script/img/connect-src
          // too), this is frame-src only and a single host.
          "https://www.google.com",
          // Google Maps JS may frame google.com surfaces (per its CSP doc).
          ...(wantsMapsCsp ? ["https://*.google.com"] : []),
        ],
        "connect-src": [
          "self",
          "https://*.prismic.io",
          "https://static.cdn.prismic.io",
          // GA4 measurement beacons — the g/collect endpoint lives on
          // google-analytics.com with regional variants, and consented
          // sessions also post to analytics.google.com.
          "https://*.google-analytics.com",
          "https://*.analytics.google.com",
          "https://*.googletagmanager.com",
          // Google Maps JS API telemetry, tile and KML fetches.
          ...(wantsMapsCsp
            ? [
                "https://*.googleapis.com",
                "https://*.google.com",
                "https://*.gstatic.com",
                "data:",
                "blob:",
              ]
            : []),
        ],
        // Typekit serves its font files from use.typekit.net and p.typekit.net.
        "font-src": [
          "self",
          "data:",
          "https://fonts.gstatic.com",
          "https://use.typekit.net",
          "https://p.typekit.net",
        ],
        "base-uri": ["self"],
        "form-action": ["self"],
        "frame-ancestors": ["self"],
        "report-uri": ["/api/csp-report"],
      },
    },
  },
  preprocess: vitePreprocess(),
};

export default config;
