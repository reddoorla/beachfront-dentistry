// Which ELEMENT does page-diff cut on, on each side, for a given region?
//
//   node matching/probe-cut.mjs <refpath> <candpath> "<anchor A>,<anchor B>" [vw,vw]
//
// Reproduces lib/capture.mjs's anchor finder VERBATIM — including its selector
// list, which is h1-h6,p,a,li,span,div,section,button and therefore does NOT
// contain `article`, `main`, `ul`, `ol`, `img`, or `figure`. A candidate whose
// corresponding box uses one of those tags is invisible to the finder and the
// cut silently walks to some ancestor or descendant instead, comparing two
// misaligned windows. That failure (not geometry) was the cause of BOTH
// ask-the-doctor's 34.6% `top` and yfv's "Dr. Robert Quan" — it is worth
// running before treating any region as a value problem.
//
// Prints, per side/viewport: the matched element for each anchor, the resulting
// region height, and the ancestor chain of the first element (any tag) whose
// text starts with the first anchor — so a tag/box mismatch is visible directly.
import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";

const REF = "https://www.beachfrontdentistry.com";
const CAND = "http://localhost:5173";

const [refPath, candPath, anchorArg, vwArg] = process.argv.slice(2);
if (!refPath || !candPath || !anchorArg) {
  console.error(
    'usage: probe-cut.mjs <refpath> <candpath> "<anchor A>,<anchor B>" [1440,834,390]',
  );
  process.exit(2);
}
const ANCHORS = anchorArg.split(",").map((s) => s.trim());
const VWS = (vwArg ?? "1440,834,390").split(",").map(Number);

const b = await chromium.launch();
try {
  for (const vw of VWS) {
    for (const [side, url] of [
      ["live", REF + refPath],
      ["ours", CAND + candPath],
    ]) {
      const p = await b.newPage({ viewport: { width: vw, height: 900 } });
      await p.goto(url, { waitUntil: "networkidle", timeout: 60000 });
      // Settled-scroll protocol: un-fired reveals measure with their travel
      // still applied, and both pages share that pollution, so two agreeing
      // numbers are not a confirmation.
      const h = await p.evaluate(() => document.body.scrollHeight);
      for (let y = 0; y < h; y += 250) {
        await p.evaluate((y) => scrollTo(0, y), y);
        await p.waitForTimeout(90);
      }
      await p.evaluate(() => scrollTo(0, 0));
      await p.waitForTimeout(600);
      await p
        .waitForFunction(
          () =>
            document.getAnimations().every((a) => a.playState !== "running"),
          { timeout: 8000 },
        )
        .catch(() => {});

      const out = await p.evaluate((anchors) => {
        const norm = (s) => (s || "").replace(/\s+/g, " ").trim().toLowerCase();
        const desc = (e) =>
          e
            ? `${e.tagName.toLowerCase()}.${(typeof e.className === "string"
                ? e.className
                : ""
              )
                .trim()
                .split(/\s+/)
                .slice(0, 3)
                .join(".")}`
            : "—";
        const box = (e) => {
          if (!e) return {};
          const r = e.getBoundingClientRect();
          const cs = getComputedStyle(e);
          return {
            y: Math.round(r.top + scrollY),
            h: Math.round(r.height),
            w: Math.round(r.width),
            mt: cs.marginTop,
            mb: cs.marginBottom,
            pos: cs.position,
            ov: cs.overflow,
          };
        };
        const cut = anchors.map((a) => {
          const el = [
            ...document.querySelectorAll(
              "h1,h2,h3,h4,h5,h6,p,a,li,span,div,section,button",
            ),
          ].find((e) => norm(e.textContent).startsWith(norm(a)));
          return { label: a, el: desc(el), ...box(el) };
        });
        const any = [...document.querySelectorAll("*")].find((e) =>
          norm(e.textContent).startsWith(norm(anchors[0])),
        );
        const chain = [];
        for (let e = any, i = 0; e && i < 5; e = e.parentElement, i++)
          chain.push({ el: desc(e), ...box(e) });
        return { cut, chain };
      }, ANCHORS);

      console.log(`\n=== ${side} @${vw} ===`);
      for (const c of out.cut)
        console.log(
          `  CUT "${c.label.slice(0, 30)}" -> ${c.el}  y=${c.y} h=${c.h} mt=${c.mt}`,
        );
      for (let i = 1; i < out.cut.length; i++)
        console.log(
          `  region "${out.cut[i - 1].label.slice(0, 24)}" height = ${out.cut[i].y - out.cut[i - 1].y}`,
        );
      console.log(`  ancestor chain of the first "${ANCHORS[0]}" element:`);
      for (const c of out.chain)
        console.log(
          `    ${c.el.slice(0, 52).padEnd(53)} y=${String(c.y).padStart(6)} h=${String(c.h).padStart(5)} w=${String(c.w).padStart(5)} mt=${c.mt} pos=${c.pos} ov=${c.ov}`,
        );
      await p.close();
    }
  }
} finally {
  await b.close();
}
