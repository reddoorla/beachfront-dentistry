// Slice models: local (src/lib/slices/*/model.json) vs the copies REGISTERED
// in Prismic, and the comparison that tells them apart honestly.
//
// This exists because seeding content has an invisible precondition. The
// Migration API validates each document against the models registered in
// Prismic and silently drops every field the model does not declare — HTTP 200,
// no warning. Five such fields shipped (hero/subpage `image_position`
// `heading_style` `hero_wash`, carousel/review `layout`, collection_list/people
// `order_uids`): the published nav routes fell back to component defaults and
// diverged 5-29% from the matched /dev/match/* routes, which read the fixture
// object directly and so never round-trip through Prismic.
//
// A unit test cannot catch this. It can only compare the fixture to the LOCAL
// model — and the local model was right. The binding constraint is the REMOTE
// one, which needs the network. Hence assertModelsInSync, called by the seed.
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
export const SLICES_DIR = join(HERE, "..", "..", "src", "lib", "slices");
export const CUSTOM_TYPES_API = "https://customtypes.prismic.io";

/** Canonical form for comparison.
 *
 * Prismic hands a model back through its own serializer, so its copy differs
 * from the file on disk in three ways that mean NOTHING: key order, an explicit
 * `"select": null` added to Link fields, and `imageUrl` (the slice's preview
 * screenshot, which lives in Prismic and is `""` in every file on disk).
 * Comparing raw JSON called all 30 models "different" and buried the 3 that
 * were — the same noise that let the stripped fields hide in the first place. */
export function canon(v) {
  if (Array.isArray(v)) return v.map(canon);
  if (v && typeof v === "object")
    return Object.fromEntries(
      Object.entries(v)
        .filter(([k, x]) => x !== null && k !== "imageUrl")
        .sort(([a], [b]) => (a < b ? -1 : 1))
        .map(([k, x]) => [k, canon(x)]),
    );
  return v;
}

export const sameModel = (a, b) =>
  JSON.stringify(canon(a)) === JSON.stringify(canon(b));

/** Local models keyed by slice id, with the directory they came from. */
export function localModels() {
  const out = new Map();
  for (const dir of readdirSync(SLICES_DIR)) {
    const file = join(SLICES_DIR, dir, "model.json");
    if (!existsSync(file)) continue;
    const model = JSON.parse(readFileSync(file, "utf8"));
    out.set(model.id, { model, dir });
  }
  return out;
}

/** Models registered in Prismic, keyed by slice id. */
export async function remoteModels(repo, token) {
  const res = await fetch(`${CUSTOM_TYPES_API}/slices`, {
    headers: { repository: repo, Authorization: `Bearer ${token}` },
  });
  if (!res.ok)
    throw new Error(
      `GET ${CUSTOM_TYPES_API}/slices -> ${res.status} ${(await res.text()).slice(0, 200)}`,
    );
  return new Map((await res.json()).map((s) => [s.id, s]));
}

/** Field-level differences for one slice, as readable lines. */
export function describeDiff(local, remote) {
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
        if (rk.includes(k) && !sameModel(v[zone][k], r[zone][k]))
          lines.push(`    ~ ${id}.${zone}.${k} (changed)`);
    }
  }
  for (const id of rv.keys())
    if (!lv.has(id)) lines.push(`    - variation ${id} (REMOVED remotely)`);
  return lines;
}

/** The model to SEND: local semantics, remote screenshots. A push REPLACES the
 *  model, so sending the local `imageUrl: ""` would blank every slice preview
 *  in the editor UI as a side effect of adding a field. */
export function withRemoteScreenshots(local, remote) {
  if (!remote) return local;
  const shots = new Map(
    (remote.variations ?? []).map((v) => [v.id, v.imageUrl]),
  );
  return {
    ...local,
    variations: local.variations.map((v) =>
      shots.get(v.id) ? { ...v, imageUrl: shots.get(v.id) } : v,
    ),
  };
}

/** Seed precondition. Throws unless every slice model a seed will write is
 *  already registered in Prismic in its current local form — because anything
 *  newer on disk than in Prismic gets dropped from the document, silently. */
export async function assertModelsInSync(repo, token, sliceIds) {
  const remote = await remoteModels(repo, token);
  const local = localModels();
  const stale = [];
  for (const id of new Set(sliceIds)) {
    const l = local.get(id);
    if (!l) {
      stale.push(`  ${id}: no local model.json`);
      continue;
    }
    const r = remote.get(id);
    if (!r) {
      stale.push(`  ${id}: NOT REGISTERED in Prismic`);
      continue;
    }
    if (!sameModel(l.model, r))
      stale.push(`  ${id}:\n${describeDiff(l.model, r).join("\n")}`);
  }
  if (stale.length)
    throw new Error(
      `Slice models are out of sync with Prismic. The Migration API would\n` +
        `silently DROP the fields below and the seeded pages would render\n` +
        `component defaults instead:\n\n${stale.join("\n")}\n\n` +
        `Push them first:\n  node scripts/push-slice-models.mjs --apply`,
    );
}
