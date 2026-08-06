// How many interactive elements does the SHARED CHROME actually contribute to
// each page's Phase 5 inventory?
//
//   node matching/probe-chrome-count.mjs
//
// `_chrome.md` §0 asserts the chrome markup is byte-identical on every page,
// but the page specs declared 32 (atd) / 31 (our-team, qa, services) / 24 (svc)
// for the same thing. One of those is wrong, and Phase 5 counts against these
// numbers — a wrong denominator silently excuses a skipped state.
//
// Counts on LIVE, per chrome region, using the selector families _chrome.md
// §3-5 specifies. Prints a per-page breakdown so a genuine per-page difference
// (a page that really lacks a band) is visible as a region row rather than
// hidden inside a total.
import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";

const REF = "https://www.beachfrontdentistry.com";
const PAGES = [
  ["home", "/"],
  ["yfv", "/your-first-visit"],
  ["our-team", "/our-team"],
  ["services", "/services"],
  ["atd", "/ask-the-doctor"],
  ["contact", "/contact-us"],
  ["svc", "/services/dental-exams"],
  ["team", "/team-members/dr-robert-quan"],
  ["qa", "/questions/regular-dental-cleanings-support-your-whole-body-health"],
];

// The chrome regions _chrome.md specs, in its own section order.
const REGIONS = [
  [
    "nav/header §3",
    ".header, .header-top, .nav-bar, .link-block-5, .link-block-4",
  ],
  ["off-canvas panel §3.5", ".modal-menu, .nav-modal, .modal-link"],
  ["appointment modal §3.6", ".form-modal"],
  [
    "closing CTA band §4",
    ".cta-section, .home-cta-section, .cta-beach-section",
  ],
  ["footer §5", ".footer"],
];

const b = await chromium.launch();
try {
  const rows = [];
  for (const [tag, path] of PAGES) {
    const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
    await p.goto(REF + path, { waitUntil: "networkidle", timeout: 60000 });
    await p.waitForTimeout(500);
    const out = await p.evaluate((regions) => {
      // "interactive" per the skill's Phase 1 rule: links, buttons, inputs, or
      // anything the stylesheet gives `cursor:pointer` / an open-state class.
      const isInteractive = (el) => {
        const t = el.tagName.toLowerCase();
        if (["a", "button", "input", "select", "textarea"].includes(t))
          return true;
        if (
          el.hasAttribute("data-w-id") &&
          getComputedStyle(el).cursor === "pointer"
        )
          return true;
        return (
          getComputedStyle(el).cursor === "pointer" &&
          /open|active|expand|menu|modal|dropdown|accordion|slider/i.test(
            typeof el.className === "string" ? el.className : "",
          )
        );
      };
      const seen = new Set();
      const per = {};
      for (const [label, sel] of regions) {
        const roots = [...document.querySelectorAll(sel)];
        let n = 0;
        for (const root of roots)
          for (const el of [root, ...root.querySelectorAll("*")]) {
            if (seen.has(el) || !isInteractive(el)) continue;
            seen.add(el);
            n++;
          }
        per[label] = n;
      }
      // everything interactive on the page, for the Phase 5 denominator
      const all = [...document.querySelectorAll("*")].filter(
        isInteractive,
      ).length;
      return { per, chrome: seen.size, all };
    }, REGIONS);
    rows.push({ tag, ...out });
    await p.close();
  }

  const labels = REGIONS.map(([l]) => l);
  console.log(
    "page".padEnd(10) +
      labels.map((l) => l.slice(0, 13).padStart(14)).join("") +
      "  chrome   page-total",
  );
  for (const r of rows)
    console.log(
      r.tag.padEnd(10) +
        labels.map((l) => String(r.per[l]).padStart(14)).join("") +
        String(r.chrome).padStart(8) +
        String(r.all).padStart(13),
    );
  const chromeCounts = new Set(rows.map((r) => r.chrome));
  console.log(
    `\nchrome total is ${chromeCounts.size === 1 ? "IDENTICAL" : "NOT identical"} across the nine pages: ${[...chromeCounts].join(", ")}`,
  );
} finally {
  await b.close();
}
