import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";
const O = "https://www.beachfrontdentistry.com";
const b = await chromium.launch();
try {
  // (1) detail .hero height ladder + does the CTA carry the FIJI beach?
  for (const vw of [390, 768, 1440]) {
    const p = await b.newPage({ viewport: { width: vw, height: 900 } });
    await p.goto(O + "/services/dental-exams", { waitUntil: "networkidle", timeout: 60000 });
    const info = await p.evaluate(() => {
      const hero = document.querySelector(".hero");
      const heroH = hero ? Math.round(hero.getBoundingClientRect().height) : null;
      const title = [...document.querySelectorAll("h1,h2,h3")].find((e) => parseFloat(getComputedStyle(e).fontSize) > 60 && e.getBoundingClientRect().top + scrollY > 300);
      const titleTop = title ? Math.round(title.getBoundingClientRect().top + scrollY) : null;
      const fiji = document.querySelector(".fiji-section, [class*='fiji']");
      const fijiH = fiji ? Math.round(fiji.getBoundingClientRect().height) : null;
      const hasFijiLabel = /FIJI/i.test(document.body.textContent || "");
      const cta = [...document.querySelectorAll("section,div")].find((e) => /Ready for great dental health/.test(e.textContent || "") && e.getBoundingClientRect().height < 1200);
      return { heroH, titleTop, fijiH, hasFijiLabel };
    });
    console.log(`vw${vw}:`, JSON.stringify(info));
    await p.close();
  }
  // (2) mobile team bio: capture live vs cand @390 to see the height bloat
  for (const [tag, url] of [["live", O + "/team-members/dr-robert-quan"], ["cand", "http://localhost:5173/team-members/dr-robert-quan"]]) {
    const p = await b.newPage({ viewport: { width: 390, height: 1600 } });
    await p.goto(url, { waitUntil: "networkidle", timeout: 60000 });
    await p.evaluate(async () => { for (let y = 0; y <= 1400; y += 200) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); } window.scrollTo(0, 0); await new Promise((r) => setTimeout(r, 250)); });
    await p.screenshot({ path: `matching/team390-${tag}.png`, clip: { x: 0, y: 0, width: 390, height: 1600 } });
    await p.close();
    console.log("shot", tag);
  }
} finally {
  await b.close();
}
