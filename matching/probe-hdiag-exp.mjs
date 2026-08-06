import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";
const VW = Number(process.argv[2]||1440);
async function settle(p){const H=await p.evaluate(()=>document.body.scrollHeight);for(let y=0;y<H;y+=200){await p.evaluate(v=>scrollTo(0,v),y);await p.waitForTimeout(50);}await p.evaluate(()=>scrollTo(0,document.body.scrollHeight));await p.waitForTimeout(1000);await p.evaluate(()=>scrollTo(0,0));await p.waitForTimeout(300);}
const b = await chromium.launch();
try{
for (const [name,url] of [["live","https://www.beachfrontdentistry.com/"],["cand","http://localhost:5173/dev/match/home"]]){
  const p = await b.newPage({viewport:{width:VW,height:900}});
  try{await p.goto(url,{waitUntil:"networkidle",timeout:90000});}catch{await p.goto(url,{waitUntil:"domcontentloaded",timeout:90000});await p.waitForTimeout(3000);}
  await settle(p);
  const r = await p.evaluate(()=>{
    const clean=s=>(s||"").replace(/\s+/g,"").trim();
    const out=[];
    // walk up from "Read Reviews"
    const el=[...document.querySelectorAll("h5,span,div,a,button")].find(e=>!e.children.length&&clean(e.textContent)==="ReadReviews");
    if(el){let e=el,ch=[];for(let i=0;i<7&&e&&e!==document.body;i++){const cs=getComputedStyle(e);const rr=e.getBoundingClientRect();ch.push(`<${e.tagName.toLowerCase()}.${(e.className.baseVal??e.className??"").toString().split(" ").slice(0,2).join(".")} ${Math.round(rr.left)},${Math.round(rr.top+scrollY)} ${Math.round(rr.width)}x${Math.round(rr.height)} op=${cs.opacity} h=${cs.height} maxh=${cs.maxHeight} ovf=${cs.overflow} disp=${cs.display} mt=${cs.marginTop} mb=${cs.marginBottom}>`);e=e.parentElement;}
      out.push("readreviews chain:\n   "+ch.join("\n   "));}
    // all elements between the review card bottom and the section bottom
    const sec = document.querySelector(".home-ssb-section") || [...document.querySelectorAll("section")].find(s=>clean(s.textContent).startsWith("ServingtheSouthBay"));
    if(sec){const rr=sec.getBoundingClientRect();out.push(`ssb section ${Math.round(rr.left)},${Math.round(rr.top+scrollY)} ${Math.round(rr.width)}x${Math.round(rr.height)} pad=${getComputedStyle(sec).padding} mar=${getComputedStyle(sec).margin}`);
      for(const c of sec.querySelectorAll("*")){const b2=c.getBoundingClientRect();const y=b2.top+scrollY;if(b2.height<4)continue;if(y+b2.height< rr.top+scrollY+rr.height-260) continue; out.push(`   tail <${c.tagName.toLowerCase()}.${(c.className.baseVal??c.className??"").toString().split(" ").slice(0,2).join(".")}> ${Math.round(b2.left)},${Math.round(y)} ${Math.round(b2.width)}x${Math.round(b2.height)} op=${getComputedStyle(c).opacity}`);}
    }
    // pill sample
    const pill=[...document.querySelectorAll("a")].find(a=>clean(a.textContent)==="ViewAllServices");
    if(pill){const cs=getComputedStyle(pill);const rr=pill.getBoundingClientRect();out.push(`pill ViewAllServices ${Math.round(rr.width)}x${Math.round(rr.height)} fs=${cs.fontSize} lh=${cs.lineHeight} pad=${cs.padding} br=${cs.borderRadius} bg=${cs.backgroundColor} bw=${cs.borderTopWidth}`);}
    const pill2=[...document.querySelectorAll("a")].find(a=>clean(a.textContent)==="MakeAppointment");
    if(pill2){const cs=getComputedStyle(pill2);const rr=pill2.getBoundingClientRect();out.push(`pill MakeAppointment ${Math.round(rr.left)},${Math.round(rr.top+scrollY)} ${Math.round(rr.width)}x${Math.round(rr.height)} fs=${cs.fontSize} lh=${cs.lineHeight} pad=${cs.padding} bw=${cs.borderTopWidth}`);}
    // Finally heading box
    const fh=[...document.querySelectorAll("h1,h2")].find(e=>clean(e.textContent).startsWith("Finallyhaveadentist"));
    if(fh){let e=fh,ch=[];for(let i=0;i<3&&e;i++){const cs=getComputedStyle(e);const rr=e.getBoundingClientRect();ch.push(`<${e.tagName.toLowerCase()}.${(e.className.baseVal??e.className??"").toString().split(" ").slice(0,2).join(".")} ${Math.round(rr.left)},${Math.round(rr.top+scrollY)} ${Math.round(rr.width)}x${Math.round(rr.height)} w=${cs.width} mw=${cs.maxWidth}>`);e=e.parentElement;}out.push("finally heading:\n   "+ch.join("\n   "));}
    return out;
  });
  console.log(`\n===== ${name} @${VW}`); for(const l of r) console.log("  "+l);
  await p.close();
}}finally{await b.close();}
