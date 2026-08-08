// Does the PUBLISHED route match the fixture the gates actually measure?
//
//   node matching/gate-published.mjs                 # all five core pages
//   node matching/gate-published.mjs home services   # just these
//
// WHY THIS EXISTS. Every gate in this project runs against /dev/match/*, which
// reads src/lib/beachfront-pages.js directly and never round-trips through
// Prismic. The Migration API drops any field the registered slice model does not
// declare — HTTP 200, no warning — and strips `\n` out of StructuredText. Both
// have already shipped defects here (three broken subpage heroes, a missing
// Read Reviews expander, the closing CTA band 168px short on five pages) while
// every gate stayed green. CLAUDE.md's rule is therefore "after any seed, diff a
// real route against its /dev/match/* twin rather than assuming they agree" —
// this is that diff, as a script instead of a thing to remember.
//
// It compares the two surfaces three ways, because they fail differently:
//   1. HEIGHT   — a dropped field usually removes a whole block. This is the
//                 loudest signal and the one that caught the 168px CTA loss.
//   2. TEXT     — every visible string on both pages, diffed. Catches a field
//                 that changed content without changing layout.
//   3. HEAD     — title + meta description, which live only in the CMS document
//                 and are invisible to every pixel and text gate on the site.
//
// Run the dev server first (npm run dev). Sandbox must be disabled.
import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";

const BASE = process.env.CAND_BASE ?? "http://localhost:5173";
const VIEWPORTS = [1440, 834, 390];
const PAGES = [
  "home",
  "your-first-visit",
  "our-team",
  "services",
  "ask-the-doctor",
];

/** The real route for a uid ("home" lives at /, the rest at /<uid>). */
const realPath = (uid) => (uid === "home" ? "/" : `/${uid}`);

/** Scroll the whole page so reveal animations fire, then let it settle. */
async function settle(page) {
  const h = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < h; y += 400) {
    await page.evaluate((n) => window.scrollTo(0, n), y);
    await page.waitForTimeout(90);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);
}

async function snapshot(browser, url, width) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
    await settle(page);
    return await page.evaluate(() => ({
      height: document.body.scrollHeight,
      title: document.title,
      description:
        document
          .querySelector('meta[name="description"]')
          ?.getAttribute("content") ?? null,
      // Visible text only: an element with no layout box contributes nothing a
      // visitor can read, and off-canvas nav duplicates would otherwise dominate.
      text: [...document.querySelectorAll("h1,h2,h3,h4,h5,h6,p,li,a,button")]
        .filter((el) => el.getClientRects().length > 0)
        .map((el) => (el.textContent ?? "").replace(/\s+/g, " ").trim())
        .filter(Boolean),
    }));
  } finally {
    await page.close();
  }
}

/** Multiset difference — a line present N times on one side and M on the other. */
function missing(fromList, inList) {
  const counts = new Map();
  for (const t of inList) counts.set(t, (counts.get(t) ?? 0) + 1);
  const out = [];
  for (const t of fromList) {
    const n = counts.get(t) ?? 0;
    if (n === 0) out.push(t);
    else counts.set(t, n - 1);
  }
  return out;
}

const want = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const pages = want.length ? want : PAGES;
const browser = await chromium.launch();
let failures = 0;

try {
  for (const uid of pages) {
    console.log(`\n########## ${uid} ##########`);
    for (const vw of VIEWPORTS) {
      const real = await snapshot(browser, `${BASE}${realPath(uid)}`, vw);
      const twin = await snapshot(browser, `${BASE}/dev/match/${uid}`, vw);

      const dh = real.height - twin.height;
      // 1% or 24px, whichever is larger — the same shape of tolerance the pixel
      // gate uses, so a few px of image-decode jitter is not a failure.
      const tol = Math.max(24, twin.height * 0.01);
      const heightOk = Math.abs(dh) <= tol;

      const lost = missing(twin.text, real.text);
      const extra = missing(real.text, twin.text);

      const ok = heightOk && lost.length === 0;
      if (!ok) failures++;
      console.log(
        `  vw${vw}  ${ok ? "PASS" : "FAIL"}  h real=${real.height} twin=${twin.height} ` +
          `Δ=${dh}  text lost=${lost.length} extra=${extra.length}`,
      );
      for (const t of lost.slice(0, 6))
        console.log(`      LOST  "${t.slice(0, 80)}"`);
      // `extra` is expected and not a failure: the real route carries chrome the
      // fixture route does not (the appointment modal's markup, skip link, and
      // any nav the match harness strips). Printed for eyeballing only.
      for (const t of extra.slice(0, 3))
        console.log(`      extra "${t.slice(0, 80)}"`);
    }

    // Head fields exist ONLY on the published document — /dev/match has none, so
    // there is nothing to diff against. Assert they are present and non-empty.
    const real = await snapshot(browser, `${BASE}${realPath(uid)}`, 1440);
    const headOk = !!real.description && real.description.length >= 70;
    if (!headOk) failures++;
    console.log(
      `  head  ${headOk ? "PASS" : "FAIL"}  title="${real.title}"\n` +
        `        description=${real.description ? `"${real.description.slice(0, 90)}…" (${real.description.length})` : "MISSING"}`,
    );
  }
} finally {
  await browser.close();
}

console.log(
  failures === 0
    ? "\nALL PASS — every published route matches its fixture twin."
    : `\n${failures} FAILURE(S) — the published content and the gated fixture disagree.`,
);
process.exit(failures === 0 ? 0 : 1);
