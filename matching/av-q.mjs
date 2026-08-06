import fs from "node:fs";
const W = process.argv[2];
const kind = process.argv[3]; // text | imgs | sections
const rx = new RegExp(process.argv.slice(4).join(" "), "i");
const d = JSON.parse(fs.readFileSync(`matching/av-census-${W}.json`, "utf8"));
for (const n of ["live", "cand"]) {
  console.log(`\n===== ${n} @${W} =====`);
  for (const r of d[n][kind]) {
    const hay = kind === "text" ? `${r.t} ${r.cls} ${r.tag}` : kind === "imgs" ? `${r.src} ${r.cls} ${r.tag}` : `${r.cls} ${r.tag}`;
    if (!rx.test(hay)) continue;
    if (kind === "text")
      console.log(
        `y=${r.y} x=${r.x} ${r.w}x${r.h} ${r.tag}.${r.cls} | ${r.fs}/${r.lh} w${r.fw} ls${r.ls} ${r.ff} ${r.col} pad=${r.pad} | "${r.t}"`
      );
    else if (kind === "imgs") console.log(`y=${r.y} x=${r.x} ${r.w}x${r.h} ${r.tag}.${r.cls} ${r.src}`);
    else console.log(`y=${r.y} x=${r.x} ${r.w}x${r.h} ${r.tag}.${r.cls} pad=${r.pad} mar=${r.mar}`);
  }
}
