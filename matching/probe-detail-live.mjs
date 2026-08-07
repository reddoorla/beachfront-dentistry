// Resolve live detail-page specs for all 3 detail types so the match build has
// the real hero bg + structure (LEDGER flagged the team-member hero bg unknown).
import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";

const ORIGIN = "https://www.beachfrontdentistry.com";

async function firstLink(p, listPath, re) {
  await p.goto(ORIGIN + listPath, { waitUntil: "networkidle", timeout: 60000 });
  return p.evaluate((reSrc) => {
    const rx = new RegExp(reSrc, "i");
    const hrefs = [...document.querySelectorAll("a[href]")]
      .map((a) => a.getAttribute("href"))
      .filter((h) => h && rx.test(h));
    return [...new Set(hrefs)][0] || null;
  }, re.source);
}

async function detailSpec(p, url) {
  await p.goto(url, { waitUntil: "networkidle", timeout: 60000 });
  return p.evaluate(() => {
    const pick = (sel) => document.querySelector(sel);
    // hero = the first band that has a background image or the .hero element
    const heroCandidates = [
      ...document.querySelectorAll(
        '[class*="hero"], header, section:first-of-type, .hero',
      ),
    ];
    let hero = null,
      heroBg = "",
      heroRect = null;
    for (const el of heroCandidates) {
      const cs = getComputedStyle(el);
      const bg = cs.backgroundImage;
      const r = el.getBoundingClientRect();
      if (r.height > 200 && r.top < 400) {
        // also scan descendants for a bg image
        let found = bg && bg.includes("url") ? bg : "";
        if (!found) {
          for (const d of el.querySelectorAll("*")) {
            const b = getComputedStyle(d).backgroundImage;
            const im = d.tagName === "IMG" ? d.currentSrc || d.src : "";
            if (b && b.includes("url")) {
              found = b;
              break;
            }
            if (im) {
              found = "img:" + im;
              break;
            }
          }
        }
        hero = el;
        heroBg = found;
        heroRect = { top: Math.round(r.top), height: Math.round(r.height) };
        break;
      }
    }
    const h1 = pick("h1");
    const cs1 = h1 ? getComputedStyle(h1) : null;
    // sections after hero
    const sections = [...document.querySelectorAll("section, .section")]
      .map((s) => {
        const r = s.getBoundingClientRect();
        return {
          cls: s.className.slice(0, 60),
          top: Math.round(r.top + window.scrollY),
          h: Math.round(r.height),
          txt: (s.textContent || "").trim().slice(0, 60),
        };
      })
      .slice(0, 8);
    return {
      url: location.href,
      heroClass: hero ? hero.className.slice(0, 80) : null,
      heroBg,
      heroRect,
      h1: h1 ? h1.textContent.trim() : null,
      h1Size: cs1
        ? `${cs1.fontSize}/${cs1.lineHeight} ${cs1.fontWeight} ${cs1.color}`
        : null,
      sections,
    };
  });
}

const b = await chromium.launch();
try {
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  for (const [label, listPath, re] of [
    ["TEAM-MEMBER", "/our-team", /team-member|\/dr-|staff/],
    ["SERVICE", "/services", /\/service/],
    ["QUESTION", "/ask-the-doctor", /question|\/faq|\/why-|\/what-|\/how-/],
  ]) {
    const link = await firstLink(p, listPath, re);
    console.log(`\n===== ${label}  firstLink=${link}`);
    if (!link) {
      console.log("  (no link found; dumping candidate hrefs)");
      const all = await p.evaluate(() =>
        [
          ...new Set(
            [...document.querySelectorAll("a[href]")].map((a) =>
              a.getAttribute("href"),
            ),
          ),
        ]
          .filter((h) => h && h.startsWith("/") && h.split("/").length > 2)
          .slice(0, 25),
      );
      console.log("  hrefs:", JSON.stringify(all));
      continue;
    }
    const url = link.startsWith("http") ? link : ORIGIN + link;
    const spec = await detailSpec(p, url);
    console.log(JSON.stringify(spec, null, 2));
  }
} finally {
  await b.close();
}
