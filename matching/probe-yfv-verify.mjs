import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";
import { writeFileSync } from "node:fs";
const REF = "https://www.beachfrontdentistry.com/your-first-visit";
const b = await chromium.launch();
try {
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto(REF, { waitUntil: "networkidle", timeout: 60000 });
  // settle
  const h = await p.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < h; y += 200) {
    await p.evaluate((y) => scrollTo(0, y), y);
    await p.waitForTimeout(60);
  }
  await p.evaluate(() => scrollTo(0, 0));
  await p.waitForTimeout(400);

  // save full HTML for grepping
  const html = await p.content();
  writeFileSync(
    "/Users/tuckerlemos/Documents/GitHub/beachfront-dentistry/matching/spec/your-first-visit.html",
    html,
  );

  const dump = await p.evaluate(() => {
    const sectionOf = (text) => {
      const el = [...document.querySelectorAll("*")].find(
        (e) =>
          e.textContent.replace(/\s+/g, " ").trim().toLowerCase().startsWith(text.toLowerCase()) &&
          e.children.length < 3,
      );
      // climb to the section wrapper
      let s = el;
      while (s && s.parentElement && !/section|div/i.test(s.tagName)) s = s.parentElement;
      return el;
    };
    const secWrap = (headingText) => {
      let el = [...document.querySelectorAll("h1,h2,h3")].find((e) =>
        e.textContent.replace(/\s+/g, " ").trim().toLowerCase().startsWith(headingText.toLowerCase()),
      );
      let s = el;
      while (s && !(s.className && /section/i.test(s.className)) && s.parentElement) s = s.parentElement;
      return s || el?.parentElement;
    };
    const textRows = (root) =>
      !root
        ? []
        : [...root.querySelectorAll("*")]
            .filter((el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.nodeValue.trim()))
            .slice(0, 40)
            .map((el) => {
              const cs = getComputedStyle(el);
              return `${el.tagName}.${(el.className || "").toString().split(" ")[0]} ${cs.fontFamily.split(",")[0].replace(/"/g,"")} w${cs.fontWeight} ${cs.fontSize}/${cs.lineHeight} ${cs.color} ${cs.textTransform} — "${el.textContent.replace(/\s+/g," ").trim().slice(0, 55)}"`;
            });

    // EXAM section — the key contradiction
    const exam = secWrap("First Exam");
    const examImgs = exam ? [...exam.querySelectorAll("img")].map((i) => i.src.split("/").pop().slice(0, 40)) : [];
    const examCols = exam ? getComputedStyle(exam).display + " cols=" + (exam.querySelector("[class*=col],[class*=w-col]") ? "yes" : "no") : "";
    const hasMIN = exam ? /\bMIN\b/.test(exam.textContent) : false;
    const hasStepNums = exam ? /\b0[0-6]\b/.test(exam.textContent) : false;

    // TOC
    const toc = secWrap("We want you to feel");
    const tocCards = toc ? [...toc.querySelectorAll("a")].map((a) => a.textContent.replace(/\s+/g," ").trim().slice(0,40)) : [];
    const tocArrows = toc ? [...toc.querySelectorAll("img")].map((i)=>i.src.split("/").pop()) : [];

    // OFFICE TOUR slider
    const tour = secWrap("Office Tour");
    const slider = tour?.querySelector(".w-slider, [class*=slider]");
    const slides = slider ? slider.querySelectorAll(".w-slide, [class*=slide]").length : 0;
    const dots = slider ? slider.querySelectorAll(".w-slider-dot, [class*=dot]").length : 0;
    const arrows = slider ? slider.querySelectorAll(".w-slider-arrow-left, .w-slider-arrow-right, [class*=arrow]").length : 0;
    const slide0 = slider?.querySelector(".w-slide, [class*=slide]");
    const slideRect = slide0 ? (() => { const r = slide0.getBoundingClientRect(); return `${Math.round(r.width)}x${Math.round(r.height)}`; })() : "";

    // TEAM slider
    const team = secWrap("Meet Our Team");
    const teamSlider = team?.querySelector(".w-slider, [class*=slider]");
    const teamCards = teamSlider ? teamSlider.querySelectorAll("[class*=slide]").length : 0;
    const teamArrows = team ? [...team.querySelectorAll("img")].map((i)=>i.src.split("/").pop()).filter(s=>/arrow/i.test(s)) : [];

    return {
      EXAM: { wrapperClass: exam?.className?.toString().slice(0,60), display: examCols, hasMIN, hasStepNums, imgs: examImgs, rows: textRows(exam) },
      TOC: { wrapperClass: toc?.className?.toString().slice(0,60), cards: tocCards, arrows: tocArrows, rows: textRows(toc) },
      TOUR: { sliderClass: slider?.className?.toString().slice(0,60), slides, dots, arrows, slide0: slideRect },
      TEAM: { sliderClass: teamSlider?.className?.toString().slice(0,60), teamCards, teamArrows },
    };
  });
  console.log(JSON.stringify(dump, null, 2));
} finally {
  await b.close();
}
