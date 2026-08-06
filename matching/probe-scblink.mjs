import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";
const b = await chromium.launch();
try {
  for (const vw of [1440, 834, 390]) {
    const p = await b.newPage({ viewport: { width: vw, height: 900 } });
    await p.goto("https://www.beachfrontdentistry.com/services", { waitUntil: "networkidle", timeout: 60000 });
    await p.evaluate(async()=>{for(let y=0;y<document.body.scrollHeight;y+=250){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,80));}window.scrollTo(0,0);for(let i=0;i<60;i++){await new Promise(r=>setTimeout(r,100));if(document.getAnimations().every(a=>a.playState!=="running"))break;}await new Promise(r=>setTimeout(r,400));});
    const r = await p.evaluate(() => {
      const a=document.querySelector(".service-block a[href*='/services/']");
      const rows=[];
      const walk=(el,d)=>{const cs=getComputedStyle(el);const b=el.getBoundingClientRect();
        rows.push(`${"  ".repeat(d)}${el.tagName.toLowerCase()}.${String(el.className).split(" ").slice(0,2).join(".")} ${Math.round(b.width)}x${Math.round(b.height)} x=${Math.round(b.x)} fs=${cs.fontSize}/${cs.lineHeight} w=${cs.fontWeight} ls=${cs.letterSpacing} tt=${cs.textTransform} c=${cs.color} "${(el.textContent||"").trim().slice(0,24)}"`);
        for(const c of el.children) walk(c,d+1);};
      walk(a,0);
      const col=a.parentElement;
      rows.push(`PARENT ${col.tagName.toLowerCase()}.${String(col.className)} pad=${getComputedStyle(col).padding} x=${Math.round(col.getBoundingClientRect().x)} w=${Math.round(col.getBoundingClientRect().width)}`);
      return rows.join("\n  ");
    });
    console.log(`== live @${vw}\n  ${r}`);
    await p.close();
  }
} finally { await b.close(); }
