import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";
const URL = "https://www.beachfrontdentistry.com/contact";
async function settle(page) {
  await page.evaluate(async () => {
    await new Promise((r) => {
      let y = 0;
      const s = () => {
        scrollTo(0, y);
        y += 250;
        if (y < document.body.scrollHeight) setTimeout(s, 40);
        else {
          scrollTo(0, 0);
          setTimeout(r, 300);
        }
      };
      s();
    });
  });
  await page.waitForTimeout(500);
}
const b = await chromium.launch();
try {
  const out = {};
  for (const width of [1440, 390]) {
    const p = await b.newPage({ viewport: { width, height: 900 } });
    await p.goto(URL, { waitUntil: "networkidle", timeout: 60000 });
    await settle(p);
    out[width] = await p.evaluate(() => {
      const T = (el) => {
        if (!el) return null;
        const c = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        return {
          tag: el.tagName.toLowerCase(),
          cls: (el.className || "").toString().slice(0, 44),
          w: Math.round(r.width),
          h: Math.round(r.height),
          x: Math.round(r.x),
          y: Math.round(r.y + scrollY),
          fs: c.fontSize,
          fw: c.fontWeight,
          color: c.color,
          ta: c.textAlign,
          ff: c.fontFamily.split(",")[0],
          txt: (el.innerText || "").trim().slice(0, 44),
        };
      };
      const main = document.querySelector("main") || document.body;
      const sections = [...main.children].map((el) => ({
        tag: el.tagName.toLowerCase(),
        cls: (el.className || "").toString().slice(0, 44),
        h: Math.round(el.getBoundingClientRect().height),
        txt: (el.innerText || "").trim().slice(0, 70).replace(/\n/g, " | "),
      }));
      const hero = document.querySelector('.hero,[class*="hero"]');
      const heroImg = hero ? hero.querySelector("img") : null;
      const heroH = hero
        ? hero.querySelector('h1,h2,[class*="heading"]')
        : null;
      const info = document.querySelector('.info-section,[class*="info"]');
      let infoChildren = null;
      if (info) {
        infoChildren = [
          ...info.querySelectorAll("h1,h2,h3,h4,h5,h6,p,a,button"),
        ]
          .slice(0, 30)
          .map((el) => ({
            tag: el.tagName.toLowerCase(),
            cls: (el.className || "").toString().slice(0, 34),
            fw: getComputedStyle(el).fontWeight,
            fs: getComputedStyle(el).fontSize,
            color: getComputedStyle(el).color,
            x: Math.round(el.getBoundingClientRect().x),
            y: Math.round(el.getBoundingClientRect().y + scrollY),
            txt: (el.innerText || "").trim().slice(0, 44),
          }));
      }
      const map = document.querySelector('.gm-style,[class*="map"],iframe');
      const emailPresent = /@/.test(main.innerText || "");
      return {
        sections,
        hero: T(hero),
        heroImgSrc: heroImg ? heroImg.getAttribute("src") : null,
        heroHeading: T(heroH),
        infoBox: T(info),
        infoFullText: info ? info.innerText.trim() : null,
        infoChildren,
        map: T(map),
        emailPresent,
      };
    });
    await p.close();
  }
  console.log(JSON.stringify(out, null, 1));
} finally {
  await b.close();
}
