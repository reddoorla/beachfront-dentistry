import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";

const LIVE = "https://www.beachfrontdentistry.com/services";
const CAND = "http://localhost:5173/dev/match/services";
const VPS = [1440, 834, 390];

async function settle(page) {
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 200) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 50));
    }
    window.scrollTo(0, document.body.scrollHeight);
    await new Promise((r) => setTimeout(r, 1000));
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 300));
  });
}

const grab = (isLive) => {
  const rr = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return `{x:${Math.round(r.left)},y:${Math.round(r.top + window.scrollY)},w:${Math.round(r.width * 10) / 10},h:${Math.round(r.height * 10) / 10}}`; };
  const ff = (el) => { if (!el) return null; const c = getComputedStyle(el); return `${c.fontFamily.split(",")[0].replace(/["']/g, "")} w${c.fontWeight} ${c.fontSize}/${c.lineHeight} ls=${c.letterSpacing} ${c.color} ta=${c.textAlign} tt=${c.textTransform} m=${c.marginTop}/${c.marginRight}/${c.marginBottom}/${c.marginLeft} p=${c.paddingTop}/${c.paddingRight}/${c.paddingBottom}/${c.paddingLeft} bottom=${c.bottom} pos=${c.position}`; };
  const o = [];
  const push = (label, el) => o.push(`${label}: ${rr(el)} | ${el ? ff(el) : "MISSING"}`);

  const hero = isLive ? document.querySelector("section.hero") : document.querySelector("main section");
  const h2 = isLive ? document.querySelector(".subpage-hero-heading") : document.querySelector("main section h2");
  push("HERO", hero);
  push("HERO_H2", h2);
  if (hero) o.push(`HERO_STYLE: bg=${getComputedStyle(hero).backgroundImage.slice(0, 120)} h=${getComputedStyle(hero).height}`);

  const header = document.querySelector("section.header") || document.querySelector("header");
  push("HEADER", header);

  const intro = isLive
    ? document.querySelector(".we-offer-section p")
    : document.querySelector('main section [class*="max-w-[620px]"] p');
  push("INTRO_P", intro);
  const introWrap = isLive ? document.querySelector(".we-offer-section") : document.querySelector('main section [class*="max-w-[620px]"]');
  push("INTRO_WRAP", introWrap);

  const grid = isLive ? document.querySelector(".service-grid") : document.querySelector('main section div[class*="grid-cols-1"]');
  push("GRID", grid);
  if (grid) {
    const c = getComputedStyle(grid);
    o.push(`GRID_STYLE: display=${c.display} cols=${c.gridTemplateColumns} autoCols=${c.gridAutoColumns} rowGap=${c.rowGap} colGap=${c.columnGap} justifyContent=${c.justifyContent} justifyItems=${c.justifyItems} pad=${c.paddingTop}/${c.paddingBottom} margin=${c.marginTop}/${c.marginBottom}`);
  }
  const card = isLive ? document.querySelector(".service-block") : document.querySelector("article.service-block");
  if (card) {
    const c = getComputedStyle(card);
    o.push(`CARD_STYLE: ${rr(card)} margin=${c.marginTop}/${c.marginRight}/${c.marginBottom}/${c.marginLeft} w=${c.width} h=${c.height}`);
  }
  // tooth
  const tooth = isLive ? document.querySelector(".service-block-teef") : document.querySelector('article.service-block img[src*="tooth"]');
  if (tooth) {
    const c = getComputedStyle(tooth);
    o.push(`TOOTH: ${rr(tooth)} src=${tooth.getAttribute("src")} w=${c.width} top=${c.top} right=${c.right} pos=${c.position}`);
  } else o.push("TOOTH: MISSING");
  // all tooth srcs
  const teeth = isLive ? [...document.querySelectorAll(".service-block-teef")] : [...document.querySelectorAll('article.service-block img[src*="tooth"]')];
  o.push("TOOTH_SRCS: " + teeth.map((t) => t.getAttribute("src").split("/").pop()).join(" | "));

  // panel + link internals for card0
  const panel = isLive ? document.querySelector(".service-block .h-40pc") : document.querySelector('article.service-block div[class*="rounded-b"]');
  if (panel) {
    const c = getComputedStyle(panel);
    o.push(`PANEL: ${rr(panel)} bgc=${c.backgroundColor} bgi=${c.backgroundImage} pad=${c.paddingLeft}/${c.paddingRight} radius=${c.borderRadius} overflow=${c.overflow}`);
    const cols = [...panel.children];
    cols.forEach((col, i) => {
      const cc = getComputedStyle(col);
      o.push(`  PANELCOL${i}: ${rr(col)} cls="${(col.className || "").slice(0, 80)}" pad=${cc.paddingTop}/${cc.paddingLeft} w=${cc.width} kids=${col.children.length}`);
    });
  }
  const firstA = isLive ? document.querySelector(".service-block .block-link") : document.querySelector("article.service-block a");
  if (firstA) {
    const label = firstA.querySelector("h6") || firstA.querySelector("span");
    const arrow = firstA.querySelector("img") || firstA.querySelector("svg");
    o.push(`LINK_A: ${rr(firstA)} | ${ff(firstA)}`);
    o.push(`LINK_LABEL(${label ? label.tagName : "?"}): ${rr(label)} | ${ff(label)}`);
    if (arrow) {
      const ac = getComputedStyle(arrow);
      o.push(`LINK_ARROW(${arrow.tagName}): ${rr(arrow)} src=${arrow.getAttribute("src") || "-"} display=${ac.display} opacity=${ac.opacity} filter=${ac.filter} ml=${ac.marginLeft}`);
    } else o.push("LINK_ARROW: MISSING");
  }
  // split counts
  const blocks = isLive ? [...document.querySelectorAll(".service-block")] : [...document.querySelectorAll("article.service-block")];
  o.push("SPLITS: " + blocks.map((b) => {
    const panelEl = isLive ? b.querySelector(".h-40pc") : b.querySelector('div[class*="rounded-b"]');
    const inner = isLive ? panelEl : panelEl.firstElementChild;
    return [...inner.children].map((col) => col.querySelectorAll("a").length).join("+");
  }).join(" , "));

  // pixel-ish: computed background of the deepest panel child area
  return o.join("\n");
};

const run = async () => {
  const b = await chromium.launch();
  try {
    for (const vp of VPS) {
      for (const [name, url, isLive] of [["LIVE", LIVE, true], ["CAND", CAND, false]]) {
        const ctx = await b.newContext({ viewport: { width: vp, height: 900 } });
        const page = await ctx.newPage();
        await page.goto(url, { waitUntil: "networkidle", timeout: 90000 }).catch(() => {});
        await page.waitForTimeout(1200);
        await settle(page);
        const txt = await page.evaluate(grab, isLive);
        const extra = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, bw: document.body.clientWidth }));
        console.log(`\n##### ${name} @${vp} scrollWidth=${extra.sw} bodyW=${extra.bw} #####\n${txt}`);
        await ctx.close();
      }
    }
  } finally {
    await b.close();
  }
};
run();
