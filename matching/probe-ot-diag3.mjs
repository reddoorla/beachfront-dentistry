import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";
import fs from "node:fs";

const LIVE = "https://www.beachfrontdentistry.com/our-team";
const CAND = "http://localhost:5173/dev/match/our-team";
const VPS = [1440, 834, 390];

async function settle(page) {
  const h = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < h; y += 200) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(50);
  }
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1000);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
}

const probe = () => {
  const abs = (el) => {
    const r = el.getBoundingClientRect();
    return {
      y: +(r.top + window.scrollY).toFixed(1),
      h: +r.height.toFixed(1),
      x: +r.left.toFixed(1),
      w: +r.width.toFixed(1),
    };
  };
  const info = (el, label) => {
    if (!el) return { label, missing: true };
    const s = getComputedStyle(el);
    return {
      label,
      tag: el.tagName.toLowerCase(),
      cls: (typeof el.className === "string" ? el.className : "").slice(0, 80),
      ...abs(el),
      ff: s.fontFamily.split(",")[0].replace(/["']/g, ""),
      fw: s.fontWeight,
      fs: s.fontSize,
      lh: s.lineHeight,
      ls: s.letterSpacing,
      col: s.color,
      ta: s.textAlign,
      tt: s.textTransform,
      mt: s.marginTop,
      mb: s.marginBottom,
      ml: s.marginLeft,
      mr: s.marginRight,
      pt: s.paddingTop,
      pb: s.paddingBottom,
      pl: s.paddingLeft,
      pr: s.paddingRight,
      disp: s.display,
      pos: s.position,
      bg: s.backgroundColor,
      txt: (el.innerText || "").replace(/\s+/g, " ").slice(0, 50),
    };
  };
  const byText = (sel, t) =>
    [...document.querySelectorAll(sel)].find(
      (e) => (e.textContent || "").trim() === t,
    );

  const out = {
    rootFont: getComputedStyle(document.documentElement).fontSize,
    items: [],
  };
  const push = (...a) => out.items.push(info(...a));

  const isLive = location.hostname.includes("beachfront");

  if (isLive) {
    push(document.querySelector("section.hero.redondo"), "heroBand");
    push(
      document.querySelector(
        ".hero.redondo h1, .hero.redondo h2, .hero.redondo h3, .subpage-hero-heading",
      ),
      "heroHeading",
    );
    push(
      document.querySelector("section.our-team-subtitle-section"),
      "subtitleSection",
    );
    push(
      document.querySelector(".our-team-subtitle-section .content-width"),
      "subtitleInner",
    );
    const hs = [
      ...document.querySelectorAll(
        ".our-team-subtitle-section h1,.our-team-subtitle-section h2,.our-team-subtitle-section h3,.our-team-subtitle-section h4",
      ),
    ];
    hs.forEach((h, i) => push(h, "subHead" + i));
    push(document.querySelector("section.team-grid-section"), "gridSection");
    push(
      document.querySelector(".team-grid-section .content-width"),
      "gridInner",
    );
    push(document.querySelector(".w-dyn-items.w-row"), "gridRow");
    push(document.querySelector(".team-list-item"), "card0");
    push(document.querySelector("section.footer"), "footerSection");
    push(document.querySelector(".cta-section"), "ctaSection");
    // read more text run
    const rm = [...document.querySelectorAll(".team-list-item a")].find((a) =>
      /read more/i.test(a.textContent || ""),
    );
    if (rm) {
      push(rm, "readMoreLink");
      push(rm.parentElement, "readMoreWrap");
      const img = rm.querySelector("img");
      if (img) {
        const i2 = info(img, "readMoreArrow");
        i2.src = img.currentSrc;
        i2.nat = img.naturalWidth + "x" + img.naturalHeight;
        out.items.push(i2);
      }
      const range = document.createRange();
      range.selectNodeContents(rm);
      const rr = range.getBoundingClientRect();
      out.readMoreRun = {
        x: +rr.left.toFixed(1),
        y: +(rr.top + window.scrollY).toFixed(1),
        w: +rr.width.toFixed(1),
        h: +rr.height.toFixed(1),
      };
    }
    const hsimg = document.querySelector(".team-grid-headshot");
    if (hsimg) {
      const i3 = info(hsimg, "headshot");
      i3.nat = hsimg.naturalWidth + "x" + hsimg.naturalHeight;
      i3.br = getComputedStyle(hsimg).borderRadius;
      out.items.push(i3);
    }
    push(document.querySelector(".team-grid-beach"), "beachImg");
    push(document.querySelector(".team-beach-name"), "beachCaption");
    push(document.querySelector(".m-2.team-teaser"), "bio");
    // how many cards per row
    const cards = [...document.querySelectorAll(".team-list-item")];
    out.cardXs = cards
      .slice(0, 6)
      .map((c) => Math.round(c.getBoundingClientRect().left));
    out.cardYs = cards.map((c) =>
      Math.round(c.getBoundingClientRect().top + window.scrollY),
    );
    out.bioTexts = [...document.querySelectorAll(".m-2.team-teaser")]
      .slice(0, 3)
      .map((p) => (p.innerText || "").replace(/\s+/g, " "));
    out.names = [...document.querySelectorAll(".team-list-item h5")].map((h) =>
      (h.innerText || "").trim(),
    );
    out.roles = [
      ...document.querySelectorAll(".team-list-item h6.text-align-center"),
    ].map((h) => (h.innerText || "").trim());
    out.captions = [...document.querySelectorAll(".team-beach-name")].map((h) =>
      (h.innerText || "").trim(),
    );
  } else {
    const hero = document.querySelector('[data-slice-variation="subpage"]');
    push(hero, "heroBand");
    push(hero && hero.querySelector("h2"), "heroHeading");
    const sub = hero && hero.nextElementSibling;
    push(sub, "subtitleSection");
    const hs = sub ? [...sub.querySelectorAll("h1,h2,h3,h4")] : [];
    hs.forEach((h, i) => push(h, "subHead" + i));
    push(document.querySelector(".team-grid-section"), "gridSection");
    push(document.querySelector(".team-list-item"), "card0");
    const cards = [...document.querySelectorAll(".team-list-item")];
    out.cardXs = cards
      .slice(0, 6)
      .map((c) => Math.round(c.getBoundingClientRect().left));
    out.cardYs = cards.map((c) =>
      Math.round(c.getBoundingClientRect().top + window.scrollY),
    );
    const c0 = cards[0];
    if (c0) {
      const rm = [...c0.querySelectorAll("a")].find((a) =>
        /read more/i.test(a.textContent || ""),
      );
      if (rm) {
        push(rm, "readMoreLink");
        const range = document.createRange();
        range.selectNodeContents(rm);
        const rr = range.getBoundingClientRect();
        out.readMoreRun = {
          x: +rr.left.toFixed(1),
          y: +(rr.top + window.scrollY).toFixed(1),
          w: +rr.width.toFixed(1),
          h: +rr.height.toFixed(1),
        };
        const sp = rm.querySelector("span");
        if (sp) push(sp, "readMoreArrow");
      }
      const hsimg = c0.querySelector("img");
      if (hsimg) {
        const i3 = info(hsimg, "headshot");
        i3.nat = hsimg.naturalWidth + "x" + hsimg.naturalHeight;
        i3.wAttr = hsimg.getAttribute("width");
        i3.maxW = getComputedStyle(hsimg).maxWidth;
        out.items.push(i3);
      }
      const beach = [...c0.querySelectorAll("img")].pop();
      push(beach, "beachImg");
      push(c0.querySelector("h6.font-slab"), "beachCaption");
      push(c0.querySelector("p"), "bio");
    }
    out.bioTexts = cards.slice(0, 3).map((c) => {
      const p = c.querySelector("p");
      return p ? (p.innerText || "").replace(/\s+/g, " ") : "";
    });
    out.names = cards.map((c) => {
      const h = c.querySelector("h5");
      return h ? (h.innerText || "").trim() : "";
    });
    out.roles = cards.map((c) => {
      const h = c.querySelector("h6");
      return h ? (h.innerText || "").trim() : "";
    });
    out.captions = cards.map((c) => {
      const hs2 = [...c.querySelectorAll("h6")];
      return hs2.length > 1 ? (hs2[hs2.length - 1].innerText || "").trim() : "";
    });
    // CTA / footer
    push(document.querySelector("footer"), "footerSection");
  }
  return out;
};

const browser = await chromium.launch();
try {
  const res = {};
  for (const [name, url] of [
    ["live", LIVE],
    ["cand", CAND],
  ]) {
    res[name] = {};
    for (const vw of VPS) {
      const ctx = await browser.newContext({
        viewport: { width: vw, height: 900 },
        deviceScaleFactor: 1,
      });
      const page = await ctx.newPage();
      await page
        .goto(url, { waitUntil: "networkidle", timeout: 90000 })
        .catch(() => {});
      await page.waitForTimeout(600);
      await settle(page);
      res[name][vw] = await page.evaluate(probe);
      await ctx.close();
    }
  }
  fs.writeFileSync("matching/ot-diag3.json", JSON.stringify(res, null, 1));
  for (const vw of VPS) {
    console.log(
      `\n############ ${vw}  root live=${res.live[vw].rootFont} cand=${res.cand[vw].rootFont}`,
    );
    for (const side of ["live", "cand"]) {
      const r = res[side][vw];
      console.log(
        `--- ${side}  cardXs=${JSON.stringify(r.cardXs)}  readMoreRun=${JSON.stringify(r.readMoreRun)}`,
      );
      for (const i of r.items) {
        if (i.missing) {
          console.log(`   ${i.label}: MISSING`);
          continue;
        }
        console.log(
          `   ${i.label.padEnd(14)} [${i.x},${i.y} ${i.w}x${i.h}] ${i.ff} ${i.fw} ${i.fs}/${i.lh} ls=${i.ls} ${i.col} ${i.ta} m=${i.mt}/${i.mr}/${i.mb}/${i.ml} p=${i.pt}/${i.pr}/${i.pb}/${i.pl} ${i.disp} bg=${i.bg}${i.nat ? " nat=" + i.nat : ""}${i.maxW ? " maxW=" + i.maxW : ""} | ${i.txt}`,
        );
      }
      console.log(`   cardYs=${JSON.stringify(r.cardYs)}`);
    }
  }
} finally {
  await browser.close();
}
