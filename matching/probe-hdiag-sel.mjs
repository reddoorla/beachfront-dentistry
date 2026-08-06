import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";

const VWS = [1440, 834, 390];
// [label, liveSelector, candSelector]
const PAIRS = [
  ["qa-card1", ".qa-block", ".qa-item"],
  ["review-slide1", ".big-review-item", "[data-slide],li[role=group]"],
  ["review-card1", ".big-review", "figure.relative"],
  ["review-viewport", ".review-slider-holder-viewport", null],
  ["review-avatar", ".reviewer-photo", null],
  ["head1", ".heads", null],
  ["atd-section", ".home-ask-the-doctor-section", null],
  ["services-section", ".home-services-section", null],
  ["ssb-section", ".home-ssb-section", null],
  ["myt-section", ".home-meet-your-team-section", null],
  ["healthy-section", ".home-healthy-mouth-section", null],
  ["pyf-section", ".home-pyf-section", null],
  ["hero", ".hero.home", ".hero-band"],
  ["footer-section", ".footer", null],
  ["step1", ".home-step", null],
  ["3c-card1", ".home-pyf-section .w-col", null],
];

async function settle(p) {
  const H = await p.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < H; y += 200) {
    await p.evaluate((v) => scrollTo(0, v), y);
    await p.waitForTimeout(50);
  }
  await p.evaluate(() => scrollTo(0, document.body.scrollHeight));
  await p.waitForTimeout(1000);
  await p.evaluate(() => scrollTo(0, 0));
  await p.waitForTimeout(300);
}

const b = await chromium.launch();
try {
  for (const vw of VWS) {
    console.log(`\n############ ${vw}`);
    for (const [name, url, side] of [
      ["live", "https://www.beachfrontdentistry.com/", "live"],
      ["cand", "http://localhost:5173/dev/match/home", "cand"],
    ]) {
      const p = await b.newPage({ viewport: { width: vw, height: 900 } });
      try {
        await p.goto(url, { waitUntil: "networkidle", timeout: 90000 });
      } catch {
        await p.goto(url, { waitUntil: "domcontentloaded", timeout: 90000 });
        await p.waitForTimeout(3000);
      }
      await settle(p);
      const sels = PAIRS.map(([l, a, c]) => [l, side === "live" ? a : c]).filter(
        ([, s]) => s,
      );
      const res = await p.evaluate((sels) => {
        const out = [];
        for (const [label, sel] of sels) {
          let els = [];
          try {
            els = [...document.querySelectorAll(sel)];
          } catch {}
          els = els.filter((e) => e.getBoundingClientRect().height > 1);
          if (!els.length) {
            out.push(`${label}: none (${sel})`);
            continue;
          }
          const e = els[0];
          const r = e.getBoundingClientRect();
          const cs = getComputedStyle(e);
          let pitch = "";
          if (els.length > 1) {
            const r2 = els[1].getBoundingClientRect();
            pitch = ` pitch=${Math.round(r2.top - r.top) || Math.round(r2.left - r.left)}`;
          }
          out.push(
            `${label}: n=${els.length} ${Math.round(r.left)},${Math.round(r.top + scrollY)} ${Math.round(r.width)}x${Math.round(r.height)} m=${cs.marginTop}/${cs.marginRight}/${cs.marginBottom}/${cs.marginLeft} p=${cs.paddingTop}/${cs.paddingRight}/${cs.paddingBottom}/${cs.paddingLeft} ovf=${cs.overflowX} mw=${cs.maxWidth}${pitch}`,
          );
        }
        return out;
      }, sels);
      console.log(`--- ${name}`);
      for (const l of res) console.log("  " + l);
      await p.close();
    }
  }
} finally {
  await b.close();
}
