// Push local slice models to Prismic's Custom Types API.
//
//   node scripts/push-slice-models.mjs              # dry run — shows the diff
//   node scripts/push-slice-models.mjs --apply      # actually pushes
//   node scripts/push-slice-models.mjs --apply hero carousel
//
// WHY THIS EXISTS. The Migration API validates every document against the slice
// models REGISTERED IN PRISMIC and silently drops each field the model does not
// declare — HTTP 200, no warning. Five such fields shipped (hero/subpage
// `image_position` `heading_style` `hero_wash`, carousel/review `layout`,
// collection_list/people `order_uids`): the published nav routes fell back to
// component defaults and diverged 5-29% from the matched /dev/match/* routes,
// which read the fixture object directly and so never round-trip through
// Prismic. Seeding therefore has a HARD PRECONDITION — the models must be
// current in Prismic first, which scripts/seed-pages.mjs now asserts — and
// Slice Machine is a UI, not something a scripted round can drive.
//
// SAFETY. A push REPLACES the remote model, so this is a dry run by default:
// it prints, per slice, exactly which variations and fields differ, and touches
// nothing without --apply. It only sends models whose JSON actually differs, so
// re-running it is a no-op. It never pushes a slice that exists only locally
// unless you name it — a typo in a directory name should not mint a new remote
// slice.
//
// TOKEN. The same BEACHFRONT_DENTISTRY_WRITE_TOKEN the seed scripts use, read
// from reddoor-starter/.env, passed in headers only, never printed — it carries
// the Custom Types API scope too (verified: GET /slices -> 200). Note the
// contrast with the Migration API, where that token is write-only and
// `GET /documents` 403s at the gateway. The Slice Machine session in ~/.prismic
// is NOT usable here — it 403s.
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import {
  CUSTOM_TYPES_API as API,
  describeDiff,
  localModels,
  remoteModels,
  sameModel as same,
  withRemoteScreenshots,
} from "./lib/slice-models.mjs";

const REPO = "48bb12d1";
const ENV_VAR = "BEACHFRONT_DENTISTRY_WRITE_TOKEN";

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

let remote;
try {
  remote = await remoteModels(REPO, TOKEN);
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
const local = localModels();

let changed = 0,
  pushed = 0;
for (const [id, { model, dir }] of local) {
  if (only.length && !only.includes(id)) continue;
  const r = remote.get(id);
  if (!r && !only.includes(id)) continue; // never auto-create; name it explicitly
  if (r && same(model, r)) continue;
  changed++;
  console.log(`${id}  (src/lib/slices/${dir}/model.json)${r ? "" : "  [NEW]"}`);
  for (const line of describeDiff(model, r)) console.log(line);
  if (!APPLY) continue;
  const endpoint = r ? `${API}/slices/update` : `${API}/slices/insert`;
  const put = await fetch(endpoint, {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify(withRemoteScreenshots(model, r)),
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
