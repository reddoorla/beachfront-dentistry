import { NOINDEX_ENFORCED, NOINDEX_PREFIXES, siteOrigin } from "$lib/seo";
import type { RequestHandler } from "./$types";

export const prerender = true;

// Replaces static/robots.txt so the Sitemap line can carry an absolute URL —
// the robots spec requires one, and a static file can't know its own origin.
// During prerender the origin is Netlify's URL at build time, through
// $lib/seo's siteOrigin (kit 3 removed prerender.origin; sveltekit.config.js
// says why paths.origin is not set); local builds fall back to SvelteKit's
// placeholder origin, which is fine — robots.txt only matters on the
// deployed site.
export const GET: RequestHandler = ({ url }) => {
  // Fence crawlers off the dev/tooling routes (which `prerender = "auto"`
  // still emits as public static HTML) and Prismic preview URLs (which
  // canonicalize to the real page anyway). Content routes stay open. On the
  // vite dev server the fence drops entirely (a bare `Disallow:` is the
  // spec's allow-everything rule) — see NOINDEX_ENFORCED in $lib/seo.
  const body = `User-agent: *
${NOINDEX_ENFORCED ? NOINDEX_PREFIXES.map((p) => `Disallow: ${p}`).join("\n") : "Disallow:"}

Sitemap: ${siteOrigin(url)}/sitemap.xml
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain" },
  });
};
