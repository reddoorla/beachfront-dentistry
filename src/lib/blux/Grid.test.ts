import { describe, expect, it, afterEach } from "vitest";
import { render, cleanup, fireEvent } from "@testing-library/svelte";
import Grid from "./Grid.svelte";
import { GRID_GUTTER } from "./presentation";
import type { RenderNode } from "./presentation";

afterEach(() => cleanup());

const tree: RenderNode = {
  kind: "stack",
  children: [
    { kind: "heading", level: 2, html: "The <em>Space</em>", role: "text2" },
    {
      kind: "row",
      cells: [
        {
          token: { cols: 2, ratio: 60 },
          node: { kind: "body", html: "<p>Left copy</p>", role: "text4" },
        },
        {
          token: { cols: 2, ratio: 40 },
          node: {
            kind: "media",
            media: { kind: "image", url: "https://cdn/a.jpg" },
          },
        },
      ],
    },
  ],
};

describe("Grid (recursive fallback)", () => {
  it("renders nested rows/cells with token widths and role classes", () => {
    const { container } = render(Grid, { props: { node: tree } });
    const h2 = container.querySelector("h2");
    expect(h2?.innerHTML).toContain("The <em>Space</em>");
    expect(h2?.className).toContain("txt-role-text2");
    const cells = container.querySelectorAll("[data-grid-cell]");
    expect(cells).toHaveLength(2);
    // The two 60/40 cells share one flex line (k=2), so each reserves half the
    // column gutter out of its basis — the columns still fit one line.
    expect(
      (cells[0] as HTMLElement).style.getPropertyValue("--cell-basis"),
    ).toBe(`calc(60% - ${GRID_GUTTER / 2}%)`);
    expect(
      (cells[1] as HTMLElement).style.getPropertyValue("--cell-basis"),
    ).toBe(`calc(40% - ${GRID_GUTTER / 2}%)`);
    expect(container.querySelector("img")?.getAttribute("src")).toBe(
      "https://cdn/a.jpg",
    );
    expect(container.textContent).toContain("Left copy");
  });

  it("applies the same column gutter the cell bases reserve (GRID_GUTTER)", () => {
    const { container } = render(Grid, { props: { node: tree } });
    const row = container.querySelector("[data-grid-row]") as HTMLElement;
    const gutter = /(?:^|\s)md:gap-x-\[([\d.]+)%\]/.exec(row.className)?.[1];
    expect(Number(gutter)).toBe(GRID_GUTTER);
  });

  it("renders raw html verbatim and a placeholder for widgets", () => {
    const { container } = render(Grid, {
      props: {
        node: {
          kind: "stack",
          children: [
            { kind: "raw", html: "<div class='legacy'>kept</div>" },
            { kind: "widget", widget: { type: "map" } },
          ],
        },
      },
    });
    expect(container.querySelector(".legacy")?.textContent).toBe("kept");
    expect(container.querySelector("[data-widget='map']")).not.toBeNull();
  });

  it("mounts LocationMap for a widget:map when a map config is provided", () => {
    const { container } = render(Grid, {
      props: {
        node: {
          kind: "stack",
          children: [{ kind: "widget", widget: { type: "map" } }],
        },
        map: { mid: "M", layers: [], toggles: [], styles: [] },
      },
    });
    expect(container.querySelector("[data-map-placeholder]")).not.toBeNull();
    expect(container.querySelector("[data-widget='map']")).toBeNull();
  });

  it("clamps heading levels to the h1–h6 range", () => {
    const { container } = render(Grid, {
      props: {
        node: { kind: "heading", level: 9, html: "Deep" },
      },
    });
    expect(container.querySelector("h6")).not.toBeNull();
    expect(container.querySelector("h9")).toBeNull();
  });

  it("an _overlay stack renders its image and a caption card in a fixed-aspect box (feed tile)", () => {
    const { container } = render(Grid, {
      props: {
        node: {
          kind: "stack",
          style: {
            _overlay: "4:3",
            _overlayColor: "rgba(1,2,3,0.85)",
            _overlayValign: "top",
          },
          children: [
            {
              kind: "media",
              media: { kind: "image", url: "https://cdn/t.jpg" },
            },
            { kind: "heading", level: 6, html: "Suite", role: "text6" },
          ],
        },
      },
    });
    // The box reserves the crop aspect; the image and the caption sit inside it.
    const box = container.firstElementChild as HTMLElement;
    expect(box.getAttribute("style")).toContain("aspect-ratio: 4 / 3");
    expect(box.querySelector("img")?.getAttribute("src")).toBe(
      "https://cdn/t.jpg",
    );
    const panel = [...box.children].find((c) =>
      c.textContent?.includes("Suite"),
    ) as HTMLElement;
    expect(panel).toBeTruthy();
    expect(panel.getAttribute("style")?.replace(/\s/g, "")).toContain(
      "rgba(1,2,3,0.85)",
    );
  });

  it("a cropRatio media renders in a fixed-aspect box (feed tile)", () => {
    const { container } = render(Grid, {
      props: {
        node: {
          kind: "media",
          media: {
            kind: "image",
            url: "https://cdn/tile.jpg",
            cropRatio: "4:3",
          },
        },
      },
    });
    const img = container.querySelector("img") as HTMLElement;
    expect(img.getAttribute("src")).toBe("https://cdn/tile.jpg");
    // The wrapper reserves the crop aspect (4:3 → "4 / 3").
    const box = img.parentElement as HTMLElement;
    expect(box.getAttribute("style")).toContain("aspect-ratio: 4 / 3");
  });

  it("applies a text node's export style: inline color/padding, margin-right as a --node-mr var, never inline", () => {
    const { container } = render(Grid, {
      props: {
        node: {
          kind: "subtitle",
          text: "aside",
          role: "text5",
          style: {
            color: "rgb(255, 255, 255)",
            padding: "8px",
            "margin-right": "20%",
          },
        },
      },
    });
    const p = container.querySelector("p") as HTMLElement;
    expect(p.className).toContain("txt-role-text5");
    // color + padding apply inline at every width.
    expect(p.style.color).toBe("rgb(255, 255, 255)");
    expect(p.style.padding).toBe("8px");
    // margin-right rides a custom property, never an unconditional inline
    // margin-right that would leak onto mobile.
    expect(p.style.marginRight).toBe("");
    expect(p.style.getPropertyValue("--node-mr")).toBe("20%");
  });

  it("applies inline color to a styled heading", () => {
    const { container } = render(Grid, {
      props: {
        node: {
          kind: "heading",
          level: 2,
          html: "Bright",
          role: "text11",
          style: { color: "rgb(255, 255, 255)" },
        },
      },
    });
    const h2 = container.querySelector("h2") as HTMLElement;
    expect(h2.className).toContain("txt-role-text11");
    expect(h2.style.color).toBe("rgb(255, 255, 255)");
  });

  it("a text node with no style carries its role class and no inline style", () => {
    const { container } = render(Grid, {
      props: {
        node: { kind: "subtitle", text: "plain", role: "text5" },
      },
    });
    const p = container.querySelector("p") as HTMLElement;
    expect(p.className).toContain("txt-role-text5");
    expect(p.getAttribute("style")).toBeNull();
  });

  it("a cell with cols 'any' falls back to an auto basis", () => {
    const { container } = render(Grid, {
      props: {
        node: {
          kind: "row",
          cells: [
            { token: { cols: "any" }, node: { kind: "subtitle", text: "s" } },
          ],
        },
      },
    });
    const cell = container.querySelector("[data-grid-cell]") as HTMLElement;
    expect(cell.style.getPropertyValue("--cell-basis")).toBe("auto");
  });

  it("reserves the gutter per line (cols), not per cell, on a wrapping grid", () => {
    // Band 14 shape: 7 cells at cols=4 → 4 per line (25% each) → each cell
    // reserves 3/4 of the gutter.
    const cells = Array.from({ length: 7 }, () => ({
      token: { cols: 4 },
      node: { kind: "subtitle", text: "card" } as RenderNode,
    }));
    const { container } = render(Grid, {
      props: { node: { kind: "row", cells } },
    });
    const rendered = container.querySelectorAll("[data-grid-cell]");
    expect(rendered).toHaveLength(7);
    for (const c of rendered) {
      expect((c as HTMLElement).style.getPropertyValue("--cell-basis")).toBe(
        `calc(25% - ${(GRID_GUTTER * 3) / 4}%)`,
      );
    }
  });

  it("leaves a single-per-line (cols 1) stat stack at full-width, no gutter carved out", () => {
    const { container } = render(Grid, {
      props: {
        node: {
          kind: "row",
          cells: [
            {
              token: { cols: 1, spacing: 40 },
              node: { kind: "subtitle", text: "stat a" },
            },
            {
              token: { cols: 1, spacing: 40 },
              node: { kind: "subtitle", text: "stat b" },
            },
          ],
        },
      },
    });
    const cells = container.querySelectorAll("[data-grid-cell]");
    for (const c of cells) {
      expect((c as HTMLElement).style.getPropertyValue("--cell-basis")).toBe(
        "100%",
      );
    }
  });

  it("paints a row's card background from its style (a peeled .blocks0 fill)", () => {
    const { container } = render(Grid, {
      props: {
        node: {
          kind: "row",
          style: { "background-color": "rgb(255, 255, 255)" },
          cells: [
            { token: { cols: 1 }, node: { kind: "subtitle", text: "s" } },
          ],
        },
      },
    });
    const row = container.querySelector("[data-grid-row]") as HTMLElement;
    expect(row.style.backgroundColor).toBe("rgb(255, 255, 255)");
  });

  it("a row without a card style carries no inline background", () => {
    const { container } = render(Grid, {
      props: {
        node: {
          kind: "row",
          cells: [
            { token: { cols: 1 }, node: { kind: "subtitle", text: "s" } },
          ],
        },
      },
    });
    const row = container.querySelector("[data-grid-row]") as HTMLElement;
    expect(row.style.backgroundColor).toBe("");
  });

  it("paints a stack's card background from its style", () => {
    const { container } = render(Grid, {
      props: {
        node: {
          kind: "stack",
          style: { "background-color": "rgb(0, 0, 0)" },
          children: [{ kind: "subtitle", text: "y" }],
        },
      },
    });
    const stack = container.firstElementChild as HTMLElement;
    expect(stack.style.backgroundColor).toBe("rgb(0, 0, 0)");
  });

  it("a min-height + _valign stack keeps its box and its content", () => {
    // A nested block-in-cell (e.g. an 80vh gradient panel) pins its own box.
    const { container } = render(Grid, {
      props: {
        node: {
          kind: "stack",
          style: {
            "min-height": "80vh",
            background:
              "linear-gradient(45deg, rgb(82, 102, 126), rgb(175, 173, 168))",
            _valign: "middle",
          },
          children: [
            { kind: "heading", level: 1, html: "the tower", role: "text11" },
            { kind: "subtitle", text: "Stand above the rest", role: "text10" },
          ],
        },
      },
    });
    const outer = container.firstElementChild as HTMLElement;
    expect(outer.getAttribute("style")).toContain("min-height: 80vh");
    expect(outer.getAttribute("style")).toContain("linear-gradient");
    expect(outer.querySelector("h1")?.textContent).toBe("the tower");
  });

  it("a `_fill: column` stack keeps its paint and its content", () => {
    // A cagridFlexHeight cell's painted block.
    const { container } = render(Grid, {
      props: {
        node: {
          kind: "stack",
          style: {
            background: "linear-gradient(rgb(1, 1, 1), rgb(2, 2, 2))",
            padding: "80px 12%",
            _fill: "column",
          },
          children: [{ kind: "subtitle", text: "panel copy", role: "text5" }],
        },
      },
    });
    const outer = container.firstElementChild as HTMLElement;
    expect(outer.getAttribute("style")).toContain("linear-gradient");
    expect(outer.textContent).toContain("panel copy");
  });

  it("a min-height + _valign ROW keeps its min-height box", () => {
    // The producer attaches the min-height box to rows too (a nested block
    // whose content parses to a grid).
    const { container } = render(Grid, {
      props: {
        node: {
          kind: "row",
          style: { "min-height": "80vh", _valign: "middle" },
          cells: [
            { token: { cols: 1 }, node: { kind: "subtitle", text: "a" } },
          ],
        },
      },
    });
    const row = container.querySelector("[data-grid-row]") as HTMLElement;
    expect(row.getAttribute("style")).toContain("min-height: 80vh");
  });

  it("a panels row shows only the active toggle's cell; the rest stay mounted hidden", async () => {
    // The clickMap shape: stack[widget:map, panels row], toggles drive which
    // panel is visible. Clicking tab 2 hides panel 0 and reveals panel 1.
    const node: RenderNode = {
      kind: "stack",
      children: [
        { kind: "widget", widget: { type: "map" } },
        {
          kind: "row",
          panels: true,
          cells: [
            {
              token: { cols: 1 },
              node: { kind: "subtitle", text: "addresses" },
            },
            { token: { cols: 1 }, node: { kind: "subtitle", text: "logos" } },
          ],
        },
      ],
    };
    const map = {
      mid: "M",
      layers: [],
      toggles: [
        { label: "All", layers: [] },
        { label: "Offices", layers: [] },
      ],
      styles: [],
    };
    const { container, getByRole } = render(Grid, { props: { node, map } });
    const panelCells = () =>
      [...container.querySelectorAll("[data-panels] > [data-grid-cell]")].map(
        (c) => c.classList.contains("hidden"),
      );
    expect(panelCells()).toEqual([false, true]);
    await fireEvent.click(getByRole("button", { name: "Offices" }));
    expect(panelCells()).toEqual([true, false]);
  });

  it("a panels row without toggles renders its first cell (no crash, nothing hidden twice)", () => {
    const { container } = render(Grid, {
      props: {
        node: {
          kind: "row",
          panels: true,
          cells: [
            { token: { cols: 1 }, node: { kind: "subtitle", text: "only" } },
          ],
        },
      },
    });
    const cells = container.querySelectorAll(
      "[data-panels] > [data-grid-cell]",
    );
    expect(cells).toHaveLength(1);
    expect(cells[0]?.classList.contains("hidden")).toBe(false);
    expect(container.textContent).toContain("only");
  });
});
