import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";
import fs from "node:fs";

const LIVE = "https://www.beachfrontdentistry.com/contact-us";
const CAND = "http://localhost:5173/contact-us";

const VPS = process.argv[2]
  ? process.argv[2].split(",").map(Number)
  : [1440, 1100, 992, 834, 760, 700, 390];

const LIVE_SEL = {
  hero: "section.hero.contact",
  heroTopGrad: ".hero.contact .hero-top-gradient",
  heroBotGrad: ".hero.contact .hero-bot-gradient",
  heroContentWidth: ".hero.contact .content-width",
  heading: "h2.contact-heading",
  heroWaveSvg: ".hero.contact .bot-wave svg",
  info: "section.info-section",
  infoContentWidth: "section.info-section > .content-width",
  btn: "section.info-section a.button",
  blockRow: "section.info-section .su-flex-v-mobile",
  block1: "section.info-section .footer-contact-block:nth-of-type(1)",
  block2: "section.info-section .footer-contact-block:nth-of-type(2)",
  hdr1: "section.info-section .footer-contact-block:nth-of-type(1) .footer-contact-header",
  hdr2: "section.info-section .footer-contact-block:nth-of-type(2) .footer-contact-header",
  info1:
    "section.info-section .footer-contact-block:nth-of-type(1) .footer-contact-info",
  info2:
    "section.info-section .footer-contact-block:nth-of-type(2) .footer-contact-info",
  mapWrap: "section.info-section ._w-40pc",
  mapRow: "section.info-section .w-layout-hflex:not(.su-flex-v-mobile)",
  map: "section.info-section .footer-map",
};

const CAND_SEL = {
  hero: 'section[data-slice-type="hero"]',
  heroTopGrad:
    'section[data-slice-type="hero"] > div[aria-hidden="true"].top-0',
  heroBotGrad:
    'section[data-slice-type="hero"] > div[aria-hidden="true"].bottom-0',
  heroContentWidth: null,
  heading: 'section[data-slice-type="hero"] h2',
  heroWaveSvg: 'section[data-slice-type="hero"] svg',
  info: 'section[data-section="info"]',
  infoContentWidth: 'section[data-section="info"]',
  btn: 'section[data-section="info"] > a[href="#appointment"]',
  blockRow: 'section[data-section="info"] > div.flex',
  block1: 'section[data-section="info"] > div.flex > div:nth-child(1)',
  block2: 'section[data-section="info"] > div.flex > div:nth-child(2)',
  hdr1: 'section[data-section="info"] > div.flex > div:nth-child(1) > h2',
  hdr2: 'section[data-section="info"] > div.flex > div:nth-child(2) > h2',
  info1:
    'section[data-section="info"] > div.flex > div:nth-child(1) a, section[data-section="info"] > div.flex > div:nth-child(1) address p',
  info2: 'section[data-section="info"] > div.flex > div:nth-child(2) > p',
  mapWrap: null,
  mapRow: null,
  map: 'section[data-section="info"] > div:last-of-type',
};

async function settle(page) {
  await page.evaluate(async () => {
    const step = 200;
    const h = document.documentElement.scrollHeight;
    for (let y = 0; y < h; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 50));
    }
    window.scrollTo(0, h);
    await new Promise((r) => setTimeout(r, 1000));
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 400));
  });
}

async function measure(page, sels) {
  return await page.evaluate((sels) => {
    const sy = window.scrollY,
      sx = window.scrollX;
    const num = (v) => Math.round(parseFloat(v) * 100) / 100;
    const rect = (el) => {
      const r = el.getBoundingClientRect();
      return {
        x: num(r.x + sx),
        y: num(r.y + sy),
        w: num(r.width),
        h: num(r.height),
      };
    };
    const styleOf = (el) => {
      const c = getComputedStyle(el);
      return {
        ff: c.fontFamily.split(",")[0].replace(/["']/g, ""),
        fs: c.fontSize,
        fw: c.fontWeight,
        lh: c.lineHeight,
        ls: c.letterSpacing,
        color: c.color,
        bgImage: c.backgroundImage,
        fd: c.flexDirection,
        pad: c.padding,
        margin: c.margin,
        display: c.display,
        textAlign: c.textAlign,
        position: c.position,
        width: c.width,
        maxWidth: c.maxWidth,
      };
    };
    // visible ink line boxes for the element's own text nodes
    const lineBoxes = (el) => {
      const out = [];
      const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      let n;
      while ((n = walk.nextNode())) {
        if (!n.nodeValue.trim()) continue;
        const r = document.createRange();
        r.selectNodeContents(n);
        for (const cr of r.getClientRects()) {
          out.push({
            x: num(cr.x + sx),
            y: num(cr.y + sy),
            w: num(cr.width),
            h: num(cr.height),
            t: n.nodeValue.trim().slice(0, 28),
          });
        }
      }
      return out;
    };
    const res = {};
    for (const [k, sel] of Object.entries(sels)) {
      if (!sel) {
        res[k] = null;
        continue;
      }
      const els = [...document.querySelectorAll(sel)];
      res[k] = els.map((el) => ({
        tag: el.tagName.toLowerCase(),
        cls: (el.className && el.className.baseVal !== undefined
          ? el.className.baseVal
          : el.className || ""
        )
          .toString()
          .slice(0, 90),
        text: (el.textContent || "").trim().slice(0, 40),
        rect: rect(el),
        style: styleOf(el),
        lines: lineBoxes(el),
      }));
    }
    res.__page = {
      scrollHeight: document.documentElement.scrollHeight,
      bodyClientWidth: document.body.clientWidth,
      rootFontSize: getComputedStyle(document.documentElement).fontSize,
      innerWidth: window.innerWidth,
    };
    return res;
  }, sels);
}

const out = {};
const browser = await chromium.launch();
try {
  for (const vp of VPS) {
    out[vp] = {};
    for (const [side, url, sels] of [
      ["live", LIVE, LIVE_SEL],
      ["cand", CAND, CAND_SEL],
    ]) {
      const ctx = await browser.newContext({
        viewport: { width: vp, height: 900 },
        deviceScaleFactor: 1,
      });
      const page = await ctx.newPage();
      try {
        await page.goto(url, { waitUntil: "networkidle", timeout: 90000 });
      } catch {
        await page.goto(url, { waitUntil: "load", timeout: 90000 });
      }
      await page.waitForTimeout(1500);
      await settle(page);
      out[vp][side] = await measure(page, sels);
      await ctx.close();
    }
    console.error("done vp", vp);
  }
} finally {
  await browser.close();
}
fs.writeFileSync(
  "/Users/tuckerlemos/Documents/GitHub/beachfront-dentistry/matching/cu-adv.json",
  JSON.stringify(out, null, 1),
);
console.log("written");
