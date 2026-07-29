import { error } from "@sveltejs/kit";
import { asText } from "@prismicio/client";
import { createClient, isPlaceholderRepo } from "$lib/prismicio";
import type { PersonDocument } from "../../../prismicio-types";

// Same shape as services/[slug] and questions/[slug], against `person`.
export async function load({ params, fetch, cookies }) {
  const client = createClient({ fetch, cookies });
  try {
    const doc = (await client.getByUID(
      "person",
      params.slug,
    )) as PersonDocument;
    const title = asText(doc.data.title) || params.slug;
    return {
      doc,
      // tags carries this person's role line (e.g. "Office Manager"), same
      // comma-separated-string field shape as collection_item/news_article.
      role: doc.data.tags || "",
      title,
      meta_description: (asText(doc.data.body) || "").slice(0, 155),
      meta_image: doc.data.media?.url,
    };
  } catch {
    error(404, { message: "Team member not found" });
  }
}

export async function entries() {
  if (isPlaceholderRepo) return [];
  const client = createClient();
  const docs = (await client.getAllByType("person")) as PersonDocument[];
  return docs.map((doc) => ({ slug: doc.uid }));
}
