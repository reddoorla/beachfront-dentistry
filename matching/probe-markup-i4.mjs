// MarkUp round I1 verification: the team card's hover raise is transitioned
// again once its reveal has finished (pin 5), and no portrait overlaps the row
// above (pin 6). Both at the three matrix widths.
import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";

const BASE = process.env.BASE || "http://localhost:5173";
const b = await chromium.launch();
const out = {};

for (const w of [1440, 834, 390]) {
  const ctx = await b.newContext({ viewport: { width: w, height: 900 } });
  const p = await ctx.newPage();
  await p.goto(`${BASE}/our-team`, {
    waitUntil: "networkidle",
    timeout: 60000,
  });

  // Walk the page so every card reveals, then settle past the 2400ms reveal.
  await p.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 400) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
  });
  await p.waitForTimeout(3000);

  const cards = await p.evaluate(() => {
    const items = [...document.querySelectorAll("article.team-list-item")];
    return items.map((c) => {
      const r = c.getBoundingClientRect();
      const portrait =
        [...c.querySelectorAll("img")].find((im) =>
          /50%|9999/.test(getComputedStyle(im).borderRadius),
        ) || c.querySelector("img");
      const pr = portrait?.getBoundingClientRect();
      const cs = getComputedStyle(c);
      return {
        top: +(r.top + window.scrollY).toFixed(1),
        bottom: +(r.bottom + window.scrollY).toFixed(1),
        left: +r.left.toFixed(1),
        right: +r.right.toFixed(1),
        portraitTop: pr ? +(pr.top + window.scrollY).toFixed(1) : null,
        inlineTransition: c.style.transition || "(released)",
        inlineTransform: c.style.transform || "(released)",
        tp: cs.transitionProperty,
        td: cs.transitionDuration,
        tf: cs.transitionTimingFunction,
      };
    });
  });

  // Overlap: does any card's portrait start above the BOTTOM of a card that
  // ends above it and shares horizontal span?
  let worstOverlap = 0;
  for (const c of cards) {
    for (const o of cards) {
      if (o === c) continue;
      if (
        o.bottom <= c.top + 1 &&
        o.right > c.left + 1 &&
        o.left < c.right - 1
      ) {
        // `o` is a card in a row above and horizontally overlapping.
        const ov = +(o.bottom - c.portraitTop).toFixed(1);
        if (ov > worstOverlap) worstOverlap = ov;
      }
    }
  }

  const sample = cards[0] || {};
  out[w] = {
    cardCount: cards.length,
    worstPortraitOverlapPx: worstOverlap,
    rowGap:
      cards.length > 3 ? +(cards[3].top - cards[0].bottom).toFixed(1) : null,
    inlineTransition: sample.inlineTransition,
    inlineTransform: sample.inlineTransform,
    effectiveTransitionProperty: sample.tp,
    effectiveDuration: sample.td,
    effectiveEasing: sample.tf,
  };

  // Pin 5: does the raise actually animate now? Hover and sample mid-flight.
  if (w === 1440) {
    const card = p.locator("article.team-list-item").first();
    await card.scrollIntoViewIfNeeded();
    await p.waitForTimeout(500);
    const before = await card.evaluate((el) => getComputedStyle(el).translate);
    const box = await card.boundingBox();
    await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await p.waitForTimeout(60); // mid-transition for a 200ms ease-out
    const mid = await card.evaluate((el) => getComputedStyle(el).translate);
    await p.waitForTimeout(400);
    const settled = await card.evaluate((el) => getComputedStyle(el).translate);
    out.raise = { before, midFlight: mid, settled };
  }
  await ctx.close();
}

console.log(JSON.stringify(out, null, 1));
await b.close();
