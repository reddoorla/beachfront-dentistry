import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";
import { PNG } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/pngjs/lib/png.js";
import { writeFileSync } from "node:fs";

const LIVE = "https://www.beachfrontdentistry.com/services";
const CAND = "http://localhost:5173/dev/match/services";

async function settle(page) {
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 200) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 50));
    }
    window.scrollTo(0, document.body.scrollHeight);
    await new Promise((r) => setTimeout(r, 1000));
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 300));
  });
}

const px = (png, x, y) => {
  const i = (png.width * y + x) << 2;
  return `rgb(${png.data[i]},${png.data[i + 1]},${png.data[i + 2]})`;
};

const run = async () => {
  const b = await chromium.launch();
  try {
    for (const [name, url, sel] of [
      ["LIVE", LIVE, ".service-block .h-40pc"],
      ["CAND", CAND, 'article.service-block div[class*="rounded-b"]'],
    ]) {
      const ctx = await b.newContext({
        viewport: { width: 1440, height: 900 },
      });
      const page = await ctx.newPage();
      await page
        .goto(url, { waitUntil: "networkidle", timeout: 90000 })
        .catch(() => {});
      await page.waitForTimeout(1200);
      await settle(page);
      const el = await page.$(sel);
      const buf = await el.screenshot();
      writeFileSync(
        `/Users/tuckerlemos/Documents/GitHub/beachfront-dentistry/matching/svcdx-panel-${name}.png`,
        buf,
      );
      const png = PNG.sync.read(buf);
      const w = png.width,
        h = png.height;
      const samples = [0.05, 0.2, 0.4, 0.6, 0.8, 0.95].map(
        (f) =>
          `y${Math.round(f * 100)}%=${px(png, Math.round(w * 0.75), Math.min(h - 1, Math.round(h * f)))}`,
      );
      console.log(`${name} panel ${w}x${h}: ${samples.join(" ")}`);
      // whole-card shot for the seam / tooth
      const card = await page.$(
        name === "LIVE" ? ".service-block" : "article.service-block",
      );
      const cbuf = await card.screenshot();
      writeFileSync(
        `/Users/tuckerlemos/Documents/GitHub/beachfront-dentistry/matching/svcdx-card-${name}.png`,
        cbuf,
      );
      await ctx.close();
    }
    // fetch live assets
    const ctx = await b.newContext();
    const page = await ctx.newPage();
    for (const [n, u] of [
      [
        "tooth3",
        "https://cdn.prod.website-files.com/64af3f93339537d6b661b556/64b05fba95fa3003b8c411e7_icon%3Dtooth%203.svg",
      ],
      [
        "tooth2",
        "https://cdn.prod.website-files.com/64af3f93339537d6b661b556/64b05fba486da5a75e84f0d0_icon%3Dtooth%202.svg",
      ],
      [
        "arrow",
        "https://cdn.prod.website-files.com/64af3f93339537d6b661b556/64b070f15651708aded7ab3e_Arrow.svg",
      ],
    ]) {
      const r = await page.request.get(u);
      const t = await r.text();
      writeFileSync(
        `/Users/tuckerlemos/Documents/GitHub/beachfront-dentistry/matching/spec/live-${n}.svg`,
        t,
      );
      console.log(`\n--- ${n} (${t.length}b) ---\n${t.slice(0, 700)}`);
    }
    await ctx.close();
  } finally {
    await b.close();
  }
};
run();
