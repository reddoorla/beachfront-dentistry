// The one place a ONE-OFF PROBE gets its two hosts, its page table, and its
// permission to run at all.
//
//   import { REF, CAND, PLAYWRIGHT, assertRef } from "./probe-ref.mjs";
//   await assertRef();
//   const { chromium } = await import(PLAYWRIGHT);
//
// This file is SITE-LOCAL on purpose. matching/harness.mjs is installed and
// upgraded by the `reddoor-maint match-harness` recipe, which owns those bytes
// — its sha256 is pinned in scripts/match-harness-bodies.sha256 over in the
// maintenance repo, so a hand edit there is flagged on the next recipe run.
// The probes therefore need their own entry point. It adds no logic of its
// own: it re-exports the harness and makes spending the harness's preflight
// the cheapest thing a probe can do.
//
// WHY IT EXISTS
//
// Measured on main at 29d306c, over the tracked scripts under matching/: 12
// probes still opened with a hardcoded pair of hosts —
//
//     const REF  = "https://www.beachfrontdentistry.com";
//     const CAND = "http://localhost:5173";
//
// — and `www.beachfrontdentistry.com` has served OUR OWN Netlify build since
// the 2026-08-07 qafix0807 round. LEDGER.md's 2026-09-09 record measures it:
// that host 301s to `beachfrontdentistry.com`, which answers `server: Netlify`,
// and BOTH hostnames are listed in harness.json's `selfHosts`. Every one of
// those probes was comparing the candidate with itself, so it could only ever
// report a match. That is the "instrument that can only pass" this project's
// CLAUDE.md leads with, in its most dangerous form: the arithmetic is real, it
// is just over the wrong pair of pages, and the output is indistinguishable
// from a clean result until someone checks which host was read.
//
// A second group hand-copied the page table — routes and anchors retyped next
// to the probe that used them, which go stale the moment harness.json changes
// and cannot be re-pointed at a new reference at all. Both groups are fixed the
// same way: take the hosts and the table from the harness, and refuse before
// the browser launches if the reference is not the reference.
//
// WHY THE GUARD IS harness.mjs's OWN checkRef
//
// Not a second opinion — the same one. gate.sh already spends `checkRef` before
// every gated run (gate.sh, "Fail closed on the reference before spending a
// single run"). A question asked twice in two implementations drifts, which is
// the failure harness.mjs's own schema comment records between style-census's
// printer and census-count.mjs's parser. So a probe and the gate now refuse for
// identical reasons, or neither does.
//
// checkRef is fail-closed by construction and a 200 is not evidence to it: it
// requires harness.json's `refMark` in the body, refuses a redirect, refuses a
// host listed in `selfHosts`, refuses a REF host equal to CAND's, and refuses a
// body carrying `candMark` (i.e. the "reference" is serving our build). All
// five of those are live states this site has actually been in.
//
// NOTE ON TODAY'S ANSWER: harness.json's `ref` is
// https://beachfront-dentistry.webflow.io, which 404s on every path as of
// 2026-09-08 — there is no live reference at all right now. So these probes
// REFUSE rather than run, which is the honest answer and the same one gate.sh
// gives. To exercise one against a reference you can actually serve, override
// the hosts (the harness reads them):
//
//   MATCH_REF=http://127.0.0.1:8081 MATCH_CAND=http://127.0.0.1:8082 \
//     node matching/probe-footer-cols.mjs
//
// Those overrides are for one-off probes only. They are NOT how the site is
// configured — harness.json is, so that what a gate ran against is committed.
import {
  REF,
  CAND,
  MATRIX,
  THRESHOLD,
  PAGES,
  byKey,
  PLAYWRIGHT,
  checkRef,
} from "./harness.mjs";

export { REF, CAND, MATRIX, THRESHOLD, PAGES, byKey, PLAYWRIGHT };

/**
 * Refuse to probe an unverified reference. Prints one line either way and
 * exits 2 on refusal, before any browser is launched or any page is fetched.
 *
 * It EXITS rather than throwing, and it is not catchable by a probe's own
 * try/finally, because the failure mode being closed here is a probe that
 * carries on and prints a plausible table. A thrown error is something a
 * `catch` swallows into a "—" cell; an exit is not.
 *
 * Exit 2, not 1, for the same reason gate.sh and next.mjs use 2: page-diff
 * exits 1 for a region that legitimately failed, so 1 cannot distinguish a
 * finding from a refusal.
 */
export async function assertRef() {
  const r = await checkRef();
  if (!r.ok) {
    console.error(`REF REFUSED — ${r.why}`);
    console.error(
      `  REF  = ${REF}\n  CAND = ${CAND}\n` +
        `  This probe compares the two. It will not run until REF is a reference:\n` +
        `  fix matching/harness.json, or override for a one-off with MATCH_REF=... MATCH_CAND=...`,
    );
    process.exit(2);
  }
  console.error(`REF OK — ${r.why}`);
}

/**
 * One row of the page table, by gate key, or a refusal naming the keys that
 * exist. A probe that indexes the table with an unknown key used to get
 * `undefined` and then destructure it into a TypeError forty lines later, or —
 * worse — into three `undefined` paths that navigate to "undefined" and
 * measure a 404.
 */
export function page(key) {
  const p = byKey[key];
  if (!p)
    throw new Error(
      `no page "${key}" in matching/harness.json — keys are: ${PAGES.map((x) => x.key).join(", ")}`,
    );
  return p;
}

/** Full URLs for one page key, both sides. */
export const refUrl = (key) => REF + page(key).ref;
export const candUrl = (key) => CAND + page(key).cand;

/** The table rows in one `group`, in harness.json order — "detail" is the
 *  team/svc/qa triple six probes used to retype, "nav" the rest. Derived, so a
 *  page moving group moves here too. */
export const group = (name) => PAGES.filter((p) => p.group === name);
