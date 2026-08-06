# Morning brief — overnight matching run (2026-08-04 → 08-05)

Branch `feat/detail-templates-and-footer`, 4 commits, pushed. Everything below
is measured; every number is reproducible from `matching/out-*/report.json`.

Gate = `bash matching/gate.sh <tag>` (9 pages × 1440/834/390, threshold 0.10,
**no masks**), summarised with `node matching/summarize.mjs <tag> [prev-tag]`.

---

## Read this first — the three things worth your attention

### 1. A gate-surface bug was hiding real defects (fixed)
`/dev/match/<uid>` renders the page assemblies with **live's own image URLs**,
but `img-src` in `svelte.config.js` never allowed `cdn.prod.website-files.com`.
Every subpage hero photo was CSP-blocked, so the gate was diffing a **black
band** against live's photograph. That is what the 49–76% `top` regions on
our-team / services / ask-the-doctor actually were.

Allowed **in dev only** (`NODE_ENV !== "production"`); production serves
Prismic-hosted copies so it cannot ship. Worth a glance since it touches
`svelte.config.js`: commit `cc4d8d8`.

### 2. The systemic cause of the whole tablet band being wrong
Live's inline `<style>` steps the **root font-size** at `max-width` 992/768/480,
while its Webflow **class** rules break at 991/767/479. So live has only three
root values — 40px ≥993, 32px 769–992, 24px ≤768 — and the two ladders disagree
by 1px at 768 and 992.

Consequence: anything calibrated by measuring live at **exactly 768** picks up
root 24, but the band it governs (769–991) runs at root 32, so the value is 3/4
of live's. That single mistake explains most of the 480–991 damage across the
site.

**Rule now recorded in the ledger: calibrate md at 834, never at 768; calibrate
lg at 1200/1440, never at 992.** The detail-page work from the earlier session
was calibrated at 834 and is correct.

### 3. One thing I did NOT fix, deliberately
**ask-the-doctor's 40-card grid** sits at 78–81% *even with `--mask-photos`*,
while its geometry matches live exactly (349×320 cards, 2 columns, 40 cards in
the right order, Δh ~2%). So it is a large-area **colour** delta (dE 34), not
layout. I could not establish the cause with confidence at the end of the run
and chose to flag it rather than guess at a fix that might be wrong. It is a
single well-scoped item — see "Open items" below.

---

## What the gates say

`node matching/summarize.mjs final base` — 9 pages × 1440/834/390, threshold
0.10, **no masks, nothing hidden**:

| page | baseline | final |
|---|---|---|
| home | 9/27 | **17/27** |
| our-team | 6/15 | **10/15** |
| contact-us | 5/12 | **9/12** |
| services | 1/15 | **4/15** |
| ask-the-doctor | *gate hard-failed* | **7/15** |
| your-first-visit | 2/24 | **5/24** |
| team-member detail | 10/15 | **12/15** |
| service detail | 9/15 | 9/15 |
| question detail | 10/15 | 10/15 |
| **TOTAL** | **52/138** | **83/153** |

(The region count grew because ask-the-doctor can now be gated at all, and the
Back-to-Top pill adds a region.)

Standouts, all measured at the same threshold with no masks:
- our-team `top` **58.7 → 17.8%** @1440, **76.3 → 18.9%** @834, **69.8 → 20.5%** @390
- `Ready for great dental health` **30.1 → 0.6%** @1440 — and it now passes on
  every page; it had been failing at 22–40% across all six nav pages
- our-team person card @834 **31.6 → 2.5%** (Δh 73.8% → 0)
- ask-the-doctor `Back to Top` **0.0–2.8%** (new element)

### 8 residual regressions vs baseline — all small, all disclosed
`home` Your Path / Serving @834, `yfv` Dr. Robert Quan @1440 and "To be a long
term health partner" @834/@390, `services` General Dentistry @1440/@390,
`contact` Book Appointment @834. These are knock-on shifts from the shared
wave/CTA changes landing on sections whose own geometry is still wrong (those
pages each have 9–15 open findings). They are 1–15 percentage points on regions
that were already failing — none flipped a passing region to failing.

---

## Decisions I made under the "decide, document, brief me" latitude

Each is in `matching/LEDGER.md` with its evidence. Overturn any of them freely.

1. **Dev-only CSP allowance** for live's image CDN (above). The alternative was
   leaving four pages unmeasurable.
2. **Hard line breaks in the closing-CTA heading.** Live hard-codes
   `Ready for <br/>great dental <br/>health?` so the heading is three lines at
   every width, which is why its h2 can span the full band. I authored the same
   breaks into all three places that define that heading. This is *content*, so
   it will ship to Prismic on your next seed run — flagging it explicitly.
   (Live keeps a trailing **space** before each `<br>`; without it the collapsed
   text becomes "Ready forgreat dental" and every gate anchor on that heading
   stops resolving. The harness's unresolved-anchor hard-fail caught this.)
3. **Kept the `--mask-photos` runs as diagnostics only.** The headline numbers
   above are all unmasked, so nothing is hidden.

## Still open (ranked by value, all diagnosed and evidence-backed)

The 6-page fan-out produced **133 verified findings**; I worked the highest-
leverage shared ones. The remainder are in `/tmp/findings.json` (regenerate any
time — see the workflow script under the session's `workflows/scripts/`), grouped
by file so they can be worked file-by-file:

| file | findings | pages affected |
|---|---|---|
| `slices/ServiceCategoryBand/index.svelte` | 15 (1 blocker) | services |
| `slices/Carousel/index.svelte` | 11 (2 blockers) | your-first-visit, home |
| `routes/contact-us/+page.svelte` | 10 (1 blocker) | contact-us |
| `slices/SectionGrid/index.svelte` | 9 (2 blockers) | home |
| `slices/ExamTimeline/index.svelte` | 5 (1 blocker) | your-first-visit |
| `slices/FirstVisitToc/index.svelte` | 6 | your-first-visit |
| `slices/Hero/index.svelte` | 5 | your-first-visit, home |

**your-first-visit is the worst page** and needs the most build work — its
Office Tour slider, Meet-Our-Team card slider and First-Exam timeline are all
structurally different from live, not just mis-sized.

### Prismic-blocked (need your publish or a curated pin)
Per your "curate in beachfront-pages.js + flag" call — I have **not** hardcoded
any of these yet, because each is authored content that belongs in the CMS and I
would rather you see the list first:

- **person.teaser** — live shows a short *authored* teaser per person (77–101
  chars, hand-cut). We render the full bio CSS-clamped, so all 11 cards differ.
  No derivation from `body` reproduces live's cut points.
- **news_article.summary** — 34 of 40 Q&A card teasers differ; same reason.
- **collection_item** — three service link labels differ from live's copy, and
  the link order inside each panel needs a sort key.

---

## Housekeeping

- `matching/gate.sh` is now the canonical gate (3 viewports, per-census anchors,
  footer split into its own region). `matching/summarize.mjs <tag> [prev]` prints
  pass/fail per page and flags regressions against a previous round.
- Verification at every commit: 656/656 unit, 8/8 playwright, svelte-check 0
  errors, prettier + eslint clean.
- Live's `index.html` sha256 re-checked at the end of the run — **unchanged**, so
  the reference did not move underneath this work.
- Two harness lessons recorded in the ledger: never run `npm test` concurrently
  with a gate sweep (it starved a capture and produced a false 30.1%), and a
  low mismatch on a sparse text region proves nothing — read the diff image.
