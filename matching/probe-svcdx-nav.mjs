import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";

const LIVE = "https://www.beachfrontdentistry.com/services";
const CAND = "http://localhost:5173/dev/match/services";

const grab = () => {
  const rr = (el) => {
    if (!el) return "null";
    const r = el.getBoundingClientRect();
    return `{x:${Math.round(r.left)},y:${Math.round(r.top + window.scrollY)},w:${Math.round(r.width * 10) / 10},h:${Math.round(r.height * 10) / 10}}`;
  };
  const o = [];
  const hdr =
    document.querySelector("section.header") || document.querySelector("nav");
  o.push(`HDR ${rr(hdr)} h=${hdr ? getComputedStyle(hdr).height : "-"}`);
  if (hdr) {
    const imgs = [...hdr.querySelectorAll("img,svg")];
    imgs
      .slice(0, 4)
      .forEach((i, n) =>
        o.push(
          `  media${n} ${i.tagName} ${rr(i)} src=${(i.getAttribute("src") || "").split("/").pop()}`,
        ),
      );
    const as = [...hdr.querySelectorAll("a,button")].filter(
      (a) => a.offsetHeight > 0,
    );
    as.slice(0, 6).forEach((a, n) =>
      o.push(
        `  link${n} ${rr(a)} "${(a.innerText || "").trim().slice(0, 24)}"`,
      ),
    );
  }
  return o.join("\n");
};

const run = async () => {
  const b = await chromium.launch();
  try {
    for (const vp of [1440, 834, 390]) {
      for (const [name, url] of [
        ["LIVE", LIVE],
        ["CAND", CAND],
      ]) {
        const ctx = await b.newContext({
          viewport: { width: vp, height: 900 },
        });
        const page = await ctx.newPage();
        await page
          .goto(url, { waitUntil: "networkidle", timeout: 90000 })
          .catch(() => {});
        await page.waitForTimeout(1000);
        console.log(`\n### ${name} @${vp}\n` + (await page.evaluate(grab)));
        await ctx.close();
      }
    }
    // natural size of the redondo hero image
    const ctx = await b.newContext();
    const page = await ctx.newPage();
    await page.goto(LIVE, { waitUntil: "domcontentloaded", timeout: 60000 });
    const dims = await page.evaluate(async () => {
      const load = (u) =>
        new Promise((res) => {
          const i = new Image();
          i.onload = () => res(`${i.naturalWidth}x${i.naturalHeight}`);
          i.onerror = () => res("ERR");
          i.src = u;
        });
      return {
        redondo: await load(
          "https://cdn.prod.website-files.com/64af3f93339537d6b661b556/64af4ef42e7d98b2fdb91769_beach-in-beautiful-morning-light-at-redondo-beach-75226436.jpeg",
        ),
      };
    });
    console.log("\nIMG DIMS " + JSON.stringify(dims));
    await ctx.close();
  } finally {
    await b.close();
  }
};
run();
