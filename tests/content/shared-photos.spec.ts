import { expect, test } from "@playwright/test";

/**
 * The four shared photographs come from Prismic, and nothing serves a
 * photograph out of the repo any more.
 *
 * These four used to be JPEGs in `static/images/`, handed to the hero
 * components as hand-written `ImageField` literals. The visible cost was
 * bytes: `srcset()` returns undefined for a non-Prismic URL, so they were the
 * only photos on the site with no imgix ladder to climb down, and /contact-us
 * shipped 971 KB of images to a phone. The quiet cost was that a photograph an
 * editor would reasonably want to change lived in a git repo.
 *
 * `$lib/site-settings` degrades to nulls rather than throwing, because it runs
 * in the ROOT layout load and a throw there would 500 every route on the site
 * over a missing backdrop. That trade is only safe if something else is loud —
 * this file is that something else.
 *
 * COVERAGE NOTE, measured against the repository rather than assumed:
 *   cta_beach         renders on /contact-us + all three detail templates
 *   contact_hero      renders on /contact-us
 *   service_hero      renders on 3 of 24 services (the ones with no own media):
 *                     oral-cancer-dentistry, dental-veneers, teeth-whitening
 *   team_member_hero  renders on 0 of 11 people — all 11 have a favorite beach
 * The last one is a real fallback with no live consumer, so it cannot be
 * asserted through a page. It is asserted against the document instead, which
 * is the only way it can be caught before the person it exists for arrives.
 */

const PRISMIC = /images\.prismic\.io/;

/** A service with NO media of its own — this is where service_hero surfaces. */
const SERVICE_WITHOUT_MEDIA = "/services/teeth-whitening";
/** A service that HAS its own media — the fallback must not clobber it. */
const SERVICE_WITH_MEDIA = "/services/dental-exams";
const TEAM_MEMBER = "/team-members/dr-robert-quan";
const QUESTION = "/questions/loose-tooth";

/** Every <img> the page renders, in DOM order, with the box it landed in. */
const photos = (page: import("@playwright/test").Page) =>
  page.evaluate(() =>
    Array.from(document.images).map((img) => ({
      src: img.currentSrc || img.src,
      sizes: img.getAttribute("sizes"),
      w: Math.round(img.getBoundingClientRect().width),
    })),
  );

test("/contact-us serves both of its photographs from Prismic", async ({
  page,
}) => {
  await page.goto("/contact-us", { waitUntil: "networkidle" });
  const rows = await photos(page);

  // The hero and the closing beach are the two full-bleed photos on this page.
  const bleed = rows.filter((r) => r.w > 300);
  expect(
    bleed.length,
    "the hero and the closing CTA beach both render",
  ).toBeGreaterThanOrEqual(2);
  for (const r of bleed)
    expect(r.src, `${r.src} must come from Prismic`).toMatch(PRISMIC);
});

test("a service with no image of its own falls back to the Prismic settings hero", async ({
  page,
}) => {
  await page.goto(SERVICE_WITHOUT_MEDIA, { waitUntil: "networkidle" });
  const rows = await photos(page);
  const hero = rows.find((r) => r.w > 300);
  expect(hero, "the hero band renders a photo").toBeTruthy();
  expect(hero!.src, "the fallback hero is Prismic-hosted").toMatch(PRISMIC);
});

test("a service WITH its own image still shows it, not the fallback", async ({
  page,
}) => {
  // The regression this swap could introduce: reading the fallback
  // unconditionally instead of only when `media` is unfilled.
  const withMedia = await page.goto(SERVICE_WITH_MEDIA, {
    waitUntil: "networkidle",
  });
  expect(withMedia?.ok()).toBe(true);
  const own = (await photos(page)).find((r) => r.w > 300);

  await page.goto(SERVICE_WITHOUT_MEDIA, { waitUntil: "networkidle" });
  const fallback = (await photos(page)).find((r) => r.w > 300);

  const base = (u?: string) => (u ?? "").split("?")[0];
  expect(
    base(own?.src),
    "a service with its own media must not render the shared fallback",
  ).not.toBe(base(fallback?.src));
});

for (const path of [TEAM_MEMBER, QUESTION]) {
  test(`the closing CTA beach on ${path} comes from Prismic`, async ({
    page,
  }) => {
    await page.goto(path, { waitUntil: "networkidle" });
    // The CTA band is the last full-bleed photo on the page.
    const bleed = (await photos(page)).filter((r) => r.w > 300);
    expect(bleed.length, "the closing band renders its beach").toBeGreaterThan(
      0,
    );
    expect(bleed[bleed.length - 1].src).toMatch(PRISMIC);
  });
}

test("no route serves a photograph out of the repo", async ({ page }) => {
  // The whole point of the change, stated as the thing that must stay true.
  // `/images/` was the static photo directory; an <img> pointing back into it
  // means a photo has been re-added to the repo instead of to Prismic.
  for (const path of [
    "/",
    "/contact-us",
    "/our-team",
    "/your-first-visit",
    "/services",
    "/ask-the-doctor",
    SERVICE_WITHOUT_MEDIA,
    TEAM_MEMBER,
    QUESTION,
  ]) {
    await page.goto(path, { waitUntil: "networkidle" });
    const repoServed = (await photos(page))
      .map((r) => r.src)
      .filter((src) => /\/images\//.test(new URL(src, "http://x").pathname));
    expect(repoServed, `${path} serves a photo from the repo`).toEqual([]);
  }
});

test("the settings singleton carries all four photographs", async ({
  request,
}) => {
  // The only check that can see `team_member_hero`, which has no live consumer
  // today: all 11 people have a favorite beach, so the fallback it exists for
  // is dormant. An unfilled field here would surface the first time a person is
  // added without one — on that person's page, in production.
  const repo = "48bb12d1";
  const api = await (
    await request.get(`https://${repo}.prismic.io/api/v2`)
  ).json();
  const ref = api.refs.find((r: { isMasterRef: boolean }) => r.isMasterRef).ref;
  const q = await (
    await request.get(
      `https://${repo}.prismic.io/api/v2/documents/search?ref=${ref}&pageSize=1&q=${encodeURIComponent('[[at(document.type,"settings")]]')}`,
    )
  ).json();

  expect(
    q.results?.length,
    "the `settings` singleton is published — the migration release must be published, not just staged",
  ).toBe(1);

  const data = q.results[0].data;
  const unfilled = [
    "cta_beach",
    "contact_hero",
    "service_hero",
    "team_member_hero",
  ].filter((f) => !data[f]?.url);
  expect(unfilled, "every shared photo is filled in Prismic").toEqual([]);
});
