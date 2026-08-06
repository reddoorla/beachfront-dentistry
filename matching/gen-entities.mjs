// Generate src/lib/beachfront-entities.js from the live capture, so the
// authored strings are transcribed by machine and never by hand.
import { readFileSync, writeFileSync } from "node:fs";

const L = JSON.parse(readFileSync("matching/content-capture2.json", "utf8"));
const norm = (s) => (s ?? "").replace(/\s+/g, " ").trim();
const q = (s) => JSON.stringify(s);

// ---- person ------------------------------------------------------------
const people = L.people.map((p, i) => ({
  uid: p.uid,
  teaser: norm(p.teaser),
  order: i + 1,
}));

// ---- news_article ------------------------------------------------------
const summaryOf = (card) => {
  const row = card.all.find((a) => /text-color-white/.test(a.cls));
  return row ? norm(row.text) : null;
};
const homeRank = new Map(L.home.map((h, i) => [h.uid, i + 1]));
const articles = L.questions.map((c) => ({
  uid: c.uid,
  summary: summaryOf(c),
  home_order: homeRank.get(c.uid) ?? null,
}));
const missing = articles.filter((a) => !a.summary);
if (missing.length)
  throw new Error(
    `no summary captured for: ${missing.map((m) => m.uid).join(", ")}`,
  );

// ---- collection_item ---------------------------------------------------
const items = L.servicePanels.flatMap((panel) =>
  panel.links.map((l, i) => ({
    uid: l.uid,
    link_label: norm(l.text),
    order: i + 1,
    panel: panel.heading,
  })),
);

const src = `// Authored entity content captured VERBATIM off beachfrontdentistry.com
// (matching/probe-content-capture2.mjs, ${new Date().toISOString().slice(0, 10)}), machine-transcribed —
// no value here was typed or derived by hand.
//
// These are the four fields the Webflow import never brought across. They are
// real CMS content, so they are MODELLED on the custom types (person.teaser /
// person.order, news_article.summary / news_article.home_order,
// collection_item.link_label / collection_item.order) and the templates read
// them from the document. This file is the migration PAYLOAD — the one source
// of truth shared by:
//   • scripts/seed-entity-content.mjs — writes them into the Prismic Migration
//     release, so production serves them from the CMS after publish.
//   • src/routes/dev/match/[uid] — patches the same values onto the fetched
//     docs so the matching gates measure the post-publish render today.
// Once the release is published the dev patch is a no-op (it only fills fields
// that arrive empty) and can be deleted.
//
// Each entry is literally the field patch for that document, keyed by uid.

/** /our-team + the your-first-visit slider card teaser, and live's editorial
 *  roster order (the two doctors first, then staff in a hand-set sequence).
 *  The teaser is NOT derivable from \`body\`: 9 of 11 are a prefix of the bio
 *  but every cut point is different, and 2 do not match the bio at all. */
export const PERSON_CONTENT = {
${people.map((p) => `  ${q(p.uid)}: {\n    teaser: ${q(p.teaser)},\n    order: ${p.order},\n  },`).join("\n")}
};

/** Ask-the-Doctor card summary, plus the home page's featured-question row.
 *  \`home_order\` is filled on exactly the 6 questions live features on the
 *  home page (1 = the un-numbered hero card); null everywhere else. The card
 *  NUMBER is not stored — it is the doc's 1-based position in the date-sorted
 *  catalog, which reproduces live's 01-40 exactly (verified all 40).
 *  18 of the 40 summaries are not a prefix of \`body\`, so they are authored. */
export const NEWS_ARTICLE_CONTENT = {
${articles.map((a) => `  ${q(a.uid)}: {\n    summary: ${q(a.summary)},${a.home_order ? `\n    home_order: ${a.home_order},` : ""}\n  },`).join("\n")}
};

/** The /services category panels. \`link_label\` is a SEPARATE authored label
 *  from \`title\`: live's panel prints "dental veneers" while the detail page
 *  h2 prints "Dental Veneers" (both verified with text-transform:none), and
 *  three labels differ outright ("oral cancer screening", "Mi paste / Mi Paste
 *  plus", "Nitrous oxide (n2O)"). \`order\` is the position within the panel —
 *  Prismic's default document order matches live in none of the 4 panels. */
export const COLLECTION_ITEM_CONTENT = {
${items.map((it) => `  // ${it.panel}\n  ${q(it.uid)}: {\n    link_label: ${q(it.link_label)},\n    order: ${it.order},\n  },`).join("\n")}
};
`;

writeFileSync("src/lib/beachfront-entities.js", src, "utf8");
console.log(
  `people=${people.length} articles=${articles.length} (featured ${homeRank.size}) items=${items.length}`,
);
