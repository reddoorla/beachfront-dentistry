import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";

const LIVE = "https://www.beachfrontdentistry.com/your-first-visit";
const CAND = "http://localhost:5173/dev/match/your-first-visit";
const VWS = [1440, 834, 390];

async function settle(p) {
  const H = await p.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < H + 800; y += 200) {
    await p.evaluate((v) => scrollTo(0, v), y);
    await p.waitForTimeout(50);
  }
  await p.evaluate(() => scrollTo(0, 0));
  await p.waitForTimeout(1100);
}

const census = () => {
  const out = [];
  const walk = (el, depth) => {
    for (const c of el.children) {
      const r = c.getBoundingClientRect();
      const tag = c.tagName.toLowerCase();
      if (tag === "script" || tag === "style" || tag === "noscript") continue;
      const isSec =
        tag === "section" ||
        tag === "header" ||
        tag === "footer" ||
        (depth < 3 && r.height > 200);
      if (isSec && r.height > 0) {
        out.push({
          d: depth,
          tag,
          cls: (c.className && c.className.baseVal !== undefined
            ? c.className.baseVal
            : String(c.className || "")
          )
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 5)
            .join("."),
          id: c.id || "",
          y: Math.round(r.top + scrollY),
          h: Math.round(r.height),
          x: Math.round(r.left),
          w: Math.round(r.width),
          t: (c.textContent || "").replace(/\s+/g, " ").trim().slice(0, 55),
        });
        if (depth < 2) walk(c, depth + 1);
      } else if (depth < 2) walk(c, depth + 1);
    }
  };
  walk(document.body, 0);
  return {
    pageH: document.body.scrollHeight,
    bodyW: document.body.clientWidth,
    rows: out,
  };
};

const headings = () => {
  const out = [];
  for (const el of document.querySelectorAll(
    "h1,h2,h3,h4,h5,h6,a.button,a[class*=button],button",
  )) {
    const r = el.getBoundingClientRect();
    if (r.height === 0) continue;
    const t = (el.textContent || "").replace(/\s+/g, " ").trim();
    if (!t || t.length > 70) continue;
    const cs = getComputedStyle(el);
    out.push({
      y: Math.round(r.top + scrollY),
      x: Math.round(r.left),
      w: Math.round(r.width),
      h: Math.round(r.height),
      tag: el.tagName.toLowerCase(),
      t,
      f: `${cs.fontFamily.split(",")[0]} ${cs.fontWeight} ${cs.fontSize}/${cs.lineHeight} ls${cs.letterSpacing} ${cs.color} ${cs.textAlign}`,
    });
  }
  out.sort((a, b) => a.y - b.y);
  return out;
};

const b = await chromium.launch();
try {
  for (const vw of VWS) {
    for (const [name, url] of [
      ["LIVE", LIVE],
      ["CAND", CAND],
    ]) {
      const p = await b.newPage({ viewport: { width: vw, height: 900 } });
      await p.goto(url, { waitUntil: "networkidle", timeout: 90000 });
      await settle(p);
      const c = await p.evaluate(census);
      const hs = await p.evaluate(headings);
      console.log(
        `\n===== ${name} @${vw}  pageH=${c.pageH} bodyW=${c.bodyW} =====`,
      );
      for (const r of c.rows)
        console.log(
          `  ${" ".repeat(r.d * 2)}<${r.tag}${r.id ? "#" + r.id : ""}.${r.cls}> y=${r.y} h=${r.h} x=${r.x} w=${r.w} | ${r.t}`,
        );
      console.log(`  --- headings ---`);
      for (const r of hs)
        console.log(
          `  y=${String(r.y).padStart(5)} x=${String(r.x).padStart(4)} ${String(r.w).padStart(4)}x${String(r.h).padStart(3)} <${r.tag}> "${r.t}" [${r.f}]`,
        );
      await p.close();
    }
  }
} finally {
  await b.close();
}
