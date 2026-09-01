// Decisive occlusion test: screenshot the headshot's OWN rect as it ships,
// then again with its wrapper's z-index raised to 9999. Same geometry, same
// scroll, one variable. Any pixel difference is something painting over it.
// Also reads live's z-index on the card + its header, since the fix should
// mirror the reference's relationship, not a number I like.
import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";
import { PNG } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/pngjs/lib/png.js";

const BASE = process.env.BASE || "http://localhost:5173";
const REF = "https://beachfront-dentistry.webflow.io";
const b = await chromium.launch();

// --- ours: is it occluded? -------------------------------------------------
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();
await p.goto(`${BASE}/`, { waitUntil: "networkidle", timeout: 60000 });
await p.evaluate(() => document.fonts.ready);
await p.evaluate(() => {
  const cards = [...document.querySelectorAll(".qa-item")];
  const t = cards[Math.min(2, cards.length - 1)];
  scrollTo({ top: t.getBoundingClientRect().top + scrollY - 40, behavior: "instant" });
});
await p.waitForTimeout(1500);

const rect = await p.evaluate(() => {
  const s = document.querySelector(".ask-the-doctor-headshot");
  const r = s.getBoundingClientRect();
  return { x: Math.round(r.left), y: Math.round(r.top), width: Math.round(r.width), height: Math.round(r.height) };
});
const asShipped = await p.screenshot({ clip: rect });
await p.evaluate(() => {
  const w = document.querySelector(".ask-the-doctor-headshot").closest("[class*='pointer-events-none']");
  w.style.zIndex = "9999";
});
await p.waitForTimeout(200);
const raised = await p.screenshot({ clip: rect });

const A = PNG.sync.read(asShipped), B = PNG.sync.read(raised);
let changed = 0;
const rows = {};
for (let y = 0; y < A.height; y++) {
  for (let x = 0; x < A.width; x++) {
    const i = (y * A.width + x) * 4;
    if (Math.abs(A.data[i] - B.data[i]) > 6 || Math.abs(A.data[i+1] - B.data[i+1]) > 6 || Math.abs(A.data[i+2] - B.data[i+2]) > 6) {
      changed++; rows[y] = (rows[y] || 0) + 1;
    }
  }
}
const bandRows = Object.keys(rows).map(Number).sort((a, z) => a - z);
const ourZ = await p.evaluate(() => {
  const card = document.querySelector(".qa-item");
  const header = card.querySelector("button");
  const wrap = document.querySelector(".ask-the-doctor-headshot").closest("[class*='pointer-events-none']");
  const z = (e) => e ? `${getComputedStyle(e).position}/${getComputedStyle(e).zIndex}` : null;
  return { floatWrapper: z(wrap), card: z(card), cardHeader: z(header) };
});
await ctx.close();

// --- live: what is the reference's relationship? ---------------------------
const ctx2 = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p2 = await ctx2.newPage();
await p2.goto(REF, { waitUntil: "networkidle", timeout: 60000 });
const liveZ = await p2.evaluate(() => {
  const z = (e) => e ? `${getComputedStyle(e).position}/${getComputedStyle(e).zIndex}` : null;
  const card = document.querySelector(".qa-block");
  const anchor = document.querySelector(".ask-the-doctor-handwriting-anchor");
  const shot = document.querySelector(".ask-the-doctor-headshot");
  return {
    anchor: z(anchor), headshot: z(shot), card: z(card),
    cardHeader: z(card && (card.querySelector(".qa-header") || card.firstElementChild)),
  };
});
await ctx2.close();
await b.close();

console.log(JSON.stringify({
  occlusion: {
    headshotRect: rect,
    pixelsChangedWhenRaised: changed,
    pctOfHeadshotBox: +((changed / (A.width * A.height)) * 100).toFixed(1),
    occludedRowsTopToBottom: bandRows.length ? `${bandRows[0]}..${bandRows[bandRows.length-1]} of ${A.height}` : "none",
    verdict: changed > 50 ? "OCCLUDED — something paints over the headshot" : "clear",
  },
  ourZ, liveZ,
}, null, 1));
