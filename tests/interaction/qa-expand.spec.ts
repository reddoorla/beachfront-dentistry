import { test, expect } from "@playwright/test";

// ROUND G2 CONTRACT — the frozen Q&A card (MarkUp thread
// 3d255366-5bb2-4cb1-9a90-439d49ef63ef home pin #9 second half; atd pin
// bd8c37b0-2e1c-4dc2-a466-8073e204d90c "same comments as the homepage";
// operator directive 2026-08-11: Tim's instruction outranks live). Tim: "the
// box expands but I don't think it needs to since the headline disappears."
//
// So an OPEN card keeps its collapsed footprint: no margin-top drop, no
// re-height, the label bar stays in place, and the answer takes only the room
// the vanished headline leaves under the bar. The live rules this overrides
// (.qa-text.m-2.active height 8rem, beachfront.css:7303; .qa-label.active
// margin-top:-2rem; .qa-block.active growth) are documented on
// QuestionCard.svelte and in matching/LEDGER.md.
//
// Tim's premise was probed, not assumed (2026-08-11, every card on both pages
// x 1440/834/390 + a 650 band check): panel need (answer + Read More + the
// Round B pb 20/16/12) vs frozen room (card - label) fits EVERYWHERE except
// the <480 home teaser, where two panels need 243px against a 240px room. So
// the contract carries ONE declared exception: the <480 teaser card grows
// 288->291 on open — the minimum that clears those panels — and nothing else
// moves anywhere. This suite sweeps EVERY card on both pages and asserts:
//   1. footprint: open height == collapsed height (+ the declared exception),
//      top edge unmoved, restored exactly on close;
//   2. zero clip: the .qa-text box (which really is overflow-hidden — guarded
//      so the assertion can't go vacuous) has scrollHeight == clientHeight —
//      the Round B clipping bug (39px @390) can never return silently;
//   3. the answer never rides under the in-place label bar;
//   4. Round B's Read More padding holds: pill bottom sits 20/16/12 above the
//      box bottom (== card bottom) at lg/md/base — on BOTH variants now, the
//      numbered base carve-out (96px via card growth) having died with the
//      growth that funded it;
//   5. stillness: while a card is open, every other card on the page holds
//      its exact position (following cards shift by exactly the declared
//      3px where the exception applies). That stillness is the point of the
//      freeze.
//
// NOTHING else in this repo could catch a regression here: every pixel gate,
// style census and text diff measures the page in its default state, and this
// only exists after a click — the matching skill's Phase 5 blind spot, made
// mechanical here.

const VIEWPORTS = [
  { width: 1440, height: 900, name: "desktop", pb: 20 },
  { width: 834, height: 1000, name: "tablet", pb: 16 },
  { width: 390, height: 844, name: "mobile", pb: 12 },
];

const PAGES = [
  // growth390: the one probed freeze exception — <480 teaser only, +3px.
  { path: "/", label: "home teaser", growth390: 3 },
  { path: "/ask-the-doctor", label: "ask-the-doctor numbered", growth390: 0 },
];

for (const pg of PAGES) {
  for (const vp of VIEWPORTS) {
    const growth = vp.width < 480 ? pg.growth390 : 0;
    test(`${pg.label} @${vp.width}: every open card keeps its footprint, clips nothing, holds the pill padding`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(pg.path, { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);

      // One in-page sweep: with reduced motion every transition is none, so
      // each card settles within two frames of its toggle. All measurements
      // are rect DELTAS or same-ancestor offsets, so animateIn's transforms
      // (constant during the sweep) cancel out.
      const failures = await page.evaluate(
        async ({ pb, growth }) => {
          const settle = () =>
            new Promise((r) =>
              requestAnimationFrame(() => requestAnimationFrame(() => r(0))),
            );
          const items = [...document.querySelectorAll(".qa-item")];
          const failures: string[] = [];
          if (items.length === 0) return ["no .qa-item cards on the page"];
          const tops = () =>
            items.map((i) => i.firstElementChild!.getBoundingClientRect().top);
          for (let i = 0; i < items.length; i++) {
            const outer = items[i].firstElementChild as HTMLElement;
            const label = outer.querySelector(
              "button[aria-expanded]",
            ) as HTMLElement;
            const panel = outer.querySelector(
              '[id^="qa-panel-"]',
            ) as HTMLElement;
            const box = panel.parentElement as HTMLElement;
            const link = panel.querySelector("a") as HTMLElement;
            const uid = panel.id.replace("qa-panel-", "");
            const beforeTops = tops();
            const before = outer.getBoundingClientRect();
            label.click();
            await settle();
            if (label.getAttribute("aria-expanded") !== "true") {
              failures.push(`${uid}: toggle did not open`);
              continue;
            }
            const after = outer.getBoundingClientRect();
            const boxR = box.getBoundingClientRect();
            const labelR = label.getBoundingClientRect();
            const panelR = panel.getBoundingClientRect();
            const linkR = link.getBoundingClientRect();
            // 1. frozen footprint (+ the one declared exception)
            const dH = Math.round(after.height - before.height);
            if (dH !== growth)
              failures.push(
                `${uid}: height ${before.height}->${after.height} (d=${dH}, expected ${growth})`,
              );
            if (Math.round(after.top - before.top) !== 0)
              failures.push(
                `${uid}: top edge moved ${after.top - before.top}px on open`,
              );
            // 2. zero clip — box really clips (guard), and nothing overflows it
            if (getComputedStyle(box).overflow !== "hidden")
              failures.push(
                `${uid}: box no longer clips — fit assertions vacuous`,
              );
            if (box.scrollHeight !== box.clientHeight)
              failures.push(
                `${uid}: box clips ${box.scrollHeight - box.clientHeight}px of the answer`,
              );
            // 3. the answer stays below the in-place label bar
            if (panelR.top < labelR.bottom - 0.5)
              failures.push(
                `${uid}: answer rides ${(labelR.bottom - panelR.top).toFixed(1)}px under the label bar`,
              );
            // 4. Round B pill padding holds against the box == card bottom
            const off = Math.round(boxR.bottom - linkR.bottom);
            if (Math.abs(off - pb) > 1)
              failures.push(
                `${uid}: Read More sits ${off}px above the box bottom, want ${pb}`,
              );
            // 5. neighbours stand still (followers move by exactly the
            //    declared growth, preceding cards not at all)
            const nowTops = tops();
            for (let j = 0; j < items.length; j++) {
              if (j === i) continue;
              const want = j > i ? growth : 0;
              const d = Math.round(nowTops[j] - beforeTops[j]);
              if (d !== want)
                failures.push(
                  `${uid}: neighbour ${j} moved ${d}px while open (want ${want})`,
                );
            }
            // close, and the footprint restores exactly
            label.click();
            await settle();
            const restored = outer.getBoundingClientRect();
            if (Math.round(restored.height - before.height) !== 0)
              failures.push(
                `${uid}: height not restored on close (${before.height}->${restored.height})`,
              );
          }
          return failures;
        },
        { pb: vp.pb, growth },
      );
      expect(failures).toEqual([]);
    });
  }
}

// MOTION CONTRACT — the open starts on the click frame (motion audit item 1,
// 2026-08-12). The panel used to be parked at a flat `translate-y-[400px]`
// against a journey of ~183px, so it spent the first third of a 650ms open
// crossing dead space BEHIND the clip mask: measured 237/246/238ms (home) and
// 253/253/260ms (ask-the-doctor) at 1440/834/390 before the answer showed its
// first pixel, i.e. click the "+" and the icon flips to "−" and then nothing
// happens for a quarter second.
//
// The fix is arithmetic, not taste: the offset is the panel's own height
// (translate percentages resolve against the border box) plus the box's pb
// ladder, +1px so the resting top stays one pixel below the clip line and the
// collapsed-state assertion further down cannot go vacuous. That makes the
// dead travel a MEASURABLE quantity — this block asserts it directly (≤2px,
// where 400px was the bug) and then confirms the perceptual consequence with
// a wall-clock sample, because the arithmetic is only worth anything if the
// first pixel really does arrive within a frame.
//
// These tests run with motion ON — they exist to measure the animation, and
// the whole suite above runs reduced, so nothing else in the repo would
// notice if the transition stopped animating altogether.
const FIRST_PIXEL_MS = 100; // one frame in practice (12-24ms measured); the pre-fix number was 237-260
const FULL_OPEN_MS = 600; // 450ms transition + slack; the pre-fix number was 671-685

for (const pg of PAGES) {
  for (const vp of VIEWPORTS) {
    test(`${pg.label} @${vp.width}: the answer's first pixel clears the mask within a frame of the click`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(pg.path, { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);
      const first = page.locator(".qa-item").first();
      await first.scrollIntoViewIfNeeded();
      // animateIn's own reveal transform moves the card; wait it out so the
      // sampler below is watching the panel travel and nothing else.
      await page.waitForTimeout(1000);

      const m = await first.evaluate(async (item) => {
        const outer = item.firstElementChild as HTMLElement;
        const btn = outer.querySelector("button[aria-expanded]") as HTMLElement;
        const panel = outer.querySelector('[id^="qa-panel-"]') as HTMLElement;
        const box = panel.parentElement as HTMLElement;
        const wash = [...outer.querySelectorAll<HTMLElement>("div")].find(
          (d) => getComputedStyle(d).transitionProperty === "opacity",
        )!;
        const title = outer.querySelector("h3") as HTMLElement;
        // How far the answer sits below the clip line at rest: this is the
        // dead travel, in px, that no one can see being crossed.
        const dead =
          panel.getBoundingClientRect().top -
          box.getBoundingClientRect().bottom;
        const overhang = () =>
          box.getBoundingClientRect().bottom -
          panel.getBoundingClientRect().top;
        const t0 = performance.now();
        btn.click();
        let firstPixel = -1;
        let settled = -1;
        let last: number | null = null;
        let stable = 0;
        await new Promise((resolve) => {
          const tick = () => {
            const now = performance.now() - t0;
            const over = overhang();
            if (firstPixel < 0 && over > 0.5) firstPixel = now;
            if (last !== null && Math.abs(over - last) < 0.05) {
              if (++stable >= 3 && settled < 0) settled = now;
            } else stable = 0;
            last = over;
            if (settled >= 0 || now > 1600) return resolve(0);
            requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        });
        const ms = (el: Element) =>
          parseFloat(getComputedStyle(el).transitionDuration) * 1000;
        return {
          dead: +dead.toFixed(1),
          firstPixel: Math.round(firstPixel),
          settled: Math.round(settled),
          panelMs: ms(panel),
          washMs: ms(wash),
          titleMs: ms(title),
        };
      });

      // 1. no dead travel: the answer rests AT the clip line, not behind it.
      expect(
        m.dead,
        "px of unseen travel below the mask",
      ).toBeGreaterThanOrEqual(0);
      expect(m.dead, "px of unseen travel below the mask").toBeLessThanOrEqual(
        2,
      );
      // 2. and therefore it is visible essentially on the click frame.
      expect(m.firstPixel).toBeGreaterThanOrEqual(0);
      expect(m.firstPixel).toBeLessThan(FIRST_PIXEL_MS);
      // 3. the whole open still lands quickly.
      expect(m.settled).toBeGreaterThan(0);
      expect(m.settled).toBeLessThan(FULL_OPEN_MS);
      // 4. the wash is the copy's ground — it must not lag the copy it exists
      //    to make readable, and the headline must clear before the copy
      //    arrives (the old dead zone hid that overlap for free).
      expect(m.washMs).toBe(m.panelMs);
      expect(m.titleMs).toBeLessThanOrEqual(m.panelMs);
    });
  }
}

test("reduced motion: the answer is simply THERE on the next frame", async ({
  page,
}) => {
  // The counterpart to the block above: with motion off nothing may travel at
  // all. Explicit emulateMedia — the config option never reached the page
  // (see playwright.config.ts).
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/", { waitUntil: "networkidle" });
  const first = page.locator(".qa-item").first();
  await first.scrollIntoViewIfNeeded();

  const m = await first.evaluate(async (item) => {
    const outer = item.firstElementChild as HTMLElement;
    const btn = outer.querySelector("button[aria-expanded]") as HTMLElement;
    const panel = outer.querySelector('[id^="qa-panel-"]') as HTMLElement;
    const box = panel.parentElement as HTMLElement;
    btn.click();
    await new Promise((r) => requestAnimationFrame(() => r(0)));
    const durations = [panel, box, outer].map(
      (el) => parseFloat(getComputedStyle(el).transitionDuration) * 1000,
    );
    return {
      durations,
      // one frame after the click the answer is fully inside the box
      insideAfterOneFrame:
        panel.getBoundingClientRect().bottom <=
        box.getBoundingClientRect().bottom + 1,
    };
  });
  expect(Math.max(...m.durations)).toBeLessThanOrEqual(1);
  expect(m.insideAfterOneFrame).toBe(true);
});

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
