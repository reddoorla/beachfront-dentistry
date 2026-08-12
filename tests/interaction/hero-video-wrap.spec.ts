import { expect, test } from "@playwright/test";

/**
 * The hero video's 15-second loop wrap, dissolved rather than cut.
 *
 * `loop` on a 15.448s three-shot montage jumps from a warm backlit runner at
 * sunset straight back to a cool aerial coastline, behind the h1, every 15
 * seconds. Measured as mean absolute per-channel difference against the frame
 * the loop returns to: 62.2 / 255. Anyone lingering on the fold sees it
 * repeatedly, and on a dental practice's front page it reads as a playback
 * glitch.
 *
 * The dissolve goes through the poster image, which is only sound because the
 * poster IS frame 0 — verified by decoding the webm and comparing: 1.62 at t=0,
 * rising monotonically (3.77 at 0.1s, 8.22 at 0.5s, 69.15 at 2s). The audit
 * claimed the opposite ("the drone has moved between them") and asked for a
 * poster→video fade on those grounds; measurement said no, so that half was not
 * built. Fading a seamless handoff would add a visible change where none exists.
 */

const NEAR_END = 0.4; // inside the 0.7s dissolve window
const opacityOf = "video";

test("the video dissolves out before the loop wraps, and comes back after", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/", { waitUntil: "networkidle" });

  const video = page.locator(opacityOf).first();
  await expect(video).toHaveCount(1);

  // Wait for playback to actually start — `preload="none"` means the fetch only
  // begins when the effect calls play(), so an immediate assertion would race it.
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const v = document.querySelector("video");
          return !!v && v.readyState >= 2;
        }),
      { timeout: 30000, message: "the hero video never became playable" },
    )
    .toBe(true);

  // At rest, mid-montage, the video is fully opaque and the poster is behind it.
  await page.evaluate(() => {
    const v = document.querySelector("video")!;
    v.currentTime = 3;
  });
  await expect
    .poll(() =>
      page.evaluate(() =>
        Number(getComputedStyle(document.querySelector("video")!).opacity),
      ),
    )
    .toBe(1);

  // Scrub into the dissolve window.
  await page.evaluate(
    ([lead]) => {
      const v = document.querySelector("video")!;
      v.currentTime = v.duration - lead;
    },
    [NEAR_END],
  );

  await expect
    .poll(
      () =>
        page.evaluate(() =>
          Number(getComputedStyle(document.querySelector("video")!).opacity),
        ),
      {
        timeout: 4000,
        message: "the video did not fade out approaching the wrap",
      },
    )
    .toBeLessThan(0.5);

  // And back: rewinding past the wrap restores it.
  await page.evaluate(() => {
    const v = document.querySelector("video")!;
    v.currentTime = 0;
  });
  await expect
    .poll(
      () =>
        page.evaluate(() =>
          Number(getComputedStyle(document.querySelector("video")!).opacity),
        ),
      { timeout: 4000, message: "the video never came back after the wrap" },
    )
    .toBe(1);
});

test("the poster is a real element behind the video, not just an attribute", async ({
  page,
}) => {
  // The `poster` attribute is discarded by the browser the moment playback
  // starts, so a dissolve driven off video opacity would fade to whatever is
  // behind — flat `bg-dark`. This is the element that makes the dissolve show a
  // photograph, and the element reduced-motion visitors see.
  await page.goto("/", { waitUntil: "networkidle" });
  const state = await page.evaluate(() => {
    const v = document.querySelector("video");
    const img = v?.parentElement?.querySelector("img[aria-hidden='true']");
    if (!v || !img) return null;
    const vb = v.getBoundingClientRect();
    const ib = img.getBoundingClientRect();
    return {
      sameBox:
        Math.abs(vb.width - ib.width) < 2 &&
        Math.abs(vb.height - ib.height) < 2,
      posterSrc: (img as HTMLImageElement).getAttribute("src"),
      videoPoster: v.getAttribute("poster"),
    };
  });
  expect(state, "a poster <img> sits alongside the hero video").not.toBeNull();
  expect(state!.sameBox, "the poster covers the same box as the video").toBe(
    true,
  );
  // Same asset as the preload and the attribute — one file, one request.
  expect(state!.posterSrc).toBe(state!.videoPoster);
});

test("under reduced motion the hero shows the still and never plays", async ({
  page,
}) => {
  // The trap the audit flagged: fading a video whose branch never plays would
  // strand motion-averse visitors on an empty band. They must get a photograph.
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);

  const state = await page.evaluate(() => {
    const v = document.querySelector("video")!;
    const img = v.parentElement?.querySelector(
      "img[aria-hidden='true']",
    ) as HTMLImageElement | null;
    return {
      paused: v.paused,
      currentTime: v.currentTime,
      videoOpacity: Number(getComputedStyle(v).opacity),
      posterVisible: img
        ? img.checkVisibility({ opacityProperty: true })
        : false,
    };
  });

  expect(state.paused, "the hero video must not play under reduce").toBe(true);
  expect(state.currentTime).toBe(0);
  // Not left invisible by a dissolve that can never complete.
  expect(state.videoOpacity).toBe(1);
  expect(state.posterVisible, "the still must be showing").toBe(true);
});
