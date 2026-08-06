import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";
import fs from "node:fs";
const browser = await chromium.launch();
try {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto("https://www.beachfrontdentistry.com/contact-us", {
    waitUntil: "networkidle",
    timeout: 60000,
  });
  await page.waitForTimeout(2000);
  const html = await page.content();
  fs.writeFileSync(
    "/Users/tuckerlemos/Documents/GitHub/beachfront-dentistry/matching/spec/contact-us.html",
    html,
  );
  console.log("bytes", html.length);
} finally {
  await browser.close();
}
