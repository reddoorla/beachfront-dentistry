import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";
const url = process.argv[2],
  vw = Number(process.argv[3] || 834);
const b = await chromium.launch();
try {
  const p = await b.newPage({ viewport: { width: vw, height: 900 } });
  await p.goto(url, { waitUntil: "load", timeout: 60000 });
  await p.waitForTimeout(2200);
  await p.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 250) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
    window.scrollTo(0, 0);
  });
  await p.waitForTimeout(2500);
  const out = await p.evaluate(() => {
    const norm = (s) => (s || "").replace(/\s+/g, " ").trim().toLowerCase();
    const anchorEl = (a) =>
      [...document.querySelectorAll("h1,h2,h3,h4,p,div,section")].find((e) => {
        const r = e.getBoundingClientRect();
        return r.height > 0 && norm(e.textContent).startsWith(norm(a));
      });
    const L = [];
    // For each section, find the primary multi-child container and report its layout
    const sections = [
      "Finally have a dentist",
      "MEET YOUR TEAM",
      "Serving the South Bay",
      "Your Path to Oral Health",
      "cosmetic dentistry",
      "Want to learn more?",
    ];
    for (const a of sections) {
      const el = anchorEl(a);
      if (!el) {
        L.push(`"${a}" NULL`);
        continue;
      }
      const sec = el.closest("section") || el;
      const r = sec.getBoundingClientRect();
      // find the deepest container whose direct children are >=2 and laid in a row/grid
      let best = null;
      for (const c of sec.querySelectorAll("*")) {
        const cs = getComputedStyle(c);
        const kids = [...c.children].filter(
          (k) => k.getBoundingClientRect().height > 4,
        );
        if (kids.length < 2) continue;
        if (
          cs.display === "grid" ||
          (cs.display === "flex" && cs.flexDirection.startsWith("row"))
        ) {
          // count kids on the first visual row (same top within 8px)
          const t0 = kids[0].getBoundingClientRect().top;
          const inRow = kids.filter(
            (k) => Math.abs(k.getBoundingClientRect().top - t0) < 8,
          ).length;
          best = {
            disp: cs.display,
            dir: cs.flexDirection,
            cols: cs.gridTemplateColumns.split(" ").length,
            kids: kids.length,
            inRow,
            cls: (c.className || "").toString().slice(0, 44),
          };
          break;
        }
      }
      L.push(
        `"${a}" secH=${Math.round(r.height)} layout=${best ? `${best.disp}/${best.dir} kids=${best.kids} inRow=${best.inRow} gridCols=${best.cols} [${best.cls}]` : "(no row/grid container)"}`,
      );
    }
    return L;
  });
  console.log(`=== ${url} @${vw} ===`);
  for (const l of out) console.log(l);
} finally {
  await b.close();
}
