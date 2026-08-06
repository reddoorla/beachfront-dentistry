import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";

const LIVE = "https://www.beachfrontdentistry.com/your-first-visit";
const CAND = "http://localhost:5173/dev/match/your-first-visit";

const SEL = {
  live: {
    "hero.section": ".hero.group-photo",
    "hero.h1": ".hero.group-photo h1",
    "toc.section": ".fv-toc-section",
    "toc.intro": ".fv-toc-section p",
    "toc.item1": ".fv-toc-section .visit-list-item",
    "toc.item2": ".fv-toc-section .visit-list-item:nth-of-type(2)",
    "toc.num1": ".fv-toc-section .visit-list-number",
    "toc.h3": ".fv-toc-section .visit-list-item h3",
    "toc.btnbook": ".fv-toc-section a.button",
    "toc.btnform": ".fv-toc-section a.button:nth-of-type(2)",
    "tour.section": ".fv-virtual-tour-section",
    "tour.h1": ".fv-virtual-tour-section h1",
    "tour.cw": ".fv-virtual-tour-section .content-width",
    "tour.nav": ".fv-virtual-tour-section .w-slider-nav",
    "tour.dot1": ".fv-virtual-tour-section .w-slider-dot",
    "tour.sliderbox": ".fv-virtual-tour-section .w-slider",
    "tour.mask": ".fv-virtual-tour-section .w-slider-mask",
    "tour.slide1img": ".fv-virtual-tour-section .w-slide img",
    "tour.hours": ".fv-virtual-tour-section .footer-contact-block",
    "tour.hoursHdr": ".fv-virtual-tour-section .footer-contact-header",
    "tour.hoursRow": ".fv-virtual-tour-section .footer-contact-block .text-body",
    "tour.hflex": ".fv-virtual-tour-section .w-layout-hflex",
    "meet.section": ".fv-meet-our-team-section",
    "meet.h2": ".fv-meet-our-team-section h2",
    "meet.holder": ".team-slider-holder",
    "meet.card1": ".team-list-item",
    "meet.head1": ".team-grid-headshot",
    "meet.name1": ".team-list-item h5",
    "meet.role1": ".team-list-item h6",
    "meet.teaser1": ".team-list-item p",
    "meet.arrowL": ".team-slider-arrow.left",
    "meet.arrowR": ".team-slider-arrow.right",
    "exam.section": ".fv-exam-section",
    "exam.h3": ".fv-exam-section h3",
    "exam.introp": ".fv-exam-section ._w-30pc p",
    "exam.leftcol": ".fv-exam-section ._w-30pc",
    "exam.img": ".fv-exam-section img._w-60pc",
    "exam.regbox": ".registration-forms-box",
    "exam.regh5": ".registration-forms-box h5",
    "exam.stepcont": ".first-exam-step-container",
    "exam.step1": ".exam-step",
    "exam.stepcontent": ".exam-content-holder",
    "exam.stepp": ".exam-content-holder p",
    "rev.section": ".fv-review-section",
    "rev.h": ".fv-review-section h1",
    "rev.holder": ".review-slider-holder",
    "rev.viewport": ".review-slider-holder-viewport",
    "rev.card": ".big-review",
    "cta.section": ".fiji-section",
    "cta.h2": ".fiji-section h2",
  },
  cand: {
    "hero.section": "[data-slice-type='hero'] section, section[data-slice-type='hero']",
    "hero.h1": "main h1",
    "toc.section": ".fv-toc-section",
    "toc.intro": ".fv-toc-section p",
    "toc.item1": ".fv-toc-section .visit-list-item",
    "toc.item2": ".fv-toc-section .visit-list-item:nth-of-type(2)",
    "toc.num1": ".fv-toc-section .visit-list-item span",
    "toc.h3": ".fv-toc-section .visit-list-item h3",
    "toc.btnbook": ".fv-toc-section a",
    "tour.section": "#office-tour",
    "tour.h1": "#office-tour h1",
    "tour.dots": "#office-tour [class*='justify-center']",
    "tour.hours": "#office-tour .footer-contact-block",
    "meet.section": "#meet-our-team",
    "meet.h2": "#meet-our-team h2",
    "exam.section": "#first-exam",
    "exam.h3": "#first-exam h3",
    "cta.h2": "main section:last-of-type h2",
  },
};

function styleOf(el) {
  const cs = getComputedStyle(el);
  const r = el.getBoundingClientRect();
  return {
    tag: el.tagName,
    cls: (el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className || "").toString().slice(0, 180),
    x: Math.round(r.x),
    y: Math.round(r.y + window.scrollY),
    w: Math.round(r.width * 10) / 10,
    h: Math.round(r.height * 10) / 10,
    ff: cs.fontFamily.split(",")[0].replace(/['"]/g, ""),
    fw: cs.fontWeight,
    fs: cs.fontSize,
    lh: cs.lineHeight,
    ls: cs.letterSpacing,
    col: cs.color,
    bg: cs.backgroundColor,
    ta: cs.textAlign,
    disp: cs.display,
    pos: cs.position,
    pad: cs.padding,
    mar: cs.margin,
    rad: cs.borderRadius,
    fit: cs.objectFit,
    ovf: cs.overflow,
    txt: (el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 70),
  };
}

async function settle(page) {
  await page.evaluate(async () => {
    const step = 200;
    const H = document.documentElement.scrollHeight;
    for (let y = 0; y < H; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 50));
    }
    window.scrollTo(0, H);
    await new Promise((r) => setTimeout(r, 1000));
  });
  await page.waitForTimeout(400);
}

async function run(browser, url, side, width) {
  const ctx = await browser.newContext({
    viewport: { width, height: 900 },
    deviceScaleFactor: 1,
    reducedMotion: "reduce",
  });
  const page = await ctx.newPage();
  try {
    await page.goto(url, { waitUntil: "load", timeout: 90000 });
    await page.waitForTimeout(2200);
    await settle(page);
    const out = await page.evaluate(
      ({ sel, styleSrc }) => {
        const styleOf = eval("(" + styleSrc + ")");
        const res = {};
        for (const [k, s] of Object.entries(sel)) {
          try {
            const nodes = document.querySelectorAll(s);
            res[k] = {
              n: nodes.length,
              v: nodes[0] ? styleOf(nodes[0]) : null,
            };
          } catch (e) {
            res[k] = { err: String(e) };
          }
        }
        res.__page = {
          scrollHeight: document.documentElement.scrollHeight,
          bodyClientWidth: document.body.clientWidth,
          rootFont: getComputedStyle(document.documentElement).fontSize,
        };
        res.__readReviews = [...document.querySelectorAll("*")]
          .filter(
            (e) =>
              e.children.length === 0 &&
              /read reviews/i.test((e.textContent || "").trim()),
          )
          .map((e) => {
            const r = e.getBoundingClientRect();
            return {
              y: Math.round(r.y + window.scrollY),
              x: Math.round(r.x),
              w: Math.round(r.width),
              h: Math.round(r.height),
            };
          });
        return res;
      },
      { sel: SEL[side], styleSrc: styleOf.toString() },
    );
    return out;
  } finally {
    await ctx.close();
  }
}

const browser = await chromium.launch();
const result = {};
try {
  for (const width of [1440, 834, 390]) {
    result[width] = {
      live: await run(browser, LIVE, "live", width),
      cand: await run(browser, CAND, "cand", width),
    };
    console.error("done", width);
  }
} finally {
  await browser.close();
}
console.log(JSON.stringify(result, null, 1));
