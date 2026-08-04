import { error } from "@sveltejs/kit";

import {
  collectionTypesOf,
  loadCollections,
} from "$lib/blux-catalog/collections-load";
import { createClient } from "$lib/prismicio";
import { assemblies } from "$lib/beachfront-pages.js";

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

  return { uid: params.uid, slices, collections };
}
