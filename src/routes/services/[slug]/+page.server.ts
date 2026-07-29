import { error } from "@sveltejs/kit";
import { asText } from "@prismicio/client";
import { createClient, isPlaceholderRepo } from "$lib/prismicio";
import type { CollectionItemDocument } from "../../../prismicio-types";

// Mirrors src/routes/products/[slug]/+page.server.ts's shape (entries +
// load, no-throw `error()` call, `isPlaceholderRepo`-gated prerender list),
// adapted to a genuinely live-Prismic `getByUID` lookup: `collection_item` is
// a real generated document type here (see prismicio-types.d.ts), unlike
// `catalog_page` in blux-catalog/page-doc.ts, so the result is cast straight
// to it rather than duck-typed.
export async function load({ params, fetch, cookies }) {
  const client = createClient({ fetch, cookies });
  try {
    const doc = (await client.getByUID(
      "collection_item",
      params.slug,
    )) as CollectionItemDocument;
    const title = asText(doc.data.title) || params.slug;
    return {
      doc,
      // tags is a comma-separated string on this custom type (see
      // ServiceCategoryBand's own comment) — used verbatim here since a
      // detail page's breadcrumb only ever shows this doc's own tag(s), not
      // a parsed multi-category list.
      category: doc.data.tags || "",
      title,
      meta_description: (asText(doc.data.body) || "").slice(0, 155),
      meta_image: doc.data.media?.url,
    };
  } catch {
    error(404, { message: "Service not found" });
  }
}

export async function entries() {
  if (isPlaceholderRepo) return [];
  const client = createClient();
  const docs = (await client.getAllByType(
    "collection_item",
  )) as CollectionItemDocument[];
  return docs.map((doc) => ({ slug: doc.uid }));
}
