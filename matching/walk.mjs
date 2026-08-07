// Phase 6, checklist item 6 — paired walkthrough.
//
//   node matching/walk.mjs <page> [vw]
//
// "Eyeball it" is not evidence. This captures a ref+cand screenshot PAIR at
// every census section — scroll the section into view, settle it, shoot — so
// the review is against artefacts that survive the session and can be re-checked
// later. The verdict line per section is written by hand after LOOKING at each
// pair; this script only produces the pairs.
//
// Sections come from gate.sh's own `--sections` anchors, so the walkthrough
// covers exactly the census the pixel gate is cut on — no more, no less.
import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";
import { mkdirSync, readFileSync } from "node:fs";

const REF = "https://www.beachfrontdentistry.com";
const CAND = "http://localhost:5173";

const [page, vwArg] = process.argv.slice(2);
const VW = Number(vwArg || 1440);
if (!page) {
  console.error("usage: walk.mjs <page> [viewport]");
  process.exit(2);
}

// read the page's paths + anchors straight out of gate.sh so the two gates can
// never drift apart
const gate = readFileSync("matching/gate.sh", "utf8");
const re = new RegExp(`^run ${page} "([^"]+)" "([^"]+)"[^"]*"([^"]+)"`, "ms");
const m = re.exec(gate.replace(/\\\n\s*/g, " "));
if (!m) {
  console.error(`no "run ${page}" line in matching/gate.sh`);
  process.exit(2);
}
const [, refPath, candPath, sectionsRaw] = m;
const SECTIONS = sectionsRaw.split(",").map((s) => s.trim());

mkdirSync("matching/states", { recursive: true });

async function shoot(browser, url, side) {
  const ctx = await browser.newContext({
    viewport: { width: VW, height: 900 },
  });
  const p = await ctx.newPage();
  await p.goto(url, { waitUntil: "networkidle", timeout: 60000 });
  // settled-scroll: reveals that have not fired render with their travel still
  // applied, and a walkthrough of un-fired reveals compares nothing useful
  const h = await p.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < h; y += 250) {
    await p.evaluate((y) => scrollTo(0, y), y);
    await p.waitForTimeout(80);
  }
  await p.evaluate(() => scrollTo(0, 0));
  await p.waitForTimeout(600);

  const out = [];
  for (const [i, anchor] of SECTIONS.entries()) {
    const y = await p.evaluate((a) => {
      const norm = (s) => (s || "").replace(/\s+/g, " ").trim().toLowerCase();
      const el = [
        ...document.querySelectorAll(
          "h1,h2,h3,h4,h5,h6,p,a,li,span,div,section,button",
        ),
      ].find((e) => norm(e.textContent).startsWith(norm(a)));
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return Math.round(r.top + scrollY);
    }, anchor);
    if (y == null) {
      out.push({ i, anchor, y: null });
      continue;
    }
    await p.evaluate((y) => scrollTo(0, Math.max(0, y - 40)), y);
    await p.waitForTimeout(700);
    await p
      .waitForFunction(
        () => document.getAnimations().every((a) => a.playState !== "running"),
        { timeout: 5000 },
      )
      .catch(() => {});
    const file = `matching/states/walk-${page}-${VW}-${String(i).padStart(2, "0")}-${side}.png`;
    await p.screenshot({ path: file });
    out.push({ i, anchor, y, file });
  }
  await ctx.close();
  return out;
}

const b = await chromium.launch();
try {
  const live = await shoot(b, REF + refPath, "live");
  const ours = await shoot(b, CAND + candPath, "ours");
  console.log(
    `\nPAIRED WALKTHROUGH — ${page} @${VW}  (${SECTIONS.length} sections)\n`,
  );
  for (const [i, anchor] of SECTIONS.entries()) {
    const L = live[i],
      O = ours[i];
    console.log(
      `${String(i).padStart(2)}  ${anchor.slice(0, 42).padEnd(44)} live y=${String(L.y).padStart(6)}  ours y=${String(O.y).padStart(6)}`,
    );
    console.log(
      `      ${L.file ?? "NOT FOUND"}\n      ${O.file ?? "NOT FOUND"}`,
    );
  }
  console.log(
    `\nPairs written. Item 6 is NOT done until each pair has been LOOKED AT and\n` +
      `given a written verdict line — the artefact is the input to the review,\n` +
      `not the review itself.`,
  );
} finally {
  await b.close();
}
