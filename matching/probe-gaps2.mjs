import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";
const b = await chromium.launch();
try {
  for (const [tag, base, path, bodyHead] of [
    ["LIVE-svc", "https://www.beachfrontdentistry.com", "/services/dental-exams", "What to expect"],
    ["CAND-svc", "http://localhost:5173", "/services/dental-exams", "What to expect"],
    ["LIVE-qa", "https://www.beachfrontdentistry.com", "/questions/regular-dental-cleanings-support-your-whole-body-health", "It’s More Than"],
    ["CAND-qa", "http://localhost:5173", "/questions/regular-dental-cleanings-support-your-whole-body-health", "It’s More Than"],
  ]) {
    const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
    await p.goto(base + path, { waitUntil: "networkidle", timeout: 60000 });
    const info = await p.evaluate((bodyHead) => {
      const Y = (e) => (e ? Math.round(e.getBoundingClientRect().top + scrollY) : null);
      const B = (e) => (e ? Math.round(e.getBoundingClientRect().bottom + scrollY) : null);
      const cta = [...document.querySelectorAll("h1,h2,h3")].find((e) => /Ready for great/.test(e.textContent || ""));
      const ctaTop = Y(cta);
      // lede = big cyan text-body element (h5/p) in upper page
      const lede = [...document.querySelectorAll("h4,h5,p")].find((e) => { const c = getComputedStyle(e); return parseFloat(c.fontSize) >= 28 && /18, ?158, ?204/.test(c.color) && Y(e) > 400 && Y(e) < ctaTop; });
      // body first heading
      const bh = [...document.querySelectorAll("h2,h3,h4,h5,h6,strong")].find((e) => (e.textContent || "").trim().startsWith(bodyHead));
      // last dark body paragraph ABOVE the cta
      const darks = [...document.querySelectorAll("p")].filter((e) => { const c = getComputedStyle(e); return Math.round(parseFloat(c.fontSize)) === 20 && !/18, ?158, ?204/.test(c.color) && Y(e) < ctaTop - 20 && Y(e) > 400; });
      const lastBody = darks[darks.length - 1];
      return {
        ledeBottom: B(lede),
        bodyHeadTop: Y(bh),
        gap_lede_to_bodyhead: lede && bh ? Y(bh) - B(lede) : null,
        lastBodyBottom: B(lastBody),
        ctaTop,
        gap_body_to_cta: lastBody ? ctaTop - B(lastBody) : null,
      };
    }, bodyHead);
    console.log(tag, JSON.stringify(info));
    await p.close();
  }
} finally {
  await b.close();
}
