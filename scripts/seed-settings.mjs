// Seed the `settings` singleton — the four shared photographs that used to be
// checked into static/images/.
//
//   settings.cta_beach         closing CTA band   (contact-us + 3 detail routes)
//   settings.contact_hero      /contact-us hero
//   settings.service_hero      /services/<uid> hero, when the service has none
//   settings.team_member_hero  /team-members/<uid> hero, when the person has none
//
// WHY THIS EXISTS. Those four JPEGs (1.2 MB) were the last content images living
// in the repo. They were put in /static because the app CSP allows img-src from
// Prismic only — 'self' covered them. The cost was invisible until measured:
// `srcset()` returns undefined for a non-Prismic URL (`isPrismicImageUrl` is
// false for /images/*.jpg), so those four bypassed the imgix ladder entirely and
// every visitor downloaded the full master. /contact-us shipped 971 KB of images
// to a phone that needed ~90 KB. Moving them into Prismic is what puts them on
// the ladder; it also puts them where an editor can change them.
//
// ONE SCRIPT PER DOCUMENT TYPE — the correctness rule, not a style preference.
// The Migration API's PUT REPLACES a document and the staged release cannot be
// read back (GET /documents 403s at the gateway), so a second script writing
// `settings` would silently drop whatever this one staged. `settings` is a new
// type with no other writer; every future field on it belongs in THIS file.
// See docs/migration.md and scripts/lib/prismic-migration.mjs.
//
// Push the custom type BEFORE running this, or the images land on a document
// whose model has no home for them and are dropped silently, HTTP 200:
//   node scripts/push-custom-types.mjs --apply settings
//
// Token: BEACHFRONT_DENTISTRY_WRITE_TOKEN from reddoor-starter/.env, headers
// only, never printed. Idempotent: re-running reuses the assets and re-PUTs the
// same payload. `--dry-run` prints what would happen and writes nothing.
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { homedir } from "node:os";
import {
  expectOk,
  fetchWithRetry,
  headersFor,
  repo as REPO,
  sleep,
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
const DRY_RUN = process.argv.includes("--dry-run");
const staticDir = fileURLToPath(new URL("../static", import.meta.url));

// The payload: Prismic field ← the file that used to be served from /static.
//
// `notes` is editor-facing only (it shows in the asset library, never in the
// DOM). Deliberately NO `alt`: all four are full-bleed backgrounds sitting
// behind their own heading, so the heading carries the meaning and the photo is
// decorative. Prismic's asset alt becomes `image.alt`, which becomes the <img>
// alt — giving these four a description would make a screen reader announce a
// backdrop on every page. Empty alt is the correct choice for a decorative
// image (WCAG 1.1.1), and it is what the hand-built ImageFields did.
const IMAGES = [
  {
    field: "cta_beach",
    file: "/images/cta-beach.jpg",
    notes:
      'Closing CTA band — the beach under "Ready for great dental health?"',
  },
  {
    field: "contact_hero",
    file: "/images/contact-hero.jpg",
    notes: "Hero band on /contact-us",
  },
  {
    field: "service_hero",
    file: "/images/service-hero.jpg",
    notes: "Hero band on a service page that carries no image of its own",
  },
  {
    field: "team_member_hero",
    file: "/images/team-member-hero.jpg",
    notes: "Hero band on a team-member page whose person has no favorite beach",
  },
];

// ---- assets ------------------------------------------------------------------

/** Every asset already in the library, keyed by filename. */
async function listExistingAssets() {
  const byFilename = new Map();
  let cursor;
  for (let i = 0; i < 50; i++) {
    const u = new URL("https://asset-api.prismic.io/assets");
    u.searchParams.set("limit", "1000");
    if (cursor) u.searchParams.set("cursor", cursor);
    const res = await expectOk(
      await fetchWithRetry(u, { headers: headers.auth }),
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

/**
 * Resolve each image to an asset id, uploading the ones not already there.
 *
 * The local file is the IMPORT source, not the source of truth, and it is
 * deliberately gone from the working tree — moving these four out of the repo
 * is the entire point of this script. So the library is consulted first and the
 * disk only when the library comes up empty, which is the one-time import case.
 * If both are empty this stops rather than staging a document with a missing
 * image: the originals are recoverable from git history, and the message says
 * so, because "seed ran fine, page has no hero" is exactly the silent failure
 * the Migration API is already too good at.
 */
async function resolveAssets() {
  const existing = await listExistingAssets();
  const idByField = new Map();
  let uploaded = 0,
    reused = 0;

  for (const { field, file, notes } of IMAGES) {
    const filename = file.split("/").pop();
    const known = existing.get(filename);
    if (known) {
      idByField.set(field, known.id);
      reused++;
      continue;
    }
    if (DRY_RUN) {
      console.log(`  [dry-run] asset ↑ ${filename}`);
      idByField.set(field, `dry-run:${filename}`);
      uploaded++;
      continue;
    }
    if (!existsSync(`${staticDir}${file}`))
      throw new Error(
        `${filename} is neither in the Prismic asset library nor at static${file}.\n` +
          `  These four were moved into Prismic and deleted from the repo. If the\n` +
          `  library really is missing one, recover the original with:\n` +
          `    git show d44b62c:static${file} > static${file}\n` +
          `  re-run this script to upload it, then delete the file again.`,
      );
    const buf = readFileSync(`${staticDir}${file}`);
    const form = new FormData();
    form.append("file", new Blob([buf], { type: "image/jpeg" }), filename);
    form.append("notes", notes);
    const res = await expectOk(
      await fetchWithRetry("https://asset-api.prismic.io/assets", {
        method: "POST",
        headers: headers.auth,
        body: form,
      }),
      `upload ${filename}`,
    );
    const created = await res.json();
    idByField.set(field, created.id);
    uploaded++;
    console.log(`  asset ↑ ${filename} (${(buf.length / 1024).toFixed(0)} KB)`);
    await sleep(THROTTLE_MS);
  }
  console.log(`assets: ${uploaded} uploaded, ${reused} reused`);
  return idByField;
}

// ---- the document ------------------------------------------------------------

/**
 * The published settings document's id, or null.
 *
 * A singleton has no uid, so there is no natural key that makes a second POST
 * safe — a blind re-POST is how you end up with two settings documents and a
 * coin-flip over which one `getSingle` returns.
 *
 * THE BLIND SPOT, measured rather than assumed: a document staged into the
 * migration release is invisible to EVERY reader available here. The Migration
 * API refuses to read itself back (GET /documents 403s at the gateway), and —
 * unlike an ordinary Prismic release — the migration release is not published
 * as a ref either: `/api/v2` listed exactly one ref, `master`, immediately
 * after a successful POST and on two retries after that.
 *
 * So between staging and publishing there is a window in which this script
 * cannot tell "never staged" from "staged, awaiting publish", and the two want
 * opposite verbs. It refuses to guess: it POSTs only when it is also willing to
 * believe the document does not exist, prints the id it created, and asks for
 * that id back via --doc-id=<id> if it is re-run inside the window. Once the
 * release is published the document is on master and this resolves it normally.
 */
async function findPublishedSettingsId() {
  const api = await (await fetch(`https://${REPO}.prismic.io/api/v2`)).json();
  const ref = api.refs.find((r) => r.isMasterRef).ref;
  const q = await (
    await fetch(
      `https://${REPO}.prismic.io/api/v2/documents/search?ref=${ref}&pageSize=10&q=${encodeURIComponent('[[at(document.type,"settings")]]')}`,
    )
  ).json();
  return q.results?.[0]?.id ?? null;
}

async function main() {
  if (DRY_RUN) console.log("DRY RUN — nothing is written to Prismic.\n");

  const idByField = await resolveAssets();
  const forcedId = process.argv
    .find((a) => a.startsWith("--doc-id="))
    ?.slice("--doc-id=".length);
  const existing = DRY_RUN
    ? null
    : forcedId
      ? { id: forcedId, where: "--doc-id" }
      : await (async () => {
          const id = await findPublishedSettingsId();
          return id ? { id, where: "master" } : null;
        })();

  const data = Object.fromEntries(
    IMAGES.map(({ field }) => [field, { id: idByField.get(field) }]),
  );
  for (const { field } of IMAGES)
    if (!data[field].id) throw new Error(`no asset id for settings.${field}`);

  const body = JSON.stringify({
    type: "settings",
    lang: "en-us",
    title: "Site Settings",
    data,
  });

  console.log(
    `\n${DRY_RUN ? "[dry-run] " : ""}settings ${existing ? `PUT ${existing.id} (found on ${existing.where})` : "POST (new document)"}`,
  );
  for (const { field, file } of IMAGES) console.log(`  ${field} ← ${file}`);
  if (DRY_RUN) {
    console.log("\nDRY RUN: nothing was written.");
    return;
  }

  if (existing) {
    await expectOk(
      await fetchWithRetry(
        `https://migration.prismic.io/documents/${existing.id}`,
        { method: "PUT", headers: headers.json, body },
      ),
      "update settings",
    );
  } else {
    const res = await expectOk(
      await fetchWithRetry("https://migration.prismic.io/documents", {
        method: "POST",
        headers: headers.json,
        body,
      }),
      "create settings",
    );
    const created = await res.json().catch(() => ({}));
    if (created.id)
      console.log(
        `\n  created document id: ${created.id}\n` +
          `  Re-running before the release is published?  Pass --doc-id=${created.id}\n` +
          `  or this script cannot see the document and will create a SECOND one.`,
      );
  }

  console.log(
    "\nDONE: settings staged. Publish the Migration release in Prismic to go live.",
  );
}

// Run only when invoked directly — importing this module must never fire a
// migration write. Same guard, same reason, as seed-entity-content.mjs.
if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main().catch((e) => {
    console.error(e.message ?? e);
    process.exit(1);
  });
}
