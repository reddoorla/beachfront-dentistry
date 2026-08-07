import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// The a11y suite audited three /dev/* FIXTURE routes and not one page a patient
// can reach. Fixtures exercise components in isolation, which is useful, but the
// violations that matter come from composition: the real nav over the real hero,
// a slice's colours against the section it actually lands in, a heading order
// that only exists once slices are stacked in publishing order. None of that is
// observable on a fixture — and pointing axe here found a real WCAG AA failure
// on three pages that had been green for the whole project.
//
// One page per TEMPLATE, since that is the unit of reuse: the five core pages
// (each a different slice assembly) plus one of each detail template, which
// together render every route type on the site.
const pages = [
  { path: "/", name: "home" },
  { path: "/your-first-visit", name: "your first visit" },
  { path: "/our-team", name: "our team" },
  { path: "/services", name: "services" },
  { path: "/ask-the-doctor", name: "ask the doctor" },
  { path: "/contact-us", name: "contact us" },
  { path: "/services/invisalign", name: "service detail" },
  { path: "/questions/how-to-stop-a-toothache-fast", name: "question detail" },
  { path: "/team-members/dr-robert-quan", name: "team member detail" },
];

/**
 * The ONE known-failing rule, recorded rather than suppressed.
 *
 * Every color-contrast node this suite finds is the same pair: live's brand
 * cyan `#129ecc` on its own pale band `#e7f5fa` — 2.77:1 against the 3:1 large
 * text threshold, so it misses WCAG 2.1 AA (1.4.3) by 0.23. It is the exact
 * defect already ledgered for the footer's "Want to learn more?" heading, where
 * the operator ACKed swapping in the AA-safe `--primary-deep`; this is the same
 * swap on a much larger surface (all four service-block titles, all eleven team
 * names, two /your-first-visit headings), so it is a brand-colour decision and
 * is awaiting one — see matching/LEDGER.md.
 *
 * This is deliberately NOT a blanket exclusion. The colour pair is asserted, so
 * a contrast failure anywhere with any OTHER pair fails the run, and the rule
 * list is asserted per page, so any new rule fails it too. When the colour is
 * decided, delete this constant and the suite tightens to zero automatically.
 */
const KNOWN_CONTRAST_PAIR = { fg: "#129ecc", bg: "#e7f5fa" };
const KNOWN_RULES: Record<string, string[]> = {
  "/your-first-visit": ["color-contrast"],
  "/our-team": ["color-contrast"],
  "/services": ["color-contrast"],
};

for (const { path, name } of pages) {
  test(`${name} has no axe violations`, async ({ page }) => {
    // Same reasoning as fixtures.spec.ts: audit under reduced motion so axe
    // never samples a mid-fade element, whose blended colour would trip a
    // spurious color-contrast violation. It is also the correct baseline —
    // motion-averse visitors see exactly this state.
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(path, { waitUntil: "networkidle" });

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      // Third-party embeds: the footer's Google map and the service pages'
      // YouTube player. Both are someone else's markup inside an iframe we do
      // not control and cannot fix, and the map is already a declared floor for
      // the pixel gate (matching/LEDGER.md). Everything around them is audited.
      .exclude("iframe[src*='google.com/maps']")
      .exclude("iframe[src*='youtube.com']")
      .exclude("iframe[src*='youtube-nocookie.com']")
      .analyze();

    // Every contrast failure must be the one known colour pair. A different
    // pair means a NEW defect hiding behind the known one.
    const unexpectedPairs = results.violations
      .filter((v) => v.id === "color-contrast")
      .flatMap((v) => v.nodes)
      .map((n) => n.any[0]?.data as { fgColor?: string; bgColor?: string })
      .filter(
        (d) =>
          d?.fgColor !== KNOWN_CONTRAST_PAIR.fg ||
          d?.bgColor !== KNOWN_CONTRAST_PAIR.bg,
      )
      .map((d) => `${d?.fgColor} on ${d?.bgColor}`);
    expect(unexpectedPairs, `unexpected contrast pair on ${path}`).toEqual([]);

    // Name the rule and the element in the failure, so a red run says what to
    // fix instead of printing an axe object graph.
    const rules = [...new Set(results.violations.map((v) => v.id))].sort();
    const detail = results.violations
      .map(
        (v) =>
          `${v.id} (${v.impact}) — ${v.help}\n    ${v.nodes
            .map((n) => n.target.join(" "))
            .slice(0, 5)
            .join("\n    ")}`,
      )
      .join("\n");
    expect(rules, `axe violations on ${path}\n${detail}`).toEqual(
      KNOWN_RULES[path] ?? [],
    );
  });
}
