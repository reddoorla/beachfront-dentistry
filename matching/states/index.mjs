// Phase 5 state lists. One entry per interaction-inventory row.
//
// Scope (operator decision, 2026-08-05): the shared chrome is verified ONCE in
// depth here as `chrome`, then each page declares only its unique entries —
// re-running ~40 identical chrome states on nine pages buys nothing. The risk
// that buys is a page-specific chrome OVERRIDE going unseen, so `chrome-sweep`
// re-runs a cheap subset on every page to catch exactly that.
//
// Every expected value is read off LIVE in the same run; nothing here asserts a
// number. What a state declares is what to DO and which computed properties
// carry the behaviour.
//
// `props` notes:
//   • hover/focus states compare the real spec values (opacity, transform,
//     color) — those are rules, and they must match.
//   • open/close states compare `__visible` only. Live's panel is a div and
//     ours is a <dialog>; demanding identical `display` would fail a working
//     modal for being a different element. The question a state answers is
//     "does the thing open", not "is it the same tag".

const LIVE_NAV_LINK = 'a.no-text-dec[href="/your-first-visit"]';
// our off-canvas panel is `div[role=dialog]` (a fixed overlay), not a class
// mirroring live's `.dropdown-modal` — read off our own DOM, not assumed.
const OURS_PANEL = '[role="dialog"]';
const OURS_NAV_LINK = '[role="dialog"] a[href="/your-first-visit"]';

/** The off-canvas panel has to be open before anything inside it is reachable. */
const OPEN_PANEL = [
  { sel: ".link-block-4", candSel: 'button[aria-label="Open menu"]', action: "click" },
];

export const CHROME_STATES = [
  {
    name: "logo hover",
    sel: ".link-block-5",
    candSel: 'a[href="/"]',
    action: "hover",
    props: ["opacity", "transform"],
  },
  {
    name: "hamburger opens the off-canvas panel",
    sel: ".link-block-4",
    candSel: 'button[aria-label="Open menu"]',
    action: "click",
    target: ".dropdown-modal",
    candTarget: OURS_PANEL,
    props: ["__visible"],
    settle: 1200,
  },
  {
    name: "nav link hover (First Visit)",
    pre: OPEN_PANEL,
    sel: LIVE_NAV_LINK,
    candSel: OURS_NAV_LINK,
    action: "hover",
    props: ["opacity", "color"],
  },
  {
    name: "header Book an Appointment opens the modal",
    pre: OPEN_PANEL,
    sel: ".dropdown-modal .show-form",
    candSel: '[role="dialog"] a[href="#appointment"]',
    action: "click",
    target: ".form-modal",
    candTarget: "dialog",
    props: ["__visible"],
    settle: 1200,
  },
  {
    name: "Make a Payment hover",
    pre: OPEN_PANEL,
    sel: ".button.text-color-primary-dark.nav",
    candSel: '[role="dialog"] a[href^="https://app.modento.io"]',
    action: "hover",
    props: ["opacity"],
  },
  {
    name: "footer nav link hover (Our Team)",
    sel: '.footer a.inline-link[href="/our-team"]',
    candSel: 'footer a[href="/our-team"], .footer a[href="/our-team"]',
    action: "hover",
    props: ["opacity", "color"],
  },
  {
    name: "footer Make a Payment hover",
    sel: '.footer a.button[href^="https://app.modento.io"]',
    candSel: 'footer a[href^="https://app.modento.io"], .footer a[href^="https://app.modento.io"]',
    action: "hover",
    props: ["opacity"],
  },
  {
    name: "footer phone link hover",
    sel: '.footer a.inline-link[href^="tel:"]',
    candSel: 'footer a[href^="tel:"], .footer a[href^="tel:"]',
    action: "hover",
    props: ["opacity", "color"],
  },
  {
    name: "closing CTA button hover",
    sel: ".footer .show-form",
    candSel: ".closing-cta-button",
    action: "hover",
    props: ["opacity", "backgroundColor"],
  },
];

/** The nine gated pages, ref -> cand, same list gate.sh and census.sh drive. */
const SITE = {
  home: ["/", "/dev/match/home"],
  yfv: ["/your-first-visit", "/dev/match/your-first-visit"],
  "our-team": ["/our-team", "/dev/match/our-team"],
  services: ["/services", "/dev/match/services"],
  atd: ["/ask-the-doctor", "/dev/match/ask-the-doctor"],
  contact: ["/contact-us", "/contact-us"],
  team: ["/team-members/dr-robert-quan", "/team-members/dr-robert-quan"],
  svc: ["/services/dental-exams", "/services/dental-exams"],
  qa: [
    "/questions/regular-dental-cleanings-support-your-whole-body-health",
    "/questions/regular-dental-cleanings-support-your-whole-body-health",
  ],
};

// The cheap cross-page subset. Verifying the chrome ONCE (the operator's scope
// call) is only safe if a page-specific override cannot hide, and these four
// are the ones a page could plausibly re-style: the panel opening at all, a nav
// link, a footer link, and the closing CTA. Anything that differs here means
// the "chrome is chrome everywhere" assumption has broken on that page and the
// full list has to be re-run against it.
//
// NOTE: /services/<uid> and /team-members/<uid> have NO `.form-modal` on live
// (see _chrome.md §0), so a modal state on those pages would be measuring
// live's own broken buttons — excluded deliberately, not forgotten.
const SWEEP = CHROME_STATES.filter((s) =>
  /hamburger opens|nav link hover|footer nav link|closing CTA/.test(s.name),
);

export const PAGES = {
  chrome: {
    refPath: "/",
    candPath: "/dev/match/home",
    states: CHROME_STATES,
  },
  ...Object.fromEntries(
    Object.entries(SITE).map(([tag, [refPath, candPath]]) => [
      `sweep-${tag}`,
      { refPath, candPath, states: SWEEP },
    ]),
  ),
};
