import { expect, test } from "@playwright/test";

/**
 * The 2026-08-13 mobile pass, as checks rather than promises.
 *
 * Every case here is a defect that shipped to the live domain and that no
 * existing gate could see, because the pixel gate samples 1440/834/390 and
 * compares REGIONS: a chevron printed over a paragraph, a 6px sideways scroll,
 * and a 19px tap target are all far inside a 0.10 region threshold. They are
 * properties of the rendered page, so they are measured on the real routes.
 *
 * 360 is in the matrix deliberately. It is the width the /services overflow
 * needed (375 and 390 both cleared it), and it is a live Android size the gate
 * matrix never visits.
 */
const WIDTHS = [360, 375, 390, 430];

// ---------------------------------------------------------------------------

test.describe("no page scrolls sideways on a phone", () => {
  const ROUTES = [
    "/",
    "/our-team",
    "/services",
    "/services/teeth-whitening",
    "/ask-the-doctor",
    "/questions/bad-breath-cures",
    "/your-first-visit",
    "/contact-us",
    "/team-members/dr-robert-quan",
  ];

  for (const width of WIDTHS) {
    for (const route of ROUTES) {
      test(`${route} @${width}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 844 });
        await page.goto(route);
        await page.evaluate(() => document.fonts.ready);
        await page.evaluate(async () => {
          for (let y = 0; y < document.body.scrollHeight; y += 500) {
            scrollTo({ top: y, behavior: "instant" });
            await new Promise((r) => setTimeout(r, 30));
          }
          scrollTo({ top: 0, behavior: "instant" });
        });
        const scrollWidth = await page.evaluate(
          () => document.documentElement.scrollWidth,
        );
        // /services was 366 at 360: a 384px grid track (live's 16rem) centring
        // a 312px card 36px into a 5%-guttered container.
        expect(
          scrollWidth,
          `${route} @${width} scrollWidth`,
        ).toBeLessThanOrEqual(width);
      });
    }
  }
});

// ---------------------------------------------------------------------------

/** Routes that mount the review carousel (the only slider with side arrows
 *  pinned over a text card). */
const REVIEW_ROUTES = ["/", "/your-first-visit"];

test.describe("review carousel arrows never cover the quote", () => {
  // 480 and 600 are here because that band is where the card itself was wrong:
  // `.review-slider-holder-viewport{width:15rem}` is 360px at the 24px mobile
  // root, but our ladder was keyed at 768 so the whole 480-767 band kept the
  // ≤479 fill-the-wrapper behaviour and the card ran 427px wide at 480. The
  // arrows landing on the text there was the symptom, not the cause — so the
  // band the pixel gate never samples is exactly the band this must cover.
  for (const width of [360, 390, 480, 600, 834, 1440]) {
    for (const route of REVIEW_ROUTES) {
      test(`${route} @${width}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(route);
        await page.evaluate(() => document.fonts.ready);
        await page.evaluate(async () => {
          for (let y = 0; y < document.body.scrollHeight; y += 400) {
            scrollTo({ top: y, behavior: "instant" });
            await new Promise((r) => setTimeout(r, 40));
          }
          scrollTo({ top: 0, behavior: "instant" });
          await new Promise((r) => setTimeout(r, 300));
        });

        const worst = await page.evaluate(() => {
          const out: { label: string; area: number; text: string }[] = [];
          // `data-review-arrow` and not the aria-label: the office-tour
          // slider's edge arrows carry the same labels, and those are 56px
          // full-height transparent hit strips deliberately laid over the
          // photo — they overlap their caption by design (live's edge
          // chevrons do the same), so matching on the label made this spec
          // fail on a non-defect.
          for (const b of document.querySelectorAll<HTMLElement>(
            "button[data-review-arrow]",
          )) {
            const br = b.getBoundingClientRect();
            if (br.width < 1) continue;
            let area = 0;
            let text = "";
            // The review card is a MASK (round G4: the track slides inside a
            // static blue box), so the neighbouring slides' quotes are in the
            // DOM, laid out beside the card and clipped away. `checkVisibility`
            // is true for them and their client rects are real, so measuring
            // raw rects reported the NEXT slide's quote passing under the
            // arrow as an overlap — a defect that is not on screen. Clip each
            // rect to its nearest scroll/overflow ancestor first, which is what
            // the reader actually sees.
            const clipOf = (el: Element) => {
              let box = {
                left: 0,
                top: 0,
                right: innerWidth,
                bottom: innerHeight,
              };
              for (
                let e: Element | null = el;
                e && e !== document.body;
                e = e.parentElement
              ) {
                const cs = getComputedStyle(e);
                if (
                  !/hidden|clip|auto|scroll/.test(
                    cs.overflow + cs.overflowX + cs.overflowY,
                  )
                )
                  continue;
                const r = e.getBoundingClientRect();
                box = {
                  left: Math.max(box.left, r.left),
                  top: Math.max(box.top, r.top),
                  right: Math.min(box.right, r.right),
                  bottom: Math.min(box.bottom, r.bottom),
                };
              }
              return box;
            };
            const w = document.createTreeWalker(
              document.body,
              NodeFilter.SHOW_TEXT,
            );
            for (let n = w.nextNode(); n; n = w.nextNode()) {
              const s = n.nodeValue;
              if (!s || !s.trim()) continue;
              const el = n.parentElement;
              if (!el || b.contains(el)) continue;
              if (!el.checkVisibility({ opacityProperty: true })) continue;
              const clip = clipOf(el);
              const rg = document.createRange();
              rg.selectNodeContents(n);
              for (const raw of rg.getClientRects()) {
                // the part of this text that is actually painted
                const rr = {
                  left: Math.max(raw.left, clip.left),
                  right: Math.min(raw.right, clip.right),
                  top: Math.max(raw.top, clip.top),
                  bottom: Math.min(raw.bottom, clip.bottom),
                };
                if (rr.right <= rr.left || rr.bottom <= rr.top) continue;
                const ox =
                  Math.min(br.right, rr.right) - Math.max(br.left, rr.left);
                const oy =
                  Math.min(br.bottom, rr.bottom) - Math.max(br.top, rr.top);
                if (ox > 2 && oy > 2 && ox * oy > area) {
                  area = ox * oy;
                  text = s.trim().slice(0, 40);
                }
              }
            }
            out.push({
              label: b.getAttribute("aria-label") ?? "?",
              area: Math.round(area),
              text,
            });
          }
          return out;
        });

        expect(worst.length, "review arrows are mounted").toBeGreaterThan(0);
        for (const a of worst)
          expect(
            a.area,
            `${route} @${width} ${a.label} overlaps "${a.text}"`,
          ).toBe(0);
      });
    }
  }
});

// ---------------------------------------------------------------------------

test.describe("interactive targets meet WCAG 2.2 AA 2.5.8 (24x24)", () => {
  /** Measure the target a FINGER gets, not the anchor's own line box.
   *  Two idioms on this site deliberately decouple the two:
   *  the team card's `after:inset-0` makes a 21.6px "Read More" link clickable
   *  across the whole 302x384 card, and the review chevron's `before` restores
   *  a 32x44 box under an 18x20 glyph that is sized to live's `.75rem` asset.
   *  Measuring the anchor rect alone reports both as failures; hit-testing
   *  reports what is true. */
  const probe = () => {
    const R = (n: number) => Math.round(n * 10) / 10;
    const EPS = 0.05;
    const bad: { sel: string; w: number; h: number; text: string }[] = [];
    const SEL = 'a[href], button, [role="button"], summary';
    for (const el of document.querySelectorAll<HTMLElement>(SEL)) {
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) continue;
      if (!el.checkVisibility({ opacityProperty: true })) continue;
      if (el.closest("[aria-hidden='true']")) continue;
      // The skip link is a 1x1 clip until it takes focus, at which point it
      // becomes a full-size fixed pill — 2.5.8 measures the target in the
      // state the user can activate it in, and it is unreachable by pointer.
      if (el.classList.contains("sr-only")) continue;
      // Hit-testing below only answers for what is ON SCREEN. `checkVisibility`
      // is true for elements far down the page, so measuring them here reports
      // the raw box and misses the ::before/::after hit areas entirely — which
      // is exactly how this spec first "failed" on the review chevron whose
      // 32x44 target it could not see.
      if (r.bottom < 0 || r.top > innerHeight) continue;
      // Inline links inside a sentence are exempt (2.5.8 "inline" exception).
      const p = el.parentElement;
      if (
        p &&
        getComputedStyle(el).display.startsWith("inline") &&
        (p.textContent ?? "").trim().length >
          (el.textContent ?? "").trim().length
      )
        continue;
      // EPS absorbs layout float noise, not real shortfalls: the footer's
      // tel: link computes 23.999969482421875 from `leading-[24px]` while
      // every sibling in the same column lands on exactly 24. A twenty-
      // millionth of a pixel is not a target-size defect; 19.25 was.
      if (r.width >= 24 - EPS && r.height >= 24 - EPS) continue;

      // Undersized box — grow the search outward and ask what actually
      // receives the tap, which is how the ::before/::after idioms are seen.
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      let minX = cx,
        maxX = cx,
        minY = cy,
        maxY = cy;
      for (let d = 1; d <= 24; d++) {
        if (document.elementFromPoint(cx - d, cy) === el) minX = cx - d;
        if (document.elementFromPoint(cx + d, cy) === el) maxX = cx + d;
        if (document.elementFromPoint(cx, cy - d) === el) minY = cy - d;
        if (document.elementFromPoint(cx, cy + d) === el) maxY = cy + d;
      }
      const w = Math.max(r.width, maxX - minX);
      const h = Math.max(r.height, maxY - minY);
      if (w < 24 - EPS || h < 24 - EPS)
        bad.push({
          sel:
            el.tagName.toLowerCase() + "." + String(el.className).slice(0, 60),
          w: R(w),
          h: R(h),
          text: (el.textContent ?? el.getAttribute("aria-label") ?? "")
            .trim()
            .slice(0, 40),
        });
    }
    return bad;
  };

  for (const route of ["/services", "/our-team", "/"]) {
    test(`${route} @390`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(route);
      await page.evaluate(() => document.fonts.ready);
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 400) {
          scrollTo({ top: y, behavior: "instant" });
          await new Promise((r) => setTimeout(r, 40));
        }
      });
      // Hit-testing only reports what is on screen, so sweep viewport by
      // viewport rather than measuring one screenful.
      const found = await page.evaluate(async (probeSrc) => {
        const fn = new Function("return " + probeSrc)();
        const seen = new Map<string, unknown>();
        for (let y = 0; y < document.body.scrollHeight; y += 700) {
          scrollTo({ top: y, behavior: "instant" });
          await new Promise((r) => requestAnimationFrame(() => r(null)));
          for (const b of fn() as { sel: string; text: string }[])
            seen.set(b.sel + "|" + b.text, b);
        }
        return [...seen.values()];
      }, probe.toString());

      expect(
        found,
        `${route}: targets under 24x24 — ${JSON.stringify(found).slice(0, 400)}`,
      ).toEqual([]);
    });
  }
});

// ---------------------------------------------------------------------------

test("the two maps on /contact-us have distinct accessible names", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/contact-us");
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 500) {
      scrollTo({ top: y, behavior: "instant" });
      await new Promise((r) => setTimeout(r, 30));
    }
  });
  const titles = await page.evaluate(() =>
    [...document.querySelectorAll("iframe")]
      .filter((f) => /google\.com\/maps/.test(f.getAttribute("src") ?? ""))
      .map((f) => f.getAttribute("title")),
  );
  // Live's composition keeps both maps (two `w-widget-map` widgets in
  // matching/spec/contact-us.html), so this asserts they are DISTINGUISHABLE,
  // not that one of them is gone.
  expect(titles.length, "page map + footer map").toBe(2);
  expect(new Set(titles).size, `duplicate frame titles: ${titles}`).toBe(2);
  for (const t of titles) expect(t?.trim()).toBeTruthy();
});
