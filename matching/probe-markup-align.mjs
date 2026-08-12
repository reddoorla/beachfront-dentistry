// MarkUp round 2026-08 — left-align ladder probe (board d486b3c5).
// Reports the LEFT x of every horizontal anchor Tim's pins name on home,
// plus the RIGHT x of the hero CTA vs the hamburger, at each width.
// After the fix all lefts must be equal per width, and the two rights equal.
//
//   node matching/probe-markup-align.mjs            # cand only
//   node matching/probe-markup-align.mjs --live     # live too (reference)
//   node matching/probe-markup-align.mjs 1440,1294  # custom widths
import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";

const CAND = "http://localhost:5173/dev/match/home";
// 2026-08-10: production cut over to our Netlify build; the Webflow original
// lives on at its staging domain (see gate.sh REF note).
const LIVE = "https://beachfront-dentistry.webflow.io/";

const args = process.argv.slice(2);
const wantLive = args.includes("--live") || args.includes("--liveonly");
const wantCand = !args.includes("--liveonly");
const vpArg = args.find((a) => /^\d/.test(a));
const VPS = vpArg ? vpArg.split(",").map(Number) : [1440, 1294, 1200, 834, 390];

// Each anchor: [label, cand finder, live finder]. Finders run in the page and
// return an element or null.
const FINDERS = `({
  logo: {
    cand: () => document.querySelector('a[href="/"] img'),
    live: () => document.querySelector('.header a img, a.brand img, .navbar a img'),
  },
  heroH1: {
    cand: () => document.querySelector('[data-slice-variation="default"] h1'),
    live: () => document.querySelector('h1.home-hero-heading'),
  },
  finallyH: {
    cand: () => document.querySelector('[data-slice-type="section_grid"] h2'),
    live: () => document.querySelector('.home-floats-section h1, h1.my-4'),
  },
  firstCard: {
    cand: () => document.querySelector('[data-grid-columns] > *'),
    live: () => document.querySelector('.expanding-box'),
  },
  teamLabel: {
    cand: () => document.querySelector('[data-slice-variation="team"] p'),
    live: () => document.querySelector('.home-meet-your-team-section h6'),
  },
  firstCircle: {
    cand: () => document.querySelector('[data-slice-variation="team"] a[href^="/team-members"] img'),
    live: () => document.querySelector('.heads-slider .heads'),
  },
  fiji: {
    cand: () => [...document.querySelectorAll('[data-slice-variation="cta"] p')].find((p) => /fiji/i.test(p.textContent)),
    live: () => document.querySelector('.cta-beach-label'),
  },
  footerH: {
    cand: () => document.querySelector('footer p.font-slab'),
    live: () => document.querySelector('.footer-learn-more'),
  },
  // right-edge pair
  heroCta: {
    cand: () => [...document.querySelectorAll('[data-slice-variation="default"] a')].find((a) => /appointment/i.test(a.textContent)),
    live: () => document.querySelector('a.button.position-absolute-bottom-right'),
  },
  hamburger: {
    cand: () => [...document.querySelectorAll('button[aria-label="Open menu"]')].find((b) => b.getBoundingClientRect().width > 0),
    live: () => document.querySelector('.hamburger, .menu-button, .w-nav-button, img.hamburger'),
  },
})`;

async function probe(page, url, side) {
  const rows = {};
  for (const vp of VPS) {
    await page.setViewportSize({ width: vp, height: 900 });
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForTimeout(side === "live" ? 2500 : 1200);
    rows[vp] = await page.evaluate(
      ([findersSrc, side]) => {
        const finders = eval(findersSrc);
        const out = {};
        for (const [key, f] of Object.entries(finders)) {
          const el = f[side]();
          if (!el) {
            out[key] = null;
            continue;
          }
          const r = el.getBoundingClientRect();
          // hamburger's visual edge is its inner icon (button is min-w-44 with
          // justify-end), so measure the last child if there is one.
          if (key === "hamburger" && el.lastElementChild) {
            const ir = el.lastElementChild.getBoundingClientRect();
            out[key] = { x: +ir.x.toFixed(1), r: +ir.right.toFixed(1) };
          } else {
            out[key] = { x: +r.x.toFixed(1), r: +r.right.toFixed(1) };
          }
        }
        return out;
      },
      [FINDERS, side],
    );
  }
  return rows;
}

const LEFTS = [
  "logo",
  "heroH1",
  "finallyH",
  "firstCard",
  "teamLabel",
  "firstCircle",
  "fiji",
  "footerH",
];

function table(rows, side) {
  const pad = (s, n) => String(s ?? "—").padStart(n);
  console.log(`\n== ${side.toUpperCase()} — anchor LEFT x ==`);
  console.log(pad("vp", 6) + LEFTS.map((k) => pad(k, 12)).join(""));
  for (const vp of VPS) {
    console.log(
      pad(vp, 6) +
        LEFTS.map((k) => pad(rows[vp][k] ? rows[vp][k].x : null, 12)).join(""),
    );
  }
  console.log(`\n== ${side.toUpperCase()} — RIGHT edges (CTA vs hamburger) ==`);
  console.log(pad("vp", 6) + pad("heroCta.r", 12) + pad("hamburger.r", 13));
  for (const vp of VPS) {
    console.log(
      pad(vp, 6) +
        pad(rows[vp].heroCta ? rows[vp].heroCta.r : null, 12) +
        pad(rows[vp].hamburger ? rows[vp].hamburger.r : null, 13),
    );
  }
}

const browser = await chromium.launch();
const page = await browser.newPage();
if (wantCand) {
  const cand = await probe(page, CAND, "cand");
  table(cand, "cand");
}
if (wantLive) {
  const live = await probe(page, LIVE, "live");
  table(live, "live");
}
await browser.close();
