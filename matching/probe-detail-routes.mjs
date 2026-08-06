// Confirm the 3 rebuilt detail routes render (200 + expected h1) on the local
// candidate, using the live slugs so the gate can compare like-for-like.
const routes = [
  ["team", "http://localhost:5173/team-members/dr-robert-quan"],
  ["svc", "http://localhost:5173/services/dental-exams"],
  ["qa", "http://localhost:5173/questions/regular-dental-cleanings-support-your-whole-body-health"],
];
for (const [k, url] of routes) {
  try {
    const r = await fetch(url);
    const t = await r.text();
    const h1 = (t.match(/<h1[^>]*>([^<]*)</i) || [])[1] || "";
    const hasHero = /DetailHero|team-member-hero|service-hero|Blog \/ View/.test(t) || t.includes("wave");
    const err = /Internal Error|500|SvelteKitError|ReferenceError/i.test(t) && r.status !== 200;
    console.log(`${k}  ${r.status}  h1="${h1.slice(0, 40)}"  ${url.replace("http://localhost:5173", "")}`);
  } catch (e) {
    console.log(`${k}  ERR ${e.message}`);
  }
}
