import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";
for (const [tag,url] of [["REF","https://www.beachfrontdentistry.com/"],["CAND","http://localhost:5190/"]]){
 const b=await chromium.launch();
 try{const p=await b.newPage({viewport:{width:650,height:1000}});
 await p.goto(url,{waitUntil:"networkidle",timeout:60000});
 const h0=await p.evaluate(()=>document.body.scrollHeight);
 for(let y=0;y<h0;y+=300){await p.evaluate(yy=>scrollTo(0,yy),y);await p.waitForTimeout(50);}
 const r=await p.evaluate(()=>{
   const el=[...document.querySelectorAll("h1,h2,h3,h4,h5,h6,a,div,p,span")].find(e=>(e.textContent||"").replace(/\s+/g," ").trim().toLowerCase().startsWith("have a complete exam")&&[...e.childNodes].some(n=>n.nodeType===3&&n.nodeValue.trim()));
   if(!el)return"MISS";
   const er=el.getBoundingClientRect();
   // climb to find the constraining container (first ancestor narrower than viewport)
   let anc=el.parentElement, chain=[];
   for(let i=0;i<5&&anc;i++){const ar=anc.getBoundingClientRect();chain.push(`${anc.tagName}.${(anc.className||"").toString().slice(0,20)} w=${Math.round(ar.width)}`);anc=anc.parentElement;}
   return {titleW:Math.round(er.width), titleLines:Math.round(er.height/26), chain};
 });
 console.log(tag, JSON.stringify(r));
 }finally{await b.close();}
}
