/** Load-path collections fetch for the blux_collection query-spec slice:
 * the page load resolves each collection type the slice zone queries via
 * `getAllByType` and hands the documents to every slice through SliceZone
 * `context.collections` (slices never fetch). */

/** Slices whose entity type is author-picked per instance via their own
 * primary.collection_type field (blux_collection's catalog-spec band and
 * collection_list's linked-Custom-Type picker share this field name). */
const READS_COLLECTION_TYPE_FIELD = new Set([
  "blux_collection",
  "collection_list",
]);

/** Slices whose entity type is fixed by the slice's own shape — there's no
 * per-instance field for the author to set, so the mapping lives here. */
const FIXED_ENTITY_TYPE: Record<string, string> = {
  question_list: "news_article",
  service_category_band: "collection_item",
};

/** The collection types a page's slice zone queries: unique, ordered. */
export function collectionTypesOf(
  slices: {
    slice_type: string;
    primary?: { collection_type?: string | null };
  }[],
): string[] {
  const types: string[] = [];
  for (const slice of slices) {
    const type = READS_COLLECTION_TYPE_FIELD.has(slice.slice_type)
      ? slice.primary?.collection_type
      : FIXED_ENTITY_TYPE[slice.slice_type];
    if (type && !types.includes(type)) types.push(type);
  }
  return types;
}

/** Fetch each type via client.getAllByType, tolerating unknown types (a site
 * whose Prismic repo lacks an entity type gets an empty list, not a 500). */
export async function loadCollections(
  client: { getAllByType(type: string): Promise<unknown[]> },
  types: string[],
): Promise<Record<string, unknown[]>> {
  const entries = await Promise.all(
    types.map(async (type): Promise<[string, unknown[]]> => {
      try {
        return [type, await client.getAllByType(type)];
      } catch {
        return [type, []];
      }
    }),
  );
  return Object.fromEntries(entries);
}
