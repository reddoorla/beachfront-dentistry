// Corrected hover check — visible pills only (Beachfront is hamburger-only, so
// the nav "Request Appointment" pill is display:none; test on-page pills).
import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";
const CAND = "http://localhost:5190/";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await chromium.launch();
try {
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto(CAND, { waitUntil: "networkidle", timeout: 60000 });
  await p.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 300) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 30));
    }
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 300));
  });
  const targets = [
    {
      name: "hero Make Appointment pill",
      sel: 'a:has-text("Make Appointment"), button:has-text("Make Appointment")',
      prop: "backgroundColor",
    },
    {
      name: "Read Reviews button",
      sel: 'button:has-text("Read Reviews")',
      prop: "opacity",
    },
    {
      name: "Book an Appointment pill (CTA band)",
      sel: 'a:has-text("Book an Appointment"), button:has-text("Book an Appointment")',
      prop: "backgroundColor",
    },
  ];
  for (const t of targets) {
    try {
      const el = p
        .locator(t.sel)
        .filter({ has: p.locator(":visible") })
        .first();
      const loc = p.locator(t.sel).first();
      await loc.scrollIntoViewIfNeeded();
      await sleep(200);
      const before = await loc.evaluate(
        (e, prop) => getComputedStyle(e)[prop],
        t.prop,
      );
      await loc.hover();
      await sleep(300);
      const after = await loc.evaluate(
        (e, prop) => getComputedStyle(e)[prop],
        t.prop,
      );
      console.log(
        `${before !== after ? "PASS" : "SAME"}  ${t.name}  ${t.prop} ${before} -> ${after}`,
      );
    } catch (e) {
      console.log(`ERR   ${t.name}  ${e.message.split("\n")[0]}`);
    }
  }
  await p.close();
} finally {
  await b.close();
}
