import { chromium } from 'file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs';

const URL = 'https://www.beachfrontdentistry.com/services';

const cssTuple = (el) => {
  if (!el) return null;
  const c = getComputedStyle(el);
  const r = el.getBoundingClientRect();
  return {
    tag: el.tagName.toLowerCase(),
    cls: (el.className || '').toString(),
    w: Math.round(r.width * 100) / 100,
    h: Math.round(r.height * 100) / 100,
    x: Math.round(r.x * 100) / 100,
    y: Math.round(r.y * 100) / 100,
    ff: c.fontFamily,
    fw: c.fontWeight,
    fs: c.fontSize,
    lh: c.lineHeight,
    ls: c.letterSpacing,
    color: c.color,
    ta: c.textAlign,
    tt: c.textTransform,
    bg: c.backgroundColor,
    bgImg: c.backgroundImage,
    br: c.borderRadius,
    pad: c.padding,
    margin: c.margin,
    display: c.display,
    gtc: c.gridTemplateColumns,
    rowGap: c.rowGap,
    colGap: c.columnGap,
    flexWrap: c.flexWrap,
    maxW: c.maxWidth,
    pos: c.position,
    top: c.top, left: c.left, right: c.right, bottom: c.bottom,
    txt: (el.innerText || '').trim().slice(0, 90),
  };
};

async function settle(page) {
  await page.evaluate(async () => {
    await new Promise((res) => {
      let y = 0;
      const step = () => {
        window.scrollTo(0, y);
        y += 300;
        if (y < document.body.scrollHeight) setTimeout(step, 40);
        else { window.scrollTo(0, 0); setTimeout(res, 300); }
      };
      step();
    });
  });
  await page.waitForTimeout(400);
}

async function probe(page) {
  return await page.evaluate((cssTupleStr) => {
    const cssTuple = eval('(' + cssTupleStr + ')');
    const out = {};

    const main = document.querySelector('main') || document.body;
    out.sections = [...main.children].map((el) => ({
      tag: el.tagName.toLowerCase(),
      cls: (el.className || '').toString().slice(0, 80),
      h: Math.round(el.getBoundingClientRect().height),
      txt: (el.innerText || '').trim().slice(0, 50).replace(/\n/g, ' | '),
    }));

    const hero = document.querySelector('.hero, [class*="hero"]');
    out.hero = cssTuple(hero);
    if (hero) out.heroHeading = cssTuple(hero.querySelector('h1,h2,.heading,[class*="heading"]'));

    const grid = document.querySelector('.service-grid');
    out.grid = cssTuple(grid);
    if (grid) {
      const gc = getComputedStyle(grid);
      out.gridExtra = { padT: gc.paddingTop, padR: gc.paddingRight, padB: gc.paddingBottom, padL: gc.paddingLeft, justify: gc.justifyContent, gtr: gc.gridTemplateRows };
      out.gridParent = cssTuple(grid.parentElement);
    }

    const blocks = [...document.querySelectorAll('.service-block')];
    out.blockCount = blocks.length;
    out.block0 = cssTuple(blocks[0]);
    out.block1 = cssTuple(blocks[1]);

    if (blocks[0]) {
      const b = blocks[0];
      const top = b.querySelector('.h-60pc, [class*="h-60"]');
      const bottom = b.querySelector('.h-40pc, [class*="h-40"]');
      out.top60 = cssTuple(top);
      out.bottom40 = cssTuple(bottom);
      if (top) {
        out.cardHeading = cssTuple(top.querySelector('h1,h2,h3,h4,h5,[class*="heading"]'));
        const paras = [...top.querySelectorAll('p,[class*="paragraph"],[class*="text"]')];
        out.cardIntro = cssTuple(paras.find(p => (p.innerText || '').trim().length > 20) || paras[0]);
      }
      if (bottom) {
        const links = [...bottom.querySelectorAll('a')];
        out.linkCount = links.length;
        out.link0 = cssTuple(links[0]);
        out.link1 = cssTuple(links[1]);
        out.linkLabel = cssTuple(links[0] && links[0].querySelector('h6,[class*="h6"],h1,h2,h3,h4,h5'));
        const halves = [...bottom.querySelectorAll('._w-half,[class*="w-half"]')];
        out.halfCount = halves.length;
        out.half0 = cssTuple(halves[0]);
        out.half1 = cssTuple(halves[1]);
        out.linkWrap = cssTuple(bottom.firstElementChild);
        out.linkYs = links.slice(0, 6).map(a => { const r = a.getBoundingClientRect(); return { y: Math.round(r.y), x: Math.round(r.x), w: Math.round(r.width), t: (a.innerText || '').trim().slice(0, 20) }; });
      }
      const teef = b.querySelector('.service-block-teef,img[class*="teef"],img');
      out.teef = cssTuple(teef);
      if (teef) { out.teefSrc = teef.getAttribute('src'); out.teefNatural = { nw: teef.naturalWidth, nh: teef.naturalHeight }; out.teefSizes = teef.getAttribute('sizes'); out.teefSrcset = (teef.getAttribute('srcset') || '').slice(0, 120); }
    }

    out.blocksSummary = blocks.map((b) => {
      const h = b.querySelector('.h-60pc h1,.h-60pc h2,.h-60pc h3,.h-60pc h4,.h-60pc h5,[class*="heading"]');
      return { heading: h ? (h.innerText || '').trim() : '', links: b.querySelectorAll('.h-40pc a,[class*="h-40"] a').length };
    });

    const grid2 = document.querySelector('.service-grid');
    if (grid2) {
      out.gridPrevSibling = cssTuple(grid2.previousElementSibling);
      const gridBand = grid2.closest('section,[class*="section"],[class*="band"]') || grid2.parentElement;
      out.gridBand = cssTuple(gridBand);
      out.aboveGridBand = cssTuple(gridBand ? gridBand.previousElementSibling : null);
    }

    const heads = [...document.querySelectorAll('h1,h2,h3,h4')];
    const cta = heads.find(h => /ready for great dental health/i.test(h.innerText || ''));
    out.cta = cssTuple(cta);
    if (cta) out.ctaBand = cssTuple(cta.closest('section,[class*="section"],[class*="band"]'));

    return out;
  }, cssTuple.toString());
}

const browser = await chromium.launch({ headless: true });
try {
  const results = {};
  for (const width of [1440, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
    await settle(page);
    results[width] = await probe(page);
    await page.close();
  }
  console.log(JSON.stringify(results, null, 1));
} finally {
  await browser.close();
}
