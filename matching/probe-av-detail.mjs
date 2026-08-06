import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";

const LIVE = "https://www.beachfrontdentistry.com/";
const CAND = "http://localhost:5173/dev/match/home";
const W = Number(process.argv[2] || 1440);

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
  const box = (el) => {
    if (!el) return "MISSING";
    const s = getComputedStyle(el);
    return `${abs(el)} pad=${s.paddingTop}/${s.paddingRight}/${s.paddingBottom}/${s.paddingLeft} mar=${s.marginTop}/${s.marginRight}/${s.marginBottom}/${s.marginLeft} mw=${s.maxWidth} ov=${s.overflow} disp=${s.display}`;
  };
  const byText = (sel, txt) =>
    [...document.querySelectorAll(sel)].find((e) => (e.textContent || "").trim().replace(/\s+/g, " ").toLowerCase().includes(txt.toLowerCase()));
  const out = {};
  const put = (k, el) => (out[k] = box(el));

  // ---- LIVE selectors ----
  put("L.review-viewport", document.querySelector(".review-slider-holder-viewport"));
  put("L.big-review-1", document.querySelector(".big-review"));
  put("L.arrow-left", document.querySelector(".big-review-arrow-left"));
  put("L.arrow-right", document.querySelector(".big-review-arrow-right"));
  put("L.ssb-section", document.querySelector(".home-ssb-section"));
  put("L.ssb-content", document.querySelector(".home-ssb-section .content-width"));
  put("L.services-section", document.querySelector(".home-services-section"));
  put("L.services-content", document.querySelector(".home-services-section .content-width"));
  put("L.atd-section", document.querySelector(".home-ask-the-doctor-section"));
  put("L.qa-block1", document.querySelector(".qa-block"));
  put("L.qa-circle1", document.querySelector(".qa-circle"));
  put("L.hm-section", document.querySelector(".home-healthy-mouth-section"));
  put("L.hm-content", document.querySelector(".home-healthy-mouth-section .content-width"));
  put("L.beach-circle", document.querySelector(".beach-circle"));
  put("L.myt-section", document.querySelector(".home-meet-your-team-section"));
  put("L.myt-content", document.querySelector(".home-meet-your-team-section .content-width"));
  put("L.hero", document.querySelector(".hero.home"));
  put("L.hero-content", document.querySelector(".hero.home .content-width"));
  put("L.hero-h1", document.querySelector(".home-hero-heading"));
  put("L.step1", document.querySelector(".home-step"));
  put("L.head1", document.querySelector(".heads"));
  const foot = document.querySelector(".footer");
  if (foot) {
    const kids = [...foot.querySelectorAll("*")].filter((e) => {
      const t = (e.textContent || "").trim();
      return /rights reserved|privacy|sitemap|©|20\d\d beachfront/i.test(t) && e.children.length === 0;
    });
    out["L.footer-legal"] = kids.map((e) => `${abs(e)} "${e.textContent.trim().slice(0, 26)}"`).join(" | ");
    out["L.footer-legal-parent"] = kids[0] ? box(kids[0].parentElement) : "none";
  }
  // ---- generic (both sides) ----
  const firstQaImg = document.querySelector('img[src*="couple_running_in_beach"]');
  if (firstQaImg) {
    let e = firstQaImg,
      chain = [];
    for (let i = 0; i < 4 && e; i++) {
      chain.push(`${e.tagName}.${(e.className || "").toString().slice(0, 30)} ${abs(e)}`);
      e = e.parentElement;
    }
    out["G.qacard-chain"] = chain.join("\n     ");
  }
  const beach = document.querySelector('img[src*="walking_on_the_beach"]');
  out["G.beach"] = beach ? abs(beach) : "none";
  const bookStep = byText("h3", "Book an Appointment");
  if (bookStep) {
    let e = bookStep,
      chain = [];
    for (let i = 0; i < 4 && e; i++) {
      chain.push(`${e.tagName}.${(e.className || "").toString().slice(0, 34)} ${abs(e)}`);
      e = e.parentElement;
    }
    out["G.step-chain"] = chain.join("\n     ");
  }
  const legal = [...document.querySelectorAll("*")].filter(
    (e) => e.children.length === 0 && /^(All Rights Reserved|Privacy Policy|Sitemap)$/i.test((e.textContent || "").trim())
  );
  out["G.legal"] = legal.map((e) => `${abs(e)} "${e.textContent.trim().slice(0, 22)}"`).join(" | ");
  const badge = byText("h6,span,div", "01");
  const circ = document.querySelector(".qa-circle") || [...document.querySelectorAll("span,h6")].find((e) => (e.textContent || "").trim() === "01" && e.children.length === 0);
  out["G.qacircle01"] = circ ? box(circ) : "none";
  // ---- CAND: structural queries ----
  // review slider clipping box: ancestor with overflow hidden above the first review card
  const q = byText("blockquote, p, div", "Doctor Quan and staff");
  out["C.quote-el"] = q ? abs(q) : "none";
  // find overflow:hidden ancestors of the reviewer photo
  const rp = document.querySelector('img[src*="paul_redondo"]');
  if (rp) {
    let e = rp,
      chain = [];
    while (e && e !== document.body) {
      const s = getComputedStyle(e);
      chain.push(`${e.tagName}.${(e.className || "").toString().slice(0, 34)} ${abs(e)} ov=${s.overflowX}/${s.overflowY}`);
      e = e.parentElement;
    }
    out["C.reviewphoto-chain"] = chain.join("\n     ");
  }
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
    for (const [k, v] of Object.entries(r)) if (v && v !== "MISSING") console.log(`${k}\t${v}`);
    await ctx.close();
  }
} finally {
  await browser.close();
}
