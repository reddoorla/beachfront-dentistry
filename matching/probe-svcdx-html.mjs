import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";
import { writeFileSync } from "node:fs";

const run = async () => {
  const b = await chromium.launch();
  try {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto("https://www.beachfrontdentistry.com/services", {
      waitUntil: "networkidle",
      timeout: 90000,
    });
    const html = await page.content();
    writeFileSync(
      "/Users/tuckerlemos/Documents/GitHub/beachfront-dentistry/matching/spec/services-live.html",
      html,
    );
    const block = await page.evaluate(
      () => document.querySelector(".service-blocks-sections").outerHTML,
    );
    writeFileSync(
      "/Users/tuckerlemos/Documents/GitHub/beachfront-dentistry/matching/spec/services-blocks.html",
      block,
    );
    const weoffer = await page.evaluate(
      () => document.querySelector(".we-offer-section").outerHTML,
    );
    const hero = await page.evaluate(
      () => document.querySelector("section.hero").outerHTML,
    );
    writeFileSync(
      "/Users/tuckerlemos/Documents/GitHub/beachfront-dentistry/matching/spec/services-top.html",
      hero + "\n\n=====\n\n" + weoffer,
    );
    console.log("ok", html.length, block.length);
    await ctx.close();
  } finally {
    await b.close();
  }
};
run();
