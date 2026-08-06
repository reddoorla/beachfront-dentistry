import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";
const O = "https://www.beachfrontdentistry.com";
const fmt = (el) => {
  if (!el) return null;
  const cs = getComputedStyle(el);
  const r = el.getBoundingClientRect();
  return `${cs.fontFamily.split(",")[0]} w${cs.fontWeight} ${cs.fontSize}/${cs.lineHeight} ls=${cs.letterSpacing} ${cs.color} x=${Math.round(r.left)} y=${Math.round(r.top + scrollY)} w=${Math.round(r.width)}`;
};
const pages = {
  team: "/team-members/dr-robert-quan",
  svc: "/services/dental-exams",
  qa: "/questions/regular-dental-cleanings-support-your-whole-body-health",
};
const b = await chromium.launch();
try {
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  for (const [k, path] of Object.entries(pages)) {
    await p.goto(O + path, { waitUntil: "networkidle", timeout: 60000 });
    const out = await p.evaluate((fmtSrc) => {
      const fmt = eval("(" + fmtSrc + ")");
      const hero = document.querySelector(".hero");
      const heroR = hero ? hero.getBoundingClientRect() : null;
      // hero foreground text (breadcrumb or name)
      const heroText = hero
        ? [...hero.querySelectorAll("h1,h2,h3,div,p,a")].find(
            (e) => (e.textContent || "").trim().length > 2 && getComputedStyle(e).position !== "static",
          ) || [...hero.querySelectorAll("h1,h2,h3")][0]
        : null;
      // circular headshot in hero (team)
      const heroImg = hero
        ? [...hero.querySelectorAll("img")].find((i) => {
            const r = i.getBoundingClientRect();
            return r.width > 150 && Math.abs(r.width - r.height) < 40;
          })
        : null;
      const heroImgR = heroImg ? heroImg.getBoundingClientRect() : null;
      // big title below hero
      const bigTitle = [...document.querySelectorAll("h1,h2,h3")].find((e) => {
        const r = e.getBoundingClientRect();
        return parseFloat(getComputedStyle(e).fontSize) > 60 && r.top + scrollY > 400;
      });
      // lede (large colored intro paragraph)
      const lede = [...document.querySelectorAll("p")].find((e) => {
        const fs = parseFloat(getComputedStyle(e).fontSize);
        const r = e.getBoundingClientRect();
        return fs >= 24 && r.top + scrollY > 400 && (e.textContent || "").length > 40;
      });
      // role (team: bold teal ~30 near top of body)
      const role = document.querySelector(".bio-section h2, .bio-section h3, .bio-section [class*='role'], .bio-section strong");
      // body subheading
      const sub = [...document.querySelectorAll("h4,h5,h6,strong,b")].find((e) => {
        const r = e.getBoundingClientRect();
        return r.top + scrollY > 700 && (e.textContent || "").trim().length > 5;
      });
      // hero bg image src
      let heroBg = "";
      if (hero)
        for (const d of [hero, ...hero.querySelectorAll("*")]) {
          const im = d.tagName === "IMG" && d.getBoundingClientRect().width > 400 ? d.currentSrc || d.src : "";
          const bg = getComputedStyle(d).backgroundImage;
          if (im) { heroBg = "IMG " + im; break; }
          if (bg && bg.includes("url")) { heroBg = "BG " + bg.match(/url\("?([^")]+)/)[1]; break; }
        }
      return {
        heroH: heroR ? Math.round(heroR.height) : null,
        heroText: heroText ? `"${heroText.textContent.trim().slice(0,30)}" ${fmt(heroText)}` : null,
        headshot: heroImgR ? `x=${Math.round(heroImgR.left)} y=${Math.round(heroImgR.top)} ${Math.round(heroImgR.width)}x${Math.round(heroImgR.height)}` : null,
        bigTitle: bigTitle ? `"${bigTitle.textContent.trim().slice(0,25)}" ${fmt(bigTitle)}` : null,
        lede: lede ? `"${lede.textContent.trim().slice(0,25)}" ${fmt(lede)}` : null,
        role: role ? `"${role.textContent.trim().slice(0,20)}" ${fmt(role)}` : null,
        subheading: sub ? `"${sub.textContent.trim().slice(0,25)}" ${fmt(sub)}` : null,
        heroBg,
      };
    }, fmt.toString());
    console.log(`\n===== ${k} (${path})`);
    console.log(JSON.stringify(out, null, 1));
  }
} finally {
  await b.close();
}
