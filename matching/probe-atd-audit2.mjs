import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";

const LIVE = "https://www.beachfrontdentistry.com/ask-the-doctor";
const CAND = "http://localhost:5173/dev/match/ask-the-doctor";

async function settle(page) {
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 200) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 40));
    }
    window.scrollTo(0, document.body.scrollHeight);
    await new Promise((r) => setTimeout(r, 1000));
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 300));
  });
}

const G = (el) => {
  if (!el) return null;
  const cs = getComputedStyle(el);
  const r = el.getBoundingClientRect();
  return {
    txt: (el.textContent || "").trim().slice(0, 42),
    ff: cs.fontFamily.split(",")[0].replace(/"/g, ""),
    fw: cs.fontWeight,
    fs: cs.fontSize,
    lh: cs.lineHeight,
    ls: cs.letterSpacing,
    col: cs.color,
    bg: cs.backgroundColor,
    tt: cs.textTransform,
    x: +(r.x).toFixed(1),
    y: +(r.y + window.scrollY).toFixed(1),
    w: +(r.width).toFixed(1),
    h: +(r.height).toFixed(1),
  };
};

const detail = (map) =>
  Object.fromEntries(
    Object.entries(map).map(([k, sel]) => {
      const el = typeof sel === "string" ? document.querySelector(sel) : sel;
      const cs = el ? getComputedStyle(el) : null;
      const r = el ? el.getBoundingClientRect() : null;
      return [
        k,
        el
          ? {
              txt: (el.textContent || "").trim().slice(0, 42),
              ff: cs.fontFamily.split(",")[0].replace(/"/g, ""),
              fw: cs.fontWeight,
              fs: cs.fontSize,
              lh: cs.lineHeight,
              ls: cs.letterSpacing,
              col: cs.color,
              bg: cs.backgroundColor,
              tt: cs.textTransform,
              br: cs.borderRadius,
              x: +r.x.toFixed(1),
              y: +(r.y + window.scrollY).toFixed(1),
              w: +r.width.toFixed(1),
              h: +r.height.toFixed(1),
            }
          : null,
      ];
    }),
  );

const LIVE_SEL = {
  root: "html",
  section: "section.questions-section",
  gridWrap: "section.questions-section > .content-width",
  cell1: ".ask-the-doctor-collection-item",
  card1: ".qa-block",
  label1: ".qa-block .qa-label",
  circle1: ".qa-block .qa-circle",
  plus1: ".qa-block .expanding-plus",
  title1: ".qa-block .qa-question",
  answer1: ".qa-block .qa-answer",
  answerP1: ".qa-block .qa-answer p",
  readmore1: ".qa-block .qa-answer a",
  qatext1: ".qa-block .qa-text",
  bttWrap: "section.questions-section > .content-width.flex-align-center",
  btt: "section.questions-section a.button",
  heroSec: "section.hero",
  heroH: ".subpage-hero-heading",
  wave: "section.hero .bot-wave",
};

const CAND_SEL = {
  root: "html",
  section: "[data-slice-type='question_list']",
  gridWrap: "[data-slice-type='question_list'] .grid",
  cell1: "[data-slice-type='question_list'] .grid > div",
  card1: "[data-slice-type='question_list'] .grid > div .qa-item > div",
  label1: "[data-slice-type='question_list'] .grid > div button[aria-expanded]",
  circle1: "[data-slice-type='question_list'] .grid > div button[aria-expanded] span",
  plus1: "[data-slice-type='question_list'] .grid > div button[aria-expanded] img",
  title1: "[data-slice-type='question_list'] .grid > div h3",
  answer1: "[data-slice-type='question_list'] .grid > div [id^='qa-panel']",
  answerP1: "[data-slice-type='question_list'] .grid > div [id^='qa-panel'] p",
  readmore1: "[data-slice-type='question_list'] .grid > div [id^='qa-panel'] a",
  qatext1: null,
  bttWrap: null,
  btt: null,
  heroSec: "[data-slice-type='hero']",
  heroH: "[data-slice-type='hero'] h1, [data-slice-type='hero'] h2",
  wave: "[data-slice-type='hero'] svg",
};

const browser = await chromium.launch();
const out = {};
try {
  for (const vp of [1440, 992, 991, 834, 768, 767, 390]) {
    for (const [name, url, sels] of [
      ["live", LIVE, LIVE_SEL],
      ["cand", CAND, CAND_SEL],
    ]) {
      const ctx = await browser.newContext({ viewport: { width: vp, height: 900 } });
      const page = await ctx.newPage();
      await page.goto(url, { waitUntil: "networkidle", timeout: 90000 }).catch(() => {});
      await page.waitForTimeout(900);
      await settle(page);
      const d = await page.evaluate(detail, sels);
      const extra = await page.evaluate(() => ({
        pageH: document.body.scrollHeight,
        rootFs: getComputedStyle(document.documentElement).fontSize,
        bodyFs: getComputedStyle(document.body).fontSize,
      }));
      out[`${name}@${vp}`] = { ...extra, ...d };
      await ctx.close();
    }
    const L = out[`live@${vp}`], C = out[`cand@${vp}`];
    console.log(`\n########## ${vp}  pageH live=${L.pageH} cand=${C.pageH}  root live=${L.rootFs} cand=${C.rootFs}`);
    for (const k of Object.keys(LIVE_SEL)) {
      const a = L[k], b = C[k];
      const f = (o) => (o ? `${o.fs}/${o.lh} w${o.fw} ${o.ff} ls${o.ls} ${o.col} bg${o.bg} r${o.br} [${o.x},${o.y} ${o.w}x${o.h}] "${o.txt}"` : "NULL");
      console.log(` ${k.padEnd(10)} L: ${f(a)}`);
      console.log(` ${"".padEnd(10)} C: ${f(b)}`);
    }
  }
} finally {
  await browser.close();
}
const fs = await import("node:fs");
fs.writeFileSync("/Users/tuckerlemos/Documents/GitHub/beachfront-dentistry/matching/atd-audit2.json", JSON.stringify(out, null, 1));
