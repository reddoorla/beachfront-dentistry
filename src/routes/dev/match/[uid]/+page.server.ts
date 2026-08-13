import { error } from "@sveltejs/kit";

import {
  collectionTypesOf,
  loadCollections,
} from "$lib/blux-catalog/collections-load";
import { createClient } from "$lib/prismicio";
import { assemblies } from "$lib/beachfront-pages.js";
import {
  PERSON_CONTENT,
  NEWS_ARTICLE_CONTENT,
  COLLECTION_ITEM_CONTENT,
} from "$lib/beachfront-entities.js";

// Local matching gate surface. Renders the EXACT page assembly that
// scripts/seed-pages.mjs publishes (src/lib/beachfront-pages.js — the shared
// source of truth), but resolves images to their live URLs and pulls the real
// published entity collections (person / news_article / collection_item) from
// Prismic. That lets the matching-a-page gates (page-diff / style-census /
// text-diff) run against /dev/match/<uid> vs the live page WITHOUT publishing
// the unpublished Migration release — and any fix made to pass the gate lands
// in beachfront-pages.js, so it ships the moment Tucker publishes the release.
//
// Dev aid only: not prerendered, SSR-on-demand.
export const prerender = false;

// Image fields the assembly builds carry only a URL here (vs the seed's asset
// {id}); PrismicImage renders from `.url`. Dimensions are nominal — the slices
// size their own image boxes via CSS, so layout geometry does not depend on them.
const devImg = (u: string) => ({
  url: u,
  alt: null,
  copyright: null,
  dimensions: { width: 1600, height: 1067 },
  edit: { x: 0, y: 0, zoom: 1, background: "transparent" },
  id: u,
});

/** Fill only the fields a fetched doc is missing, from a uid-keyed patch. */
function fillFrom(
  docs: unknown[] | undefined,
  patch: Record<string, Record<string, unknown>>,
) {
  for (const doc of (docs ?? []) as Array<{
    uid: string;
    data: Record<string, unknown>;
  }>) {
    for (const [field, value] of Object.entries(patch[doc.uid] ?? {})) {
      if (doc.data[field] === undefined || doc.data[field] === null)
        doc.data[field] = value;
    }
  }
}

export async function load({ params, fetch, cookies }) {
  const asm = assemblies(devImg) as Record<string, unknown[]>;
  const slices = asm[params.uid];
  if (!slices)
    error(404, {
      message: `no matching assembly for "${params.uid}" (have: ${Object.keys(asm).join(", ")})`,
    });

  const client = createClient({ fetch, cookies });
  const collections = await loadCollections(
    client,
    collectionTypesOf(slices as never),
  );

  // The favorite-beach preview that used to sit here is GONE, because the thing
  // it was previewing has shipped. It filled `person.gallery` from the verbatim
  // PERSON_BEACHES capture, pointing at static/beaches/, for exactly as long as
  // the blux-migrated docs carried no gallery of their own — "the production
  // seed will populate person.gallery for real", said the comment. It did: all
  // 11 person documents now carry a filled gallery from Prismic, so the fill
  // guarded on an empty gallery and could never fire again.
  //
  // Keeping it would have been worse than dead code once the static beaches
  // were deleted alongside it: a dormant branch resolving to five 404s, waiting
  // for the one day a gallery came back empty.

  // Same idea for the four authored entity fields the Webflow import never
  // captured (person.teaser/order, news_article.summary/home_order,
  // collection_item.link_label/order). They are MODELLED on the custom types
  // and the templates read them straight off the document; this fills them
  // from the migration payload so the gates measure the post-publish render
  // before the release goes live. `fillFrom` only writes fields that arrive
  // EMPTY, so it turns into a no-op the moment the release is published —
  // and it can never mask a value an author has since edited in Prismic.
  fillFrom(collections.person, PERSON_CONTENT);
  fillFrom(collections.news_article, NEWS_ARTICLE_CONTENT);
  fillFrom(collections.collection_item, COLLECTION_ITEM_CONTENT);

  return { uid: params.uid, slices, collections };
}
