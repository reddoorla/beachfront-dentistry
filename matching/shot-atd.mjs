// Visual check of ask-the-doctor: live vs candidate, top ~1700px at 1440.
// Tells us instantly whether the 77-82% mm is the QA-photo CSP floor (grey vs
// photo, structure intact) or a real structural break, and what makes the
// candidate hero 162px taller than live.
import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";

const shots = [
  [
    "https://www.beachfrontdentistry.com/ask-the-doctor",
    "matching/atd-live-1440.png",
  ],
  [
    "http://localhost:5173/dev/match/ask-the-doctor",
    "matching/atd-cand-1440.png",
  ],
];
const b = await chromium.launch();
try {
  for (const [url, out] of shots) {
    const p = await b.newPage({ viewport: { width: 1440, height: 1700 } });
    await p.goto(url, { waitUntil: "networkidle", timeout: 60000 });
    // settle: scroll a little to fire reveals, back to top
    await p.evaluate(async () => {
      for (let y = 0; y <= 1600; y += 200) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 60));
      }
      window.scrollTo(0, 0);
      await new Promise((r) => setTimeout(r, 200));
    });
    await p.screenshot({
      path: out,
      clip: { x: 0, y: 0, width: 1440, height: 1700 },
    });
    await p.close();
    console.log("shot", out);
  }
} finally {
  await b.close();
}
