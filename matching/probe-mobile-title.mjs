import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";
const cyan = (c) => /129, ?158, ?204|18, ?158, ?204/.test(c) || /#129ecc/i.test(c);
const b = await chromium.launch();
try {
  for (const [tag, base, path] of [
    ["LIVE-svc", "https://www.beachfrontdentistry.com", "/services/dental-exams"],
    ["CAND-svc", "http://localhost:5173", "/services/dental-exams"],
    ["LIVE-qa", "https://www.beachfrontdentistry.com", "/questions/regular-dental-cleanings-support-your-whole-body-health"],
    ["CAND-qa", "http://localhost:5173", "/questions/regular-dental-cleanings-support-your-whole-body-health"],
  ]) {
    const p = await b.newPage({ viewport: { width: 390, height: 1400 } });
    await p.goto(base + path, { waitUntil: "networkidle", timeout: 60000 });
    const info = await p.evaluate((cyanSrc) => {
      const cyan = eval("(" + cyanSrc + ")");
      const Y = (e) => Math.round(e.getBoundingClientRect().top + scrollY);
      const H = (e) => Math.round(e.getBoundingClientRect().height);
      // TITLE: big cyan heading in the upper page (y 280..1200), NOT the CTA (display-xl, y>1800)
      const title = [...document.querySelectorAll("h1,h2,h3")].find((e) => {
        const c = getComputedStyle(e);
        return parseFloat(c.fontSize) >= 34 && cyan(c.color) && Y(e) > 280 && Y(e) < 1200;
      });
      // LEDE: cyan paragraph just below the title
      const lede = [...document.querySelectorAll("p")].find((e) => {
        const c = getComputedStyle(e);
        return cyan(c.color) && parseFloat(c.fontSize) >= 16 && Y(e) > 280 && Y(e) < 1600;
      });
      // first body (dark) paragraph
      const body = [...document.querySelectorAll("p")].find((e) => {
        const c = getComputedStyle(e);
        return !cyan(c.color) && (e.textContent || "").length > 60 && Y(e) > (lede ? Y(lede) : 400);
      });
      const cs = (e) => e ? `${getComputedStyle(e).fontSize}/${getComputedStyle(e).lineHeight}` : null;
      return {
        title: title ? `${cs(title)} top=${Y(title)} h=${H(title)} "${title.textContent.trim().slice(0,22)}"` : null,
        lede: lede ? `${cs(lede)} top=${Y(lede)} h=${H(lede)} x=${Math.round(lede.getBoundingClientRect().left)} w=${Math.round(lede.getBoundingClientRect().width)}` : null,
        bodyTop: body ? Y(body) : null,
      };
    }, cyan.toString());
    console.log(tag, JSON.stringify(info, null, 1));
    await p.close();
  }
} finally {
  await b.close();
}
