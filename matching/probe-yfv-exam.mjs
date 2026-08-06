import { chromium } from 'file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs';
const LIVE = 'https://www.beachfrontdentistry.com/your-first-visit';
async function settle(page){const h=await page.evaluate(()=>document.body.scrollHeight);for(let y=0;y<h;y+=300){await page.evaluate(yy=>scrollTo(0,yy),y);await page.waitForTimeout(50);}await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(300);}
async function main(){
  const b=await chromium.launch();
  try{
    const p=await b.newPage();
    await p.setViewportSize({width:1440,height:900});
    await p.goto(LIVE,{waitUntil:'networkidle',timeout:60000}).catch(()=>{});
    await p.waitForTimeout(600);await settle(p);
    const out=await p.evaluate(()=>{
      const exam=document.querySelector('.fv-exam-section');
      const r={};
      r.heading=exam.querySelector('h1,h2,h3')?.outerHTML.slice(0,120);
      r.strongs=[...exam.querySelectorAll('strong,b')].map(s=>s.textContent.trim());
      r.paras=[...exam.querySelectorAll('p')].map(p=>p.textContent.trim().replace(/\s+/g,' ').slice(0,140));
      r.hasImg=exam.querySelectorAll('img').length;
      // toc cards text
      const toc=document.querySelector('.fv-toc-section');
      r.tocCards=[...toc.querySelectorAll('a')].map(a=>a.textContent.trim().replace(/\s+/g,' ').slice(0,60)).filter(t=>t.length>1);
      // office tour captions
      const tour=document.querySelector('.fv-virtual-tour-section');
      r.tourCaptions=[...tour.querySelectorAll('figcaption,[class*="caption"],.w-slide div')].slice(0,3).map(c=>c.textContent.trim().slice(0,50));
      r.tourHeadingHTML=tour.querySelector('h1,h2,h3')?.outerHTML.slice(0,120);
      // team section names count
      const team=document.querySelector('.fv-meet-our-team-section');
      r.teamHeadingHTML=team.querySelector('h1,h2,h3')?.outerHTML.slice(0,120);
      r.teamImgCount=team.querySelectorAll('img').length;
      // review band
      const rev=document.querySelector('.fv-review-section');
      r.reviewText=rev.textContent.trim().replace(/\s+/g,' ').slice(0,180);
      return r;
    });
    console.log(JSON.stringify(out,null,1));
    await p.close();
  }finally{await b.close();}
}
main();
