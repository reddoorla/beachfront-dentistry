import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";
const b = await chromium.launch();
try {
  for (const [tag, url] of [
    ["LIVE", "https://www.beachfrontdentistry.com/team-members/dr-robert-quan"],
    ["CAND", "http://localhost:5173/team-members/dr-robert-quan"],
  ]) {
    const p = await b.newPage({ viewport: { width: 390, height: 1600 } });
    await p.goto(url, { waitUntil: "networkidle", timeout: 60000 });
    const info = await p.evaluate(() => {
      // the bio paragraphs (below "Dentist"): pick <p> with a long sentence
      const paras = [...document.querySelectorAll("p")].filter(
        (e) => (e.textContent || "").length > 60,
      );
      const first = paras[0];
      const cs = first ? getComputedStyle(first) : null;
      const bioBlock =
        document.querySelector(".bio-section") ||
        first?.closest("section, div");
      const bcs = bioBlock ? getComputedStyle(bioBlock) : null;
      return {
        paraCount: paras.length,
        para: cs
          ? `${cs.fontSize}/${cs.lineHeight} mb=${cs.marginBottom} w=${Math.round(first.getBoundingClientRect().width)}`
          : null,
        blockPadTop: bcs ? bcs.paddingTop : null,
        firstParaTop: first
          ? Math.round(first.getBoundingClientRect().top + scrollY)
          : null,
      };
    });
    console.log(tag, JSON.stringify(info));
    await p.close();
  }
} finally {
  await b.close();
}
