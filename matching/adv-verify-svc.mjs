import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";
import fs from "node:fs";

const LIVE = "https://www.beachfrontdentistry.com/services";
const CAND = "http://localhost:5173/dev/match/services";
const VPS = [1440, 834, 390];

const script = () => {
  const out = {};
  const px = (v) => Math.round(parseFloat(v) * 100) / 100;
  const R = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return {
      x: px(r.x),
      y: px(r.y + window.scrollY),
      w: px(r.width),
      h: px(r.height),
    };
  };
  const S = (el, props) => {
    if (!el) return null;
    const cs = getComputedStyle(el);
    const o = {};
    for (const p of props) o[p] = cs[p];
    return o;
  };
  const TYPE = [
    "fontFamily",
    "fontWeight",
    "fontSize",
    "lineHeight",
    "letterSpacing",
    "color",
  ];
  const q = (s) => document.querySelector(s);
  const qa = (s) => [...document.querySelectorAll(s)];

  out.root = getComputedStyle(document.documentElement).fontSize;
  out.bodyClientWidth = document.body.clientWidth;
  out.scrollHeight = document.documentElement.scrollHeight;
  out.innerWidth = window.innerWidth;

  // ---- section census: direct children of body / main
  const roots = qa("body > *, main > *, #main > *, [data-slice-zone] > *");
  out.census = roots
    .map((el) => {
      const r = R(el);
      if (!r || r.h < 5) return null;
      return {
        tag: el.tagName.toLowerCase(),
        cls: (el.className || "").toString().slice(0, 90),
        ...r,
      };
    })
    .filter(Boolean);

  // ---- HERO
  const heroLive = q("section.hero.redondo");
  const heroCand = q('[data-slice-variation="subpage"]');
  const hero = heroLive || heroCand;
  out.hero = { rect: R(hero), cls: hero ? hero.className.toString() : null };
  if (hero) {
    out.heroStyle = S(hero, [
      "backgroundImage",
      "backgroundSize",
      "backgroundPosition",
      "height",
      "minHeight",
    ]);
  }
  const h2live = q("h2.subpage-hero-heading");
  const h2cand = hero ? hero.querySelector("h2") : null;
  const heroH2 = h2live || h2cand;
  out.heroH2 = {
    text: heroH2 ? heroH2.textContent.trim() : null,
    rect: R(heroH2),
    style: S(heroH2, [
      ...TYPE,
      "position",
      "bottom",
      "marginBottom",
      "marginTop",
      "textAlign",
      "transform",
    ]),
    parentRect: heroH2 ? R(heroH2.parentElement) : null,
    parentStyle: heroH2
      ? S(heroH2.parentElement, [
          "position",
          "bottom",
          "marginBottom",
          "left",
          "width",
        ])
      : null,
  };
  // hero background image element (candidate) or bg (live)
  const heroImg = hero ? hero.querySelector("img") : null;
  out.heroImg = heroImg
    ? {
        rect: R(heroImg),
        src: heroImg.currentSrc || heroImg.src,
        nat: [heroImg.naturalWidth, heroImg.naturalHeight],
        style: S(heroImg, ["objectFit", "objectPosition"]),
      }
    : null;

  // hero wave
  const bw = q(".bot-wave") || (hero ? hero.querySelector("svg") : null);
  const bwsvg = bw
    ? bw.tagName === "svg"
      ? bw
      : bw.querySelector("svg")
    : null;
  out.heroWave = { wrapRect: R(bw), svgRect: R(bwsvg) };

  // ---- WE OFFER intro
  const introLive = q(".we-offer-section p");
  let introCand = null;
  if (!introLive) {
    const secs = qa('[data-slice-type="service_category_band"], section');
    for (const s of secs) {
      const p = s.querySelector("p");
      if (p && /We offer a wide array/i.test(p.textContent)) {
        introCand = p;
        break;
      }
    }
  }
  const intro = introLive || introCand;
  out.intro = {
    text: intro ? intro.textContent.trim().slice(0, 60) : null,
    rect: R(intro),
    style: S(intro, [
      ...TYPE,
      "marginTop",
      "marginBottom",
      "maxWidth",
      "textAlign",
    ]),
    parentRect: intro ? R(intro.parentElement) : null,
    parentStyle: intro
      ? S(intro.parentElement, [
          "marginTop",
          "marginBottom",
          "maxWidth",
          "width",
        ])
      : null,
  };

  // ---- GRID
  const gridLive = q(".service-grid");
  let grid = gridLive;
  if (!grid) {
    // candidate: parent of the .service-block articles
    const b = q(".service-block");
    grid = b ? b.parentElement : null;
  }
  out.grid = {
    rect: R(grid),
    style: S(grid, [
      "display",
      "gridTemplateColumns",
      "gridTemplateRows",
      "rowGap",
      "columnGap",
      "marginTop",
      "marginBottom",
      "paddingTop",
      "paddingBottom",
      "justifyItems",
      "justifyContent",
    ]),
    parentRect: grid ? R(grid.parentElement) : null,
    parentStyle: grid
      ? S(grid.parentElement, [
          "width",
          "maxWidth",
          "paddingLeft",
          "paddingRight",
          "marginTop",
          "marginBottom",
        ])
      : null,
  };

  // ---- CARDS
  const cards = qa(".service-block");
  out.cards = cards.map((c) => {
    const h3 = c.querySelector("h3");
    const p = c.querySelector("p");
    const panel =
      c.querySelector(".h-40pc") || c.children[c.children.length - 1];
    const tooth =
      c.querySelector(".service-block-teef") || c.querySelector("img");
    const cols = panel
      ? [...panel.children].flatMap((ch) =>
          ch.tagName === "DIV" || ch.tagName === "UL" ? [ch] : [...ch.children],
        )
      : [];
    const links = [...c.querySelectorAll("a")];
    const linkTexts = links.map((a) =>
      a.textContent.trim().replace(/\s+/g, " "),
    );
    // per-column anchor counts by x position
    const byX = {};
    for (const a of links) {
      const x = Math.round(a.getBoundingClientRect().x);
      byX[x] = (byX[x] || 0) + 1;
    }
    const firstLink = links[0];
    const label = firstLink
      ? firstLink.querySelector("span") || firstLink
      : null;
    const arrow = firstLink ? firstLink.querySelector("img,svg") : null;
    return {
      rect: R(c),
      style: S(c, [
        "width",
        "height",
        "margin",
        "borderRadius",
        "backgroundColor",
      ]),
      h3: {
        text: h3 ? h3.textContent.trim() : null,
        rect: R(h3),
        style: S(h3, [...TYPE, "marginBottom", "marginTop"]),
      },
      p: {
        rect: R(p),
        style: S(p, [...TYPE, "marginTop", "marginBottom"]),
      },
      inner: (() => {
        const top = c.querySelector(".h-60pc") || c.children[1];
        const box = top ? top.querySelector("div") : null;
        return {
          topRect: R(top),
          boxRect: R(box),
          boxStyle: S(box, ["margin"]),
        };
      })(),
      panel: {
        rect: R(panel),
        style: S(panel, [
          "backgroundColor",
          "backgroundImage",
          "paddingLeft",
          "paddingRight",
          "borderRadius",
        ]),
      },
      cols: cols.map((cc) => ({
        rect: R(cc),
        cls: (cc.className || "").toString(),
        style: S(cc, ["paddingTop", "paddingLeft", "width"]),
        n: cc.querySelectorAll("a").length,
      })),
      tooth: tooth
        ? {
            rect: R(tooth),
            src: tooth.getAttribute("src"),
            style: S(tooth, ["top", "right", "width", "height", "position"]),
          }
        : null,
      linkCount: links.length,
      linkTexts,
      linkX: byX,
      linkStyle: S(firstLink, [...TYPE, "gap", "display", "alignItems"]),
      labelStyle: S(label, [...TYPE, "marginRight"]),
      labelRect: R(label),
      arrow: arrow
        ? {
            tag: arrow.tagName.toLowerCase(),
            src: arrow.getAttribute("src"),
            rect: R(arrow),
            style: S(arrow, ["opacity", "width", "height", "marginRight"]),
          }
        : null,
      firstLinkRect: R(firstLink),
    };
  });

  // ---- CTA band
  const ctaH2 =
    q(".cta-section h2") ||
    [...qa("h2")].find((h) =>
      /Ready for great dental health/i.test(h.textContent),
    );
  out.ctaH2 = {
    text: ctaH2 ? ctaH2.textContent.trim() : null,
    rect: R(ctaH2),
    style: S(ctaH2, [...TYPE, "marginTop", "marginBottom", "textAlign"]),
  };
  const ctaSec = q(".cta-section") || (ctaH2 ? ctaH2.closest("section") : null);
  out.ctaSection = { rect: R(ctaSec) };

  const fiji =
    q(".fiji-section") ||
    [...qa("div,section")].find((e) =>
      /fiji/i.test((e.className || "").toString()),
    );
  out.fiji = {
    rect: R(fiji),
    style: S(fiji, ["height", "minHeight", "marginBottom", "backgroundImage"]),
  };

  // ---- Footer
  const fInfo = q(".footer-info-section");
  out.footerInfo = { rect: R(fInfo) };
  const fWaveWrap =
    q(".footer-wave-embed") || q('[class*="footer"] svg')?.parentElement;
  const fWave = fWaveWrap ? fWaveWrap.querySelector("svg") : null;
  out.footerWave = { wrapRect: R(fWaveWrap), svgRect: R(fWave) };
  const learn =
    q(".footer-learn-more") ||
    [...qa("h5,h4,h3,h2,p")].find((e) =>
      /Want to learn more/i.test(e.textContent),
    );
  out.footerLearn = { rect: R(learn) };
  const footerSec = q("section.footer") || q("footer");
  out.footerSection = { rect: R(footerSec) };

  // ---- Nav
  const hdr = q("section.header") || q("header") || q("nav");
  out.nav = {
    rect: R(hdr),
    style: S(hdr, ["height", "paddingTop", "paddingBottom", "position"]),
  };
  const logo = hdr ? hdr.querySelector("img") : null;
  out.navLogo = { rect: R(logo), src: logo ? logo.getAttribute("src") : null };
  const burger = hdr
    ? hdr.querySelector(
        '.w-nav-button, [aria-label*="enu"], button[aria-expanded], .menu-button',
      )
    : null;
  out.navBurger = {
    rect: R(burger),
    cls: burger ? burger.className.toString() : null,
  };

  return out;
};

const measure = async (page, url) => {
  await page
    .goto(url, { waitUntil: "networkidle", timeout: 90000 })
    .catch(() => {});
  await page.waitForTimeout(1200);
  // settle: scroll in 200px steps
  await page.evaluate(async () => {
    const step = 200;
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 50));
    }
    window.scrollTo(0, document.documentElement.scrollHeight);
    await new Promise((r) => setTimeout(r, 800));
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 400));
  });
  await page.waitForTimeout(1000);
  return page.evaluate(script);
};

const run = async () => {
  const browser = await chromium.launch();
  const result = {};
  try {
    for (const w of VPS) {
      const ctx = await browser.newContext({
        viewport: { width: w, height: 900 },
        deviceScaleFactor: 1,
      });
      const page = await ctx.newPage();
      result[`live@${w}`] = await measure(page, LIVE);
      result[`cand@${w}`] = await measure(page, CAND);
      await ctx.close();
      console.error("done", w);
    }
  } finally {
    await browser.close();
  }
  fs.writeFileSync(
    "/Users/tuckerlemos/Documents/GitHub/beachfront-dentistry/matching/adv-verify-svc.json",
    JSON.stringify(result, null, 1),
  );
  console.log("ok");
};
run();
