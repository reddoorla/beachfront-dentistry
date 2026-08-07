import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";

const targets = [
  ["CAND", "http://localhost:5190/", "figure"],
  ["REF", "https://www.beachfrontdentistry.com/", ".big-review"],
];
const VW = Number(process.argv[2] || 834);

for (const [tag, url, sel] of targets) {
  const b = await chromium.launch();
  try {
    const p = await b.newPage({ viewport: { width: VW, height: 1000 } });
    await p.goto(url, { waitUntil: "networkidle", timeout: 60000 });
    const h0 = await p.evaluate(() => document.body.scrollHeight);
    for (let y = 0; y < h0; y += 250) {
      await p.evaluate((yy) => window.scrollTo(0, yy), y);
      await p.waitForTimeout(90);
    }
    await p.waitForTimeout(300);
    const info = await p.evaluate((sel) => {
      const cards = [...document.querySelectorAll(sel)].filter((e) =>
        (e.textContent || "").includes("favorite dentistry team"),
      );
      const card = cards[0];
      if (!card) return { err: `no card for ${sel}` };
      card.scrollIntoView({ block: "center" });
      const r = card.getBoundingClientRect();
      const cs = getComputedStyle(card);
      const q = card.querySelector("blockquote,.review-text,p");
      const cap =
        card.querySelector("figcaption") ||
        [...card.querySelectorAll("div")].find((d) =>
          /REDONDO/i.test(d.textContent || ""),
        );
      const qr = q ? q.getBoundingClientRect() : null;
      const cr = cap ? cap.getBoundingClientRect() : null;
      return {
        w: Math.round(r.width),
        h: Math.round(r.height),
        flexDir: cs.flexDirection,
        justify: cs.justifyContent,
        pad: cs.padding,
        radius: cs.borderRadius,
        quoteTopInCard: qr ? Math.round(qr.top - r.top) : null,
        quoteBottomInCard: qr ? Math.round(qr.bottom - r.top) : null,
        capTopInCard: cr ? Math.round(cr.top - r.top) : null,
        order: qr && cr ? (qr.top < cr.top ? "QUOTE-top" : "CAP-top") : "?",
        clipped: qr ? qr.bottom > r.bottom + 1 : null,
      };
    }, sel);
    console.log(tag, JSON.stringify(info));
  } finally {
    await b.close();
  }
}
