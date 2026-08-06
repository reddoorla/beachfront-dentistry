import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";

const LIVE = "https://www.beachfrontdentistry.com/";
const CAND = "http://localhost:5173/dev/match/home";
const W = Number(process.argv[2] || 834);

async function settle(page) {
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 200) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 50));
    }
    window.scrollTo(0, document.body.scrollHeight);
    await new Promise((r) => setTimeout(r, 1200));
  });
}

const fn = () => {
  const abs = (el) => {
    const r = el.getBoundingClientRect();
    return `${Math.round(r.x + scrollX)},${Math.round(r.y + scrollY)} ${Math.round(r.width)}x${Math.round(r.height)}`;
  };
  const out = {};
  const wts = document.querySelector('[class*="what-they-say-arrow"], img[src*="what-they-say-arrow"]');
  out["what-they-say-arrow"] = wts ? abs(wts) + " " + getComputedStyle(wts).width : "none";
  const wtsm = document.querySelector('[class*="what-they-say-big"], img[src*="what_they_say_bw"]');
  out["what-they-say-mark"] = wtsm ? abs(wtsm) + " disp=" + getComputedStyle(wtsm).display : "none";
  // pyf band
  const h = [...document.querySelectorAll("h1,h2")].find((e) => /Finally have a dentist/i.test(e.textContent || ""));
  out["pyf-heading"] = h ? abs(h) : "none";
  if (h) {
    let p = h.parentElement,
      c = [];
    for (let i = 0; i < 3 && p; i++) {
      c.push(`${p.tagName}.${(p.className || "").toString().slice(0, 40)} ${abs(p)} mb=${getComputedStyle(p).marginBottom}`);
      p = p.parentElement;
    }
    out["pyf-heading-chain"] = c.join("\n     ");
  }
  const c1 = document.querySelector('img[src*="DSC_7650"]');
  const c3 = document.querySelector('img[src*="IMG_2885"]');
  out["pyf-card1"] = c1 ? abs(c1) : "none";
  out["pyf-card3"] = c3 ? abs(c3) : "none";
  const pyf = document.querySelector(".home-pyf-section") || (c1 && c1.closest("section"));
  out["pyf-section"] = pyf ? abs(pyf) + " pad=" + getComputedStyle(pyf).padding + " mar=" + getComputedStyle(pyf).margin : "none";
  // services container
  const svcLabel = [...document.querySelectorAll("h6,p")].find((e) => /^services$/i.test((e.textContent || "").trim()));
  if (svcLabel) {
    let p = svcLabel,
      c = [];
    for (let i = 0; i < 4 && p; i++) {
      const s = getComputedStyle(p);
      c.push(`${p.tagName}.${(p.className || "").toString().slice(0, 40)} ${abs(p)} pad=${s.paddingTop}/${s.paddingRight}/${s.paddingBottom}/${s.paddingLeft} mw=${s.maxWidth}`);
      p = p.parentElement;
    }
    out["svc-label-chain"] = c.join("\n     ");
  }
  const intro = [...document.querySelectorAll("p")].find((e) => /we offer|comprehensive|full range|dentistry for/i.test((e.textContent || "").slice(0, 90)));
  out["svc-intro"] = intro ? abs(intro) + ' "' + intro.textContent.trim().slice(0, 45) + '"' : "none";
  return out;
};

const browser = await chromium.launch();
try {
  for (const [name, url] of [
    ["LIVE", LIVE],
    ["CAND", CAND],
  ]) {
    const ctx = await browser.newContext({ viewport: { width: W, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(url, { waitUntil: "networkidle", timeout: 90000 });
    await page.waitForTimeout(500);
    await settle(page);
    const r = await page.evaluate(fn);
    console.log(`\n######## ${name} @${W}`);
    for (const [k, v] of Object.entries(r)) console.log(`${k}\t${v}`);
    await ctx.close();
  }
} finally {
  await browser.close();
}
