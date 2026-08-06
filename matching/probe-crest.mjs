import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";
for (const w of [390, 480, 650, 834, 1440]) {
  const b = await chromium.launch();
  try {
    const p = await b.newPage({ viewport: { width: w, height: 1200 } });
    await p.goto("http://localhost:5190/", {
      waitUntil: "networkidle",
      timeout: 60000,
    });
    const h0 = await p.evaluate(() => document.body.scrollHeight);
    for (let y = 0; y < h0; y += 300) {
      await p.evaluate((yy) => scrollTo(0, yy), y);
      await p.waitForTimeout(50);
    }
    const r = await p.evaluate(() => {
      const t = [...document.querySelectorAll("img")].find((e) =>
        /big-teal-tooth/i.test(e.src || ""),
      );
      const tr = t.getBoundingClientRect();
      const cx = tr.left + tr.width / 2;
      const sect = t.offsetParent || t.parentElement;
      const sTop = sect.getBoundingClientRect().top;
      t.style.visibility = "hidden";
      // scan down at cx to find first teal-ish pixel owner (the services band fill)
      let seamViewportY = null;
      for (
        let y = Math.round(tr.top) - 120;
        y < Math.round(tr.top) + 200;
        y += 2
      ) {
        const el = document.elementFromPoint(cx, y);
        if (!el) continue;
        const cs = getComputedStyle(el);
        const bi = cs.backgroundImage;
        const bc = cs.backgroundColor;
        // teal band has a gradient background-image (teal->sand)
        if (/gradient/i.test(bi) && el.getBoundingClientRect().height > 150) {
          seamViewportY = y;
          break;
        }
      }
      t.style.visibility = "";
      return {
        toothTopSectRel: Math.round(tr.top - sTop),
        toothW: Math.round(tr.width),
        seamSectRel:
          seamViewportY != null ? Math.round(seamViewportY - sTop) : null,
      };
    });
    console.log(`CAND @${w}:`, JSON.stringify(r));
  } finally {
    await b.close();
  }
}
