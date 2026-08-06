// Precisely measure the Finally section vertical composition: heading, the 3
// rounded card boxes (top/bottom), the gaps between them, and the next section.
import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";
const TARGETS = { cand: "http://localhost:5190/", live: "https://www.beachfrontdentistry.com/" };
const VWS = [480, 650];

async function measure(p) {
  return p.evaluate(() => {
    const norm = (s) => s.replace(/\s+/g, " ").trim();
    const heading = [...document.querySelectorAll("h1,h2,h3")].find((e) =>
      norm(e.textContent).toLowerCase().startsWith("finally have a dentist"),
    );
    const next = [...document.querySelectorAll("*")].find((e) =>
      norm(e.textContent).toUpperCase().startsWith("MEET YOUR TEAM") &&
      e.children.length === 0,
    );
    const hb = heading.getBoundingClientRect();
    const y = (r) => Math.round(r.top + scrollY);
    // card boxes: rounded ~25px, height 180-520, positioned below the heading
    const cards = [...document.querySelectorAll("*")]
      .map((e) => ({ e, r: e.getBoundingClientRect(), cs: getComputedStyle(e) }))
      .filter((o) => {
        const br = parseFloat(o.cs.borderTopLeftRadius) || 0;
        return br >= 18 && br <= 30 && o.r.height >= 180 && o.r.height <= 540 && o.r.width >= 250 && o.r.top + scrollY > y(hb);
      })
      .map((o) => ({ top: y(o.r), bottom: Math.round(o.r.bottom + scrollY), h: Math.round(o.r.height) }))
      .sort((a, b) => a.top - b.top);
    // dedupe near-identical tops (nested rounded wrappers)
    const uniq = [];
    for (const c of cards) if (!uniq.some((u) => Math.abs(u.top - c.top) < 20)) uniq.push(c);
    return {
      headingBottom: Math.round(hb.bottom + scrollY),
      nextTop: next ? y(next.getBoundingClientRect()) : null,
      cards: uniq.slice(0, 3),
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
        await p.evaluate(() => window.scrollTo(0, 300));
        await p.evaluate(() => new Promise((r) => setTimeout(r, 400)));
        const m = await measure(p);
        const c = m.cards;
        const gap = (i) => (c[i] && c[i + 1] ? c[i + 1].top - c[i].bottom : "?");
        console.log(`  ${k}: hBot=${m.headingBottom}  cards=[${c.map((x) => `${x.top}-${x.bottom}(h${x.h})`).join(", ")}]`);
        console.log(`      hdr→c1=${c[0] ? c[0].top - m.headingBottom : "?"}  gap1=${gap(0)}  gap2=${gap(1)}  c3→next=${c[2] && m.nextTop ? m.nextTop - c[2].bottom : "?"}`);
      } catch (e) {
        console.log(`  ${k}: ERR ${e.message.split("\n")[0]}`);
      } finally { await p.close(); }
    }
  }
} finally { await b.close(); }
