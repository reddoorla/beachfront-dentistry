/** Beachfront practice constants shared by chrome + routes. */
export const PHONE = { display: "(310) 378-9241", href: "tel:+13103789241" };
export const MODENTO_URL = "https://app.modento.io/beachfront-dentistry";
/** Yelp business page — the "Read Reviews" target in the closing CTA band. */
export const REVIEWS_URL =
  "https://www.yelp.com/biz/beachfront-dentistry-redondo-beach";
/** The three review destinations live's "Read Reviews" expander reveals
 * (Google reviews / Facebook / Yelp — urls lifted from live's own markup). */
export const REVIEW_DESTINATIONS = [
  {
    label: "Google",
    href: "https://www.google.com/maps/place/Beachfront+Dentistry/@33.8176193,-118.3853988,17z/data=!3m1!4b1!4m8!3m7!1s0x80dd4b509861c4ad:0x133845da52f7533d!8m2!3d33.8176193!4d-118.3853988!9m1!1b1!16s%2Fg%2F1tfbcghd?entry=ttu",
    icon: "/icons/google-g.svg",
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/RedondoDentists",
    icon: "/icons/facebook-f.svg",
  },
  { label: "Yelp", href: REVIEWS_URL, icon: "/icons/yelp-logo.png" },
] as const;

/** Street address, two display lines — mirrors site-config.json's footer
 * column (see the "1706 S Elena Ave..."/"Redondo Beach, CA..." text rows). */
export const ADDRESS = {
  line1: "1706 S Elena Ave. Suite B",
  line2: "Redondo Beach, CA 90277",
};

/** Office hours as [day-range, time-range] pairs, in display order. The
 * footer renders these joined as "<day> / <time>" (site-config.json's
 * "Monday - Thursday / 7am - 5pm" row) — see site.test.ts's drift guard. */
export const HOURS: [string, string][] = [
  ["Monday - Thursday", "7am - 5pm"],
  ["Friday", "7am - 2pm"],
  ["Saturday - Sunday", "Closed"],
];
