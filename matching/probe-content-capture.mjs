// Capture live's AUTHORED entity content — the three fields the Webflow import
// never brought across (person teaser, article summary, service-link order).
// Output is the raw material for src/lib/beachfront-content.js; nothing here is
// derived or guessed, every string is read off live's own DOM.
import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";
import { writeFileSync } from "node:fs";

const LIVE = "https://beachfrontdentistry.com";
const out = {};

const b = await chromium.launch();
try {
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });

  // ---- our-team: person cards -------------------------------------------
  await p.goto(`${LIVE}/our-team`, {
    waitUntil: "networkidle",
    timeout: 60000,
  });
  out.people = await p.evaluate(() =>
    [...document.querySelectorAll(".team-list-item, [class*='team-list']")].map(
      (el) => ({
        cls: el.className,
        href: el.querySelector("a")?.getAttribute("href") ?? null,
        lines: [...el.querySelectorAll("*")]
          .filter((n) =>
            [...n.childNodes].some(
              (c) => c.nodeType === 3 && c.nodeValue.trim(),
            ),
          )
          .map((n) => ({
            tag: n.tagName.toLowerCase(),
            cls: n.className,
            text: n.textContent.replace(/\s+/g, " ").trim(),
          })),
      }),
    ),
  );

  // ---- ask-the-doctor: question cards -----------------------------------
  await p.goto(`${LIVE}/ask-the-doctor`, {
    waitUntil: "networkidle",
    timeout: 60000,
  });
  // cards reveal on scroll; walk the page so every one is in the DOM/settled
  await p.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 400) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 400));
  });
  out.questions = await p.evaluate(() =>
    [
      ...document.querySelectorAll(
        "a[href*='/ask-the-doctor/'], .qa-item, [class*='question']",
      ),
    ]
      .map((el) => ({
        tag: el.tagName.toLowerCase(),
        cls: el.className,
        href: el.getAttribute?.("href") ?? null,
        text: el.textContent.replace(/\s+/g, " ").trim().slice(0, 400),
      }))
      .filter((r) => r.text),
  );

  // ---- home: the featured question selection ----------------------------
  await p.goto(`${LIVE}/`, { waitUntil: "networkidle", timeout: 60000 });
  await p.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 400) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
  });
  out.homeQuestions = await p.evaluate(() =>
    [...document.querySelectorAll("a[href*='/ask-the-doctor/']")].map((el) => ({
      href: el.getAttribute("href"),
      text: el.textContent.replace(/\s+/g, " ").trim().slice(0, 400),
    })),
  );

  // ---- services: category panels + their link order ---------------------
  await p.goto(`${LIVE}/services`, {
    waitUntil: "networkidle",
    timeout: 60000,
  });
  out.services = await p.evaluate(() =>
    [...document.querySelectorAll("[class*='service-block']")].map((el) => ({
      cls: el.className,
      heading:
        el
          .querySelector("h1,h2,h3,h4")
          ?.textContent.replace(/\s+/g, " ")
          .trim() ?? null,
      links: [...el.querySelectorAll("a")].map((a) => ({
        href: a.getAttribute("href"),
        text: a.textContent.replace(/\s+/g, " ").trim(),
        col:
          a.closest("[class*='w-half'],[class*='_w-half']")?.className ?? null,
      })),
    })),
  );
} finally {
  await b.close();
}

writeFileSync(
  "matching/content-capture.json",
  JSON.stringify(out, null, 2),
  "utf8",
);
console.log(
  "people:",
  out.people?.length,
  "questions:",
  out.questions?.length,
  "home:",
  out.homeQuestions?.length,
  "serviceBlocks:",
  out.services?.length,
);
