import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";

const LIVE = "https://www.beachfrontdentistry.com/your-first-visit";
const CAND = "http://localhost:5173/dev/match/your-first-visit";

async function settle(p) {
  const H = await p.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < H + 800; y += 200) {
    await p.evaluate((v) => scrollTo(0, v), y);
    await p.waitForTimeout(50);
  }
  await p.evaluate(() => scrollTo(0, 0));
  await p.waitForTimeout(1100);
}

const probe = (specs) => {
  const fmt = (el) => {
    if (!el) return "NOT-FOUND";
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return (
      `y=${Math.round(r.top + scrollY)} h=${Math.round(r.height)} x=${Math.round(r.left)} w=${Math.round(r.width)}` +
      ` | ${cs.fontFamily.split(",")[0]} ${cs.fontWeight} ${cs.fontSize}/${cs.lineHeight} ls=${cs.letterSpacing} col=${cs.color} ta=${cs.textAlign} tt=${cs.textTransform}` +
      ` bg=${cs.backgroundColor} rad=${cs.borderRadius} pad=${cs.padding} mar=${cs.margin} disp=${cs.display} pos=${cs.position}` +
      (el.tagName === "IMG" ? ` NAT=${el.naturalWidth}x${el.naturalHeight} fit=${cs.objectFit}` : "") +
      ` TXT="${(el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 90)}"`
    );
  };
  const out = [];
  for (const [name, sel, idx] of specs) {
    const els = document.querySelectorAll(sel);
    const el = els[idx || 0];
    out.push(`${name.padEnd(26)} n=${els.length} ${fmt(el)}`);
  }
  return out.join("\n");
};

const LIVE_SPECS = [
  ["hero.section", "section.hero.group-photo", 0],
  ["hero.h1", ".first-visit-heading", 0],
  ["toc.section", "section.fv-toc-section", 0],
  ["toc.intro", ".text-body-large.max-w-490px", 0],
  ["toc.rightcol", "._w-half.px-4", 0],
  ["toc.item1", ".visit-list-item", 0],
  ["toc.num1", ".visit-list-number", 0],
  ["toc.h3", ".visit-list-item h3", 0],
  ["toc.arrow", ".visit-list-item img", 0],
  ["toc.btnbook", ".fv-toc-section .button", 0],
  ["toc.btnform", ".fv-toc-section .button", 1],
  ["tour.section", ".fv-virtual-tour-section", 0],
  ["tour.h1", ".fv-virtual-tour-section h1", 0],
  ["tour.sliderbox", ".h-half-screen-width", 0],
  ["tour.slide1img", ".fv-virtual-tour-section .w-slide img", 0],
  ["tour.arrowL", ".fv-virtual-tour-section .w-slider-arrow-left", 0],
  ["tour.nav", ".fv-virtual-tour-section .w-slider-nav", 0],
  ["tour.dot1", ".fv-virtual-tour-section .w-slider-dot", 0],
  ["tour.hoursblk", ".fv-virtual-tour-section .footer-contact-block", 0],
  ["tour.hourshdr", ".fv-virtual-tour-section .footer-contact-header", 0],
  ["tour.contactblk", ".fv-virtual-tour-section .footer-contact-block", 1],
  ["meet.section", ".fv-meet-our-team-section", 0],
  ["meet.h2", ".fv-meet-our-team-section h2", 0],
  ["meet.holder", ".team-slider-holder", 0],
  ["meet.card1", ".team-slider .team-list-item", 0],
  ["meet.head1", ".team-slider .team-grid-headshot", 0],
  ["meet.teaser1", ".team-slider .team-teaser", 0],
  ["meet.arrowL", ".team-slider-arrow.left", 0],
  ["exam.section", ".fv-exam-section", 0],
  ["exam.leftcol", ".fv-exam-section ._w-30pc", 0],
  ["exam.h3", ".fv-exam-section h3", 0],
  ["exam.introp", ".fv-exam-section ._w-30pc p", 0],
  ["exam.img", ".fv-exam-section img._w-60pc", 0],
  ["exam.regbox", ".registration-forms-box", 0],
  ["exam.regcircle", ".registration-forms-box .step-circle", 0],
  ["exam.regnum", ".registration-forms-box .circle-time-number", 0],
  ["exam.regmin", ".registration-forms-box h6", 0],
  ["exam.regh5", ".registration-forms-box h5", 0],
  ["exam.regp", ".registration-forms-box p", 0],
  ["exam.regbtn1", ".registration-forms-box .button", 0],
  ["exam.stepcont", ".first-exam-step-container", 0],
  ["exam.step1", ".exam-step", 0],
  ["exam.step1circle", ".exam-step .step-circle", 0],
  ["exam.step1p", ".exam-step p", 0],
  ["rev.section", ".fv-review-section", 0],
  ["rev.h1", ".fv-review-section h1", 0],
  ["rev.holder", ".review-slider-holder", 0],
  ["rev.viewport", ".review-slider-holder-viewport", 0],
  ["rev.card", ".big-review", 0],
];

const CAND_SPECS = [
  ["hero.section", "[data-slice-type=hero]", 0],
  ["hero.h1", "[data-slice-type=hero] h1", 0],
  ["toc.section", "[data-slice-type=first_visit_toc]", 0],
  ["toc.intro", "[data-slice-type=first_visit_toc] p", 0],
  ["toc.item1", ".visit-list-item", 0],
  ["toc.num1", ".visit-list-item span", 0],
  ["toc.h3", ".visit-list-item h3", 0],
  ["toc.arrow", ".visit-list-item img", 0],
  ["toc.btnbook", "[data-slice-type=first_visit_toc] a[href*=appointment]", 0],
  ["tour.section", "#office-tour", 0],
  ["tour.h1", "#office-tour h1", 0],
  ["tour.sliderbox", "#office-tour .overflow-hidden", 0],
  ["tour.slide1img", "#office-tour img", 0],
  ["tour.arrowL", "#office-tour button", 0],
  ["tour.dots", "#office-tour .flex.gap-2", 0],
  ["tour.dot1", "#office-tour .flex.gap-2 > *", 0],
  ["tour.hoursblk", "#office-tour .footer-contact-block", 0],
  ["meet.section", "#meet-our-team", 0],
  ["meet.h2", "#meet-our-team h2", 0],
  ["meet.holder", "#meet-our-team .overflow-hidden", 0],
  ["meet.card1", ".team-list-item", 0],
  ["meet.head1", ".team-list-item img[class*=rounded-full]", 0],
  ["meet.teaser1", ".team-list-item p", 0],
  ["meet.arrowL", "#meet-our-team button", 0],
  ["exam.section", "#first-exam", 0],
  ["exam.h3", "#first-exam h3", 0],
  ["exam.introp", "#first-exam p", 0],
  ["exam.img", "#first-exam img", 0],
  ["exam.regh5", "#first-exam h5", 0],
  ["rev.section", "[data-slice-type=carousel]", 1],
];

const b = await chromium.launch();
try {
  for (const vw of [1440, 834, 390]) {
    for (const [name, url, specs] of [
      ["LIVE", LIVE, LIVE_SPECS],
      ["CAND", CAND, CAND_SPECS],
    ]) {
      const p = await b.newPage({ viewport: { width: vw, height: 900 } });
      await p.goto(url, { waitUntil: "networkidle", timeout: 90000 });
      await settle(p);
      console.log(`\n===== ${name} @${vw} =====`);
      console.log(await p.evaluate(probe, specs));
      await p.close();
    }
  }
} finally {
  await b.close();
}
