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

const R = (el) => {
  const r = el.getBoundingClientRect();
  return {
    x: Math.round(r.left),
    y: Math.round(r.top + window.scrollY),
    w: Math.round(r.width * 10) / 10,
    h: Math.round(r.height * 10) / 10,
  };
};
const F = (el) => {
  const c = getComputedStyle(el);
  return `${c.fontFamily.split(",")[0]} ${c.fontWeight} ${c.fontSize}/${c.lineHeight} ls=${c.letterSpacing} ${c.color} tt=${c.textTransform} ta=${c.textAlign}`;
};

const grab = (isLive) => {
  const out = { cards: [] };
  const blocks = isLive
    ? [...document.querySelectorAll(".service-block")]
    : [...document.querySelectorAll("article.service-block")];
  for (const b of blocks) {
    const rr = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return {
        x: Math.round(r.left),
        y: Math.round(r.top + window.scrollY),
        w: Math.round(r.width * 10) / 10,
        h: Math.round(r.height * 10) / 10,
      };
    };
    const ff = (el) => {
      if (!el) return null;
      const c = getComputedStyle(el);
      return `${c.fontFamily.split(",")[0].replace(/["']/g, "")} ${c.fontWeight} ${c.fontSize}/${c.lineHeight} ls=${c.letterSpacing} ${c.color}`;
    };
    const h = b.querySelector("h1,h2,h3,h4,h5");
    const p = b.querySelector("p");
    const panel = isLive
      ? b.querySelector(".h-40pc, .bg-color-primary")
      : b.querySelector(
          '[class*="rounded-b"], .panel, div[class*="bg-[#129ecc]"]',
        );
    const links = [...b.querySelectorAll("a")];
    const cs = getComputedStyle(b);
    const tooth = b.querySelector("img");
    out.cards.push({
      rect: rr(b),
      bg: cs.backgroundColor,
      radius: cs.borderRadius,
      heading: h
        ? { t: h.innerText.trim(), tag: h.tagName, rect: rr(h), font: ff(h) }
        : null,
      para: p
        ? { rect: rr(p), font: ff(p), lines: p.innerText.trim().length }
        : null,
      panel: panel
        ? {
            rect: rr(panel),
            bg: getComputedStyle(panel).backgroundColor,
            radius: getComputedStyle(panel).borderRadius,
            bgImage: getComputedStyle(panel).backgroundImage.slice(0, 90),
            cls: (panel.className || "").slice(0, 120),
          }
        : null,
      toothSrc: tooth ? tooth.getAttribute("src") : null,
      toothRect: tooth ? rr(tooth) : null,
      links: links.map((a) => ({
        t: a.innerText.trim(),
        rect: rr(a),
        font: ff(a),
        href: a.getAttribute("href"),
      })),
    });
  }
  return out;
};

const run = async () => {
  const b = await chromium.launch();
  try {
    for (const vp of VPS) {
      for (const [name, url, isLive] of [
        ["LIVE", LIVE, true],
        ["CAND", CAND, false],
      ]) {
        const ctx = await b.newContext({
          viewport: { width: vp, height: 900 },
        });
        const page = await ctx.newPage();
        await page
          .goto(url, { waitUntil: "networkidle", timeout: 90000 })
          .catch(() => {});
        await page.waitForTimeout(1200);
        await settle(page);
        const data = await page.evaluate(grab, isLive);
        console.log(`\n##### ${name} @${vp} #####`);
        data.cards.forEach((c, i) => {
          console.log(
            `-- card${i} rect=${JSON.stringify(c.rect)} bg=${c.bg} r=${c.radius}`,
          );
          if (c.heading)
            console.log(
              `   H ${c.heading.tag} "${c.heading.t}" ${JSON.stringify(c.heading.rect)} | ${c.heading.font}`,
            );
          if (c.para)
            console.log(
              `   P ${JSON.stringify(c.para.rect)} | ${c.para.font} chars=${c.para.lines}`,
            );
          if (c.panel)
            console.log(
              `   PANEL ${JSON.stringify(c.panel.rect)} bg=${c.panel.bg} r=${c.panel.radius} img=${c.panel.bgImage}`,
            );
          console.log(
            `   TOOTH src=${c.toothSrc} rect=${JSON.stringify(c.toothRect)}`,
          );
          console.log(`   LINKS n=${c.links.length}`);
          c.links.forEach((a, j) =>
            console.log(
              `     ${j} "${a.t}" ${JSON.stringify(a.rect)} | ${a.font} | ${a.href}`,
            ),
          );
        });
        await ctx.close();
      }
    }
  } finally {
    await b.close();
  }
};
run();
