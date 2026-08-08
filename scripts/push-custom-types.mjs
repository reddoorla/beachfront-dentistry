// Push local custom types (customtypes/*/index.json) to Prismic's Custom Types
// API — the sibling of push-slice-models.mjs, same contract.
//
//   node scripts/push-custom-types.mjs            # dry run — shows the diff
//   node scripts/push-custom-types.mjs --apply    # actually pushes
//   node scripts/push-custom-types.mjs --apply page
//
// A custom type governs what an editor can DO: which slices the picker offers,
// which fields exist, what they are called. The repo is the source of truth for
// that shape, but nothing synced it — so a change here was invisible in Prismic
// until someone opened Slice Machine and pushed by hand.
//
// SAFETY. A push REPLACES the remote type, so this is a dry run by default and
// prints exactly which slice choices and top-level fields differ. It only sends
// types whose canonical JSON actually differs (re-running is a no-op), and it
// never creates a type that exists only locally unless you name it explicitly.
//
// REMOVING a slice choice is the one genuinely destructive edit here: documents
// already using that slice keep their content in the API but the editor can no
// longer add or (in some cases) edit it. Verify usage against published content
// before removing — for the 11 blux_* choices this script first removed, a scan
// of all 80 published documents found zero uses.
//
// TOKEN: BEACHFRONT_DENTISTRY_WRITE_TOKEN from reddoor-starter/.env, headers
// only, never printed. Same token as the slice push and the seed.
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  canon,
  sameModel,
  CUSTOM_TYPES_API as API,
} from "./lib/slice-models.mjs";

const REPO = "48bb12d1";
const ENV_VAR = "BEACHFRONT_DENTISTRY_WRITE_TOKEN";
const HERE = dirname(fileURLToPath(import.meta.url));
const TYPES_DIR = join(HERE, "..", "customtypes");

const env = readFileSync(
  `${homedir()}/Documents/GitHub/reddoor-starter/.env`,
  "utf8",
);
const TOKEN = env.match(new RegExp(`^${ENV_VAR}=(.+)$`, "m"))?.[1]?.trim();
if (!TOKEN) {
  console.error(`${ENV_VAR} not found in reddoor-starter/.env.`);
  process.exit(2);
}

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const only = args.filter((a) => !a.startsWith("--"));
const headers = { repository: REPO, Authorization: `Bearer ${TOKEN}` };
const jsonHeaders = { ...headers, "Content-Type": "application/json" };

/** Local custom types keyed by id. */
function localTypes() {
  const out = new Map();
  for (const dir of readdirSync(TYPES_DIR)) {
    const file = join(TYPES_DIR, dir, "index.json");
    if (!existsSync(file)) continue;
    const model = JSON.parse(readFileSync(file, "utf8"));
    out.set(model.id, { model, dir });
  }
  return out;
}

/** Slice choices declared by a type's slice zones, flattened. */
function choicesOf(model) {
  const out = new Set();
  const walk = (o) => {
    if (!o || typeof o !== "object") return;
    if (o.type === "Slices" && o.config?.choices)
      Object.keys(o.config.choices).forEach((k) => out.add(k));
    Object.values(o).forEach(walk);
  };
  walk(model);
  return out;
}

/** Readable difference for the dry run. */
function describe(local, remote) {
  const lines = [];
  const lc = choicesOf(local);
  const rc = choicesOf(remote ?? {});
  for (const k of lc) if (!rc.has(k)) lines.push(`    + slice choice ${k}`);
  for (const k of rc)
    if (!lc.has(k))
      lines.push(`    - slice choice ${k} (REMOVED from the picker)`);
  // anything outside the slice zones
  const strip = (o) => {
    const c = JSON.parse(JSON.stringify(o ?? {}));
    const walk = (x) => {
      if (!x || typeof x !== "object") return;
      if (x.type === "Slices" && x.config?.choices) x.config.choices = {};
      Object.values(x).forEach(walk);
    };
    walk(c);
    return c;
  };
  if (
    JSON.stringify(canon(strip(local))) !== JSON.stringify(canon(strip(remote)))
  )
    lines.push(`    ~ fields or settings outside the slice zones also differ`);
  return lines;
}

const res = await fetch(`${API}/customtypes`, { headers });
if (!res.ok) {
  console.error(
    `GET ${API}/customtypes -> ${res.status} ${(await res.text()).slice(0, 200)}`,
  );
  process.exit(1);
}
const remote = new Map((await res.json()).map((c) => [c.id, c]));
const local = localTypes();

let changed = 0,
  pushed = 0;
for (const [id, { model, dir }] of local) {
  if (only.length && !only.includes(id)) continue;
  const r = remote.get(id);
  if (!r && !only.includes(id)) continue; // never auto-create
  if (r && sameModel(model, r)) continue;
  changed++;
  console.log(`${id}  (customtypes/${dir}/index.json)${r ? "" : "  [NEW]"}`);
  for (const line of describe(model, r)) console.log(line);
  if (!APPLY) continue;
  const put = await fetch(`${API}/customtypes/${r ? "update" : "insert"}`, {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify(model),
  });
  if (!put.ok) {
    console.error(
      `    FAILED ${put.status}: ${(await put.text()).slice(0, 300)}`,
    );
    process.exitCode = 1;
    continue;
  }
  pushed++;
  console.log(`    pushed`);
}

if (!changed) console.log("All custom types match Prismic — nothing to push.");
else if (APPLY) console.log(`\n${pushed}/${changed} custom type(s) pushed.`);
else
  console.log(
    `\n${changed} custom type(s) differ. DRY RUN — nothing was sent.\n` +
      `Re-run with --apply to push.`,
  );
