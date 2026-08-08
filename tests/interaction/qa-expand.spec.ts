import { test, expect } from "@playwright/test";

// The "Ask the Doctor" card reveals its answer INSIDE a box that clips
// (`.qa-text`, overflow-hidden). Live gives that box two heights — 3rem
// collapsed and 8rem active (beachfront.css:7292 and :7303) — and only the
// collapsed one had been implemented, so the home cards stayed 72/96/120px
// while the answer sliding into them is 172-193px tall. The revealed copy was
// cut by 73px at 1440, 76px at 834 and 111px at 390: on a phone, 61% of the
// answer was invisible. The box is justify-end, so it clipped the ANSWER TEXT
// while leaving "Read More" on screen, which is why it read as truncated copy
// rather than as an empty card.
//
// NOTHING else in this repo could catch it. Every pixel gate, style census and
// text diff measures the page in its default state, and this only exists after
// a click — the matching skill's Phase 5 blind spot, made mechanical here.
//
// The assertion is on RENDERED GEOMETRY, not on class names: the bug was that
// content did not fit its container, and only measuring the two can see that.

const VIEWPORTS = [
  { width: 1440, height: 900, name: "desktop" },
  { width: 834, height: 1000, name: "tablet" },
  { width: 390, height: 844, name: "mobile" },
];

for (const vp of VIEWPORTS) {
  test(`home Ask-the-Doctor card reveals its whole answer (${vp.name})`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/", { waitUntil: "networkidle" });

    const card = page.locator(".qa-item").first();
    await card.scrollIntoViewIfNeeded();
    const toggle = card.locator("button[aria-expanded]");

    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    // The box animates its height (live transitions it over .2s).
    await page.waitForTimeout(600);

    const m = await card.evaluate((el) => {
      const panel = el.querySelector('[id^="qa-panel-"]') as HTMLElement;
      const box = panel.parentElement as HTMLElement;
      const link = panel.querySelector("a") as HTMLElement;
      const br = box.getBoundingClientRect();
      const lr = link.getBoundingClientRect();
      return {
        boxHeight: Math.round(br.height),
        answerHeight: panel.scrollHeight,
        overflow: getComputedStyle(box).overflow,
        // Read More must be inside the clipping box, not scrolled past its edge.
        linkWithinBox: lr.top >= br.top - 1 && lr.bottom <= br.bottom + 1,
      };
    });

    // The box really does clip — if this ever stops being true the test below
    // would pass vacuously.
    expect(m.overflow).toBe("hidden");
    expect(
      m.answerHeight,
      `answer (${m.answerHeight}px) is clipped by the ${m.boxHeight}px .qa-text box`,
    ).toBeLessThanOrEqual(m.boxHeight);
    expect(m.linkWithinBox, "Read More is cut off by the box").toBe(true);
  });
}

test("collapsed card hides the answer and keeps it untabbable", async ({
  page,
}) => {
  // The other half of the contract: the answer is clipped ON PURPOSE while
  // closed, and `inert` keeps the hidden Read More link out of the tab order.
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/", { waitUntil: "networkidle" });

  const card = page.locator(".qa-item").first();
  await card.scrollIntoViewIfNeeded();
  await expect(card.locator("button[aria-expanded]")).toHaveAttribute(
    "aria-expanded",
    "false",
  );

  const hidden = await card.evaluate((el) => {
    const panel = el.querySelector('[id^="qa-panel-"]') as HTMLElement;
    const box = panel.parentElement as HTMLElement;
    return {
      inert: panel.hasAttribute("inert"),
      // Collapsed, the answer is translated out of the box entirely.
      answerBelowBox:
        panel.getBoundingClientRect().top >=
        box.getBoundingClientRect().bottom - 1,
    };
  });
  expect(hidden.inert).toBe(true);
  expect(hidden.answerBelowBox).toBe(true);
});
