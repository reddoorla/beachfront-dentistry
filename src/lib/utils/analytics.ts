/** GA4 web-stream measurement ID for beachfrontdentistry.com. The numeric
 *  property ID (what the fleet's report enrichment needs on the Airtable
 *  `GA4 property ID` column) is a different value — this one belongs to the
 *  browser tag only. */
export const GA_MEASUREMENT_ID = "G-51J638HZPL";

/** Only the production hostnames may report analytics. Localhost, the
 *  matching-gate dev server, and Netlify previews/branch deploys all fall
 *  outside the list, so audit and rehearsal traffic never reaches the
 *  property. */
const PRODUCTION_HOSTNAMES = new Set([
  "www.beachfrontdentistry.com",
  "beachfrontdentistry.com",
]);

export function shouldLoadAnalytics(hostname: string, dev: boolean): boolean {
  return !dev && PRODUCTION_HOSTNAMES.has(hostname);
}
