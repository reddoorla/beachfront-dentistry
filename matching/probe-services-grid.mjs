import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";

const PAGES = {
  live: "https://www.beachfrontdentistry.com/services",
  dev: "http://localhost:5190/dev/match/services",
};

async function settle(page) {
  await page.evaluate(async () => {
    await new Promise((res) => {
      let y = 0;
      const step = () => {
        window.scrollTo(0, y);
        y += 250;
        if (y < document.body.scrollHeight) setTimeout(step, 40);
        else {
          window.scrollTo(0, 0);
          setTimeout(res, 300);
        }
      };
      step();
    });
  });
  await page.waitForTimeout(400);
}

async function probe(page) {
  return await page.evaluate(() => {
    const rect = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const c = getComputedStyle(el);
      return {
        w: Math.round(r.width),
        h: Math.round(r.height),
        y: Math.round(r.y + window.scrollY),
        display: c.display,
        gtc: c.gridTemplateColumns,
        rowGap: c.rowGap,
        colGap: c.columnGap,
        flexWrap: c.flexWrap,
        padT: c.paddingTop,
        padB: c.paddingBottom,
        maxW: c.maxWidth,
        br: c.borderRadius,
      };
    };
    const out = {};
    // grid container: live .service-grid; dev the grid div (grid-cols-2)
    const grid =
      document.querySelector(".service-grid") ||
      [...document.querySelectorAll("div")].find(
        (d) =>
          /grid-cols/.test(d.className) &&
          d.querySelectorAll(".service-block, article").length >= 2,
      );
    out.grid = rect(grid);
    const blocks = [
      ...document.querySelectorAll(".service-block, article.service-block"),
    ];
    out.blockCount = blocks.length;
    out.blocks = blocks.slice(0, 4).map((b) => {
      const r = b.getBoundingClientRect();
      const heading = b.querySelector('h1,h2,h3,h4,h5,[class*="heading"]');
      const panel = [...b.querySelectorAll("div")].find((d) =>
        /linear-gradient|primary/.test(
          getComputedStyle(d).backgroundImage + d.className,
        ),
      );
      const links = b.querySelectorAll("a");
      return {
        w: Math.round(r.width),
        h: Math.round(r.height),
        y: Math.round(r.y + window.scrollY),
        heading: heading ? heading.innerText.trim().slice(0, 30) : "",
        headY: heading
          ? Math.round(heading.getBoundingClientRect().y + window.scrollY)
          : null,
        panelH: panel ? Math.round(panel.getBoundingClientRect().height) : null,
        links: links.length,
      };
    });
    // we-offer intro
    const intro = [...document.querySelectorAll("div,section,p")].find((e) =>
      /we offer|We offer/i.test((e.innerText || "").slice(0, 40)),
    );
    out.intro = intro
      ? {
          y: Math.round(intro.getBoundingClientRect().y + window.scrollY),
          txt: intro.innerText.trim().slice(0, 50),
        }
      : null;
    return out;
  });
}

const browser = await chromium.launch({ headless: true });
try {
  const results = {};
  for (const [name, url] of Object.entries(PAGES)) {
    results[name] = {};
    for (const width of [1440, 390]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
      await settle(page);
      results[name][width] = await probe(page);
      await page.close();
    }
  }
  console.log(JSON.stringify(results, null, 1));
} finally {
  await browser.close();
}
