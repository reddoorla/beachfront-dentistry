import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";

// Which mechanism does each live body use for the blank line above a
// sub-heading: a standalone empty <p> block, or a trailing <br> inside the
// preceding paragraph?
const PATHS = [
  "/services/dental-exams",
  "/services/dental-cleanings",
  "/services/dental-implants",
  "/services/teeth-whitening",
  "/questions/regular-dental-cleanings-support-your-whole-body-health",
];

const b = await chromium.launch();
try {
  for (const path of PATHS) {
    const p = await b.newPage({ viewport: { width: 390, height: 900 } });
    let res;
    try {
      const r = await p.goto("https://www.beachfrontdentistry.com" + path, {
        waitUntil: "networkidle",
        timeout: 60000,
      });
      if (!r || r.status() >= 400) {
        console.log(`${path.padEnd(62)} HTTP ${r ? r.status() : "?"}`);
        await p.close();
        continue;
      }
      await p.evaluate(() => scrollTo(0, document.body.scrollHeight / 2));
      await p.waitForTimeout(700);
      res = await p.evaluate(() => {
        const rt = document.querySelector(".w-richtext, .dynamic-content-body");
        if (!rt) return null;
        const kids = [...rt.children];
        const emptyBlocks = kids.filter(
          (e) => e.textContent.replace(/\s|‍/g, "").length === 0,
        ).length;
        const trailingBr = kids.filter(
          (e) =>
            e.querySelectorAll("br").length > 0 &&
            e.textContent.replace(/\s/g, "").length > 20,
        ).length;
        return { blocks: kids.length, emptyBlocks, trailingBr };
      });
    } catch (e) {
      console.log(`${path.padEnd(62)} ERR ${e.message.slice(0, 40)}`);
      await p.close();
      continue;
    }
    console.log(
      `${path.padEnd(62)} ${res ? `blocks=${res.blocks} emptyBlocks=${res.emptyBlocks} paras-with-br=${res.trailingBr}` : "no richtext"}`,
    );
    await p.close();
  }
} finally {
  await b.close();
}
