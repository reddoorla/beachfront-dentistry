import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";
const O = "https://www.beachfrontdentistry.com";
const L = "http://localhost:5173";
const path = "/questions/regular-dental-cleanings-support-your-whole-body-health";
const b = await chromium.launch();
try {
  for (const [tag, base] of [["LIVE", O], ["CAND", L]]) {
    const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
    await p.goto(base + path, { waitUntil: "networkidle", timeout: 60000 });
    const info = await p.evaluate(() => {
      const bodyish = [...document.querySelectorAll("div,section")].filter((e) =>
        /At Beachfront Dentistry/.test(e.textContent || ""),
      );
      // narrowest wrapper that contains the body text
      const wrap = bodyish.sort((a, z) => (a.textContent || "").length - (z.textContent || "").length)[0];
      const paras = wrap ? [...wrap.querySelectorAll("p")] : [];
      const heads = wrap ? [...wrap.querySelectorAll("h1,h2,h3,h4,h5,h6")].map((h) => `${h.tagName}:${getComputedStyle(h).fontSize} "${h.textContent.trim().slice(0, 30)}"`) : [];
      const imgs = wrap ? wrap.querySelectorAll("img,iframe,figure").length : 0;
      return {
        paraCount: paras.length,
        totalTextLen: wrap ? (wrap.textContent || "").replace(/\s+/g, " ").length : 0,
        headings: heads.slice(0, 8),
        imgsEmbeds: imgs,
        firstPara: paras[0] ? `${getComputedStyle(paras[0]).fontSize}/${getComputedStyle(paras[0]).lineHeight} w=${Math.round(paras[0].getBoundingClientRect().width)}` : null,
      };
    });
    console.log(tag, JSON.stringify(info, null, 1));
    await p.close();
  }
} finally {
  await b.close();
}
