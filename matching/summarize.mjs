// Summarise a gate round: pass/fail per page per viewport, optionally against
// a previous round so regressions are impossible to miss.
//   node matching/summarize.mjs <tag> [prev-tag]
import fs from "node:fs";

const TAG = process.argv[2];
const PREV = process.argv[3];
if (!TAG) {
  console.error("usage: node matching/summarize.mjs <tag> [prev-tag]");
  process.exit(2);
}
const PAGES = [
  "team",
  "svc",
  "qa",
  "home",
  "yfv",
  "our-team",
  "services",
  "atd",
  "contact",
];
const load = (tag, p) => {
  const f = `matching/out-${tag}-${p}/report.json`;
  if (!fs.existsSync(f)) return null;
  try {
    return JSON.parse(fs.readFileSync(f, "utf8"));
  } catch {
    return null;
  }
};

let tot = 0,
  pass = 0;
const regressions = [];
for (const p of PAGES) {
  const r = load(TAG, p);
  if (!r) {
    console.log(`\n=== ${p.padEnd(9)} (no report)`);
    continue;
  }
  const prev = PREV ? load(PREV, p) : null;
  const pm = new Map(
    (prev?.regions ?? []).map((g) => [
      g.viewport + "|" + g.label,
      g.mismatchFraction,
    ]),
  );
  const fails = r.regions.filter((g) => !g.pass);
  tot += r.regions.length;
  pass += r.regions.length - fails.length;
  const byVw = {};
  for (const g of r.regions) {
    byVw[g.viewport] ??= { p: 0, f: 0 };
    g.pass ? byVw[g.viewport].p++ : byVw[g.viewport].f++;
  }
  const vwStr = Object.keys(byVw)
    .sort((a, b) => b - a)
    .map((v) => `${v}:${byVw[v].p}/${byVw[v].p + byVw[v].f}`)
    .join("  ");
  console.log(
    `\n=== ${p.padEnd(9)} ${r.regions.length - fails.length}/${r.regions.length} pass   [${vwStr}]` +
      (r.meta.truncated ? "  **TRUNCATED**" : "") +
      (r.meta.mask?.length ? `  masks=${JSON.stringify(r.meta.mask)}` : ""),
  );
  for (const g of fails.sort(
    (a, b) => b.mismatchFraction - a.mismatchFraction,
  )) {
    const o = pm.get(g.viewport + "|" + g.label);
    let d = "";
    if (o !== undefined) {
      if (g.mismatchFraction > o + 0.005) {
        d = `  ** WORSE than ${(o * 100).toFixed(1)}%`;
        regressions.push(`${p} vw${g.viewport} ${g.label}`);
      } else if (g.mismatchFraction < o - 0.005) {
        d = `  improved from ${(o * 100).toFixed(1)}%`;
      }
    }
    console.log(
      `   FAIL vw${String(g.viewport).padEnd(5)} ${g.label.slice(0, 30).padEnd(32)}` +
        `mm=${(g.mismatchFraction * 100).toFixed(1)}%`.padEnd(9) +
        `dh=${(g.heightDeltaFraction * 100).toFixed(1)}%`.padEnd(9) +
        d,
    );
  }
  // also surface PASSing regions carrying a big height delta — a region can
  // pass on pixels while being structurally short
  for (const g of r.regions.filter(
    (g) => g.pass && Math.abs(g.heightDeltaFraction) > 0.05,
  ))
    console.log(
      `   note vw${String(g.viewport).padEnd(5)} ${g.label.slice(0, 30).padEnd(32)}passes but dh=${(g.heightDeltaFraction * 100).toFixed(1)}%`,
    );
}
console.log(
  `\nTOTAL ${pass}/${tot} regions pass` +
    (PREV ? `   regressions vs ${PREV}: ${regressions.length}` : ""),
);
for (const r of regressions) console.log("   REGRESSION " + r);
