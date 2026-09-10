// What is still broken, ranked. Exits 1 while work remains.
//
//   node matching/next.mjs
//
// Round protocol step 0 (repo CLAUDE.md rule 5). A commit is a CHECKPOINT, not
// a stopping point: after committing, run this. If it exits 1 there is a named
// next action and the round continues without handing control back.
//
// Reads the most recent gate log per page rather than the whole corpus, so it
// reflects HEAD rather than history (that is strikes.mjs's job).
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const DIR = new URL(".", import.meta.url).pathname;

// PAUSE SWITCH. While matching/PAUSED exists this hands out no agenda and
// exits 0. It is deliberately the FIRST thing that runs: no report is read, no
// score is printed, nothing tempting is put on screen to argue with.
//
// Why an exit code and not a note somewhere: rule 5 is a LOOP — "after
// committing, run next.mjs; while it exits 1 there is a named next action and
// the round continues". A pause written as prose loses to that loop, because
// the loop is mechanical and the prose is not. Exiting 0 satisfies rule 5
// truthfully rather than suspending it: there is no next action.
const PAUSE = join(DIR, "PAUSED");
if (existsSync(PAUSE)) {
  console.log("MATCHING PAUSED — no agenda, and none is to be inferred.\n");
  console.log(readFileSync(PAUSE, "utf8").trimEnd());
  process.exit(0);
}

import { FLOORS, ACCEPTED } from "./floors.mjs";
import { TOTALS, THRESHOLD, MAX_HEIGHT_DELTA, REPORT_SCHEMA, uncountable } from "./harness.mjs";

// Reports written by a different page-diff, by page key. Kept rather than
// dropped: silently ignoring them is how a page vanishes from the score.
const schemaMismatch = new Set();

const latest = new Map();
for (const d of readdirSync(DIR).filter((d) => d.startsWith("out-"))) {
  const m = /^out-[^-]+-(.+)$/.exec(d);
  if (!m || !TOTALS[m[1]]) continue;
  let report, mtime;
  try {
    const p = join(DIR, d, "report.json");
    report = JSON.parse(readFileSync(p, "utf8"));
    mtime = statSync(p).mtimeMs;
  } catch {
    continue;
  }
  // A masked / media-neutralised run is a DIAGNOSTIC, never the state of the
  // page. Picking one up as "latest" silently reports scores nobody can ship —
  // it happened immediately: an --mask-photos probe of yfv made `top` @834 read
  // 43.9% here while the real gate had it passing at 1.3%. Missing
  // schemaVersion means "written before the field existed" = 0; it is not an
  // error on its own, only when it would blank a page.
  //
  // The predicate itself lives in harness.mjs now, because gate.sh asks the
  // same question per run and two copies of one question drift — a gate that
  // greens a run this file then drops is the same false green one step along.
  const why = uncountable(report.meta ?? {});
  if (why === "schema") {
    schemaMismatch.add(m[1]);
    continue;
  }
  if (why) continue;
  const prev = latest.get(m[1]);
  if (!prev || mtime > prev.mtime) latest.set(m[1], { dir: d, mtime, report });
}

const blanked = [...schemaMismatch].filter((p) => !latest.has(p));
if (blanked.length) {
  console.error(
    `next: ${blanked.length} page(s) have no run at report schema ${REPORT_SCHEMA} — ` +
      `their newest reports came from a different page-diff (${blanked.sort().join(", ")}).\n` +
      `      Re-run: bash matching/gate.sh <tag> ${blanked.sort().join(" ")}`,
  );
  process.exit(2);
}
if (latest.size === 0) {
  console.error(
    "next: no parseable gate run under matching/ — refusing to report a score.\n" +
      "      Run bash matching/gate.sh <tag> first.",
  );
  process.exit(2);
}

const rows = [];
const accepted = [];
let openTotal = 0;
let floorTotal = 0;
for (const [page, { dir, report }] of latest) {
  const fails = report.regions.filter((r) => !r.pass);
  for (const f of fails) {
    const floor = FLOORS.find((fl) => fl.match(f, page));
    if (floor) {
      floorTotal++;
      continue;
    }
    const ack = ACCEPTED.find((a) => a.match(f, page));
    if (ack) {
      accepted.push({ page, vw: f.viewport, label: f.label, why: ack.why });
      continue;
    }
    openTotal++;
    rows.push({
      page,
      vw: f.viewport,
      label: f.label,
      mm: f.mismatchFraction,
      dh: f.heightDeltaFraction ?? 0,
      dir,
    });
  }
}

const scored = [...latest.entries()]
  .map(([p, v]) => ({
    p,
    pass: v.report.regions.filter((r) => r.pass).length,
    total: TOTALS[p],
  }))
  .sort((a, b) => a.pass / a.total - b.pass / b.total);

// The denominator is the DECLARED site, not the pages that happened to report.
// Summed over `scored` it shrank to match the numerator: 8 of 9 pages reporting
// read SCORE 160/160 while the ninth, whose page-diff had crashed, was in
// neither the numerator nor the denominator nor the list below. harness.mjs:61-67
// already gives the reason — "a wrong denominator makes the score a lie in the
// flattering direction" — and that fix was applied per REGION (`total:
// TOTALS[p]`) and never per PAGE.
const unmeasured = Object.keys(TOTALS)
  .filter((p) => !latest.has(p))
  .sort();
const sum = scored.reduce((a, s) => a + s.pass, 0);
const max = Object.values(TOTALS).reduce((a, t) => a + t, 0);
console.log(
  `SCORE ${sum}/${max} regions passing` +
    (unmeasured.length ? ` — ${unmeasured.length} page(s) NOT MEASURED` : "") +
    "\n",
);
console.log(
  [
    ...scored.map((s) => `  ${s.p.padEnd(9)} ${String(s.pass).padStart(2)}/${s.total}`),
    // `?/N`, never `0/N`: an unmeasured page is not a page that scored zero,
    // and printing zero would be a different lie.
    ...unmeasured.map((p) => `  ${p.padEnd(9)}  ?/${TOTALS[p]}   NOT MEASURED`),
  ].join("\n"),
);

if (accepted.length) {
  console.log(`\nOperator-ACCEPTED failures (left failing on purpose):`);
  for (const a of accepted)
    console.log(`  ${a.page} @${a.vw} "${a.label}" — ${a.why.slice(0, 96)}…`);
}

// BEFORE the `!rows.length` branch, and deliberately so: an unmeasured page
// contributes no failing region, so that branch would print "Backlog is empty"
// and exit 0 over a page nobody had looked at. Exit 2 matches the two guards
// above (`blanked`, `latest.size === 0`) — neither "clean" nor "work remains"
// but "this cannot be scored", the one answer rule 5's while-it-exits-1 loop
// cannot swallow. The score print stays above it so the partial state is still
// visible.
if (unmeasured.length) {
  console.error(
    `\nnext: ${unmeasured.length} page(s) have no countable gate run — ${unmeasured.join(", ")}.\n` +
      `      Re-run: bash matching/gate.sh <tag> ${unmeasured.join(" ")}`,
  );
  process.exit(2);
}

if (!rows.length) {
  console.log(
    `\nNo open geometry failures. ${floorTotal} declared floor(s) remain.`,
  );
  console.log(
    "Backlog is empty — Phases 5 (states) and 6 (adversarial review) are what is left.",
  );
  process.exit(0);
}

// Worst page first, then worst region inside it: fix where the model is most wrong.
const worst = scored[0].p;
rows.sort(
  (a, b) =>
    (a.page === worst ? -1 : 0) - (b.page === worst ? -1 : 0) || b.mm - a.mm,
);

console.log(
  `\n${openTotal} open failure(s) + ${floorTotal} declared floor(s).`,
);
console.log(`\nNEXT: ${worst} — worst page. Its open regions:\n`);
for (const r of rows.filter((r) => r.page === worst)) {
  const why = [];
  if (r.mm > THRESHOLD) why.push(`pixels ${(r.mm * 100).toFixed(1)}%`);
  if (Math.abs(r.dh) > MAX_HEIGHT_DELTA)
    why.push(`height ${(r.dh * 100).toFixed(1)}%`);
  console.log(
    `  @${String(r.vw).padEnd(5)} ${r.label.slice(0, 44).padEnd(45)} ${why.join(" + ")}`,
  );
}
console.log(`\nBefore treating any of these as geometry:`);
console.log(
  `  node matching/probe-anchor-parity.mjs ${worst}   # is the gate cutting comparably?`,
);
console.log(
  `  node matching/strikes.mjs ${worst}               # has it stalled? then change the MODEL`,
);
console.log(
  `\nRound continues. Do not hand back control with work outstanding.`,
);
process.exit(1);
