import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";
const b = await chromium.launch();
const settle = async (p) => {
  await p.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 250) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 700));
  });
};
try {
  for (const vw of [1440, 834, 390]) {
    const p = await b.newPage({ viewport: { width: vw, height: 900 } });
    await p.goto("https://www.beachfrontdentistry.com/", {
      waitUntil: "networkidle",
      timeout: 60000,
    });
    await settle(p);
    const r = await p.evaluate(() => {
      const bx = (el) => {
        if (!el) return "MISSING";
        const b = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        return `${Math.round(b.width)}x${Math.round(b.height)} x=${Math.round(b.x)} y=${Math.round(b.y + scrollY)} m=${cs.margin} as=${cs.alignSelf} op=${cs.opacity} r=${cs.borderRadius}`;
      };
      const out = [];
      const flex = document.querySelector(".home-floats-section");
      out.push(
        `floats ${bx(flex)} dir=${flex ? getComputedStyle(flex).flexDirection : "-"} jc=${flex ? getComputedStyle(flex).justifyContent : "-"}`,
      );
      document.querySelectorAll(".expanding-box").forEach((el, i) => {
        const txt = el.querySelector(".expanding-text");
        const lab = el.querySelector(".expanding-label");
        const img = el.querySelector(
          "img:not(.expanding-plus):not(.expanding-minus)",
        );
        const grad = el.querySelector("[class*='gradient']");
        out.push(
          `box${i} [${el.className.replace("expanding-box", "").trim()}] ${bx(el)}`,
        );
        out.push(
          `   text ${bx(txt)} fs=${txt ? getComputedStyle(txt).fontSize : "-"}`,
        );
        out.push(
          `   label ${bx(lab)} bg=${lab ? getComputedStyle(lab).backgroundColor : "-"} pad=${lab ? getComputedStyle(lab).padding : "-"}`,
        );
        out.push(
          `   img ${bx(img)} fit=${img ? getComputedStyle(img).objectFit : "-"} pos=${img ? getComputedStyle(img).objectPosition : "-"}`,
        );
        out.push(
          `   grad ${grad ? grad.className : "none"} ${bx(grad)} bgi=${grad ? getComputedStyle(grad).backgroundImage.slice(0, 110) : "-"}`,
        );
        const lt = lab?.querySelector("div,span,p,h1,h2,h3,h4,h5,h6");
        out.push(
          `   labelText "${lt ? lt.textContent.trim() : ""}" ${lt ? getComputedStyle(lt).fontSize + "/" + getComputedStyle(lt).lineHeight + " w" + getComputedStyle(lt).fontWeight + " " + getComputedStyle(lt).color : ""}`,
        );
      });
      return out.join("\n  ");
    });
    console.log(`===== live @${vw}\n  ${r}`);
    await p.close();
  }
} finally {
  await b.close();
}
