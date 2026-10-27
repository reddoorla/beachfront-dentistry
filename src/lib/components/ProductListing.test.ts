import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/svelte";
import ProductListing from "./ProductListing.svelte";
import type { Product } from "$lib/blux/product-types";

afterEach(() => cleanup());

const mk = (slug: string, subCategory: string, image = true): Product => ({
  slug,
  title: slug.toUpperCase(),
  category: "Upholstered",
  subCategory,
  dimensions: "",
  tags: [],
  disabled: false,
  ...(image
    ? { image: { assetId: slug, url: `https://cdn/${slug}.jpg` } }
    : {}),
  gallery: [],
});

const products = [
  mk("aria", "Lounge"),
  mk("boca", "Lounge"),
  mk("dorset", "Sofa"),
];

describe("ProductListing", () => {
  it("renders the category heading and a tile per product linking to its detail", () => {
    const { getByRole, getAllByRole } = render(ProductListing, {
      category: "Upholstered",
      products,
    });
    expect(getByRole("heading", { level: 1 }).textContent).toContain(
      "Upholstered",
    );
    const hrefs = getAllByRole("link").map((l) => l.getAttribute("href"));
    for (const p of products) expect(hrefs).toContain(`/products/${p.slug}`);
  });

  it("gives each product exactly one link to its detail page", () => {
    const { getAllByRole } = render(ProductListing, {
      category: "Upholstered",
      products,
    });
    const hrefs = getAllByRole("link").map((l) => l.getAttribute("href"));
    for (const p of products) {
      expect(hrefs.filter((h) => h === `/products/${p.slug}`)).toHaveLength(1);
    }
  });

  it("keeps the catalog order of products within each sub-category", () => {
    const { container } = render(ProductListing, {
      category: "Upholstered",
      products,
    });
    for (const sub of ["Lounge", "Sofa"]) {
      const section = container.querySelector(`section#${sub.toLowerCase()}`);
      const hrefs = [...section!.querySelectorAll("a[href]")]
        .map((a) => a.getAttribute("href"))
        .filter((h, i, all) => all.indexOf(h) === i);
      const expected = products
        .filter((p) => p.subCategory === sub)
        .map((p) => `/products/${p.slug}`);
      expect(hrefs).toEqual(expected);
    }
  });

  it("groups by sub-category with an id anchor (back-link #<subcat> target)", () => {
    const { container, getAllByRole } = render(ProductListing, {
      category: "Upholstered",
      products,
    });
    // Two sub-category groups (Lounge, Sofa) → anchors #lounge and #sofa.
    expect(container.querySelector("section#lounge")).toBeTruthy();
    expect(container.querySelector("section#sofa")).toBeTruthy();
    const subHeadings = getAllByRole("heading", { level: 2 }).map(
      (h) => h.textContent,
    );
    expect(subHeadings).toEqual(["Lounge", "Sofa"]);
  });

  it("renders a tile image with the product title as alt", () => {
    const { getByAltText } = render(ProductListing, {
      category: "Upholstered",
      products: [mk("aria", "Lounge")],
    });
    expect((getByAltText("ARIA") as HTMLImageElement).getAttribute("src")).toBe(
      "https://cdn/aria.jpg",
    );
  });
});
