import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";

const PAGES = [
  ["team", "/team-members/dr-robert-quan", /^Dr\.? Robert Quan/, /^Dentist$/],
  ["svc", "/services/dental-exams", /^Services\s*\/?/, /^Dental Exams$/],
  [
    "qa",
    "/questions/regular-dental-cleanings-support-your-whole-body-health",
    /^Blog\s*\/?/,
    /^Beyond the Smile|^Regular Dental/,
  ],
];
const VWS = [768, 834, 991];

const b = await chromium.launch();
try {
  for (const [tag, path, labelRe, titleRe] of PAGES) {
    for (const vw of VWS) {
      const line = [];
      for (const [side, base] of [
        ["ref", "https://www.beachfrontdentistry.com"],
        ["cand", "http://localhost:5173"],
      ]) {
        const p = await b.newPage({ viewport: { width: vw, height: 900 } });
        await p.goto(base + path, { waitUntil: "networkidle", timeout: 60000 });
        const H = await p.evaluate(() => document.body.scrollHeight);
        for (let y = 0; y < H; y += 250) {
          await p.evaluate((v) => scrollTo(0, v), y);
          await p.waitForTimeout(45);
        }
        await p.evaluate(() => scrollTo(0, 0));
        await p.waitForTimeout(900);
        const r = await p.evaluate(
          ([ls, ts]) => {
            const L = new RegExp(ls),
              T = new RegExp(ts);
            const all = [...document.querySelectorAll("*")];
            const txt = (e) =>
              [...e.childNodes]
                .filter((n) => n.nodeType === 3)
                .map((n) => n.nodeValue.trim())
                .join(" ")
                .trim();
            const fmt = (e) => {
              if (!e) return "—";
              const cs = getComputedStyle(e);
              const bb = e.getBoundingClientRect();
              return `${cs.fontSize}/${cs.lineHeight}w${cs.fontWeight}@x${Math.round(bb.left)}`;
            };
            const label = all.find((e) => txt(e) && L.test(txt(e)));
            const title = all.find((e) => txt(e) && T.test(txt(e)));
            const para = all.find(
              (e) =>
                e.tagName === "P" &&
                txt(e).length > 120 &&
                e.getBoundingClientRect().top + scrollY > 300,
            );
            return `label=${fmt(label)} title=${fmt(title)} body=${fmt(para)}`;
          },
          [labelRe.source, titleRe.source],
        );
        line.push(`${side}: ${r}`);
        await p.close();
      }
      console.log(`\n${tag} @${vw}`);
      for (const l of line) console.log("   " + l);
    }
  }
} finally {
  await b.close();
}
