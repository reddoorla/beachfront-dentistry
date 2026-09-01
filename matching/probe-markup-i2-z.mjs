// Directive 5, part 1: "z indexes are wrong for the floating doctor."
//
// The claim to test is OCCLUSION, so the test is a difference mask, not a
// reading of computed z-index: render the overlap rect with the headshot
// visible and again with it hidden. If nothing changes, the headshot is not
// being painted there — whatever the z-index says.
//
// Also reads LIVE's stacking for the same pair, so the fix is prescribed by
// the reference rather than chosen by taste.
import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";
import { PNG } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/pngjs/lib/png.js";

const BASE = process.env.BASE || "http://localhost:5173";
const REF = "https://beachfront-dentistry.webflow.io";
const b = await chromium.launch();

const stack = async (url, label) => {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  await p.goto(url, { waitUntil: "networkidle", timeout: 60000 });
  await p.evaluate(() => document.fonts.ready);

  // Scroll until the pair overlaps a card header, then measure.
  const info = await p.evaluate(() => {
    const shot =
      document.querySelector(".ask-the-doctor-headshot") ||
      document.querySelector(".ask-the-doctor-image, .doctor-image");
    if (!shot) return { err: "no headshot" };
    const cards = [...document.querySelectorAll(".qa-item, .qa-block")];
    if (!cards.length) return { err: "no cards" };
    // put a mid-column card under the pair
    const target = cards[Math.min(2, cards.length - 1)];
    scrollTo({ top: target.getBoundingClientRect().top + scrollY - 40, behavior: "instant" });
    return { ok: true };
  });
  if (info.err) { await ctx.close(); return { label, err: info.err }; }
  await p.waitForTimeout(1500);

  const geo = await p.evaluate(() => {
    const shot =
      document.querySelector(".ask-the-doctor-headshot") ||
      document.querySelector(".ask-the-doctor-image, .doctor-image");
    const r = shot.getBoundingClientRect();
    const cards = [...document.querySelectorAll(".qa-item, .qa-block")];
    // the card whose box the headshot's left edge intrudes into
    const hit = cards
      .map((c) => ({ c, b: c.getBoundingClientRect() }))
      .filter(({ b }) => b.bottom > r.top && b.top < r.bottom)
      .sort((a, z) => a.b.top - z.b.top)[0];
    // walk up recording the stacking inputs
    const chain = [];
    for (let e = shot; e && e !== document.body; e = e.parentElement) {
      const cs = getComputedStyle(e);
      chain.push({
        el: e.tagName.toLowerCase() + (e.className && typeof e.className === "string" ? "." + e.className.trim().split(/\s+/).slice(0, 2).join(".") : ""),
        position: cs.position,
        zIndex: cs.zIndex,
        transform: cs.transform === "none" ? "none" : "set",
        isolation: cs.isolation,
      });
    }
    return {
      shot: { top: +r.top.toFixed(1), left: +r.left.toFixed(1), right: +r.right.toFixed(1), bottom: +r.bottom.toFixed(1) },
      card: hit ? { top: +hit.b.top.toFixed(1), left: +hit.b.left.toFixed(1), right: +hit.b.right.toFixed(1), bottom: +hit.b.bottom.toFixed(1) } : null,
      chain: chain.slice(0, 5),
    };
  });

  // Overlap rect between the headshot and the card it intrudes into.
  let diffPx = null, overlap = null;
  if (geo.card) {
    const x0 = Math.max(geo.shot.left, geo.card.left);
    const x1 = Math.min(geo.shot.right, geo.card.right);
    const y0 = Math.max(geo.shot.top, geo.card.top);
    const y1 = Math.min(geo.shot.bottom, geo.card.bottom);
    if (x1 > x0 + 2 && y1 > y0 + 2) {
      overlap = { x: Math.round(x0), y: Math.round(y0), width: Math.round(x1 - x0), height: Math.round(y1 - y0) };
      const withShot = await p.screenshot({ clip: overlap });
      await p.evaluate(() => {
        const s = document.querySelector(".ask-the-doctor-headshot") ||
          document.querySelector(".ask-the-doctor-image, .doctor-image");
        s.style.visibility = "hidden";
      });
      await p.waitForTimeout(150);
      const without = await p.screenshot({ clip: overlap });
      const A = PNG.sync.read(withShot), B = PNG.sync.read(without);
      let d = 0;
      for (let i = 0; i < A.data.length; i += 4)
        if (Math.abs(A.data[i] - B.data[i]) > 6 || Math.abs(A.data[i + 1] - B.data[i + 1]) > 6 || Math.abs(A.data[i + 2] - B.data[i + 2]) > 6) d++;
      diffPx = { changed: d, total: (A.width * A.height), pct: +((d / (A.width * A.height)) * 100).toFixed(1) };
    }
  }
  await ctx.close();
  return { label, ...geo, overlap, diffPx };
};

console.log(JSON.stringify({
  ours: await stack(`${BASE}/`, "ours"),
  live: await stack(REF, "live"),
}, null, 1));
await b.close();
