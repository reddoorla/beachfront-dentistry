import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";
const REF = "https://www.beachfrontdentistry.com/your-first-visit";
const b = await chromium.launch();
try {
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto(REF, { waitUntil: "networkidle", timeout: 60000 });
  const h = await p.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < h; y += 200) { await p.evaluate((y) => scrollTo(0, y), y); await p.waitForTimeout(50); }
  await p.evaluate(() => scrollTo(0, 0));
  await p.waitForTimeout(400);
  const out = await p.evaluate(() => {
    const g = (el, ps) => el ? Object.fromEntries(ps.map((k) => [k, getComputedStyle(el)[k]])) : null;
    const r = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); return { w: Math.round(b.width), h: Math.round(b.height) }; };
    const q = (s) => document.querySelector(s);

    // TOUR mask height + image
    const mask = q(".fv-virtual-tour-section .w-slider-mask");
    const tourImg = q(".fv-virtual-tour-section .w-slide img");
    // CIRCLE badge (first .circle-time-holder)
    const circ = q(".circle-time-holder");
    const circKids = circ ? [...circ.querySelectorAll("*")].map((e)=>`${e.tagName}.${(e.className||"").toString().split(" ")[0]} bg=${getComputedStyle(e).backgroundColor} r=${getComputedStyle(e).borderRadius} ${Math.round(e.getBoundingClientRect().width)}x${Math.round(e.getBoundingClientRect().height)} fs=${getComputedStyle(e).fontSize} "${e.textContent.replace(/\s+/g," ").trim().slice(0,12)}"`) : [];
    // EXAM step content title/para style
    const stepTitle = q(".exam-content-holder h5, .exam-content-holder h4, .exam-content-holder h3, .exam-content-holder [class*=title]");
    const stepPara = q(".exam-content-holder p");
    // EXAM left column (step 00 + buttons) — find the first exam col
    const examSec = q(".fv-exam-section");
    const examButtons = examSec ? [...examSec.querySelectorAll("a.button")].map((a)=>({t:a.textContent.replace(/\s+/g," ").trim(), ...g(a,["color","borderColor","borderRadius","fontSize","height","backgroundColor"]), w:Math.round(a.getBoundingClientRect().width)})) : [];
    // exam left column intro + step00
    const leftCol = examSec?.querySelector("[class*=col], [class*=w-col], [class*=left]");
    // TOC buttons
    const tocSec = q(".fv-toc-section");
    const tocButtons = tocSec ? [...tocSec.querySelectorAll("a.button")].map((a)=>({t:a.textContent.replace(/\s+/g," ").trim(), y:Math.round(a.getBoundingClientRect().y+scrollY), ...g(a,["color","borderColor","borderRadius","fontSize","height"])})) : [];
    const tocArrow = q(".visit-list-item img");
    return {
      TOUR: { maskH: r(mask), img: { ...r(tourImg), fit: g(tourImg,["objectFit","objectPosition"]) } },
      CIRCLE: { holder: { ...r(circ), ...g(circ,["backgroundColor","borderRadius","gap","padding"]) }, kids: circKids },
      EXAM: { stepTitle: stepTitle ? { tag: stepTitle.tagName, cls: (stepTitle.className||"").toString().slice(0,30), ...g(stepTitle,["fontFamily","fontSize","fontWeight","color"]), t: stepTitle.textContent.slice(0,20) } : null,
              stepPara: g(stepPara,["fontSize","lineHeight","color","fontWeight"]),
              buttons: examButtons },
      TOC: { buttons: tocButtons, arrow: { ...r(tocArrow), src: tocArrow?.src.split("/").pop() } },
    };
  });
  console.log(JSON.stringify(out, null, 2));
} finally { await b.close(); }
