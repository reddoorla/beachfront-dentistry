import { describe, expect, it } from "vitest";
import {
  firstFamily,
  groupStyles,
  hexColor,
  ownText,
  pickPages,
  px,
  textElements,
  type Measurement,
  type ScanHit,
} from "./measure";
import { inlineSizes } from "./inventory";

const m = (size: string): Measurement => ({
  style: {
    family: "museo-sans",
    stack: "museo-sans, sans-serif",
    size,
    lineHeight: "24px",
    weight: "300",
    letterSpacing: "normal",
    color: "rgb(34, 34, 34)",
    transform: "none",
    style: "normal",
    decoration: "none",
  },
  visible: true,
  states: {},
});
const hit = (page: string, path: string, size: string): ScanHit => ({
  page,
  path,
  interactive: false,
  tag: "p",
  context: "Main",
  classes: [],
  text: `${page} ${path}`,
  m: m(size),
});

describe("type specimen measuring", () => {
  it("names the first family of a stack, unquoted", () => {
    expect(firstFamily('museo-slab, "Rockwell", serif')).toBe("museo-slab");
    expect(firstFamily('"Avenir Next", sans-serif')).toBe("Avenir Next");
  });

  it("writes colours as hex and px to two places", () => {
    expect(hexColor("rgb(14, 119, 153)")).toBe("#0e7799");
    expect(hexColor("rgba(0, 0, 0, 0.5)")).toBe("#000000 at 50%");
    expect(px("17.36531px")).toBe("17.37px");
    expect(px("normal")).toBe("normal");
  });

  it("finds the elements that own text, not their wrappers", () => {
    document.body.innerHTML =
      "<div><p>Hello <strong>bold</strong></p><div><span> </span></div><script>x</script></div>";
    const tags = textElements(document.body).map((e) => e.tagName);
    expect(tags).toEqual(["P", "STRONG"]);
    expect(ownText(document.querySelector("p")!)).toBe("Hello bold");
  });

  // Two elements are one style only when they agree at every width: the
  // phone column is the point of the page.
  it("splits styles that agree at desktop but differ on a phone", () => {
    const groups = groupStyles({
      desktop: [hit("/a", "1", "20px"), hit("/a", "2", "20px")],
      tablet: [hit("/a", "1", "16px"), hit("/a", "2", "16px")],
      mobile: [hit("/a", "1", "12px"), hit("/a", "2", "16px")],
    });
    expect(groups).toHaveLength(2);
    expect(groups.map((g) => g.by.mobile?.style.size).sort()).toEqual([
      "12px",
      "16px",
    ]);
  });

  it("merges the same style across pages and counts it", () => {
    const groups = groupStyles({
      desktop: [hit("/a", "1", "20px"), hit("/b", "1", "20px")],
      mobile: [hit("/a", "1", "12px"), hit("/b", "1", "12px")],
    });
    expect(groups).toHaveLength(1);
    expect(groups[0].count).toBe(2);
    expect([...groups[0].pages]).toEqual(["/a", "/b"]);
  });

  it("scans every top-level page and one page per nested template", () => {
    expect(
      pickPages([
        "/",
        "/our-team",
        "/services/a",
        "/services/b",
        "/questions/x",
        "/our-team",
      ]),
    ).toEqual(["/", "/our-team", "/services/a", "/questions/x"]);
  });
});

describe("one-off size inventory", () => {
  it("lists arbitrary text sizes and font-size declarations with their lines", () => {
    const got = inlineSizes({
      "/src/lib/components/A.svelte":
        '<p class="text-[12px] md:[&_p]:text-[19px] text-sm">x</p>\n<style>h1 { font-size: 2rem; }</style>',
      "/src/routes/dev/x/+page.svelte": '<p class="text-[99px]">dev</p>',
    });
    expect(got.map((r) => `${r.line} ${r.token}`)).toEqual([
      "1 text-[12px]",
      "1 md:[&_p]:text-[19px]",
      "2 font-size: 2rem",
    ]);
  });

  it("ignores sizes quoted in comments", () => {
    const got = inlineSizes({
      "/src/lib/components/B.svelte":
        '<!-- was text-[40px] -->\n<p class="text-[20px]">x</p> <!-- see https://x.com -->',
    });
    expect(got.map((r) => r.token)).toEqual(["text-[20px]"]);
  });
});
