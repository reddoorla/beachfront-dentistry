import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";
const CAND = "http://localhost:5190/dev/match/your-first-visit";
const b = await chromium.launch();
try {
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto(CAND, { waitUntil: "networkidle", timeout: 60000 });
  await p.waitForTimeout(500);
  const inv = await p.evaluate(() => {
    const tour = document.querySelector('[data-slice-variation="photos"]');
    const team = document.querySelector(".fv-meet-our-team-section");
    return {
      tourArrows: tour?.querySelectorAll('button[aria-label*="slide"]').length ?? 0,
      tourDots: tour?.querySelectorAll('button[aria-label^="Go to slide"]').length ?? 0,
      teamArrows: team?.querySelectorAll('button[aria-label*="slide"]').length ?? 0,
      appointmentLinks: [...document.querySelectorAll('a[href="#appointment"]')].map((a) => a.textContent.trim()),
      navCardHrefs: [...document.querySelectorAll(".visit-list-item")].map((a) => a.getAttribute("href")),
    };
  });
  // click the office-tour NEXT arrow, confirm the track transform advances
  const nextBtn = await p.$('[data-slice-variation="photos"] button[aria-label="Next slide"]');
  const before = await p.$eval('[data-slice-variation="photos"] .flex.transition-transform', (e) => e.style.transform);
  if (nextBtn) await nextBtn.click();
  await p.waitForTimeout(400);
  const after = await p.$eval('[data-slice-variation="photos"] .flex.transition-transform', (e) => e.style.transform);
  console.log(JSON.stringify({ ...inv, tourAdvances: before !== after, before, after }, null, 2));
} finally { await b.close(); }
