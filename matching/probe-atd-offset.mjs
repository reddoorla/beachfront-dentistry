// Test the ledgered hypothesis for ask-the-doctor "Beyond the Smile":
// the 40-card grid is vertically OFFSET, not mis-coloured.
//
// Earlier probes confirmed card DIMENSIONS match and concluded "dE 34 = colour
// delta, not layout". But the run history shows mismatch RISING (64.9% ->
// 79.1%) as the height delta FELL (22.7% -> 2.1%), which is the signature of an
// offset grid: each card compares against a different card, and since the
// gradients vary card-to-card that reads as a large-area colour delta.
//
// Selectors are READ FROM SOURCE, not guessed (an earlier version of this probe
// climbed the DOM heuristically and landed on a full-page wrapper):
//   live  — .ask-the-doctor-collection-item is the Webflow .w-col-6 CELL,
//           .qa-block the card inside it (both counted 40x in the saved HTML).
//   ours  — the numbered variation renders one div.px-[10px] CELL per doc
//           inside the grid, with QuestionCard as its element child.
import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";

const VW = Number(process.argv[2] ?? 1440);
const ANCHOR = "beyond the smile";

const SEL = {
  live: ".ask-the-doctor-collection-item",
  ours: '[data-slice-variation="numbered"] .grid > div',
};

const settle = async (p) => {
  await p.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 250) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 80));
    }
    window.scrollTo(0, 0);
    for (let i = 0; i < 60; i++) {
      await new Promise((r) => setTimeout(r, 100));
      if (document.getAnimations().every((a) => a.playState !== "running")) break;
    }
    await new Promise((r) => setTimeout(r, 400));
  });
};

const READ = ({ sel, anchor }) => {
  const norm = (s) => (s ?? "").replace(/\s+/g, " ").trim().toLowerCase();
  // page-diff's cut rule: first element in document order whose collapsed text
  // starts with the anchor. Reproduce it so offsets are in the gate's frame.
  const regionEl = [...document.querySelectorAll("body *")].find((e) =>
    norm(e.textContent).startsWith(anchor),
  );
  const top = regionEl ? regionEl.getBoundingClientRect().top + window.scrollY : 0;

  const cells = [...document.querySelectorAll(sel)].map((cell, i) => {
    const cr = cell.getBoundingClientRect();
    const card = cell.firstElementChild ?? cell;
    const kr = card.getBoundingClientRect();
    const cs = getComputedStyle(card);
    return {
      i,
      cellY: Math.round(cr.top + window.scrollY - top),
      cellH: Math.round(cr.height),
      cardY: Math.round(kr.top + window.scrollY - top),
      cardH: Math.round(kr.height),
      cardW: Math.round(kr.width),
      x: Math.round(kr.left),
      bg: (cs.backgroundImage || "none").replace(/\s+/g, " ").slice(0, 52),
    };
  });
  return { top: Math.round(top), n: cells.length, cells };
};

const b = await chromium.launch();
const res = {};
try {
  for (const [name, url] of [
    ["live", "https://www.beachfrontdentistry.com/ask-the-doctor"],
    ["ours", "http://localhost:5173/dev/match/ask-the-doctor"],
  ]) {
    const p = await b.newPage({ viewport: { width: VW, height: 900 } });
    await p.goto(url, { waitUntil: "networkidle", timeout: 60000 });
    await settle(p);
    res[name] = await p.evaluate(READ, { sel: SEL[name], anchor: ANCHOR });
    await p.close();
  }
} finally {
  await b.close();
}

console.log(`ask-the-doctor "Beyond the Smile" @${VW}`);
console.log(`region top: live=${res.live.top} ours=${res.ours.top}`);
console.log(`cells: live=${res.live.n} ours=${res.ours.n}\n`);
console.log("  i   cellY(l/o)      Δ    cellH(l/o)     cardY(l/o)      Δ    cardHxW(l/o)");
for (let i = 0; i < Math.min(8, Math.max(res.live.n, res.ours.n)); i++) {
  const l = res.live.cells[i], o = res.ours.cells[i];
  if (!l || !o) { console.log(`  ${i}  missing on one side`); continue; }
  const p = (a, bb) => `${String(a).padStart(5)}/${String(bb).padEnd(5)}`;
  console.log(
    `  ${String(i).padStart(2)}  ${p(l.cellY, o.cellY)} ${String(o.cellY - l.cellY).padStart(6)}   ` +
      `${p(l.cellH, o.cellH)}  ${p(l.cardY, o.cardY)} ${String(o.cardY - l.cardY).padStart(6)}   ` +
      `${`${l.cardH}x${l.cardW}`.padStart(9)}/${`${o.cardH}x${o.cardW}`}`,
  );
}
const pitch = (r) => (r.cells.length > 2 ? r.cells[2].cellY - r.cells[0].cellY : null);
console.log(`\nrow pitch (cell 0 -> 2): live=${pitch(res.live)} ours=${pitch(res.ours)}`);
console.log(`grid start offset from region top: live=${res.live.cells[0]?.cellY} ours=${res.ours.cells[0]?.cellY}`);
const last = (r) => r.cells[r.cells.length - 1];
console.log(`last cell y: live=${last(res.live)?.cellY} ours=${last(res.ours)?.cellY}`);
console.log(`\ncard bg (0): live=${res.live.cells[0]?.bg}\n              ours=${res.ours.cells[0]?.bg}`);
