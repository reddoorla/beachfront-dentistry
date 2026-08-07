// home @834: live vs ours, element-by-element for the five failing regions.
import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";
import { writeFileSync } from "node:fs";

const VW = Number(process.argv[2] ?? 834);
const settle = async (p) => {
  await p.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 300) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 600));
  });
};

const READ = () => {
  const box = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return {
      x: Math.round(r.x),
      y: Math.round(r.y + window.scrollY),
      w: Math.round(r.width),
      h: Math.round(r.height),
      font: `${cs.fontSize}/${cs.lineHeight} ${cs.fontWeight}`,
      color: cs.color,
      bg: cs.backgroundColor,
      bgImage: cs.backgroundImage.slice(0, 90),
      radius: cs.borderRadius,
      display: cs.display,
      pad: `${cs.paddingTop} ${cs.paddingRight} ${cs.paddingBottom} ${cs.paddingLeft}`,
      margin: `${cs.marginTop} ${cs.marginRight} ${cs.marginBottom} ${cs.marginLeft}`,
      text: (el.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 70),
    };
  };
  const find = (re, tags = "h1,h2,h3,h4,h5,p,div,span") =>
    [...document.querySelectorAll(tags)].find((el) =>
      re.test((el.textContent ?? "").replace(/\s+/g, " ").trim()),
    );
  const out = { root: getComputedStyle(document.documentElement).fontSize };

  // --- heading "Finally have a dentist"
  const h = [...document.querySelectorAll("h1,h2,h3")].find((el) =>
    /^Finally have a dentist/.test(
      (el.textContent ?? "").replace(/\s+/g, " ").trim(),
    ),
  );
  out.heading = box(h);

  // --- the three feature cards (Comfort / Comprehensive / Caring)
  out.cards = ["Comfort", "Comprehensive", "Caring"].map((label) => {
    const lab = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6,div,span,p")]
      .filter(
        (el) => (el.textContent ?? "").replace(/\s+/g, " ").trim() === label,
      )
      .pop();
    if (!lab) return { label, missing: true };
    // walk up to the card box (first ancestor wider than 200px with a radius)
    let card = lab;
    for (let i = 0; i < 8 && card.parentElement; i++) {
      card = card.parentElement;
      const cs = getComputedStyle(card);
      if (
        card.getBoundingClientRect().width > 200 &&
        parseFloat(cs.borderTopLeftRadius) > 0
      )
        break;
    }
    const img = card.querySelector("img");
    const btn = card.querySelector("button,[role='button'],a");
    return {
      label,
      labelBox: box(lab),
      card: box(card),
      cardHTML: card.outerHTML.slice(0, 300),
      img: img
        ? { ...box(img), src: (img.currentSrc || img.src).slice(-60) }
        : null,
      hasButton: !!btn,
      buttonText: btn
        ? (btn.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 40)
        : null,
      visibleText: (card.innerText ?? "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 160),
    };
  });

  // --- MEET YOUR TEAM avatar row
  const eyebrow = find(/^MEET YOUR TEAM/i);
  out.meetEyebrow = box(eyebrow);
  const avatars = [...document.querySelectorAll("img")]
    .map((im) => ({ im, r: im.getBoundingClientRect() }))
    .filter(({ im, r }) => {
      const cs = getComputedStyle(im);
      return (
        Math.abs(r.width - r.height) < 4 &&
        r.width > 60 &&
        parseFloat(cs.borderTopLeftRadius) >= r.width / 2 - 2
      );
    });
  out.avatars = avatars.slice(0, 6).map(({ im }) => box(im));
  out.avatarCount = avatars.length;

  return out;
};

const b = await chromium.launch();
const out = {};
try {
  for (const [name, url] of [
    ["live", "https://www.beachfrontdentistry.com/"],
    ["ours", "http://localhost:5173/dev/match/home"],
  ]) {
    const p = await b.newPage({ viewport: { width: VW, height: 900 } });
    await p.goto(url, { waitUntil: "networkidle", timeout: 60000 });
    await settle(p);
    out[name] = await p.evaluate(READ);
    await p.close();
  }
} finally {
  await b.close();
}
writeFileSync(`matching/home${VW}.json`, JSON.stringify(out, null, 1), "utf8");

const f = (o) => JSON.stringify(o);
console.log(`root: live=${out.live.root} ours=${out.ours.root}`);
console.log(`heading live: ${f(out.live.heading)}`);
console.log(`heading ours: ${f(out.ours.heading)}`);
for (let i = 0; i < 3; i++) {
  console.log(`\n-- card ${i} --`);
  console.log(` live card: ${f(out.live.cards[i]?.card)}`);
  console.log(` ours card: ${f(out.ours.cards[i]?.card)}`);
  console.log(` live img : ${f(out.live.cards[i]?.img)}`);
  console.log(` ours img : ${f(out.ours.cards[i]?.img)}`);
  console.log(
    ` live btn=${out.live.cards[i]?.hasButton} "${out.live.cards[i]?.buttonText}" text="${out.live.cards[i]?.visibleText}"`,
  );
  console.log(
    ` ours btn=${out.ours.cards[i]?.hasButton} "${out.ours.cards[i]?.buttonText}" text="${out.ours.cards[i]?.visibleText}"`,
  );
}
console.log(
  `\navatars live n=${out.live.avatarCount} ${f(out.live.avatars[0])}`,
);
console.log(`avatars ours n=${out.ours.avatarCount} ${f(out.ours.avatars[0])}`);
console.log(`eyebrow live ${f(out.live.meetEyebrow)}`);
console.log(`eyebrow ours ${f(out.ours.meetEyebrow)}`);
