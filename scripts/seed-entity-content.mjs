// Seed every entity field the Webflow import never captured:
//
//   person.teaser              /our-team card excerpt        (11 docs)
//   person.order               editorial roster order        (11 docs)
//   person.gallery             favorite-beach banner         (11 docs)
//   news_article.summary       Ask-the-Doctor card copy      (40 docs)
//   news_article.home_order    home featured row, 1..6        (6 of 40)
//   collection_item.link_label services-panel link wording   (24 docs)
//   collection_item.order      position within its panel     (24 docs)
//
// All of it is real CMS content, so it is MODELLED on the custom types
// (customtypes/{person,news_article,collection_item}/index.json) and the
// templates read it straight off the document — nothing is pinned by uid inside
// a slice any more. This file is the migration MECHANISM; the payloads are
// src/lib/beachfront-entities.js (machine-transcribed from live) and
// PERSON_BEACHES in src/lib/beachfront-pages.js.
//
// ONE script writes each document type, deliberately. The Migration API's PUT
// replaces a document rather than merging, and the release cannot be read back
// (GET /documents 403s at the gateway), so two scripts touching `person` would
// silently overwrite each other's fields depending on run order. That is why
// the beach galleries are seeded here alongside the teasers instead of in a
// second script — see scripts/lib/prismic-migration.mjs.
//
// Push the custom-type changes to Prismic BEFORE running this, or the new
// fields land on documents whose model has no home for them:
//   npx @slicemachine/adapter-sveltekit push-types   (or Slice Machine's UI)
//
// Everything lands in the SAME unpublished Migration release as the pages, so
// one publish takes the whole rebuild live.
//
// Token: read from reddoor-starter/.env (authorized), headers only, never
// printed. Idempotent: re-running reuses assets and re-PUTs the same payload.
// `--dry-run` prints what would be staged and writes nothing.
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { homedir } from "node:os";
import { PERSON_BEACHES } from "../src/lib/beachfront-pages.js";
import {
  PERSON_CONTENT,
  NEWS_ARTICLE_CONTENT,
  COLLECTION_ITEM_CONTENT,
} from "../src/lib/beachfront-entities.js";
import { normalizeBodyLinks } from "./lib/body-links.mjs";
import {
  asImageRef,
  asText,
  expectOk,
  fetchWithRetry,
  headersFor,
  masterDocs,
  sleep,
  stageDocument,
  stripEmpty,
  throttleMs as THROTTLE_MS,
} from "./lib/prismic-migration.mjs";

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

const headers = headersFor(TOKEN);
const authHeaders = headers.auth;
const DRY_RUN = process.argv.includes("--dry-run");

// ---- beach assets: upload + dedup by filename --------------------------------
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
//
// The five JPEGs this once uploaded FROM are no longer in the repo: they are in
// Prismic, every person document carries one, and keeping a second copy in git
// was duplicating the CMS. The paths below are now just the library's dedup key
// (the filename), so the normal path is "reused, 5". Uploading again only
// happens on a repository that has never been seeded, which is also the only
// case that needs the local files — hence the loud failure rather than a
// silently image-less gallery.
async function resolveBeachAssets() {
  const existing = await listExistingAssets();
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
    if (DRY_RUN) {
      console.log(`  [dry-run] asset ↑ ${filename}`);
      idByImg.set(img, `dry-run:${filename}`);
      uploaded++;
      continue;
    }
    if (!existsSync(`${staticDir}${img}`))
      throw new Error(
        `${filename} is neither in the Prismic asset library nor at static${img}.\n` +
          `  The beaches were moved into Prismic and deleted from the repo. Recover\n` +
          `  the original with:  git show f08d052:static${img} > static${img}\n` +
          `  re-run this script to upload it, then delete the file again.`,
      );
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

// ---- documents ---------------------------------------------------------------

// Every field these three custom types share, carried through verbatim so the
// replacing PUT preserves them. Images reduce to {id}; unfilled link/date drop.
const carryOver = (d) => ({
  title: d.title,
  body: normalizeBodyLinks(d.body),
  media: asImageRef(d.media),
  gallery: (d.gallery ?? []).map((row) => ({
    ...row,
    image: asImageRef(row.image),
  })),
  tags: d.tags,
  ...(d.date ? { date: d.date } : {}),
  ...(d.link && d.link.link_type !== "Any" ? { link: d.link } : {}),
});

const describe = (patch) =>
  Object.entries(patch)
    .map(([k, v]) => {
      if (typeof v === "string") return `${k}="${v.slice(0, 32)}…"`;
      if (Array.isArray(v)) return `${k}[${v.length}]`;
      return `${k}=${v}`;
    })
    .join(" ");

/** Stage one type. `patchFor(doc)` returns the fields to add, or null to skip. */
async function seed(type, patchFor) {
  const docs = await masterDocs(type);
  console.log(`${type}: ${docs.length} docs`);
  let updated = 0;
  const skipped = [];
  for (const doc of docs) {
    const patch = patchFor(doc);
    if (!patch) {
      skipped.push(doc.uid);
      continue;
    }
    const data = stripEmpty({ ...carryOver(doc.data), ...patch });
    console.log(
      `  ${DRY_RUN ? "[dry-run] " : ""}${type}/${doc.uid} ${describe(patch)}`,
    );
    if (!DRY_RUN) {
      await stageDocument({
        id: doc.id,
        type,
        uid: doc.uid,
        title: asText(doc.data.title) || doc.uid,
        data,
        headers,
      });
      await sleep(THROTTLE_MS);
    }
    updated++;
  }
  if (skipped.length)
    console.log(`  (no payload, left alone: ${skipped.join(", ")})`);
  return updated;
}

/** Fail loudly if the payload names a uid the repository doesn't have — a
 *  silent skip there is how a page ships with one card's content missing. */
function assertCovered(type, docs, payload) {
  const have = new Set(docs.map((d) => d.uid));
  const missing = Object.keys(payload).filter((uid) => !have.has(uid));
  if (missing.length)
    throw new Error(`${type}: no document for uid(s) ${missing.join(", ")}`);
}

async function main() {
  if (DRY_RUN) console.log("DRY RUN — nothing is written to Prismic.\n");

  const idByImg = await resolveBeachAssets();
  let total = 0;

  total += await seed("person", (doc) => {
    const content = PERSON_CONTENT[doc.uid];
    const beach = PERSON_BEACHES[doc.uid];
    if (!content && !beach) return null;
    const beachId = beach && idByImg.get(beach.img);
    if (beach && !beachId)
      throw new Error(`no asset id for ${beach.img} (${doc.uid})`);
    return {
      ...content,
      ...(beach
        ? { gallery: [{ image: { id: beachId }, caption: beach.caption }] }
        : {}),
    };
  });

  total += await seed(
    "news_article",
    (doc) => NEWS_ARTICLE_CONTENT[doc.uid] ?? null,
  );
  total += await seed(
    "collection_item",
    (doc) => COLLECTION_ITEM_CONTENT[doc.uid] ?? null,
  );

  console.log(
    DRY_RUN
      ? `\nDRY RUN: ${total} documents would be staged.`
      : `\nDONE: ${total} documents staged. Publish the Migration release to go live.`,
  );
}

// Coverage check up front, so a typo'd uid fails before anything is written.
for (const [type, payload] of [
  ["person", PERSON_CONTENT],
  ["news_article", NEWS_ARTICLE_CONTENT],
  ["collection_item", COLLECTION_ITEM_CONTENT],
]) {
  assertCovered(type, await masterDocs(type), payload);
}

// Run only when invoked directly. This module also EXPORTS helpers, and an
// unguarded top-level main() meant `import { … } from "./seed-entity-content.mjs"`
// silently fired a real migration write — a test or a one-off verification
// script importing a pure function should never stage documents.
if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main().catch((e) => {
    console.error(e.message ?? e);
    process.exit(1);
  });
}
