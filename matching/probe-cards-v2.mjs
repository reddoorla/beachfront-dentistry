// Measure the 3-C "Finally" card box height (Comfort/Comprehensive/Caring)
// on live vs candidate across the mobile-landscape band.
import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";
const TARGETS = { cand: "http://localhost:5190/", live: "https://www.beachfrontdentistry.com/" };
const VWS = [390, 480, 650, 834];

async function measure(p) {
  return p.evaluate(() => {
    const labels = ["Comfort", "Comprehensive", "Caring"];
    const out = {};
    for (const L of labels) {
      const span = [...document.querySelectorAll("span,div,h5,h4,p")].find(
        (el) => el.textContent.replace(/\s+/g, " ").trim() === L,
      );
      if (!span) { out[L] = null; continue; }
      let el = span, card = span;
      for (let i = 0; i < 6 && el; i++) {
        const b = el.getBoundingClientRect();
        if (b.height > 120) { card = el; break; }
        el = el.parentElement;
      }
      const b = card.getBoundingClientRect();
      out[L] = { w: Math.round(b.width), h: Math.round(b.height), top: Math.round(b.top + scrollY) };
    }
    return out;
  });
}

const b = await chromium.launch();
try {
  for (const vw of VWS) {
    console.log(`vw${vw}`);
    for (const [k, url] of Object.entries(TARGETS)) {
      const p = await b.newPage({ viewport: { width: vw, height: 900 } });
      try {
        await p.goto(url, { waitUntil: "networkidle", timeout: 60000 });
        await p.evaluate(() => window.scrollTo(0, 400));
        await p.evaluate(() => new Promise((r) => setTimeout(r, 400)));
        const m = await measure(p);
        const fmt = (o) => (o ? `${o.w}x${o.h}@${o.top}` : "—");
        console.log(`  ${k}: Comfort=${fmt(m.Comfort)} Compreh=${fmt(m.Comprehensive)} Caring=${fmt(m.Caring)}`);
      } catch (e) {
        console.log(`  ${k}: ERR ${e.message.split("\n")[0]}`);
      } finally { await p.close(); }
    }
  }
} finally { await b.close(); }
