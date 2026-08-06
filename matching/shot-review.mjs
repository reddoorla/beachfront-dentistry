import { chromium } from 'file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs';
async function settle(p){await p.evaluate(async()=>{await new Promise(r=>{let y=0;const s=()=>{scrollTo(0,y);y+=300;if(y<document.body.scrollHeight)setTimeout(s,25);else{scrollTo(0,0);setTimeout(r,400)}};s()})});await p.waitForTimeout(500);}
const shots=[
 ['contact-live','https://www.beachfrontdentistry.com/contact-us'],
 ['contact-mine','https://deploy-preview-13--beachfront-dentistry-rd.netlify.app/contact-us'],
 ['ourteam-devmatch','https://deploy-preview-13--beachfront-dentistry-rd.netlify.app/dev/match/our-team'],
];
const b=await chromium.launch();
try{
for(const [name,url] of shots){
 const p=await b.newPage({viewport:{width:1440,height:1000}});
 try{await p.goto(url,{waitUntil:'networkidle',timeout:60000});}catch(e){await p.goto(url,{waitUntil:'domcontentloaded',timeout:60000});}
 await settle(p);
 await p.screenshot({path:`matching/rev-${name}.png`,fullPage:true});
 console.log(name,'ok');
 await p.close();
}
}finally{await b.close();}
