import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";
import fs from "node:fs";

const LIVE = "https://www.beachfrontdentistry.com/services";
const CAND = "http://localhost:5173/dev/match/services";
const VPS = [1440, 834, 600, 390];

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
  const q = (s) => document.querySelector(s);
  const qa = (s) => [...document.querySelectorAll(s)];
  out.root = getComputedStyle(document.documentElement).fontSize;
  out.scrollHeight = document.documentElement.scrollHeight;

  // ---- h6 link labels (live: <a><h6 class=services-links>text</h6><img></a>)
  const cards = qa(".service-block");
  out.labels = cards.map((c) => {
    const a = c.querySelector("a");
    if (!a) return null;
    const kids = [...a.children];
    const lab =
      kids.find((k) => /H6|SPAN/.test(k.tagName)) || a.firstElementChild;
    const img = kids.find((k) => /IMG|SVG/.test(k.tagName));
    return {
      aRect: R(a),
      aStyle: S(a, [
        "display",
        "gap",
        "alignItems",
        "justifyContent",
        "padding",
      ]),
      labTag: lab ? lab.tagName : null,
      labText: lab ? lab.textContent.trim() : null,
      labRect: R(lab),
      labStyle: S(lab, [
        "fontFamily",
        "fontWeight",
        "fontSize",
        "lineHeight",
        "letterSpacing",
        "color",
        "marginRight",
        "marginBottom",
        "textTransform",
      ]),
      imgTag: img ? img.tagName : null,
      imgRect: R(img),
      imgStyle: S(img, [
        "opacity",
        "width",
        "height",
        "marginLeft",
        "marginRight",
      ]),
      gapPx:
        lab && img
          ? px(
              img.getBoundingClientRect().x - lab.getBoundingClientRect().right,
            )
          : null,
    };
  });

  // ---- card geometry short form (for the 600 tier)
  out.cardsShort = cards.map((c) => ({
    ...R(c),
    h3: c.querySelector("h3")?.textContent.trim(),
  }));
  const grid = q(".service-grid") || (cards[0] ? cards[0].parentElement : null);
  out.grid = {
    rect: R(grid),
    style: S(grid, [
      "gridTemplateColumns",
      "gridTemplateRows",
      "rowGap",
      "marginTop",
      "marginBottom",
      "paddingTop",
      "paddingBottom",
    ]),
  };
  const heroH2 =
    q("h2.subpage-hero-heading") || q('[data-slice-variation="subpage"] h2');
  out.heroH2 = {
    rect: R(heroH2),
    style: S(heroH2, ["fontSize", "lineHeight", "marginBottom"]),
  };

  // ---- CTA band region: everything between the CTA h2 and the footer info
  const ctaH2 = [...qa("h2")].find((h) =>
    /Ready for great dental health/i.test(h.textContent),
  );
  out.ctaH2 = {
    rect: R(ctaH2),
    style: S(ctaH2, [
      "fontSize",
      "lineHeight",
      "marginTop",
      "marginBottom",
      "maxWidth",
    ]),
  };
  // walk the CTA container's descendants and list anything with a rect
  const ctaRoot = ctaH2 ? ctaH2.closest("section") : null;
  out.ctaRoot = {
    rect: R(ctaRoot),
    cls: ctaRoot ? ctaRoot.className.toString().slice(0, 80) : null,
  };
  const walk = (root, depth) => {
    const rows = [];
    const rec = (el, d) => {
      if (d > depth) return;
      for (const ch of el.children) {
        const r = R(ch);
        if (r && (r.h > 4 || r.w > 4)) {
          rows.push({
            d,
            tag: ch.tagName.toLowerCase(),
            cls: (ch.className || "").toString().slice(0, 70),
            txt: (ch.textContent || "")
              .trim()
              .replace(/\s+/g, " ")
              .slice(0, 32),
            ...r,
          });
        }
        rec(ch, d + 1);
      }
    };
    rec(root, 0);
    return rows;
  };
  out.ctaTree = ctaRoot ? walk(ctaRoot, 2) : null;

  // ---- beach band: element whose background-image contains "beach"
  const beach = [...qa("div,section,img")].find((e) => {
    const bi = getComputedStyle(e).backgroundImage;
    return (
      (/beach|fiji|unsplash/i.test(bi) && bi !== "none") ||
      /beach|fiji/i.test(e.getAttribute("src") || "")
    );
  });
  out.beach = beach
    ? {
        tag: beach.tagName.toLowerCase(),
        cls: (beach.className || "").toString().slice(0, 80),
        rect: R(beach),
        style: S(beach, [
          "height",
          "minHeight",
          "marginBottom",
          "backgroundSize",
          "backgroundPosition",
        ]),
      }
    : null;

  // ---- footer info block
  const fInfo =
    q(".footer-info-section") ||
    (() => {
      const l = [...qa("h5,h4,h3,h2,p,div")].find((e) =>
        /^Want to learn more/i.test(e.textContent.trim()),
      );
      let n = l;
      while (
        n &&
        n.tagName !== "FOOTER" &&
        !/footer/i.test((n.className || "").toString())
      )
        n = n.parentElement;
      return n;
    })();
  out.footerInfo = {
    tag: fInfo ? fInfo.tagName.toLowerCase() : null,
    cls: fInfo ? (fInfo.className || "").toString().slice(0, 70) : null,
    rect: R(fInfo),
    style: S(fInfo, ["paddingTop", "paddingBottom", "backgroundColor"]),
  };
  out.footerTree = fInfo ? walk(fInfo, 1) : null;
  // footer wave svg = any svg above/at the footer top
  const svgs = qa("svg").map((s) => ({
    r: R(s),
    cls: (s.parentElement?.className || "").toString().slice(0, 50),
  }));
  out.svgs = svgs.filter((s) => s.r && s.r.h > 20);

  // ---- nav burger: any button/div in the header
  const hdr = q("section.header") || q("header") || q("nav");
  out.nav = { rect: R(hdr), style: S(hdr, ["height"]) };
  out.navTree = hdr ? walk(hdr, 3) : null;

  return out;
};

const measure = async (page, url) => {
  await page
    .goto(url, { waitUntil: "networkidle", timeout: 90000 })
    .catch(() => {});
  await page.waitForTimeout(1000);
  await page.evaluate(async () => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += 200) {
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
    "/Users/tuckerlemos/Documents/GitHub/beachfront-dentistry/matching/adv-verify-svc2.json",
    JSON.stringify(result, null, 1),
  );
  console.log("ok");
};
run();
