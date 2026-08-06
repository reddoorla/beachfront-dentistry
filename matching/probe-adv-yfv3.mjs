import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";

const LIVE = "https://www.beachfrontdentistry.com/your-first-visit";
const CAND = "http://localhost:5173/dev/match/your-first-visit";

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

async function run(browser, url, width) {
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
    return await page.evaluate(() => {
      const m = (el) => {
        if (!el) return null;
        const cs = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        return {
          tag: el.tagName,
          cls: (typeof el.className === "string" ? el.className : "").slice(0, 90),
          x: Math.round(r.x),
          y: Math.round(r.y + window.scrollY),
          w: Math.round(r.width * 10) / 10,
          h: Math.round(r.height * 10) / 10,
          f: `${cs.fontFamily.split(",")[0].replace(/['"]/g, "")}|${cs.fontWeight}|${cs.fontSize}/${cs.lineHeight}`,
          col: cs.color,
          ta: cs.textAlign,
          mar: cs.margin,
          t: (el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 50),
        };
      };
      const out = {};
      // CTA band: live .fiji-section, cand last hero/cta section
      const ctaRoot =
        document.querySelector(".fiji-section") ||
        document.querySelector("section[data-slice-variation='cta']");
      out.ctaRoot = m(ctaRoot);
      out.ctaH2 = m(ctaRoot && ctaRoot.querySelector("h1,h2"));
      // team names in order
      out.teamNames = [
        ...document.querySelectorAll(
          ".team-list-item h5, .fv-meet-our-team-section h5",
        ),
      ].map((e) => ({
        t: e.textContent.replace(/\s+/g, " ").trim(),
        x: Math.round(e.getBoundingClientRect().x),
      }));
      // toc download arrows
      out.tocArrows = [
        ...document.querySelectorAll(
          ".fv-toc-section .visit-list-item img, .visit-list-item img",
        ),
      ].map(m);
      // all OutlineButton / .button pills in toc + exam
      out.pills = [
        ...document.querySelectorAll(
          ".fv-toc-section a.button, .fv-exam-section a.button, .registration-forms-box a.button, .fv-toc-section a[class*='inline-flex'], #first-exam a[class*='inline-flex']",
        ),
      ].map(m);
      out.readMore = [
        ...document.querySelectorAll(
          ".team-teasewr-read-more, .team-list-item a[class*='inline']",
        ),
      ].map(m);
      out.page = {
        H: document.documentElement.scrollHeight,
        bw: document.body.clientWidth,
      };
      return out;
    });
  } finally {
    await ctx.close();
  }
}

const browser = await chromium.launch();
const res = {};
try {
  for (const w of [1440, 834, 390]) {
    res[w] = { live: await run(browser, LIVE, w), cand: await run(browser, CAND, w) };
    console.error("done", w);
  }
} finally {
  await browser.close();
}
console.log(JSON.stringify(res, null, 1));
