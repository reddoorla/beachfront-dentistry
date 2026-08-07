import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";
import { writeFileSync } from "node:fs";

const LIVE = "https://www.beachfrontdentistry.com/ask-the-doctor";
const CAND = "http://localhost:5173/dev/match/ask-the-doctor";

const VPS = process.argv[2]
  ? process.argv[2].split(",").map(Number)
  : [1440, 834, 390];

const SEL = {
  live: {
    hero: "section.hero.ask-a-dentist",
    heroH: ".subpage-hero-heading",
    wave: ".bot-wave svg",
    gridWrap: ".questions-section > .content-width.my-8",
    cell: ".ask-the-doctor-collection-item",
    card: ".qa-block",
    label: ".qa-label",
    circle: ".qa-circle",
    plus: ".plus-minus-block",
    title: ".qa-question",
    answerP: ".qa-answer p",
    readmore: ".qa-answer a.button",
    qatext: ".qa-text",
    ready: "section.footer h2.text-align-center.my-4",
  },
  cand: {
    hero: '[data-slice-variation="subpage"]',
    heroH: '[data-slice-variation="subpage"] h2',
    wave: '[data-slice-variation="subpage"] svg',
    gridWrap: '[data-slice-variation="numbered"] .grid',
    cell: '[data-slice-variation="numbered"] .grid > div',
    card: ".qa-item > div",
    label: ".qa-item > div > button",
    circle: ".qa-item > div > button > span:first-child",
    plus: ".qa-item > div > button img",
    title: ".qa-item h3",
    answerP: ".qa-item > div > div > div > p",
    readmore: '.qa-item a[href^="/questions/"]',
    qatext: null,
    ready: null,
  },
};

function pickFns() {
  return {
    rect: (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return {
        x: +r.x.toFixed(1),
        y: +(r.y + window.scrollY).toFixed(1),
        w: +r.width.toFixed(1),
        h: +r.height.toFixed(1),
      };
    },
  };
}

async function measure(page, sel, label) {
  // settle: scroll to bottom in steps
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

  return await page.evaluate((sel) => {
    const R = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return {
        x: +r.x.toFixed(1),
        y: +(r.y + window.scrollY).toFixed(1),
        w: +r.width.toFixed(1),
        h: +r.height.toFixed(1),
      };
    };
    const T = (el) => {
      if (!el) return null;
      const c = getComputedStyle(el);
      return {
        ff: c.fontFamily.split(",")[0].replace(/["']/g, ""),
        fs: c.fontSize,
        fw: c.fontWeight,
        lh: c.lineHeight,
        ls: c.letterSpacing,
        color: c.color,
        mt: c.marginTop,
        mb: c.marginBottom,
        ml: c.marginLeft,
        mr: c.marginRight,
        pt: c.paddingTop,
        pb: c.paddingBottom,
        pl: c.paddingLeft,
        pr: c.paddingRight,
        h: c.height,
        w: c.width,
      };
    };
    const q = (s) => (s ? document.querySelector(s) : null);
    const out = {
      bodyClientWidth: document.body.clientWidth,
      innerWidth: window.innerWidth,
      pageH: document.documentElement.scrollHeight,
      rootFontSize: getComputedStyle(document.documentElement).fontSize,
    };
    for (const [k, s] of Object.entries(sel)) {
      const el = q(s);
      out[k] = R(el);
      out[k + "_t"] = T(el);
    }
    // second card cell for pitch
    const cells = sel.cell ? [...document.querySelectorAll(sel.cell)] : [];
    out.cellCount = cells.length;
    out.cell2 = cells[2] ? R(cells[2]) : null;
    const cards = sel.card ? [...document.querySelectorAll(sel.card)] : [];
    out.cardCount = cards.length;
    // Back to top
    const all = [...document.querySelectorAll("a,button")];
    const btt = all.find((e) => e.textContent.trim() === "Back to Top");
    out.btt = btt ? R(btt) : null;
    out.btt_t = btt ? T(btt) : null;
    out.bttParent = btt ? R(btt.parentElement) : null;
    // Ready heading
    const h2s = [...document.querySelectorAll("h1,h2,h3")];
    const ready = h2s.find((e) =>
      /Ready for\s*great dental/i.test(e.textContent.replace(/\s+/g, " ")),
    );
    out.ready = ready ? R(ready) : null;
    out.ready_t = ready ? T(ready) : null;
    return out;
  }, sel);
}

const results = {};
const browser = await chromium.launch();
try {
  for (const vw of VPS) {
    results[vw] = {};
    for (const [side, url] of [
      ["live", LIVE],
      ["cand", CAND],
    ]) {
      const ctx = await browser.newContext({
        viewport: { width: vw, height: 900 },
        deviceScaleFactor: 1,
      });
      const page = await ctx.newPage();
      await page.goto(url, { waitUntil: "networkidle", timeout: 90000 });
      await page.waitForTimeout(1200);
      results[vw][side] = await measure(page, SEL[side], side);
      await ctx.close();
    }
  }
} finally {
  await browser.close();
}
writeFileSync(
  "/Users/tuckerlemos/Documents/GitHub/beachfront-dentistry/matching/adv-atd.json",
  JSON.stringify(results, null, 1),
);
for (const vw of VPS) {
  const L = results[vw].live,
    C = results[vw].cand;
  console.log(`\n===== ${vw} =====`);
  const keys = [
    "bodyClientWidth",
    "pageH",
    "rootFontSize",
    "cellCount",
    "cardCount",
  ];
  for (const k of keys) console.log(`${k}: LIVE ${L[k]}  CAND ${C[k]}`);
  for (const k of [
    "hero",
    "heroH",
    "wave",
    "gridWrap",
    "cell",
    "cell2",
    "card",
    "label",
    "circle",
    "plus",
    "title",
    "answerP",
    "readmore",
    "btt",
    "bttParent",
    "ready",
  ]) {
    const j = (r) => (r ? `[${r.x},${r.y} ${r.w}x${r.h}]` : "null");
    console.log(`${k}: LIVE ${j(L[k])}   CAND ${j(C[k])}`);
  }
  for (const k of ["heroH", "title", "readmore", "circle", "ready", "btt"]) {
    const t = (o) =>
      o ? `${o.ff} ${o.fw} ${o.fs}/${o.lh} mt=${o.mt} mb=${o.mb}` : "null";
    console.log(`${k}_t: LIVE ${t(L[k + "_t"])}  ||  CAND ${t(C[k + "_t"])}`);
  }
}
