import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";
const b = await chromium.launch();
const settle = async (p) => { await p.evaluate(async () => {
  for (let y=0;y<document.body.scrollHeight;y+=300){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,50));}
  window.scrollTo(0,0); await new Promise(r=>setTimeout(r,500)); }); };
try {
  for (const vw of [1440, 834, 390]) {
    const p = await b.newPage({ viewport: { width: vw, height: 900 } });
    await p.goto("https://www.beachfrontdentistry.com/", { waitUntil: "networkidle", timeout: 60000 });
    await settle(p);
    const r = await p.evaluate(() => {
      const box = (el,label) => { if(!el) return `${label}: MISSING`;
        const b=el.getBoundingClientRect(); const cs=getComputedStyle(el);
        return `${label}: ${Math.round(b.width)}x${Math.round(b.height)} x=${Math.round(b.x)} mr=${cs.marginRight} r=${cs.borderTopLeftRadius} ov=${cs.overflow} fit=${cs.objectFit} pos=${cs.objectPosition}`; };
      const holder=document.querySelector(".heads-slider-holder");
      const slider=document.querySelector(".heads-slider");
      const head=document.querySelector(".heads");
      const img=document.querySelector(".heads img");
      const eyebrow=[...document.querySelectorAll("h6")].find(e=>/MEET YOUR TEAM/i.test(e.textContent));
      return [box(holder,"holder"),box(slider,"slider"),box(head,"heads"),box(img,"img"),
        eyebrow?box(eyebrow,"eyebrow")+" mb="+getComputedStyle(eyebrow).marginBottom+" fs="+getComputedStyle(eyebrow).fontSize+"/"+getComputedStyle(eyebrow).lineHeight+" ls="+getComputedStyle(eyebrow).letterSpacing+" w="+getComputedStyle(eyebrow).fontWeight+" tt="+getComputedStyle(eyebrow).textTransform:"eyebrow MISSING",
        "count="+document.querySelectorAll(".heads").length].join("\n  ");
    });
    console.log(`== live @${vw}\n  ${r}`);
    await p.close();
  }
} finally { await b.close(); }
