import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";

// Verify the shared-chrome batch: subpage hero heading, hero wave, CTA heading,
// FIJI band. live vs candidate at the 3 matrix viewports.
const PAGES = [
  ["our-team", "/our-team", "/dev/match/our-team"],
  ["services", "/services", "/dev/match/services"],
  ["contact", "/contact-us", "/contact-us"],
];
const VWS = [1440, 834, 390];

const read = async (p) =>
  p.evaluate(() => {
    const px = (v) => Math.round(v * 10) / 10;
    const out = {};
    // hero heading = the first big white h2 in the top band
    const h2s = [...document.querySelectorAll("h1,h2")].filter((e) => {
      const r = e.getBoundingClientRect();
      return r.top + scrollY < 900 && r.height > 20 && e.textContent.trim();
    });
    const hero = h2s[0];
    if (hero) {
      const cs = getComputedStyle(hero);
      const r = hero.getBoundingClientRect();
      out.heroH2 = `${cs.fontSize}/${cs.lineHeight} x=${px(r.left)} y=${px(r.top + scrollY)} ${px(r.width)}x${px(r.height)} mb=${cs.marginBottom} ta=${cs.textAlign} "${hero.textContent.trim().slice(0, 18)}"`;
    }
    // hero band + its wave
    const svg = document.querySelector("svg[viewBox='0 0 1200 120']");
    if (svg) {
      const r = svg.getBoundingClientRect();
      out.wave1 = `h=${px(r.height)} y=${px(r.top + scrollY)}`;
    }
    // top/bottom gradient heights
    const grads = [
      ...document.querySelectorAll("div[aria-hidden='true']"),
    ].filter((e) => /gradient/.test(getComputedStyle(e).backgroundImage));
    if (grads.length)
      out.grads = grads
        .slice(0, 2)
        .map((e) => `${px(e.getBoundingClientRect().height)}`)
        .join("/");
    // CTA heading
    const cta = [...document.querySelectorAll("h1,h2")].find((e) =>
      /^Ready for great/i.test(e.textContent.trim()),
    );
    if (cta) {
      const cs = getComputedStyle(cta);
      const r = cta.getBoundingClientRect();
      out.ctaH2 = `${cs.fontSize}/${cs.lineHeight} x=${px(r.left)} ${px(r.width)}x${px(r.height)} m=${cs.marginTop}/${cs.marginBottom}`;
    }
    return out;
  });

const b = await chromium.launch();
try {
  for (const [tag, livePath, candPath] of PAGES) {
    for (const vw of VWS) {
      const row = [];
      for (const [side, base, path] of [
        ["ref ", "https://www.beachfrontdentistry.com", livePath],
        ["cand", "http://localhost:5173", candPath],
      ]) {
        const p = await b.newPage({ viewport: { width: vw, height: 900 } });
        await p.goto(base + path, { waitUntil: "networkidle", timeout: 60000 });
        const H = await p.evaluate(() => document.body.scrollHeight);
        for (let y = 0; y < H; y += 250) {
          await p.evaluate((v) => scrollTo(0, v), y);
          await p.waitForTimeout(40);
        }
        await p.evaluate(() => scrollTo(0, 0));
        await p.waitForTimeout(800);
        row.push([side, await read(p)]);
        await p.close();
      }
      console.log(`\n--- ${tag} @${vw}`);
      for (const [side, o] of row)
        for (const k of Object.keys(o))
          console.log(`   ${side} ${k.padEnd(6)} ${o[k]}`);
    }
  }
} finally {
  await b.close();
}
