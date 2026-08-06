// Pass 2: read the authored fields off their own live classes, keyed by the
// slug live links to (which is our Prismic uid).
import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";
import { writeFileSync } from "node:fs";

const LIVE = "https://beachfrontdentistry.com";
const out = {};
const settle = async (p) => {
  await p.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 300) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 50));
    }
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 500));
  });
};

const b = await chromium.launch();
try {
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });

  await p.goto(`${LIVE}/our-team`, { waitUntil: "networkidle", timeout: 60000 });
  await settle(p);
  out.people = await p.evaluate(() =>
    [...document.querySelectorAll(".team-list-item")].map((el) => {
      const t = (sel) => el.querySelector(sel)?.textContent.replace(/\s+/g, " ").trim() ?? null;
      const href = el.querySelector("a[href*='/team-members/']")?.getAttribute("href") ?? null;
      return {
        uid: href ? href.split("/").pop() : null,
        name: t("h5"),
        role: t("h6.text-align-center, h6.h7"),
        teaser: t(".team-teaser"),
        beach: t(".team-beach-name"),
      };
    }),
  );

  await p.goto(`${LIVE}/ask-the-doctor`, { waitUntil: "networkidle", timeout: 60000 });
  await settle(p);
  out.qaClasses = await p.evaluate(() => {
    const card = document.querySelector(".qa-question")?.closest("[class*='qa'],[role='listitem'],.w-dyn-item");
    return card
      ? [...card.querySelectorAll("*")].map((n) => `${n.tagName.toLowerCase()}.${String(n.className).replace(/\s+/g, ".")}`)
      : null;
  });
  out.questions = await p.evaluate(() =>
    [...document.querySelectorAll(".w-dyn-item")]
      .filter((el) => el.querySelector(".qa-question"))
      .map((el) => {
        const t = (sel) => el.querySelector(sel)?.textContent.replace(/\s+/g, " ").trim() ?? null;
        const href = el.querySelector("a[href]")?.getAttribute("href") ?? null;
        return {
          uid: href ? href.split("/").pop() : null,
          href,
          number: t("[class*='number'], .qa-number"),
          title: t(".qa-question"),
          all: [...el.querySelectorAll("p,div,h6")]
            .map((n) => ({ cls: String(n.className), text: n.textContent.replace(/\s+/g, " ").trim() }))
            .filter((r) => r.text && r.text.length > 20),
        };
      }),
  );

  await p.goto(`${LIVE}/`, { waitUntil: "networkidle", timeout: 60000 });
  await settle(p);
  out.home = await p.evaluate(() =>
    [...document.querySelectorAll(".w-dyn-item")]
      .filter((el) => el.querySelector(".qa-question"))
      .map((el) => {
        const href = el.querySelector("a[href]")?.getAttribute("href") ?? null;
        return {
          uid: href ? href.split("/").pop() : null,
          title: el.querySelector(".qa-question")?.textContent.replace(/\s+/g, " ").trim() ?? null,
          text: el.textContent.replace(/\s+/g, " ").trim().slice(0, 300),
        };
      }),
  );
  out.homeTeam = await p.evaluate(() =>
    [...document.querySelectorAll("a[href*='/team-members/']")].map((a) => a.getAttribute("href")),
  );

  await p.goto(`${LIVE}/services`, { waitUntil: "networkidle", timeout: 60000 });
  await settle(p);
  out.servicePanels = await p.evaluate(() =>
    [...document.querySelectorAll(".service-block")].map((el) => ({
      heading: el.querySelector("h1,h2,h3,h4,h5")?.textContent.replace(/\s+/g, " ").trim() ?? null,
      links: [...el.querySelectorAll("a[href*='/services/']")].map((a) => ({
        uid: a.getAttribute("href").split("/").pop(),
        text: a.textContent.replace(/\s+/g, " ").trim(),
      })),
    })),
  );
} finally {
  await b.close();
}

writeFileSync("matching/content-capture2.json", JSON.stringify(out, null, 2), "utf8");
console.log("people", out.people.length, "questions", out.questions.length, "home", out.home.length, "panels", out.servicePanels.length);
