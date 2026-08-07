# Remaining subpage specs (from live probes 2026-08-04) — feat/match-remaining-pages

Committed so far: 9e0c2dd QuestionCard · cb3fd61 gate harness · 438b731 SubpageHero+ask-the-doctor · 6ecdc69 services grid.
Gate cmd: `node ~/.claude/skills/matching-a-page/page-diff.mjs --ref https://www.beachfrontdentistry.com/<uid> --cand http://localhost:5190/dev/match/<uid> --viewports 1440,390 --threshold 0.10 --neutralize-media --sections "A,B" --out matching/out-<uid>` (dev server :5190; sandbox-disabled). Residual mm = photo/CSP floors; gate on Δh + text + structure. Assemblies live in `src/lib/beachfront-pages.js`; SubpageHero at `src/lib/components/SubpageHero.svelte`; breakpoints lg=992 md=768 xs=480; global `main h1–h3` = primary colour (force white inline when needed).

## NEXT: gate services (6ecdc69, not yet gated)

Anchors e.g. "Cosmetic Dentistry","Ready for great dental health". Check card 600×640/312×408, panel gradient, link split 4+0/5+4, tooth position, we-offer intro centered cyan. Card link white-on-cyan is <AA (dark-gradient-up helps) — note for Tucker.

## our-team

Order: hero.redondo("Meet") → subtitle-section("Our"/"Team" + intro) → team-grid → footer(CTA).

- HERO: `.hero.redondo` 475/371, redondo-beach bg, wave. "Meet" = h2 museo-slab wt100 140/168 (56/70) WHITE center, in-band.
- SUBTITLE SECTION (below band): "Our" + "Team" two stacked h2 museo-slab wt100 140/168 (56/70) DARK-TEAL #365B6D center; then intro h3 museo-slab wt300 40/50 (20/30) CYAN #129ECC center = "We love caring for our patients and we also love the beach, read a little about each of our team members and see their favorite beach beyond the South Bay."
  → Extend SubpageHero with optional stacked sub-headings (#365B6D) + cyan intro below the band, OR a small sibling section. Assembly: our-team currently lead_text+collection_list/grid+cta → replace lead_text with hero/subpage("Meet",redondo) carrying the stacked "Our"/"Team" + intro.
- PERSON GRID (CollectionList `grid`): container `.w-dyn-items.w-row` FLEX-WRAP, `.w-col-4` → 3-up @1440 / 1-up @390, width 1280 (80px gutters). Card `.team-list-item`: bg #E7F5FA, radius 20, 320×480 / 303×384. Top→bottom: circular headshot 200×200/120×120 (radius-full, object-cover, overlaps ~100px ABOVE card top) · name h5 museo-slab wt300 30/40 cyan #129ECC center · role h6 museo-sans wt300 16/25 #365B6D uppercase center ls1.28 · bio teaser p museo-sans wt300 16/24 #365B6D left truncated "…" · "read more" a cyan #129ECC + Arrow.svg · favorite-beach img full-width banner 320×144/303×115 at card BOTTOM + overlaid caption h6 museo-slab wt300 24/30 (12/15) WHITE uppercase left ls1.28.
  ⚠ DATA CHECK: person docs need bio + favorite-beach image + beach caption fields. Verify via loadCollections/person doc shape before building the full card; if absent, build headshot+name+role card + document bio/beach as a Prismic data gap (curated-by-uid like the other pinned data, or a seed field).

## your-first-visit (most divergent)

Live order + VERBATIM headings: hero.group-photo H1 "We are excited to meet and care for you." → **fv-toc-section** (3 numbered cards, H3s "Take a Virtual Tour" / "Meet Our Team" / "First Exam Details" + buttons "Book an Apointment"[sic]/"Registration Form") [CANDIDATE MISSING] → Office Tour H1 "Office Tour" → Meet Our Team H2 "Meet Our Team" → First Exam H3 "First Exam" → review H1 "Serving the South Bay for over 40 years" → footer CTA.

- HERO = `.hero.group-photo` (NOT full-bleed 80vh, NOT subpage 33vw): height 540/371 (60vh cap 60vw desktop / 95vw ≤479), bg group photo (heroFirstVisit), H1 museo-slab wt300 60px LEFT lower-left, **NO CTA button**. Candidate uses hero/default (810 tall, has CTA) — wrong. Needs a group-photo hero treatment.
- OFFICE TOUR: live = full-bleed single-image Webflow `w-slider` (8 slides, 2 arrows + **8 dots**, one image/view full 100vw, 4:3 =1440×1080/390×293, NO captions). Candidate = multi-up strip. → Carousel `photos` needs a single-image full-bleed slider mode with dots.
- FIRST EXAM: live = WIDE (max-w 1400) LEFT prose: one lead bold "We ask for 2 hours of your time." then **8 descriptive paragraphs** (registration→check-in→photos/x-rays→exam→cleaning→doctor review→scheduling), **NO "N min —" timed labels, no list**. p 20/30 (16) wt300; strong wt700 #365B6D. Candidate = narrow 768 CENTER timed-"N min —" list → REWRITE the rich_text content in beachfront-pages.js (need verbatim live paragraphs — re-probe copy) + render wide/left.
- teamTeaser heading "Meet Your Team" → live yfv says "Meet Our Team" (home stays "Meet Your Team"); parametrize teamTeaser(heading).

## contact-us (dedicated route src/routes/contact-us — MINE; DECISION taken: match live, keep form reachable via the global appointment modal, NO body form)

Live order: hero.contact("Contact Us") → info-section → footer CTA. Modal `.form-modal` H3 "Request Appointment" (off-canvas).

- HERO `.hero.contact` 475/371, office bg `…64b82f76…_BD_office_2020_IMG_2869.jpg`, "Contact Us" h2 museo-slab wt100 140/168 (50/70) WHITE **LEFT-aligned** (subpage hero but left, not center).
- INFO band (`.info-section`): single left column, content x=80: a "Book Appointment" button (`.show-form`, opens modal) THEN two side-by-side blocks — **CONTACT**: `(310) 378-9241` · `1706 S Elena Ave. Suite B` · `Redondo Beach, CA 90277` (tel:310-378-9241). **OFFICE HOURS**: `Monday - Thursday / 7am - 5pm` · `Friday / 7am - 2pm` · `Saturday - Sunday / Closed`. Headers museo-slab 20/40 wt500 teal; rows museo-sans 20/40 wt300 teal. Then an embedded **Google Map** (JS API div.gm-style, NOT iframe) 512×400 / 351×400, center 33.817617,-118.385433, label "Find us here!". **NO email anywhere.**
- NO body form (only the modal form). Ends with "Ready for great dental health?" CTA.
- Build: SubpageHero variant left-aligned "Contact Us" (office bg) + an info section (CONTACT + HOURS + map — reuse the site's map/MapEmbed component if present) + Book-Appointment button wired to the existing global AppointmentModal + closing CtaBand. Keep the starter's working form logic reachable through the modal.

## Then: detail templates (service/question/team-member routes) vs a representative live detail page; final full-page gate sweep; PR (title "Match remaining subpages to live"; note: run `node scripts/seed-pages.mjs` after merge, Tucker publishes the Migration release).
