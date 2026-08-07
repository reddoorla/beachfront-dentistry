// Phase 5 interaction pass — drives each home-page interaction on the candidate
// and captures paired closed/open screenshots + asserts the state transition.
// Best-effort live captures for menu + slider where selectors are stable.
import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";
import { mkdirSync } from "node:fs";

const CAND = "http://localhost:5190/";
const LIVE = "https://www.beachfrontdentistry.com/";
const DIR =
  "/Users/tuckerlemos/Documents/GitHub/beachfront-dentistry/matching/states";
mkdirSync(DIR, { recursive: true });

const results = [];
const rec = (name, ok, detail) => {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}  ${detail ?? ""}`);
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Settle scroll so reveal-animations fire before we screenshot.
async function settle(p) {
  await p.evaluate(async () => {
    await new Promise((res) => {
      let y = 0;
      const step = () => {
        window.scrollTo(0, y);
        y += 300;
        if (y < document.body.scrollHeight) setTimeout(step, 40);
        else {
          window.scrollTo(0, 0);
          setTimeout(res, 250);
        }
      };
      step();
    });
  });
  await sleep(300);
}

const b = await chromium.launch();
try {
  // ---------- CANDIDATE ----------
  // 1) MENU (hamburgerOnly → hamburger at both 390 and 1440)
  for (const vw of [390, 1440]) {
    const p = await b.newPage({ viewport: { width: vw, height: 900 } });
    try {
      await p.goto(CAND, { waitUntil: "networkidle", timeout: 60000 });
      await p.locator('button[aria-label="Open menu"]').first().click();
      await sleep(900); // fly y:-800 700ms
      const dlg = p.locator('[role="dialog"][aria-label="Menu"]');
      const open = await dlg.isVisible();
      await p.screenshot({ path: `${DIR}/cand-menu-${vw}-open.png` });
      // links present?
      const links = await dlg.locator("a").count();
      await p.locator('button[aria-label="Close menu"]').first().click();
      await sleep(900);
      const closed = !(await dlg.isVisible().catch(() => false));
      rec(
        `cand menu@${vw}`,
        open && closed && links >= 4,
        `open=${open} links=${links} closedAfter=${closed}`,
      );
    } catch (e) {
      rec(`cand menu@${vw}`, false, `ERROR ${e.message}`);
    } finally {
      await p.close();
    }
  }

  // 2) READ REVIEWS expander @1440
  {
    const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
    try {
      await p.goto(CAND, { waitUntil: "networkidle", timeout: 60000 });
      await settle(p);
      const btn = p.locator('button:has-text("Read Reviews")').first();
      await btn.scrollIntoViewIfNeeded();
      await sleep(300);
      const box = await btn.boundingBox();
      const clip = {
        x: Math.max(0, box.x - 40),
        y: Math.max(0, box.y - 20),
        width: 500,
        height: 200,
      };
      await p.screenshot({
        path: `${DIR}/cand-readreviews-1440-closed.png`,
        clip,
      });
      const before = await btn.getAttribute("aria-expanded");
      await btn.click();
      await sleep(2200); // opacity 2s
      const after = await btn.getAttribute("aria-expanded");
      // icons row opacity
      const rowId = await btn.getAttribute("aria-controls");
      const rowOpacity = await p.evaluate((id) => {
        const el = document.getElementById(id);
        return el ? getComputedStyle(el).opacity : null;
      }, rowId);
      await p.screenshot({
        path: `${DIR}/cand-readreviews-1440-open.png`,
        clip,
      });
      rec(
        "cand readReviews@1440",
        before === "false" && after === "true" && Number(rowOpacity) > 0.9,
        `aria ${before}->${after} rowOpacity=${rowOpacity}`,
      );
    } catch (e) {
      rec("cand readReviews@1440", false, `ERROR ${e.message}`);
    } finally {
      await p.close();
    }
  }

  // 3) REVIEW SLIDER @1440 (Next advances slide)
  {
    const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
    try {
      await p.goto(CAND, { waitUntil: "networkidle", timeout: 60000 });
      await settle(p);
      const next = p.locator('button[aria-label="Next slide"]').first();
      await next.scrollIntoViewIfNeeded();
      await sleep(400);
      // read the live-region / slide index before + after
      const readIdx = async () =>
        p.evaluate(() => {
          const lr = [...document.querySelectorAll(".sr-only")]
            .map((e) => e.textContent.trim())
            .find((t) => /slide/i.test(t));
          return lr ?? null;
        });
      const carousel = next.locator(
        "xpath=ancestor::*[contains(@aria-roledescription,'carousel') or @aria-label][1]",
      );
      const cbox =
        (await await carousel
          .first()
          .boundingBox()
          .catch(() => null)) || (await next.boundingBox());
      const clip = {
        x: Math.max(0, cbox.x - 20),
        y: Math.max(0, cbox.y - 260),
        width: Math.min(1400, cbox.width + 40 || 900),
        height: 620,
      };
      await p.screenshot({ path: `${DIR}/cand-slider-1440-a.png`, clip });
      const before = await readIdx();
      await next.click();
      await sleep(900);
      const after = await readIdx();
      await p.screenshot({ path: `${DIR}/cand-slider-1440-b.png`, clip });
      rec(
        "cand reviewSlider@1440",
        !!before && !!after && before !== after,
        `"${before}" -> "${after}"`,
      );
    } catch (e) {
      rec("cand reviewSlider@1440", false, `ERROR ${e.message}`);
    } finally {
      await p.close();
    }
  }

  // 4) QA ACCORDION @834 (first card expands)
  {
    const p = await b.newPage({ viewport: { width: 834, height: 1100 } });
    try {
      await p.goto(CAND, { waitUntil: "networkidle", timeout: 60000 });
      await settle(p);
      const card = p.locator('button[aria-label^="Expand:"]').first();
      await card.scrollIntoViewIfNeeded();
      await sleep(300);
      const box = await card.boundingBox();
      const clip = {
        x: Math.max(0, box.x - 10),
        y: Math.max(0, box.y - 10),
        width: Math.min(834, box.width + 20),
        height: 460,
      };
      await p.screenshot({ path: `${DIR}/cand-qa-834-closed.png`, clip });
      const before = await card.getAttribute("aria-expanded");
      await card.click();
      await sleep(900); // translate 650ms
      // the aria-label flips to Collapse: after expand
      const nowExpand = p.locator('button[aria-label^="Collapse:"]').first();
      const after = await nowExpand
        .getAttribute("aria-expanded")
        .catch(() => null);
      const clip2 = {
        x: clip.x,
        y: Math.max(0, box.y - 120),
        width: clip.width,
        height: 480,
      };
      await p.screenshot({ path: `${DIR}/cand-qa-834-open.png`, clip: clip2 });
      rec(
        "cand qaAccordion@834",
        before === "false" && after === "true",
        `aria ${before}->${after}`,
      );
    } catch (e) {
      rec("cand qaAccordion@834", false, `ERROR ${e.message}`);
    } finally {
      await p.close();
    }
  }

  // 5) HOVER states @1440 (pill bg + Read Reviews opacity change)
  {
    const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
    try {
      await p.goto(CAND, { waitUntil: "networkidle", timeout: 60000 });
      // Request Appointment pill (nav) — hover flips bg white->white/90
      const pill = p.locator('a:has-text("Request Appointment")').first();
      const bgBefore = await pill.evaluate(
        (el) => getComputedStyle(el).backgroundColor,
      );
      await pill.hover();
      await sleep(250);
      const bgAfter = await pill.evaluate(
        (el) => getComputedStyle(el).backgroundColor,
      );
      rec(
        "cand hover: Request Appointment pill",
        bgBefore !== bgAfter,
        `bg ${bgBefore} -> ${bgAfter}`,
      );

      await settle(p);
      const rr = p.locator('button:has-text("Read Reviews")').first();
      await rr.scrollIntoViewIfNeeded();
      const opBefore = await rr.evaluate((el) => getComputedStyle(el).opacity);
      await rr.hover();
      await sleep(250);
      const opAfter = await rr.evaluate((el) => getComputedStyle(el).opacity);
      rec(
        "cand hover: Read Reviews",
        opBefore !== opAfter,
        `opacity ${opBefore} -> ${opAfter}`,
      );
    } catch (e) {
      rec("cand hover", false, `ERROR ${e.message}`);
    } finally {
      await p.close();
    }
  }

  // ---------- LIVE (best-effort reference captures) ----------
  // Live menu @1440 (Webflow .menu-button opens .dropdown-modal-ish)
  {
    const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
    try {
      await p.goto(LIVE, { waitUntil: "networkidle", timeout: 60000 });
      const trigger = p
        .locator('.menu-button, [class*="menu-button"], .w-nav-button')
        .first();
      await trigger.click({ timeout: 8000 });
      await sleep(1000);
      await p.screenshot({ path: `${DIR}/live-menu-1440-open.png` });
      rec("live menu@1440 capture", true, "screenshot saved");
    } catch (e) {
      rec("live menu@1440 capture", false, `ERROR ${e.message}`);
    } finally {
      await p.close();
    }
  }
  // Live review slider @1440 (advance via arrow)
  {
    const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
    try {
      await p.goto(LIVE, { waitUntil: "networkidle", timeout: 60000 });
      await settle(p);
      const arrow = p
        .locator('.w-slider-arrow-right, [class*="slider-arrow"]')
        .first();
      await arrow.scrollIntoViewIfNeeded();
      const box = await arrow.boundingBox();
      const clip = {
        x: 0,
        y: Math.max(0, box.y - 260),
        width: 1440,
        height: 620,
      };
      await p.screenshot({ path: `${DIR}/live-slider-1440-a.png`, clip });
      await arrow.click();
      await sleep(1000);
      await p.screenshot({ path: `${DIR}/live-slider-1440-b.png`, clip });
      rec("live reviewSlider@1440 capture", true, "screenshots saved");
    } catch (e) {
      rec("live reviewSlider@1440 capture", false, `ERROR ${e.message}`);
    } finally {
      await p.close();
    }
  }

  console.log("\n=== SUMMARY ===");
  const fails = results.filter((r) => !r.ok);
  console.log(`${results.length - fails.length}/${results.length} passed`);
  if (fails.length)
    console.log("FAILS: " + fails.map((f) => f.name).join(", "));
} finally {
  await b.close();
}
