import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";

const URL = "https://www.beachfrontdentistry.com/services";

async function settle(page) {
  await page.evaluate(async () => {
    await new Promise((res) => {
      let y = 0;
      const step = () => {
        window.scrollTo(0, y);
        y += 300;
        if (y < document.body.scrollHeight) setTimeout(step, 40);
        else {
          window.scrollTo(0, 0);
          setTimeout(res, 300);
        }
      };
      step();
    });
  });
  await page.waitForTimeout(400);
}

async function probe(page) {
  return await page.evaluate(() => {
    const t = (el) => {
      if (!el) return null;
      const c = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return {
        tag: el.tagName.toLowerCase(),
        cls: (el.className || "").toString(),
        w: Math.round(r.width * 100) / 100,
        h: Math.round(r.height * 100) / 100,
        x: Math.round(r.x * 100) / 100,
        y: Math.round(r.y * 100) / 100,
        ff: c.fontFamily,
        fw: c.fontWeight,
        fs: c.fontSize,
        lh: c.lineHeight,
        ls: c.letterSpacing,
        color: c.color,
        ta: c.textAlign,
        tt: c.textTransform,
        bg: c.backgroundColor,
        bgImg: c.backgroundImage.slice(0, 90),
        br: c.borderRadius,
        pad: c.padding,
        margin: c.margin,
        pos: c.position,
        top: c.top,
        right: c.right,
        bottom: c.bottom,
        left: c.left,
        disp: c.display,
        mw: c.maxWidth,
      };
    };
    const out = {};
    const blocks = [...document.querySelectorAll(".service-block")];
    const b0 = blocks[0];
    const top = b0.querySelector('.h-60pc,[class*="h-60"]');
    out.topChildren = [...top.children].map(t);
    out.heading0 = t(top.querySelector("h1,h2,h3,h4,h5"));
    out.para0 = t([...top.querySelectorAll("p")][0]);
    out.allImgsBlock0 = [...b0.querySelectorAll("img")].map((im) => ({
      ...t(im),
      src: im.getAttribute("src"),
      sizes: im.getAttribute("sizes"),
    }));
    out.teefEls = [...b0.querySelectorAll('[class*="teef"]')].map((e) => ({
      ...t(e),
      src: e.getAttribute && e.getAttribute("src"),
      bi: getComputedStyle(e).backgroundImage.slice(0, 110),
    }));
    out.bgImgEls = [...b0.querySelectorAll("*")]
      .filter((e) => {
        const bi = getComputedStyle(e).backgroundImage;
        return bi && bi !== "none";
      })
      .map((e) => ({
        ...t(e),
        bi: getComputedStyle(e).backgroundImage.slice(0, 110),
      }));

    const b1 = blocks[1];
    const bottom1 = b1.querySelector('.h-40pc,[class*="h-40"]');
    out.card1halves = [
      ...bottom1.querySelectorAll('._w-half,[class*="w-half"]'),
    ].map((h) => ({
      cls: (h.className || "").toString(),
      w: Math.round(h.getBoundingClientRect().width),
      x: Math.round(h.getBoundingClientRect().x),
      linkCount: h.querySelectorAll("a").length,
    }));
    out.card1links = [...bottom1.querySelectorAll("a")].map((a) => {
      const r = a.getBoundingClientRect();
      return {
        x: Math.round(r.x),
        y: Math.round(r.y),
        w: Math.round(r.width),
        txt: (a.innerText || "").trim().slice(0, 22),
      };
    });

    const bottom0 = b0.querySelector('.h-40pc,[class*="h-40"]');
    out.card0halves = [
      ...bottom0.querySelectorAll('._w-half,[class*="w-half"]'),
    ].map((h) => ({
      cls: (h.className || "").toString(),
      linkCount: h.querySelectorAll("a").length,
      w: Math.round(h.getBoundingClientRect().width),
    }));

    const weOffer = document.querySelector(".we-offer-section");
    out.weOffer = t(weOffer);
    out.weOfferInner = [...weOffer.querySelectorAll("h1,h2,h3,h4,p,div")]
      .slice(0, 5)
      .map((e) => ({ ...t(e), txt: (e.innerText || "").trim().slice(0, 80) }));

    const footer = document.querySelector(".footer");
    const cand = [...footer.querySelectorAll("h1,h2,h3,h4")].find((h) =>
      /ready/i.test(h.innerText || ""),
    );
    out.cta = cand
      ? { ...t(cand), txt: (cand.innerText || "").replace(/\n/g, " ").trim() }
      : null;
    out.footerH = Math.round(footer.getBoundingClientRect().height);
    out.footerBg = getComputedStyle(footer).backgroundColor;
    out.footerBgImg = getComputedStyle(footer).backgroundImage.slice(0, 90);
    return out;
  });
}

const browser = await chromium.launch({ headless: true });
try {
  const results = {};
  for (const width of [1440, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await page.goto(URL, { waitUntil: "networkidle", timeout: 60000 });
    await settle(page);
    results[width] = await probe(page);
    await page.close();
  }
  console.log(JSON.stringify(results, null, 1));
} finally {
  await browser.close();
}
