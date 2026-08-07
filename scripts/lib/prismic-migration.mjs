// Shared mechanism for the Prismic Migration-API seed scripts.
//
// The one rule that governs them: **the Migration API PUT REPLACES a document,
// it never merges.** A second script that rebuilds its payload from the MASTER
// document silently drops every field the first one staged. And the release
// cannot be read back to recover them — `GET https://migration.prismic.io/
// documents` 403s at the gateway with these credentials (only POST/PUT/DELETE
// are usable), so there is no "read the newest staged version" escape hatch.
//
// Therefore: **exactly one script may write a given document type**, and it
// must assemble every field that document needs in one payload. That is why
// the person galleries and the person teasers are seeded by the same script
// (seed-entity-content.mjs) rather than two.
//
// Token is passed in headers only and never printed.
const REPO = "48bb12d1";
const THROTTLE_MS = 1200;

export const repo = REPO;
export const throttleMs = THROTTLE_MS;
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function headersFor(token) {
  const auth = { repository: REPO, Authorization: `Bearer ${token}` };
  return { auth, json: { ...auth, "Content-Type": "application/json" } };
}

export async function fetchWithRetry(url, opts) {
  for (let i = 0; i < 4; i++) {
    const res = await fetch(url, opts);
    if (res.status !== 429) return res;
    await sleep(1500 * (i + 1));
  }
  return fetch(url, opts);
}

export async function expectOk(res, label) {
  if (!res.ok)
    throw new Error(
      `${label}: ${res.status} ${(await res.text()).slice(0, 300)}`,
    );
  return res;
}

/** Omit empty-object fields (Prismic rejects `{}` for an unfilled Link/Image);
 *  keep empty arrays (a valid unfilled StructuredText). */
export function stripEmpty(v) {
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

/** A fetched image field carries {id,url,dimensions,alt,edit}; the Migration
 *  API wants just {id} (alt lives on the asset, the migrate never set a crop). */
export const asImageRef = (im) => (im && im.id ? { id: im.id } : undefined);

export const asText = (rt) =>
  Array.isArray(rt) ? rt.map((b) => b.text ?? "").join(" ") : "";

/** Every published document of `type`, as `{ id, uid, data }`. */
export async function masterDocs(type) {
  const api = await (await fetch(`https://${REPO}.prismic.io/api/v2`)).json();
  const ref = api.refs.find((r) => r.isMasterRef).ref;
  const docs = [];
  for (let page = 1, total = 1; page <= total; page++) {
    const q = await (
      await fetch(
        `https://${REPO}.prismic.io/api/v2/documents/search?ref=${ref}&pageSize=100&page=${page}&q=${encodeURIComponent(`[[at(document.type,"${type}")]]`)}`,
      )
    ).json();
    docs.push(...q.results);
    total = q.total_pages;
  }
  return docs;
}

/**
 * Stage one document into the migration release. The docs already exist
 * PUBLISHED on master, so POST returns "already exists" and we PUT by master id.
 */
export async function stageDocument({ id, type, uid, title, data, headers }) {
  const body = JSON.stringify({ type, uid, lang: "en-us", title, data });
  const res = await fetchWithRetry("https://migration.prismic.io/documents", {
    method: "POST",
    headers: headers.json,
    body,
  });
  if (res.ok) return;
  const text = await res.text();
  if (!/already exists/i.test(text))
    throw new Error(`create ${uid}: ${res.status} ${text.slice(0, 300)}`);
  await sleep(THROTTLE_MS);
  await expectOk(
    await fetchWithRetry(`https://migration.prismic.io/documents/${id}`, {
      method: "PUT",
      headers: headers.json,
      body,
    }),
    `update ${uid}`,
  );
}
