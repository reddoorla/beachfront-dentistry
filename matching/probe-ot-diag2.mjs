import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";
import fs from "node:fs";

const LIVE = "https://www.beachfrontdentistry.com/our-team";
const CAND = "http://localhost:5173/dev/match/our-team";
const VPS = [1440, 834, 390];

async function settle(page) {
  const h = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < h; y += 200) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(50);
  }
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1000);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
}

const census = () => {
  const out = {
    pageH: document.documentElement.scrollHeight,
    bodyClientW: document.body.clientWidth,
    rootFont: getComputedStyle(document.documentElement).fontSize,
    sections: [],
    cards: [],
  };
  const abs = (el) => {
    const r = el.getBoundingClientRect();
    return {
      y: Math.round(r.top + window.scrollY),
      h: Math.round(r.height),
      x: Math.round(r.left),
      w: Math.round(r.width),
    };
  };
  // flatten through display:contents wrappers
  const collect = (el, depth) => {
    for (const c of el.children) {
      const cs = getComputedStyle(c);
      if (cs.display === "contents") {
        collect(c, depth);
        continue;
      }
      const r = c.getBoundingClientRect();
      const cls = typeof c.className === "string" ? c.className : "";
      out.sections.push({
        depth,
        tag: c.tagName.toLowerCase(),
        cls: cls.slice(0, 130),
        id: c.id || "",
        ...abs(c),
        text: (c.innerText || "").replace(/\s+/g, " ").slice(0, 60),
      });
      if (depth < 1 && r.height > 4) collect(c, depth + 1);
    }
  };
  collect(document.body, 0);

  // person cards
  const sel = document.querySelectorAll(
    ".team-list-item, [data-person-card], .person-card",
  );
  let list = [...sel];
  if (!list.length) {
    // heuristic: find repeated cards by background colour
    list = [...document.querySelectorAll("li,article,div")].filter((e) => {
      const cs = getComputedStyle(e);
      return (
        cs.backgroundColor === "rgb(231, 245, 250)" &&
        e.getBoundingClientRect().height > 200
      );
    });
  }
  for (const c of list) {
    const cs = getComputedStyle(c);
    const img = c.querySelector("img");
    const rec = {
      ...abs(c),
      bg: cs.backgroundColor,
      radius: cs.borderRadius,
      mt: cs.marginTop,
      mb: cs.marginBottom,
      ml: cs.marginLeft,
      mr: cs.marginRight,
      pad: cs.padding,
      ov: cs.overflow,
    };
    rec.parts = [];
    for (const e of c.querySelectorAll(
      "img, h1,h2,h3,h4,h5,h6,p,a,figcaption,span",
    )) {
      const s = getComputedStyle(e);
      const rr = abs(e);
      if (rr.h < 2) continue;
      rec.parts.push({
        tag: e.tagName.toLowerCase(),
        cls: (typeof e.className === "string" ? e.className : "").slice(0, 60),
        ...rr,
        ff: s.fontFamily.split(",")[0],
        fw: s.fontWeight,
        fs: s.fontSize,
        lh: s.lineHeight,
        ls: s.letterSpacing,
        col: s.color,
        tt: s.textTransform,
        ta: s.textAlign,
        src:
          e.tagName === "IMG"
            ? (e.currentSrc || e.src || "").slice(-60)
            : undefined,
        objf:
          e.tagName === "IMG"
            ? s.objectFit + " " + s.objectPosition
            : undefined,
        br: s.borderRadius,
        txt: (e.innerText || "").replace(/\s+/g, " ").slice(0, 50),
      });
    }
    out.cards.push(rec);
  }
  return out;
};

const browser = await chromium.launch();
try {
  const res = {};
  for (const [name, url] of [
    ["live", LIVE],
    ["cand", CAND],
  ]) {
    res[name] = {};
    for (const vw of VPS) {
      const ctx = await browser.newContext({
        viewport: { width: vw, height: 900 },
        deviceScaleFactor: 1,
      });
      const page = await ctx.newPage();
      await page
        .goto(url, { waitUntil: "networkidle", timeout: 90000 })
        .catch(() => {});
      await page.waitForTimeout(600);
      await settle(page);
      res[name][vw] = await page.evaluate(census);
      await ctx.close();
    }
  }
  fs.writeFileSync("matching/ot-diag2.json", JSON.stringify(res, null, 1));
  for (const vw of VPS) {
    console.log(
      `\n===== ${vw} =====  live pageH=${res.live[vw].pageH} root=${res.live[vw].rootFont} | cand pageH=${res.cand[vw].pageH} root=${res.cand[vw].rootFont}`,
    );
    for (const side of ["live", "cand"]) {
      console.log(`--- ${side} top-level`);
      for (const s of res[side][vw].sections.filter((s) => s.depth === 0)) {
        console.log(
          `  y=${String(s.y).padStart(6)} h=${String(s.h).padStart(6)} ${s.tag}.${s.cls} | ${s.text}`,
        );
      }
      const c = res[side][vw].cards;
      console.log(
        `  cards: n=${c.length}` +
          (c.length
            ? ` first ${c[0].w}x${c[0].h} @${c[0].x},${c[0].y} bg=${c[0].bg} r=${c[0].radius} m=${c[0].mt}/${c[0].mr}/${c[0].mb}/${c[0].ml}`
            : ""),
      );
      if (c.length > 1)
        console.log(
          `         2nd @${c[1].x},${c[1].y} ${c[1].w}x${c[1].h}; 4th @${c[3] ? c[3].x + "," + c[3].y : "-"}`,
        );
    }
  }
} finally {
  await browser.close();
}
