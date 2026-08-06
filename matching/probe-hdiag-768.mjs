import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";
async function settle(p){const H=await p.evaluate(()=>document.body.scrollHeight);for(let y=0;y<H;y+=200){await p.evaluate(v=>scrollTo(0,v),y);await p.waitForTimeout(50);}await p.evaluate(()=>scrollTo(0,document.body.scrollHeight));await p.waitForTimeout(900);await p.evaluate(()=>scrollTo(0,0));await p.waitForTimeout(300);}
const b=await chromium.launch();
try{
for (const vw of [768,834,390]){
 for (const [name,url] of [["live","https://www.beachfrontdentistry.com/"],["cand","http://localhost:5173/dev/match/home"]]){
  const p=await b.newPage({viewport:{width:vw,height:900}});
  try{await p.goto(url,{waitUntil:"networkidle",timeout:90000});}catch{await p.goto(url,{waitUntil:"domcontentloaded",timeout:90000});await p.waitForTimeout(3000);}
  await settle(p);
  const r=await p.evaluate(()=>{
    const cl=s=>(s||"").replace(/\s+/g,"").trim();
    const o={root:getComputedStyle(document.documentElement).fontSize};
    const qa=document.querySelector(".qa-block")||document.querySelector(".qa-item");
    if(qa){const rr=qa.getBoundingClientRect();o.qa=`${Math.round(rr.width)}x${Math.round(rr.height)} mb=${getComputedStyle(qa).marginBottom}`;}
    const arrows=[...document.querySelectorAll("img")].filter(i=>/left-arrow|right-arrow|review-arrow/.test(i.currentSrc||i.src)).map(i=>{const rr=i.getBoundingClientRect();return `${(i.currentSrc||i.src).split("/").pop().slice(0,26)} @${Math.round(rr.left)},${Math.round(rr.top+scrollY)} ${Math.round(rr.width)}x${Math.round(rr.height)}`;});
    o.arrows=arrows;
    // step layout
    const steps=[...document.querySelectorAll("h3,p,span")].filter(e=>!e.children.length&&/^Step0\d$/i.test(cl(e.textContent))).map(e=>{const rr=e.getBoundingClientRect();return `${Math.round(rr.left)},${Math.round(rr.top+scrollY)} ${Math.round(rr.width)}`});
    o.steps=steps;
    // any pill
    const pill=[...document.querySelectorAll("a")].find(a=>cl(a.textContent)==="ViewAllServices");
    if(pill){const cs=getComputedStyle(pill);const rr=pill.getBoundingClientRect();o.pill=`${Math.round(rr.width)}x${Math.round(rr.height)} fs=${cs.fontSize} lh=${cs.lineHeight} pad=${cs.paddingTop} ${cs.paddingLeft}`;}
    // review viewport width
    const vp=document.querySelector(".review-slider-holder-viewport");
    if(vp){const rr=vp.getBoundingClientRect();o.rvp=`${Math.round(rr.left)},${Math.round(rr.width)}x${Math.round(rr.height)}`;}
    o.pageH=document.body.scrollHeight;
    return o;
  });
  console.log(`@${vw} ${name}: ` + JSON.stringify(r));
  await p.close();
 }
}}finally{await b.close();}
