import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";
const b = await chromium.launch();
try {
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto("http://localhost:5173/dev/match/our-team", {
    waitUntil: "networkidle",
    timeout: 60000,
  });
  console.log("== our-team person cards ==");
  console.log(
    JSON.stringify(
      await p.evaluate(() =>
        [...document.querySelectorAll(".team-list-item")]
          .slice(0, 3)
          .map((el) => ({
            name: el.querySelector("h5")?.textContent.trim(),
            teaser: el
              .querySelector("p")
              ?.textContent.replace(/\s+/g, " ")
              .trim(),
          })),
      ),
      null,
      1,
    ),
  );
  console.log(
    "order:",
    await p.evaluate(() =>
      [...document.querySelectorAll(".team-list-item h5")]
        .map((e) => e.textContent.trim())
        .join(", "),
    ),
  );

  await p.goto("http://localhost:5173/dev/match/services", {
    waitUntil: "networkidle",
    timeout: 60000,
  });
  console.log("\n== services panels ==");
  console.log(
    await p.evaluate(() =>
      [...document.querySelectorAll(".service-block")]
        .map(
          (el) =>
            (el.querySelector("h3")?.textContent.trim() ?? "?") +
            ": " +
            [...el.querySelectorAll("a[href^='/services/']")]
              .map((a) => a.textContent.replace(/\s+/g, " ").trim())
              .join(" | "),
        )
        .join("\n"),
    ),
  );

  await p.goto("http://localhost:5173/dev/match/ask-the-doctor", {
    waitUntil: "networkidle",
    timeout: 60000,
  });
  console.log("\n== atd first 3 cards ==");
  console.log(
    await p.evaluate(() =>
      [...document.querySelectorAll(".qa-item")]
        .slice(0, 3)
        .map((el) => el.textContent.replace(/\s+/g, " ").trim().slice(0, 150))
        .join("\n"),
    ),
  );

  await p.goto("http://localhost:5173/dev/match/home", {
    waitUntil: "networkidle",
    timeout: 60000,
  });
  console.log("\n== home featured ==");
  console.log(
    await p.evaluate(() =>
      [...document.querySelectorAll(".qa-item")]
        .map((el) =>
          el.querySelector("a[href^='/questions/']")?.getAttribute("href"),
        )
        .join("\n"),
    ),
  );
} finally {
  await b.close();
}
