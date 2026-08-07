import { env } from "$env/dynamic/private";
import { createIngestAction } from "@reddoorla/maintenance/forms";
import type { Actions, PageServerLoad } from "./$types";

// The root layout sets `prerender = "auto"`; a form `action` cannot run on a
// prerendered route ("Cannot prerender pages with actions"). Opt out — this
// route is genuinely dynamic.
export const prerender = false;

// Plant a per-request timestamp for the bot timing screen. `title` flows to
// the root layout's <Seo> (static routes set head via data, not their own tags).
//
// `meta_description` is set here for the same reason the five Prismic pages got
// one — but it has to live in code, not in the CMS, because /contact-us is a
// hard-coded SvelteKit route with no `page` document and therefore no SEO tab
// for the seed to write to. That is exactly why it was the one nav page left
// without a description: the seeding work reached every route that HAS a
// document and silently skipped the one that does not. It is nav-linked from
// every page and carries no noindex, so it is indexable, and for a dental
// practice the contact page is a high-intent search landing.
export const load: PageServerLoad = () => ({
  formTs: Date.now(),
  title: "Contact",
  meta_description:
    "Call Beachfront Dentistry at (310) 378-9241 or send us a message. Find our Redondo Beach office hours, address and directions on the map.",
});

export const actions: Actions = {
  default: createIngestAction({
    formType: "contact",
    getConfig: () => ({
      url: env.FORMS_INGEST_URL,
      token: env.FORMS_INGEST_TOKEN,
    }),
    buildPayload: (form, event) => ({
      name: form.get("name")?.toString(),
      email: form.get("email")?.toString(),
      phone: form.get("phone")?.toString(),
      message: form.get("message")?.toString(),
      // Full URL incl. query string so UTM/campaign params (?utm_source=…) are captured.
      sourceUrl: event.url.href,
      // Synthetic end-to-end probe marker (the fleet `form-e2e` audit). Forwarded
      // ONLY when the submitted form carries testMode=true — a real visitor never
      // sets it. Rides through as an extraField (no schema change); central ingest
      // recognizes it and routes the submission away from every real sink.
      testMode: form.get("testMode")?.toString() === "true" || undefined,
    }),
  }),
};
