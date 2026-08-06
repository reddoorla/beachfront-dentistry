import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";
import fs from "node:fs";

const LIVE = "https://www.beachfrontdentistry.com/";
const CAND = "http://localhost:5173/dev/match/home";
const W = Number(process.argv[2] || 1440);

async function settle(page) {
  await page.evaluate(async () => {
    const step = 200;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 50));
    }
    window.scrollTo(0, document.body.scrollHeight);
    await new Promise((r) => setTimeout(r, 1200));
  });
}

const grab = () => {
  const abs = (el) => {
    const r = el.getBoundingClientRect();
    return {
      x: Math.round(r.x + window.scrollX),
      y: Math.round(r.y + window.scrollY),
      w: Math.round(r.width),
      h: Math.round(r.height),
    };
  };
  const cs = (el) => {
    const s = getComputedStyle(el);
    return {
      ff: s.fontFamily.split(",")[0].replace(/["']/g, ""),
      fw: s.fontWeight,
      fs: s.fontSize,
      lh: s.lineHeight,
      ls: s.letterSpacing,
      col: s.color,
      pad: `${s.paddingTop} ${s.paddingRight} ${s.paddingBottom} ${s.paddingLeft}`,
      mar: `${s.marginTop} ${s.marginRight} ${s.marginBottom} ${s.marginLeft}`,
      disp: s.display,
      pos: s.position,
    };
  };
  const out = { root: getComputedStyle(document.documentElement).fontSize, h: document.documentElement.scrollHeight };
  // sections
  out.sections = [];
  const roots = document.querySelectorAll("body > *, main > *, main > * > section, body div.page-wrapper > *");
  const seen = new Set();
  document.querySelectorAll("section, footer, header").forEach((el) => {
    if (seen.has(el)) return;
    seen.add(el);
    const r = abs(el);
    if (r.h < 20) return;
    const s = getComputedStyle(el);
    out.sections.push({
      tag: el.tagName.toLowerCase(),
      cls: el.className && el.className.toString ? el.className.toString().slice(0, 90) : "",
      ...r,
      pad: `${s.paddingTop}/${s.paddingRight}/${s.paddingBottom}/${s.paddingLeft}`,
      mar: `${s.marginTop}/${s.marginRight}/${s.marginBottom}/${s.marginLeft}`,
    });
  });
  out.sections.sort((a, b) => a.y - b.y);
  // headings + key text
  out.text = [];
  document.querySelectorAll("h1,h2,h3,h4,h5,h6,p,a,li,span").forEach((el) => {
    const t = (el.textContent || "").trim().replace(/\s+/g, " ");
    if (!t || t.length > 120) return;
    const r = abs(el);
    if (r.h === 0 || r.w === 0) return;
    if (r.y < -1000) return;
    // only leaf-ish
    if (el.querySelector("h1,h2,h3,h4,h5,h6,p,li")) return;
    out.text.push({ tag: el.tagName.toLowerCase(), cls: (el.className || "").toString().slice(0, 60), t: t.slice(0, 80), ...r, ...cs(el) });
  });
  out.text.sort((a, b) => a.y - b.y || a.x - b.x);
  // images
  out.imgs = [];
  document.querySelectorAll("img, svg, video, iframe").forEach((el) => {
    const r = abs(el);
    if (r.w === 0 && r.h === 0) return;
    const src = (el.getAttribute("src") || el.getAttribute("data-src") || "").split("/").pop().slice(0, 60);
    out.imgs.push({ tag: el.tagName.toLowerCase(), cls: (el.className.baseVal ?? el.className ?? "").toString().slice(0, 50), src, ...r });
  });
  out.imgs.sort((a, b) => a.y - b.y || a.x - b.x);
  return out;
};

const browser = await chromium.launch();
try {
  const res = {};
  for (const [name, url] of [
    ["live", LIVE],
    ["cand", CAND],
  ]) {
    const ctx = await browser.newContext({ viewport: { width: W, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(url, { waitUntil: "networkidle", timeout: 90000 });
    await page.waitForTimeout(600);
    await settle(page);
    res[name] = await page.evaluate(grab);
    await ctx.close();
  }
  fs.writeFileSync(`matching/av-census-${W}.json`, JSON.stringify(res, null, 1));
  console.log("wrote", `matching/av-census-${W}.json`, "live h", res.live.h, "cand h", res.cand.h, "roots", res.live.root, res.cand.root);
  for (const n of ["live", "cand"]) {
    console.log(`\n== ${n} SECTIONS ==`);
    for (const s of res[n].sections) console.log(`${s.y}\t${s.h}\t${s.x},${s.w}\t${s.tag}.${s.cls}\tpad=${s.pad}\tmar=${s.mar}`);
  }
} finally {
  await browser.close();
}
