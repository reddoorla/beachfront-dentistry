import { REF, PLAYWRIGHT, assertRef, group } from "./probe-ref.mjs";

await assertRef();
const { chromium } = await import(PLAYWRIGHT);

// the team/svc/qa triple, from harness.json's `group: "detail"` — was a
// three-row hand copy, and `O` was a self-host so this read our own build
const pages = Object.fromEntries(group("detail").map((p) => [p.key, p.ref]));
const b = await chromium.launch();
try {
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  for (const [k, path] of Object.entries(pages)) {
    await p.goto(REF + path, { waitUntil: "networkidle", timeout: 60000 });
    const info = await p.evaluate(() => {
      const paras = [...document.querySelectorAll("p")].filter(
        (e) => (e.textContent || "").length > 80,
      );
      const f = paras[0];
      if (!f) return null;
      const cs = getComputedStyle(f);
      const r = f.getBoundingClientRect();
      return `${cs.fontSize}/${cs.lineHeight} mb=${cs.marginBottom} x=${Math.round(r.left)} w=${Math.round(r.width)}`;
    });
    console.log(k, info);
  }
} finally {
  await b.close();
}
