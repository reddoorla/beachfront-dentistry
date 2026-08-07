import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";
const b = await chromium.launch();
try {
  const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
  await p.goto("http://localhost:5190/contact-us", {
    waitUntil: "networkidle",
    timeout: 60000,
  });
  // thorough settle: slow scroll to bottom so every reveal fires, then back to top
  await p.evaluate(async () => {
    await new Promise((r) => {
      let y = 0;
      const s = () => {
        scrollTo(0, y);
        y += 150;
        if (y < document.body.scrollHeight + 1000) setTimeout(s, 30);
        else setTimeout(r, 600);
      };
      s();
    });
  });
  await p.waitForTimeout(700);
  await p.screenshot({
    path: "matching/rev-contact-mine2.png",
    fullPage: true,
  });
  // also measure the gap: info-section box + cta heading visibility
  const m = await p.evaluate(() => {
    const info = document.querySelector(".info-section");
    const cta = [...document.querySelectorAll("h2")].find((h) =>
      /Ready for great/.test(h.innerText || ""),
    );
    const map = document.querySelector("iframe");
    return {
      infoBottom: info
        ? Math.round(info.getBoundingClientRect().bottom + scrollY)
        : null,
      mapBottom: map
        ? Math.round(map.getBoundingClientRect().bottom + scrollY)
        : null,
      ctaTop: cta
        ? Math.round(cta.getBoundingClientRect().top + scrollY)
        : null,
      ctaOpacity: cta
        ? getComputedStyle(cta.closest("[style*=opacity],div") || cta).opacity
        : null,
      ctaText: cta ? cta.innerText : null,
    };
  });
  console.log(JSON.stringify(m));
  await p.close();
} finally {
  await b.close();
}
