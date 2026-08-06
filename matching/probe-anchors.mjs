// Resolve every gate anchor on BOTH sides and print the per-region height, so a
// dh failure points at the block that owns the extra/missing space instead of
// being guessed at. Mirrors page-diff's cut rule: the first element in document
// order whose collapsed textContent starts with the anchor.
import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";

const [, , page = "home", vwArg = "834"] = process.argv;
const VW = Number(vwArg);

const PAGES = {
  home: [
    "/",
    "/dev/match/home",
    ["Finally have a dentist", "MEET YOUR TEAM", "Serving the South Bay", "Your Path to Oral Health", "Our dental team in Redondo", "Beyond the Smile", "Ready for great dental health", "Want to learn more"],
  ],
  yfv: [
    "/your-first-visit",
    "/dev/match/your-first-visit",
    ["We want you to feel comfortable", "Office Tour", "Dr. Robert Quan", "To be a long term health partner", "Serving the South Bay for over 40 years", "Ready for great dental health", "Want to learn more"],
  ],
  services: [
    "/services",
    "/dev/match/services",
    ["Cosmetic Dentistry", "General Dentistry", "Ready for great dental health", "Want to learn more"],
  ],
  "our-team": [
    "/our-team",
    "/dev/match/our-team",
    ["Our", "Dr. Robert Quan", "Ready for great dental health", "Want to learn more"],
  ],
  atd: [
    "/ask-the-doctor",
    "/dev/match/ask-the-doctor",
    ["Beyond the Smile", "Back to Top", "Ready for great dental health", "Want to learn more"],
  ],
};

const [refPath, candPath, anchors] = PAGES[page];
const settle = async (p) => {
  await p.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 250) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 80));
    }
    window.scrollTo(0, 0);
    // Wait out every running transition/animation, then confirm nothing new
    // started — a rect read while a reveal is still travelling includes its
    // un-fired offset and silently poisons every measurement downstream.
    for (let i = 0; i < 60; i++) {
      await new Promise((r) => setTimeout(r, 100));
      if (document.getAnimations().every((a) => a.playState !== "running")) break;
    }
    await new Promise((r) => setTimeout(r, 400));
  });
};

const READ = (anchors) => {
  const norm = (s) => (s ?? "").replace(/\s+/g, " ").trim().toLowerCase();
  const all = [...document.querySelectorAll("body *")];
  const out = {};
  for (const a of anchors) {
    const el = all.find((e) => norm(e.textContent).startsWith(norm(a)));
    out[a] = el
      ? Math.round(el.getBoundingClientRect().top + window.scrollY)
      : null;
  }
  out.__docHeight = Math.round(document.body.scrollHeight);
  return out;
};

const b = await chromium.launch();
const res = {};
try {
  for (const [name, url] of [
    ["live", `https://www.beachfrontdentistry.com${refPath}`],
    ["ours", `http://localhost:5173${candPath}`],
  ]) {
    const p = await b.newPage({ viewport: { width: VW, height: 900 } });
    await p.goto(url, { waitUntil: "networkidle", timeout: 60000 });
    await settle(p);
    res[name] = await p.evaluate(READ, anchors);
    await p.close();
  }
} finally {
  await b.close();
}

console.log(`${page} @${VW}`);
console.log(
  "region".padEnd(34) + "liveTop  ourTop  Δtop   liveH  ourH   ΔH",
);
const rows = [["top", 0], ...anchors.map((a) => [a, null])];
for (let i = 0; i < rows.length; i++) {
  const label = rows[i][0];
  const lTop = i === 0 ? 0 : res.live[label];
  const oTop = i === 0 ? 0 : res.ours[label];
  const nextLabel = rows[i + 1]?.[0];
  const lNext = nextLabel ? res.live[nextLabel] : res.live.__docHeight;
  const oNext = nextLabel ? res.ours[nextLabel] : res.ours.__docHeight;
  const lH = lTop != null && lNext != null ? lNext - lTop : null;
  const oH = oTop != null && oNext != null ? oNext - oTop : null;
  const f = (n) => (n == null ? "  —  " : String(n).padStart(6));
  console.log(
    label.slice(0, 33).padEnd(34) +
      f(lTop) + " " + f(oTop) + " " + f(oTop != null && lTop != null ? oTop - lTop : null) + "  " +
      f(lH) + " " + f(oH) + " " + f(oH != null && lH != null ? oH - lH : null),
  );
}
