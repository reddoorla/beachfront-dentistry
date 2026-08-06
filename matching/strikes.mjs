// The 3-strike rule, made countable.
//
//   node matching/strikes.mjs [page]
//
// The matching skill says: "A region that has not improved after 3 fix ->
// re-run cycles: stop. Present the three attempts. Do not widen the threshold,
// mask it, or reclassify it — a stuck region means your model of it is wrong."
//
// That rule was blown twice on this project (services `top`, yfv `top`) purely
// because nobody was counting. This reads every matching/out-*/report.json,
// reconstructs each region's history in chronological order, and prints the
// regions that are OUT OF STRIKES. Exit 1 when any exist, so a round that
// starts by running this cannot quietly attempt a fourth cycle.
//
// WHAT THIS ACTUALLY MEASURES (read before trusting a number): report.json
// cannot record INTENT, so a "cycle" here is any completed gate run in which
// the region was still failing and did not improve by IMPROVE_PP. Runs aimed at
// a different region on the same page therefore count too. That makes this a
// STALL detector, not a literal attempt counter — "this has been failing,
// unchanged, across N gate runs while you were working on this page." That is
// the more useful discipline number anyway, and it is honest about being an
// upper bound. Improvement resets the count: real progress earns a fresh start.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { FLOORS } from "./floors.mjs";

const IMPROVE_PP = 0.01; // 1 percentage point = the smallest move worth calling progress
const MAX_STRIKES = 3;
const ROOT = new URL(".", import.meta.url).pathname;
const only = process.argv[2] ?? null;

const pageOf = (ref) => {
  const path = new URL(ref).pathname.replace(/\/$/, "");
  return path === "" ? "home" : path.slice(1);
};

const runs = [];
for (const dir of readdirSync(ROOT).filter((d) => d.startsWith("out-"))) {
  let report;
  try {
    report = JSON.parse(readFileSync(join(ROOT, dir, "report.json"), "utf8"));
  } catch {
    continue; // not a completed run dir
  }
  if (!report.meta?.ref || !Array.isArray(report.regions)) continue;
  runs.push({ dir, at: report.meta.generatedAt, meta: report.meta, regions: report.regions });
}
runs.sort((a, b) => a.at.localeCompare(b.at));

// key -> chronological list of {dir, at, mm, pass, masked}
const history = new Map();
for (const run of runs) {
  const page = pageOf(run.meta.ref);
  if (only && page !== only) continue;
  for (const r of run.regions) {
    // A DECLARED FLOOR is flat by definition — reporting it as stalled is noise
    // that hides a real stall. It stays in the LEDGER; it does not belong here.
    if (FLOORS.some((fl) => fl.match(r))) continue;
    const key = `${page}|${r.viewport}|${r.label}`;
    if (!history.has(key)) history.set(key, []);
    history.get(key).push({
      dir: run.dir,
      at: run.at,
      mm: r.mismatchFraction,
      dh: r.heightDeltaFraction,
      pass: r.pass,
      // a run with masks/neutralised media is not comparable to a clean one
      dirty: (run.meta.mask?.length ?? 0) > 0 || run.meta.neutralizeMedia || run.meta.maskPhotos,
    });
  }
}

const stuck = [];
for (const [key, all] of history) {
  const h = all.filter((e) => !e.dirty); // compare like with like
  if (h.length === 0) continue;
  const last = h[h.length - 1];
  if (last.pass) continue;

  let best = Infinity;
  let strikes = 0;
  let sinceIdx = 0;
  for (let i = 0; i < h.length; i++) {
    if (h[i].mm < best - IMPROVE_PP) {
      best = Math.min(best, h[i].mm);
      strikes = 0;
      sinceIdx = i;
    } else {
      best = Math.min(best, h[i].mm);
      strikes++;
    }
  }
  if (strikes >= MAX_STRIKES) stuck.push({ key, strikes, h, sinceIdx, last });
}

// Triage order: the worst-matching region that has never moved is the one whose
// model is most wrong. Sorting by strike count instead would put a 0.3% region
// that only fails on height above a 76% region that fails on everything.
stuck.sort((a, b) => b.last.mm - a.last.mm);

if (stuck.length === 0) {
  console.log(
    `strikes: clear — no failing region has stalled for ${MAX_STRIKES}+ gate runs` +
      (only ? ` on ${only}` : "") + ".",
  );
  process.exit(0);
}

const why = (e) => {
  const reasons = [];
  if (e.mm > 0.1) reasons.push(`pixels ${(e.mm * 100).toFixed(1)}%`);
  if (Math.abs(e.dh ?? 0) > 0.05) reasons.push(`height ${((e.dh ?? 0) * 100).toFixed(1)}%`);
  return reasons.join(" + ") || "marginal";
};

console.log(
  `STALLED — ${stuck.length} failing region(s) have not moved in ${MAX_STRIKES}+ gate runs.\n` +
    `These need a new model or the operator, not another attempt. Worst first:\n`,
);
for (const { key, strikes, h, sinceIdx, last } of stuck.slice(0, 20)) {
  const [page, vw, label] = key.split("|");
  console.log(`${page} @${vw}  "${label}"  — ${why(last)}, flat across ${strikes} runs`);
  const window = h.slice(Math.max(0, sinceIdx));
  const shown = window.length > 4 ? [window[0], ...window.slice(-3)] : window;
  for (const [i, e] of shown.entries()) {
    const gap = window.length > 4 && i === 1 ? `    ... ${window.length - 4} more ...\n` : "";
    console.log(
      gap + `    ${(e.mm * 100).toFixed(1).padStart(5)}%  ${e.at.slice(0, 16).replace("T", " ")}  ${e.dir}`,
    );
  }
  console.log();
}
if (stuck.length > 20) console.log(`... and ${stuck.length - 20} more.\n`);
console.log(
  "Per the matching skill: present the attempts to the operator.\n" +
    "Do NOT widen the threshold, add a mask, or reclassify them as a floor.",
);
process.exit(1);
