// The page assemblies in beachfront-pages.js are the SINGLE source of truth
// shared by two consumers: the local matching gate route (dev/match/[uid]) and
// scripts/seed-pages.mjs, which publishes them to Prismic.
//
// Those two consumers do NOT validate the same way. The gate route hands the
// object straight to the slice components, so any field the fixture sets is
// simply there. The Migration API validates against the slice models registered
// in Prismic and SILENTLY DROPS every field the model does not declare — no
// error, no warning, a 200.
//
// That asymmetry shipped three broken subpage heroes and a missing Read Reviews
// expander: the fixtures set `image_position`, `heading_style`, `hero_wash` and
// `layout`, none of which existed in the models, so the published documents fell
// back to component defaults and the real routes diverged 24-43% from the
// matched ones while every existing gate stayed green (the gates only ever ran
// against /dev/match/*, which reads the fixture directly).
//
// This test is the mechanical check. It fails the moment a fixture carries a
// field its slice model does not declare — before the seed runs, not after the
// content is published.
import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { assemblies, META, TITLES } from "./beachfront-pages.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const SLICES = join(HERE, "slices");

type Variation = { primary: string[]; items: string[] };

/** Every slice model in src/lib/slices, indexed by its Prismic slice id. */
function loadModels(): Record<string, Record<string, Variation>> {
  const out: Record<string, Record<string, Variation>> = {};
  for (const dir of readdirSync(SLICES)) {
    const file = join(SLICES, dir, "model.json");
    if (!existsSync(file)) continue;
    const model = JSON.parse(readFileSync(file, "utf8"));
    out[model.id] = Object.fromEntries(
      model.variations.map((v: Record<string, unknown>) => [
        v.id,
        {
          primary: Object.keys((v.primary as object) ?? {}),
          items: Object.keys((v.items as object) ?? {}),
        },
      ]),
    );
  }
  return out;
}

/** Image resolver stub — shape only; this test never reads image values. */
const stubImg = () => ({ url: "https://example.test/x.jpg" });

describe("beachfront-pages assemblies vs slice models", () => {
  const models = loadModels();
  const pages = assemblies(stubImg) as Record<
    string,
    Array<{
      slice_type: string;
      variation: string;
      primary?: Record<string, unknown>;
      items?: Array<Record<string, unknown>>;
    }>
  >;

  it("declares every slice type the assemblies use", () => {
    const missing = new Set<string>();
    for (const slices of Object.values(pages))
      for (const s of slices)
        if (!models[s.slice_type]) missing.add(s.slice_type);
    expect([...missing]).toEqual([]);
  });

  it("declares every variation the assemblies use", () => {
    const missing: string[] = [];
    for (const [uid, slices] of Object.entries(pages))
      for (const s of slices) {
        const model = models[s.slice_type];
        if (model && !model[s.variation])
          missing.push(`${uid}: ${s.slice_type}/${s.variation}`);
      }
    expect(missing).toEqual([]);
  });

  // The one that would have caught the shipped defect.
  it("declares every field the assemblies set, so Prismic strips nothing", () => {
    const stripped: string[] = [];
    for (const [uid, slices] of Object.entries(pages))
      for (const s of slices) {
        const variation = models[s.slice_type]?.[s.variation];
        if (!variation) continue;
        for (const key of Object.keys(s.primary ?? {}))
          if (!variation.primary.includes(key))
            stripped.push(
              `${uid} ${s.slice_type}/${s.variation} primary.${key}`,
            );
        const itemKeys = new Set(
          (s.items ?? []).flatMap((i) => Object.keys(i)),
        );
        for (const key of itemKeys)
          if (!variation.items.includes(key))
            stripped.push(`${uid} ${s.slice_type}/${s.variation} items.${key}`);
      }
    expect(stripped).toEqual([]);
  });

  // Live ships two `href="#"` buttons on /your-first-visit ("Registration
  // Form", "Download Forms") and the rebuild reproduced both. They render as
  // real, focusable, styled CTAs that do nothing when clicked — the worst kind
  // of dead link, because it looks like the affordance works. There is no
  // forms destination anywhere in the reference to point them at, so they were
  // removed (Tucker 2026-08-07: "remove both buttons"). This keeps them gone:
  // matching a defect is not a reason to ship one, and `href="#"` is never the
  // answer — a same-page target is a real id, and an unknown target is no link.
  it("wires no link to a dead '#' target", () => {
    const dead: string[] = [];
    const walk = (v: unknown, path: string): void => {
      if (Array.isArray(v))
        return v.forEach((x, i) => walk(x, `${path}[${i}]`));
      if (v && typeof v === "object") {
        const link = v as { link_type?: string; url?: string };
        if (link.link_type && link.url === "#") dead.push(path);
        return Object.entries(v).forEach(([k, x]) => walk(x, `${path}.${k}`));
      }
    };
    for (const [uid, slices] of Object.entries(pages))
      slices.forEach((s, i) =>
        walk(s, `${uid}#${i} ${s.slice_type}/${s.variation}`),
      );
    expect(dead).toEqual([]);
  });

  // The second half of the same asymmetry. Prismic's rich-text serializer turns
  // a `\n` inside a block into a <br> faithfully — but the Migration API strips
  // `\n` out of StructuredText on WRITE, so a fixture that hard-breaks a line
  // renders correctly on /dev/match/* and unbroken on the published route. That
  // shipped the closing CTA band 168px short on all five nav pages. Hard breaks
  // belong in the component (see CtaBand's DEFAULT_HEADING), never in seeded
  // content.
  it("sets no text the Prismic round trip would silently reflow", () => {
    const withBreaks: string[] = [];
    const walk = (v: unknown, path: string): void => {
      if (Array.isArray(v))
        return v.forEach((x, i) => walk(x, `${path}[${i}]`));
      if (v && typeof v === "object")
        return Object.entries(v).forEach(([k, x]) => walk(x, `${path}.${k}`));
      if (typeof v === "string" && v.includes("\n"))
        withBreaks.push(`${path}: ${JSON.stringify(v)}`);
    };
    for (const [uid, slices] of Object.entries(pages))
      slices.forEach((s, i) =>
        walk(s, `${uid}#${i} ${s.slice_type}/${s.variation}`),
      );
    expect(withBreaks).toEqual([]);
  });
});

// Meta descriptions are seeded content that NOTHING else can check: they are
// invisible on the page, so no pixel gate, style census or text-diff sees them,
// and live ships none at all, so there is no reference to compare against. A
// truncated, duplicated or missing one costs search traffic silently — for a
// single-location practice, the main way new patients arrive.
describe("page meta", () => {
  const uids = Object.keys(TITLES);

  it("gives every core page a description", () => {
    const missing = uids.filter((uid) => !META[uid]?.description);
    expect(missing).toEqual([]);
  });

  it("keeps each description inside Google's ~155-char snippet", () => {
    // Over the limit is not an error anywhere — it just gets cut mid-sentence
    // in the result, which reads as a broken listing.
    const tooLong = Object.entries(META)
      .filter(([, m]) => (m.description?.length ?? 0) > 155)
      .map(([uid, m]) => `${uid}: ${m.description.length}`);
    expect(tooLong).toEqual([]);
  });

  it("writes a real sentence, not a stub", () => {
    const tooShort = Object.entries(META)
      .filter(([, m]) => (m.description?.length ?? 0) < 70)
      .map(([uid, m]) => `${uid}: ${m.description?.length ?? 0}`);
    expect(tooShort).toEqual([]);
  });

  it("never repeats a description across pages", () => {
    // Duplicates are the classic failure: Search Console reports them, and the
    // pages compete with each other for the same snippet.
    const all = Object.values(META).map((m) => m.description);
    expect(new Set(all).size).toBe(all.length);
  });

  it("only overrides the title where the document name is uninformative", () => {
    // "Beachfront Dentistry | Home" is the one title whose second half says
    // nothing. The other four describe their page already and are left to match
    // live's Webflow titles exactly.
    const overridden = Object.entries(META)
      .filter(([, m]) => m.title)
      .map(([uid]) => uid);
    expect(overridden).toEqual(["home"]);
  });
});
