// Does the candidate footer already render the map + the 3 columns, and how
// does it compare to live? (LEDGER claims the map is omitted — verify.)
import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";

const pages = [
  ["CAND", "http://localhost:5173/contact-us"],
  ["LIVE", "https://www.beachfrontdentistry.com/contact-us"],
];
const b = await chromium.launch();
try {
  for (const [tag, url] of pages) {
    const p = await b.newPage({ viewport: { width: 1440, height: 1200 } });
    await p.goto(url, { waitUntil: "networkidle", timeout: 60000 });
    const info = await p.evaluate(() => {
      const footer = document.querySelector("footer, .footer");
      const mapIframe = document.querySelector(
        'footer iframe[src*="google.com/maps"], .footer iframe[src*="maps"], footer iframe',
      );
      const ctaLabel = [...document.querySelectorAll("a")]
        .map((a) => a.textContent.trim())
        .find((t) => /^book (an )?appointment$/i.test(t));
      return {
        hasFooter: !!footer,
        hasMapIframe: !!mapIframe,
        mapSrc: mapIframe
          ? (mapIframe.getAttribute("src") || "").slice(0, 60)
          : null,
        ctaLabel,
        footerText: footer
          ? footer.textContent.replace(/\s+/g, " ").trim().slice(0, 180)
          : null,
      };
    });
    console.log(tag, JSON.stringify(info, null, 2));
  }
} finally {
  await b.close();
}
