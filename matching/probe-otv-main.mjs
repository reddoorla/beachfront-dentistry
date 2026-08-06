import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";
import fs from "node:fs";

const LIVE = "https://www.beachfrontdentistry.com/our-team";
const CAND = "http://localhost:5173/dev/match/our-team";
const VPS = [1440, 992, 834, 768, 650, 390];

async function settle(page) {
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < h; y += 200) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(50);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1200);
}

const measure = (side) => {
  const R = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return {
      x: +(r.left + window.scrollX).toFixed(1),
      y: +(r.top + window.scrollY).toFixed(1),
      w: +r.width.toFixed(1),
      h: +r.height.toFixed(1),
    };
  };
  const S = (el, props) => {
    if (!el) return null;
    const c = getComputedStyle(el);
    const o = {};
    for (const p of props) o[p] = c[p];
    return o;
  };
  const TXT = (el) => (el ? (el.textContent || "").trim().replace(/\s+/g, " ") : null);
  const LINES = (el) => {
    if (!el) return null;
    const rg = document.createRange();
    rg.selectNodeContents(el);
    return [...rg.getClientRects()]
      .filter((r) => r.width > 0.5 && r.height > 0.5)
      .map((r) => ({
        x: +(r.left + window.scrollX).toFixed(1),
        y: +(r.top + window.scrollY).toFixed(1),
        w: +r.width.toFixed(1),
        h: +r.height.toFixed(1),
      }));
  };
  const FONT = ["fontFamily", "fontSize", "lineHeight", "fontWeight", "letterSpacing", "color", "textAlign", "textTransform"];
  const BOX = ["position", "top", "bottom", "left", "right", "width", "height", "margin", "padding", "maxWidth", "backgroundColor", "borderRadius", "objectFit", "display", "gap"];

  const live = side === "live";
  const q = (s, root = document) => root.querySelector(s);
  const qa = (s, root = document) => [...root.querySelectorAll(s)];
  const byText = (sel, needle) => qa(sel).find((e) => (e.textContent || "").trim().startsWith(needle));

  const out = {
    root: getComputedStyle(document.documentElement).fontSize,
    bodyClientW: document.body.clientWidth,
    scrollH: document.documentElement.scrollHeight,
    innerW: window.innerWidth,
  };

  // --- hero band + Meet heading
  const heroSec = live ? q("section.hero.redondo") : q('section[data-slice-variation="subpage"]');
  const meet = live ? q("h2.meet-heading") : (heroSec ? q("h2", heroSec) : null);
  out.hero = R(heroSec);
  out.meetBox = R(meet);
  out.meetStyle = S(meet, [...FONT, "position", "bottom", "left", "width", "marginBottom"]);
  out.meetLines = LINES(meet);
  out.meetWrap = meet ? R(meet.parentElement) : null;
  out.meetWrapStyle = meet ? S(meet.parentElement, ["position", "bottom", "left", "width", "textAlign"]) : null;

  // --- subtitle section
  let subSec, subH2s, introH3;
  if (live) {
    subSec = q("section.our-team-subtitle-section");
    subH2s = qa("section.our-team-subtitle-section > h2");
    introH3 = q("section.our-team-subtitle-section h3");
  } else {
    const secs = qa("main > section");
    subSec = secs[1];
    subH2s = subSec ? qa(":scope > h2", subSec) : [];
    introH3 = subSec ? q("h3", subSec) : null;
  }
  out.subSec = R(subSec);
  out.subSecStyle = S(subSec, ["padding", "margin"]);
  out.subH2 = subH2s.map((h) => ({ t: TXT(h), rect: R(h), style: S(h, [...FONT, "margin"]), lines: LINES(h) }));
  out.intro = { t: (TXT(introH3) || "").slice(0, 40), rect: R(introH3), style: S(introH3, [...FONT, "margin", "maxWidth"]), lines: LINES(introH3) };

  // --- grid
  const gridSec = live ? q("section.team-grid-section") : q("section.team-grid-section");
  out.gridSec = R(gridSec);
  out.gridSecStyle = S(gridSec, ["padding", "maxWidth", "display", "flexWrap", "justifyContent"]);
  const gridInner = live ? q("section.team-grid-section .w-dyn-items") : null;
  out.gridInner = R(gridInner);
  out.gridInnerStyle = S(gridInner, ["padding", "maxWidth", "display", "flexWrap", "justifyContent", "width"]);
  const contentWidth = live ? q("section.team-grid-section .content-width") : null;
  out.contentWidth = R(contentWidth);

  const cards = live ? qa(".team-list-item") : qa("article.team-list-item");
  out.cardCount = cards.length;
  out.cardRects = cards.map(R);
  out.card0Style = S(cards[0], [...BOX, "boxSizing"]);
  // rows: group by y
  const rows = {};
  out.cardRects.forEach((r) => {
    const k = Math.round(r.y / 10) * 10;
    rows[k] = (rows[k] || 0) + 1;
  });
  out.rowHistogram = rows;

  const c0 = cards[0];
  if (c0) {
    const headshot = live ? q("img.team-grid-headshot", c0) : q("img[class*='rounded-full']", c0);
    const name = q("h5", c0);
    const role = live ? q("h6.h7", c0) : qa("h6", c0)[0];
    const bio = live ? q("p.team-teaser", c0) : q("p", c0);
    const beachImg = live ? q("img.team-grid-beach", c0) : q("img[class*='absolute']", c0);
    const beachName = live ? q("h6.team-beach-name", c0) : qa("h6", c0).slice(-1)[0];
    const rm = live ? q(".team-teasewr-read-more", c0) : [...c0.querySelectorAll("a")].find((a) => /read more/i.test(a.textContent || ""));
    const rmLink = live ? (rm ? rm.parentElement : null) : rm;
    const arrow = live ? q("img.read-more-arrow", c0) : (rm ? q("span", rm) : null);

    out.headshot = { rect: R(headshot), style: S(headshot, ["width", "height", "maxWidth", "borderRadius", "objectFit", "objectPosition", "marginTop", "marginLeft", "marginRight", "display", "position"]) };
    out.headshotParent = { rect: R(headshot ? headshot.parentElement : null), style: S(headshot ? headshot.parentElement : null, ["position", "display", "width", "height", "top", "left", "transform"]) };
    out.name = { t: TXT(name), rect: R(name), style: S(name, [...FONT, "margin"]), lines: LINES(name) };
    out.role = { t: TXT(role), rect: R(role), style: S(role, [...FONT, "margin"]), lines: LINES(role) };
    out.bio = { t: TXT(bio), rect: R(bio), style: S(bio, [...FONT, "margin", "height", "overflow", "padding"]), lines: LINES(bio) };
    out.beachImg = { rect: R(beachImg), style: S(beachImg, ["width", "height", "objectFit", "position", "bottom", "borderRadius"]) };
    out.beachName = { t: TXT(beachName), rect: R(beachName), style: S(beachName, [...FONT, "position", "bottom", "left", "margin"]), lines: LINES(beachName) };
    out.rm = { t: TXT(rm), rect: R(rm), style: S(rm, [...FONT, "margin", "display", "gap"]), lines: LINES(rm) };
    out.rmLink = { rect: R(rmLink), style: S(rmLink, ["display", "gap", "margin", "alignItems"]) };
    out.arrow = { rect: R(arrow), style: S(arrow, ["width", "height", "objectFit", "filter", "backgroundColor", "display"]), src: arrow ? (arrow.getAttribute("src") || arrow.className.toString().slice(0, 120)) : null };
    out.card0Html = c0.outerHTML.replace(/srcset="[^"]*"/g, 'srcset="…"').replace(/src="[^"]*"/g, 'src="…"').slice(0, 1400);
  }

  // second card (for row/pitch)
  if (cards[1]) out.card1Rect = R(cards[1]);
  if (cards[3]) out.card3Rect = R(cards[3]);

  // --- CTA
  const cta = byText("h2, h1, h3", "Ready for great dental health");
  out.cta = { t: TXT(cta), rect: R(cta), style: S(cta, [...FONT, "margin", "padding"]), lines: LINES(cta) };
  out.ctaParent = { rect: R(cta ? cta.parentElement : null), style: S(cta ? cta.parentElement : null, ["padding", "margin", "maxWidth"]) };
  // the section that owns the CTA
  let ctaSec = cta;
  while (ctaSec && ctaSec.tagName !== "SECTION" && ctaSec.tagName !== "FOOTER") ctaSec = ctaSec.parentElement;
  out.ctaSec = { cls: ctaSec ? ctaSec.className.toString().slice(0, 100) : null, rect: R(ctaSec), style: S(ctaSec, ["padding", "margin"]) };

  return out;
};

const browser = await chromium.launch();
const result = {};
try {
  for (const [name, url] of [["live", LIVE], ["cand", CAND]]) {
    result[name] = {};
    for (const w of VPS) {
      const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, deviceScaleFactor: 1 });
      const page = await ctx.newPage();
      await page.goto(url, { waitUntil: "load", timeout: 120000 });
      await page.waitForTimeout(1500);
      await settle(page);
      result[name][w] = await page.evaluate(measure, name);
      await ctx.close();
      console.error(`done ${name} ${w}`);
    }
  }
} finally {
  await browser.close();
}
fs.writeFileSync("/Users/tuckerlemos/Documents/GitHub/beachfront-dentistry/matching/otv-main.json", JSON.stringify(result, null, 1));
console.log("written");
