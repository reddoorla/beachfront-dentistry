import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";
const [url, vw] = [process.argv[2], Number(process.argv[3] || 1440)];
const b = await chromium.launch();
try {
  const p = await b.newPage({ viewport: { width: vw, height: 900 } });
  await p.goto(url, { waitUntil: "load", timeout: 60000 });
  await p.waitForTimeout(2200);
  await p.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 250) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
    window.scrollTo(0, 0);
  });
  await p.waitForTimeout(3000);
  const out = await p.evaluate(() => {
    const L = [];
    const tup = (el) => {
      const cs = getComputedStyle(el);
      return `${(el.className || "").toString().slice(0, 50)} :: ${cs.fontFamily.split(",")[0]} ${cs.fontWeight} ${cs.fontSize}/${cs.lineHeight} ls=${cs.letterSpacing} ${cs.textTransform} ${cs.color}`;
    };
    const byText = (t, filter) =>
      [...document.querySelectorAll("*")].filter(
        (e) =>
          e.children.length === 0 &&
          (e.textContent || "").trim().toLowerCase() === t &&
          (!filter || filter(e)),
      );
    const abs = (el) => {
      const r = el.getBoundingClientRect();
      return {
        top: Math.round(r.top + scrollY),
        bottom: Math.round(r.bottom + scrollY),
        h: Math.round(r.height),
      };
    };
    // type targets
    for (const t of ["dr. robert quan", "01", "redondo beach, ca", "book an"])
      for (const el of byText(t).slice(0, 2)) L.push(`TXT "${t}" ${tup(el)}`);
    const quote = [...document.querySelectorAll("*")].find(
      (e) =>
        e.children.length === 0 &&
        (e.textContent || "")
          .trim()
          .startsWith("This is my favorite dentistry"),
    );
    if (quote) L.push(`TXT quote ${tup(quote)}`);
    const svcLabel = [...document.querySelectorAll("*")].filter(
      (e) =>
        e.children.length === 0 &&
        (e.textContent || "").trim() === "Services" &&
        getComputedStyle(e).color === "rgb(255, 255, 255)",
    );
    for (const el of svcLabel.slice(0, 1)) L.push(`TXT svc-label ${tup(el)}`);
    // geometry: sections by anchor text (whitespace-collapsed startsWith, parent-first like the harness)
    const norm = (s) => (s || "").replace(/\s+/g, " ").trim().toLowerCase();
    const anchorEl = (a) =>
      [
        ...document.querySelectorAll(
          "h1,h2,h3,h4,h5,h6,p,a,li,span,div,section,button",
        ),
      ].find((e) => norm(e.textContent).startsWith(norm(a)));
    for (const a of [
      "Finally have a dentist",
      "MEET YOUR TEAM",
      "Serving the South Bay",
      "Your Path to Oral Health",
      "Our dental team in Redondo",
      "What is the best routine",
      "Ready for great dental health",
      "Want to learn more?",
    ]) {
      const el = anchorEl(a);
      if (!el) {
        L.push(`GEO "${a}" NULL`);
        continue;
      }
      const r = abs(el);
      const cs = getComputedStyle(el);
      L.push(
        `GEO "${a}" top=${r.top} h=${r.h} mt=${cs.marginTop} mb=${cs.marginBottom} pt=${cs.paddingTop} pb=${cs.paddingBottom} tag=${el.tagName} cls=${(el.className || "").toString().slice(0, 40)}`,
      );
      // child pitch for the two mobile-fat sections
      if (/Serving|What is the best/.test(a)) {
        const kids = [...el.children].map((k) => {
          const kr = abs(k);
          const kcs = getComputedStyle(k);
          return `    child ${k.tagName}.${(k.className || "").toString().slice(0, 28)} top=${kr.top} h=${kr.h} mt=${kcs.marginTop} mb=${kcs.marginBottom}`;
        });
        L.push(...kids.slice(0, 10));
      }
    }
    // map embed
    const map = document.querySelector(
      "iframe[src*='google'], iframe[src*='map'], .w-widget-map, [class*=map]",
    );
    L.push(
      map
        ? `MAP ${map.tagName}.${(map.className || "").toString().slice(0, 40)} ${JSON.stringify(abs(map))} display=${getComputedStyle(map).display}`
        : "MAP none",
    );
    return L;
  });
  console.log(`=== ${url} @ ${vw} ===`);
  for (const l of out) console.log(l);
} finally {
  await b.close();
}
