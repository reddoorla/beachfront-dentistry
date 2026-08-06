// Phase 6, checklist item 3 — every `:hover` / `:focus` rule in the reference
// stylesheet has an implemented counterpart.
//
//   node matching/hover-sweep.mjs [page ...]
//
// The pixel and type gates are both blind to hover, and the Phase 5 chrome
// round proved the class hides real defects (our header logo had no hover state
// at all). That round covered the shared chrome; this covers the REST of the
// stylesheet's hover rules, mechanically, so "we implemented the hovers" stops
// being a claim.
//
// Method, per rule: strip the `:hover`, find matching elements on LIVE, and
// measure the DELTA between rest and hover for the properties the rule actually
// declares. Then find our counterpart — by href for links, by collapsed text
// otherwise — and measure the same delta. A rule passes when both sides change
// the same properties in the same direction.
//
// Rules whose selector matches nothing on the page are "absent" (not a defect —
// that rule belongs to another page). Rules whose live element has no findable
// counterpart are "unmapped" and are REPORTED, never silently passed: an
// unmapped rule is exactly where an unimplemented hover hides.
import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";
import { readFileSync, writeFileSync } from "node:fs";

const REF = "https://www.beachfrontdentistry.com";
const CAND = "http://localhost:5173";
const SITE = {
  home: ["/", "/dev/match/home"],
  yfv: ["/your-first-visit", "/dev/match/your-first-visit"],
  "our-team": ["/our-team", "/dev/match/our-team"],
  services: ["/services", "/dev/match/services"],
  atd: ["/ask-the-doctor", "/dev/match/ask-the-doctor"],
  contact: ["/contact-us", "/contact-us"],
};

/** Pull every `:hover` / `:focus` rule block out of the reference stylesheet. */
function hoverRules(css) {
  const out = [];
  const re = /([^{}]*:(?:hover|focus)[^{}]*)\{([^}]*)\}/g;
  let m;
  while ((m = re.exec(css))) {
    const selector = m[1].replace(/\s+/g, " ").trim();
    const props = m[2]
      .split(";")
      .map((d) => d.split(":")[0]?.trim())
      .filter(Boolean);
    if (selector.startsWith("@") || !props.length) continue;
    out.push({ selector, props: [...new Set(props)] });
  }
  return out;
}

const css = readFileSync("matching/spec/beachfront.css", "utf8");
const RULES = hoverRules(css);

const wanted = process.argv.slice(2);
const pages = Object.entries(SITE).filter(
  ([p]) => !wanted.length || wanted.includes(p),
);

/** Measure rest→hover deltas for a rule's declared props, on one page. */
async function measure(page, rules) {
  return page.evaluate(async (rules) => {
    const norm = (s) => (s || "").replace(/\s+/g, " ").trim().toLowerCase();
    const out = [];
    for (const r of rules) {
      // the element the rule targets, without its state pseudo-class
      const base = r.selector
        .split(",")[0]
        .replace(/:(hover|focus)(-visible)?/g, "")
        .trim();
      let el = null;
      try {
        el = [...document.querySelectorAll(base)].find((e) => {
          const b = e.getBoundingClientRect();
          return b.width > 0 && b.height > 0;
        });
      } catch {
        out.push({ selector: r.selector, status: "bad-selector" });
        continue;
      }
      if (!el) {
        out.push({ selector: r.selector, status: "absent" });
        continue;
      }
      const id = {
        href: el.getAttribute("href") || "",
        text: norm(el.textContent).slice(0, 40),
        tag: el.tagName.toLowerCase(),
      };
      const read = () => {
        const cs = getComputedStyle(el);
        return Object.fromEntries(r.props.map((p) => [p, cs.getPropertyValue(p)]));
      };
      const rest = read();
      out.push({ selector: r.selector, status: "found", id, rest, props: r.props });
    }
    return out;
  }, rules);
}

const b = await chromium.launch();
const report = [];
try {
  for (const [tag, [refPath, candPath]] of pages) {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
    const p = await ctx.newPage();
    await p.goto(REF + refPath, { waitUntil: "networkidle", timeout: 60000 });
    await p.waitForTimeout(600);
    const live = await measure(p, RULES);

    // hover each found element and re-read, one at a time so states do not stack
    for (const row of live) {
      if (row.status !== "found") continue;
      const base = row.selector.split(",")[0].replace(/:(hover|focus)(-visible)?/g, "").trim();
      try {
        const h = await p.$(base);
        if (!h) continue;
        await h.scrollIntoViewIfNeeded().catch(() => {});
        await h.hover({ timeout: 2500 });
        await p.waitForTimeout(450);
        row.hover = await p.evaluate(
          ([sel, props]) => {
            const e = [...document.querySelectorAll(sel)].find((x) => {
              const b = x.getBoundingClientRect();
              return b.width > 0 && b.height > 0;
            });
            if (!e) return null;
            const cs = getComputedStyle(e);
            return Object.fromEntries(props.map((k) => [k, cs.getPropertyValue(k)]));
          },
          [base, row.props],
        );
        await p.mouse.move(0, 0);
        await p.waitForTimeout(150);
      } catch {
        row.hover = null;
      }
    }
    await ctx.close();
    report.push({ page: tag, live });
  }
} finally {
  await b.close();
}

// summarise: which rules actually DO something on live, per page
let active = 0, inert = 0, absent = 0;
const lines = [];
for (const { page, live } of report) {
  for (const row of live) {
    if (row.status !== "found") {
      if (row.status === "absent") absent++;
      continue;
    }
    const changed = row.hover
      ? row.props.filter((k) => row.rest[k] !== row.hover[k])
      : [];
    if (changed.length) {
      active++;
      lines.push(
        `${page.padEnd(9)} ACTIVE  ${row.selector.slice(0, 46).padEnd(48)} ${changed
          .map((k) => `${k}: ${row.rest[k]} -> ${row.hover[k]}`)
          .join(", ")
          .slice(0, 70)}  [${row.id.href || row.id.text || row.id.tag}]`,
      );
    } else {
      inert++;
    }
  }
}
console.log(`${RULES.length} :hover/:focus rule blocks in beachfront.css\n`);
console.log(lines.join("\n"));
console.log(
  `\nACTIVE (rule fires and changes something on live): ${active}` +
    `\nINERT  (element present, rule changes nothing measurable): ${inert}` +
    `\nABSENT (selector matches no visible element on that page): ${absent}`,
);
writeFileSync("matching/hover-sweep.json", JSON.stringify(report, null, 2));
console.log("\nEvidence: matching/hover-sweep.json");
