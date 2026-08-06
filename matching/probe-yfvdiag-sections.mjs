import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";

const LIVE = "https://www.beachfrontdentistry.com/your-first-visit";
const CAND = "http://localhost:5173/dev/match/your-first-visit";
const VW = Number(process.argv[2] || 1440);

async function settle(p) {
  const H = await p.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < H + 800; y += 200) {
    await p.evaluate((v) => scrollTo(0, v), y);
    await p.waitForTimeout(50);
  }
  await p.evaluate(() => scrollTo(0, 0));
  await p.waitForTimeout(1100);
}

const dump = (roots) => {
  const out = [];
  const label = (c) => {
    const cn = (
      c.className && c.className.baseVal !== undefined
        ? c.className.baseVal
        : String(c.className || "")
    )
      .split(/\s+/)
      .filter(Boolean);
    return cn.slice(0, 6).join(".");
  };
  const rec = (el, depth, cap) => {
    for (const c of el.children) {
      const tag = c.tagName.toLowerCase();
      if (["script", "style", "noscript", "svg", "path"].includes(tag)) continue;
      const r = c.getBoundingClientRect();
      const cs = getComputedStyle(c);
      out.push(
        `${"  ".repeat(depth)}<${tag}${c.id ? "#" + c.id : ""}.${label(c)}> y=${Math.round(r.top + scrollY)} h=${Math.round(r.height)} x=${Math.round(r.left)} w=${Math.round(r.width)}` +
          ` | disp=${cs.display} pos=${cs.position} ovf=${cs.overflow} pad=${cs.paddingTop}/${cs.paddingRight}/${cs.paddingBottom}/${cs.paddingLeft} mar=${cs.marginTop}/${cs.marginBottom}` +
          (tag === "img" ? ` SRC=${(c.currentSrc || c.src || "").split("/").pop().slice(0, 44)} objfit=${cs.objectFit}` : "") +
          (c.children.length === 0
            ? ` TXT="${(c.textContent || "").replace(/\s+/g, " ").trim().slice(0, 60)}" ${cs.fontFamily.split(",")[0]} ${cs.fontWeight} ${cs.fontSize}/${cs.lineHeight} ls${cs.letterSpacing} ${cs.color} ${cs.textAlign} tt=${cs.textTransform}`
            : ""),
      );
      if (depth < cap) rec(c, depth + 1, cap);
    }
  };
  for (const { sel, cap, name } of roots) {
    const els = document.querySelectorAll(sel);
    out.push(`\n--- ${name} (${sel}) count=${els.length} ---`);
    let i = 0;
    for (const e of els) {
      if (i++ >= 2) break;
      const r = e.getBoundingClientRect();
      out.push(
        `ROOT <${e.tagName.toLowerCase()}.${label(e)}> y=${Math.round(r.top + scrollY)} h=${Math.round(r.height)} x=${Math.round(r.left)} w=${Math.round(r.width)}`,
      );
      rec(e, 1, cap);
    }
  }
  return out.join("\n");
};

const b = await chromium.launch();
try {
  const which = process.argv[3] || "both";
  if (which !== "cand") {
    const p = await b.newPage({ viewport: { width: VW, height: 900 } });
    await p.goto(LIVE, { waitUntil: "networkidle", timeout: 90000 });
    await settle(p);
    console.log(`##### LIVE @${VW}`);
    console.log(
      await p.evaluate(dump, [
        { name: "HERO", sel: "section.hero.group-photo", cap: 3 },
        { name: "TOC", sel: "section.fv-toc-section", cap: 5 },
        { name: "TOUR", sel: "section.fv-virtual-tour-section", cap: 3 },
        { name: "TOURINFO", sel: ".fv-virtual-tour-section .content-width:last-child", cap: 4 },
        { name: "MEET", sel: "section.fv-meet-our-team-section", cap: 3 },
        { name: "CARD1", sel: ".team-slider .team-list-item", cap: 3 },
        { name: "EXAM", sel: "section.fv-exam-section", cap: 4 },
        { name: "STEP1", sel: ".registration-forms-box", cap: 4 },
        { name: "STEPN", sel: ".exam-step", cap: 4 },
        { name: "REVIEW", sel: "section.fv-review-section", cap: 3 },
      ]),
    );
    await p.close();
  }
  if (which !== "live") {
    const p = await b.newPage({ viewport: { width: VW, height: 900 } });
    await p.goto(CAND, { waitUntil: "networkidle", timeout: 90000 });
    await settle(p);
    console.log(`\n\n##### CAND @${VW}`);
    console.log(
      await p.evaluate(dump, [
        { name: "MAIN", sel: "main", cap: 1 },
        { name: "HERO", sel: "[data-slice-type=hero]", cap: 3 },
        { name: "TOC", sel: "[data-slice-type=first_visit_toc]", cap: 5 },
        { name: "TOUR", sel: "[data-slice-type=carousel]", cap: 3 },
        { name: "MEET", sel: "[data-slice-type=collection_list]", cap: 3 },
        { name: "CARD1", sel: "[data-slice-type=collection_list] li, [data-slice-type=collection_list] article", cap: 3 },
        { name: "EXAM", sel: "[data-slice-type=exam_timeline]", cap: 4 },
      ]),
    );
    await p.close();
  }
} finally {
  await b.close();
}
