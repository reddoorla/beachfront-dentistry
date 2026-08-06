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

const probe = () => {
  const isLive = location.hostname.includes("beachfront");
  const R = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: +r.left.toFixed(1), y: +(r.top + window.scrollY).toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1) };
  };
  const runRect = (el) => {
    if (!el) return null;
    const rg = document.createRange();
    rg.selectNodeContents(el);
    const r = rg.getBoundingClientRect();
    return { x: +r.left.toFixed(1), y: +(r.top + window.scrollY).toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1) };
  };
  const out = {};

  // hero heading text run
  const hh = isLive ? document.querySelector(".meet-heading") : document.querySelector('[data-slice-variation="subpage"] h2');
  out.heroHeadingBox = R(hh);
  if (hh) {
    const s = getComputedStyle(hh);
    out.heroHeadingStyle = { fs: s.fontSize, lh: s.lineHeight, fw: s.fontWeight, ta: s.textAlign, pos: s.position, bottom: s.bottom, mb: s.marginBottom, mt: s.marginTop, w: s.width };
    // last line = the visible "Meet"
    const rg = document.createRange();
    rg.selectNodeContents(hh);
    const rects = [...rg.getClientRects()].map((r) => ({ x: +r.left.toFixed(1), y: +(r.top + window.scrollY).toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1) }));
    out.heroHeadingLines = rects;
  }
  out.heroBand = R(isLive ? document.querySelector(".hero.redondo") : document.querySelector('[data-slice-variation="subpage"]'));

  // read-more internals
  const card = document.querySelector(".team-list-item");
  if (card) {
    out.card = R(card);
    if (isLive) {
      const div = card.querySelector(".team-teasewr-read-more");
      out.rmDiv = R(div);
      if (div) { const s = getComputedStyle(div); out.rmDivStyle = { fs: s.fontSize, lh: s.lineHeight, ls: s.letterSpacing, ml: s.marginLeft, mr: s.marginRight, ta: s.textAlign, disp: s.display, tt: s.textTransform, fw: s.fontWeight, col: s.color, ff: s.fontFamily.split(",")[0] }; }
      out.rmDivRun = runRect(div);
      const arrow = card.querySelector(".read-more-arrow");
      out.rmArrow = R(arrow);
      if (arrow) { const s = getComputedStyle(arrow); out.rmArrowStyle = { w: s.width, h: s.height, m: s.margin, alignSelf: s.alignSelf, objectFit: s.objectFit, filter: s.filter, nat: arrow.naturalWidth + "x" + arrow.naturalHeight, src: arrow.currentSrc }; }
      const p = card.querySelector(".team-teaser");
      out.bioBox = R(p);
      if (p) { const s = getComputedStyle(p); out.bioStyle = { h: s.height, ov: s.overflow, fs: s.fontSize, lh: s.lineHeight, m: s.margin, wc: s.webkitLineClamp }; out.bioText = p.innerText; out.bioLines = [...(() => { const rg = document.createRange(); rg.selectNodeContents(p); return rg.getClientRects(); })()].map((r) => +r.height.toFixed(1)); }
    } else {
      const a = [...card.querySelectorAll("a")].find((x) => /read more/i.test(x.textContent || ""));
      out.rmDiv = R(a);
      if (a) { const s = getComputedStyle(a); out.rmDivStyle = { fs: s.fontSize, lh: s.lineHeight, ls: s.letterSpacing, ml: s.marginLeft, mr: s.marginRight, ta: s.textAlign, disp: s.display, tt: s.textTransform, fw: s.fontWeight, col: s.color, ff: s.fontFamily.split(",")[0], gap: s.gap }; }
      const tn = a && [...a.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim());
      if (tn) { const rg = document.createRange(); rg.selectNode(tn); const r = rg.getBoundingClientRect(); out.rmTextRun = { x: +r.left.toFixed(1), y: +(r.top + window.scrollY).toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1) }; }
      const arrow = a && a.querySelector("span");
      out.rmArrow = R(arrow);
      if (arrow) { const s = getComputedStyle(arrow); out.rmArrowStyle = { w: s.width, h: s.height, m: s.margin, bg: s.backgroundColor, mask: s.webkitMaskImage.slice(0, 60) }; }
      const p = card.querySelector("p");
      out.bioBox = R(p);
      if (p) { const s = getComputedStyle(p); out.bioStyle = { h: s.height, ov: s.overflow, fs: s.fontSize, lh: s.lineHeight, m: s.margin, wc: s.webkitLineClamp }; out.bioText = p.innerText; }
      const img = card.querySelector("img");
      if (img) { const s = getComputedStyle(img); out.headshotStyle = { w: s.width, h: s.height, maxW: s.maxWidth, br: s.borderRadius, of: s.objectFit }; out.headshotBox = R(img); }
    }
    if (isLive) {
      const img = card.querySelector(".team-grid-headshot");
      if (img) { const s = getComputedStyle(img); out.headshotStyle = { w: s.width, h: s.height, maxW: s.maxWidth, br: s.borderRadius, of: s.objectFit }; out.headshotBox = R(img); }
    }
  }
  // live's read-more div run for text width (live) — measure text node only
  if (isLive) {
    const div = document.querySelector(".team-teasewr-read-more");
    if (div && div.firstChild) { const rg = document.createRange(); rg.selectNode(div.firstChild); const r = rg.getBoundingClientRect(); out.rmTextRun = { x: +r.left.toFixed(1), y: +(r.top + window.scrollY).toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1) }; }
  }

  // CTA band / footer
  const grid = document.querySelector(isLive ? ".team-grid-section" : ".team-grid-section");
  out.gridBox = R(grid);
  if (isLive) {
    out.fiji = R(document.querySelector(".fiji-section"));
    out.ctaSection = R(document.querySelector(".cta-section"));
    out.footerInfo = R(document.querySelector(".footer-info-section"));
    const h2 = [...document.querySelectorAll("h1,h2,h3")].find((e) => /ready for great/i.test(e.textContent || ""));
    out.readyHeading = R(h2);
    if (h2) { const s = getComputedStyle(h2); out.readyStyle = { fs: s.fontSize, lh: s.lineHeight, ta: s.textAlign }; }
  } else {
    const h2 = [...document.querySelectorAll("h1,h2,h3")].find((e) => /ready for great/i.test(e.textContent || ""));
    out.readyHeading = R(h2);
    if (h2) { const s = getComputedStyle(h2); out.readyStyle = { fs: s.fontSize, lh: s.lineHeight, ta: s.textAlign }; }
    out.footerInfo = R(document.querySelector("footer"));
    const cta = document.querySelector('[data-slice-variation="cta"]');
    out.ctaSection = R(cta);
  }
  out.pageH = document.documentElement.scrollHeight;
  return out;
};

const browser = await chromium.launch();
try {
  const res = {};
  for (const [name, url] of [["live", LIVE], ["cand", CAND]]) {
    res[name] = {};
    for (const vw of VPS) {
      const ctx = await browser.newContext({ viewport: { width: vw, height: 900 }, deviceScaleFactor: 1 });
      const page = await ctx.newPage();
      await page.goto(url, { waitUntil: "networkidle", timeout: 90000 }).catch(() => {});
      await page.waitForTimeout(600);
      await settle(page);
      res[name][vw] = await page.evaluate(probe);
      if (vw === 1440) {
        const card = await page.$(".team-list-item");
        if (card) await card.screenshot({ path: `matching/ot-card-${name}-1440.png` });
      }
      await ctx.close();
    }
  }
  fs.writeFileSync("matching/ot-diag4.json", JSON.stringify(res, null, 1));
  for (const vw of VPS) {
    console.log(`\n######## ${vw}`);
    for (const k of Object.keys(res.live[vw])) {
      const a = JSON.stringify(res.live[vw][k]);
      const b = JSON.stringify(res.cand[vw][k]);
      console.log(`  ${k}\n     live: ${a}\n     cand: ${b}`);
    }
  }
} finally {
  await browser.close();
}
