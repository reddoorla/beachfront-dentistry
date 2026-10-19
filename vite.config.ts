import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vitest/config";
import { imagetools } from "@zerodevx/svelte-img/vite";
import tailwindcss from "@tailwindcss/vite";
import { prismicBarrel } from "./scripts/prismic-barrel";
import kitConfig, { productionOrigin } from "./sveltekit.config.js";

export default defineConfig({
  // SvelteKit 3 takes its configuration here, not from svelte.config.js
  // (which it refuses to start beside). The object lives in sveltekit.config.js
  // so eslint and scripts/kit-config.test.ts read the same one.
  plugins: [sveltekit(kitConfig), imagetools(), tailwindcss(), prismicBarrel()],
  // The production origin for prerendered canonical, og:url, JSON-LD,
  // robots.txt and sitemap.xml, in place of kit's placeholder
  // (sveltekit.config.js says why it is not paths.origin).
  define: { __REDDOOR_SITE_ORIGIN__: JSON.stringify(productionOrigin) },
  server: {
    fs: {
      // Allow access to files from the project root.
      allow: [".."],
    },
  },
  test: {
    environment: "jsdom",
    // `scripts/**` is included because the seed scripts are the only code that
    // mutates PUBLISHED content, and none of it was covered. Only side-effect-
    // free modules there are testable — the seed entrypoints read a write token
    // at import time, which is why the body-link logic lives in scripts/lib.
    include: ["src/**/*.test.{js,ts}", "scripts/**/*.test.{js,ts}"],
    setupFiles: ["./vitest-setup.ts"],
    // Hermetic env for the map tests. Nine of them assert the KEYLESS path
    // (placeholder renders, no Maps script injected) and used to rely on
    // VITE_GOOGLE_MAPS_KEY simply being absent — true in CI and on a machine
    // with no key, false the moment a developer puts a real key in .env, at
    // which point those nine fail for reasons unrelated to their change.
    // Pinning it empty here makes the default explicit; the suites that need a
    // key still stub it themselves (see LocationMap.test.ts's "with a key"
    // block, which stubs "test-key").
    env: { VITE_GOOGLE_MAPS_KEY: "" },
    server: {
      deps: {
        inline: ["@testing-library/svelte"],
      },
    },
  },
  resolve: process.env.VITEST ? { conditions: ["browser"] } : undefined,
});
