import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";
const URL = "https://www.beachfrontdentistry.com/your-first-visit";
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
          cls: (el.className || "").toString().slice(0, 50),
          w: Math.round(r.width),
          h: Math.round(r.height),
          x: Math.round(r.x),
          y: Math.round(r.y + scrollY),
          fs: c.fontSize,
          fw: c.fontWeight,
          lh: c.lineHeight,
          color: c.color,
          ta: c.textAlign,
          tt: c.textTransform,
          ff: c.fontFamily.split(",")[0],
          maxW: c.maxWidth,
          pos: c.position,
          txt: (el.innerText || "").trim().slice(0, 50),
        };
      };
      const main = document.querySelector("main") || document.body;
      const sections = [...main.children].map((el) => ({
        tag: el.tagName.toLowerCase(),
        cls: (el.className || "").toString().slice(0, 50),
        h: Math.round(el.getBoundingClientRect().height),
        txt: (el.innerText || "").trim().slice(0, 70).replace(/\n/g, " | "),
      }));
      // hero
      const hero = document.querySelector('.hero, [class*="hero"]');
      const heroH = hero && hero.querySelector('h1,h2,[class*="heading"]');
      // TOC section
      const toc = [...document.querySelectorAll("section,div")].find((s) =>
        /take a virtual tour/i.test((s.innerText || "").slice(0, 120)),
      );
      let tocCards = null;
      if (toc) {
        const cards = [
          ...toc.querySelectorAll(
            '[class*="toc"],[class*="card"],[class*="col"]',
          ),
        ].filter((c) =>
          /tour|team|exam|book|registration/i.test(c.innerText || ""),
        );
        tocCards = {
          sec: T(toc.closest("section") || toc),
          count: cards.length,
          items: cards.slice(0, 6).map((c) => ({
            txt: (c.innerText || "").trim().slice(0, 60).replace(/\n/g, " | "),
            tag: c.tagName.toLowerCase(),
            cls: (c.className || "").toString().slice(0, 40),
          })),
        };
      }
      // office tour slider
      const slider = [
        ...document.querySelectorAll('[class*="slider"],[class*="w-slider"]'),
      ].find(
        (s) =>
          /office tour/i.test(
            (s.closest("section")?.innerText || "").slice(0, 60),
          ) || true,
      );
      let sliderInfo = null;
      const otH = [...document.querySelectorAll("h1,h2,h3")].find((h) =>
        /^office tour/i.test(h.innerText || ""),
      );
      if (otH) {
        const sec = otH.closest("section") || otH.parentElement;
        const sl = sec.querySelector('[class*="slider"],[class*="w-slider"]');
        const slides = sec.querySelectorAll(
          '[class*="slide"]:not([class*="slider"]),[class*="w-slide"]',
        );
        const dots = sec.querySelectorAll(
          '[class*="dot"],[class*="nav"] > div',
        );
        const arrows = sec.querySelectorAll('[class*="arrow"]');
        sliderInfo = {
          otHeading: T(otH),
          sec: T(sec),
          slider: T(sl),
          slideCount: slides.length,
          slide0: T(slides[0]),
          dotCount: dots.length,
          arrowCount: arrows.length,
        };
      }
      // first exam
      const feH = [...document.querySelectorAll("h1,h2,h3")].find((h) =>
        /^first exam/i.test(h.innerText || ""),
      );
      let firstExam = null;
      if (feH) {
        const sec = feH.closest("section") || feH.parentElement;
        const paras = [...sec.querySelectorAll("p,h1,h2,h3,h4,strong,li")];
        firstExam = {
          heading: T(feH),
          sec: T(sec),
          blocks: paras
            .map((el) => ({
              tag: el.tagName.toLowerCase(),
              fw: getComputedStyle(el).fontWeight,
              txt: (el.innerText || "").trim(),
            }))
            .filter((x) => x.txt),
        };
      }
      // meet team heading
      const mt = [...document.querySelectorAll("h1,h2,h3")].find((h) =>
        /meet (our|your) team/i.test(h.innerText || ""),
      );
      // review
      const rv = [...document.querySelectorAll("h1,h2,h3")].find((h) =>
        /serving the south bay/i.test(h.innerText || ""),
      );
      return {
        sections,
        hero: T(hero),
        heroHeading: T(heroH),
        tocCards,
        sliderInfo,
        firstExam,
        meetTeam: mt ? T(mt) : null,
        review: rv ? T(rv) : null,
      };
    });
    await p.close();
  }
  console.log(JSON.stringify(out, null, 1));
} finally {
  await b.close();
}
