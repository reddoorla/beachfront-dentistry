import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";
const LIVE = "https://www.beachfrontdentistry.com/ask-the-doctor";
const CAND = "http://localhost:5173/dev/match/ask-the-doctor";

async function settle(page) {
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 200) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 40));
    }
    window.scrollTo(0, document.body.scrollHeight);
    await new Promise((r) => setTimeout(r, 1000));
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 300));
  });
}

const browser = await chromium.launch();
const res = {};
try {
  for (const vp of [1440, 390]) {
    for (const [name, url] of [
      ["live", LIVE],
      ["cand", CAND],
    ]) {
      const ctx = await browser.newContext({
        viewport: { width: vp, height: 900 },
      });
      const page = await ctx.newPage();
      await page
        .goto(url, { waitUntil: "networkidle", timeout: 90000 })
        .catch(() => {});
      await page.waitForTimeout(900);
      await settle(page);
      const d = await page.evaluate((isLive) => {
        const rect = (el) => {
          if (!el) return null;
          const r = el.getBoundingClientRect();
          return {
            x: +r.x.toFixed(1),
            y: +(r.y + scrollY).toFixed(1),
            w: +r.width.toFixed(1),
            h: +r.height.toFixed(1),
          };
        };
        const cards = isLive
          ? [...document.querySelectorAll(".qa-block")]
          : [
              ...document.querySelectorAll(
                "[data-slice-type='question_list'] .qa-item",
              ),
            ];
        const titles = cards.map((c) =>
          (
            c.querySelector(isLive ? ".qa-question" : "h3")?.textContent || ""
          ).trim(),
        );
        const nums = cards.map((c) =>
          (
            c.querySelector(
              isLive ? ".qa-circle" : "button[aria-expanded] span",
            )?.textContent || ""
          ).trim(),
        );
        const imgs = cards.map((c) => {
          const i = c.querySelector("img");
          return i
            ? (i.currentSrc || i.src).split("/").pop().slice(0, 46)
            : null;
        });
        // hero bg
        const heroImg = isLive
          ? null
          : document.querySelector("[data-slice-type='hero'] img");
        const heroSec = document.querySelector(
          isLive ? "section.hero" : "[data-slice-type='hero']",
        );
        // downstream anchors
        const anchorText = (t) => {
          const all = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6,a,p")];
          const el = all.find((e) =>
            (e.textContent || "").trim().toLowerCase().startsWith(t),
          );
          return el
            ? { txt: el.textContent.trim().slice(0, 40), ...rect(el) }
            : null;
        };
        return {
          n: cards.length,
          titles,
          nums,
          imgs: imgs.slice(0, 4),
          heroSec: rect(heroSec),
          heroImg: heroImg
            ? {
                src: (heroImg.currentSrc || heroImg.src).slice(0, 120),
                natW: heroImg.naturalWidth,
              }
            : null,
          ready: anchorText("ready for"),
          learn: anchorText("want to learn"),
          readReviews: anchorText("read reviews"),
          docEnd: document.body.scrollHeight,
        };
      }, name === "live");
      res[`${name}@${vp}`] = d;
      await ctx.close();
    }
    const L = res[`live@${vp}`],
      C = res[`cand@${vp}`];
    console.log(
      `\n#### ${vp}  cards L=${L.n} C=${C.n}  pageH ${L.docEnd}/${C.docEnd}`,
    );
    console.log(
      "  ready  L",
      JSON.stringify(L.ready),
      "\n         C",
      JSON.stringify(C.ready),
    );
    console.log(
      "  learn  L",
      JSON.stringify(L.learn),
      "\n         C",
      JSON.stringify(C.learn),
    );
    console.log(
      "  reviews L",
      JSON.stringify(L.readReviews),
      "\n          C",
      JSON.stringify(C.readReviews),
    );
    console.log("  heroImg C", JSON.stringify(C.heroImg));
    let bad = 0;
    for (let i = 0; i < Math.max(L.n, C.n); i++) {
      const lt = L.titles[i],
        ct = C.titles[i],
        ln = L.nums[i],
        cn = C.nums[i];
      if (lt !== ct || ln !== cn) {
        console.log(
          `  MISMATCH #${i}: live "${ln}" ${lt} || cand "${cn}" ${ct}`,
        );
        bad++;
      }
    }
    console.log(`  title/number mismatches: ${bad}`);
    console.log(
      "  first imgs L",
      JSON.stringify(L.imgs),
      "\n             C",
      JSON.stringify(C.imgs),
    );
  }
} finally {
  await browser.close();
}
