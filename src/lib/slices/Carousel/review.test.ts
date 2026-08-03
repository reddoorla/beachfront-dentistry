import { describe, expect, it, afterEach } from "vitest";
import { render, fireEvent, cleanup } from "@testing-library/svelte";
import Carousel from "./index.svelte";

afterEach(() => cleanup());

// The review/photos variations ride the shared Slider component, whose
// arrows are labelled "Previous slide"/"Next slide" and whose track is the
// `.transition-transform` flex row.
const trackOf = (container: HTMLElement) =>
  container.querySelector(".transition-transform") as HTMLElement;

// The live site's 5 review links are MIXED — 3 Yelp + 2 Google Maps. Matching
// the live card, a Yelp-sourced review shows the Yelp badge; a Google (or other
// non-Yelp) review gets a neutral "Read review" link, so a Google review is
// never mislabelled as Yelp.
const reviewItems = [
  {
    quote: "The whole team made a routine cleaning feel easy.",
    reviewer_name: "Sarah M.",
    reviewer_place: "Redondo Beach, CA",
    reviewer_photo: {
      url: "https://img.example/sarah.jpg",
      alt: "Sarah M.",
      dimensions: { width: 400, height: 400 },
    },
    review_url: { link_type: "Web", url: "https://www.yelp.com/biz/review-1" },
  },
  {
    quote: "Best dental visit I've had — no anxiety at all.",
    reviewer_name: "James T.",
    reviewer_place: "Hermosa Beach, CA",
    reviewer_photo: {
      url: "https://img.example/james.jpg",
      alt: "James T.",
      dimensions: { width: 400, height: 400 },
    },
    review_url: {
      link_type: "Web",
      url: "https://www.google.com/maps/review-2",
    },
  },
  {
    quote: "Friendly staff and a spotless office.",
    reviewer_name: "Priya K.",
    reviewer_place: "Torrance, CA",
    reviewer_photo: {
      url: "https://img.example/priya.jpg",
      alt: "Priya K.",
      dimensions: { width: 400, height: 400 },
    },
    review_url: { link_type: "Web", url: "https://www.yelp.com/biz/review-3" },
  },
  {
    quote: "They worked with my schedule and explained everything.",
    reviewer_name: "Daniel O.",
    reviewer_place: "Manhattan Beach, CA",
    reviewer_photo: {
      url: "https://img.example/daniel.jpg",
      alt: "Daniel O.",
      dimensions: { width: 400, height: 400 },
    },
    review_url: {
      link_type: "Web",
      url: "https://www.google.com/maps/review-4",
    },
  },
  {
    quote: "Genuinely painless — I actually look forward to appointments now.",
    reviewer_name: "Maria L.",
    reviewer_place: "El Segundo, CA",
    reviewer_photo: {
      url: "https://img.example/maria.jpg",
      alt: "Maria L.",
      dimensions: { width: 400, height: 400 },
    },
    review_url: { link_type: "Web", url: "https://www.yelp.com/biz/review-5" },
  },
];

const makeReviewSlice = (overrides: Record<string, unknown> = {}) =>
  ({
    slice_type: "carousel",
    variation: "review",
    primary: {
      heading: [{ type: "heading2", text: "Reviews", spans: [] }],
    },
    items: reviewItems,
    ...overrides,
  }) as never;

const photoItems = [
  {
    image: {
      url: "https://img.example/office-1.jpg",
      alt: "Reception area",
      dimensions: { width: 1600, height: 1067 },
    },
  },
  {
    image: {
      url: "https://img.example/office-2.jpg",
      alt: "Treatment room",
      dimensions: { width: 1600, height: 1067 },
    },
  },
  {
    image: {
      url: "https://img.example/office-3.jpg",
      alt: "Waiting lounge",
      dimensions: { width: 1600, height: 1067 },
    },
  },
  {
    image: {
      url: "https://img.example/office-4.jpg",
      alt: "Front desk",
      dimensions: { width: 1600, height: 1067 },
    },
  },
];

const makePhotosSlice = (overrides: Record<string, unknown> = {}) =>
  ({
    slice_type: "carousel",
    variation: "photos",
    primary: { label: "Office tour" },
    items: photoItems,
    ...overrides,
  }) as never;

describe("Carousel slice — review variation", () => {
  it("renders a labelled carousel region with Previous/Next arrows", () => {
    const { getByRole } = render(Carousel, {
      props: { slice: makeReviewSlice() },
    });
    const region = getByRole("region");
    expect(region.getAttribute("aria-roledescription")).toBe("carousel");
    expect(getByRole("button", { name: "Previous slide" })).toBeTruthy();
    expect(getByRole("button", { name: "Next slide" })).toBeTruthy();
  });

  it("shows exactly one active quote at a time, with reviewer name and place", () => {
    const { getByText, getAllByRole } = render(Carousel, {
      props: { slice: makeReviewSlice() },
    });
    expect(
      getByText("The whole team made a routine cleaning feel easy."),
    ).toBeTruthy();
    expect(getByText("Sarah M.")).toBeTruthy();
    expect(getByText("Redondo Beach, CA")).toBeTruthy();

    const slides = getAllByRole("group", { hidden: true });
    expect(slides).toHaveLength(5);
    const visible = slides.filter(
      (s) => s.getAttribute("aria-hidden") !== "true",
    );
    expect(visible).toHaveLength(1);
    expect(visible[0]?.textContent).toContain("Sarah M.");
  });

  it("badges a Yelp-sourced review with the Yelp logo linking to that review", () => {
    const { getByRole } = render(Carousel, {
      props: { slice: makeReviewSlice() },
    });
    // item[0]'s review_url is a Yelp link → the live Yelp badge is shown.
    const link = getByRole("link", { name: "Read this review on Yelp" });
    expect(link.getAttribute("href")).toBe("https://www.yelp.com/biz/review-1");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noopener");
    const logo = link.querySelector("img");
    expect(logo?.getAttribute("src")).toContain("yelp-logo");
    expect(logo?.getAttribute("alt")).toBe("Yelp");
  });

  it("Next advances to the following reviewer and updates the track transform", async () => {
    const { getByRole, getByText, container } = render(Carousel, {
      props: { slice: makeReviewSlice() },
    });
    const track = trackOf(container);
    const initialTransform = track.style.transform;

    await fireEvent.click(getByRole("button", { name: "Next slide" }));

    expect(getByText("James T.")).toBeTruthy();
    expect(track.style.transform).not.toBe(initialTransform);
    // A Google-sourced review carries the Google badge (live ships Yelp on
    // every card; corrected per design direction), linking to its review.
    expect(
      getByRole("link", { name: "Read this review on Google" }).getAttribute(
        "href",
      ),
    ).toBe("https://www.google.com/maps/review-2");
  });

  it("Previous wraps back to the last reviewer from the first", async () => {
    const { getByRole, getAllByRole } = render(Carousel, {
      props: { slice: makeReviewSlice() },
    });
    await fireEvent.click(getByRole("button", { name: "Previous slide" }));
    const slides = getAllByRole("group", { hidden: true });
    const visible = slides.filter(
      (s) => s.getAttribute("aria-hidden") !== "true",
    );
    expect(visible).toHaveLength(1);
    expect(visible[0]?.textContent).toContain("Maria L.");
  });

  it("Next wraps forward from the last reviewer to the first", async () => {
    const { getByRole, getAllByRole } = render(Carousel, {
      props: { slice: makeReviewSlice() },
    });
    const next = getByRole("button", { name: "Next slide" });
    for (let n = 0; n < 5; n++) await fireEvent.click(next);
    const slides = getAllByRole("group", { hidden: true });
    const visible = slides.filter(
      (s) => s.getAttribute("aria-hidden") !== "true",
    );
    expect(visible).toHaveLength(1);
    expect(visible[0]?.textContent).toContain("Sarah M.");
  });

  it("renders no arrows for a single review", () => {
    const { queryByRole, getByText } = render(Carousel, {
      props: { slice: makeReviewSlice({ items: [reviewItems[0]] }) },
    });
    expect(getByText("Sarah M.")).toBeTruthy();
    expect(queryByRole("button", { name: "Previous slide" })).toBeNull();
    expect(queryByRole("button", { name: "Next slide" })).toBeNull();
  });
});

describe("Carousel slice — photos variation", () => {
  it("renders images with alt text and Previous/Next arrows", () => {
    const { getAllByRole, getByRole } = render(Carousel, {
      props: { slice: makePhotosSlice() },
    });
    const images = getAllByRole("img", { hidden: true });
    expect(images).toHaveLength(4);
    expect(images[0]?.getAttribute("alt")).toBe("Reception area");
    expect(getByRole("button", { name: "Previous slide" })).toBeTruthy();
    expect(getByRole("button", { name: "Next slide" })).toBeTruthy();
  });

  it("uses the editable accessible label on the carousel region", () => {
    const { getByRole } = render(Carousel, {
      props: { slice: makePhotosSlice() },
    });
    expect(getByRole("region").getAttribute("aria-label")).toBe("Office tour");
  });

  it("Next advances the active photo", async () => {
    const { getByRole, getAllByRole } = render(Carousel, {
      props: { slice: makePhotosSlice() },
    });
    await fireEvent.click(getByRole("button", { name: "Next slide" }));
    const slides = getAllByRole("group", { hidden: true });
    const visible = slides.filter(
      (s) => s.getAttribute("aria-hidden") !== "true",
    );
    expect(visible).toHaveLength(1);
    expect(visible[0]?.querySelector("img")?.getAttribute("alt")).toBe(
      "Treatment room",
    );
  });
});
