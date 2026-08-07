import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";
const O = "https://www.beachfrontdentistry.com";
const pages = {
  team: "/team-members/dr-robert-quan",
  svc: "/services/dental-exams",
  qa: "/questions/regular-dental-cleanings-support-your-whole-body-health",
};
const b = await chromium.launch();
try {
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  for (const [k, path] of Object.entries(pages)) {
    await p.goto(O + path, { waitUntil: "networkidle", timeout: 60000 });
    const info = await p.evaluate(() => {
      const paras = [...document.querySelectorAll("p")].filter(
        (e) => (e.textContent || "").length > 80,
      );
      const f = paras[0];
      if (!f) return null;
      const cs = getComputedStyle(f);
      const r = f.getBoundingClientRect();
      return `${cs.fontSize}/${cs.lineHeight} mb=${cs.marginBottom} x=${Math.round(r.left)} w=${Math.round(r.width)}`;
    });
    console.log(k, info);
  }
} finally {
  await b.close();
}
