import { describe, it, expect } from "vitest";
import { GA_MEASUREMENT_ID, shouldLoadAnalytics } from "./analytics";

describe("shouldLoadAnalytics", () => {
  it("loads on the production hostnames", () => {
    expect(shouldLoadAnalytics("www.beachfrontdentistry.com", false)).toBe(
      true,
    );
    expect(shouldLoadAnalytics("beachfrontdentistry.com", false)).toBe(true);
  });

  it("never loads in dev, even on the production hostname", () => {
    expect(shouldLoadAnalytics("www.beachfrontdentistry.com", true)).toBe(
      false,
    );
  });

  it("stays off for localhost and Netlify previews", () => {
    expect(shouldLoadAnalytics("localhost", false)).toBe(false);
    expect(shouldLoadAnalytics("beachfront-dentistry.netlify.app", false)).toBe(
      false,
    );
    expect(
      shouldLoadAnalytics(
        "deploy-preview-12--beachfront-dentistry.netlify.app",
        false,
      ),
    ).toBe(false);
  });

  it("carries the beachfront web-stream measurement ID", () => {
    expect(GA_MEASUREMENT_ID).toBe("G-51J638HZPL");
  });
});
