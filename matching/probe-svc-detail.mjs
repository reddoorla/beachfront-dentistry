// Where do live /services service-card links point, and does a service DETAIL
// page exist? If so, capture its hero + body structure.
import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";
const ORIGIN = "https://www.beachfrontdentistry.com";
const b = await chromium.launch();
try {
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto(ORIGIN + "/services", { waitUntil: "networkidle", timeout: 60000 });
  const links = await p.evaluate(() => {
    const blocks = document.querySelector(
      '.service-blocks-sections, [class*="service-block"]',
    );
    const scope = blocks || document;
    return [...new Set(
      [...scope.querySelectorAll("a[href]")].map((a) => a.getAttribute("href")),
    )]
      .filter((h) => h && h.startsWith("/") && !/^\/(services|our-team|your-first-visit|ask-the-doctor|contact|#|$)/.test(h.replace(/\/$/, "") || "/"))
      .slice(0, 20);
  });
  console.log("service-block link hrefs:", JSON.stringify(links, null, 1));
  // try a few common detail URL shapes
  const candidates = [
    ...links,
    "/services/dental-exams",
    "/service/dental-exams",
    "/services/cosmetic-dentistry",
  ];
  for (const href of candidates.slice(0, 6)) {
    const url = href.startsWith("http") ? href : ORIGIN + href;
    try {
      const resp = await p.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
      const status = resp ? resp.status() : "?";
      if (status === 200) {
        const spec = await p.evaluate(() => {
          const hero = document.querySelector('.hero, [class*="hero"]');
          let heroBg = "";
          if (hero)
            for (const d of [hero, ...hero.querySelectorAll("*")]) {
              const im = d.tagName === "IMG" ? d.currentSrc || d.src : "";
              const bg = getComputedStyle(d).backgroundImage;
              if (im) { heroBg = "img:" + im; break; }
              if (bg && bg.includes("url")) { heroBg = bg; break; }
            }
          const secs = [...document.querySelectorAll("section, .section")]
            .map((s) => ({ cls: s.className.slice(0, 50), h: Math.round(s.getBoundingClientRect().height), txt: (s.textContent || "").trim().slice(0, 50) }))
            .filter((s) => s.h > 30)
            .slice(0, 7);
          const h1 = document.querySelector("h1");
          return { url: location.href, heroBg: heroBg.slice(0, 90), h1: h1 && h1.textContent.trim(), secs };
        });
        console.log("DETAIL 200:", JSON.stringify(spec, null, 1));
        break;
      } else {
        console.log(`  ${url} -> ${status}`);
      }
    } catch (e) {
      console.log(`  ${url} -> ERR ${e.message.slice(0, 40)}`);
    }
  }
} finally {
  await b.close();
}
