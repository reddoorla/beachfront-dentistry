import { chromium } from 'file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs';

const URL = 'https://www.beachfrontdentistry.com/our-team';

async function settle(page) {
  await page.evaluate(async () => {
    await new Promise((res) => {
      let y = 0;
      const step = () => { window.scrollTo(0, y); y += 250;
        if (y < document.body.scrollHeight) setTimeout(step, 40);
        else { window.scrollTo(0, 0); setTimeout(res, 300); } };
      step();
    });
  });
  await page.waitForTimeout(400);
}

const tuple = (el) => { if (!el) return null; const c = getComputedStyle(el); const r = el.getBoundingClientRect();
  return { tag: el.tagName.toLowerCase(), cls: (el.className||'').toString().slice(0,60),
    w: Math.round(r.width), h: Math.round(r.height), x: Math.round(r.x), y: Math.round(r.y+window.scrollY),
    ff: c.fontFamily.split(',')[0], fw: c.fontWeight, fs: c.fontSize, lh: c.lineHeight, ls: c.letterSpacing,
    color: c.color, ta: c.textAlign, tt: c.textTransform, bg: c.backgroundColor, br: c.borderRadius,
    pos: c.position, txt: (el.innerText||'').trim().slice(0,60) }; };

async function probe(page) {
  return await page.evaluate((tupleStr) => {
    const tuple = eval('(' + tupleStr + ')');
    const out = {};
    const main = document.querySelector('main') || document.body;
    out.sections = [...main.children].map((el) => ({ tag: el.tagName.toLowerCase(),
      cls: (el.className||'').toString().slice(0,60), h: Math.round(el.getBoundingClientRect().height),
      txt: (el.innerText||'').trim().slice(0,60).replace(/\n/g,' | ') }));
    // hero
    const hero = document.querySelector('.hero, [class*="hero"]');
    out.hero = tuple(hero);
    if (hero) out.heroHeading = tuple(hero.querySelector('h1,h2,[class*="heading"]'));
    // subtitle section — find "Our" / "Team" stacked headings + cyan intro
    const heads = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')];
    out.allHeads = heads.slice(0, 20).map(h => ({ t: h.tagName.toLowerCase(), txt: (h.innerText||'').trim().slice(0,40),
      fs: getComputedStyle(h).fontSize, fw: getComputedStyle(h).fontWeight, color: getComputedStyle(h).color,
      ta: getComputedStyle(h).textAlign, y: Math.round(h.getBoundingClientRect().y+window.scrollY) }));
    // person cards
    const cards = [...document.querySelectorAll('.team-list-item, [class*="team-list"], .w-dyn-item')].filter(c => c.querySelector('img'));
    out.cardCount = cards.length;
    if (cards[0]) {
      const c0 = cards[0];
      out.card0 = tuple(c0);
      out.card0container = tuple(c0.parentElement);
      out.card0img = tuple(c0.querySelector('img'));
      const imgs = [...c0.querySelectorAll('img')];
      out.card0imgCount = imgs.length;
      out.card0imgs = imgs.map(i => ({ ...tuple(i), src: (i.getAttribute('src')||'').slice(-60), nat: i.naturalWidth+'x'+i.naturalHeight }));
      out.card0texts = [...c0.querySelectorAll('h1,h2,h3,h4,h5,h6,p,a')].map(e => ({ ...tuple(e) }));
    }
    // grid container
    const grid = cards[0] ? cards[0].closest('.w-row, [class*="w-dyn-items"], [class*="row"]') : null;
    out.grid = tuple(grid);
    if (grid) out.gridCS = { display: getComputedStyle(grid).display, flexWrap: getComputedStyle(grid).flexWrap,
      gtc: getComputedStyle(grid).gridTemplateColumns, gap: getComputedStyle(grid).gap };
    return out;
  }, tuple.toString());
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
