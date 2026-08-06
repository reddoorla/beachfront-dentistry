import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";
const [
  ,
  ,
  refPath = "/your-first-visit",
  candPath = "/dev/match/your-first-visit",
  vwArg = "834",
] = process.argv;
const VW = Number(vwArg);
const settle = async (p) => {
  await p.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 250) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 80));
    }
    window.scrollTo(0, 0);
    for (let i = 0; i < 60; i++) {
      await new Promise((r) => setTimeout(r, 100));
      if (document.getAnimations().every((a) => a.playState !== "running"))
        break;
    }
    await new Promise((r) => setTimeout(r, 400));
  });
};
const b = await chromium.launch();
try {
  for (const [name, url] of [
    ["live", `https://www.beachfrontdentistry.com${refPath}`],
    ["ours", `http://localhost:5173${candPath}`],
  ]) {
    const p = await b.newPage({ viewport: { width: VW, height: 900 } });
    await p.goto(url, { waitUntil: "networkidle", timeout: 60000 });
    await settle(p);
    const r = await p.evaluate(() => {
      const bx = (el) => {
        const b = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        return `${Math.round(b.width)}x${Math.round(b.height)} y=${Math.round(b.y + scrollY)} p=${cs.paddingTop}/${cs.paddingBottom} m=${cs.marginTop}/${cs.marginBottom}`;
      };
      return [
        ...document.querySelectorAll(
          "body section, body > nav, body main > section",
        ),
      ]
        .filter((s) => s.getBoundingClientRect().height > 4)
        .map(
          (s, i) =>
            `${i} ${s.tagName.toLowerCase()}.${String(s.className).split(" ").slice(0, 2).join(".").slice(0, 38)} ${bx(s)} "${(s.textContent || "").replace(/\s+/g, " ").trim().slice(0, 34)}"`,
        )
        .join("\n  ");
    });
    console.log(`===== ${name} @${VW}\n  ${r}`);
    await p.close();
  }
} finally {
  await b.close();
}
