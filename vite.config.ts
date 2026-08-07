import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vitest/config";
import { imagetools } from "@zerodevx/svelte-img/vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [sveltekit(), imagetools(), tailwindcss()],
  server: {
    fs: {
      // Allow access to files from the project root.
      allow: [".."],
    },
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{js,ts}"],
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
