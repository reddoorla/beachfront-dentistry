import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";

const LIVE = "https://www.beachfrontdentistry.com/ask-the-doctor";
const CAND = "http://localhost:5173/dev/match/ask-the-doctor";
const VPS = [1440, 834, 390];

async function settle(page) {
  await page.evaluate(async () => {
    const step = 200;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 50));
    }
    window.scrollTo(0, document.body.scrollHeight);
    await new Promise((r) => setTimeout(r, 1000));
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 400));
  });
}

const CENSUS = () => {
  const out = [];
  const push = (label, el) => {
    const r = el.getBoundingClientRect();
    out.push({
      label,
      tag: el.tagName.toLowerCase(),
      cls: (el.className && el.className.baseVal !== undefined
        ? el.className.baseVal
        : el.className || ""
      )
        .toString()
        .slice(0, 90),
      x: Math.round(r.x),
      y: Math.round(r.y + window.scrollY),
      w: Math.round(r.width),
      h: Math.round(r.height),
    });
  };
  document
    .querySelectorAll("body > *, body section, main > *, main section")
    .forEach((el, i) => {
      if (
        el.offsetParent === null &&
        getComputedStyle(el).position !== "fixed" &&
        el.getBoundingClientRect().height === 0
      )
        return;
      push("sec" + i, el);
    });
  return out;
};

const cardGeo = (sel) => {
  const cards = [...document.querySelectorAll(sel)];
  const rects = cards.map((c) => {
    const r = c.getBoundingClientRect();
    return {
      x: Math.round(r.x),
      y: Math.round(r.y + window.scrollY),
      w: Math.round(r.width),
      h: Math.round(r.height),
    };
  });
  return {
    count: cards.length,
    first: rects[0],
    second: rects[1],
    third: rects[2],
    last: rects[rects.length - 1],
    all: rects,
  };
};

function style(el) {
  const cs = getComputedStyle(el);
  const r = el.getBoundingClientRect();
  return {
    text: (el.textContent || "").trim().slice(0, 60),
    ff: cs.fontFamily.split(",")[0],
    fw: cs.fontWeight,
    fs: cs.fontSize,
    lh: cs.lineHeight,
    ls: cs.letterSpacing,
    color: cs.color,
    bg: cs.backgroundColor,
    tt: cs.textTransform,
    ta: cs.textAlign,
    x: Math.round(r.x),
    y: Math.round(r.y + window.scrollY),
    w: Math.round(r.width),
    h: Math.round(r.height),
  };
}

const browser = await chromium.launch();
const result = {};
try {
  for (const vp of VPS) {
    for (const [name, url] of [
      ["live", LIVE],
      ["cand", CAND],
    ]) {
      const ctx = await browser.newContext({
        viewport: { width: vp, height: 900 },
        deviceScaleFactor: 1,
      });
      const page = await ctx.newPage();
      await page
        .goto(url, { waitUntil: "networkidle", timeout: 90000 })
        .catch(() => {});
      await page.waitForTimeout(1200);
      await settle(page);
      const key = `${name}@${vp}`;
      const base = await page.evaluate(() => ({
        scrollHeight: document.body.scrollHeight,
        docScroll: document.documentElement.scrollHeight,
        clientWidth: document.body.clientWidth,
      }));
      const census = await page.evaluate(CENSUS);
      const cards = await page.evaluate(
        cardGeo,
        name === "live"
          ? ".qa-block"
          : "[data-slice-type='question_list'] [class*='qa'], [data-slice-type='question_list'] article, [data-slice-type='question_list'] li > *, [data-slice-type='question_list'] .grid > div > *",
      );
      // grid cells
      const cells = await page.evaluate(
        cardGeo,
        name === "live"
          ? ".ask-the-doctor-collection-item"
          : "[data-slice-type='question_list'] .grid > div",
      );
      // hero
      const hero = await page.evaluate((n) => {
        const f = (el) => {
          if (!el) return null;
          const cs = getComputedStyle(el);
          const r = el.getBoundingClientRect();
          return {
            cls: (el.className || "").toString().slice(0, 80),
            x: Math.round(r.x),
            y: Math.round(r.y + window.scrollY),
            w: Math.round(r.width),
            h: Math.round(r.height),
            bg: cs.backgroundColor,
            bgi: cs.backgroundImage.slice(0, 80),
          };
        };
        const sec = document.querySelector(
          n === "live" ? "section.hero" : "[data-slice-type='hero'], section",
        );
        return f(sec);
      }, name);
      // back to top
      const btt = await page.evaluate(() => {
        const a = [...document.querySelectorAll("a")].find((x) =>
          /back to top/i.test(x.textContent || ""),
        );
        if (!a) return null;
        const cs = getComputedStyle(a);
        const r = a.getBoundingClientRect();
        const pr = a.parentElement.getBoundingClientRect();
        return {
          text: a.textContent.trim(),
          href: a.getAttribute("href"),
          ff: cs.fontFamily.split(",")[0],
          fw: cs.fontWeight,
          fs: cs.fontSize,
          lh: cs.lineHeight,
          color: cs.color,
          border: cs.border,
          radius: cs.borderRadius,
          pad: cs.padding,
          x: Math.round(r.x),
          y: Math.round(r.y + window.scrollY),
          w: Math.round(r.width),
          h: Math.round(r.height),
          parentY: Math.round(pr.y + window.scrollY),
          parentH: Math.round(pr.height),
        };
      });
      // heading in hero
      const h2 = await page.evaluate(
        (s) => {
          const el = document.querySelector(s);
          if (!el) return null;
          const cs = getComputedStyle(el);
          const r = el.getBoundingClientRect();
          return {
            text: el.textContent.trim(),
            ff: cs.fontFamily.split(",")[0],
            fw: cs.fontWeight,
            fs: cs.fontSize,
            lh: cs.lineHeight,
            ls: cs.letterSpacing,
            color: cs.color,
            ta: cs.textAlign,
            x: Math.round(r.x),
            y: Math.round(r.y + window.scrollY),
            w: Math.round(r.width),
            h: Math.round(r.height),
          };
        },
        name === "live" ? ".subpage-hero-heading" : "h1, h2",
      );
      // titles list
      const titles = await page.evaluate(
        (s) =>
          [...document.querySelectorAll(s)].map((e) => e.textContent.trim()),
        name === "live"
          ? ".qa-question"
          : "[data-slice-type='question_list'] h5, [data-slice-type='question_list'] h3, [data-slice-type='question_list'] h4",
      );
      const nums = await page.evaluate(
        (s) =>
          [...document.querySelectorAll(s)].map((e) => e.textContent.trim()),
        name === "live"
          ? ".qa-circle"
          : "[data-slice-type='question_list'] h6, [data-slice-type='question_list'] .qa-circle",
      );
      result[key] = {
        base,
        hero,
        h2,
        cards: {
          count: cards.count,
          first: cards.first,
          second: cards.second,
          third: cards.third,
          last: cards.last,
        },
        cells: {
          count: cells.count,
          first: cells.first,
          second: cells.second,
          third: cells.third,
          last: cells.last,
        },
        btt,
        titles: titles.slice(0, 3),
        titlesCount: titles.length,
        nums: nums.slice(0, 5),
        numsCount: nums.length,
        census: census.slice(0, 40),
      };
      await ctx.close();
      console.log("done", key, base.scrollHeight);
    }
  }
} finally {
  await browser.close();
}
const fs = await import("node:fs");
fs.writeFileSync(
  "/Users/tuckerlemos/Documents/GitHub/beachfront-dentistry/matching/atd-audit.json",
  JSON.stringify(result, null, 1),
);
for (const vp of VPS) {
  console.log(
    `\n=== ${vp} === live H=${result["live@" + vp].base.scrollHeight} cand H=${result["cand@" + vp].base.scrollHeight}  clientW live=${result["live@" + vp].base.clientWidth} cand=${result["cand@" + vp].base.clientWidth}`,
  );
  console.log(
    " hero live",
    JSON.stringify(result["live@" + vp].hero),
    "\n hero cand",
    JSON.stringify(result["cand@" + vp].hero),
  );
  console.log(
    " h2 live",
    JSON.stringify(result["live@" + vp].h2),
    "\n h2 cand",
    JSON.stringify(result["cand@" + vp].h2),
  );
  console.log(
    " cards live",
    JSON.stringify(result["live@" + vp].cards),
    "\n cards cand",
    JSON.stringify(result["cand@" + vp].cards),
  );
  console.log(
    " cells live",
    JSON.stringify(result["live@" + vp].cells),
    "\n cells cand",
    JSON.stringify(result["cand@" + vp].cells),
  );
  console.log(
    " btt live",
    JSON.stringify(result["live@" + vp].btt),
    "\n btt cand",
    JSON.stringify(result["cand@" + vp].btt),
  );
  console.log(
    " titles live",
    result["live@" + vp].titlesCount,
    JSON.stringify(result["live@" + vp].titles),
    " nums",
    result["live@" + vp].numsCount,
    JSON.stringify(result["live@" + vp].nums),
  );
  console.log(
    " titles cand",
    result["cand@" + vp].titlesCount,
    JSON.stringify(result["cand@" + vp].titles),
    " nums",
    result["cand@" + vp].numsCount,
    JSON.stringify(result["cand@" + vp].nums),
  );
}
