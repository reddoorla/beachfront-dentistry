import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";
const CAND = "http://localhost:5190/dev/match/your-first-visit";
const b = await chromium.launch();
try {
  const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
  const errs = [];
  p.on("pageerror", (e) => errs.push(e.message));
  p.on("console", (m) => { if (m.type() === "error") errs.push("console: " + m.text().slice(0, 120)); });
  await p.goto(CAND, { waitUntil: "networkidle", timeout: 60000 });
  const h = await p.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < h; y += 250) { await p.evaluate((y) => scrollTo(0, y), y); await p.waitForTimeout(80); }
  await p.evaluate(() => scrollTo(0, 0));
  await p.waitForTimeout(500);
  await p.screenshot({ path: "/Users/tuckerlemos/Documents/GitHub/beachfront-dentistry/matching/yfv-cand.png", fullPage: true });
  console.log("pageHeight:", h);
  console.log("errors:", errs.length ? errs.slice(0, 8) : "none");
  // marker presence
  const markers = await p.evaluate(() => ({
    toc: !!document.querySelector('[data-slice-type="first_visit_toc"]'),
    tour: !!document.querySelector('[data-slice-variation="photos"]'),
    teamSlider: !!document.querySelector('.fv-meet-our-team-section'),
    exam: !!document.querySelector('[data-slice-type="exam_timeline"]'),
    navCards: document.querySelectorAll('.visit-list-item').length,
    examSteps: document.querySelectorAll('.fv-exam-section .flex.items-start').length,
  }));
  console.log("markers:", JSON.stringify(markers));
} finally { await b.close(); }
