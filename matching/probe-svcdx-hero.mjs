import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";

const LIVE = "https://www.beachfrontdentistry.com/services";
const CAND = "http://localhost:5173/dev/match/services";

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
  const rr = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return `{x:${Math.round(r.left)},y:${Math.round(r.top + window.scrollY)},w:${Math.round(r.width * 10) / 10},h:${Math.round(r.height * 10) / 10}}`;
  };
  const o = [];
  // hero media
  if (isLive) {
    const hero = document.querySelector("section.hero");
    const c = getComputedStyle(hero);
    o.push(
      `HERO_BG: size=${c.backgroundSize} pos=${c.backgroundPosition} repeat=${c.backgroundRepeat} img=${c.backgroundImage.slice(0, 130)}`,
    );
  } else {
    const img = document.querySelector("main section img");
    const c = img ? getComputedStyle(img) : null;
    o.push(
      `HERO_IMG: ${rr(img)} src=${((img && img.currentSrc) || "").slice(0, 160)} nat=${img && img.naturalWidth}x${img && img.naturalHeight} complete=${img && img.complete} objectFit=${c && c.objectFit} objectPos=${c && c.objectPosition}`,
    );
  }
  // wave
  const wave = isLive
    ? document.querySelector(".bot-wave")
    : document.querySelector(
        'main section div[class*="bottom-0"] div[class*="rotate-180"]',
      );
  o.push(`WAVE: ${rr(wave)}`);
  const waveSvg = wave && wave.querySelector("svg");
  if (waveSvg)
    o.push(
      `WAVE_SVG: ${rr(waveSvg)} fill=${getComputedStyle(waveSvg.querySelector("path") || waveSvg).fill}`,
    );
  // header / nav
  const hdr = document.querySelector("section.header, header, nav");
  o.push(
    `HEADERISH: ${hdr ? hdr.tagName + "." + (hdr.className || "").slice(0, 60) : "MISSING"} ${rr(hdr)} pos=${hdr ? getComputedStyle(hdr).position : "-"}`,
  );
  // CTA + footer
  const ctaH = isLive
    ? document.querySelector("section.footer > h2")
    : document.querySelector('main section[class*="-mb-"] h2, footer h2');
  o.push(
    `CTA_H2: ${rr(ctaH)} ${ctaH ? getComputedStyle(ctaH).fontSize + "/" + getComputedStyle(ctaH).lineHeight + " m=" + getComputedStyle(ctaH).marginTop + "/" + getComputedStyle(ctaH).marginBottom : ""} :: ${ctaH ? ctaH.innerText.replace(/\s+/g, " ").slice(0, 40) : ""}`,
  );
  const fiji = isLive
    ? document.querySelector(".fiji-section")
    : document.querySelector(
        'main section div[class*="min-h-"][class*="isolate"]',
      );
  o.push(
    `FIJI: ${rr(fiji)} ${fiji ? "mt=" + getComputedStyle(fiji).marginTop + " mb=" + getComputedStyle(fiji).marginBottom + " h=" + getComputedStyle(fiji).height : ""}`,
  );
  const info = isLive
    ? document.querySelector(".footer-info-section")
    : document.querySelector("footer");
  o.push(`FOOTER_INFO: ${rr(info)}`);
  // body children census
  o.push("BODY_CHILDREN:");
  for (const c of document.body.children) {
    const r = c.getBoundingClientRect();
    if (r.height < 2) continue;
    o.push(
      `  ${c.tagName.toLowerCase()}.${(c.className && typeof c.className === "string" ? c.className : "").slice(0, 50)} ${rr(c)}`,
    );
  }
  return o.join("\n");
};

const run = async () => {
  const b = await chromium.launch();
  try {
    for (const vp of [1440, 834, 390]) {
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
        console.log(
          `\n##### ${name} @${vp} #####\n` +
            (await page.evaluate(grab, isLive)),
        );
        await ctx.close();
      }
    }
  } finally {
    await b.close();
  }
};
run();
