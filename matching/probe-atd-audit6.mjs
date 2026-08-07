import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";
const b = await chromium.launch();
try {
  const o = {};
  for (const [n, u] of [
    ["live", "https://www.beachfrontdentistry.com/ask-the-doctor"],
    ["cand", "http://localhost:5173/dev/match/ask-the-doctor"],
  ]) {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
    const p = await ctx.newPage();
    await p
      .goto(u, { waitUntil: "networkidle", timeout: 90000 })
      .catch(() => {});
    await p.waitForTimeout(1500);
    o[n] = await p.evaluate((isLive) => {
      const cards = isLive
        ? [...document.querySelectorAll(".qa-block")]
        : [
            ...document.querySelectorAll(
              "[data-slice-type='question_list'] .qa-item",
            ),
          ];
      return cards.map((c) => ({
        t: (
          c.querySelector(isLive ? ".qa-question" : "h3")?.textContent || ""
        ).trim(),
        a: (
          c.querySelector(isLive ? ".qa-answer p" : "[id^='qa-panel'] p")
            ?.textContent || ""
        ).trim(),
        href: c.querySelector("a")?.getAttribute("href") || "",
      }));
    }, n === "live");
    await ctx.close();
  }
  let diff = 0;
  for (let i = 0; i < 40; i++) {
    const L = o.live[i],
      C = o.cand[i];
    if (L.href !== C.href)
      console.log(`HREF #${i + 1}: L=${L.href} C=${C.href}`);
    if (L.a !== C.a) {
      diff++;
      console.log(
        `TEASER #${i + 1} "${L.t.slice(0, 40)}"\n   L: ${L.a.slice(0, 110)}\n   C: ${C.a.slice(0, 110)}`,
      );
    }
  }
  console.log("teaser diffs:", diff, "of 40");
} finally {
  await b.close();
}
