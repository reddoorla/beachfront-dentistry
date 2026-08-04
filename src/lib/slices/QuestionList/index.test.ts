import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup, fireEvent } from "@testing-library/svelte";
import QuestionList from "./index.svelte";

afterEach(() => cleanup());

// Eight stub news_article docs, deliberately NOT in date order — the loader
// (collections-load.ts) doesn't order results, so the slice must sort by
// date desc itself. Expressed as [uid, date, title, leadParagraph].
const rows: [string, string, string, string][] = [
  ["q-0", "2026-01-05", "Why do my gums bleed when I floss?", "Lead answer 0."],
  ["q-1", "2026-01-20", "Is teeth whitening safe?", "Lead answer 1."],
  ["q-2", "2026-01-12", "How often should I get a cleaning?", "Lead answer 2."],
  ["q-3", "2026-01-28", "What causes bad breath?", "Lead answer 3."],
  ["q-4", "2026-01-01", "Do I need a nightguard?", "Lead answer 4."],
  ["q-5", "2026-01-15", "Are dental x-rays safe?", "Lead answer 5."],
  ["q-6", "2026-01-25", "What is a root canal?", "Lead answer 6."],
  ["q-7", "2026-01-08", "How do veneers work?", "Lead answer 7."],
];

// Newest-first (date desc) — the order the slice must render docs in.
const expectedOrder = [...rows].sort((a, b) => b[1].localeCompare(a[1]));

const newsArticleDocs = rows.map(([uid, date, title, lead]) => ({
  uid,
  data: {
    title: [{ type: "heading1", text: title, spans: [] }],
    body: [
      { type: "paragraph", text: lead, spans: [] },
      {
        type: "paragraph",
        text: "More detail that isn't the lead paragraph.",
        spans: [],
      },
    ],
    date,
  },
}));

// Cast matches the slice fixtures' `as never` idiom: the stub docs' literal
// arrays don't satisfy RichTextField's non-empty tuple type.
const context = { collections: { news_article: newsArticleDocs } } as never;

const sideImage = {
  url: "https://img.example/doctor.jpg",
  alt: "Dr. Smith",
  dimensions: { width: 800, height: 1000 },
};

const teaserSlice = {
  slice_type: "question_list",
  variation: "teaser",
  primary: {
    heading: [{ type: "heading2", text: "Ask the Doctor", spans: [] }],
    side_image: sideImage,
    max_items: 6,
  },
} as never;

const numberedSlice = {
  slice_type: "question_list",
  variation: "numbered",
  primary: {
    heading: [{ type: "heading2", text: "All questions", spans: [] }],
  },
} as never;

describe("QuestionList slice — teaser variation", () => {
  it("renders exactly max_items question cards, newest first, each a disclosure whose Read More links /questions/<uid>, plus a View All link", () => {
    const { getAllByRole, getByRole } = render(QuestionList, {
      props: { slice: teaserSlice, context },
    });
    // Live's cards are click-to-expand disclosures, NOT links — only the
    // "Read More" inside each card's answer panel navigates. The title
    // renders as the card's h3 overlay and in the toggle's accessible name.
    const readMoreLinks = getAllByRole("link").filter((l) =>
      /^\/questions\/[^/]+$/.test(l.getAttribute("href") ?? ""),
    );
    expect(readMoreLinks).toHaveLength(6);
    readMoreLinks.forEach((link, i) => {
      const [uid] = expectedOrder[i]!;
      expect(link.getAttribute("href")).toBe(`/questions/${uid}`);
      expect(link.textContent).toContain("Read More");
    });
    const titles = getAllByRole("heading", { level: 3 }).map((h) =>
      h.textContent?.trim(),
    );
    // Only the first max_items (6) of the 8 fixture docs render.
    expectedOrder.slice(0, 6).forEach(([, , title]) => {
      expect(titles.some((t) => t?.includes(title))).toBe(true);
    });
    // The section closes with a "View All Questions" link to the index.
    expect(
      getByRole("link", { name: /View All Questions/i }).getAttribute("href"),
    ).toBe("/ask-the-doctor");
  });

  it("expands a card in place: toggle flips aria-expanded and un-inerts the answer panel", async () => {
    const { getAllByRole } = render(QuestionList, {
      props: { slice: teaserSlice, context },
    });
    const toggles = getAllByRole("button", { expanded: false });
    expect(toggles).toHaveLength(6);
    const panel = document.getElementById(
      toggles[0]!.getAttribute("aria-controls")!,
    )!;
    // Closed: the answer (excerpt + Read More) sits beyond the card's clip
    // edge and must be untabbable/inert until opened, like live's .qa-answer.
    // (Svelte applies `inert` as a DOM property, not an attribute.)
    expect((panel as HTMLElement).inert).toBe(true);
    await fireEvent.click(toggles[0]!);
    expect(toggles[0]!.getAttribute("aria-expanded")).toBe("true");
    expect((panel as HTMLElement).inert).toBe(false);
    // Open: the header bar rides up ABOVE the card box but stays VISIBLE
    // (live's .qa-label.active) — it remains the disclosure toggle, never
    // inert (no inert attribute is set on it at all).
    expect((toggles[0] as HTMLElement).inert).toBeFalsy();
  });

  it("the whole card is a click target (live .qa-block): clicking the box toggles, Escape closes", async () => {
    const { getAllByRole, container } = render(QuestionList, {
      props: { slice: teaserSlice, context },
    });
    const card = container.querySelector(".qa-item > div")! as HTMLElement;
    const toggle = getAllByRole("button", { expanded: false })[0]!;

    await fireEvent.click(card);
    expect(toggle.getAttribute("aria-expanded")).toBe("true");

    // A click that lands on the Read More link must NOT toggle the card
    // (only the link navigates, exactly like live).
    const readMore = card.querySelector("a")!;
    await fireEvent.click(readMore);
    expect(toggle.getAttribute("aria-expanded")).toBe("true");

    // Escape closes (keyboard path while the bar button is slid out/inert).
    await fireEvent.keyDown(card, { key: "Escape" });
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
  });

  it("renders the side image inside the aria-hidden floating pair", () => {
    // The headshot rides the handwriting+headshot anchor pair — pure
    // decoration on live (click-through), so the wrapper is aria-hidden and
    // the image is deliberately absent from the accessibility tree.
    const { container } = render(QuestionList, {
      props: { slice: teaserSlice, context },
    });
    const headshot = container.querySelector(".ask-the-doctor-headshot");
    expect(headshot).not.toBeNull();
    expect(headshot!.closest("[aria-hidden='true']")).not.toBeNull();
    expect(headshot!.querySelector("img")?.getAttribute("alt")).toBe(
      "Dr. Smith",
    );
  });

  it("marks each question link's list item as a qa-item (floatAlong's tracking target)", () => {
    const { container } = render(QuestionList, {
      props: { slice: teaserSlice, context },
    });
    expect(container.querySelectorAll(".qa-item")).toHaveLength(6);
  });
});

describe("QuestionList slice — numbered variation", () => {
  // The /ask-the-doctor index renders EVERY question as the same shared
  // QuestionCard (live's `.qa-block`) in a 2-column grid — NOT a <details>
  // accordion (the old treatment, which matched neither home nor live). Each
  // card carries its canonical date-sorted number and a Read More link.
  it("renders all 8 docs as the shared numbered question cards, newest first", () => {
    const { container } = render(QuestionList, {
      props: { slice: numberedSlice, context },
    });
    const cards = [...container.querySelectorAll(".qa-item")];
    expect(cards).toHaveLength(8);

    cards.forEach((card, i) => {
      const [uid, , title] = expectedOrder[i]!;
      // Title renders as the card's h3 overlay.
      expect(card.querySelector("h3")?.textContent).toContain(title);

      // Canonical number = 1-based position in the date-desc catalog.
      const number = String(i + 1).padStart(2, "0");
      expect(card.textContent).toContain(number);

      // "Read More" navigates to the detail route (the card itself is not a link).
      const link = card.querySelector(`a[href="/questions/${uid}"]`);
      expect(link?.textContent?.trim()).toBe("Read More");
    });
  });

  it("does not truncate to a max — all 8 render even though teaser's max_items is 6", () => {
    const { container } = render(QuestionList, {
      props: { slice: numberedSlice, context },
    });
    expect(container.querySelectorAll(".qa-item")).toHaveLength(8);
  });
});
