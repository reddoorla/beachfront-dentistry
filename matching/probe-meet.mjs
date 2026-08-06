import { chromium } from 'file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs';
const URL='https://www.beachfrontdentistry.com/our-team';
const b=await chromium.launch();
try{
 for(const w of [1440,390]){
  const ctx=await b.newContext({viewport:{width:w,height:900}}); const p=await ctx.newPage();
  await p.goto(URL,{waitUntil:'networkidle',timeout:45000}).catch(()=>{});
  const r=await p.evaluate(()=>{
   const hero=document.querySelector('section.hero');
   const hs=Array.from(hero.querySelectorAll('h1,h2,h3,h4,.heading, [class*=title]')).map(e=>{const cs=getComputedStyle(e);const b=e.getBoundingClientRect();return{tag:e.tagName.toLowerCase(),cls:(e.className||'').toString().slice(0,40),text:e.textContent.replace(/\s+/g,' ').trim().slice(0,20),ff:cs.fontFamily.split(',')[0],fw:cs.fontWeight,fs:cs.fontSize,lh:cs.lineHeight,color:cs.color,ta:cs.textAlign,y:Math.round(b.y),h:Math.round(b.height)};});
   return hs;
  });
  console.log('##',w,JSON.stringify(r));
  await ctx.close();
 }
}finally{await b.close();}
