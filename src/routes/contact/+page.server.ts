import { redirect } from "@sveltejs/kit";

// The contact form lives at /contact-us (matching the live site's URL and the
// appointment modal's form action); permanently redirect the starter's old
// /contact path so stale links and crawlers land on the real page. The
// #appointment hash opens the appointment modal on load (the layout's
// afterNavigate hook — same contract as clicking an #appointment anchor), so
// anything that arrives via /contact lands with the form actually usable;
// the fleet's form-e2e probe enters here and needs a visible form.
//
// Served dynamically (like the form route it points at): the root layout's
// `prerender = "auto"` would otherwise bake this redirect at build time, and a
// dynamic 301 keeps behavior identical for every request path.
export const prerender = false;

export const load = () => {
  redirect(301, "/contact-us#appointment");
};
