import { describe, it, expect } from "vitest";
import { GRID_GUTTER, cellWidth, gridCellBasis } from "./layout";

describe("blux-catalog layout math", () => {
  it("cellWidth: explicit width wins, else equal split by column count", () => {
    expect(cellWidth("70%", 2)).toBe("70%");
    expect(cellWidth(undefined, 2)).toBe("50%");
    expect(cellWidth(undefined, 3)).toBe("33.3333%");
    expect(cellWidth(undefined, 1)).toBe("100%");
  });

  it("gridCellBasis: reserves the gutter for a row of k columns", () => {
    expect(gridCellBasis(undefined, 2)).toBe(`calc(50% - ${GRID_GUTTER / 2}%)`);
    expect(gridCellBasis("70%", 2)).toBe(`calc(70% - ${GRID_GUTTER / 2}%)`);
    expect(gridCellBasis("30%", 2)).toBe(`calc(30% - ${GRID_GUTTER / 2}%)`);
    // Thirds: three cells and two gutters fill the row without overflowing it.
    const [, base, reserve] =
      /^calc\(([\d.]+)% - ([\d.]+)%\)$/.exec(gridCellBasis(undefined, 3)) ?? [];
    expect(base).toBe("33.3333");
    const line = 3 * (Number(base) - Number(reserve)) + 2 * GRID_GUTTER;
    expect(line).toBeLessThanOrEqual(100);
    expect(line).toBeGreaterThan(99.99);
    expect(gridCellBasis(undefined, 1)).toBe("100%");
  });
});
