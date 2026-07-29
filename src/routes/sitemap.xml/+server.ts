import { createClient, isFrozenSite, isPlaceholderRepo } from "$lib/prismicio";
import { frozenUids } from "$lib/blux-frozen/load";
import { loadCollections } from "$lib/blux-catalog/collections-load";
import type { RequestHandler } from "./$types";

export const prerender = true;

// Entity types with their own detail route (services/[slug], questions/[slug],
// team-members/[slug]) — the same doc-type → prefix mapping CollectionList's
// hrefFor uses, so every card the catalog slices link to also gets a sitemap
// entry.
const ENTITY_PREFIXES: Record<string, string> = {
  person: "/team-members/",
  news_article: "/questions/",
  collection_item: "/services/",
};

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
      Object.keys(ENTITY_PREFIXES),
    );
    const entityEntries = Object.entries(entityDocs).flatMap(([type, docs]) =>
      (docs as { uid: string; last_publication_date?: string | null }[]).map(
        (doc) => ({
          path: `${ENTITY_PREFIXES[type]}${doc.uid}`,
          lastmod: new Date(
            doc.last_publication_date ?? Date.now(),
          ).toISOString(),
        }),
      ),
    );

    entries = [...pageEntries, ...entityEntries];
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
