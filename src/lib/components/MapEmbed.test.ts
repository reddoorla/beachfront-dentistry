import { render, cleanup } from "@testing-library/svelte";
import { afterEach, describe, expect, it } from "vitest";
import MapEmbed from "./MapEmbed.svelte";

afterEach(() => cleanup());

describe("MapEmbed", () => {
  it("encodes the query into the iframe src and carries title/loading attrs", () => {
    const { getByTitle } = render(MapEmbed, {
      props: { query: "123 Main St, Some City, CA" },
    });
    const iframe = getByTitle(
      "Map to Beachfront Dentistry",
    ) as HTMLIFrameElement;
    expect(iframe.getAttribute("src")).toBe(
      "https://www.google.com/maps?q=" +
        encodeURIComponent("123 Main St, Some City, CA") +
        "&output=embed",
    );
    expect(iframe.getAttribute("loading")).toBe("lazy");
    expect(iframe.getAttribute("referrerpolicy")).toBe(
      "no-referrer-when-downgrade",
    );
  });

  it("defaults the query to the practice address", () => {
    const { getByTitle } = render(MapEmbed);
    const iframe = getByTitle(
      "Map to Beachfront Dentistry",
    ) as HTMLIFrameElement;
    expect(iframe.getAttribute("src")).toContain(
      encodeURIComponent("1706 S Elena Ave"),
    );
  });
});
