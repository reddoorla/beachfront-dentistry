import { createClient, isFrozenSite, isPlaceholderRepo } from "$lib/prismicio";
import { frozenUids } from "$lib/blux-frozen/load";
import { loadCollections } from "$lib/blux-catalog/collections-load";
import { ENTITY_ROUTE_PREFIX } from "$lib/blux-catalog/entity-routes";
import type { RequestHandler } from "./$types";

export const prerender = true;

// Every card the catalog slices link to also gets a sitemap entry — the
// shared ENTITY_ROUTE_PREFIX map keeps this route and CollectionList's
// hrefFor from drifting apart.

/** Indexable routes that exist in the FILESYSTEM rather than in Prismic.
 *
 *  Everything below is discovered by querying the CMS, which structurally
 *  cannot see a hard-coded route — so /contact-us, linked from the nav on every
 *  page and returning 200, was missing from the sitemap entirely. It is also
 *  `prerender = false` (a form action cannot live on a prerendered route), so
 *  no build-output census would have caught it either.
 *
 *  Only genuinely public, indexable routes belong here — not /dev/*, not
 *  /slice-simulator, not /preview (robots.txt disallows those). */
const STATIC_ROUTES = ["/contact-us"];

export const GET: RequestHandler = async ({ fetch, url }) => {
  const origin = url.origin;

  // Sitemap entries as { path, lastmod }. A frozen Blux site's pages ARE its
  // committed frozen artifacts (home renders at "/"), never native `page` docs —
  // list those so the sitemap robots.txt advertises isn't silently empty. Build
  // time stands in for a frozen page's lastmod (it is rebaked whenever its
  // content republishes). A frozen site's Prismic holds no
  // person/news_article/collection_item docs either, so it skips the entity
  // fetch entirely — same reasoning as `[uid]/+page.server.ts`'s `entries()`.
  let entries: { path: string; lastmod: string }[];

  if (isFrozenSite) {
    entries = frozenUids().map((uid) => ({
      path: uid === "home" ? "/" : `/${uid}`,
      lastmod: new Date().toISOString(),
    }));
  } else if (isPlaceholderRepo) {
    entries = [];
  } else {
    const client = createClient({ fetch });

    const pageEntries = (await client.getAllByType("page")).map((page) => ({
      path: page.uid === "home" ? "/" : `/${page.uid}`,
      lastmod: new Date(page.last_publication_date ?? Date.now()).toISOString(),
    }));

    // Tolerates a repo that hasn't provisioned one of these custom types yet
    // (empty list, not a build-breaking 500) — the same contract
    // collections-load.ts already gives the catalog slices' load path.
    const entityDocs = await loadCollections(
      client,
      Object.keys(ENTITY_ROUTE_PREFIX),
    );
    const entityEntries = Object.entries(entityDocs).flatMap(([type, docs]) =>
      (docs as { uid: string; last_publication_date?: string | null }[]).map(
        (doc) => ({
          path: `${ENTITY_ROUTE_PREFIX[type]}${doc.uid}`,
          lastmod: new Date(
            doc.last_publication_date ?? Date.now(),
          ).toISOString(),
        }),
      ),
    );

    // Build time is the right lastmod for a static route: its content changes
    // when the code ships, which is exactly when this is regenerated.
    const staticEntries = STATIC_ROUTES.map((path) => ({
      path,
      lastmod: new Date().toISOString(),
    }));

    entries = [...pageEntries, ...entityEntries, ...staticEntries];
  }

  const urls = entries.map(
    ({ path, lastmod }) => `  <url>
    <loc>${origin}${path}</loc>
    <lastmod>${lastmod}</lastmod>
  </url>`,
  );

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml" },
  });
};
