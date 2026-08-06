import { chromium } from 'file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs';
const URL = 'https://www.beachfrontdentistry.com/your-first-visit';
async function settle(page){await page.evaluate(async()=>{await new Promise(r=>{let y=0;const s=()=>{scrollTo(0,y);y+=250;if(y<document.body.scrollHeight)setTimeout(s,40);else{scrollTo(0,0);setTimeout(r,300)}};s()})});await page.waitForTimeout(500);}
const b = await chromium.launch();
try {
  const p = await b.newPage({ viewport:{width:1440,height:900} });
  await p.goto(URL,{waitUntil:'networkidle',timeout:60000});
  await settle(p);
  const out = await p.evaluate(() => {
    const T=(el)=>{if(!el)return null;const c=getComputedStyle(el);const r=el.getBoundingClientRect();return {tag:el.tagName.toLowerCase(),cls:(el.className||'').toString().slice(0,44),w:Math.round(r.width),h:Math.round(r.h||r.height),x:Math.round(r.x),y:Math.round(r.y+scrollY),fs:c.fontSize,fw:c.fontWeight,color:c.color,ta:c.textAlign,ff:c.fontFamily.split(',')[0],txt:(el.innerText||'').trim().slice(0,44)};};
    const dump=(sel)=>{const s=document.querySelector(sel);if(!s)return {missing:sel};
      return {box:T(s), fullText:(s.innerText||'').trim(), children:[...s.querySelectorAll('h1,h2,h3,h4,h5,h6,p,a,button,img')].slice(0,40).map(el=>({tag:el.tagName.toLowerCase(),cls:(el.className||'').toString().slice(0,40),fw:getComputedStyle(el).fontWeight,fs:getComputedStyle(el).fontSize,color:getComputedStyle(el).color,x:Math.round(el.getBoundingClientRect().x),y:Math.round(el.getBoundingClientRect().y+scrollY),w:Math.round(el.getBoundingClientRect().width),src:el.tagName==='IMG'?(el.getAttribute('src')||'').slice(-40):undefined,txt:(el.innerText||'').trim().slice(0,60)}))};};
    return {
      toc: dump('.fv-toc-section'),
      tour: dump('.fv-virtual-tour-section'),
      meet: dump('.fv-meet-our-team-section'),
      exam: dump('.fv-exam-section'),
    };
  });
  console.log(JSON.stringify(out,null,1));
} finally { await b.close(); }
