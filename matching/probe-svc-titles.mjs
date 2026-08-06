import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";
const uids = [
  "tooth-discoloration",
  "dental-veneers",
  "oral-cancer-dentistry",
  "mi-paste",
  "nitrous-oxide",
  "talon-nightguards",
  "cerec-crowns",
  "dental-cleanings",
];
const b = await chromium.launch();
try {
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  for (const u of uids) {
    await p.goto(`https://beachfrontdentistry.com/services/${u}`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    const t = await p.evaluate(() => {
      const h = [...document.querySelectorAll("h1,h2")].find(
        (e) => !/Ready for/.test(e.textContent),
      );
      return {
        h: h?.textContent.replace(/\s+/g, " ").trim() ?? null,
        title: document.title,
      };
    });
    console.log(u.padEnd(24), JSON.stringify(t.h), "|", t.title);
  }
} finally {
  await b.close();
}
