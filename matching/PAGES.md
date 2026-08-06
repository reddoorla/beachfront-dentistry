# Remaining-pages calibration (2026-08-04) — render vs content-publish split

Branch: feat/match-remaining-pages. Live nav = home(done) + your-first-visit,
our-team, services, ask-the-doctor, contact-us + 3 detail templates.

## The decisive finding
The seeded page assemblies (authored from live copy, in scripts/seed-pages.mjs)
are INCOMPLETE/divergent vs live — the subpages need real content+structure
build-out, not just layout tweaks. And the two kinds of gap need different hands:

- **RENDERING / COMPONENT gaps = MY code, autonomous, appear immediately, global.**
- **CONTENT / ASSEMBLY / DATA gaps = Prismic docs → need seed-pages re-run + a
  PUBLISH.** The seed flow lands an UNPUBLISHED migration release "for Tucker to
  review + publish" — the non-preview route (what page-diff hits) renders only
  PUBLISHED content, so these can't be gate-greened without a publish.

## Per-page gaps

### your-first-visit  (gate: 2 anchors NULL on cand)
- CONTENT: missing "Take a Virtual Tour" section + "First Exam Details" section
  (cand ~2200px shorter than live: Serving ref=5597/cand=3269). Order differs.
- RENDER: Carousel `photos` (Office Tour 8-img gallery) + rich_text (First Exam
  steps) fidelity — TBD.

### our-team
- CONTENT: missing `.hero.redondo` subpage-hero band ("Meet" over beach + wave);
  subtitle should be big centered slab "Our/Team" + h3, not a small lead eyebrow.
- RENDER (CollectionList `grid` card): live card adds bio-teaser + "read more"
  expander + favorite-beach image+caption; cand card = headshot+name+role only.
  Also grid variation doesn't apply the doctors-first sort.

### services
- CONTENT: missing subpage-hero "Services" band; missing closing CtaBand (the
  [uid] route doesn't append it). DATA RISK: category tags must be exactly
  "Cosmetic Dentistry / Restore Your Smile / General Dentistry / Specialty
  Services" to yield 4/9/6/5 (esp. "Restore Your Smile").
- RENDER (ServiceCategoryBand): live items = plain h6 text links; cand = blue
  `bg-primary-deep` panel links with → glyph. Different treatment.

### ask-the-doctor
- CONTENT: missing subpage-hero "Ask the Doctor" band (cand emits an empty
  lead_text eyebrow); duplicate "Ask the Doctor" heading (lead + question_list).
  Verify 40 news_article docs.
- RENDER (QuestionList `numbered`): live = responsive GRID of cyan click-to-expand
  cards w/ teaser + "Read More" (like home); cand = narrow vertical <details>
  accordion. Wrong structure. TEASERS map exists but unwired in numbered branch.

### contact-us  (DEDICATED route src/routes/contact-us — MINE, not Prismic)
- RENDER/REWRITE: cand = starter skeleton (h1 + a body contact FORM + 2-col info).
  Live = styled `.hero.contact` band + a centered CONTACT/hours/MAP info band +
  closing CtaBand. **Live has NO body form** — contact funnels through the global
  Request-Appointment modal. DECISION: match live (drop the body form) vs keep
  the working starter form.

## Cross-page shared components (factoring)
Already shared: Nav, Footer (w/ MapEmbed), AppointmentModal, CtaBand (ctaHero
helper), LeadText, CollectionList, QuestionList, Carousel, Slider,
ReadReviewsExpander, WaveDivider, site.ts constants.
MISSING shared component: a **subpage-hero band** (big slab heading + gradients +
wave + page bg) — live uses it on every subpage; needs building + wiring
(wiring = assembly = publish).

## Autonomous plan (no publish needed — render only)
1. QuestionList numbered → live card grid (ask-the-doctor) — reuse home card render.
2. ServiceCategoryBand → plain h6 text links (services).
3. CollectionList grid card → bio-teaser + read-more + beach image (our-team).
4. Carousel photos gallery + rich_text fidelity (your-first-visit).
5. contact-us route rewrite (pending the form decision).
These improve the shared components globally + gate-verify where content exists.

## Publish-batch (prepare in seed-pages, Tucker publishes)
- Build + wire the subpage-hero band into our-team/services/ask-the-doctor/contact.
- Add missing sections (your-first-visit: Take a Virtual Tour + First Exam Details).
- Add closing CtaBand to services assembly.
- Fix section order/copy; verify data (service tags, 40 Q&A).
