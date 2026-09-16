// ANCHOR PARITY — does each gate anchor cut on a COMPARABLE element on both
// sides?
//
//   node matching/probe-anchor-parity.mjs [page ...]
//
// page-diff cuts at the first document-order element whose collapsed text
// starts with the anchor — chosen from a FIXED tag list, and cut on that
// element's top Y. Both halves matter, and this probe got both wrong once; see
// anchor-parity.mjs. If live wraps that text in an extra container and we
// do not (or vice versa), the two pages are cut at different heights and the
// whole region comparison is invalid — the score is then real arithmetic on the
// wrong windows, which is indistinguishable from a rendering defect until you
// look. That is exactly what happened to ask-the-doctor "Beyond the Smile":
// live cut at a `.qa-text` wrapper 220px above the heading we cut at, and the
// resulting 79-83% mismatch was logged for two days as a colour delta.
//
// This checks every anchor on every gated page before any of those numbers are
// trusted again.
//
// The two halves that decide a verdict — `readAnchors` (which element an
// anchor resolves to) and `verdict` (whether the two sides' cuts are
// comparable) — live in anchor-parity.mjs, which imports nothing, and are
// covered by scripts/anchor-parity.test.js. The browser half below runs only
// when this file is invoked directly.
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { readAnchors, verdict } from "./anchor-parity.mjs";
import { REF, CAND, PAGES, MATRIX, PLAYWRIGHT } from "./harness.mjs";

// key -> [refPath, candPath, anchors]. Built from the table, so the "must
// mirror gate.sh exactly" comment this replaces stops being a promise.
const TABLE = Object.fromEntries(
  PAGES.map((p) => [p.key, [p.ref, p.cand, p.anchors]]),
);

const VW = Number(process.env.VW ?? MATRIX[0]);

const settle = async (p) => {
  await p.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 250) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
    window.scrollTo(0, 0);
    for (let i = 0; i < 40; i++) {
      await new Promise((r) => setTimeout(r, 100));
      if (document.getAnimations().every((a) => a.playState !== "running"))
        break;
    }
    await new Promise((r) => setTimeout(r, 300));
  });
};

// process.argv[1] is the path as typed, so a plain pathToFileURL compare goes
// false the moment any component of the invoked path is a symlink. Same fix as
// harness.mjs:393 — resolve the real path on both sides.
const isMain = () => {
  if (!process.argv[1]) return false;
  try {
    return (
      realpathSync(fileURLToPath(import.meta.url)) ===
      realpathSync(process.argv[1])
    );
  } catch {
    return false;
  }
};

if (isMain()) {
  const want = process.argv.slice(2);
  const pages = Object.keys(TABLE).filter(
    (p) => !want.length || want.includes(p),
  );
  const { chromium } = await import(PLAYWRIGHT);
  const b = await chromium.launch();
  const problems = [];
  try {
    for (const page of pages) {
      const [refPath, candPath, anchors] = TABLE[page];
      const out = {};
      for (const [name, url] of [
        ["live", REF + refPath],
        ["ours", CAND + candPath],
      ]) {
        const p = await b.newPage({ viewport: { width: VW, height: 900 } });
        try {
          await p.goto(url, { waitUntil: "networkidle", timeout: 60000 });
          await settle(p);
          out[name] = await p.evaluate(readAnchors, anchors);
        } catch (e) {
          out[name] = anchors.map((a) => ({
            anchor: a,
            missing: true,
            err: String(e).slice(0, 40),
          }));
        }
        await p.close();
      }
      console.log(`\n===== ${page} @${VW}`);
      for (let i = 0; i < anchors.length; i++) {
        const l = out.live[i],
          o = out.ours[i];
        const { bad, ratio, dy, flag } = verdict(l, o);
        console.log(`${flag} "${l.anchor}"`);
        const fmt = (s, x) =>
          x.missing
            ? `      ${s}: NOT FOUND${x.err ? " (" + x.err + ")" : ""}`
            : `      ${s}: <${x.tag} class="${x.cls}"> y=${x.y} h=${x.h} hits=${x.n} nextHitDrop=${x.drop}`;
        console.log(fmt("live", l));
        console.log(fmt("ours", o));
        if (bad)
          problems.push({
            page,
            anchor: l.anchor,
            live: l,
            ours: o,
            ratio,
            dy,
          });
      }
    }
  } finally {
    await b.close();
  }

  console.log(`\n\n########## SUMMARY @${VW}`);
  if (!problems.length) {
    console.log(
      "All anchors resolve to comparable elements. Region scores are measuring what they claim.",
    );
  } else {
    console.log(
      `${problems.length} anchor(s) cut on non-comparable elements — every region score BELOW each of these is suspect:\n`,
    );
    problems.sort((a, b) => b.dy - a.dy);
    for (const p of problems) {
      const d =
        p.live.missing || p.ours.missing
          ? "UNRESOLVED on " + (p.live.missing ? "live" : "ours")
          : `cut y ${p.live.y} vs ${p.ours.y} (${p.dy}px apart), ` +
            `h=${p.live.h} vs ${p.ours.h}`;
      console.log(
        `  ${p.page.padEnd(9)} "${p.anchor}"  <${p.live.tag ?? "?"}> vs <${p.ours.tag ?? "?"}>  ${d}`,
      );
    }
  }
  process.exit(problems.length ? 1 : 0);
}
