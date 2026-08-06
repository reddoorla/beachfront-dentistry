import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";
const [url, vw, anchor, depth] = [process.argv[2], Number(process.argv[3]), process.argv[4], Number(process.argv[5] || 2)];
const b = await chromium.launch();
try {
  const p = await b.newPage({ viewport: { width: vw, height: 900 } });
  await p.goto(url, { waitUntil: "load", timeout: 60000 });
  await p.waitForTimeout(2200);
  await p.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 250) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); }
    window.scrollTo(0, 0);
  });
  await p.waitForTimeout(3000);
  const out = await p.evaluate(([anchor, depth]) => {
    const norm = (s) => (s || "").replace(/\s+/g, " ").trim().toLowerCase();
    const el = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6,p,a,li,span,div,section,button")].find((e) => norm(e.textContent).startsWith(norm(anchor)));
    if (!el) return ["NULL"];
    const L = [];
    const walk = (node, d, prefix) => {
      const r = node.getBoundingClientRect();
      const cs = getComputedStyle(node);
      L.push(`${prefix}${node.tagName}.${(node.className || "").toString().slice(0, 36)} top=${Math.round(r.top + scrollY)} h=${Math.round(r.height)} mt=${cs.marginTop} mb=${cs.marginBottom} pt=${cs.paddingTop} pb=${cs.paddingBottom} gap=${cs.rowGap}`);
      if (d < depth) for (const k of node.children) walk(k, d + 1, prefix + "  ");
    };
    walk(el, 0, "");
    return L;
  }, [anchor, depth]);
  console.log(`=== ${url} @${vw} "${anchor}" ===`);
  for (const l of out) console.log(l);
} finally { await b.close(); }
