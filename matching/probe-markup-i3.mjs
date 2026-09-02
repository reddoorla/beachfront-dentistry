// MarkUp round I1, part 3: exact /our-team hero↔subtitle geometry (pin 4,
// including the wave's PAINTED arc so a lift can be checked against the
// "wave never touches the text" directive) and the float pair (pin 8).
import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";

const BASE = process.env.BASE || "http://localhost:5173";
const b = await chromium.launch();
const out = {};
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();

// ---- PIN 4: hero / wave / subtitle stack ----------------------------------
await p.goto(`${BASE}/our-team`, { waitUntil: "networkidle", timeout: 60000 });
await p.evaluate(() => window.scrollTo(0, 0));
await p.waitForTimeout(1000);

out.pin4 = await p.evaluate(() => {
  const doc = (r) => ({
    top: +(r.top + window.scrollY).toFixed(1),
    bottom: +(r.bottom + window.scrollY).toFixed(1),
    left: +r.left.toFixed(1),
    right: +r.right.toFixed(1),
    h: +r.height.toFixed(1),
  });
  const hero = document.querySelector("section");
  const meet = [...document.querySelectorAll("h2")].find(
    (e) => e.textContent.trim() === "Meet",
  );
  const our = [...document.querySelectorAll("h2")].find((e) =>
    /^Our\s*$/.test(e.textContent.trim()),
  );
  const subtitleSection = our?.closest("div,section");
  const svg = hero?.querySelector("svg");
  const waveBox = svg?.getBoundingClientRect();

  // Sample the wave's painted edge in document space across its width.
  let arc = null;
  if (svg) {
    const path = svg.querySelector("path");
    const ctm = path.getScreenCTM();
    const len = path.getTotalLength();
    const pts = [];
    for (let i = 0; i <= 60; i++) {
      const pt = path.getPointAtLength((len * i) / 60);
      const sp = new DOMPoint(pt.x, pt.y).matrixTransform(ctm);
      pts.push({ x: +sp.x.toFixed(1), y: +(sp.y + window.scrollY).toFixed(1) });
    }
    // The arc's HIGHEST painted point (smallest doc y) is what text must clear.
    arc = {
      minY: Math.min(...pts.map((q) => q.y)),
      maxY: Math.max(...pts.map((q) => q.y)),
    };
  }

  return {
    hero: hero ? doc(hero.getBoundingClientRect()) : null,
    heroMinHeight: hero ? getComputedStyle(hero).minHeight : null,
    meet: meet
      ? {
          ...doc(meet.getBoundingClientRect()),
          cs: getComputedStyle(meet.parentElement).bottom,
        }
      : null,
    meetWrapper: meet ? doc(meet.parentElement.getBoundingClientRect()) : null,
    our: our ? doc(our.getBoundingClientRect()) : null,
    subtitleSection: subtitleSection
      ? {
          ...doc(subtitleSection.getBoundingClientRect()),
          pt: getComputedStyle(subtitleSection).paddingTop,
          mt: getComputedStyle(subtitleSection).marginTop,
          bg: getComputedStyle(subtitleSection).backgroundColor,
        }
      : null,
    wave: waveBox ? doc(waveBox) : null,
    waveArc: arc,
    gapMeetToOur:
      meet && our
        ? +(
            our.getBoundingClientRect().top -
            meet.getBoundingClientRect().bottom
          ).toFixed(1)
        : null,
  };
});

// ---- PIN 8: the float pair -------------------------------------------------
await p.goto(`${BASE}/`, { waitUntil: "networkidle", timeout: 60000 });
await p.waitForTimeout(600);

const g = await p.evaluate(() => {
  const items = [...document.querySelectorAll(".qa-item")];
  if (!items.length) return { error: "no .qa-item" };
  const parent = items[0].parentElement;
  const pair = [...parent.children].find(
    (c) =>
      c !== items[0] &&
      /pointer-events-none/.test(c.className || "") &&
      /absolute/.test(c.className || ""),
  );
  return {
    itemCount: items.length,
    pairFound: !!pair,
    pairCls: pair ? (pair.className || "").toString().slice(0, 80) : null,
    firstItemTop: +(
      items[0].getBoundingClientRect().top + window.scrollY
    ).toFixed(1),
    lastItemTop: +(
      items[items.length - 1].getBoundingClientRect().top + window.scrollY
    ).toFixed(1),
  };
});
out.pin8_geo = g;

if (g.pairFound) {
  const start = Math.max(0, g.firstItemTop - 1000);
  const end = g.lastItemTop + 300;
  const samples = [];
  for (let y = start; y <= end; y += 40) {
    await p.evaluate((yy) => window.scrollTo(0, yy), y);
    await p.waitForTimeout(240);
    const s = await p.evaluate(() => {
      const items = [...document.querySelectorAll(".qa-item")];
      const parent = items[0].parentElement;
      const pair = [...parent.children].find(
        (c) =>
          c !== items[0] &&
          /pointer-events-none/.test(c.className || "") &&
          /absolute/.test(c.className || ""),
      );
      const r = pair.getBoundingClientRect();
      return {
        docTop: +(r.top + window.scrollY).toFixed(1),
        screenTop: +r.top.toFixed(1),
        tf: pair.style.transform || "none",
      };
    });
    samples.push({ scroll: y, ...s });
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
    screenTopRange: [
      Math.min(...samples.map((s) => s.screenTop)),
      Math.max(...samples.map((s) => s.screenTop)),
    ],
    screenMaxStep: Math.max(...dScreen.map(Math.abs)),
    docDeltasNonZero: dDoc.filter((d) => d !== 0),
  };
}

console.log(JSON.stringify(out, null, 1));
await b.close();
