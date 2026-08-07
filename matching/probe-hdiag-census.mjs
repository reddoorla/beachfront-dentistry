import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";
import fs from "node:fs";

const TARGETS = [
  ["live", "https://www.beachfrontdentistry.com/"],
  ["cand", "http://localhost:5173/dev/match/home"],
];
const VWS = [1440, 834, 390];

async function settle(p) {
  const H = await p.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < H; y += 200) {
    await p.evaluate((v) => scrollTo(0, v), y);
    await p.waitForTimeout(50);
  }
  await p.evaluate(() => scrollTo(0, document.body.scrollHeight));
  await p.waitForTimeout(1000);
  await p.evaluate(() => scrollTo(0, 0));
  await p.waitForTimeout(400);
}

const b = await chromium.launch();
const result = {};
try {
  for (const [name, url] of TARGETS) {
    result[name] = {};
    for (const vw of VWS) {
      const p = await b.newPage({ viewport: { width: vw, height: 900 } });
      try {
        await p.goto(url, { waitUntil: "networkidle", timeout: 90000 });
      } catch (e) {
        await p.goto(url, { waitUntil: "domcontentloaded", timeout: 90000 });
        await p.waitForTimeout(3000);
      }
      await settle(p);
      const data = await p.evaluate(() => {
        const clean = (s) => s.replace(/\s+/g, " ").trim();
        const out = [];
        const seen = new Set();
        for (const el of document.querySelectorAll(
          "h1,h2,h3,h4,h5,h6,.button,a[class*=button],[class*=label],[class*=eyebrow]",
        )) {
          const r = el.getBoundingClientRect();
          const y = Math.round(r.top + scrollY);
          if (r.height === 0 || r.width === 0) continue;
          const t = clean(el.textContent || "");
          if (!t || t.length > 90) continue;
          const key = t.toLowerCase();
          if (seen.has(key)) continue;
          seen.add(key);
          const cs = getComputedStyle(el);
          out.push({
            y,
            x: Math.round(r.left),
            w: Math.round(r.width),
            h: Math.round(r.height),
            tag: el.tagName.toLowerCase(),
            t,
            f: `${cs.fontSize}/${cs.lineHeight} w${cs.fontWeight} ${cs.fontFamily.split(",")[0]} ls${cs.letterSpacing} ${cs.color} ta:${cs.textAlign}`,
          });
        }
        out.sort((a, b) => a.y - b.y);
        // top-level section census
        const main =
          document.querySelector("main") ||
          document.querySelector(".page-wrapper") ||
          document.body;
        const secs = [];
        for (const el of main.children) {
          const r = el.getBoundingClientRect();
          if (r.height < 2) continue;
          secs.push({
            y: Math.round(r.top + scrollY),
            h: Math.round(r.height),
            w: Math.round(r.width),
            tag: el.tagName.toLowerCase(),
            cls: (el.className || "").toString().slice(0, 90),
            txt: clean(el.textContent || "").slice(0, 60),
          });
        }
        return {
          pageH: document.body.scrollHeight,
          docH: document.documentElement.scrollHeight,
          bodyClientW: document.body.clientWidth,
          rootFS: getComputedStyle(document.documentElement).fontSize,
          heads: out,
          secs,
        };
      });
      result[name][vw] = data;
      console.log(
        `${name} @${vw}: pageH=${data.pageH} docH=${data.docH} bodyClientW=${data.bodyClientW} rootFS=${data.rootFS} heads=${data.heads.length}`,
      );
      await p.close();
    }
  }
} finally {
  await b.close();
}
fs.writeFileSync(
  "/Users/tuckerlemos/Documents/GitHub/beachfront-dentistry/matching/hdiag-census.json",
  JSON.stringify(result, null, 1),
);
console.log("written");
