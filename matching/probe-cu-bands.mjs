import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";

const dump = (side) => {
  const q = (s) => document.querySelector(s);
  const g = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return `x${r.x.toFixed(1)} y${(r.y + scrollY).toFixed(1)} w${r.width.toFixed(1)} h${r.height.toFixed(1)} fs${cs.fontSize}/${cs.lineHeight} fd:${cs.flexDirection}`;
  };
  const sel =
    side === "live"
      ? {
          waveSvg: ".hero.contact .bot-wave svg",
          heading: "h2.contact-heading",
          hdr1: "section.info-section .footer-contact-header",
          hdr2: "section.info-section .footer-contact-block:nth-child(2) .footer-contact-header",
          row: "section.info-section .footer-contact-info",
          blockRow: "section.info-section .w-layout-hflex.su-flex-v-mobile",
          map: "section.info-section .footer-map",
          btn: "section.info-section a.button",
        }
      : {
          waveSvg: 'section[data-slice-type="hero"] svg',
          heading: 'section[data-slice-type="hero"] h2',
          hdr1: 'section[data-section="info"] h2',
          hdr2: 'section[data-section="info"] div > div:nth-child(2) h2',
          row: 'section[data-section="info"] a[href^="tel"]',
          blockRow: 'section[data-section="info"] > div',
          map: 'section[data-section="info"] iframe',
          btn: 'section[data-section="info"] a[href="#appointment"]',
        };
  const out = { root: getComputedStyle(document.documentElement).fontSize };
  for (const [k, s] of Object.entries(sel)) out[k] = g(q(s));
  return out;
};

const browser = await chromium.launch();
try {
  for (const vp of [1100, 992, 760, 700]) {
    const res = {};
    for (const [side, url] of [
      ["live", "https://www.beachfrontdentistry.com/contact-us"],
      ["cand", "http://localhost:5173/contact-us"],
    ]) {
      const ctx = await browser.newContext({
        viewport: { width: vp, height: 900 },
        deviceScaleFactor: 1,
      });
      const page = await ctx.newPage();
      await page
        .goto(url, { waitUntil: "networkidle", timeout: 60000 })
        .catch(() => {});
      await page.waitForTimeout(1200);
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 200) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 40));
        }
        window.scrollTo(0, document.body.scrollHeight);
        await new Promise((r) => setTimeout(r, 1000));
        window.scrollTo(0, 0);
        await new Promise((r) => setTimeout(r, 300));
      });
      res[side] = await page.evaluate(dump, side);
      await ctx.close();
    }
    console.log("#### vp", vp);
    for (const k of Object.keys(res.live)) {
      console.log(
        "  " + k.padEnd(9),
        "L",
        String(res.live[k]).padEnd(62),
        "C",
        res.cand[k],
      );
    }
  }
} finally {
  await browser.close();
}
