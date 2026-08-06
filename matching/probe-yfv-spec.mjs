import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";

const TARGETS = {
  live: "https://www.beachfrontdentistry.com/your-first-visit",
  cand: "http://localhost:5190/dev/match/your-first-visit",
};

async function settle(page) {
  const h = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < h; y += 300) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(60);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);
}

function px(n) {
  return Math.round(n * 10) / 10;
}

async function probe(page, url, w) {
  await page.setViewportSize({ width: w, height: 900 });
  await page
    .goto(url, { waitUntil: "networkidle", timeout: 60000 })
    .catch(() => {});
  await page.waitForTimeout(800);
  await settle(page);

  const data = await page.evaluate(() => {
    const out = {};
    // All headings in document order
    out.headings = [...document.querySelectorAll("h1,h2,h3,h4")].map((el) => {
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return {
        tag: el.tagName,
        text: el.textContent.trim().replace(/\s+/g, " ").slice(0, 120),
        fs: cs.fontSize,
        fw: cs.fontWeight,
        color: cs.color,
        align: cs.textAlign,
        ff: cs.fontFamily.split(",")[0].replace(/["']/g, ""),
        top: Math.round(r.top + window.scrollY),
      };
    });

    // Top-level section census
    const main = document.querySelector("main") || document.body;
    const kids = [...main.children];
    out.sections = kids.map((el, i) => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      const h = [...el.querySelectorAll("h1,h2,h3")][0];
      return {
        i,
        tag: el.tagName,
        cls: (el.className || "").toString().slice(0, 60),
        top: Math.round(r.top + window.scrollY),
        height: Math.round(r.height),
        bg: cs.backgroundColor,
        heading: h
          ? h.textContent.trim().replace(/\s+/g, " ").slice(0, 80)
          : "",
      };
    });

    // Image census: count imgs, their sizes, container info
    out.imgCount = document.querySelectorAll("img").length;
    return out;
  });

  return data;
}

async function main() {
  const browser = await chromium.launch();
  const result = {};
  try {
    for (const [name, url] of Object.entries(TARGETS)) {
      result[name] = {};
      for (const w of [1440, 390]) {
        const page = await browser.newPage();
        try {
          result[name][w] = await probe(page, url, w);
        } catch (e) {
          result[name][w] = { error: String(e).slice(0, 200) };
        } finally {
          await page.close();
        }
      }
    }
  } finally {
    await browser.close();
  }
  console.log(JSON.stringify(result, null, 1));
}
main();
