/** Beachfront practice constants shared by chrome + routes. */
export const PHONE = { display: "(310) 378-9241", href: "tel:+13103789241" };
export const MODENTO_URL = "https://app.modento.io/beachfront-dentistry";

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
