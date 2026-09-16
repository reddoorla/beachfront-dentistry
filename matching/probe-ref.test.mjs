// Does the probe preflight actually work?
//
//   node --test matching/probe-ref.test.mjs
//
// CLAUDE.md's first rule is that a gate must be shown to PASS on a known-good
// input before any FAIL it produces counts as evidence. harness.json's
// reference (beachfront-dentistry.webflow.io) has 404'd on every path since
// 2026-09-08, so every guarded probe refuses right now — and a guard that has
// only ever refused is an untested assertion, not a control. It would refuse
// exactly as convincingly if `checkRef` were `return { ok: false }`.
//
// So these tests serve a REAL reference over loopback, prove the guard passes
// on it, and only then prove each refusal arm fires for its OWN reason. The
// fixture bodies are built from harness.json's own refMark/candMark, so
// changing either in the config re-points the fixture instead of silently
// decoupling it from what the guard looks for.
//
// SPAWN, NOT spawnSync — learned the hard way, and worth the line. The first
// draft used `spawnSync` to run the child that fetches these fixtures. The
// fixture server runs in THIS process, and spawnSync blocks this process's
// event loop until the child exits, so the child's request could never be
// answered and the child never exited: a deadlock that presents as a test run
// hanging forever with no output, which reads exactly like a slow test.
//
// MACHINE DEPENDENCY, on the record: the probes spawned below import playwright
// (and pixelmatch/pngjs) from ~/.claude/skills/matching-a-page by absolute
// path, as every script under matching/ has always done. On a machine without
// that skill installed these tests fail at module resolution rather than
// passing vacuously, which is the correct direction to fail in.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";

const DIR = dirname(fileURLToPath(import.meta.url));
const CFG = JSON.parse(readFileSync(join(DIR, "harness.json"), "utf8"));

/** A page only the REFERENCE serves: refMark present, candMark absent. */
const REF_BODY = `<!doctype html><html ${CFG.refMark}><body>reference</body></html>`;
/** A page only OUR BUILD serves. */
const CAND_BODY = `<!doctype html><html><head><link href="/${CFG.candMark}/start.js"></head><body>ours</body></html>`;
/** The dangerous one: a host carrying the reference's fingerprint that is
 *  nonetheless serving our build. That is what www.beachfrontdentistry.com
 *  became after the 2026-08-07 cutover, and the state in which twelve probes
 *  could not fail. */
const BOTH_BODY = `<!doctype html><html ${CFG.refMark}><head><link href="/${CFG.candMark}/start.js"></head><body>ours</body></html>`;

const serve = (body, status = 200) =>
  new Promise((resolve) => {
    const s = createServer((_q, r) => {
      r.writeHead(status, { "content-type": "text/html; charset=utf-8" });
      r.end(body);
    });
    s.listen(0, "127.0.0.1", () =>
      resolve({ s, url: `http://127.0.0.1:${s.address().port}` }),
    );
  });

const run = (args, ref, cand) =>
  new Promise((resolve) => {
    const c = spawn(process.execPath, args, {
      cwd: DIR,
      env: { ...process.env, MATCH_REF: ref, MATCH_CAND: cand },
    });
    let out = "";
    c.stdout.on("data", (d) => (out += d));
    c.stderr.on("data", (d) => (out += d));
    c.on("close", (code) => resolve({ code, out: out.trim() }));
  });

const checkRef = (ref, cand) =>
  run([join(DIR, "harness.mjs"), "--check-ref"], ref, cand);

// ---------------------------------------------------------------- the control

test("PASSES on a reference that is genuinely the reference", async () => {
  const ref = await serve(REF_BODY);
  const cand = await serve(CAND_BODY);
  try {
    const r = await checkRef(ref.url, cand.url);
    assert.equal(r.code, 0, r.out);
    assert.match(r.out, /REF OK/);
  } finally {
    ref.s.close();
    cand.s.close();
  }
});

test("a guarded probe RUNS once the reference is real", async () => {
  // probe-detail-routes is CAND-only, so this exercises the one path that must
  // stay open: a probe reaching its work instead of exiting 2.
  const ref = await serve(REF_BODY);
  const cand = await serve(CAND_BODY);
  try {
    const r = await run([join(DIR, "probe-detail-routes.mjs")], ref.url, cand.url);
    assert.equal(r.code, 0, r.out);
    // three detail rows, each reporting the 200 the fixture served
    assert.equal((r.out.match(/ 200 /g) ?? []).length, 3, r.out);
  } finally {
    ref.s.close();
    cand.s.close();
  }
});

// ------------------------------------------------ and each refusal, separately

test("refuses a REF host listed in selfHosts, before any fetch", async () => {
  const cand = await serve(CAND_BODY);
  try {
    const r = await checkRef(`https://${CFG.selfHosts[0]}`, cand.url);
    assert.equal(r.code, 2, r.out);
    assert.match(r.out, /is in selfHosts/);
  } finally {
    cand.s.close();
  }
});

test("refuses a REF whose host equals CAND's", async () => {
  const one = await serve(REF_BODY);
  try {
    const r = await checkRef(one.url, one.url);
    assert.equal(r.code, 2, r.out);
    assert.match(r.out, /equals CAND's host/);
  } finally {
    one.s.close();
  }
});

test("refuses a reference that is serving OUR build, refMark and all", async () => {
  const ref = await serve(BOTH_BODY);
  const cand = await serve(CAND_BODY);
  try {
    const r = await checkRef(ref.url, cand.url);
    assert.equal(r.code, 2, r.out);
    assert.match(r.out, /REF is serving OUR build/);
  } finally {
    ref.s.close();
    cand.s.close();
  }
});

test("refuses a 200 that does not carry the refMark", async () => {
  const ref = await serve("<!doctype html><body>somebody else's site</body>");
  const cand = await serve(CAND_BODY);
  try {
    const r = await checkRef(ref.url, cand.url);
    assert.equal(r.code, 2, r.out);
    assert.match(r.out, /WITHOUT refMark/);
  } finally {
    ref.s.close();
    cand.s.close();
  }
});

test("refuses a 404 — the state harness.json is actually in today", async () => {
  const ref = await serve("not found", 404);
  const cand = await serve(CAND_BODY);
  try {
    const r = await checkRef(ref.url, cand.url);
    assert.equal(r.code, 2, r.out);
    assert.match(r.out, /HTTP 404/);
  } finally {
    ref.s.close();
    cand.s.close();
  }
});

// --------------------------------------------- the guard is wired into them all

/** Every probe that READS THE REFERENCE. The two CAND-only probes
 *  (probe-content-verify, probe-detail-routes) are deliberately absent: they
 *  make no comparison, so they have nothing to refuse. Argv is supplied where a
 *  probe validates it before reaching the preflight. */
const GUARDED = [
  ["probe-chrome-count.mjs"],
  ["probe-cut.mjs", "/", "/dev/match/home", "Want to learn more"],
  ["probe-footer-chrome.mjs"],
  ["probe-footer-cols.mjs"],
  ["probe-footer-pad.mjs"],
  ["probe-footer390.mjs"],
  ["probe-kids.mjs", "/", "/dev/match/home", "Want to learn more"],
  ["probe-map.mjs"],
  ["probe-team390.mjs"],
  ["probe-yfv-detail2.mjs"],
  ["probe-yfv-exact.mjs"],
  ["probe-yfv-verify.mjs"],
  ["probe-anchors.mjs"],
  ["probe-body-desktop.mjs"],
  ["probe-detail-md.mjs"],
  ["probe-detail-styles.mjs"],
  ["probe-shared.mjs"],
];

for (const [name, ...argv] of GUARDED) {
  test(`${name} refuses a self-host REF and exits 2`, async () => {
    const r = await run(
      [join(DIR, name), ...argv],
      `https://${CFG.selfHosts[0]}`,
      "http://localhost:5173",
    );
    assert.equal(r.code, 2, r.out);
    assert.match(r.out, /REF REFUSED/);
    assert.match(r.out, /is in selfHosts/);
  });
}

// ------------------------------------------------------- the table, not a copy

test("page()/group()/refUrl() read harness.json rather than a hand copy", async () => {
  const m = await import("./probe-ref.mjs");
  assert.deepEqual(
    m.group("detail").map((p) => p.key),
    Object.entries(CFG.pages)
      .filter(([, p]) => p.group === "detail")
      .map(([k]) => k),
  );
  assert.equal(m.page("svc").ref, CFG.pages.svc.ref);
  assert.equal(m.refUrl("svc"), CFG.ref + CFG.pages.svc.ref);
  assert.equal(m.candUrl("home"), CFG.cand + CFG.pages.home.cand);
  assert.throws(() => m.page("no-such-page"), /no page "no-such-page"/);
});
