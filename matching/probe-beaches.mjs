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
  await page.waitForTimeout(600);
}

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
  await settle(page);
  const cards = await page.evaluate(() => {
    const items = [...document.querySelectorAll('.team-list-item')];
    return items.map((c) => {
      const nameEl = c.querySelector('h5, [class*="text-align-center"]');
      const roleEl = c.querySelector('h6.text-align-center, h6.h7, [class*="h7"]');
      const beachImg = c.querySelector('.team-grid-beach, img[class*="beach"]');
      const beachName = c.querySelector('.team-beach-name, h6[class*="beach"]');
      const headshot = c.querySelector('.team-grid-headshot, img[class*="headshot"]');
      const readmore = [...c.querySelectorAll('a')].find(a => /read more/i.test(a.innerText||''));
      return {
        name: nameEl ? nameEl.innerText.trim() : '',
        role: roleEl ? roleEl.innerText.trim() : '',
        headshotSrc: headshot ? headshot.getAttribute('src') : null,
        beachSrc: beachImg ? beachImg.getAttribute('src') : null,
        beachSrcset: beachImg ? (beachImg.getAttribute('srcset')||'').split(',').map(s=>s.trim()).slice(-1)[0] : null,
        beachName: beachName ? beachName.innerText.trim() : '',
        readmoreHref: readmore ? readmore.getAttribute('href') : null,
      };
    });
  });
  console.log(JSON.stringify(cards, null, 1));
} finally {
  await browser.close();
}
