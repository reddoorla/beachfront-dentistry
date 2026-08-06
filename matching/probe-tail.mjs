// Diagnose Your Path steps (heading + step-title font/wrap) and the team eyebrow
// on cand vs live across the landscape band.
import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";
const TARGETS = { cand: "http://localhost:5190/", live: "https://www.beachfrontdentistry.com/" };
const VWS = [480, 650];
async function settle(p) {
  await p.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 250) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 40)); }
    window.scrollTo(0, 0); await new Promise((r) => setTimeout(r, 350));
  });
}
async function measure(p) {
  return p.evaluate(() => {
    const norm = (s) => s.replace(/\s+/g, " ").trim();
    const q = (needle, tags = "h1,h2,h3,h4,h5,h6,p,a,span") =>
      [...document.querySelectorAll(tags)].find((e) => norm(e.textContent).toLowerCase().startsWith(needle));
    const info = (el) => {
      if (!el) return null;
      const cs = getComputedStyle(el), r = el.getBoundingClientRect();
      const lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.2;
      return { fs: cs.fontSize, w: Math.round(r.width), h: Math.round(r.height), lines: Math.max(1, Math.round(r.height / lh)) };
    };
    const heading = q("your path to oral health");
    const stepTitle = q("book an appointment", "h3,h4,p,a,span");
    const eyebrow = q("meet your team", "p,h5,h6,span,div");
    return {
      heading: info(heading),
      stepTitle: info(stepTitle),
      eyebrow: info(eyebrow),
    };
  });
}
const b = await chromium.launch();
try {
  for (const vw of VWS) {
    console.log(`\nvw${vw}`);
    for (const [k, url] of Object.entries(TARGETS)) {
      const p = await b.newPage({ viewport: { width: vw, height: 900 } });
      try {
        await p.goto(url, { waitUntil: "networkidle", timeout: 60000 });
        await settle(p);
        const m = await measure(p);
        const f = (o) => (o ? `fs=${o.fs} ${o.w}x${o.h} lines=${o.lines}` : "—");
        console.log(`  ${k}: heading[${f(m.heading)}]  stepTitle[${f(m.stepTitle)}]  eyebrow[${f(m.eyebrow)}]`);
      } catch (e) {
        console.log(`  ${k}: ERR ${e.message.split("\n")[0]}`);
      } finally { await p.close(); }
    }
  }
} finally { await b.close(); }
