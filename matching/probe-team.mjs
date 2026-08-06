import { chromium } from 'file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs';
import { writeFileSync } from 'node:fs';

const URLS = {
  live: 'https://www.beachfrontdentistry.com/our-team',
  cand: 'http://localhost:5190/dev/match/our-team',
};
const VPS = [
  { w: 1440, h: 900 },
  { w: 390, h: 844 },
];

async function settle(page) {
  const h = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < h; y += 300) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(120);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
}

function cssOf(el, props) {
  const cs = getComputedStyle(el);
  const o = {};
  for (const p of props) o[p] = cs.getPropertyValue(p);
  return o;
}

async function probe(page, which) {
  return await page.evaluate(() => {
    const out = {};
    const TYPE = ['font-family', 'font-weight', 'font-size', 'line-height', 'color', 'text-transform', 'text-align', 'letter-spacing'];
    const box = (el) => { const r = el.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; };
    const type = (el) => { const cs = getComputedStyle(el); const o = {}; for (const p of ['font-family','font-weight','font-size','line-height','color','text-transform','text-align','letter-spacing']) o[p] = cs.getPropertyValue(p); return o; };

    // ---- Section order: direct children of <main> or body sections
    const main = document.querySelector('main') || document.body;
    const secs = Array.from(main.children).map((c) => {
      const cs = getComputedStyle(c);
      return {
        tag: c.tagName.toLowerCase(),
        cls: (c.className || '').toString().slice(0, 120),
        h: Math.round(c.getBoundingClientRect().height),
        bg: cs.backgroundImage.slice(0, 120),
        bgColor: cs.backgroundColor,
        txt: (c.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 80),
      };
    });
    out.sections = secs;

    // ---- Hero heading detection: find big heading words Meet/Our/Team
    const heads = Array.from(document.querySelectorAll('h1,h2,h3,span,div')).filter((el) => {
      const t = (el.textContent || '').trim();
      return /^(Meet|Our|Team)$/i.test(t) && el.children.length === 0;
    }).slice(0, 8).map((el) => ({ tag: el.tagName.toLowerCase(), text: el.textContent.trim(), ...type(el), box: box(el), parentTag: el.parentElement?.tagName.toLowerCase(), parentCls: (el.parentElement?.className||'').toString().slice(0,80) }));
    // Also capture any h1 fully
    const h1 = document.querySelector('h1');
    out.h1 = h1 ? { text: h1.innerText.replace(/\s+/g,' ').trim().slice(0,60), html: h1.innerHTML.slice(0,200), ...type(h1), box: box(h1) } : null;
    out.headWords = heads;

    // ---- Hero band: the ancestor section of h1
    let heroBand = null;
    if (h1) {
      let p = h1;
      while (p && p.parentElement && p.parentElement !== document.body) {
        const cs = getComputedStyle(p.parentElement);
        if (cs.backgroundImage !== 'none' || p.parentElement.tagName === 'SECTION' || p.parentElement.tagName === 'HEADER') { heroBand = p.parentElement; break; }
        p = p.parentElement;
      }
    }
    if (heroBand) {
      const cs = getComputedStyle(heroBand);
      out.heroBand = {
        tag: heroBand.tagName.toLowerCase(),
        cls: (heroBand.className||'').toString().slice(0,120),
        box: box(heroBand),
        bgImage: cs.backgroundImage.slice(0,200),
        bgColor: cs.backgroundColor,
        hasWave: !!heroBand.querySelector('svg'),
        svgCount: heroBand.querySelectorAll('svg').length,
      };
    }

    // ---- Intro paragraph: first <p> after h1
    let intro = null;
    if (h1) {
      const ps = Array.from(document.querySelectorAll('p'));
      for (const p of ps) { const t = p.innerText.trim(); if (t.length > 30) { intro = { text: t.slice(0,160), ...type(p), box: box(p) }; break; } }
    }
    out.intro = intro;

    // ---- Team grid: find a container whose children are repeated cards (>=3 similar)
    let grid = null, gridInfo = null;
    const candidates = Array.from(document.querySelectorAll('div,ul,section')).filter((el) => {
      const cs = getComputedStyle(el);
      return (cs.display === 'grid' || cs.display === 'flex') && el.children.length >= 3;
    });
    // pick the one whose children contain an img + a heading (team cards), prefer most children with imgs
    let best = null, bestScore = -1;
    for (const el of candidates) {
      const kids = Array.from(el.children);
      const withImg = kids.filter((k) => k.querySelector('img')).length;
      const withHead = kids.filter((k) => k.querySelector('h1,h2,h3,h4,h5')).length;
      const score = withImg + withHead;
      if (withImg >= 3 && score > bestScore) { bestScore = score; best = el; }
    }
    if (best) {
      const cs = getComputedStyle(best);
      gridInfo = {
        tag: best.tagName.toLowerCase(),
        cls: (best.className||'').toString().slice(0,120),
        display: cs.display,
        gridTemplateColumns: cs.gridTemplateColumns,
        colCount: (cs.gridTemplateColumns.match(/px|fr|%/g)||[]).length,
        gap: cs.gap, rowGap: cs.rowGap, columnGap: cs.columnGap,
        maxWidth: cs.maxWidth, width: Math.round(best.getBoundingClientRect().width),
        padding: cs.padding, box: box(best),
        childCount: best.children.length,
      };
      // First card deep structure
      const card = best.children[0];
      const ccs = getComputedStyle(card);
      const cardInfo = {
        tag: card.tagName.toLowerCase(), cls: (card.className||'').toString().slice(0,120),
        box: box(card), display: ccs.display, padding: ccs.padding, bg: ccs.backgroundColor,
        borderRadius: ccs.borderRadius, boxShadow: ccs.boxShadow.slice(0,80),
        innerText: card.innerText.replace(/\s+/g,' ').trim().slice(0,200),
      };
      // enumerate descendants of interest
      const img = card.querySelector('img');
      if (img) { const ics = getComputedStyle(img); cardInfo.img = { box: box(img), borderRadius: ics.borderRadius, objectFit: ics.objectFit, src: (img.currentSrc||img.src||'').slice(-60), aspect: (box(img).w && box(img).h) ? (box(img).w/box(img).h).toFixed(2) : null }; }
      const headings = Array.from(card.querySelectorAll('h1,h2,h3,h4,h5,h6')).map((h)=>({tag:h.tagName.toLowerCase(), text:h.innerText.trim().slice(0,40), ...type(h)}));
      cardInfo.headings = headings;
      const paras = Array.from(card.querySelectorAll('p')).map((p)=>({text:p.innerText.trim().slice(0,80), ...type(p)}));
      cardInfo.paras = paras;
      // any button / read more
      const btns = Array.from(card.querySelectorAll('a,button')).map((b)=>({tag:b.tagName.toLowerCase(), text:b.innerText.trim().slice(0,30), ...type(b)}));
      cardInfo.controls = btns;
      // count imgs in card (headshot + favorite beach?)
      cardInfo.imgCount = card.querySelectorAll('img').length;
      cardInfo.allImgs = Array.from(card.querySelectorAll('img')).map((im)=>({box:box(im), src:(im.currentSrc||im.src||'').slice(-50), alt:(im.alt||'').slice(0,40)}));
      out.card = cardInfo;
    }
    out.grid = gridInfo;

    // ---- CTA band at bottom: search text "Ready for great dental health"
    const bodyTxt = document.body.innerText;
    out.hasReadyCTA = /Ready for great dental health/i.test(bodyTxt);
    out.ctaText = (bodyTxt.match(/Ready for great dental health[^\n]{0,80}/i)||[''])[0];

    return out;
  });
}

(async () => {
  const browser = await chromium.launch();
  const result = {};
  try {
    for (const [name, url] of Object.entries(URLS)) {
      result[name] = {};
      for (const vp of VPS) {
        const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: 1 });
        const page = await ctx.newPage();
        try {
          await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
        } catch (e) {
          try { await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 }); } catch (e2) {}
        }
        await settle(page);
        result[name][vp.w] = await probe(page, name);
        await ctx.close();
      }
    }
  } catch (err) {
    result.error = String(err);
  } finally {
    await browser.close();
  }
  writeFileSync('/Users/tuckerlemos/Documents/GitHub/beachfront-dentistry/matching/team-probe.json', JSON.stringify(result, null, 2));
  console.log('done bytes=' + JSON.stringify(result).length);
})();
