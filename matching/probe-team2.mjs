import { chromium } from 'file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs';
import { writeFileSync } from 'node:fs';

const URL = 'https://www.beachfrontdentistry.com/our-team';
const VPS = [1440, 390];

async function settle(page) {
  const h = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < h; y += 300) { await page.evaluate((yy) => window.scrollTo(0, yy), y); await page.waitForTimeout(100); }
  await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(250);
}

(async () => {
  const browser = await chromium.launch();
  const res = {};
  try {
    for (const w of VPS) {
      const ctx = await browser.newContext({ viewport: { width: w, height: 900 } });
      const page = await ctx.newPage();
      await page.goto(URL, { waitUntil: 'networkidle', timeout: 45000 }).catch(()=>{});
      await settle(page);
      res[w] = await page.evaluate(() => {
        const type = (el)=>{const cs=getComputedStyle(el);const o={};for(const p of ['font-family','font-weight','font-size','line-height','color','text-transform','text-align','letter-spacing'])o[p]=cs.getPropertyValue(p);return o;};
        const box=(el)=>{const r=el.getBoundingClientRect();return{x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height)};};
        const o={};
        // Meet word in hero
        const hero=document.querySelector('section.hero');
        if(hero){ const cs=getComputedStyle(hero);
          o.hero={box:box(hero),bg:cs.backgroundImage.slice(0,140),bgColor:cs.backgroundColor,bgSize:cs.backgroundSize,svg:hero.querySelectorAll('svg').length,waveClass:!!hero.querySelector('.bot-wave, [class*=wave]')};
          // biggest text node in hero
          const cand=Array.from(hero.querySelectorAll('h1,h2,h3,div,span')).filter(e=>e.children.length===0 && e.textContent.trim().length);
          o.meet=cand.map(e=>({tag:e.tagName.toLowerCase(),text:e.textContent.trim().slice(0,20),...type(e),box:box(e)})).filter(m=>parseFloat(m['font-size'])>40).slice(0,3);
        }
        // subtitle section: Our/Team + intro
        const sub=document.querySelector('section.our-team-subtitle-section');
        if(sub){ o.subBox=box(sub);
          const p=Array.from(sub.querySelectorAll('p,div')).find(e=>e.textContent.trim().length>40 && !/^(Our|Team|Meet)/.test(e.textContent.trim()));
          if(p) o.intro={tag:p.tagName.toLowerCase(),text:p.textContent.replace(/\s+/g,' ').trim().slice(0,180),...type(p),box:box(p)};
        }
        // visible team cards
        const items=Array.from(document.querySelectorAll('.team-list-item')).filter(el=>el.getBoundingClientRect().height>50);
        o.visibleCards=items.length;
        o.cardNames=items.map(el=>{const h=el.querySelector('h5');return h?h.textContent.trim():'';}).slice(0,20);
        // favorite beach caption + wrapper on first card
        if(items[0]){ const c=items[0];
          const beachImg=c.querySelector('img[alt]:not([alt=""])') || Array.from(c.querySelectorAll('img')).find(im=>im.width>150 && im.height<200 && im.height>0);
          const cap=Array.from(c.querySelectorAll('h6')).find(h=>getComputedStyle(h).color==='rgb(255, 255, 255)');
          o.beach={imgAlt:beachImg?beachImg.alt:null,imgBox:beachImg?box(beachImg):null,cap:cap?{text:cap.textContent.trim(),...type(cap),box:box(cap)}:null};
          // read more link
          const rm=Array.from(c.querySelectorAll('a')).find(a=>/read more/i.test(a.textContent));
          if(rm) o.readMore={text:rm.textContent.replace(/\s+/g,' ').trim().slice(0,30),...type(rm),box:box(rm)};
        }
        // footer Ready CTA heading
        const foot=document.querySelector('section.footer');
        if(foot){ const rd=Array.from(foot.querySelectorAll('h1,h2,h3,h4')).find(h=>/Ready for great/i.test(h.textContent));
          if(rd) o.readyCTA={tag:rd.tagName.toLowerCase(),text:rd.textContent.replace(/\s+/g,' ').trim(),...type(rd)};
          o.footerBox=box(foot);
        }
        return o;
      });
      await ctx.close();
    }
  } catch(e){ res.error=String(e); } finally { await browser.close(); }
  writeFileSync('/Users/tuckerlemos/Documents/GitHub/beachfront-dentistry/matching/team-probe2.json', JSON.stringify(res,null,2));
  console.log('done '+JSON.stringify(res).length);
})();
