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
import { assemblies } from "./beachfront-pages.js";

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
});
