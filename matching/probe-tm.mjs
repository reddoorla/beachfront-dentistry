import { chromium } from 'file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs';
async function settle(page){await page.evaluate(async()=>{await new Promise(r=>{let y=0;const s=()=>{scrollTo(0,y);y+=250;if(y<document.body.scrollHeight)setTimeout(s,40);else{scrollTo(0,0);setTimeout(r,300)}};s()})});await page.waitForTimeout(400);}
const b=await chromium.launch();
try{
for(const [name,URL] of [["LIVE","https://www.beachfrontdentistry.com/team-members/dr-robert-quan"],["MINE","http://localhost:5190/team-members/dr-robert-quan"]]){
const p=await b.newPage({viewport:{width:1440,height:900}});
await p.goto(URL,{waitUntil:"networkidle",timeout:60000});
await settle(p);
const o=await p.evaluate(()=>{const main=document.querySelector('main')||document.body;
return {sections:[...main.children].map(el=>({tag:el.tagName.toLowerCase(),cls:(el.className||'').toString().slice(0,40),h:Math.round(el.getBoundingClientRect().height),txt:(el.innerText||'').trim().slice(0,60).replace(/\n/g,' | ')})),
heads:[...document.querySelectorAll('h1,h2,h3')].slice(0,8).map(h=>({t:h.tagName.toLowerCase(),fs:getComputedStyle(h).fontSize,txt:(h.innerText||'').trim().slice(0,40)}))};});
console.log('===== '+name+' =====');
o.sections.forEach((s,i)=>console.log(' ',i,s.tag,s.cls,'h='+s.h,'|',JSON.stringify(s.txt)));
console.log(' heads:',JSON.stringify(o.heads));
await p.close();
}
}finally{await b.close();}
