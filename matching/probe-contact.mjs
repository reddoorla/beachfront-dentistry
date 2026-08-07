import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";

const URLS = [
  "https://www.beachfrontdentistry.com/contact-us",
  "https://www.beachfrontdentistry.com/contact",
];

async function settle(page) {
  // scroll to bottom in steps then back to top to trigger lazy content
  await page.evaluate(async () => {
    await new Promise((res) => {
      let y = 0;
      const step = () => {
        window.scrollTo(0, y);
        y += window.innerHeight;
        if (y < document.body.scrollHeight) setTimeout(step, 60);
        else res();
      };
      step();
    });
  });
  await page.waitForTimeout(600);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);
}

function tuple(cs) {
  return {
    fontFamily: cs.fontFamily,
    fontSize: cs.fontSize,
    fontWeight: cs.fontWeight,
    lineHeight: cs.lineHeight,
    letterSpacing: cs.letterSpacing,
    textTransform: cs.textTransform,
    color: cs.color,
    textAlign: cs.textAlign,
  };
}

async function probe(page, width) {
  await page.setViewportSize({ width, height: 900 });
  await settle(page);

  return await page.evaluate((vw) => {
    const T = (el) => {
      const cs = getComputedStyle(el);
      return {
        fontFamily: cs.fontFamily,
        fontSize: cs.fontSize,
        fontWeight: cs.fontWeight,
        lineHeight: cs.lineHeight,
        letterSpacing: cs.letterSpacing,
        textTransform: cs.textTransform,
        color: cs.color,
        textAlign: cs.textAlign,
      };
    };
    const norm = (s) => (s || "").replace(/\s+/g, " ").trim();

    // Headings
    const headings = [...document.querySelectorAll("h1,h2,h3,h4")]
      .filter((h) => h.offsetParent !== null || h.getClientRects().length)
      .map((h) => {
        const r = h.getBoundingClientRect();
        return {
          tag: h.tagName,
          text: norm(h.innerText),
          top: Math.round(r.top + window.scrollY),
          tuple: T(h),
          cls: h.className,
        };
      })
      .filter((h) => h.text);

    // Top-level sections
    const main = document.querySelector("main") || document.body;
    const sections = [...main.children]
      .filter((el) => el.getClientRects().length)
      .map((el) => {
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        return {
          tag: el.tagName,
          cls: el.className,
          id: el.id,
          top: Math.round(r.top + window.scrollY),
          height: Math.round(r.height),
          bg: cs.backgroundColor,
          bgImage: cs.backgroundImage === "none" ? "" : cs.backgroundImage,
          textSnippet: norm(el.innerText).slice(0, 120),
        };
      });

    // Hero detection
    const hero = document.querySelector('.hero, [class*="hero"]');
    let heroInfo = null;
    if (hero) {
      const r = hero.getBoundingClientRect();
      const cs = getComputedStyle(hero);
      const h = hero.querySelector("h1,h2");
      heroInfo = {
        cls: hero.className,
        height: Math.round(r.height),
        top: Math.round(r.top + window.scrollY),
        bg: cs.backgroundColor,
        bgImage: cs.backgroundImage === "none" ? "" : cs.backgroundImage,
        heading: h ? norm(h.innerText) : null,
        headingTuple: h ? T(h) : null,
      };
    }

    // Forms
    const forms = [...document.querySelectorAll("form")].map((f) => {
      const fields = [...f.querySelectorAll("input,textarea,select")].map(
        (i) => ({
          type: i.type || i.tagName.toLowerCase(),
          name: i.name,
          placeholder: i.placeholder,
          label: norm(
            (i.labels && i.labels[0] && i.labels[0].innerText) ||
              i.getAttribute("aria-label") ||
              "",
          ),
        }),
      );
      return {
        action: f.action,
        cls: f.className,
        fields,
        visible: f.getClientRects().length > 0,
      };
    });

    // Appointment / modal buttons
    const btns = [...document.querySelectorAll("a,button")]
      .map((b) => ({
        text: norm(b.innerText),
        href: b.getAttribute("href") || "",
        cls: b.className,
      }))
      .filter((b) => /appointment|book|request|schedule|contact/i.test(b.text));

    // Iframes (maps)
    const iframes = [...document.querySelectorAll("iframe")].map((f) => {
      const r = f.getBoundingClientRect();
      return {
        src: (f.src || "").slice(0, 120),
        w: Math.round(r.width),
        h: Math.round(r.height),
        top: Math.round(r.top + window.scrollY),
      };
    });

    // tel / mailto links
    const contactLinks = [
      ...document.querySelectorAll('a[href^="tel:"],a[href^="mailto:"]'),
    ].map((a) => ({ href: a.getAttribute("href"), text: norm(a.innerText) }));

    // Full visible text of body (for address/hours extraction) — capped
    const bodyText = norm(main.innerText || "").slice(0, 4000);

    return {
      vw,
      pageHeight: Math.round(document.body.scrollHeight),
      title: document.title,
      url: location.href,
      headings,
      sections,
      heroInfo,
      forms,
      btns,
      iframes,
      contactLinks,
      bodyText,
    };
  }, width);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    let loaded = null;
    for (const u of URLS) {
      const resp = await page
        .goto(u, { waitUntil: "networkidle", timeout: 45000 })
        .catch(() => null);
      if (resp && resp.status() < 400) {
        loaded = u;
        break;
      }
    }
    const out = { loadedUrl: loaded };
    out.desktop = await probe(page, 1440);
    out.mobile = await probe(page, 390);
    console.log(JSON.stringify(out));
  } finally {
    await browser.close();
  }
})();
