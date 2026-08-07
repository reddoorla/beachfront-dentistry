import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";
const b = await chromium.launch();
const settle = async (p) =>
  p.evaluate(async () => {
    for (let y = 0; y < 2000; y += 400) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 40));
    }
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 300));
  });
try {
  const p1 = await b.newPage({ viewport: { width: 1440, height: 1400 } });
  await p1.goto("https://www.beachfrontdentistry.com/ask-the-doctor", {
    waitUntil: "networkidle",
    timeout: 60000,
  });
  await settle(p1);
  await p1.screenshot({
    path: "matching/grid-live.png",
    clip: { x: 0, y: 500, width: 1440, height: 900 },
  });
  await p1.close();

  const p2 = await b.newPage({ viewport: { width: 1440, height: 1400 } });
  await p2.goto("http://localhost:5190/dev/match/ask-the-doctor", {
    waitUntil: "networkidle",
    timeout: 60000,
  });
  await settle(p2);
  await p2.screenshot({
    path: "matching/grid-cand.png",
    clip: { x: 0, y: 450, width: 1440, height: 900 },
  });
  await p2.close();
  console.log("saved grid-live.png + grid-cand.png");
} finally {
  await b.close();
}
