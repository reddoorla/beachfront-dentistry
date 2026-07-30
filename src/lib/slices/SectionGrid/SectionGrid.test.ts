import { render, fireEvent } from "@testing-library/svelte";
import { describe, it, expect } from "vitest";
import type { Content } from "@prismicio/client";
import SectionGrid from "./index.svelte";

const slice = {
  slice_type: "section_grid",
  variation: "default",
  primary: {
    heading: [{ type: "heading2", text: "Features", spans: [] }],
    columns: 3,
  },
  items: [
    {
      item_heading: [{ type: "heading3", text: "Pool", spans: [] }],
      item_body: [{ type: "paragraph", text: "Heated.", spans: [] }],
      item_media: {
        url: "https://img.example/a.jpg",
        alt: "Pool",
        dimensions: { width: 800, height: 600 },
      },
      item_link: { link_type: "Any" },
    },
    {
      item_heading: [{ type: "heading3", text: "Gym", spans: [] }],
      item_body: [{ type: "paragraph", text: "24/7.", spans: [] }],
      item_media: {
        url: "https://img.example/b.jpg",
        alt: "Gym",
        dimensions: { width: 800, height: 600 },
      },
      item_link: { link_type: "Any" },
    },
  ],
} as unknown as Content.SectionGridSlice;

describe("SectionGrid slice", () => {
  it("renders each item with body copy as a collapsed disclosure card", () => {
    const { getByRole, getAllByRole } = render(SectionGrid, {
      props: { slice },
    });
    expect(getByRole("heading", { level: 2 }).textContent).toContain(
      "Features",
    );
    // cards mode: item_heading becomes a label on a "+" disclosure button,
    // one per item, all collapsed on first render.
    const toggles = getAllByRole("button", { expanded: false });
    expect(toggles).toHaveLength(2);
    expect(toggles.map((b) => b.textContent?.trim())).toEqual(["Pool", "Gym"]);
  });

  it("expands a card's body copy when its toggle is clicked", async () => {
    const { getAllByRole, queryByText, getByText } = render(SectionGrid, {
      props: { slice },
    });
    expect(queryByText("Heated.")).toBeNull();
    await fireEvent.click(getAllByRole("button")[0]);
    expect(getByText("Heated.")).not.toBeNull();
  });

  it("reflects the column count on the grid container", () => {
    const { container } = render(SectionGrid, { props: { slice } });
    const grid = container.querySelector("[data-grid-columns='3']");
    expect(grid).not.toBeNull();
  });

  it("renders the steps layout with numbered steps, subtitle and CTA", () => {
    const stepsSlice = {
      slice_type: "section_grid",
      variation: "default",
      primary: {
        layout: "steps",
        heading: [{ type: "heading2", text: "Your Path", spans: [] }],
        subtitle: "is like a short walk on the beach",
        cta_label: "Book an Appointment",
        cta_link: { link_type: "Web", url: "#appointment" },
      },
      items: [
        { item_heading: [{ type: "heading4", text: "Book", spans: [] }] },
        { item_heading: [{ type: "heading4", text: "Exam", spans: [] }] },
      ],
    } as unknown as Content.SectionGridSlice;
    const { getByText, getByRole } = render(SectionGrid, {
      props: { slice: stepsSlice },
    });
    expect(getByText("Step 01")).not.toBeNull();
    expect(getByText("Step 02")).not.toBeNull();
    expect(getByText("is like a short walk on the beach")).not.toBeNull();
    expect(getByRole("link", { name: "Book an Appointment" })).not.toBeNull();
  });

  it("renders the services layout as a gradient band with an eyebrow and body", () => {
    const servicesSlice = {
      slice_type: "section_grid",
      variation: "default",
      primary: {
        layout: "services",
        heading: [{ type: "heading2", text: "Services", spans: [] }],
        body: [
          { type: "paragraph", text: "Great pride in our smile.", spans: [] },
        ],
        cta_label: "View All Services",
        cta_link: { link_type: "Web", url: "/services" },
      },
      items: [
        {
          item_heading: [
            { type: "heading4", text: "Cosmetic Dentistry", spans: [] },
          ],
        },
      ],
    } as unknown as Content.SectionGridSlice;
    const { container, getByText } = render(SectionGrid, {
      props: { slice: servicesSlice },
    });
    expect(
      container.querySelector('[data-section-layout="services"]'),
    ).not.toBeNull();
    expect(getByText("Great pride in our smile.")).not.toBeNull();
    expect(getByText("Cosmetic Dentistry")).not.toBeNull();
  });
});
