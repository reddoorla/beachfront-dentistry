import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";
const b = await chromium.launch();
const settle = async (p) => { await p.evaluate(async () => {
  for (let y=0;y<document.body.scrollHeight;y+=300){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,50));}
  window.scrollTo(0,0); await new Promise(r=>setTimeout(r,500)); }); };
try {
  for (const vw of [1440, 834, 390]) {
    const p = await b.newPage({ viewport: { width: vw, height: 900 } });
    await p.goto("http://localhost:5173/dev/match/home", { waitUntil: "networkidle", timeout: 60000 });
    await settle(p);
    const r = await p.evaluate(() => {
      const eyebrow=[...document.querySelectorAll("p")].find(e=>/^Meet Your Team$/i.test(e.textContent.trim()));
      const track=eyebrow?.closest("section")?.querySelector('[role="group"][aria-roledescription="slide"]')?.parentElement;
      const cell=eyebrow?.closest("section")?.querySelector('[aria-roledescription="slide"]');
      const img=cell?.querySelector("img");
      const bx=(el)=>{if(!el)return "MISSING";const b=el.getBoundingClientRect();const cs=getComputedStyle(el);
        return `${Math.round(b.width)}x${Math.round(b.height)} x=${Math.round(b.x)} gap=${cs.gap} pl=${cs.paddingLeft} mb=${cs.marginBottom}`;};
      return `eyebrow ${bx(eyebrow)} fs=${eyebrow?getComputedStyle(eyebrow).fontSize:"-"}\n  track ${bx(track)}\n  cell ${bx(cell)}\n  img ${bx(img)}`;
    });
    console.log(`== ours @${vw}\n  ${r}`);
    await p.close();
  }
} finally { await b.close(); }
