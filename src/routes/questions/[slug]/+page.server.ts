import { error } from "@sveltejs/kit";
import { asText } from "@prismicio/client";
import { createClient, isPlaceholderRepo } from "$lib/prismicio";
import type { NewsArticleDocument } from "../../../prismicio-types";

// Same shape as services/[slug] (itself mirroring products/[slug]), against
// `news_article` — the "future /questions/<uid> detail page" QuestionList's
// own comment already points at (src/lib/slices/QuestionList/index.svelte).
export async function load({ params, fetch, cookies }) {
  const client = createClient({ fetch, cookies });
  try {
    const doc = (await client.getByUID(
      "news_article",
      params.slug,
    )) as NewsArticleDocument;
    const title = asText(doc.data.title) || params.slug;
    return {
      doc,
      title,
      // SEO-only <title> override (layout: meta_title || title). The visible
      // H1/card title is pixel-gated against live and must not shorten; the
      // composed <title> must stay ≤ 70 chars for the fleet browser audit.
      meta_title: doc.data.meta_title,
      meta_description: (asText(doc.data.body) || "").slice(0, 155),
      meta_image: doc.data.media?.url,
    };
  } catch {
    error(404, { message: "Question not found" });
  }
}

export async function entries() {
  if (isPlaceholderRepo) return [];
  const client = createClient();
  const docs = (await client.getAllByType(
    "news_article",
  )) as NewsArticleDocument[];
  return docs.map((doc) => ({ slug: doc.uid }));
}
