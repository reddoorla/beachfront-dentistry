import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";

const REF = "https://www.beachfrontdentistry.com/services/dental-exams";
const CAND = "http://localhost:5173/services/dental-exams";
const VW = Number(process.argv[2] || 390);

const collect = async (p) =>
  p.evaluate(() => {
    // find the footer heading, walk up to the footer info band
    const all = [...document.querySelectorAll("*")];
    const h = all.find((e) =>
      [...e.childNodes].some(
        (n) => n.nodeType === 3 && /want to learn more/i.test(n.nodeValue),
      ),
    );
    if (!h) return { error: "no heading" };
    let band = h;
    for (let i = 0; i < 6 && band.parentElement; i++) band = band.parentElement;
    const rows = [];
    for (const el of band.querySelectorAll("*")) {
      const txt = [...el.childNodes]
        .filter((n) => n.nodeType === 3)
        .map((n) => n.nodeValue.trim())
        .join(" ")
        .trim();
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) continue;
      const cs = getComputedStyle(el);
      if (!txt && !/img|iframe|canvas|svg/i.test(el.tagName)) continue;
      rows.push({
        tag: el.tagName.toLowerCase(),
        cls: (el.className || "").toString().slice(0, 40),
        txt: txt.slice(0, 34),
        y: Math.round(r.top + scrollY),
        h: Math.round(r.height),
        w: Math.round(r.width),
        fs: cs.fontSize,
        lh: cs.lineHeight,
        mt: cs.marginTop,
        mb: cs.marginBottom,
        pt: cs.paddingTop,
        pb: cs.paddingBottom,
      });
    }
    return {
      bandY: Math.round(band.getBoundingClientRect().top + scrollY),
      bandH: Math.round(band.getBoundingClientRect().height),
      rows,
    };
  });

const b = await chromium.launch();
try {
  const out = {};
  for (const [side, url] of [
    ["ref", REF],
    ["cand", CAND],
  ]) {
    const p = await b.newPage({ viewport: { width: VW, height: 900 } });
    await p.goto(url, { waitUntil: "networkidle", timeout: 60000 });
    // settled scroll
    const H = await p.evaluate(() => document.body.scrollHeight);
    for (let y = 0; y < H; y += 200) {
      await p.evaluate((v) => scrollTo(0, v), y);
      await p.waitForTimeout(60);
    }
    await p.waitForTimeout(1200);
    out[side] = await collect(p);
    await p.close();
  }
  for (const side of ["ref", "cand"]) {
    console.log(`\n===== ${side} @${VW}  band y=${out[side].bandY} h=${out[side].bandH}`);
    for (const r of out[side].rows)
      console.log(
        `  y=${String(r.y).padStart(5)} h=${String(r.h).padStart(4)} w=${String(r.w).padStart(4)} ${r.fs}/${r.lh} m=${r.mt}/${r.mb} p=${r.pt}/${r.pb} <${r.tag}.${r.cls}> "${r.txt}"`,
      );
  }
} finally {
  await b.close();
}
