/** Doc-type → detail-route prefix for the entity types with their own routes
 * (services/[slug], questions/[slug], team-members/[slug]). Single source for
 * CollectionList's card links and the sitemap — the fleet has already shipped
 * a footer-tel drift bug from this kind of duplicated literal (see
 * site.test.ts), so the map lives in exactly one place. */
export const ENTITY_ROUTE_PREFIX: Record<string, string> = {
  person: "/team-members/",
  news_article: "/questions/",
  collection_item: "/services/",
};
