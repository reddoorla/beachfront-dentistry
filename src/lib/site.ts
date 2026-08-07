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

/** Practice coordinates, lifted from live's own map widget
 *  (`data-widget-latlng="33.817617,-118.385433"` on /contact-us). */
export const GEO = { latitude: 33.817617, longitude: -118.385433 };

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

/** "Monday - Thursday" -> the four day names; "Friday" -> ["Friday"]. */
function expandDays(range: string): string[] {
  const [from, to] = range.split("-").map((s) => s.trim());
  const i = DAYS.indexOf(from as (typeof DAYS)[number]);
  if (i === -1) return [];
  if (!to) return [DAYS[i]];
  const j = DAYS.indexOf(to as (typeof DAYS)[number]);
  return j === -1 ? [DAYS[i]] : DAYS.slice(i, j + 1);
}

/** "7am" -> "07:00", "5pm" -> "17:00", "12:30pm" -> "12:30". */
function to24h(t: string): string | null {
  const m = /^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/i.exec(t.trim());
  if (!m) return null;
  let h = Number(m[1]);
  const min = m[2] ?? "00";
  const pm = m[3].toLowerCase() === "pm";
  if (h === 12) h = pm ? 12 : 0;
  else if (pm) h += 12;
  return `${String(h).padStart(2, "0")}:${min}`;
}

/** HOURS as schema.org OpeningHoursSpecification entries.
 *
 *  Derived from HOURS rather than written out a second time: the footer and the
 *  structured data must never disagree about when the practice is open, and a
 *  second hand-maintained copy is exactly how that drifts. Closed ranges are
 *  omitted — schema.org treats an absent day as closed, and emitting a
 *  zero-length window instead makes Google show "Closed 00:00-00:00". */
export function openingHoursSpecification(): Array<{
  "@type": "OpeningHoursSpecification";
  dayOfWeek: string[];
  opens: string;
  closes: string;
}> {
  const out = [];
  for (const [dayRange, timeRange] of HOURS) {
    const [openRaw, closeRaw] = timeRange.split("-").map((s) => s.trim());
    const opens = to24h(openRaw ?? "");
    const closes = to24h(closeRaw ?? "");
    if (!opens || !closes) continue; // "Closed"
    const dayOfWeek = expandDays(dayRange);
    if (!dayOfWeek.length) continue;
    out.push({
      "@type": "OpeningHoursSpecification" as const,
      dayOfWeek,
      opens,
      closes,
    });
  }
  return out;
}
