import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";

const VW = Number(process.argv[2] || 1440);
async function settle(p) {
  const H = await p.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < H; y += 200) {
    await p.evaluate((v) => scrollTo(0, v), y);
    await p.waitForTimeout(50);
  }
  await p.evaluate(() => scrollTo(0, document.body.scrollHeight));
  await p.waitForTimeout(1000);
  await p.evaluate(() => scrollTo(0, 0));
  await p.waitForTimeout(300);
}
const b = await chromium.launch();
try {
  for (const [name, url] of [
    ["live", "https://www.beachfrontdentistry.com/"],
    ["cand", "http://localhost:5173/dev/match/home"],
  ]) {
    const p = await b.newPage({ viewport: { width: VW, height: 900 } });
    try {
      await p.goto(url, { waitUntil: "networkidle", timeout: 90000 });
    } catch {
      await p.goto(url, { waitUntil: "domcontentloaded", timeout: 90000 });
      await p.waitForTimeout(3000);
    }
    await settle(p);
    const r = await p.evaluate(() => {
      const clean = (s) => (s || "").replace(/\s+/g, " ").trim();
      const out = [];
      const hit = (needle, label) => {
        for (const el of document.querySelectorAll("p,div,span,h4")) {
          if (el.children.length) continue;
          if (clean(el.textContent).startsWith(needle)) {
            let e = el,
              chain = [];
            for (let i = 0; i < 5 && e && e !== document.body; i++) {
              const cs = getComputedStyle(e);
              const rr = e.getBoundingClientRect();
              chain.push(
                `<${e.tagName.toLowerCase()}.${(e.className.baseVal ?? e.className ?? "").toString().split(" ")[0]} ${Math.round(rr.left)},${Math.round(rr.top + scrollY)} ${Math.round(rr.width)}x${Math.round(rr.height)} op=${cs.opacity} vis=${cs.visibility} ovf=${cs.overflow} clip=${cs.clipPath} mt=${cs.marginTop} pos=${cs.position} z=${cs.zIndex} col=${cs.color}>`,
              );
              e = e.parentElement;
            }
            out.push(`${label}:\n    ` + chain.join("\n    "));
            return;
          }
        }
        out.push(`${label}: NOT FOUND`);
      };
      hit("It is our goal", "3C-body-1");
      // read-reviews expander region
      const rr = [];
      for (const img of document.querySelectorAll("img")) {
        const b = img.getBoundingClientRect();
        const y = b.top + scrollY;
        if (y < 2250 || y > 2750) continue;
        const cs = getComputedStyle(img);
        rr.push(
          `img ${Math.round(b.left)},${Math.round(y)} ${Math.round(b.width)}x${Math.round(b.height)} op=${cs.opacity} vis=${cs.visibility} src=${(img.currentSrc || "").slice(-40)}`,
        );
      }
      out.push("read-reviews-band imgs:\n    " + rr.join("\n    "));
      // team head pitch
      const heads = [
        ...document.querySelectorAll("img[class*=headshot],img[class*=aspect-square]"),
      ].map((i) => i.getBoundingClientRect());
      out.push(
        `heads: n=${heads.length} first=${heads[0] ? Math.round(heads[0].left) + "," + Math.round(heads[0].width) + "x" + Math.round(heads[0].height) : "-"} pitch=${heads[1] ? Math.round(heads[1].left - heads[0].left) : "-"}`,
      );
      // team name labels
      const names = [];
      for (const el of document.querySelectorAll("h6,span,p,div")) {
        if (el.children.length) continue;
        const t = clean(el.textContent);
        if (t === "Stacey" || t === "Dr. Robert Quan" || t === "Enrique") {
          const bb = el.getBoundingClientRect();
          const cs = getComputedStyle(el);
          names.push(
            `${t} ${Math.round(bb.left)},${Math.round(bb.top + scrollY)} ${Math.round(bb.width)}x${Math.round(bb.height)} op=${cs.opacity} vis=${cs.visibility} fs=${cs.fontSize}/${cs.lineHeight} col=${cs.color} bg=${getComputedStyle(el.parentElement).backgroundColor}`,
          );
        }
      }
      out.push("team names:\n    " + names.join("\n    "));
      // broken images
      const broken = [...document.querySelectorAll("img")]
        .filter((i) => i.complete && i.naturalWidth === 0)
        .map((i) => (i.currentSrc || i.src).slice(-70));
      out.push("broken imgs: " + JSON.stringify(broken));
      // review slider clipping ancestors
      const q = [...document.querySelectorAll("p,blockquote")].find((e) =>
        clean(e.textContent).startsWith("This is my favorite"),
      );
      if (q) {
        let e = q,
          ch = [];
        for (let i = 0; i < 8 && e && e !== document.body; i++) {
          const cs = getComputedStyle(e);
          const rr2 = e.getBoundingClientRect();
          ch.push(
            `<${e.tagName.toLowerCase()}.${(e.className.baseVal ?? e.className ?? "").toString().split(" ")[0]} ${Math.round(rr2.left)},${Math.round(rr2.top + scrollY)} ${Math.round(rr2.width)}x${Math.round(rr2.height)} ovf=${cs.overflow} mr=${cs.marginRight} ml=${cs.marginLeft}>`,
          );
          e = e.parentElement;
        }
        out.push("review chain:\n    " + ch.join("\n    "));
      }
      return out;
    });
    console.log(`\n===== ${name} @${VW}`);
    for (const l of r) console.log("  " + l);
    await p.close();
  }
} finally {
  await b.close();
}
