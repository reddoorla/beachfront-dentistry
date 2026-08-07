import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";
const b = await chromium.launch();
try {
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  for (const path of [
    "/services/dental-exams",
    "/services/cosmetic-dentistry",
    "/services/dental-implants",
  ]) {
    try {
      const resp = await p.goto("https://www.beachfrontdentistry.com" + path, {
        waitUntil: "networkidle",
        timeout: 45000,
      });
      if (!resp || resp.status() !== 200) {
        console.log(path, "->", resp && resp.status());
        continue;
      }
      const info = await p.evaluate(() => {
        const hero = document.querySelector(".hero");
        if (!hero) return { none: true };
        const imgs = [...hero.querySelectorAll("img")].map((i) => {
          const r = i.getBoundingClientRect();
          const cs = getComputedStyle(i);
          return {
            src: (i.currentSrc || i.src).slice(-60),
            w: Math.round(r.width),
            h: Math.round(r.height),
            z: cs.zIndex,
            op: cs.opacity,
            disp: cs.display,
          };
        });
        const bgs = [hero, ...hero.querySelectorAll("*")]
          .map((e) => {
            const bg = getComputedStyle(e).backgroundImage;
            return bg && bg.includes("url")
              ? {
                  cls: e.className.slice(0, 30),
                  bg: bg.match(/url\("?([^")]+)/)[1].slice(-55),
                }
              : null;
          })
          .filter(Boolean);
        return { heroClass: hero.className, imgs, bgs };
      });
      console.log("\n" + path, JSON.stringify(info, null, 1));
    } catch (e) {
      console.log(path, "ERR", e.message.slice(0, 40));
    }
  }
} finally {
  await b.close();
}
