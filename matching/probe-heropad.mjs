// Where does live place the hero text within the hero box, across the band?
import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";
const TARGETS = {
  cand: "http://localhost:5190/",
  live: "https://www.beachfrontdentistry.com/",
};
const VWS = [390, 480, 650];
const b = await chromium.launch();
try {
  for (const vw of VWS) {
    console.log(`vw${vw}`);
    for (const [k, url] of Object.entries(TARGETS)) {
      const p = await b.newPage({ viewport: { width: vw, height: 900 } });
      try {
        await p.goto(url, { waitUntil: "networkidle", timeout: 60000 });
        await p.evaluate(() => new Promise((r) => setTimeout(r, 400)));
        const m = await p.evaluate(() => {
          const h1 = [...document.querySelectorAll("h1")].find((e) =>
            /have a relaxed/i.test(e.textContent),
          );
          if (!h1) return null;
          // hero section = nearest ancestor section
          let sec = h1.closest("section") || h1.parentElement;
          const sb = sec.getBoundingClientRect(),
            hb = h1.getBoundingClientRect();
          const pill = [...document.querySelectorAll("a,button")].find((e) =>
            /make (an )?appointment/i.test(e.textContent),
          );
          const pb = pill ? pill.getBoundingClientRect() : null;
          return {
            heroH: Math.round(sb.height),
            h1TopInHero: Math.round(hb.top - sb.top),
            h1BottomToHeroBottom: Math.round(sb.bottom - hb.bottom),
            pillBottomToHeroBottom: pb
              ? Math.round(sb.bottom - pb.bottom)
              : null,
          };
        });
        console.log(
          `  ${k}: heroH=${m?.heroH} h1Top=${m?.h1TopInHero} h1→bot=${m?.h1BottomToHeroBottom} pill→bot=${m?.pillBottomToHeroBottom}`,
        );
      } catch (e) {
        console.log(`  ${k}: ERR ${e.message.split("\n")[0]}`);
      } finally {
        await p.close();
      }
    }
  }
} finally {
  await b.close();
}
