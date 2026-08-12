import { isFilled, type Client, type ImageField } from "@prismicio/client";
import { isPlaceholderRepo } from "$lib/prismicio";
import type { SettingsDocument } from "../prismicio-types";

/**
 * The four photographs that are shared across routes rather than owned by one
 * document — resolved once in `+layout.server.ts` and read by the four
 * hand-built routes below.
 *
 * These used to be four JPEGs in `static/images/`, passed to the hero
 * components as hand-written `ImageField` literals. That put 1.2 MB of
 * photography in the repo, but the reason it had to change is smaller and
 * sharper than "content belongs in a CMS": `srcset()` returns undefined for a
 * non-Prismic URL, so those four were the only photos on the site that bypassed
 * the imgix ladder entirely and shipped their full master to every visitor.
 * A `/contact-us` phone visit was 971 KB of images against a need of ~90 KB.
 * Coming through Prismic is what puts them on the ladder — `HeroBackgroundImage`
 * needed no change at all, because it was already asking for a ladder these
 * URLs could not answer.
 *
 * `settings` is a SINGLETON: one document, no uid, edited in one place.
 */
export type SiteImages = {
  /** Closing CTA band, on /contact-us and all three detail routes. */
  ctaBeach: ImageField | null;
  /** /contact-us hero. */
  contactHero: ImageField | null;
  /** /services/<uid> hero, when the service carries no image of its own. */
  serviceHero: ImageField | null;
  /** /team-members/<uid> hero, when the person has no favorite beach. */
  teamMemberHero: ImageField | null;
};

const NONE: SiteImages = {
  ctaBeach: null,
  contactHero: null,
  serviceHero: null,
  teamMemberHero: null,
};

const orNull = (image: ImageField | undefined): ImageField | null =>
  image && isFilled.image(image) ? image : null;

/**
 * Read the singleton, or degrade to nulls.
 *
 * Degrading rather than throwing is deliberate: this runs in the ROOT layout
 * load, so a throw here would 500 every route on the site — including the ones
 * that never look at these images — over a missing decorative backdrop. Each
 * consumer already guards on `?.url`, so a null renders the band without its
 * photo instead of taking the page down.
 *
 * The cost of that choice is that a missing document is quiet, so it gets a
 * loud check somewhere else: tests/content/shared-photos.spec.ts asserts all
 * four render from images.prismic.io on the real routes, and fails if any of
 * them silently reverts to nothing.
 */
export async function loadSiteImages(client: Client): Promise<SiteImages> {
  if (isPlaceholderRepo) return NONE;
  try {
    const doc = await client.getSingle<SettingsDocument>("settings");
    return {
      ctaBeach: orNull(doc.data.cta_beach),
      contactHero: orNull(doc.data.contact_hero),
      serviceHero: orNull(doc.data.service_hero),
      teamMemberHero: orNull(doc.data.team_member_hero),
    };
  } catch {
    return NONE;
  }
}
