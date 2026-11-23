import { inlineSizes } from "$lib/type-specimen/inventory";
import type { PageServerLoad } from "./$types";

// The type specimen (Tim, Discord 2026-11-23: "a page that has all these styles
// on it that I can review … see what the mobile sizes are too"). Hidden: linked
// from nowhere, absent from the sitemap (which lists Prismic documents and
// STATIC_ROUTES only), and noindex + Disallow through $lib/seo's
// NOINDEX_PREFIXES. Prerendered like the rest of the site.
export const prerender = true;

// Every component's source, read at build time, so the "one-off sizes" list at
// the bottom of the page is the code as built, not a list someone typed.
const sources = import.meta.glob(
  ["/src/lib/**/*.svelte", "/src/routes/**/*.svelte"],
  { query: "?raw", import: "default", eager: true },
) as Record<string, string>;

export const load: PageServerLoad = () => ({
  title: "Type specimen",
  inlineSizes: inlineSizes(sources),
});
