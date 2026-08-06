// Download the two SHARED detail-hero photos live uses (team beach + service
// reception) into static/images/ so the hand-built routes clear the app CSP
// (img-src *.prismic.io only) — same approach contact-us took. The question
// hero is per-doc (doc.data.media, a Prismic imgix url) so it needs no asset.
import { writeFileSync } from "node:fs";
const assets = [
  [
    "https://cdn.prod.website-files.com/64b1c843b071dc32170ea053/64bb0f96fd2a4cab9f42ccaa_beach-img_elizeu-dias-RN6ts8IZ4_0-unsplash-p-1600.jpg",
    "static/images/team-member-hero.jpg",
  ],
  [
    "https://cdn.prod.website-files.com/64af3f93339537d6b661b556/64b1ced3281a341a1cc50074_DSC_7625.jpg",
    "static/images/service-hero.jpg",
  ],
];
for (const [url, out] of assets) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  const buf = Buffer.from(await r.arrayBuffer());
  writeFileSync(out, buf);
  console.log(`saved ${out} (${(buf.length / 1024).toFixed(0)} KB)`);
}
