import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";
const REF = "https://www.beachfrontdentistry.com/your-first-visit";
const b = await chromium.launch();
try {
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto(REF, { waitUntil: "networkidle", timeout: 60000 });
  const h = await p.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < h; y += 200) {
    await p.evaluate((y) => scrollTo(0, y), y);
    await p.waitForTimeout(60);
  }
  await p.evaluate(() => scrollTo(0, 0));
  await p.waitForTimeout(400);

  const out = await p.evaluate(() => {
    const rectOf = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return {
        x: Math.round(r.x),
        y: Math.round(r.y + scrollY),
        w: Math.round(r.width),
        h: Math.round(r.height),
      };
    };
    const cs = (el, props) => {
      if (!el) return {};
      const s = getComputedStyle(el);
      return Object.fromEntries(props.map((p) => [p, s[p]]));
    };
    const q = (sel) => document.querySelector(sel);
    const secGeo = (sel) => {
      const el = q(sel);
      return {
        rect: rectOf(el),
        ...cs(el, [
          "display",
          "paddingTop",
          "paddingBottom",
          "backgroundColor",
        ]),
      };
    };

    // EXAM structure
    const exam = q(".fv-exam-section");
    const examLayout = {
      ...secGeo(".fv-exam-section"),
      holder: cs(q(".exam-content-holder"), [
        "display",
        "flexDirection",
        "gridTemplateColumns",
        "gap",
        "maxWidth",
      ]),
      holderRect: rectOf(q(".exam-content-holder")),
    };
    const steps = [
      ...document.querySelectorAll(".exam-step, .first-exam-step-container"),
    ]
      .slice(0, 8)
      .map((st) => ({
        cls: st.className.toString().slice(0, 40),
        rect: rectOf(st),
        // children text with tag+class+type
        kids: [...st.children].map(
          (c) =>
            `${c.tagName}.${(c.className || "").toString().split(" ").slice(0, 2).join(".")}: "${c.textContent.replace(/\s+/g, " ").trim().slice(0, 45)}"`,
        ),
      }));
    const exImg = [...(exam?.querySelectorAll("img") || [])].map((i) => ({
      src: i.src.split("/").pop().slice(0, 40),
      rect: rectOf(i),
    }));

    // TOC geo
    const tocCards = [...document.querySelectorAll(".fv-toc-section a")]
      .filter((a) => a.querySelector("h3"))
      .map((a) => ({
        rect: rectOf(a),
        text: a.textContent.replace(/\s+/g, " ").trim().slice(0, 40),
        img: a.querySelector("img")?.src.split("/").pop(),
      }));

    // TOUR slider real geometry
    const tour = q(".fv-virtual-tour-section");
    const tourSlider = tour?.querySelector(".w-slider");
    const tourMask = tour?.querySelector(".w-slider-mask");
    const tourSlides = tour ? tour.querySelectorAll(".w-slide").length : 0;
    const tourDots = tour ? tour.querySelectorAll(".w-slider-dot").length : 0;
    const tourArrows = [
      ...(tour?.querySelectorAll(
        ".w-slider-arrow-left, .w-slider-arrow-right",
      ) || []),
    ].map((a) => ({
      cls: a.className.toString().split(" ").slice(0, 2).join("."),
      rect: rectOf(a),
      img: a.querySelector("img")?.src.split("/").pop(),
    }));
    const tourH1 = tour?.querySelector("h1");

    // TEAM slider real geometry
    const team = q(".fv-meet-our-team-section");
    const teamSlider = team?.querySelector(".w-slider");
    const teamSlides = team ? team.querySelectorAll(".w-slide").length : 0;
    const teamSlide0 = team?.querySelector(".w-slide");
    const teamArrows = [
      ...(team?.querySelectorAll(
        ".w-slider-arrow-left, .w-slider-arrow-right",
      ) || []),
    ].map((a) => ({
      cls: a.className.toString().split(" ").slice(0, 2).join("."),
      rect: rectOf(a),
      img: a.querySelector("img")?.src.split("/").pop(),
    }));
    const teamH2 = team?.querySelector("h2");

    return {
      EXAM: {
        section: examLayout,
        steps,
        imgs: exImg,
        h3: {
          ...cs(exam?.querySelector("h3"), [
            "fontFamily",
            "fontWeight",
            "fontSize",
            "color",
          ]),
          rect: rectOf(exam?.querySelector("h3")),
        },
      },
      TOC: {
        section: secGeo(".fv-toc-section"),
        cards: tocCards,
        intro: rectOf(q(".fv-toc-section p")),
      },
      TOUR: {
        section: secGeo(".fv-virtual-tour-section"),
        slides: tourSlides,
        dots: tourDots,
        arrows: tourArrows,
        mask: rectOf(tourMask),
        slide0: rectOf(tour?.querySelector(".w-slide")),
        h1: {
          ...cs(tourH1, ["fontSize", "color", "fontWeight"]),
          rect: rectOf(tourH1),
        },
      },
      TEAM: {
        section: secGeo(".fv-meet-our-team-section"),
        slides: teamSlides,
        slide0: rectOf(teamSlide0),
        arrows: teamArrows,
        h2: {
          ...cs(teamH2, ["fontSize", "color", "fontWeight"]),
          rect: rectOf(teamH2),
        },
      },
    };
  });
  console.log(JSON.stringify(out, null, 2));
} finally {
  await b.close();
}
