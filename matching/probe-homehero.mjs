import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";
const VW = Number(process.argv[2] ?? 834);
const b = await chromium.launch();
try {
  for (const [name, url] of [
    ["live", "https://www.beachfrontdentistry.com/"],
    ["ours", "http://localhost:5173/dev/match/home"],
  ]) {
    const p = await b.newPage({ viewport: { width: VW, height: 900 } });
    await p.goto(url, { waitUntil: "networkidle", timeout: 60000 });
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
    const r = await p.evaluate(() => {
      const bx = (el, l) => {
        if (!el) return `${l}: MISSING`;
        const b = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        return `${l}: ${Math.round(b.width)}x${Math.round(b.height)} y=${Math.round(b.y + scrollY)} pt=${cs.paddingTop} pb=${cs.paddingBottom} mt=${cs.marginTop} mb=${cs.marginBottom} minh=${cs.minHeight}`;
      };
      const secs = [
        ...document.querySelectorAll(
          "body section, body header, body nav, body main > *",
        ),
      ].slice(0, 12);
      return secs
        .map((s, i) =>
          bx(
            s,
            `${i} ${s.tagName.toLowerCase()}.${String(s.className).split(" ").slice(0, 2).join(".")}`,
          ),
        )
        .join("\n  ");
    });
    console.log(`== ${name} @${VW}\n  ${r}`);
    await p.close();
  }
} finally {
  await b.close();
}
