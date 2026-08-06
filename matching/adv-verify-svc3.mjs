import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";
import fs from "node:fs";
import { PNG } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/pngjs/lib/png.js";

const LIVE = "https://www.beachfrontdentistry.com/services";
const CAND = "http://localhost:5173/dev/match/services";

const settle = async (page) => {
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
  await page.waitForTimeout(900);
};

const meta = () => {
  const px = (v) => Math.round(parseFloat(v) * 100) / 100;
  const R = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: px(r.x), y: px(r.y + window.scrollY), w: px(r.width), h: px(r.height) };
  };
  const q = (s) => document.querySelector(s);
  const qa = (s) => [...document.querySelectorAll(s)];
  const out = {};
  // intro paragraph + its section padding
  const intro =
    q(".we-offer-section p") ||
    [...qa("p")].find((p) => /We offer a wide array/i.test(p.textContent));
  out.intro = { rect: R(intro), lines: intro ? Math.round(intro.getBoundingClientRect().height / parseFloat(getComputedStyle(intro).lineHeight)) : null };
  const sec =
    q(".service-blocks-sections .content-width") ||
    (q(".service-block") ? q(".service-block").closest("section") : null);
  out.sec = {
    rect: R(sec),
    pad: sec ? [getComputedStyle(sec).paddingLeft, getComputedStyle(sec).paddingRight] : null,
  };
  // footer children breakdown
  const fInfo =
    q(".footer-info-section") ||
    (() => {
      const l = [...qa("*")].find((e) => e.children.length === 0 && /^Want to learn more/i.test(e.textContent.trim()));
      let n = l;
      while (n && n.tagName !== "FOOTER") n = n.parentElement;
      return n;
    })();
  out.fInfoRect = R(fInfo);
  const rows = [];
  const rec = (el, d) => {
    if (d > 2) return;
    for (const ch of el.children) {
      const r = R(ch);
      if (r && r.h > 4)
        rows.push({ d, tag: ch.tagName.toLowerCase(), cls: (ch.className || "").toString().slice(0, 55), txt: (ch.textContent || "").trim().replace(/\s+/g, " ").slice(0, 26), ...r });
      rec(ch, d + 1);
    }
  };
  if (fInfo) rec(fInfo, 0);
  out.fTree = rows;
  // panel rect of card 0 (page coords)
  const panel = q(".service-block .h-40pc") || (() => {
    const c = q(".service-block");
    return c ? c.children[c.children.length - 1] : null;
  })();
  out.panel = R(panel);
  return out;
};

const run = async () => {
  const browser = await chromium.launch();
  const result = {};
  try {
    for (const w of [1440, 600]) {
      const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, deviceScaleFactor: 1 });
      const page = await ctx.newPage();
      for (const [name, url] of [["live", LIVE], ["cand", CAND]]) {
        await page.goto(url, { waitUntil: "networkidle", timeout: 90000 }).catch(() => {});
        await page.waitForTimeout(900);
        await settle(page);
        const m = await page.evaluate(meta);
        result[`${name}@${w}`] = m;
        if (w === 1440 && m.panel) {
          const buf = await page.screenshot({
            clip: { x: m.panel.x, y: m.panel.y, width: m.panel.w, height: m.panel.h },
            fullPage: true,
          });
          const png = PNG.sync.read(buf);
          const sample = (fy) => {
            const y = Math.min(png.height - 1, Math.round(png.height * fy));
            const x = Math.round(png.width * 0.9);
            const i = (png.width * y + x) << 2;
            return `rgb(${png.data[i]},${png.data[i + 1]},${png.data[i + 2]})`;
          };
          result[`${name}@${w}`].pixels = {
            "10%": sample(0.1),
            "40%": sample(0.4),
            "60%": sample(0.6),
            "80%": sample(0.8),
            "97%": sample(0.97),
          };
        }
      }
      await ctx.close();
      console.error("done", w);
    }
  } finally {
    await browser.close();
  }
  fs.writeFileSync("/Users/tuckerlemos/Documents/GitHub/beachfront-dentistry/matching/adv-verify-svc3.json", JSON.stringify(result, null, 1));
  console.log(JSON.stringify(result, null, 1));
};
run();
