import { describe, expect, it, afterEach } from "vitest";
import { render, fireEvent, cleanup } from "@testing-library/svelte";
import Carousel from "./index.svelte";

afterEach(() => cleanup());

// The photos variation rides the shared Slider component. The review
// variation carries its own mask carousel since Round G4 (MarkUp thread
// 29e4fcac-8dee-4cfe-a3f5-4ef9e4c79524, home board pin #5): the pale-blue
// card is static chrome, the `.transition-transform` flex row slides the
// quote/author content INSIDE the card's overflow-hidden mask, and the
// overlapping source badge cross-dissolves instead of riding the track.
// Arrows are labelled "Previous slide"/"Next slide" in both worlds.
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

describe("Carousel slice — review mask motion (Round G4)", () => {
  // MarkUp thread 29e4fcac-8dee-4cfe-a3f5-4ef9e4c79524 (home board pin #5),
  // implemented per operator directive: the pale-blue card is static chrome
  // acting as the mask — the track slides the quote content INSIDE it, and
  // the badge cross-dissolves on the card instead of riding the track. The
  // reduced-motion instant swap is covered end-to-end in
  // tests/interaction/review-mask.spec.ts (jsdom applies no CSS media
  // rules, so app.css's global reduce reset is not observable here).

  it("keeps the pale-blue card outside the moving track — the card is the mask", async () => {
    const { container, getByRole } = render(Carousel, {
      props: { slice: makeReviewSlice() },
    });
    const track = trackOf(container);
    const mask = track.parentElement as HTMLElement;
    const card = mask.parentElement as HTMLElement;
    // The track lives INSIDE the pale-blue card, behind a mask that clips
    // at the card's own box…
    expect(mask.className).toContain("overflow-hidden");
    expect(card.className).toContain("bg-[#e7f5fa]");
    // …each slide keeps its semantic figure/figcaption pairing inside the
    // track…
    expect(track.querySelectorAll("figure > figcaption")).toHaveLength(5);
    // …and stepping moves ONLY the track: the card itself carries no
    // transform and no transition-transform utility.
    await fireEvent.click(getByRole("button", { name: "Next slide" }));
    expect(track.style.transform).toBe("translateX(-100%)");
    expect(card.style.transform).toBe("");
    expect(card.className).not.toContain("transition-transform");
  });

  it("stacks the badges on the card, outside the track, dissolving between them", async () => {
    const { container, getByRole } = render(Carousel, {
      props: { slice: makeReviewSlice() },
    });
    const track = trackOf(container);
    const badges = [
      ...container.querySelectorAll<HTMLElement>(
        'a[aria-label^="Read this review on"]',
      ),
    ];
    const wrapperOf = (a: HTMLElement) => a.parentElement as HTMLElement;
    const exposedOf = () =>
      badges.filter((a) => wrapperOf(a).getAttribute("aria-hidden") !== "true");
    // Every slide's badge is mounted on the card layer, none in the track,
    // and each rides an opacity-only dissolve wrapper — never a translating
    // one.
    expect(badges).toHaveLength(5);
    for (const a of badges) {
      expect(track.contains(a)).toBe(false);
      expect(wrapperOf(a).className).toContain("transition-opacity");
      expect(wrapperOf(a).className).not.toContain("transition-transform");
    }
    // At rest only slide 1's Yelp badge is exposed; the dissolve targets are
    // opacity-0, click-through, and inert (jsdom reflects inert as the DOM
    // property — same caveat as Slider.test.ts).
    let exposed = exposedOf();
    expect(exposed).toHaveLength(1);
    expect(exposed[0]?.getAttribute("href")).toBe(
      "https://www.yelp.com/biz/review-1",
    );
    for (const a of badges.filter((b) => b !== exposed[0])) {
      const w = wrapperOf(a);
      expect(w.className).toContain("opacity-0");
      expect(w.className).toContain("pointer-events-none");
      expect(w.inert).toBe(true);
    }
    // Advancing exposes the next slide's badge (Google here) in place.
    await fireEvent.click(getByRole("button", { name: "Next slide" }));
    exposed = exposedOf();
    expect(exposed).toHaveLength(1);
    expect(exposed[0]?.getAttribute("href")).toBe(
      "https://www.google.com/maps/review-2",
    );
  });

  it("ArrowLeft on a focused arrow wraps back to the last reviewer", async () => {
    const { getByRole, getAllByRole } = render(Carousel, {
      props: { slice: makeReviewSlice() },
    });
    await fireEvent.keyDown(getByRole("button", { name: "Next slide" }), {
      key: "ArrowLeft",
    });
    const visible = getAllByRole("group", { hidden: true }).filter(
      (s) => s.getAttribute("aria-hidden") !== "true",
    );
    expect(visible).toHaveLength(1);
    expect(visible[0]?.textContent).toContain("Maria L.");
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
