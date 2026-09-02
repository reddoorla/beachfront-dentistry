// Reproduction probe for MarkUp round I1 (Tim, 2026-09-01, 8 pins across 3
// boards). Reads the RUNTIME states the pins describe — hover fills, the
// focus ring on menu open, the card-raise easing, the float's per-scroll
// deltas, and the two /our-team geometry complaints. Local dev server.
import { chromium } from "file:///Users/tuckerlemos/.claude/skills/matching-a-page/node_modules/playwright/index.mjs";

const BASE = process.env.BASE || "http://localhost:5173";
const b = await chromium.launch();
const out = {};

const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();

// ---- PIN 1: hero CTA hover fill -------------------------------------------
await p.goto(`${BASE}/`, { waitUntil: "networkidle", timeout: 60000 });
const cta = p.locator("a", { hasText: /Make Appointment/i }).first();
out.pin1 = await (async () => {
  if ((await cta.count()) === 0) return { error: "hero CTA not found" };
  const rest = await cta.evaluate((el) => ({
    cls: el.className,
    bg: getComputedStyle(el).backgroundColor,
    color: getComputedStyle(el).color,
  }));
  await cta.hover();
  await p.waitForTimeout(400);
  const hover = await cta.evaluate((el) => ({
    bg: getComputedStyle(el).backgroundColor,
    color: getComputedStyle(el).color,
  }));
  return { rest, hover };
})();

// ---- PIN 2/3: open menu, focus ring on logo, X pill, link hover ------------
await p.mouse.move(0, 0);
const trigger = p.locator('button[aria-label="Open menu"]').first();
await trigger.click();
await p.waitForTimeout(700);

out.pin2 = await p.evaluate(() => {
  const dlg = document.getElementById("nav-menu");
  const active = document.activeElement;
  const logo = dlg?.querySelector('a[href="/"]');
  const cs = logo ? getComputedStyle(logo) : null;
  return {
    activeTag: active?.tagName,
    activeLabel:
      active?.getAttribute("aria-label") || active?.getAttribute("href"),
    activeIsLogo: active === logo,
    logoFocusVisible: logo ? logo.matches(":focus-visible") : null,
    logoOutline: cs
      ? `${cs.outlineStyle} ${cs.outlineWidth} ${cs.outlineColor}`
      : null,
    logoBoxShadow: cs?.boxShadow,
  };
});

// X close button: the pill behind the glyph
const closeBtn = p.locator('button[aria-label="Close menu"]').first();
out.pin3_x = await (async () => {
  const rest = await closeBtn.evaluate((el) => {
    const pill = el.querySelector("span > span[aria-hidden]");
    const cs = pill ? getComputedStyle(pill) : null;
    return {
      pillBg: cs?.backgroundColor,
      pillOpacity: cs?.opacity,
      pillScale: cs?.scale,
    };
  });
  await closeBtn.hover();
  await p.waitForTimeout(400);
  const hover = await closeBtn.evaluate((el) => {
    const pill = el.querySelector("span > span[aria-hidden]");
    const cs = pill ? getComputedStyle(pill) : null;
    return {
      pillBg: cs?.backgroundColor,
      pillOpacity: cs?.opacity,
      pillScale: cs?.scale,
    };
  });
  return { rest, hover };
})();

// Menu link hover: what property actually animates
await p.mouse.move(0, 0);
const link = p.locator("#nav-menu nav a", { hasText: "Services" }).first();
out.pin3_link = await (async () => {
  if ((await link.count()) === 0) return { error: "menu link not found" };
  const info = await link.evaluate((el) => {
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return {
      transitionProperty: cs.transitionProperty,
      transitionDuration: cs.transitionDuration,
      transitionTimingFunction: cs.transitionTimingFunction,
      opacity: cs.opacity,
      display: cs.display,
      willChange: cs.willChange,
      rect: {
        x: +r.x.toFixed(2),
        y: +r.y.toFixed(2),
        w: +r.width.toFixed(2),
        h: +r.height.toFixed(2),
      },
    };
  });
  await link.hover();
  await p.waitForTimeout(500);
  const hovered = await link.evaluate((el) => {
    const r = el.getBoundingClientRect();
    return {
      opacity: getComputedStyle(el).opacity,
      rect: {
        x: +r.x.toFixed(2),
        y: +r.y.toFixed(2),
        w: +r.width.toFixed(2),
        h: +r.height.toFixed(2),
      },
    };
  });
  return { rest: info, hovered };
})();

await p.keyboard.press("Escape");
await p.waitForTimeout(400);

// ---- PIN 8: float per-scroll deltas ---------------------------------------
out.pin8 = await (async () => {
  const pair = p.locator('[class*="handwriting"], [class*="float"]').first();
  const found = await p.evaluate(() => {
    // the floatAlong consumer lives in QuestionList teaser variation
    const els = [...document.querySelectorAll("*")].filter((e) =>
      /translateY/.test(e.style.transform || ""),
    );
    return els.length;
  });
  // Sample the pair's document-space Y against scrollY.
  const samples = [];
  for (let y = 0; y <= 3600; y += 60) {
    await p.evaluate((yy) => window.scrollTo(0, yy), y);
    await p.waitForTimeout(180); // let the rAF follow settle
    const s = await p.evaluate(() => {
      const el =
        document.querySelector("[data-float-pair]") ||
        [...document.querySelectorAll("*")].find((e) =>
          /translateY/.test(e.style.transform || ""),
        );
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return {
        top: +(r.top + window.scrollY).toFixed(1),
        screenTop: +r.top.toFixed(1),
        tf: el.style.transform,
      };
    });
    if (s) samples.push({ scroll: y, ...s });
  }
  const deltas = samples
    .slice(1)
    .map((s, i) => +(s.top - samples[i].top).toFixed(1));
  return {
    transformedElements: found,
    n: samples.length,
    maxStep: deltas.length ? Math.max(...deltas.map(Math.abs)) : null,
    stepsOver60: deltas.filter((d) => Math.abs(d) > 60).length,
    zeroSteps: deltas.filter((d) => d === 0).length,
    deltas,
  };
})();

// ---- PIN 4/5/6: /our-team --------------------------------------------------
await p.goto(`${BASE}/our-team`, { waitUntil: "networkidle", timeout: 60000 });
await p.waitForTimeout(800);

out.pin4 = await p.evaluate(() => {
  const texts = [...document.querySelectorAll("h1,h2,span,div")].filter(
    (e) =>
      e.children.length === 0 && /^(Meet|Our|Team)$/.test(e.textContent.trim()),
  );
  return texts.map((e) => {
    const r = e.getBoundingClientRect();
    const cs = getComputedStyle(e);
    return {
      text: e.textContent.trim(),
      tag: e.tagName.toLowerCase(),
      cls: (e.className || "").toString().slice(0, 70),
      top: +(r.top + window.scrollY).toFixed(1),
      bottom: +(r.bottom + window.scrollY).toFixed(1),
      h: +r.height.toFixed(1),
      fs: cs.fontSize,
      lh: cs.lineHeight,
      mt: cs.marginTop,
      mb: cs.marginBottom,
    };
  });
});

out.pin6 = await p.evaluate(() => {
  // Team cards: find the circular portraits and the destination image bands.
  const cards = [
    ...document.querySelectorAll('[class*="team"], article, li'),
  ].filter(
    (e) => e.querySelector("img") && e.getBoundingClientRect().height > 200,
  );
  const imgs = [...document.querySelectorAll("img")]
    .map((im) => {
      const r = im.getBoundingClientRect();
      return {
        alt: (im.alt || "").slice(0, 28),
        cls: (im.className || "").toString().slice(0, 50),
        top: +(r.top + window.scrollY).toFixed(1),
        bottom: +(r.bottom + window.scrollY).toFixed(1),
        left: +r.left.toFixed(1),
        w: +r.width.toFixed(1),
        h: +r.height.toFixed(1),
        round: getComputedStyle(im).borderRadius,
        z: getComputedStyle(im.parentElement || im).zIndex,
      };
    })
    .filter((i) => i.h > 40);
  return { cardCount: cards.length, imgs: imgs.slice(0, 24) };
});

out.pin5 = await p.evaluate(() => {
  const card = [...document.querySelectorAll("*")].find((e) => {
    const cs = getComputedStyle(e);
    return (
      /transform|translate/.test(cs.transitionProperty) &&
      e.getBoundingClientRect().height > 200 &&
      e.querySelector("img")
    );
  });
  if (!card) return { error: "no transition-transform card found" };
  const cs = getComputedStyle(card);
  return {
    cls: (card.className || "").toString().slice(0, 120),
    transitionProperty: cs.transitionProperty,
    transitionDuration: cs.transitionDuration,
    transitionTimingFunction: cs.transitionTimingFunction,
    willChange: cs.willChange,
  };
});

console.log(JSON.stringify(out, null, 1));
await b.close();
