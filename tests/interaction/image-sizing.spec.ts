import { expect, test } from "@playwright/test";

/**
 * Photographs must not ship at many times the size of the box they land in.
 *
 * @prismicio/svelte's PrismicImage emits `src`/`srcset`/`width`/`height` and
 * never `sizes`. With a width-descriptor srcset and no `sizes`, the browser is
 * REQUIRED to assume `100vw` — so every photo on the site picked its candidate
 * as though it filled the viewport. Measured before PrismicPhoto existed, at
 * 1440 with zero scroll: /ask-the-doctor 4,968KB of images (39 cards each
 * pulling a 2048-wide file for a 625px box), / 4,057KB, /your-first-visit
 * 3,405KB. The imgix ladder was always working; the browser was never told
 * which rung to pick.
 *
 * This asserts the OUTCOME — delivered pixels versus rendered box — rather than
 * the presence of a `sizes` attribute, because a `sizes` value can be present
 * and wrong. It is wrong in a specific direction that matters: four of this
 * site's photo boxes are LARGER at 834 than at 1440 (the team headshot is
 * `md:size-[320px] lg:size-[200px]`), so a `sizes` written as a rising ladder
 * understates the tablet and ships a soft photo to a 2x device. Both directions
 * are checked below.
 */

const PAGES = [
  "/",
  "/our-team",
  "/your-first-visit",
  "/ask-the-doctor",
  "/team-members/dr-robert-quan",
];

/** Widths that between them expose the non-monotonic boxes. 834 is the tier
 *  where several boxes are at their LARGEST, which is exactly where an
 *  understated `sizes` does its damage. */
const WIDTHS = [390, 834, 1440];

/** Delivered width ÷ rendered CSS width.
 *
 *  Ceiling: the imgix ladder's steps are 480/768/1024/1440/1920/2560, so a box
 *  can legitimately land just under a rung and take the next one up — a 406px
 *  box takes the 480 candidate, 1.18x. Doubling that leaves room for the ladder
 *  plus a DPR-conscious `sizes` without leaving room for the 7x-12x overshoots
 *  this test exists to prevent.
 *
 *  There is deliberately NO 1x lower bound here. A first version had one and it
 *  was wrong twice over: it flagged `624px into a 625px box` (imgix returning
 *  the crop's own width — a source-asset limit, nothing `sizes` can fix), and
 *  more importantly a 1x floor cannot detect an understated `sizes` at all. The
 *  ladder's rungs are coarse, so asking for 200px still yields the 480
 *  candidate and lands ABOVE a 320px box. Understatement only bites on a
 *  high-DPR screen, which is what the dedicated 2x test below checks. */
const MAX_OVERSHOOT = 2.4;

type Row = {
  src: string;
  box: number;
  natural: number;
  ratio: number;
  sizes: string | null;
  loading: string | null;
  alt: string;
};

for (const width of WIDTHS) {
  for (const path of PAGES) {
    test(`photographs are sized for their box — ${path} @${width}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      // Reduce: the scroll reveal transforms wrappers, and a mid-flight element
      // would be measured at a transformed size.
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(path, { waitUntil: "networkidle" });

      // Lay the whole page out and let every lazy image commit, otherwise the
      // below-fold photos this change most affects are never measured.
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 600) {
          scrollTo({ top: y, behavior: "instant" });
          await new Promise((r) => setTimeout(r, 40));
        }
        scrollTo({ top: 0, behavior: "instant" });
        // Race every wait against a deadline. A lazy image that never enters
        // the viewport never starts loading and therefore never fires, so an
        // unbounded Promise.all here hangs the whole evaluate — which is what
        // the first version of this spec did.
        await Promise.all(
          Array.from(document.images)
            .filter((i) => !i.complete)
            .map(
              (i) =>
                new Promise((res) => {
                  const done = () => res(null);
                  i.addEventListener("load", done, { once: true });
                  i.addEventListener("error", done, { once: true });
                  setTimeout(done, 4000);
                }),
            ),
        );
      });

      const rows: Row[] = await page.evaluate(() =>
        Array.from(document.images)
          // Prismic/imgix assets only. The four static heroes bypass the
          // pipeline entirely (`isPrismicImageUrl` is false for /images/*.jpg,
          // so `srcset()` returns undefined and there is no ladder to pick
          // from) — they are a separate, known problem and cannot pass a test
          // about choosing a candidate.
          .filter((img) => /images\.prismic\.io/.test(img.currentSrc || ""))
          .filter((img) => img.naturalWidth > 0)
          .map((img) => {
            const r = img.getBoundingClientRect();
            return {
              src: (img.currentSrc.split("?")[0] ?? "").split("/").pop() ?? "",
              box: Math.round(r.width),
              natural: img.naturalWidth,
              ratio: r.width > 0 ? img.naturalWidth / r.width : 0,
              sizes: img.getAttribute("sizes"),
              loading: img.getAttribute("loading"),
              alt: (img.getAttribute("alt") ?? "").slice(0, 20),
            };
          })
          .filter((row) => row.box >= 2),
      );

      expect(
        rows.length,
        `${path} @${width} renders Prismic photos`,
      ).toBeGreaterThan(0);

      const oversized = rows.filter((r) => r.ratio > MAX_OVERSHOOT);
      expect(
        oversized.map(
          (r) =>
            `${r.src} ${r.natural}px into a ${r.box}px box (${r.ratio.toFixed(1)}x) sizes=${r.sizes}`,
        ),
        `${path} @${width}: images delivered far larger than their box`,
      ).toEqual([]);
    });
  }
}

test("the non-monotonic boxes are not understated on a 2x tablet", async ({
  browser,
}) => {
  // THE regression this whole change can produce, in the one place it bites.
  //
  // Four of the site's photo boxes are LARGER at 834 than at 1440 — the team
  // card headshot literally reads `md:size-[320px] lg:size-[200px]`. The audit
  // proposed a flat `sizes="200px"` for it. At 1x that is invisible (the
  // ladder's 480 rung covers a 320px box either way); at 2x the browser needs
  // 640px, asks for 400, gets the 480 candidate, and renders a soft photo on
  // exactly the device most likely to show it.
  //
  // So: 834 wide, deviceScaleFactor 2, and every photo must carry at least 1.5x
  // its CSS box in real pixels. Not the full 2.0 — the ladder is coarse enough
  // that a box just above a rung cannot reach it, and demanding 2.0 would force
  // oversizing everything to pass a test.
  const context = await browser.newContext({
    viewport: { width: 834, height: 1000 },
    deviceScaleFactor: 2,
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await page.goto("/our-team", { waitUntil: "networkidle" });
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) {
      scrollTo({ top: y, behavior: "instant" });
      await new Promise((r) => setTimeout(r, 40));
    }
    await Promise.all(
      Array.from(document.images)
        .filter((i) => !i.complete)
        .map(
          (i) =>
            new Promise((res) => {
              const done = () => res(null);
              i.addEventListener("load", done, { once: true });
              i.addEventListener("error", done, { once: true });
              setTimeout(done, 4000);
            }),
        ),
    );
  });

  // Assert on the width the browser REQUESTED, not on naturalWidth.
  //
  // naturalWidth is capped by the source asset: several headshots are 320px
  // crops, so imgix returns 320 for a `width=640` request because it does not
  // upscale. A first version of this test compared naturalWidth to the box and
  // flagged 26 images whose `sizes` was in fact exactly right — the browser had
  // asked for 640 for a 320px box at 2x, which is the behaviour being tested.
  // What `sizes` controls is the REQUEST; the source's own resolution is a
  // content decision no attribute can fix.
  const soft = await page.evaluate(() =>
    Array.from(document.images)
      .filter((img) => /images\.prismic\.io/.test(img.currentSrc || ""))
      .map((img) => {
        const box = img.getBoundingClientRect().width;
        const asked = Number(
          new URL(img.currentSrc).searchParams.get("width") ?? 0,
        );
        return {
          src: (img.currentSrc.split("?")[0] ?? "").split("/").pop() ?? "",
          box: Math.round(box),
          asked,
          need: Math.round(box * devicePixelRatio),
          sizes: img.getAttribute("sizes"),
        };
      })
      // The ladder is coarse, so allow one step of slack rather than demanding
      // an exact 2x match.
      .filter((r) => r.box >= 40 && r.asked > 0 && r.asked < r.need * 0.9),
  );

  expect(
    soft.map(
      (r) =>
        `${r.src} requested ${r.asked}px for a ${r.box}px box at 2x (needs ~${r.need}px) sizes=${r.sizes}`,
    ),
    "sizes understates these boxes — the browser is asking for too few pixels on a 2x screen",
  ).toEqual([]);
  await context.close();
});

test("every Prismic photo declares sizes and a loading strategy", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/", { waitUntil: "networkidle" });
  const missing = await page.evaluate(() =>
    Array.from(document.images)
      .filter((img) => /images\.prismic\.io/.test(img.currentSrc || img.src))
      .filter(
        (img) => !img.getAttribute("sizes") || !img.getAttribute("loading"),
      )
      .map(
        (img) =>
          `${(img.currentSrc || img.src).split("/").pop()?.split("?")[0]} sizes=${img.getAttribute("sizes")} loading=${img.getAttribute("loading")}`,
      ),
  );
  expect(
    missing,
    "a Prismic photo is rendering without PrismicPhoto — it will default to 100vw",
  ).toEqual([]);
});
