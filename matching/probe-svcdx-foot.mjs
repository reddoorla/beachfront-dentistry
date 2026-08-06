import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";
const LIVE = "https://www.beachfrontdentistry.com/services";
const CAND = "http://localhost:5173/dev/match/services";
const grab = (isLive) => {
  const rr = (el) => { const r = el.getBoundingClientRect(); return `{x:${Math.round(r.left)},y:${Math.round(r.top+window.scrollY)},w:${Math.round(r.width)},h:${Math.round(r.height*10)/10}}`; };
  const root = isLive ? document.querySelector(".footer-info-section") : document.querySelector("footer");
  const o = [`ROOT ${rr(root)} pad=${getComputedStyle(root).paddingTop}/${getComputedStyle(root).paddingBottom}`];
  const walk = (el, d) => { for (const c of el.children) { const r = c.getBoundingClientRect(); if (r.height < 3) continue; o.push(`${"  ".repeat(d)}${c.tagName.toLowerCase()}.${(typeof c.className==="string"?c.className:"").slice(0,40)} ${rr(c)} :: ${(c.innerText||"").replace(/\s+/g," ").slice(0,40)}`); if (d < 2) walk(c, d+1); } };
  walk(root, 1);
  return o.join("\n");
};
const run = async () => {
  const b = await chromium.launch();
  try {
    for (const vp of [1440, 834]) for (const [n,u,l] of [["LIVE",LIVE,true],["CAND",CAND,false]]) {
      const ctx = await b.newContext({ viewport: { width: vp, height: 900 } });
      const p = await ctx.newPage();
      await p.goto(u, { waitUntil: "networkidle", timeout: 90000 }).catch(()=>{});
      await p.evaluate(async()=>{for(let y=0;y<document.body.scrollHeight;y+=200){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,40));}await new Promise(r=>setTimeout(r,1000));});
      console.log(`\n### ${n} @${vp}\n` + await p.evaluate(grab, l));
      await ctx.close();
    }
  } finally { await b.close(); }
};
run();
