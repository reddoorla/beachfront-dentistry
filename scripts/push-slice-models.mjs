// Push local slice models to Prismic's Custom Types API.
//
//   node scripts/push-slice-models.mjs              # dry run — shows the diff
//   node scripts/push-slice-models.mjs --apply      # actually pushes
//   node scripts/push-slice-models.mjs --apply hero carousel
//
// WHY THIS EXISTS. The Migration API validates every document against the slice
// models REGISTERED IN PRISMIC and silently drops each field the model does not
// declare — HTTP 200, no warning. Four such fields (hero/subpage
// `image_position` `heading_style` `hero_wash`, carousel/review `layout`)
// shipped: the published nav routes fell back to component defaults and
// diverged 24-43% from the matched /dev/match/* routes, which read the fixture
// object directly and so never round-trip through Prismic. Seeding content
// therefore has a HARD PRECONDITION — the models must be current in Prismic
// first — and Slice Machine is a UI, not something a scripted round can drive.
//
// SAFETY. A push REPLACES the remote model, so this is a dry run by default:
// it prints, per slice, exactly which variations and fields differ, and touches
// nothing without --apply. It only sends models whose JSON actually differs, so
// re-running it is a no-op. It never pushes a slice that exists only locally
// unless you name it — a typo in a directory name should not mint a new remote
// slice.
//
// TOKEN. A Custom Types API token (Prismic repo Settings -> API & Security ->
// Custom Types API), read from reddoor-starter/.env, passed in headers only,
// never printed. This is a DIFFERENT credential from the Migration API write
// token: the write token cannot push models, and the Slice Machine session in
// ~/.prismic 403s against this endpoint.
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = "48bb12d1";
const API = "https://customtypes.prismic.io";
const ENV_VAR = "BEACHFRONT_DENTISTRY_CUSTOMTYPES_TOKEN";

const HERE = dirname(fileURLToPath(import.meta.url));
const SLICES = join(HERE, "..", "src", "lib", "slices");

const env = readFileSync(
  `${homedir()}/Documents/GitHub/reddoor-starter/.env`,
  "utf8",
);
const TOKEN = env.match(new RegExp(`^${ENV_VAR}=(.+)$`, "m"))?.[1]?.trim();
if (!TOKEN) {
  console.error(
    `${ENV_VAR} not found in reddoor-starter/.env.\n\n` +
      `Create one at https://prismic.io/dashboard/repository/${REPO}/settings/apis\n` +
      `("Custom Types API" -> create token), then add it to that .env file.\n` +
      `The Migration API write token will NOT work here — different scope.`,
  );
  process.exit(2);
}

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const only = args.filter((a) => !a.startsWith("--"));

const headers = { repository: REPO, Authorization: `Bearer ${TOKEN}` };
const jsonHeaders = { ...headers, "Content-Type": "application/json" };

/** Local models, keyed by slice id. */
function localModels() {
  const out = new Map();
  for (const dir of readdirSync(SLICES)) {
    const file = join(SLICES, dir, "model.json");
    if (!existsSync(file)) continue;
    const model = JSON.parse(readFileSync(file, "utf8"));
    out.set(model.id, { model, dir });
  }
  return out;
}

/** Per-variation field-level difference, so the dry run is readable. */
function describeDiff(local, remote) {
  const lines = [];
  const lv = new Map((local.variations ?? []).map((v) => [v.id, v]));
  const rv = new Map((remote?.variations ?? []).map((v) => [v.id, v]));
  for (const [id, v] of lv) {
    const r = rv.get(id);
    if (!r) {
      lines.push(`    + variation ${id} (new)`);
      continue;
    }
    for (const zone of ["primary", "items"]) {
      const lk = Object.keys(v[zone] ?? {});
      const rk = Object.keys(r[zone] ?? {});
      for (const k of lk)
        if (!rk.includes(k)) lines.push(`    + ${id}.${zone}.${k}`);
      for (const k of rk)
        if (!lk.includes(k))
          lines.push(`    - ${id}.${zone}.${k} (REMOVED remotely)`);
      for (const k of lk)
        if (
          rk.includes(k) &&
          JSON.stringify(v[zone][k]) !== JSON.stringify(r[zone][k])
        )
          lines.push(`    ~ ${id}.${zone}.${k} (changed)`);
    }
  }
  for (const id of rv.keys())
    if (!lv.has(id)) lines.push(`    - variation ${id} (REMOVED remotely)`);
  return lines;
}

const res = await fetch(`${API}/slices`, { headers });
if (!res.ok) {
  console.error(
    `GET ${API}/slices -> ${res.status}. ${(await res.text()).slice(0, 200)}\n` +
      `A 403 here means the token is not a Custom Types API token.`,
  );
  process.exit(1);
}
const remote = new Map((await res.json()).map((s) => [s.id, s]));
const local = localModels();

let changed = 0,
  pushed = 0;
for (const [id, { model, dir }] of local) {
  if (only.length && !only.includes(id)) continue;
  const r = remote.get(id);
  if (!r && !only.includes(id)) continue; // never auto-create; name it explicitly
  if (r && JSON.stringify(model) === JSON.stringify(r)) continue;
  changed++;
  console.log(`${id}  (src/lib/slices/${dir}/model.json)${r ? "" : "  [NEW]"}`);
  for (const line of describeDiff(model, r)) console.log(line);
  if (!APPLY) continue;
  const endpoint = r ? `${API}/slices/update` : `${API}/slices/insert`;
  const put = await fetch(endpoint, {
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

if (!changed) {
  console.log("All slice models match Prismic — nothing to push.");
} else if (APPLY) {
  console.log(
    `\n${pushed}/${changed} model(s) pushed. Re-seed next:\n` +
      `  node scripts/seed-pages.mjs`,
  );
} else {
  console.log(
    `\n${changed} model(s) differ. This was a DRY RUN — nothing was sent.\n` +
      `Re-run with --apply to push.`,
  );
}
