import { createClient } from "$lib/prismicio";
import { loadSiteImages } from "$lib/site-settings";
import type { LayoutServerLoad } from "./$types";

export const prerender = "auto";

export const load: LayoutServerLoad = async ({ cookies, fetch }) => {
  // An active Prismic preview session is signalled by this cookie: editors who
  // arrive via a Prismic preview link have it set, normal visitors never do. We
  // use it to only mount the Prismic toolbar for previewers (the toolbar sets
  // ~21 third-party cookies that otherwise hit every visitor and fail Lighthouse
  // Best Practices).
  const isPreviewSession = !!cookies.get("io.prismic.preview");

  // The shared photographs (closing-CTA beach, contact hero, the two detail
  // fallbacks) load HERE rather than in each consuming route because the beach
  // alone is on four of them — /contact-us plus all three detail templates.
  // One query, one shape, and a route that starts closing on the same band
  // gets the photo without re-deriving where it comes from.
  const siteImages = await loadSiteImages(createClient({ fetch, cookies }));

  return {
    isPreviewSession,
    siteImages,
  };
};
