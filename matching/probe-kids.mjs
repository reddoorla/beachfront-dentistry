// Direct-child list of the box a gate anchor cuts on, both sides, per viewport.
//
//   node matching/probe-kids.mjs <refpath> <candpath> "<anchor>" [vw,vw] [depth]
//
// The contact fix list regressed 9/12 -> 7/12 with every citation verified,
// because correct rules applied to a container whose CHILD COMPOSITION differs
// compose to a different total. Reconcile the child list before trusting any
// per-child value: a child live has and we do not (or vice versa) is a
// structural defect, and no amount of correct px on the children we share
// will close it.
import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";

const REF = "https://www.beachfrontdentistry.com";
const CAND = "http://localhost:5173";

const [refPath, candPath, anchor, vwArg, depthArg] = process.argv.slice(2);
if (!refPath || !candPath || !anchor) {
  console.error(
    'usage: probe-kids.mjs <refpath> <candpath> "<anchor>" [vws] [depth]',
  );
  process.exit(2);
}
const VWS = (vwArg ?? "1440,834,390").split(",").map(Number);
const DEPTH = Number(depthArg ?? 1);

const b = await chromium.launch();
try {
  for (const vw of VWS) {
    for (const [side, url] of [
      ["live", REF + refPath],
      ["ours", CAND + candPath],
    ]) {
      const p = await b.newPage({ viewport: { width: vw, height: 900 } });
      await p.goto(url, { waitUntil: "networkidle", timeout: 60000 });
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

      const rows = await p.evaluate(
        ([anchor, depth]) => {
          const norm = (s) =>
            (s || "").replace(/\s+/g, " ").trim().toLowerCase();
          const root = [
            ...document.querySelectorAll(
              "h1,h2,h3,h4,h5,h6,p,a,li,span,div,section,button",
            ),
          ].find((e) => norm(e.textContent).startsWith(norm(anchor)));
          if (!root) return [{ line: "ANCHOR NOT FOUND" }];
          const out = [];
          const walk = (el, d, indent) => {
            for (const c of el.children) {
              const r = c.getBoundingClientRect();
              const cs = getComputedStyle(c);
              if (cs.display === "none") continue;
              const cls = (typeof c.className === "string" ? c.className : "")
                .trim()
                .split(/\s+/)
                .filter(Boolean)
                .slice(0, 3)
                .join(".");
              out.push({
                line: `${indent}${c.tagName.toLowerCase()}${cls ? "." + cls : ""}`.slice(
                  0,
                  54,
                ),
                y: Math.round(r.top + scrollY),
                h: Math.round(r.height),
                w: Math.round(r.width),
                m: `${cs.marginTop}/${cs.marginBottom}`,
                p: `${cs.paddingTop}/${cs.paddingBottom}`,
                t: norm(c.textContent).slice(0, 22),
              });
              if (d < depth) walk(c, d + 1, indent + "  ");
            }
          };
          walk(root, 1, "  ");
          const rr = root.getBoundingClientRect();
          out.unshift({
            line: `ROOT ${root.tagName.toLowerCase()}`,
            y: Math.round(rr.top + scrollY),
            h: Math.round(rr.height),
            w: Math.round(rr.width),
            m: "",
            p: "",
            t: "",
          });
          return out;
        },
        [anchor, DEPTH],
      );

      console.log(`\n=== ${side} @${vw} ===`);
      for (const r of rows)
        console.log(
          `${(r.line ?? "").padEnd(56)} y=${String(r.y).padStart(5)} h=${String(r.h).padStart(5)} w=${String(r.w).padStart(5)} m=${(r.m ?? "").padEnd(13)} p=${(r.p ?? "").padEnd(13)} ${r.t ?? ""}`,
        );
      await p.close();
    }
  }
} finally {
  await b.close();
}
