// The SEO & Metadata tab's fallbacks for the Prismic detail types
// (news_article, collection_item, person), mirroring the `page` type's tab
// and Vineyard Custom Homes' (Tim's ask, 2026-11-20). One function so the
// three routes cannot drift apart.
//
// - Meta Title: the tab's field, then news_article's older `meta_title`
//   override (still filled on nine published articles), then the layout's own
//   fallback to the page title.
// - Meta Description: the tab's field, then the authored card excerpt
//   (news_article `summary`, person `teaser`), then the body's opening text.
// - Meta Image: the tab's image, then the document's main image (`media`),
//   then the layout's site default (DEFAULT_OG_IMAGE). Prismic assets are
//   cropped to the card canvas in resolveOgImage; an Unsplash URL passes
//   through as-is.

import {
  asText,
  isFilled,
  type ImageField,
  type RichTextField,
} from "@prismicio/client";

/** Search-result snippets cut around here; a computed fallback is trimmed to
 *  it. An editor's own Meta Description is never cut. */
export const META_DESCRIPTION_MAX = 155;

export interface DetailMetaInput {
  /** The tab's Meta Title (`seo_title` on news_article, `meta_title` elsewhere). */
  seoTitle?: string | null;
  /** news_article's older Main-tab `meta_title` override. */
  legacyMetaTitle?: string | null;
  metaDescription?: string | null;
  metaImage?: ImageField | null;
  /** Authored card excerpt: news_article `summary`, person `teaser`. */
  excerpt?: string | null;
  body?: RichTextField | null;
  /** The document's main image. */
  media?: ImageField | null;
}

export interface DetailMeta {
  meta_title?: string;
  meta_description?: string;
  meta_image?: string;
  meta_image_alt?: string;
}

const text = (value: string | null | undefined): string | undefined =>
  value?.trim() || undefined;

export function detailMeta(input: DetailMetaInput): DetailMeta {
  const fallbackDescription =
    text(input.excerpt) ?? text(asText(input.body ?? []));
  const image = isFilled.image(input.metaImage)
    ? input.metaImage
    : isFilled.image(input.media)
      ? input.media
      : undefined;
  return {
    meta_title: text(input.seoTitle) ?? text(input.legacyMetaTitle),
    meta_description:
      text(input.metaDescription) ??
      fallbackDescription?.slice(0, META_DESCRIPTION_MAX),
    meta_image: image?.url ?? undefined,
    meta_image_alt: text(image?.alt),
  };
}
