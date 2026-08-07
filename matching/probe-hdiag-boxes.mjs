import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";
import fs from "node:fs";

const VW = Number(process.argv[2] || 1440);
const TARGETS = [
  ["live", "https://www.beachfrontdentistry.com/"],
  ["cand", "http://localhost:5173/dev/match/home"],
];
const ANCHORS = [
  "Have a relaxed dental experience",
  "Make Appointment",
  "Finally have a dentist",
  "MEET YOUR TEAM|Meet Your Team",
  "Dr. Robert Quan",
  "Serving the South Bay",
  "This is my favorite dentistry team",
  "Paul K.",
  "Read Reviews",
  "Your Path to Oral Health",
  "STEP 01|Step 01",
  "Book an Appointment",
  "SERVICES|Services",
  "Cosmetic Dentistry",
  "Beyond the Smile",
  "Ready for great dental health",
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
const out = {};
try {
  for (const [name, url] of TARGETS) {
    const p = await b.newPage({ viewport: { width: VW, height: 900 } });
    try {
      await p.goto(url, { waitUntil: "networkidle", timeout: 90000 });
    } catch {
      await p.goto(url, { waitUntil: "domcontentloaded", timeout: 90000 });
      await p.waitForTimeout(3000);
    }
    await settle(p);
    out[name] = await p.evaluate((anchors) => {
      const clean = (s) => (s || "").replace(/\s+/g, " ").trim();
      const box = (el) => {
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        return {
          tag: el.tagName.toLowerCase(),
          cls: (el.className.baseVal ?? el.className ?? "")
            .toString()
            .slice(0, 70),
          y: Math.round(r.top + scrollY),
          x: Math.round(r.left),
          w: Math.round(r.width),
          h: Math.round(r.height),
          disp: cs.display,
          pad: `${cs.paddingTop}/${cs.paddingRight}/${cs.paddingBottom}/${cs.paddingLeft}`,
          mar: `${cs.marginTop}/${cs.marginRight}/${cs.marginBottom}/${cs.marginLeft}`,
          mw: cs.maxWidth,
          gap: cs.gap,
          gtc: cs.gridTemplateColumns,
          fd: cs.flexDirection,
          tr: cs.transform,
        };
      };
      const res = {};
      for (const spec of anchors) {
        const alts = spec.split("|");
        let found = null;
        const all = document.querySelectorAll("body *");
        for (const el of all) {
          if (el.children.length > 0) continue;
          const t = clean(el.textContent);
          if (!t) continue;
          if (
            alts.some(
              (a) =>
                t.toLowerCase().indexOf(a.toLowerCase().slice(0, 22)) === 0,
            )
          ) {
            const r = el.getBoundingClientRect();
            if (r.height === 0) continue;
            found = el;
            break;
          }
        }
        if (!found) {
          // allow elements with children
          for (const el of all) {
            const t = clean(el.textContent);
            if (
              alts.some(
                (a) =>
                  t.toLowerCase().indexOf(a.toLowerCase().slice(0, 22)) === 0,
              ) &&
              t.length < 90
            ) {
              const r = el.getBoundingClientRect();
              if (r.height === 0) continue;
              found = el;
              break;
            }
          }
        }
        if (!found) {
          res[spec] = "NOT FOUND";
          continue;
        }
        const chain = [];
        let el = found;
        for (let i = 0; i < 6 && el && el !== document.body; i++) {
          chain.push(box(el));
          el = el.parentElement;
        }
        res[spec] = chain;
      }
      return res;
    }, ANCHORS);
    await p.close();
  }
} finally {
  await b.close();
}
fs.writeFileSync(
  `/Users/tuckerlemos/Documents/GitHub/beachfront-dentistry/matching/hdiag-boxes-${VW}.json`,
  JSON.stringify(out, null, 1),
);
for (const a of ANCHORS) {
  console.log("\n### " + a);
  for (const n of ["live", "cand"]) {
    const c = out[n][a];
    if (typeof c === "string") {
      console.log(`  ${n}: ${c}`);
      continue;
    }
    console.log(
      `  ${n}: ` +
        c
          .map(
            (b) =>
              `<${b.tag}.${b.cls.split(" ")[0]} ${b.x},${b.y} ${b.w}x${b.h} pad:${b.pad} mw:${b.mw}>`,
          )
          .join("\n         "),
    );
  }
}
