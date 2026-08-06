import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";
const LIVE = "https://www.beachfrontdentistry.com/ask-the-doctor";
const CAND = "http://localhost:5173/dev/match/ask-the-doctor";
const browser = await chromium.launch();
try {
  for (const [side, url] of [
    ["live", LIVE],
    ["cand", CAND],
  ]) {
    const ctx = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1,
    });
    const page = await ctx.newPage();
    await page.goto(url, { waitUntil: "networkidle", timeout: 90000 });
    await page.waitForTimeout(1000);
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 200) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 45));
      }
      window.scrollTo(0, document.body.scrollHeight);
      await new Promise((r) => setTimeout(r, 1200));
      window.scrollTo(0, 0);
      await new Promise((r) => setTimeout(r, 300));
    });
    const res = await page.evaluate(() => {
      const norm = (s) => s.replace(/\s+/g, " ").trim();
      const walk = (el, depth, out) => {
        for (const c of el.children) {
          const r = c.getBoundingClientRect();
          if (r.height < 6) continue;
          const tag = c.tagName.toLowerCase();
          if (
            ["header", "nav", "section", "footer", "main"].includes(tag) ||
            depth < 2
          ) {
            out.push({
              d: depth,
              tag,
              cls: (c.className || "").toString().slice(0, 60),
              y: +(r.y + window.scrollY).toFixed(0),
              h: +r.height.toFixed(0),
              txt: norm(c.textContent).slice(0, 50),
            });
            if (depth < 2) walk(c, depth + 1, out);
          }
        }
        return out;
      };
      const out = walk(document.body, 0, []);
      const hdr = document.querySelector("header, .header, nav");
      const ftr = document.querySelector("footer, .footer");
      const R = (e) => {
        if (!e) return null;
        const r = e.getBoundingClientRect();
        return `[${r.x.toFixed(0)},${(r.y + window.scrollY).toFixed(0)} ${r.width.toFixed(0)}x${r.height.toFixed(0)}]`;
      };
      return {
        out,
        hdr: (hdr ? hdr.tagName + "." + hdr.className : "NONE") + " " + R(hdr),
        ftr: (ftr ? ftr.tagName + "." + ftr.className : "NONE") + " " + R(ftr),
        pageH: document.documentElement.scrollHeight,
      };
    });
    console.log("=====", side, "pageH", res.pageH);
    console.log("header:", res.hdr);
    console.log("footer:", res.ftr);
    for (const s of res.out)
      console.log(
        `${" ".repeat(s.d * 2)}${s.y}\t${s.h}\t${s.tag}.${s.cls}\t${s.txt}`,
      );
    await ctx.close();
  }
} finally {
  await browser.close();
}
