import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";
for (const [tag,url,sel] of [["REF","https://www.beachfrontdentistry.com/",".big-teal-tooth"],["CAND","http://localhost:5190/",'img[src*="big-teal-tooth"]']]){
 for (const w of [390,480,650,834,1440]){
  const b=await chromium.launch();
  try{const p=await b.newPage({viewport:{width:w,height:1000}});
  await p.goto(url,{waitUntil:"networkidle",timeout:60000});
  const h0=await p.evaluate(()=>document.body.scrollHeight);
  for(let y=0;y<h0;y+=300){await p.evaluate(yy=>scrollTo(0,yy),y);await p.waitForTimeout(50);}
  const r=await p.evaluate((sel)=>{
   let t=document.querySelector(sel)||[...document.querySelectorAll("img")].find(e=>/tooth/i.test(e.src||"")&&e.getBoundingClientRect().width>40);
   if(!t)return null;
   const tr=t.getBoundingClientRect(); const sy=window.scrollY;
   // walk up to find nearest ancestor with a teal-ish gradient/bg (the services band)
   let a=t.parentElement, band=null;
   for(let i=0;i<8&&a;i++){const cs=getComputedStyle(a);const bg=(cs.backgroundImage+cs.background+cs.backgroundColor);
     if(/gradient|rgb\(1?[0-9]?[0-9],\s*1[0-9][0-9]/.test(bg) && a.getBoundingClientRect().height>200){band=a;break;} a=a.parentElement;}
   const br=band?band.getBoundingClientRect():null;
   return {toothTop:Math.round(tr.top+sy),toothCenter:Math.round(tr.top+tr.height/2+sy),toothW:Math.round(tr.width),
     bandTop:br?Math.round(br.top+sy):null, bandTag:band?band.tagName+"."+(band.className||"").toString().replace(/\s+/g,".").slice(0,22):null,
     centerMinusBand: br?Math.round(tr.top+tr.height/2 - br.top):null};
  },sel);
  console.log(`${tag} @${w}:`,JSON.stringify(r));
  }finally{await b.close();}
 }
}
