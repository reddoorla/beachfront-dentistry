import type { PageLoad } from "./$types";

// Head data for the fixtures page (static route → data, not tags; the root
// layout's <Seo> is the single head source). The fleet lighthouse audit scores
// this page's SEO category on the dev server; meta-description is 1/13 of it.
export const load: PageLoad = () => ({
  title: "Accessibility fixtures",
  meta_description:
    "Synthetic fixtures page exercising the site's accessible component primitives for the automated axe and Lighthouse gates.",
});
