import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";
import fs from "node:fs";

const VW = Number(process.argv[2] || 1440);
const TARGETS = [
  ["live", "https://www.beachfrontdentistry.com/"],
  ["cand", "http://localhost:5173/dev/match/home"],
];

async function settle(p) {
  const H = await p.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < H; y += 200) {
    await p.evaluate((v) => scrollTo(0, v), y);
    await p.waitForTimeout(50);
  }
  await p.evaluate(() => scrollTo(0, document.body.scrollHeight));
  await p.waitForTimeout(1000);
  await p.evaluate(() => scrollTo(0, 0));
  await p.waitForTimeout(300);
}

const b = await chromium.launch();
const result = {};
try {
  for (const [name, url] of TARGETS) {
    const p = await b.newPage({ viewport: { width: VW, height: 900 } });
    try {
      await p.goto(url, { waitUntil: "networkidle", timeout: 90000 });
    } catch {
      await p.goto(url, { waitUntil: "domcontentloaded", timeout: 90000 });
      await p.waitForTimeout(3000);
    }
    await settle(p);
    result[name] = await p.evaluate(() => {
      const clean = (s) => s.replace(/\s+/g, " ").trim();
      const rows = [];
      const walk = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
      );
      const seen = new Set();
      let n;
      while ((n = walk.nextNode())) {
        const t = clean(n.nodeValue || "");
        if (!t) continue;
        const el = n.parentElement;
        if (!el) continue;
        if (seen.has(el)) continue;
        seen.add(el);
        const r = el.getBoundingClientRect();
        if (r.height === 0 || r.width === 0) continue;
        const cs = getComputedStyle(el);
        if (cs.visibility === "hidden" || cs.opacity === "0") continue;
        rows.push({
          y: Math.round(r.top + scrollY),
          x: Math.round(r.left),
          w: Math.round(r.width),
          h: Math.round(r.height),
          tag: el.tagName.toLowerCase(),
          cls: (el.className || "").toString().slice(0, 60),
          t: clean(el.textContent || "").slice(0, 70),
          fs: cs.fontSize,
          lh: cs.lineHeight,
          fw: cs.fontWeight,
          ff: cs.fontFamily.split(",")[0].replace(/["']/g, ""),
          ls: cs.letterSpacing,
          c: cs.color,
          ta: cs.textAlign,
          tt: cs.textTransform,
        });
      }
      // images + svgs + video
      const media = [];
      for (const el of document.querySelectorAll("img,svg,video,iframe")) {
        const r = el.getBoundingClientRect();
        if (r.height < 3 || r.width < 3) continue;
        media.push({
          y: Math.round(r.top + scrollY),
          x: Math.round(r.left),
          w: Math.round(r.width),
          h: Math.round(r.height),
          tag: el.tagName.toLowerCase(),
          src: (el.currentSrc || el.getAttribute("src") || "").slice(-60),
          cls: (el.className.baseVal ?? el.className ?? "")
            .toString()
            .slice(0, 50),
        });
      }
      media.sort((a, b) => a.y - b.y);
      rows.sort((a, b) => a.y - b.y);
      return { rows, media, pageH: document.body.scrollHeight };
    });
    await p.close();
  }
} finally {
  await b.close();
}
fs.writeFileSync(
  `/Users/tuckerlemos/Documents/GitHub/beachfront-dentistry/matching/hdiag-runs-${VW}.json`,
  JSON.stringify(result, null, 1),
);
console.log("ok", VW, result.live.rows.length, result.cand.rows.length);
