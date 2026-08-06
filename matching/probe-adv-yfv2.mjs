import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";

const LIVE = "https://www.beachfrontdentistry.com/your-first-visit";
const CAND = "http://localhost:5173/dev/match/your-first-visit";

const ROOTS = {
  live: {
    hero: ".hero.group-photo",
    toc: ".fv-toc-section",
    tour: ".fv-virtual-tour-section",
    meet: ".fv-meet-our-team-section",
    exam: ".fv-exam-section",
    rev: ".fv-review-section",
  },
  cand: {
    hero: "section[data-slice-variation='groupphoto']",
    toc: ".fv-toc-section",
    tour: "#office-tour",
    meet: "#meet-our-team",
    exam: "#first-exam",
    rev: "section[data-slice-variation='review']",
    cta: "section[data-slice-variation='cta']",
  },
};

async function settle(page) {
  await page.evaluate(async () => {
    const step = 200;
    const H = document.documentElement.scrollHeight;
    for (let y = 0; y < H; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 50));
    }
    window.scrollTo(0, H);
    await new Promise((r) => setTimeout(r, 1000));
  });
  await page.waitForTimeout(400);
}

async function run(browser, url, side, width) {
  const ctx = await browser.newContext({
    viewport: { width, height: 900 },
    deviceScaleFactor: 1,
    reducedMotion: "reduce",
  });
  const page = await ctx.newPage();
  try {
    await page.goto(url, { waitUntil: "load", timeout: 90000 });
    await page.waitForTimeout(2200);
    await settle(page);
    return await page.evaluate((roots) => {
      const out = {};
      const dump = (root) => {
        const rows = [];
        const walk = (el, depth) => {
          if (depth > 14) return;
          const cs = getComputedStyle(el);
          const r = el.getBoundingClientRect();
          const own = [...el.childNodes]
            .filter((n) => n.nodeType === 3)
            .map((n) => n.textContent.replace(/\s+/g, " ").trim())
            .join(" ")
            .trim();
          rows.push({
            d: depth,
            tag: el.tagName,
            cls: (typeof el.className === "string" ? el.className : "")
              .replace(/\s+/g, " ")
              .slice(0, 160),
            x: Math.round(r.x),
            y: Math.round(r.y + window.scrollY),
            w: Math.round(r.width * 10) / 10,
            h: Math.round(r.height * 10) / 10,
            disp: cs.display,
            pos: cs.position,
            f: `${cs.fontFamily.split(",")[0].replace(/['"]/g, "")}|${cs.fontWeight}|${cs.fontSize}/${cs.lineHeight}|${cs.letterSpacing}`,
            col: cs.color,
            bg: cs.backgroundColor,
            ta: cs.textAlign,
            pad: cs.padding,
            mar: cs.margin,
            rad: cs.borderRadius,
            fit: cs.objectFit,
            t: own.slice(0, 60),
            nw: el.tagName === "IMG" ? el.naturalWidth : undefined,
            nh: el.tagName === "IMG" ? el.naturalHeight : undefined,
          });
          for (const c of el.children) walk(c, depth + 1);
        };
        walk(root, 0);
        return rows;
      };
      for (const [k, s] of Object.entries(roots)) {
        const el = document.querySelector(s);
        out[k] = el ? dump(el) : null;
      }
      out.__page = {
        scrollHeight: document.documentElement.scrollHeight,
        bodyClientWidth: document.body.clientWidth,
      };
      return out;
    }, ROOTS[side]);
  } finally {
    await ctx.close();
  }
}

const browser = await chromium.launch();
const result = {};
try {
  for (const width of [1440, 834, 390]) {
    result[width] = {
      live: await run(browser, LIVE, "live", width),
      cand: await run(browser, CAND, "cand", width),
    };
    console.error("done", width);
  }
} finally {
  await browser.close();
}
console.log(JSON.stringify(result));
