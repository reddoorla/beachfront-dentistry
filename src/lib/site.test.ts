import { describe, it, expect } from "vitest";
import { loadSiteConfig, type FooterText } from "./blux/site-config";
import { PHONE, MODENTO_URL } from "./site";

// The practice phone + Modento payment URL live in BOTH src/lib/site.ts (nav
// CTAs, routes) and site-config.json's footer columns (the Blux chrome shape).
// The fleet has already shipped a footer-tel drift bug from exactly this kind
// of duplication — these asserts make a one-sided edit fail loudly.
describe("site constants stay in sync with site-config.json", () => {
  const items = (loadSiteConfig().footer.columns ?? [])
    .flatMap((c) => c.items)
    .filter((i): i is FooterText => "text" in i);

  it("footer tel entry matches PHONE (href and display text)", () => {
    const tel = items.find((i) => i.href?.startsWith("tel:"));
    expect(tel?.href).toBe(PHONE.href);
    expect(tel?.text).toBe(PHONE.display);
  });

  it("footer Make a Payment link matches MODENTO_URL", () => {
    const payment = items.find((i) => i.text === "Make a Payment");
    expect(payment?.href).toBe(MODENTO_URL);
  });
});
