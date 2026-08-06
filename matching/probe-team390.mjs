import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";

const PATH = "/team-members/dr-robert-quan";
const REF = "https://www.beachfrontdentistry.com" + PATH;
const CAND = "http://localhost:5173" + PATH;
const VW = Number(process.argv[2] || 390);

const b = await chromium.launch();
try {
  for (const [side, url] of [
    ["ref", REF],
    ["cand", CAND],
  ]) {
    const p = await b.newPage({ viewport: { width: VW, height: 900 } });
    await p.goto(url, { waitUntil: "networkidle", timeout: 60000 });
    const H = await p.evaluate(() => document.body.scrollHeight);
    for (let y = 0; y < H; y += 200) {
      await p.evaluate((v) => scrollTo(0, v), y);
      await p.waitForTimeout(60);
    }
    await p.evaluate(() => scrollTo(0, 0));
    await p.waitForTimeout(1200);
    const out = await p.evaluate(() => {
      const rows = [];
      const push = (tag, el) => {
        if (!el) return rows.push(`${tag.padEnd(12)} MISSING`);
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        rows.push(
          `${tag.padEnd(12)} x=${Math.round(r.left)} y=${Math.round(r.top + scrollY)} ` +
            `${Math.round(r.width)}x${Math.round(r.height)} ` +
            `${cs.fontSize}/${cs.lineHeight} w${cs.fontWeight} ${cs.fontFamily.split(",")[0]} ` +
            `br=${cs.borderRadius} of=${cs.objectFit}`,
        );
      };
      // hero chrome
      const imgs = [...document.querySelectorAll("img,svg")];
      const round = imgs.find((e) => {
        const cs = getComputedStyle(e);
        const r = e.getBoundingClientRect();
        return (
          /9999|50%/.test(cs.borderRadius) && r.width > 60 && r.top + scrollY < 900
        );
      });
      push("headshot", round);
      // the site logo: first img/svg inside the header/nav
      const nav = document.querySelector("header,nav,.navbar,.nav");
      push("logo", nav && nav.querySelector("img,svg"));
      push(
        "burger",
        document.querySelector(
          "[aria-label*='enu'],.w-nav-button,.menu-button,button[class*='menu']",
        ),
      );
      // hero band + name
      const all = [...document.querySelectorAll("*")];
      const name = all.find((e) =>
        [...e.childNodes].some(
          (n) => n.nodeType === 3 && /^Dr\.? Robert Quan/.test(n.nodeValue.trim()),
        ),
      );
      push("name", name);
      const role = all.find((e) =>
        [...e.childNodes].some(
          (n) => n.nodeType === 3 && /^Dentist$/.test(n.nodeValue.trim()),
        ),
      );
      push("role", role);
      const paras = all.filter(
        (e) =>
          e.tagName === "P" &&
          /Dr Robert Quan was born|Following graduation|loves that dentistry/.test(
            e.textContent,
          ),
      );
      paras.forEach((el, i) => push("para" + (i + 1), el));
      return rows;
    });
    console.log(`\n===== ${side} @${VW}`);
    for (const r of out) console.log("  " + r);
    await p.close();
  }
} finally {
  await b.close();
}
