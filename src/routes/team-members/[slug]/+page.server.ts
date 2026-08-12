import { error } from "@sveltejs/kit";
import { asText, isFilled } from "@prismicio/client";
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
    // MarkUp threads b7a00984-7a22-4830-ab3a-1fe1b636497e (team-member pin #1)
    // + 17e321d9-3717-4a6a-810f-d9be03e60de2 (our-team pin #4), one fix: the
    // hero band shows THIS person's favorite beach — the same gallery[0] image
    // as their /our-team card banner (each member picked their beach). Null
    // when the doc carries no gallery; the page then falls back to live's
    // shared hero. The dev/match our-team twin reads the identical gallery[0]
    // (it only patches docs whose gallery is EMPTY), so real and twin agree.
    const beach = doc.data.gallery?.[0]?.image;
    return {
      doc,
      heroImage: isFilled.image(beach) ? beach : null,
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
