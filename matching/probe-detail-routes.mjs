// Confirm the 3 rebuilt detail routes render (200 + expected h1) on the local
// candidate, using the live slugs so the gate can compare like-for-like.
//
// CAND-ONLY: nothing here reads the reference, so there is deliberately no
// assertRef() — there is no comparison to invalidate. The routes and the host
// were a three-row hand copy and come from harness.json now.
import { CAND, group } from "./probe-ref.mjs";

const routes = group("detail").map((p) => [p.key, CAND + p.cand]);
for (const [k, url] of routes) {
  try {
    const r = await fetch(url);
    const t = await r.text();
    const h1 = (t.match(/<h1[^>]*>([^<]*)</i) || [])[1] || "";
    const hasHero =
      /DetailHero|team-member-hero|service-hero|Blog \/ View/.test(t) ||
      t.includes("wave");
    const err =
      /Internal Error|500|SvelteKitError|ReferenceError/i.test(t) &&
      r.status !== 200;
    console.log(
      `${k}  ${r.status}  h1="${h1.slice(0, 40)}"  ${url.replace(CAND, "")}`,
    );
  } catch (e) {
    console.log(`${k}  ERR ${e.message}`);
  }
}
