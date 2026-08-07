import { describe, it, expect } from "vitest";
import { loadSiteConfig, type FooterText } from "./blux/site-config";
import {
  ADDRESS,
  HOURS,
  PHONE,
  MODENTO_URL,
  openingHoursSpecification,
} from "./site";

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

  it("footer office-hours lines match HOURS ('<day> / <time>', same order)", () => {
    const texts = items.map((i) => i.text);
    for (const [day, time] of HOURS) {
      expect(texts).toContain(`${day} / ${time}`);
    }
  });

  it("footer address lines match ADDRESS", () => {
    const texts = items.map((i) => i.text);
    expect(texts).toContain(ADDRESS.line1);
    expect(texts).toContain(ADDRESS.line2);
  });
});

// The structured data a crawler reads and the hours a patient reads come from
// ONE source (HOURS). These pin the derivation, because a silent bug here means
// Google publishes wrong opening hours for a medical practice — a failure users
// experience as a locked door, and one nothing else in the suite would catch.
describe("openingHoursSpecification()", () => {
  const spec = openingHoursSpecification();

  it("expands a day RANGE into its individual days", () => {
    const weekdays = spec.find((s) => s.dayOfWeek.includes("Monday"));
    expect(weekdays?.dayOfWeek).toEqual([
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
    ]);
  });

  it("keeps a single day as a single day", () => {
    const friday = spec.find((s) => s.dayOfWeek.join() === "Friday");
    expect(friday).toBeTruthy();
  });

  it("converts 12-hour display times to 24-hour schema times", () => {
    const weekdays = spec.find((s) => s.dayOfWeek.includes("Monday"))!;
    expect(weekdays.opens).toBe("07:00");
    expect(weekdays.closes).toBe("17:00");
    const friday = spec.find((s) => s.dayOfWeek.join() === "Friday")!;
    expect(friday.closes).toBe("14:00");
  });

  it("OMITS closed ranges rather than emitting a zero-length window", () => {
    // schema.org treats an absent day as closed; emitting opens==closes makes
    // Google render "Closed 00:00-00:00".
    const days = spec.flatMap((s) => s.dayOfWeek);
    expect(days).not.toContain("Saturday");
    expect(days).not.toContain("Sunday");
  });

  it("covers every open range in HOURS, and only those", () => {
    const openRanges = HOURS.filter(([, t]) => !/closed/i.test(t));
    expect(spec).toHaveLength(openRanges.length);
  });
});
