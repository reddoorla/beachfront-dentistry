// Phase 5 — interaction states, verified against live.
//
//   node matching/states.mjs <page> [--shot]
//
// The pixel gate is structurally blind to everything behind a pointer or a
// click: hover rules, open panels, modals, slider positions. page-diff can
// return PASS on a page whose entire nav does nothing. This is the gate for
// that, and it is a DIFF, not an assertion list — every expected value is read
// off live in the same run, so the reference stays the spec.
//
// A state entry declares WHAT to do and WHICH computed properties matter; the
// harness performs it on both pages, reads those properties on both, and
// compares. Values are never hardcoded here.
//
// With --shot it also writes paired screenshots to matching/states/.
import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";
import { mkdirSync, writeFileSync } from "node:fs";

const REF = "https://www.beachfrontdentistry.com";
const CAND = "http://localhost:5173";

const [page, ...flags] = process.argv.slice(2);
const SHOT = flags.includes("--shot");
if (!page) {
  console.error("usage: states.mjs <page> [--shot]   (page: a key in states/index.mjs)");
  process.exit(2);
}

const { PAGES } = await import("./states/index.mjs");
const { DECLARED } = await import("./states/deviations.mjs");
const def = PAGES[page];
if (!def) {
  console.error(`no state list for "${page}". Have: ${Object.keys(PAGES).join(", ")}`);
  process.exit(2);
}

mkdirSync("matching/states", { recursive: true });

/** Run one side: open the page, apply each state, read the probes. */
async function runSide(browser, url, side, states, viewport) {
  const ctx = await browser.newContext({ viewport });
  const p = await ctx.newPage();
  await p.goto(url, { waitUntil: "networkidle", timeout: 60000 });
  await p.waitForTimeout(600);
  const results = {};
  for (const st of states) {
    const sel = side === "live" ? st.sel : (st.candSel ?? st.sel);
    const target = side === "live" ? (st.target ?? sel) : (st.candTarget ?? st.target ?? sel);
    let out = { ok: false, why: "not found" };
    try {
      // `pre` steps get the element reachable at all — live's nav links live
      // inside a closed `.dropdown-modal`, so hovering one means opening the
      // panel first. A state that needs a pre-step and does not declare one is
      // measuring a hidden element, which reads as a pass.
      for (const step of st.pre ?? []) {
        const psel = side === "live" ? step.sel : (step.candSel ?? step.sel);
        const pel = await p.$(psel);
        if (!pel) throw new Error(`pre-step selector not found: ${psel}`);
        if (step.action === "hover") await pel.hover({ timeout: 4000 });
        else await pel.click({ timeout: 4000, force: true });
        await p.waitForTimeout(step.settle ?? 700);
      }
      const el = await p.$(sel);
      if (!el) throw new Error(`selector not found: ${sel}`);
      await el.scrollIntoViewIfNeeded().catch(() => {});
      await p.waitForTimeout(120);
      if (st.action === "hover") await el.hover({ timeout: 4000 });
      else if (st.action === "click") await el.click({ timeout: 4000, force: true });
      else if (st.action === "focus") await el.focus();
      // let transitions finish rather than sampling mid-flight
      await p.waitForTimeout(st.settle ?? 700);
      await p
        .waitForFunction(
          () => document.getAnimations().every((a) => a.playState !== "running"),
          { timeout: 4000 },
        )
        .catch(() => {});
      out = await p.evaluate(
        ([target, props]) => {
          const t = document.querySelector(target);
          if (!t) return { ok: false, why: `target missing: ${target}` };
          const cs = getComputedStyle(t);
          const r = t.getBoundingClientRect();
          const v = {};
          for (const k of props) v[k] = cs[k];
          v.__box = `${Math.round(r.width)}x${Math.round(r.height)}`;
          v.__visible = r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none" ? "yes" : "no";
          return { ok: true, v };
        },
        [target, st.props ?? ["opacity", "transform", "color", "backgroundColor", "display"]],
      );
      if (SHOT)
        await p.screenshot({
          path: `matching/states/${page}-${st.name.replace(/\W+/g, "-")}-${side}.png`,
          clip: st.clip,
        }).catch(() => {});
    } catch (e) {
      out = { ok: false, why: String(e.message ?? e).slice(0, 80) };
    }
    results[st.name] = out;
    // reset between states so one open panel does not contaminate the next
    await p.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
    await p.waitForTimeout(400);
  }
  await ctx.close();
  return results;
}

const vw = def.viewport ?? { width: 1440, height: 900 };
const b = await chromium.launch();
let fails = 0;
let declared = 0;
try {
  const live = await runSide(b, REF + def.refPath, "live", def.states, vw);
  const ours = await runSide(b, CAND + def.candPath, "ours", def.states, vw);

  console.log(`\nPHASE 5 — ${page} @${vw.width}  (${def.states.length} states)`);
  console.log(`ref  ${REF + def.refPath}\ncand ${CAND + def.candPath}\n`);
  for (const st of def.states) {
    const L = live[st.name];
    const O = ours[st.name];
    if (!L.ok || !O.ok) {
      console.log(`FAIL  ${st.name}\n        live: ${L.ok ? "ok" : L.why}\n        ours: ${O.ok ? "ok" : O.why}`);
      fails++;
      continue;
    }
    // `__box` is reported but only FAILS when the state asked for it: a modal
    // that opens on both sides should not fail for being a different size, and
    // a size difference should not be silently dropped either.
    const asked = new Set([...(st.props ?? []), "__visible"]);
    // Numeric tolerance, the same idea as the skill's 1px rule: live samples
    // opacity at 0.61 where its rule says .6 (an IX2 inline value on revealed
    // elements), and failing a correct build on 0.01 is noise.
    const near = (a, b) => {
      const x = Number.parseFloat(a), y = Number.parseFloat(b);
      return Number.isFinite(x) && Number.isFinite(y) && Math.abs(x - y) <= 0.02;
    };
    const all = Object.keys(L.v).filter(
      (k) => L.v[k] !== O.v[k] && !(k === "opacity" && near(L.v[k], O.v[k])),
    );
    const diffs = all.filter((k) => asked.has(k));
    const info = all.filter((k) => !asked.has(k));
    // A DECLARED state is one the operator has ruled on. It is subtracted
    // from the failure count and printed under its own label — never dropped,
    // and never quietly recoloured as a pass.
    if (diffs.length && DECLARED.some((d) => d.match(st.name, diffs, L.v))) {
      console.log(`ack   ${st.name}`);
      for (const k of diffs)
        console.log(`        (declared) ${k}: live "${L.v[k]}" vs ours "${O.v[k]}"`);
      declared++;
      continue;
    }
    if (!diffs.length) {
      console.log(`pass  ${st.name}`);
      for (const k of info)
        console.log(`        (info) ${k}: live "${L.v[k]}" vs ours "${O.v[k]}"`);
    } else {
      console.log(`FAIL  ${st.name}`);
      for (const k of diffs) console.log(`        ${k}: live "${L.v[k]}" vs ours "${O.v[k]}"`);
      for (const k of info)
        console.log(`        (info) ${k}: live "${L.v[k]}" vs ours "${O.v[k]}"`);
      fails++;
    }
  }
  writeFileSync(
    `matching/states/${page}.json`,
    JSON.stringify({ page, viewport: vw, live, ours }, null, 2),
  );
  console.log(
    `\n${def.states.length - fails - declared}/${def.states.length} states match` +
      (declared ? ` (+${declared} declared)` : "") +
      `. Evidence: matching/states/${page}.json`,
  );
} finally {
  await b.close();
}
process.exit(fails ? 1 : 0);
