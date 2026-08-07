// Seed the 5 native `page` docs (home, your-first-visit, our-team, services,
// ask-the-doctor) with their real slice assemblies — authored from VERBATIM
// copy lifted off the live Webflow site (beachfrontdentistry.com). The
// webflow-import IR only ever captured the entity collections
// (services/questions/team), never page-level chrome, so the migrate left
// these five as hero-only stubs; this script fills them.
//
// The assemblies themselves live in src/lib/beachfront-pages.js — the SINGLE
// source of truth shared with the local matching gate route (dev/match/[uid]),
// so any copy/order/structure fix made while matching live lands in exactly
// what this script publishes. This file is just the migration MECHANISM.
//
// Mechanism mirrors reddoor-maintenance's proven runMigration:
//   - page-level images upload to the Asset API first (dedup by filename against
//     the existing library), and the Image field carries just `{ id }`.
//   - the 5 pages already exist PUBLISHED on master (stubs), so each POST to the
//     Migration API returns "already exists"; we then look up the master doc id
//     and PUT the real assembly. Everything lands in an unpublished Migration
//     release for Tucker to review + publish.
//
// Token: read from reddoor-starter/.env (authorized), passed only in headers,
// never printed. Idempotent: re-running reuses assets and re-PUTs the docs.
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { head, TITLES, assemblies } from "../src/lib/beachfront-pages.js";
import { assertModelsInSync } from "./lib/slice-models.mjs";

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

// Prismic rejects an unfilled Link/Image passed as `{}` ("link_type must be
// Web…") — an empty field must be OMITTED entirely. Drop every empty-object
// value (keep empty arrays, which are valid unfilled StructuredText).
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

const filenameOf = (url) =>
  decodeURIComponent(url.split("/").pop().split("?")[0]);

// Resolve a set of remote image URLs → Map<url, {id}>, uploading only the
// filenames not already in the library.
async function resolveAssets(urls, existing) {
  const idByUrl = new Map();
  let uploaded = 0,
    reused = 0;
  for (const url of urls) {
    const filename = filenameOf(url);
    const known = existing.get(filename);
    if (known) {
      idByUrl.set(url, { id: known.id });
      reused++;
      continue;
    }
    const blob = await (
      await expectOk(await fetch(url), `fetch ${filename}`)
    ).blob();
    const form = new FormData();
    form.append("file", blob, filename);
    const res = await expectOk(
      await fetchWithRetry("https://asset-api.prismic.io/assets", {
        method: "POST",
        headers: authHeaders,
        body: form,
      }),
      `upload ${filename}`,
    );
    const created = await res.json();
    idByUrl.set(url, { id: created.id });
    existing.set(filename, { id: created.id, url: created.url });
    uploaded++;
    console.log(`  asset ↑ ${filename}`);
    await sleep(THROTTLE_MS);
  }
  console.log(`assets: ${uploaded} uploaded, ${reused} reused`);
  return idByUrl;
}

// =============================================================================
// RUN
// =============================================================================
async function lookupPageIds() {
  const api = await (await fetch(`https://${REPO}.prismic.io/api/v2`)).json();
  const ref = api.refs.find((r) => r.isMasterRef).ref;
  const q = await (
    await fetch(
      `https://${REPO}.prismic.io/api/v2/documents/search?ref=${ref}&pageSize=100`,
    )
  ).json();
  const byUid = new Map();
  for (const d of q.results) if (d.type === "page") byUid.set(d.uid, d.id);
  return byUid;
}

async function main() {
  // 1. collect every page-level image url, resolve to asset ids (dedup).
  const urls = new Set();
  const collectImg = (u) => (urls.add(u), { __url: u });
  const dryAsm = assemblies(collectImg);
  for (const slices of Object.values(dryAsm)) JSON.stringify(slices); // force eval
  console.log(`page-level images referenced: ${urls.size}`);

  // 1a. PRECONDITION: every slice model this seed writes must already be
  // registered in Prismic in its current local form. The Migration API drops
  // undeclared fields silently (200, no warning), so seeding against a stale
  // model publishes pages that render component defaults and look "fine" —
  // that is exactly how five fields shipped missing. Fail loudly instead.
  const sliceIds = Object.values(dryAsm).flatMap((slices) =>
    slices.map((s) => s.slice_type),
  );
  await assertModelsInSync(REPO, TOKEN, sliceIds);
  console.log(`slice models in sync: ${new Set(sliceIds).size} checked`);

  const existing = await listExistingAssets();
  const idByUrl = await resolveAssets([...urls], existing);
  const img = (u) => idByUrl.get(u); // {id}

  // 2. build final assemblies with resolved asset ids.
  const asm = assemblies(img);
  const pageIds = await lookupPageIds();

  let updated = 0,
    created = 0;
  for (const [uid, slices] of Object.entries(asm)) {
    const body = JSON.stringify({
      type: "page",
      uid,
      lang: "en-us",
      title: TITLES[uid] ?? uid,
      data: stripEmpty({ title: [head(1, TITLES[uid] ?? uid)], slices }),
    });
    // POST first; on "already exists", PUT by the master doc id (the stubs are
    // published, so the id resolves).
    const res = await fetchWithRetry("https://migration.prismic.io/documents", {
      method: "POST",
      headers: jsonHeaders,
      body,
    });
    if (res.ok) {
      created++;
      console.log(`created ${uid} (${slices.length} slices)`);
    } else {
      const text = await res.text();
      if (!/already exists/i.test(text))
        throw new Error(`create ${uid}: ${res.status} ${text.slice(0, 300)}`);
      const id = pageIds.get(uid);
      if (!id)
        throw new Error(`update ${uid}: no master id (publish stub first?)`);
      await sleep(THROTTLE_MS);
      await expectOk(
        await fetchWithRetry(`https://migration.prismic.io/documents/${id}`, {
          method: "PUT",
          headers: jsonHeaders,
          body,
        }),
        `update ${uid}`,
      );
      updated++;
      console.log(`updated ${uid} (${slices.length} slices)`);
    }
    await sleep(THROTTLE_MS);
  }
  console.log(
    `\nDONE: ${created} created, ${updated} updated. Publish the Migration release to go live.`,
  );
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
