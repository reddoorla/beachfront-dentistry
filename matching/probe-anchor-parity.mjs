// ANCHOR PARITY — does each gate anchor cut on a COMPARABLE element on both
// sides?
//
//   node matching/probe-anchor-parity.mjs [page ...]
//
// page-diff cuts at the first document-order element whose collapsed text
// starts with the anchor. If live wraps that text in an extra container and we
// do not (or vice versa), the two pages are cut at different heights and the
// whole region comparison is invalid — the score is then real arithmetic on the
// wrong windows, which is indistinguishable from a rendering defect until you
// look. That is exactly what happened to ask-the-doctor "Beyond the Smile":
// live cut at a `.qa-text` wrapper 220px above the heading we cut at, and the
// resulting 79-83% mismatch was logged for two days as a colour delta.
//
// This checks every anchor on every gated page before any of those numbers are
// trusted again.
import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";

const REF = "https://www.beachfrontdentistry.com";
const CAND = "http://localhost:5173";

// Must mirror matching/gate.sh exactly.
const PAGES = {
  home: ["/", "/dev/match/home", ["Finally have a dentist", "MEET YOUR TEAM", "Serving the South Bay", "Your Path to Oral Health", "Our dental team in Redondo", "Beyond the Smile", "Ready for great dental health", "Want to learn more"]],
  yfv: ["/your-first-visit", "/dev/match/your-first-visit", ["We want you to feel comfortable", "Office Tour", "Dr. Robert Quan", "To be a long term health partner", "Serving the South Bay for over 40 years", "Ready for great dental health", "Want to learn more"]],
  "our-team": ["/our-team", "/dev/match/our-team", ["Our", "Dr. Robert Quan", "Ready for great dental health", "Want to learn more"]],
  services: ["/services", "/dev/match/services", ["Cosmetic Dentistry", "General Dentistry", "Ready for great dental health", "Want to learn more"]],
  atd: ["/ask-the-doctor", "/dev/match/ask-the-doctor", ["Beyond the Smile", "Back to Top", "Ready for great dental health", "Want to learn more"]],
  contact: ["/contact-us", "/contact-us", ["Book Appointment", "Ready for great dental health", "Want to learn more"]],
  team: ["/team-members/dr-robert-quan", "/team-members/dr-robert-quan", ["Dentist", "Back to Team", "Ready for great", "Want to learn more"]],
  svc: ["/services/dental-exams", "/services/dental-exams", ["What to expect", "Back to All Services", "Ready for great", "Want to learn more"]],
  qa: ["/questions/regular-dental-cleanings-support-your-whole-body-health", "/questions/regular-dental-cleanings-support-your-whole-body-health", ["At Beachfront Dentistry", "Have another question", "Ready for great", "Want to learn more"]],
};

const VW = Number(process.env.VW ?? 1440);
const want = process.argv.slice(2);
const pages = Object.keys(PAGES).filter((p) => !want.length || want.includes(p));

const settle = async (p) => {
  await p.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 250) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
    window.scrollTo(0, 0);
    for (let i = 0; i < 40; i++) {
      await new Promise((r) => setTimeout(r, 100));
      if (document.getAnimations().every((a) => a.playState !== "running")) break;
    }
    await new Promise((r) => setTimeout(r, 300));
  });
};

const READ = (anchors) => {
  const norm = (s) => (s ?? "").replace(/\s+/g, " ").trim().toLowerCase();
  const all = [...document.querySelectorAll("body *")];
  return anchors.map((a) => {
    const hits = all.filter((e) => norm(e.textContent).startsWith(norm(a)));
    const el = hits[0];
    if (!el) return { anchor: a, missing: true, n: 0 };
    const r = el.getBoundingClientRect();
    return {
      anchor: a,
      n: hits.length,
      tag: el.tagName.toLowerCase(),
      cls: (el.className?.toString() ?? "").slice(0, 34),
      y: Math.round(r.top + window.scrollY),
      h: Math.round(r.height),
      // how far the cut element sits above the NEXT hit — the size of the
      // wrapper that only one side may have
      drop: hits[1] ? Math.round(hits[1].getBoundingClientRect().top + window.scrollY - (r.top + window.scrollY)) : 0,
    };
  });
};

const b = await chromium.launch();
const problems = [];
try {
  for (const page of pages) {
    const [refPath, candPath, anchors] = PAGES[page];
    const out = {};
    for (const [name, url] of [["live", REF + refPath], ["ours", CAND + candPath]]) {
      const p = await b.newPage({ viewport: { width: VW, height: 900 } });
      try {
        await p.goto(url, { waitUntil: "networkidle", timeout: 60000 });
        await settle(p);
        out[name] = await p.evaluate(READ, anchors);
      } catch (e) {
        out[name] = anchors.map((a) => ({ anchor: a, missing: true, err: String(e).slice(0, 40) }));
      }
      await p.close();
    }
    console.log(`\n===== ${page} @${VW}`);
    for (let i = 0; i < anchors.length; i++) {
      const l = out.live[i], o = out.ours[i];
      // What actually breaks a region comparison is the cut element CONTAINING
      // different content, which shows up as a height ratio — not a tag
      // difference. Live wrapping a heading in a 320px `.qa-text` where we cut
      // at the 80px heading itself is fatal (4x); live using <div> where we use
      // <footer> for the same ~710px block is cosmetic. Flag on the ratio.
      const ratio = l.missing || o.missing ? Infinity
        : Math.max(l.h, o.h) / Math.max(1, Math.min(l.h, o.h));
      const bad = l.missing || o.missing || ratio >= 1.5;
      const flag = l.missing || o.missing ? "!! UNRESOLVED" : bad ? `!! MISMATCH ${ratio.toFixed(1)}x` : "   ok        ";
      console.log(`${flag} "${l.anchor}"`);
      const fmt = (s, x) => x.missing
        ? `      ${s}: NOT FOUND${x.err ? " (" + x.err + ")" : ""}`
        : `      ${s}: <${x.tag} class="${x.cls}"> y=${x.y} h=${x.h} hits=${x.n} nextHitDrop=${x.drop}`;
      console.log(fmt("live", l));
      console.log(fmt("ours", o));
      if (bad) problems.push({ page, anchor: l.anchor, live: l, ours: o, ratio });
    }
  }
} finally {
  await b.close();
}

console.log(`\n\n########## SUMMARY @${VW}`);
if (!problems.length) {
  console.log("All anchors resolve to comparable elements. Region scores are measuring what they claim.");
} else {
  console.log(`${problems.length} anchor(s) cut on non-comparable elements — every region score BELOW each of these is suspect:\n`);
  problems.sort((a, b) => b.ratio - a.ratio);
  for (const p of problems) {
    const d = p.live.missing || p.ours.missing
      ? "UNRESOLVED on " + (p.live.missing ? "live" : "ours")
      : `live h=${p.live.h} vs ours h=${p.ours.h} (${p.ratio.toFixed(1)}x)`;
    console.log(`  ${p.page.padEnd(9)} "${p.anchor}"  <${p.live.tag ?? "?"}> vs <${p.ours.tag ?? "?"}>  ${d}`);
  }
}
process.exit(problems.length ? 1 : 0);
