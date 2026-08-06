// Ground-truth hero composition across the mobile-landscape band.
import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";

const TARGETS = {
  cand: "http://localhost:5190/",
  live: "https://www.beachfrontdentistry.com/",
};
const VWS = [390, 480, 650, 834];

async function measure(p) {
  return p.evaluate(() => {
    const byText = (needle) =>
      [...document.querySelectorAll("h1,h2,h3,p,a,span,div")].find((el) =>
        el.textContent.replace(/\s+/g, " ").trim().toLowerCase().startsWith(needle),
      );
    const finally_ = byText("finally have a dentist");
    const heading = byText("have a relaxed dental experience");
    const pill = [...document.querySelectorAll("a,button")].find((el) =>
      /make (an )?appointment/i.test(el.textContent),
    );
    const r = (el) => {
      if (!el) return null;
      const b = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return { top: Math.round(b.top + scrollY), left: Math.round(b.left), h: Math.round(b.height), align: cs.textAlign };
    };
    return {
      topRegionH: finally_ ? Math.round(finally_.getBoundingClientRect().top + scrollY) : null,
      heading: r(heading),
      pill: r(pill),
    };
  });
}

const b = await chromium.launch();
try {
  for (const vw of VWS) {
    const line = { vw };
    for (const [k, url] of Object.entries(TARGETS)) {
      const p = await b.newPage({ viewport: { width: vw, height: 900 } });
      try {
        await p.goto(url, { waitUntil: "networkidle", timeout: 60000 });
        await p.evaluate(() => new Promise((res) => setTimeout(res, 400)));
        const m = await measure(p);
        line[k] = m;
      } catch (e) {
        line[k] = { err: e.message };
      } finally {
        await p.close();
      }
    }
    const fmt = (m) =>
      m && !m.err
        ? `topH=${m.topRegionH} heading@${m.heading?.top}(${m.heading?.align}) pill@${m.pill?.top}`
        : `ERR ${m?.err}`;
    // pill-below-text if pill.top >= heading.bottom
    const rel = (m) =>
      m?.heading && m?.pill ? (m.pill.top >= m.heading.top + m.heading.h - 5 ? "pill-BELOW" : "pill-INLINE") : "?";
    console.log(`vw${vw}`);
    console.log(`  cand: ${fmt(line.cand)}  [${rel(line.cand)}]`);
    console.log(`  live: ${fmt(line.live)}  [${rel(line.live)}]`);
  }
} finally {
  await b.close();
}
