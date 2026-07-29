import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/svelte";
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
  it("renders exactly max_items question links, newest first, to /questions/<uid>", () => {
    const { getAllByRole } = render(QuestionList, {
      props: { slice: teaserSlice, context },
    });
    const links = getAllByRole("link");
    expect(links).toHaveLength(6);
    links.forEach((link, i) => {
      const [uid, , title] = expectedOrder[i]!;
      expect(link.getAttribute("href")).toBe(`/questions/${uid}`);
      expect(link.textContent?.trim()).toBe(title);
    });
  });

  it("renders the side image", () => {
    const { getByRole } = render(QuestionList, {
      props: { slice: teaserSlice, context },
    });
    const img = getByRole("img");
    expect(img.getAttribute("alt")).toBe("Dr. Smith");
  });

  it("marks each question link's list item as a qa-item (floatAlong's tracking target)", () => {
    const { container } = render(QuestionList, {
      props: { slice: teaserSlice, context },
    });
    expect(container.querySelectorAll(".qa-item")).toHaveLength(6);
  });
});

describe("QuestionList slice — numbered variation", () => {
  it('renders all 8 docs as numbered <details class="qa-item"> items, newest first', () => {
    const { container } = render(QuestionList, {
      props: { slice: numberedSlice, context },
    });
    const items = [...container.querySelectorAll("details.qa-item")];
    expect(items).toHaveLength(8);

    items.forEach((details, i) => {
      const [uid, , title, lead] = expectedOrder[i]!;
      const summary = details.querySelector("summary");
      expect(summary?.textContent).toContain(title);

      const number = String(i + 1).padStart(2, "0");
      expect(details.textContent).toContain(number);

      expect(details.textContent).toContain(lead);

      const link = details.querySelector(`a[href="/questions/${uid}"]`);
      expect(link?.textContent?.trim()).toBe("Read the full answer");
    });
  });

  it("does not truncate to a max — all 8 render even though teaser's max_items is 6", () => {
    const { container } = render(QuestionList, {
      props: { slice: numberedSlice, context },
    });
    expect(container.querySelectorAll("details.qa-item")).toHaveLength(8);
  });
});
