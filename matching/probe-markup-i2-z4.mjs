// Name the occluder by GEOMETRY, not hit-testing: at the worst scroll
// position, diff shipped-vs-raised, then find which real elements' boxes
// contain the changed pixels and where they sit in paint order relative to
// the float wrapper.
import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";
import { PNG } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/pngjs/lib/png.js";
import { writeFileSync } from "node:fs";

const BASE = process.env.BASE || "http://localhost:5173";
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();
await p.goto(`${BASE}/`, { waitUntil: "networkidle", timeout: 60000 });
await p.evaluate(() => document.fonts.ready);
await p.evaluate(() => scrollTo({ top: 5821, behavior: "instant" }));
await p.waitForTimeout(700);

const rect = await p.evaluate(() => {
  const r = document
    .querySelector(".ask-the-doctor-headshot")
    .getBoundingClientRect();
  return {
    x: Math.round(r.left),
    y: Math.round(r.top),
    width: Math.round(r.width),
    height: Math.round(r.height),
  };
});
const before = await p.screenshot({ clip: rect });
await p.evaluate(() => {
  const w = document
    .querySelector(".ask-the-doctor-headshot")
    .closest("[class*='pointer-events-none']");
  w.style.zIndex = "99999";
});
await p.waitForTimeout(150);
const after = await p.screenshot({ clip: rect });
await p.evaluate(() => {
  const w = document
    .querySelector(".ask-the-doctor-headshot")
    .closest("[class*='pointer-events-none']");
  w.style.zIndex = "";
});

const A = PNG.sync.read(before),
  B = PNG.sync.read(after);
const mask = new PNG({ width: A.width, height: A.height });
let minX = 1e9,
  maxX = -1,
  minY = 1e9,
  maxY = -1,
  changed = 0;
for (let y = 0; y < A.height; y++)
  for (let x = 0; x < A.width; x++) {
    const i = (y * A.width + x) * 4;
    const diff =
      Math.abs(A.data[i] - B.data[i]) > 6 ||
      Math.abs(A.data[i + 1] - B.data[i + 1]) > 6 ||
      Math.abs(A.data[i + 2] - B.data[i + 2]) > 6;
    mask.data[i] = diff ? 255 : 20;
    mask.data[i + 1] = diff ? 0 : 20;
    mask.data[i + 2] = diff ? 0 : 20;
    mask.data[i + 3] = 255;
    if (diff) {
      changed++;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
  }
writeFileSync("matching/z-mask.png", PNG.sync.write(mask));
writeFileSync("matching/z-before.png", before);

// Which elements cover the changed band, and do they paint after the wrapper?
const band = {
  x: rect.x + minX,
  y: rect.y + minY,
  w: maxX - minX + 1,
  h: maxY - minY + 1,
};
const suspects = await p.evaluate(
  ({ band }) => {
    const wrap = document
      .querySelector(".ask-the-doctor-headshot")
      .closest("[class*='pointer-events-none']");
    const all = [...document.querySelectorAll("body *")];
    const order = new Map(all.map((e, i) => [e, i]));
    const cx = band.x + band.w / 2,
      cy = band.y + band.h / 2;
    return all
      .filter((e) => {
        if (e === wrap || wrap.contains(e)) return false;
        const r = e.getBoundingClientRect();
        if (r.width < 4 || r.height < 4) return false;
        const cs = getComputedStyle(e);
        if (cs.visibility === "hidden" || cs.opacity === "0") return false;
        const paints =
          cs.backgroundColor !== "rgba(0, 0, 0, 0)" ||
          cs.backgroundImage !== "none" ||
          e.tagName === "IMG";
        return (
          paints &&
          r.left <= cx &&
          r.right >= cx &&
          r.top <= cy &&
          r.bottom >= cy
        );
      })
      .map((e) => {
        const cs = getComputedStyle(e);
        return {
          el:
            e.tagName.toLowerCase() +
            (typeof e.className === "string" && e.className
              ? "." + e.className.trim().split(/\s+/).slice(0, 3).join(".")
              : ""),
          position: cs.position,
          zIndex: cs.zIndex,
          domAfterWrapper: order.get(e) > order.get(wrap),
        };
      });
  },
  { band },
);
await ctx.close();
await b.close();
console.log(
  JSON.stringify(
    {
      scrollY: 5821,
      headshotRect: rect,
      changedPx: changed,
      changedBandWithinHeadshot: {
        xFromLeft: minX,
        xTo: maxX,
        yFromTop: minY,
        yTo: maxY,
      },
      suspectsUnderThatBand: suspects,
    },
    null,
    1,
  ),
);
