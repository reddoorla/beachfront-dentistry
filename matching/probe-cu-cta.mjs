import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";
import fs from "node:fs";
const OUT =
  "/Users/tuckerlemos/Documents/GitHub/beachfront-dentistry/matching/";

async function settle(page) {
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 200) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 50));
    }
    window.scrollTo(0, document.body.scrollHeight);
    await new Promise((r) => setTimeout(r, 1200));
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 400));
  });
}

const dump = (side) => {
  const rows = [];
  const push = (label, el) => {
    if (!el) return rows.push({ label, missing: true });
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    rows.push({
      label,
      tag: el.tagName.toLowerCase(),
      cls: (el.className || "").toString().slice(0, 55),
      x: +r.x.toFixed(1),
      y: +(r.y + scrollY).toFixed(1),
      w: +r.width.toFixed(1),
      h: +r.height.toFixed(1),
      fs: cs.fontSize,
      lh: cs.lineHeight,
      fw: cs.fontWeight,
      ff: cs.fontFamily.split(",")[0],
      ls: cs.letterSpacing,
      color: cs.color,
      ta: cs.textAlign,
      of: cs.objectFit,
      op: cs.objectPosition,
      src: (el.currentSrc || el.src || "").slice(-70),
      nat: el.naturalWidth ? el.naturalWidth + "x" + el.naturalHeight : "",
      mar: `${cs.marginTop} ${cs.marginBottom}`,
      pad: `${cs.paddingTop} ${cs.paddingBottom}`,
      txt: (el.innerText || "").replace(/\s+/g, " ").trim().slice(0, 55),
    });
  };
  const q = (s) => document.querySelector(s);
  const all = (s) => Array.from(document.querySelectorAll(s));
  if (side === "live") {
    push("heroImgSection", q("section.hero.contact"));
    push("ctaH2", q("section.footer > h2"));
    push("fiji", q(".fiji-section"));
    all(".fiji-section a").forEach((a, i) => push("fijiBtn" + i, a));
    push("fijiLabel", q(".cta-beach-label"));
    push("fijiImg", q(".fiji-section img"));
    push("footerInfo", q(".footer-info-section"));
    push(
      "phone",
      q("section.info-section .footer-contact-block .footer-contact-info"),
    );
  } else {
    push("heroImg", q('section[data-slice-type="hero"] img'));
    const secs = all("main > *");
    secs.forEach((s, i) => push("mainChild" + i, s));
    push("ctaH2", q("main > section:last-of-type h2"));
    all("main > section:last-of-type a").forEach((a, i) =>
      push("ctaBtn" + i, a),
    );
    push("ctaImg", q("main > section:last-of-type img"));
    push("phone", q('section[data-section="info"] a[href^="tel"]'));
    push("hoursP", all('section[data-section="info"] p')[2]);
    push("addrP", q('section[data-section="info"] address p'));
  }
  return { rows, sh: document.documentElement.scrollHeight };
};

const res = {};
const browser = await chromium.launch();
try {
  for (const [side, url] of [
    ["live", "https://www.beachfrontdentistry.com/contact-us"],
    ["cand", "http://localhost:5173/contact-us"],
  ]) {
    res[side] = {};
    for (const vp of [1440, 390]) {
      const ctx = await browser.newContext({
        viewport: { width: vp, height: 900 },
        deviceScaleFactor: 1,
      });
      const page = await ctx.newPage();
      await page
        .goto(url, { waitUntil: "networkidle", timeout: 60000 })
        .catch(() => {});
      await page.waitForTimeout(1500);
      await settle(page);
      res[side][vp] = await page.evaluate(dump, side);
      if (vp === 1440) {
        await page.screenshot({
          path: OUT + `cu-${side}-hero.png`,
          clip: { x: 0, y: 0, width: vp, height: 560 },
        });
      }
      await ctx.close();
    }
  }
} finally {
  await browser.close();
}
fs.writeFileSync(OUT + "cu-cta.json", JSON.stringify(res, null, 1));
for (const side of ["live", "cand"]) {
  for (const vp of [1440, 390]) {
    console.log("=====", side, vp, "sh=" + res[side][vp].sh);
    for (const r of res[side][vp].rows) {
      console.log(
        "  " + r.label,
        r.missing
          ? "MISSING"
          : `[${r.tag}.${r.cls}] x${r.x} y${r.y} w${r.w} h${r.h} ${r.fs}/${r.lh} fw${r.fw} ${r.ff} ls${r.ls} ${r.color} ta:${r.ta} of:${r.of}/${r.op} nat:${r.nat} mar:${r.mar} pad:${r.pad} src:${r.src} '${r.txt}'`,
      );
    }
  }
}
