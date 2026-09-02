// MarkUp round I1, part 2: the float pair's real per-scroll behaviour (pin 8)
// and the two /our-team geometry pins (4 = Meet/Our gap, 6 = portrait overlap).
import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";

const BASE = process.env.BASE || "http://localhost:5173";
const b = await chromium.launch();
const out = {};
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();

// ---- PIN 8 -----------------------------------------------------------------
await p.goto(`${BASE}/`, { waitUntil: "networkidle", timeout: 60000 });
await p.waitForTimeout(500);

const geo = await p.evaluate(() => {
  const items = [...document.querySelectorAll(".qa-item")];
  if (!items.length) return { error: "no .qa-item" };
  const pair = items[0]
    .closest("*")
    .parentElement?.querySelector("div.pointer-events-none.absolute.z-10");
  return {
    itemCount: items.length,
    pairFound: !!pair,
    firstItemTop: +(
      items[0].getBoundingClientRect().top + window.scrollY
    ).toFixed(1),
    lastItemTop: +(
      items[items.length - 1].getBoundingClientRect().top + window.scrollY
    ).toFixed(1),
    itemTops: items.map(
      (e) => +(e.getBoundingClientRect().top + window.scrollY).toFixed(1),
    ),
  };
});
out.pin8_geo = geo;

if (!geo.error && geo.pairFound) {
  const start = Math.max(0, geo.firstItemTop - 1200);
  const end = geo.lastItemTop + 400;
  const samples = [];
  for (let y = start; y <= end; y += 40) {
    await p.evaluate((yy) => window.scrollTo(0, yy), y);
    await p.waitForTimeout(220); // past the 150ms follow
    const s = await p.evaluate(() => {
      const items = [...document.querySelectorAll(".qa-item")];
      const pair = items[0]
        .closest("*")
        .parentElement?.querySelector("div.pointer-events-none.absolute.z-10");
      if (!pair) return null;
      const r = pair.getBoundingClientRect();
      return {
        docTop: +(r.top + window.scrollY).toFixed(1),
        screenTop: +r.top.toFixed(1),
        tf: pair.style.transform || "none",
      };
    });
    if (s) samples.push({ scroll: y, ...s });
  }
  const dDoc = samples
    .slice(1)
    .map((s, i) => +(s.docTop - samples[i].docTop).toFixed(1));
  const dScreen = samples
    .slice(1)
    .map((s, i) => +(s.screenTop - samples[i].screenTop).toFixed(1));
  out.pin8 = {
    scrollStep: 40,
    n: samples.length,
    docMaxStep: Math.max(...dDoc.map(Math.abs)),
    docStepsOver60: dDoc.filter((d) => Math.abs(d) > 60).length,
    docZeroSteps: dDoc.filter((d) => d === 0).length,
    screenMaxStep: Math.max(...dScreen.map(Math.abs)),
    screenRange: [
      Math.min(...samples.map((s) => s.screenTop)),
      Math.max(...samples.map((s) => s.screenTop)),
    ],
    docDeltas: dDoc,
  };
}

// ---- PIN 4 + 6 -------------------------------------------------------------
await p.goto(`${BASE}/our-team`, { waitUntil: "networkidle", timeout: 60000 });
await p.evaluate(() => window.scrollTo(0, 0));
await p.waitForTimeout(1200);

out.pin4 = await p.evaluate(() => {
  const hits = [];
  const walk = (el) => {
    for (const c of el.children) {
      const t = c.textContent.trim();
      if (c.children.length === 0 && /^(Meet|Our|Team|Our\s+Team)$/i.test(t)) {
        const r = c.getBoundingClientRect();
        const cs = getComputedStyle(c);
        hits.push({
          text: t,
          tag: c.tagName.toLowerCase(),
          cls: (c.className || "").toString().slice(0, 90),
          docTop: +(r.top + window.scrollY).toFixed(1),
          docBottom: +(r.bottom + window.scrollY).toFixed(1),
          h: +r.height.toFixed(1),
          fs: cs.fontSize,
          lh: cs.lineHeight,
          m: `${cs.marginTop}/${cs.marginBottom}`,
          p: `${cs.paddingTop}/${cs.paddingBottom}`,
        });
      }
      walk(c);
    }
  };
  walk(document.body);
  return hits;
});

out.pin6 = await p.evaluate(() => {
  const cards = [
    ...document.querySelectorAll(".team-list-item, [class*=team-list]"),
  ];
  const rows = cards.map((c) => {
    const r = c.getBoundingClientRect();
    const portrait =
      c.querySelector("img[class*=rounded-full], img[class*=circle]") ||
      [...c.querySelectorAll("img")].find((im) =>
        /50%|9999/.test(getComputedStyle(im).borderRadius),
      );
    const dest = [...c.querySelectorAll("img")].find(
      (im) => im !== portrait && im.getBoundingClientRect().height > 80,
    );
    const rr = portrait?.getBoundingClientRect();
    const dr = dest?.getBoundingClientRect();
    return {
      cls: (c.className || "").toString().slice(0, 60),
      cardTop: +(r.top + window.scrollY).toFixed(1),
      cardBottom: +(r.bottom + window.scrollY).toFixed(1),
      cardLeft: +r.left.toFixed(1),
      portraitTop: rr ? +(rr.top + window.scrollY).toFixed(1) : null,
      portraitBottom: rr ? +(rr.bottom + window.scrollY).toFixed(1) : null,
      portraitOverhangAbove: rr
        ? +(r.top + window.scrollY - (rr.top + window.scrollY)).toFixed(1)
        : null,
      destTop: dr ? +(dr.top + window.scrollY).toFixed(1) : null,
      destBottom: dr ? +(dr.bottom + window.scrollY).toFixed(1) : null,
      z: getComputedStyle(c).zIndex,
      overflow: getComputedStyle(c).overflow,
    };
  });
  return { count: cards.length, rows: rows.slice(0, 12) };
});

out.pin5 = await p.evaluate(() => {
  const c = document.querySelector(".team-list-item, [class*=team-list]");
  if (!c) return { error: "no card" };
  const probe = (el) => {
    const cs = getComputedStyle(el);
    return {
      cls: (el.className || "").toString().slice(0, 100),
      tp: cs.transitionProperty,
      td: cs.transitionDuration,
      tf: cs.transitionTimingFunction,
      transform: cs.transform,
      translate: cs.translate,
      willChange: cs.willChange,
    };
  };
  const els = [c, ...c.querySelectorAll("*")].filter((el) => {
    const cs = getComputedStyle(el);
    return cs.transitionProperty !== "all" && cs.transitionProperty !== "none";
  });
  return els.slice(0, 6).map(probe);
});

console.log(JSON.stringify(out, null, 1));
await b.close();
