// Seed each `person` doc's `gallery` group with its favorite-beach banner
// (image + caption) — the `.team-grid-beach` box at the bottom of live's
// /our-team person cards. The blux migrate never captured this (all 11 person
// docs ship with an empty gallery); the verbatim capture lives in
// PERSON_BEACHES (src/lib/beachfront-pages.js), backed by 5 downscaled photos
// in static/beaches/ — resolution to spare for a ~144px-tall banner.
//
// Mechanism mirrors scripts/seed-pages.mjs + reddoor-maintenance's runMigration:
//   - the 5 beach photos upload to the Asset API first (dedup by filename), so
//     the gallery image is just `{ id }`; alt is set on the asset at upload.
//   - the 11 person docs already exist PUBLISHED on master, so each POST to the
//     Migration API returns "already exists"; we look up the master id and PUT
//     the FULL data (title/body/media/tags preserved, image fields reduced to
//     `{ id }`, unfilled link/date dropped) with `gallery` added. A partial PUT
//     would wipe the other fields — the Migration API replaces, never merges.
//
// Everything lands in the SAME unpublished Migration release as the pages, so a
// single publish takes the rebuilt pages + the person galleries live together.
//
// Token: read from reddoor-starter/.env (authorized), headers only, never
// printed. Idempotent: re-running reuses assets and re-PUTs the docs.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";
import { PERSON_BEACHES } from "../src/lib/beachfront-pages.js";

const REPO = "48bb12d1";
const env = readFileSync(
  `${homedir()}/Documents/GitHub/reddoor-starter/.env`,
  "utf8",
);
const TOKEN = env
  .match(/^BEACHFRONT_DENTISTRY_WRITE_TOKEN=(.+)$/m)?.[1]
  ?.trim();
if (!TOKEN)
  throw new Error(
    "BEACHFRONT_DENTISTRY_WRITE_TOKEN not found in reddoor-starter/.env",
  );

const THROTTLE_MS = 1200;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const authHeaders = { repository: REPO, Authorization: `Bearer ${TOKEN}` };
const jsonHeaders = { ...authHeaders, "Content-Type": "application/json" };

async function fetchWithRetry(url, opts) {
  for (let i = 0; i < 4; i++) {
    const res = await fetch(url, opts);
    if (res.status !== 429) return res;
    await sleep(1500 * (i + 1));
  }
  return fetch(url, opts);
}
async function expectOk(res, label) {
  if (!res.ok)
    throw new Error(
      `${label}: ${res.status} ${(await res.text()).slice(0, 300)}`,
    );
  return res;
}

// Omit empty-object fields (Prismic rejects `{}` for an unfilled Link/Image);
// keep empty arrays (valid unfilled StructuredText). Same as seed-pages.mjs.
function stripEmpty(v) {
  if (Array.isArray(v)) return v.map(stripEmpty);
  if (v && typeof v === "object") {
    const out = {};
    for (const [k, val] of Object.entries(v)) {
      const c = stripEmpty(val);
      if (
        c &&
        typeof c === "object" &&
        !Array.isArray(c) &&
        Object.keys(c).length === 0
      )
        continue;
      out[k] = c;
    }
    return out;
  }
  return v;
}

// ---- asset upload + dedup ----------------------------------------------------
async function listExistingAssets() {
  const byFilename = new Map();
  let cursor;
  for (let i = 0; i < 50; i++) {
    const u = new URL("https://asset-api.prismic.io/assets");
    u.searchParams.set("limit", "1000");
    if (cursor) u.searchParams.set("cursor", cursor);
    const res = await expectOk(
      await fetchWithRetry(u, { headers: authHeaders }),
      "list assets",
    );
    const json = await res.json();
    for (const a of json.items ?? [])
      byFilename.set(a.filename, { id: a.id, url: a.url });
    cursor = json.cursor;
    if (!cursor || (json.items ?? []).length === 0) break;
  }
  return byFilename;
}

const staticDir = fileURLToPath(new URL("../static", import.meta.url));

// Resolve each unique beach file → asset id, uploading the ones not already in
// the library (alt = caption). Returns Map<localPath "/beaches/x.jpg", id>.
async function resolveBeachAssets(existing) {
  // one caption per file (a shared file always carries the same caption).
  const captionByImg = new Map();
  for (const { img, caption } of Object.values(PERSON_BEACHES))
    if (!captionByImg.has(img)) captionByImg.set(img, caption);

  const idByImg = new Map();
  let uploaded = 0,
    reused = 0;
  for (const [img, caption] of captionByImg) {
    const filename = img.split("/").pop();
    const known = existing.get(filename);
    if (known) {
      idByImg.set(img, known.id);
      reused++;
      continue;
    }
    const buf = readFileSync(`${staticDir}${img}`);
    const form = new FormData();
    form.append("file", new Blob([buf], { type: "image/jpeg" }), filename);
    form.append("alt", caption);
    const res = await expectOk(
      await fetchWithRetry("https://asset-api.prismic.io/assets", {
        method: "POST",
        headers: authHeaders,
        body: form,
      }),
      `upload ${filename}`,
    );
    const created = await res.json();
    idByImg.set(img, created.id);
    existing.set(filename, { id: created.id, url: created.url });
    uploaded++;
    console.log(`  asset ↑ ${filename}`);
    await sleep(THROTTLE_MS);
  }
  console.log(`beach assets: ${uploaded} uploaded, ${reused} reused`);
  return idByImg;
}

// ---- person docs -------------------------------------------------------------
async function fetchPersonDocs() {
  const api = await (await fetch(`https://${REPO}.prismic.io/api/v2`)).json();
  const ref = api.refs.find((r) => r.isMasterRef).ref;
  const docs = [];
  for (let page = 1, total = 1; page <= total; page++) {
    const q = await (
      await fetch(
        `https://${REPO}.prismic.io/api/v2/documents/search?ref=${ref}&pageSize=100&page=${page}&q=${encodeURIComponent('[[at(document.type,"person")]]')}`,
      )
    ).json();
    docs.push(...q.results);
    total = q.total_pages;
  }
  return docs; // each: { id, uid, data:{ title, body, media, tags, date, link, gallery } }
}

// A fetched image field carries {id,url,dimensions,alt,edit}; the Migration API
// wants just {id} (alt lives on the asset; the migrate never set a crop).
const asImageRef = (im) => (im && im.id ? { id: im.id } : undefined);
const asText = (rt) =>
  Array.isArray(rt) ? rt.map((b) => b.text ?? "").join(" ") : "";

async function main() {
  const existing = await listExistingAssets();
  const idByImg = await resolveBeachAssets(existing);

  const docs = await fetchPersonDocs();
  console.log(`person docs: ${docs.length}`);

  let updated = 0;
  const skipped = [];
  for (const doc of docs) {
    const beach = PERSON_BEACHES[doc.uid];
    if (!beach) {
      skipped.push(doc.uid);
      continue;
    }
    const beachId = idByImg.get(beach.img);
    if (!beachId) throw new Error(`no asset id for ${beach.img} (${doc.uid})`);

    const d = doc.data;
    const data = stripEmpty({
      // preserve the existing fields verbatim (images → {id})…
      title: d.title, // StructuredText — round-trips as-is
      body: d.body, // StructuredText — round-trips as-is
      media: asImageRef(d.media),
      tags: d.tags,
      ...(d.date ? { date: d.date } : {}),
      ...(d.link && d.link.link_type !== "Any" ? { link: d.link } : {}),
      // …and add the favorite-beach banner.
      gallery: [{ image: { id: beachId }, caption: beach.caption }],
    });

    const body = JSON.stringify({
      type: "person",
      uid: doc.uid,
      lang: "en-us",
      title: asText(d.title) || doc.uid,
      data,
    });
    // POST first; the published stub → "already exists" → PUT by master id.
    const res = await fetchWithRetry("https://migration.prismic.io/documents", {
      method: "POST",
      headers: jsonHeaders,
      body,
    });
    if (!res.ok) {
      const text = await res.text();
      if (!/already exists/i.test(text))
        throw new Error(
          `create ${doc.uid}: ${res.status} ${text.slice(0, 300)}`,
        );
      await sleep(THROTTLE_MS);
      await expectOk(
        await fetchWithRetry(
          `https://migration.prismic.io/documents/${doc.id}`,
          { method: "PUT", headers: jsonHeaders, body },
        ),
        `update ${doc.uid}`,
      );
    }
    updated++;
    console.log(`gallery → ${doc.uid} (${beach.caption})`);
    await sleep(THROTTLE_MS);
  }
  if (skipped.length)
    console.log(`no beach mapped (skipped): ${skipped.join(", ")}`);
  console.log(
    `\nDONE: ${updated} person docs updated. Publish the Migration release to go live.`,
  );
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
