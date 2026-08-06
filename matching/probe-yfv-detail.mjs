import { chromium } from 'file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs';

const LIVE = 'https://www.beachfrontdentistry.com/your-first-visit';
const CAND = 'http://localhost:5190/dev/match/your-first-visit';

async function settle(page) {
  const h = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < h; y += 300) { await page.evaluate((yy)=>window.scrollTo(0,yy), y); await page.waitForTimeout(50); }
  await page.evaluate(() => window.scrollTo(0,0)); await page.waitForTimeout(400);
}
const R = n => Math.round(n);

async function detail(page, url, w, isLive) {
  await page.setViewportSize({ width: w, height: 900 });
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 }).catch(()=>{});
  await page.waitForTimeout(700); await settle(page);
  return await page.evaluate(({isLive}) => {
    const q = s => document.querySelector(s);
    const info = el => { if(!el) return null; const r=el.getBoundingClientRect(); const cs=getComputedStyle(el);
      return {w:Math.round(r.width),h:Math.round(r.height),top:Math.round(r.top+scrollY),left:Math.round(r.left),
        pad:cs.padding,bg:cs.backgroundColor,disp:cs.display}; };
    const out = {};

    // HERO
    const hero = q('section.hero') || q('section.hero-band') || q('.hero');
    if (hero) {
      const cs = getComputedStyle(hero); const r = hero.getBoundingClientRect();
      const bgimg = cs.backgroundImage;
      const heroImg = hero.querySelector('img');
      const cta = hero.querySelector('a.button, a.btn, .button, a[class*="btn"], a.w-button');
      const h1 = hero.querySelector('h1');
      out.hero = { h:Math.round(r.height), vh: Math.round(r.height/innerHeight*100), bg:cs.backgroundColor,
        bgimg: bgimg.slice(0,80), hasImgTag: !!heroImg, imgSrc: heroImg? heroImg.src.split('/').pop():null,
        h1text: h1?h1.textContent.trim():null,
        cta: cta? {text:cta.textContent.trim().replace(/\s+/g,' '), cls:cta.className.toString().slice(0,50)}:null };
    }

    // TOC section (live only)
    const toc = q('.fv-toc-section');
    if (toc) {
      const cards = [...toc.querySelectorAll('a, .fv-toc-card, [class*="toc"]')].filter(a=>a.textContent.trim().length>2);
      out.toc = { h: Math.round(toc.getBoundingClientRect().height),
        items: [...toc.querySelectorAll('h1,h2,h3,h4')].map(h=>h.textContent.trim()),
        cardCount: toc.querySelectorAll('a').length };
    }

    // OFFICE TOUR gallery
    const tour = q('.fv-virtual-tour-section') || (isLive?null:document.querySelectorAll('section')[1]);
    if (tour) {
      const imgs = [...tour.querySelectorAll('img')];
      const vis = imgs.filter(i=>{const r=i.getBoundingClientRect(); return r.width>10 && r.height>10;});
      const sizes = vis.slice(0,4).map(i=>{const r=i.getBoundingClientRect(); return `${Math.round(r.width)}x${Math.round(r.height)}@l${Math.round(r.left)}`;});
      const arrows = tour.querySelectorAll('[class*="arrow"],[class*="prev"],[class*="next"],button[aria-label]');
      const dots = tour.querySelectorAll('[class*="dot"],[class*="indicator"],[class*="bullet"]');
      // detect horizontal scroller
      const track = tour.querySelector('[class*="track"],[class*="slider"],[class*="carousel"],[class*="swiper"],[class*="flick"],[class*="embla"]');
      out.tour = { imgTotal: imgs.length, imgVisible: vis.length, firstSizes: sizes,
        arrowCount: arrows.length, dotCount: dots.length,
        trackClass: track? track.className.toString().slice(0,60):null,
        containerW: Math.round(tour.getBoundingClientRect().width) };
    }

    // FIRST EXAM
    const exam = q('.fv-exam-section') || null;
    const examEl = exam || [...document.querySelectorAll('section')].find(s=>/First Exam/.test(s.textContent) && /min/i.test(s.textContent));
    if (examEl) {
      const cs = getComputedStyle(examEl);
      const inner = examEl.querySelector('[class*="rich"],[class*="prose"],[class*="content"],[class*="w-richtext"]') || examEl;
      const bolds = [...examEl.querySelectorAll('strong,b')].slice(0,4).map(b=>b.textContent.trim().slice(0,50));
      const ps = [...examEl.querySelectorAll('p')].filter(p=>p.textContent.trim().length>3);
      const firstP = ps[0]? getComputedStyle(ps[0]) : null;
      const strongCs = examEl.querySelector('strong')? getComputedStyle(examEl.querySelector('strong')):null;
      const cols = getComputedStyle(inner).columnCount;
      out.exam = { pCount: ps.length, bolds,
        innerMaxW: getComputedStyle(inner).maxWidth, innerW: Math.round(inner.getBoundingClientRect().width),
        align: firstP? firstP.textAlign : null,
        pTuple: firstP? `${firstP.fontSize}/${firstP.fontWeight}/${firstP.lineHeight}`:null,
        strongTuple: strongCs? `${strongCs.fontSize}/${strongCs.fontWeight}/${strongCs.color}`:null,
        columnCount: cols,
        listType: examEl.querySelector('ol')?'ol':examEl.querySelector('ul')?'ul':'none' };
    }

    // CAND team heading
    if (!isLive) {
      const teamSec = document.querySelectorAll('section')[2];
      out.candTeam = teamSec? { text: teamSec.textContent.trim().replace(/\s+/g,' ').slice(0,80),
        headings: [...teamSec.querySelectorAll('h1,h2,h3,h4,p')].slice(0,3).map(h=>`${h.tagName}:${h.textContent.trim().slice(0,40)}`) }:null;
    }
    return out;
  }, {isLive});
}

async function main() {
  const b = await chromium.launch();
  const res = {};
  try {
    for (const w of [1440,390]) {
      const p1 = await b.newPage(); res['live'+w] = await detail(p1, LIVE, w, true); await p1.close();
      const p2 = await b.newPage(); res['cand'+w] = await detail(p2, CAND, w, false); await p2.close();
    }
  } finally { await b.close(); }
  console.log(JSON.stringify(res,null,1));
}
main();
