import { chromium } from 'file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs';
import { writeFileSync } from 'node:fs';
const URL='https://www.beachfrontdentistry.com/our-team';
(async()=>{
  const b=await chromium.launch(); const res={};
  try{
    for(const w of [1440,390]){
      const ctx=await b.newContext({viewport:{width:w,height:900}}); const page=await ctx.newPage();
      await page.goto(URL,{waitUntil:'networkidle',timeout:45000}).catch(()=>{});
      await page.evaluate(()=>window.scrollTo(0,400)); await page.waitForTimeout(200); await page.evaluate(()=>window.scrollTo(0,0)); await page.waitForTimeout(200);
      res[w]=await page.evaluate(()=>{
        const type=(el)=>{const cs=getComputedStyle(el);return{tag:el.tagName.toLowerCase(),ff:cs.fontFamily.split(',')[0],fw:cs.fontWeight,fs:cs.fontSize,lh:cs.lineHeight,color:cs.color,tt:cs.textTransform,ta:cs.textAlign};};
        const box=(el)=>{const r=el.getBoundingClientRect();return{y:Math.round(r.y),h:Math.round(r.height)};};
        const isLeaf=(el)=>el.children.length===0 && el.textContent.trim().length>0;
        const o={};
        // Meet: leaf inside hero with the word
        const hero=document.querySelector('section.hero');
        const meet=Array.from(hero.querySelectorAll('*')).filter(isLeaf).find(e=>/Meet/i.test(e.textContent));
        o.meet=meet?{...type(meet),text:meet.textContent.trim(),box:box(meet)}:null;
        // intro: leaf text inside subtitle section that starts with 'We love'
        const sub=document.querySelector('section.our-team-subtitle-section');
        const intro=Array.from(sub.querySelectorAll('*')).filter(isLeaf).find(e=>/We love caring/i.test(e.textContent));
        o.intro=intro?{...type(intro),text:intro.textContent.replace(/\s+/g,' ').trim().slice(0,60),box:box(intro)}:null;
        // Our/Team leaves for confirm
        const ot=Array.from(sub.querySelectorAll('*')).filter(isLeaf).filter(e=>/^(Our|Team)$/.test(e.textContent.trim())).map(e=>({...type(e),text:e.textContent.trim(),box:box(e)}));
        o.ourTeam=ot;
        return o;
      });
      await ctx.close();
    }
  }catch(e){res.error=String(e);}finally{await b.close();}
  writeFileSync('/Users/tuckerlemos/Documents/GitHub/beachfront-dentistry/matching/team-probe3.json',JSON.stringify(res,null,2));
  console.log('done');
})();
