import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";
import fs from "node:fs";

const VPS = [1440, 834, 390];

const LIVE_SEL = {
  hero: "section.hero.contact",
  heroTopGrad: ".hero.contact .hero-top-gradient",
  heroBotGrad: ".hero.contact .hero-bot-gradient",
  heroCW: ".hero.contact .content-width",
  heading: "h2.contact-heading",
  heroWave: ".hero.contact .bot-wave",
  heroWaveSvg: ".hero.contact .bot-wave svg",
  heroWavePath: ".hero.contact .bot-wave svg path",
  info: "section.info-section",
  infoCW: "section.info-section > .content-width",
  btn: "section.info-section a.button",
  blockRow: "section.info-section .w-layout-hflex.su-flex-v-mobile",
  block1: "section.info-section .footer-contact-block:nth-of-type(1)",
  hdr1: "section.info-section .footer-contact-block .footer-contact-header",
  info1: "section.info-section .footer-contact-block .footer-contact-info",
  mapRow: "section.info-section .w-layout-hflex:not(.su-flex-v-mobile)",
  mapWrap: "section.info-section ._w-40pc",
  map: "section.info-section .footer-map",
  ctaH2: "section.footer > h2",
  fiji: ".fiji-section",
  footerInfo: ".footer-info-section",
};

const CAND_SEL = {
  hero: 'section[data-slice-type="hero"]',
  heroTopGrad: 'section[data-slice-type="hero"] > div[aria-hidden="true"]:nth-of-type(1)',
  heroBotGrad: 'section[data-slice-type="hero"] > div[aria-hidden="true"]:nth-of-type(2)',
  heading: 'section[data-slice-type="hero"] h2',
  heroWave: 'section[data-slice-type="hero"] > div:last-child',
  heroWaveSvg: 'section[data-slice-type="hero"] svg',
  heroWavePath: 'section[data-slice-type="hero"] svg path',
  info: 'section[data-section="info"]',
  btn: 'section[data-section="info"] a[href="#appointment"]',
  blockRow: 'section[data-section="info"] .flex.flex-col',
  hdr1: 'section[data-section="info"] h2',
  info1: 'section[data-section="info"] address p',
  map: 'section[data-section="info"] iframe',
  mapWrap: 'section[data-section="info"] iframe',
};

async function settle(page) {
  await page.evaluate(async () => {
    const step = 200;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 50));
    }
    window.scrollTo(0, document.body.scrollHeight);
    await new Promise((r) => setTimeout(r, 1200));
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 400));
  });
}

const describe = (sels) => {
  const out = {};
  for (const [name, sel] of Object.entries(sels)) {
    const els = Array.from(document.querySelectorAll(sel));
    if (!els.length) {
      out[name] = null;
      continue;
    }
    out[name] = els.slice(0, 4).map((el) => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return {
        tag: el.tagName.toLowerCase(),
        cls: (el.className || "").toString().slice(0, 60),
        x: +r.x.toFixed(1),
        y: +(r.y + window.scrollY).toFixed(1),
        w: +r.width.toFixed(1),
        h: +r.height.toFixed(1),
        ff: cs.fontFamily.split(",")[0],
        fs: cs.fontSize,
        fw: cs.fontWeight,
        lh: cs.lineHeight,
        ls: cs.letterSpacing,
        ta: cs.textAlign,
        color: cs.color,
        bg: cs.backgroundColor,
        bgImg: cs.backgroundImage.slice(0, 120),
        bgPos: cs.backgroundPosition,
        bgSize: cs.backgroundSize,
        tf: cs.transform,
        pad: `${cs.paddingTop} ${cs.paddingRight} ${cs.paddingBottom} ${cs.paddingLeft}`,
        mar: `${cs.marginTop} ${cs.marginRight} ${cs.marginBottom} ${cs.marginLeft}`,
        border: cs.border,
        radius: cs.borderRadius,
        pos: cs.position,
        bottom: cs.bottom,
        left: cs.left,
        display: cs.display,
        fill: cs.fill,
        txt: (el.innerText || el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 60),
      };
    });
  }
  out.__meta = {
    scrollHeight: document.documentElement.scrollHeight,
    rootFont: getComputedStyle(document.documentElement).fontSize,
    clientWidth: document.body.clientWidth,
  };
  return out;
};

const result = { live: {}, cand: {} };
const browser = await chromium.launch();
try {
  for (const [side, url, sels] of [
    ["live", "https://www.beachfrontdentistry.com/contact-us", LIVE_SEL],
    ["cand", "http://localhost:5173/contact-us", CAND_SEL],
  ]) {
    for (const vp of VPS) {
      const ctx = await browser.newContext({
        viewport: { width: vp, height: 900 },
        deviceScaleFactor: 1,
      });
      const page = await ctx.newPage();
      await page
        .goto(url, { waitUntil: "networkidle", timeout: 60000 })
        .catch(() => {});
      await page.waitForTimeout(1500);
      await settle(page);
      result[side][vp] = await page.evaluate(describe, sels);
      await ctx.close();
    }
  }
} finally {
  await browser.close();
}
fs.writeFileSync(
  "/Users/tuckerlemos/Documents/GitHub/beachfront-dentistry/matching/cu-elem.json",
  JSON.stringify(result, null, 1),
);
console.log("done");
