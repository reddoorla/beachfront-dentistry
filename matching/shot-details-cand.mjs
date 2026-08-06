import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";
const shots = [
  ["http://localhost:5173/team-members/dr-robert-quan", "matching/dt-team-cand.png", 1200],
  ["http://localhost:5173/services/dental-exams", "matching/dt-svc-cand.png", 1500],
  ["http://localhost:5173/questions/regular-dental-cleanings-support-your-whole-body-health", "matching/dt-qa-cand.png", 1400],
];
const b = await chromium.launch();
try {
  for (const [url, out, h] of shots) {
    const p = await b.newPage({ viewport: { width: 1440, height: h } });
    await p.goto(url, { waitUntil: "networkidle", timeout: 60000 });
    await p.evaluate(async () => {
      for (let y = 0; y <= 1300; y += 200) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); }
      window.scrollTo(0, 0); await new Promise((r) => setTimeout(r, 250));
    });
    await p.screenshot({ path: out, clip: { x: 0, y: 0, width: 1440, height: h } });
    await p.close();
    console.log("shot", out);
  }
} finally {
  await b.close();
}
