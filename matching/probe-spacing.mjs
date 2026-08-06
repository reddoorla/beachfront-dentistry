import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";
const O = "https://www.beachfrontdentistry.com";
const L = "http://localhost:5173";
const b = await chromium.launch();
try {
  for (const [tag, base, path] of [
    ["LIVE-svc", O, "/services/dental-exams"],
    ["CAND-svc", L, "/services/dental-exams"],
    ["LIVE-qa", O, "/questions/regular-dental-cleanings-support-your-whole-body-health"],
    ["CAND-qa", L, "/questions/regular-dental-cleanings-support-your-whole-body-health"],
  ]) {
    const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
    await p.goto(base + path, { waitUntil: "networkidle", timeout: 60000 });
    const info = await p.evaluate(() => {
      const Y = (el) => (el ? Math.round(el.getBoundingClientRect().top + scrollY) : null);
      const B = (el) => (el ? Math.round(el.getBoundingClientRect().bottom + scrollY) : null);
      // title (big cyan), lede (cyan large p), first body heading OR first body para, last body para, CTA heading
      const title = [...document.querySelectorAll("h1,h2,h3")].find((e) => parseFloat(getComputedStyle(e).fontSize) > 60 && Y(e) > 300);
      const cyanP = [...document.querySelectorAll("p")].find((e) => { const c = getComputedStyle(e); return parseFloat(c.fontSize) >= 28 && /129|18, ?158/.test(c.color) && Y(e) > 400; });
      const bodyParas = [...document.querySelectorAll("p")].filter((e) => { const c = getComputedStyle(e); return Math.round(parseFloat(c.fontSize)) === 20 && !/129|18, ?158/.test(c.color) && Y(e) > 400; });
      const ctaH = [...document.querySelectorAll("h1,h2,h3")].find((e) => /Ready for great/.test(e.textContent || ""));
      return {
        titleTop: Y(title), titleBottom: B(title),
        ledeTop: Y(cyanP), ledeBottom: B(cyanP),
        bodyFirstTop: Y(bodyParas[0]), bodyLastBottom: B(bodyParas[bodyParas.length - 1]),
        ctaHeadingTop: Y(ctaH),
        gap_lede_to_body: cyanP && bodyParas[0] ? Y(bodyParas[0]) - B(cyanP) : null,
        gap_body_to_cta: bodyParas.length && ctaH ? Y(ctaH) - B(bodyParas[bodyParas.length - 1]) : null,
      };
    });
    console.log(tag, JSON.stringify(info));
    await p.close();
  }
} finally {
  await b.close();
}
