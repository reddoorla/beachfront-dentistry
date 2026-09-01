// The tie the markup predicts:
//   float wrapper   .pointer-events-none  absolute z-10   (DOM: before cards)
//   card header     button                relative z-10   (DOM: after wrapper)
// Equal z-index in the same stacking context => LATER DOM WINS => headers
// paint over the doctor. That only bites once a card has no transform of its
// own; a transformed element makes its own stacking context and would keep the
// header contained. animateIn used to leave an inline transform on forever —
// I1 made it release on transitionend, which is what would expose this.
//
// So: check the transform state of a revealed card, then find a scroll where
// the headshot spans a header bar and diff shipped vs z-30.
import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";
import { PNG } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/pngjs/lib/png.js";

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();
await p.goto((process.env.BASE || "http://localhost:5173") + "/", { waitUntil: "networkidle", timeout: 60000 });
await p.evaluate(() => document.fonts.ready);

// Scroll so a header bar sits inside the headshot's vertical span.
const found = await p.evaluate(() => {
  const cards = [...document.querySelectorAll(".qa-item")];
  for (let step = 0; step < 200; step++) {
    const y = 3600 + step * 40;
    scrollTo({ top: y, behavior: "instant" });
    const shot = document.querySelector(".ask-the-doctor-headshot").getBoundingClientRect();
    for (const c of cards) {
      const h = c.querySelector("button");
      if (!h) continue;
      const hr = h.getBoundingClientRect();
      // header must overlap the headshot's box vertically AND horizontally
      if (hr.bottom > shot.top + 10 && hr.top < shot.bottom - 10 && hr.right > shot.left + 4) {
        return { y, header: { top: hr.top, bottom: hr.bottom, right: hr.right },
                 shot: { top: shot.top, left: shot.left, right: shot.right, bottom: shot.bottom } };
      }
    }
  }
  return null;
});
if (!found) { console.log("no overlapping position found"); await b.close(); process.exit(0); }
await p.waitForTimeout(900);

const state = await p.evaluate(() => {
  const cards = [...document.querySelectorAll(".qa-item")];
  const withTransform = cards.filter((c) => {
    const t = getComputedStyle(c).transform;
    return t && t !== "none";
  }).length;
  const card = cards[0];
  const inner = card.querySelector("[class*='rounded-[25px]']") || card.firstElementChild;
  const cs = (e) => e ? { position: getComputedStyle(e).position, z: getComputedStyle(e).zIndex, transform: getComputedStyle(e).transform === "none" ? "none" : "set" } : null;
  return { cardsTotal: cards.length, cardsStillTransformed: withTransform,
           card: cs(card), cardInner: cs(inner), header: cs(card.querySelector("button")),
           wrapper: cs(document.querySelector(".ask-the-doctor-headshot").closest("[class*='pointer-events-none']")) };
});

const clip = {
  x: Math.round(found.shot.left), y: Math.round(Math.max(0, found.shot.top)),
  width: Math.round(found.shot.right - found.shot.left),
  height: Math.round(Math.min(900, found.shot.bottom) - Math.max(0, found.shot.top)),
};
const shipped = await p.screenshot({ clip });
await p.evaluate(() => {
  document.querySelector(".ask-the-doctor-headshot").closest("[class*='pointer-events-none']").style.zIndex = "30";
});
await p.waitForTimeout(150);
const fixed = await p.screenshot({ clip });

const A = PNG.sync.read(shipped), B = PNG.sync.read(fixed);
const rows = new Array(A.height).fill(0);
let changed = 0;
for (let y = 0; y < A.height; y++) for (let x = 0; x < A.width; x++) {
  const i = (y * A.width + x) * 4;
  if (Math.abs(A.data[i]-B.data[i])>10 || Math.abs(A.data[i+1]-B.data[i+1])>10 || Math.abs(A.data[i+2]-B.data[i+2])>10) { changed++; rows[y]++; }
}
const solid = rows.map((n, y) => ({ y, n })).filter((r) => r.n > A.width * 0.1);
await ctx.close(); await b.close();
console.log(JSON.stringify({
  scrollY: found.y, state,
  headerBandOnScreen: { top: +found.header.top.toFixed(1), bottom: +found.header.bottom.toFixed(1) },
  headshotBox: clip,
  changedPx: changed, pct: +((changed / (A.width * A.height)) * 100).toFixed(1),
  changedRowsWithBroadChange: solid.length ? `${solid[0].y}..${solid[solid.length-1].y} (screen y ${clip.y + solid[0].y}..${clip.y + solid[solid.length-1].y})` : "none",
  verdict: solid.length > 5 ? "REAL OCCLUSION — a solid band changes when z is raised" : "no solid band; scattered pixels are AA only",
}, null, 1));
