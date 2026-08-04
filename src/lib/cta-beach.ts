import type { ImageField } from "@prismicio/client";

// Live's closing CTA band carries the FIJI beach on EVERY page (the assembly
// pages resolve it through Prismic/ctaHero; contact-us + the detail routes are
// hand-built, so they pass this static asset — served from /static so it clears
// the app CSP, img-src being Prismic-only). Real asset, downscaled, not a
// redraw. `<CtaBand backgroundImage={CTA_BEACH} caption="FIJI ISLANDS" />`.
export const CTA_BEACH: ImageField = {
  url: "/images/cta-beach.jpg",
  alt: null,
  copyright: null,
  dimensions: { width: 1600, height: 1067 },
  id: "cta-beach",
  edit: { x: 0, y: 0, zoom: 1, background: "transparent" },
};
