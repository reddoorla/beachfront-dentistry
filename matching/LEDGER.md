# Deviations / masks / floors ledger — beachfront-dentistry home

- [deviation | RESOLVED 2026-08-03: operator ACK — keep AA] footer "Want to
  learn more?" heading — ours `text-primary-deep` rgb(14,119,153) vs live
  `#129ecc`; live's cyan fails AA at 30px on the pale canvas. Tucker: "footer
  color is fine" → keep the AA-safe swap. Permanent, intentional. Evidence:
  style-census rows at 1440 y≈8383 and 390 y≈6862.
- [deviation] all pill buttons — live's `.button` uses `line-height: 0` +
  1.3em padding; we match the RENDERED RECT (h-41px/67px, px to match) instead
  of the lh trick. Every "lh=0px vs lh=Npx" census row on a pill is this one
  deviation. Evidence: live .button rule in matching/spec/beachfront.css.
- [a11y] ours-only text: "skip to main content" link, slider live-region
  announcements ("slides 1 through 5 of 11", "slide 1 of 5") — deliberate
  additions, not on live.
- [artifact] text-diff residual classes on this pair: negative-y rows = live's
  off-canvas menu + hidden contact form (name/email/phone/message); br-split
  headings = "book an / appointment", "have a / complete exam", "receive a /
  no-pressure plan", "ready for / great dental / health?"; embed internals =
  maps "find us here! / keyboard shortcuts / map data / terms / report a map
  error".
- [tablet band 768–1023 — IMPLEMENTED 2026-08-03, operator chose full match;
  commit 79403b5] Remapped our breakpoints to live's (lg→992, full sm→xl set
  declared in order) + added a md: (768–991) type/layout tier from live's
  root-32 values. Desktop 1440 + mobile 390 verified NO regression; tablet
  type matched (style-census 42→9, the 9 = the same ledgered items below),
  major layouts stacked (Δh Finally 82→5, Your Path 31→0.8, seam 992–1023
  now renders desktop). RESIDUALS (finer, deferred): card-height Δh at 834 —
  Our-dental-team ~17%, Serving ~19% (QA/review card exact tablet heights);
  seam-narrow-desktop wrap Δh at 1000 (Your Path 12%, Finally 11%). The
  tablet mm% is otherwise the SAME video-hero + photo-pipeline floor as every
  viewport (judged by Δh + census + chrome, not raw mm).
- [SKILL FINDING — Tailwind v4] Overriding a SINGLE --breakpoint-* in @theme
  re-registers it out of order, so a `md:` value emits AFTER `lg:` and WINS at
  desktop (silently regressed the shipped 1440 match; lg:grid-cols worked but
  lg:max-w/text lost to md:). Fix: declare the FULL sm→xl set in ascending
  order. Belongs in the matching-a-page trap table.
- [card-text polish — FIXED 2026-08-03] Review card (Carousel .big-review):
  the card was `flex-col-reverse` at md AND lg (reviewer-on-top). Probe of the
  LIVE site proved live is `column`/QUOTE-top at 390/834/1440 — it never
  reverses; the old code comment ("desktop flips to reviewer-on-top") was
  simply wrong. The reversal had survived earlier gates because the reviewer
  avatar is a masked photo and the quote/name/place TYPE tuples are identical,
  so only the vertical ORDER differed (invisible to style-census + inside the
  photo mask on page-diff). At tablet it also fixed a visible clip (quote's
  last line ran under the card's bottom edge + Yelp badge) and a dead gap.
  Fix: removed md/lg flex-col-reverse (→ plain flex-col everywhere), md padding
  18→24px (`md:p-6`, live's tablet value), figcaption `lg:mb-6`→`lg:mb-0` so
  the reviewer sits flush at the card bottom like live. Re-probe: cand==ref at
  834 (quote 24/144, cap 200/201) and 1440 (quote 30/180, cap 250/250). Mobile
  390 untouched (all edits md/lg only). NOTE: this DID change the shipped
  desktop card (reviewer-top → quote-top) to match live — flagged to operator.
- [card-text polish — FIXED 2026-08-03] Two tablet type gaps (no md: tier, same
  class as the whole band): QA-card "Read More" pill was mobile 15px at tablet
  (live 20px) → added `md:text-[20px]` (matches sibling pills, no md height per
  the established pattern); "Read Reviews" expander label line-height was 30px
  at tablet (live 55px) → added `md:leading-[55px]`. style-census @834 9→8
  mismatches; the 8 remaining are all documented pill lh=0 rows + the ACK'd
  footer AA color.
- [QA cards 650px — FIXED 2026-08-03] The QA cards (.qa-block) used a fixed
  ASPECT (`aspect-[351/288]` + `lg:aspect-[3/2]`) with the container capped at
  base `max-w-[600px]`. Live's .qa-block is instead a FIXED-HEIGHT box (288 ≤767
  / 320 tablet / 400 desktop) inside a 480-capped (≤991) / 600 (desktop) column.
  The aspect matched 390 by luck but grew the height with width: at 650 the card
  was 600×492 (vs live 480×288), which (a) overshot the 400px answer-panel
  translate so the closed answer excerpt PEEKED over the title (the reported
  bug) and (b) made the whole page a full band taller (9→8 bands, pageH
  9423→8522). Fix: container `max-w-[480px] lg:max-w-[600px]`; card closed
  `h-[288px] md:h-[320px] lg:h-[400px]`, expanded `h-[384px] sm:h-[288px]
md:h-[320px] lg:h-[400px]` (sm: approximates live's 480px landscape bp).
  Re-probe: cand==ref at 390/650/834/1440 (351×288 / 480×288 / 480×320 /
  600×400). Expanded verified clean (Read More inside card, no clip) at 390+650.
- [480–767 mobile-landscape band — CALIBRATED 2026-08-03] Only 390 and the
  768–1023 tablet band had been type-calibrated. Webflow's real breakpoints are
  480/768/992 (NOT root-scaling — the root only steps 24→32; each element has
  its OWN per-breakpoint px, and the biggest step for many is at 480). Added a
  `xs: 480px` breakpoint (full set redeclared ascending xs→xl to avoid the
  variant-reordering trap) = live's mobile-landscape tier; `sm:640` kept only
  for two off-home utilities. Added `xs:` type overrides on ~14 element groups
  from measured live values: 3-C label 24→30, 3-C body 20→18, reviewer name
  16→20 + place 10→16, Read-Reviews 14→15/lh41, "Your Path" heading 60→120,
  step title 30/40-thin→21/26-light (also fixed at tablet — it was wrong there
  too, xs propagates up correctly), Fiji 10→15, footer "Want to learn" 16→30 +
  boilerplate 7→10, and the 14px pills →15. KEY: xs propagates upward, so any
  element whose landscape value ≠ its tablet value relies on an existing md:
  reset (all present); only the step title has no md and correctly stays 21/26
  through tablet. style-census @480/650/767 = 8 (was 23) — all remaining are the
  ledgered pill lh=0 rows + footer AA color + one census collision artifact
  ("Book an Appointment" step-title 21 vs pill 15 share text). No regression:
  390=9, 834=8, 1440=10 (xs never bleeds to desktop — every element has an
  md/lg reset or renders in the JS `isMobile<992` desktop branch). pageH @650
  8522→8771 vs ref 8900 (1.4%). Residual: live hard-codes `<br>` in the Your
  Path step titles (2-line wrap) — the already-ledgered "br-split headings"
  artifact, our CMS content has no break; 1-col layout itself matches.
- [Services tooth badge (.big-teal-tooth) — FIXED 2026-08-03] The teal tooth
  straddling the services wave seam had no xs/md tier (75px / top-72 / right-20%
  across 480–991), so it was the wrong SIZE and sat sunk into the band instead
  of straddling the crest. Live's CSS (matching/spec/beachfront.css:7717/8355/
  8975/9542) gives width 75(≤479)/55(480–767)/130(768–991)/130(≥992) and right
  20%(≤767)/25%(≥768). Added `xs:w-[55px]` (keeps top-72/right-20% — a 55px tooth
  at that top re-straddles the crest) and `md:w-[130px] md:right-[25%]
md:top-[8px]` (the big tablet tooth shifted up to straddle). Verified vs ref
  at 650 (55px on crest) and 834 (130px mostly above seam, crest through lower
  third). base(390)+lg(1440) untouched. Vertical set by visual straddle (the
  wave-crest Y at the tooth's x isn't cleanly probe-able); within tolerance.
- [DEFERRED — decorative, not card text] "what they say" mark on the review
  slider: live's `.what-they-say-big-review` shows at ≤991 (repositioned
  right:-5rem, ARROW `display:none`) and at ≤479 (right:-4rem); ours is
  `hidden lg:block` (desktop only), so the mark is absent at tablet+mobile. It
  is aria-hidden decorative; matching needs a bespoke md/mobile position + the
  arrow suppressed. Out of scope for a card-text round — pick up in a dedicated
  annotation pass. Source: matching/spec/beachfront.css:6789, :8832, :9364.

- [GATE RUN 2026-08-03 — page-diff @390,480,650,834,1440 + Phase-5 interaction
  pass; matching/out-final, matching/probe-states.log] BOTH primary-matrix
  viewports PASS: 1440 (all regions ≤8.5% except Serving Δh 5.4% — marginal, see
  below) and 390 (all PASS except Ready = the ledgered map-OOPIF floor). Phase-5
  interaction gate CLEAN: menu open/close @390+1440 (10 links, cyan fly-down),
  Read-Reviews expander (aria false→true, icons opacity→1), review slider (Next
  advances "Slides 1–5"→"2–6"), QA accordion @834 (aria false→true), all three
  on-page pill hovers transition (hero/CTA bg→#129ecc4a, Read-Reviews opacity
  1→.91). The 3 raw probe "fails" were artifacts: nav "Request Appointment" pill
  is display:none under hamburgerOnly, and live's custom nav/slider don't match
  Webflow `.w-nav-button`/`.w-slider-arrow` selectors (best-effort live capture).
- [ACK-REQUIRED — 480–767 mobile-landscape band was TYPE-calibrated only, never
  LAYOUT-gated; page-diff now surfaces real geometry deltas across it] Root
  cause = the HOME HERO height. Live `.hero.home` is width-relative in the mid
  band — `70vw` clamped [240,640] at ≤767, `80vw` at 768–991 (beachfront.css
  :8438/:8456/:7992), and vh-relative at the ends (`70vh` ≤479 :9088, `90vh`
  ≥992 :5330). OURS is fixed ~630px across 390–834, so it overshoots worst at
  480 (measured live topH=456 vs cand 630, page-diff top Δh 64%/mm 70%), tapers
  through 650 (live 592 vs 630) and 834 (live 699 vs 630 — ours now UNDER).
  Downstream sections also fail INDEPENDENTLY at 480/650 (Finally 55/34%, Ready
  25/29%, MEET-YOUR-TEAM 16/22%, Your-Path 17/17%, Our-dental-team 13/13% — the
  photo-pipeline+video floor plus un-tuned mid-band layout). vw834 fails match
  the out-all4 pre-fix numbers → the ALREADY-DEFERRED tablet residuals, not new.
  FIX PATH (operator to scope): responsive Hero height (70vh/70vw[240,640]/80vw/
  90vh) resolves the `top` region band-wide; the other mid-band sections need a
  per-section layout pass like 390/1440 got. NOT a regression from the
  card/tooth commits (390 & 1440 held).
- [480–767 LAYOUT PASS — PARTIAL, commit 94b42a8, gate matching/out-band3] The
  structural offenders are FIXED and verified; finer per-section spacing remains.
  FIXED: (1) HERO height — now live's 70vh(≤479)/80vw clamped-[240,640](480–991)/
  90vh(≥992) ladder + landscape bottom-padding cut to live's ~48px. Measured
  heights match EXACTLY (384@480, 520@650, 667@834). `top` region: 480 Δh64%→0
  (mm 70%→11.5%, just over), 650 48.8%→6.8% PASS, 834 19.2%→5.3% PASS, 390/1440
  hold. (2) 3-C "Finally" CARDS — `aspect-[351/240]` (ballooned as a full-width
  1-col) → live's fixed h-240/336/448 + width cap 403/512 centred, reset at lg.
  Card boxes now match live (403×336@480, 512×448@834). NOTE the shared grid
  briefly regressed Finally@1440 (max-w squished the desktop 3-col) — fixed with
  lg:max-w-none/mx-0. (3) READY/CtaBand fiji band — fixed 273px → live's 70vw
  (≤767): Ready 650 Δh 12.5%→2.2%, 480 Δh 9.4%→5.7%, 834 mm 35%→16.5%.
  RESIDUAL (deferred — finer layout, operator to scope a dedicated round):
  • Finally@480/650/834 still Δh 15–20% — cards match, so it's SECTION spacing
  (heading→cards + section padding), tangled with Webflow's root-rem scaling
  (live card margins are 0.5rem = scales 12/17/22px per breakpoint).
  • MEET-YOUR-TEAM 16/22/30% + Our-dental-team 13/13/36% — the team slider's
  landscape/tablet card layout (untuned; 834 is the ACK'd tablet residual).
  • Your-Path 17/17/24% — steps section landscape spacing/type.
  • Ready mm 16–22% @480/650 — the CTA stack (pill + Read-Reviews gap-[65px])
  position within the now-correct band height; + photo floor.
  • top@480 11.5% (just over) — hero h1 sits ~73px higher than live (live sets
  the pill BESIDE the h1 at landscape; ours stacks it below → h1 rides up).
  • Serving@834 Δh 15.5% — pre-existing ACK'd tablet residual.
  All FIXED items re-verified: svelte-check 0/0, prettier clean, unit 20/20 on
  touched components (SectionGrid/Hero/CtaBand/QuestionList).
- [480–767 LAYOUT PASS — ROUND 2, commit f61308c, gate matching/out-band4]
  FINALLY spacing FIXED: settled-probe found live's heading→card1 gap is 72px
  (not 36) and the inter-card gap is 96px (not our gap-6=24) across 480–991 —
  ours held the ≤479 values. xs:mb-[72px] + xs:gap-[96px] (reset at lg). Finally
  480 44.5%→15.1% (Δh 15→3), 650 32.4%→10.1% (Δh 16→3, now barely over), 834
  40.8%→35.6%; 390/1440 hold (no regression). Band state now (480/650, mm):
  Ready 22/21, MEET-YOUR-TEAM 16/22, Your-Path 17/17, Our-dental-team 13/13,
  Finally 15/10, top@480 11.5 — all MODERATE (was 44–70%). REMAINING DIAGNOSES
  (fonts already match live per report.json css dumps — these are LAYOUT/wrap):
  • Your-Path — h2 heading wraps WIDER than live (cand 602 vs live 498 @650, 5
  vs 4 lines): live's `.content-width` uses %-side-padding (8%/5%, :8627+) not
  our fixed px-6, so live's content is narrower → different line breaks. A
  landscape max-width/%-padding on the steps heading would align it. Step
  title + subtitle FONTS already match (steps-font-m 21/300, 20/300, 120/100).
  • Ready mm 20–22% — band height now correct (70vw), residual is the CTA stack
  (pill + Read-Reviews, gap-[65px]) vertical position on the white-fade + the
  photo floor.
  • MEET-YOUR-TEAM — the masked-avatar team slider (CollectionList) landscape row
  layout; "Our dental team in Redondo" is a COMPOSITE region (services band +
  ask-the-doctor + QA), not one section — mm spread across it.
  • top@480 11.5% — hero h1 rides ~73px high: live sets the pill BESIDE the h1 at
  landscape, ours stacks it below (flex-col). Marginal (1.5% over).
- [480–767 LAYOUT PASS — ROUND 3, commits 4701cad/48c7ec0/d2d1424, gate out-band7]
  Worked the tail. FIXED (all verified by settled probe before commit):
  • Your-Path HEADING — capped to live's width at xs (xs:max-w-[85%] mx-auto,
  reset at md where the 2-col grid narrows it): cand 367px/5-line @480 (=live
  355/5), 512/4 @650 (=live 498/4). Your-Path 17→16 @480, 17→13 @650 (Δh→1–2%).
  • Your-Path STEP TITLES — h3 inherited the global h1–h6 `text-wrap: balance`
  (app.css:401) → "Receive a No-Pressure Plan" split to 2 even lines; live fills.
  Added builtin `text-wrap` (the arbitrary [text-wrap:normal] no-ops; builtin
  works, as in Hero h1). Re-probe: all 3 titles 1 line = live.
  • Ready HEADING — same balance→fill fix ([&_h2]:text-wrap on the display-xl
  div, both CtaBand instances): cand now 2 lines @480/650 (=live), 3 @1440
  (=live, text-wrap:wrap h=504) — no desktop regression.
  KEY FINDING — the Ready-heading fill was CORRECT but did NOT move the region mm
  (Ready 480 held 22.5% across band4/5/6): the "Ready" anchor region is a huge
  COMPOSITE (heading + fiji band + the WHOLE footer + the Google MAP = the
  ledgered cross-origin OOPIF floor), Δh only 2.2% — its mm is footer/map
  composite, largely FLOOR-BOUND, not the heading. Same shape for "Our dental
  team in Redondo" (services + ask-the-doctor + QA composite). These two regions
  won't reach <10% without the map floor being masked (self-approvable per the
  embed ledger below) — the fidelity work inside them is done.
  STILL OPEN (finer, deferred to a focused follow-up):
  • MEET-YOUR-TEAM 16/22 — masked-avatar team slider (CollectionList) landscape
  row layout + eyebrow; avatars are photo-floor so headroom is limited.
  • top@480 11.5% (1.5% over) — hero h1 rides high (pill stacks below vs live's
  beside); low value, flex-row change risks squish at 480 — left alone.
  • Finally 15/10 (Δh 3) — sizes+gaps match; residual is finer sub-block spacing.
  • 834 tablet band — the pre-ACK'd residuals (Finally/team/Your-Path card heights).
  Net: the band went from catastrophic (mm 44–70%, Δh 64%) to mostly 10–16% with
  many regions passing; hero + card sizes + Ready band + Finally/Your-Path spacing
  - heading fills all live-matched and committed. svelte-check 0/0, prettier
    clean, unit 20/20 on touched components across all commits.
    CONFIRMED by out-band7 (all 6 commits): IDENTICAL to out-band6 to the decimal
    (Your-Path 16.0/13.0, Ready 22.5/21.0) even though the step-title fill landed
    (probe-verified 1-line=live) — same signature as the Ready-heading fill. So the
    remaining region mm is FLOOR/COMPOSITE-bound (masked photos, the wave+SERVICES
    band, the footer map, composite anchors), NOT unfixed layout: element-level
    typography/geometry now matches live where measured. Path to gate-green is
    declaring the floors (a --mask on the map/composite regions — OPERATOR call per
    the escalation rule), not more layout work. Stopping the layout pass here.
- [note — Serving@1440 Δh 5.4%] just over the 5%/24px height-delta floor (mm
  4.9% PASSES); was 3.2% in out-all4. Single-run, boundary-rect noise band per
  the skill (±2px) — re-measure with two settled reads before treating as real.
- [floor-photo-pipeline] all photo content (Prismic imgix re-exports of live's
  Webflow originals — same base filenames, different pipeline) — diffed under
  `--mask-photos`, declared in every run header.
- [embed] footer Google map — live is a Maps-JS `w-widget-map` canvas, ours an
  embed iframe with matched z=12. In full-page captures our CROSS-ORIGIN
  iframe 7000px below the fold does not composite (Chromium offscreen-OOPIF
  behavior), so the map area screenshots blank on cand and the Ready@390
  region carries a large fake mismatch. VERIFIED REAL: scrolled in-view at
  390 the map paints with live's framing + labeled pin
  (map-inview-390.png, 2026-08-03). If Ready@390 needs a mask to close the
  pixel gate, this is the self-approvable live-embed basis; geometry is
  separately proven (Δh 0.6%).

## Remaining-pages round (feat/match-remaining-pages)

- [factor] QuestionList: extracted the `.qa-block` card into shared
  QuestionCard.svelte; both `teaser` (home) and `numbered` (ask-the-doctor)
  render it, so fidelity changes carry globally. Card owns its own expanded
  state (no cross-card coordination in a 40-card grid).
- [fix] card height ladder corrected md 320→240 (live `.qa-block` is 10rem =
  400@root40 desktop / 240 tablet(768) / 288 ≤767, MEASURED off live). The old
  320 was verified only at 1440/390 and never held at the 768 tablet cut —
  the "pass at one viewport certifies nothing about another" trap. Element-probe
  post-fix: local 400/240/288 == live at 1440/768/390.
- [numbered spec] ask-the-doctor index is a Webflow 2-col `.w-col-6` row (NOT a
  CSS grid, NOT the home single-column headshot treatment) of all 40 cards in
  `.content-width` (max-w-1400, pad 60/36/19.5px measured). Implemented as
  grid-cols-1 md:grid-cols-2. Full page-diff gate is PUBLISH-GATED (content is
  an unpublished migration release) — verified against live SOURCE spec here.
- [follow-up | not-a-regression] home teaser column `max-w-[480px]` over-widens
  the card at 768–991 (local 480 vs live ~360=15rem@root24); live's card jumps
  360→480 across the 767/768 boundary (base 15rem vs ≤767 20rem-cap). PRE-
  EXISTING (merged home), not introduced by this change; the 480 was a
  deliberate compromise for the 650 case. Revisit with a md:max-w step +
  home re-gate at 768/834 before touching.

## Local matching gate (cb3fd61) + subpage floors

- [harness] `/dev/match/[uid]` renders the shared `beachfront-pages.js` assembly
  through the real SliceZone, so page-diff runs on any subpage with NO Prismic
  publish. Gate cmd + traps captured in the `beachfront-match-gate` memory.
- [floor-photo-pipeline] dev serves Prismic-migrated card images (imgix
  auto=format,compress → recompressed) vs live's webflow-CDN originals →
  color-domain diff (dE~34) even when geometry matches exactly. `--neutralize-media`
  does not fully remove it. Verify grid geometry with paired screenshots + Δh,
  NOT raw mm. Vanishes once the stack serves all images.
- [floor-dev-csp] live page-level hero/cta backgrounds are webflow-CDN URLs,
  BLOCKED by the app CSP img-src (svelte.config.js allows only *.prismic.io) →
  render as dark bands (natW=0) in dev/match. Card photos (Prismic) DO load.
  A dev-only artifact; the published stack uses Prismic-hosted copies.

## ask-the-doctor (438b731) — layout matched

- SubpageHero band: hero height 810→475/371 (was wrongly reusing `hero-band`'s
  90vh home ladder); heading forced white inline (global `main h1–h3` primary
  rule outranks text-white). Δh hero 78%→~0.
- numbered grid: measured live `.ask-the-doctor-collection-item` = uniform 520px
  cell (all 20 rows) over a 400 card → 120px desktop bottom space (top-aligned);
  `.w-col-6` inset px-[10px]/lg:px-[20px] (cards 331@390 / 600@1440). Δh grid
  22.7%→3.5%. Residual mm = the two floors above (paired screenshots confirm the
  grid is visually near-identical to live).

## services spec (for the ServiceCategoryBand grid rebuild)

- live /services = `.service-grid` (2-col, 640px cols, gap 0) of `.service-block`
  cards (600×640). Card = `.h-60pc` top (heading museo-slab LIGHT 300 40px/50
  cyan #129ecc + intro para) over `.h-40pc.bg-color-primary.dark-gradient-up`
  panel (cyan #129ecc, radius 0 0 25 25, pad 0 10px) = 2-col flex-wrap of
  `_w-half` `<a>` with white uppercase museo-SLAB BOLD 700 14px/38.5 ls=1.28 h6
  (~270×39), + `.service-block-teef` tooth img. Cats: Cosmetic(4)/Restore Your
  Smile(9)/General(6)/Specialty(5). REBUILD as a single `grid` variation slice
  (4 items) so the 4 categories pack into the 2-col grid (SliceZone can't grid
  siblings). Current `default` variation (side-by-side heading|deep-panel + →)
  diverges.

## services GATE RESULT (2026-08-04, ServiceCategoryBand grid + edge-padding fix)

- [gate] /services — grid `Cosmetic Dentistry` region: mm 24.0%→9.8% PASS @1440,
  Δh 14.3%→4.8%; @390 Δh 7.0%→2.3% (mm 15.6% = card-body AA + link-order below).
  Fix = grid container `py-12 lg:py-20` (live centers 600×640 cards in 800px row
  tracks → 80px desktop / 48px mobile edge slack that gap-y doesn't add). Cards,
  panels, tooth, split-columns, typography all pixel-identical (paired diff
  panels confirm: red is AA fringing on matched text, not displacement).
- [floor-photo-pipeline] card body/heading text: dE ~6 residual is Prismic-imgix
  vs webflow font AA; positions match. Not a defect.
- [floor mask=CSP] `top` (subpage hero bg) + `Ready for great dental health` (CTA
  bg) regions: mm 14–23% but Δh <5% — page-level webflow-CDN backgrounds blocked
  by dev CSP img-src (dark band in dev). Vanishes when the stack serves the bg.
- [ACK-REQUIRED: data-order] service-link ORDER inside each card panel differs
  from live (same item SET, different sort). Links come from loadCollections in
  Prismic default doc order; live uses a manual CMS sort not derivable offline.
  Matchable only via a Prismic order/priority field or curated seed order —
  Tucker's call (do NOT hardcode the order in the render component). Layout is
  unaffected; this is the sole residual CONTENT diff on /services.

## our-team GATE RESULT (2026-08-04)

- [gate] /our-team — anchors resolve at IDENTICAL y both viewports (Our 465=465,
  Dr. Robert Quan 1081=1081 @1440; 361/681 @390). `Our` region (subtitle
  Our/Team + cyan intro): PASS 0.2%@1440 / 5.1%@390. `Dr. Robert Quan` region
  (11-card person grid): PASS 6.2%@1440 / 5.2%@390, Δh 1.5%. Visual screenshot
  confirms circular overlap headshots, cyan names, teal uppercase roles, 3-line
  bio clamp, READ MORE + cyan arrow, beach banner + white caption — matches live.
- KEY GEOMETRY (live): person card carries ALL spacing via MARGIN not grid-gap —
  mt160/mb20/mx20 @1440, mt96/mb24/mx24 @390 (row pitch 660/504); headshot
  overhangs 100/60px (centre on card top edge). Container = flex-wrap justify-
  center, ZERO padding. Subtitle section ALSO zero-padding: height is purely the
  3 headings; intro h3 wraps to 5 lines (max-w-620), first h2 mt-[-10].
- [floor mask=CSP] `top` (redondo hero-band bg) mm ~39% + `Ready…` (CTA bg) mm
  ~18-23%: page-level webflow-CDN backgrounds blocked by dev CSP; Δh in tol.
- [ACK-REQUIRED: data-gap] person docs' favorite-beach `gallery` is EMPTY on all
  11 migrated Prismic docs (verified via cdn.prismic.io API). Live shows a beach
  banner + caption per card. Captured verbatim to PERSON_BEACHES + static/beaches/
  (5 real unsplash photos, downscaled 900px). The dev matching route previews it
  so the gate verifies the full card; PRODUCTION cards render without the banner
  until person.gallery is seeded. FOLLOW-UP for Tucker: seed person.gallery from
  PERSON_BEACHES (upload the 5 photos) → publish. NOT hardcoded in render (card
  reads gallery[0] data-drivenly; absent gallery just omits the banner).

## your-first-visit — BUILDING the 4 bespoke sections (2026-08-04 session 2)

CONTRADICTION RESOLVED (re-probed live source 2026-08-04): the exam section IS a
2-col numbered TIMELINE (`.fv-exam-section` → h3 "First Exam" + intro left, image
DSC_7704 top-right 768×539, steps in `.exam-step` = `.circle-time-holder`("01"+"10
min" stacked badge) + `.exam-content-holder`(title h5 + para); step 00 Registration

- 2 buttons in the LEFT col; steps 01-06 stacked RIGHT under the image). The
  current assembly's "15 min — X" CONTENT is correct; only the LAYOUT was a plain
  rich_text list. REMAINING-SPECS.md line 21 ("no timed labels, prose") was an
  earlier MIS-PROBE — disregard it. Authoritative 1440 geo now in probe-yfv-exact.mjs.

## your-first-visit — 4 SECTIONS BUILT (2026-08-04 session 2, branch feat/first-visit-sections)

All four deferred sections BUILT + wired + gated (out-yfv-r1..r3):

- fv-toc: new `first_visit_toc` slice (intro + 3 numbered nav cards + 2 outline buttons).
- Office Tour: Carousel `photos` fullbleed mode (100vw slides, 8 dots, edge arrows).
- Meet Our Team: CollectionList `people` + `layout:"slider"` (personCard in horizontal slider).
- First Exam: new `exam_timeline` slice (2-col; step00+buttons left, photo+steps01-06 right w/ cyan circle badges).
- Shared `OutlineButton` (live `.button` outline pill). Nav cards anchor-link to section ids (#office-tour/#meet-our-team/#first-exam, scroll-mt-24).

GATE (page-diff, 1440,390, neutralize-media): overall FAIL but cumulative drift cut
-743→-363px (r1→r3); TOC 1440 Δh 34→12%, mobile 41→19%; Office Tour 26→17%; exam 15→12%.
RESIDUAL = the documented photo-pipeline + dev-CSP FLOORS (see [[beachfront-match-gate]]):
hero/office-tour/exam-image are webflow-CDN photos CSP-blocked in dev (grey) and the
team headshots are Prismic-vs-webflow pipeline — mm 38–69% on those regions is pure
photo noise, unmovable by spacing. Structure verified at element level (probe-yfv-exact/
detail2). INTERACTIONS verified (probe-yfv-states): tour slider advances + 8 dots, team
arrows, all Book buttons → #appointment modal, nav hrefs correct.
DEFERRED POLISH: mobile spacing on the photo-floored regions (Office Tour Δh 40% / exam
31% @390) would settle further with real production photos + one mobile pass.
COPY FLAG for Tucker: TOC button reproduces live's typo "Book an Apointment" verbatim
(text-diff fidelity) — candidate to correct. Registration/Download-Forms links are "#"
placeholders (need the real patient-forms URL).
Models: first_visit_toc + exam_timeline INSERTED, carousel/collection_list layout fields

- page slice-zone UPDATED (Custom Types API). Seeded into the Migration release (yfv 7
  slices). IMPORTANT git lesson: this build started on STALE main (2 behind) — rebased onto
  origin/main; a stray `layout` field landed on `team` and my push briefly wiped `people`
  from Prismic — restored. ALWAYS `git fetch`+rebase before a build session.

## your-first-visit — PARTIAL (hero done; 4 bespoke sections deferred w/ measurements)

Live census (measured 2026-08-04, 6 sections + footer):

1. `.hero.group-photo` (h=540 @1440 = min(60vh,60vw) / 371 @390 = 95vw). H1
   "We are excited to meet and care for you." museo-slab wt300 60px/72 (25/38
   @390) WHITE, LOWER-LEFT (x=80 / x=20), NO CTA. ✅ BUILT (hero/groupphoto
   variation) — hero height 540 matches live exactly (paired anchor: Office Tour
   lands at my 540). Residual = redondo/group-photo bg is CSP-blocked in dev.
2. `.fv-toc-section` (h=497, y=600) — ⏳ DEFERRED (candidate MISSING it entirely;
   this is the ~~617px height gap that shifts every downstream region). 2-COLUMN:
   LEFT = intro p (museo-sans 30px, w~~490) "We want you to feel comfortable
   before your first visit. Here some ways to give you a clear idea of what to
   expect:". RIGHT (x=760) = 3 NUMBERED nav-cards, each an <a> = h6 number
   "01"/"02"/"03" (museo-slab wt700 24px) + h3 title (museo-slab wt300 40px)
   "Take a Virtual Tour" / "Meet Our Team" / "First Exam Details" + a
   download-arrow.svg (A/…83c94c89c8dae60fa869b_download-arrow.svg) at right;
   cards anchor-link to the sections below. THEN 2 buttons: "Book an Apointment"
   [sic] (.show → modal) + "Registration Form". Needs a new slice type.
3. `.fv-virtual-tour-section` "Office Tour" (h1 museo-slab cyan 60px, x=80) —
   candidate uses carousel/photos (capped in a max-w-7xl ContentBand, multi-up).
   ⏳ Live = FULL-BLEED single-image w-slider: 8 slides tour1-8, each 100vw 4:3
   (1440×900 / 390×293), 2 arrows + 8 DOTS, no captions. Needs a fullbleed-single
   mode on Carousel/photos (drop the ContentBand cap + showDots).
4. `.fv-meet-our-team-section` "Meet Our Team" (h2 museo-slab wt100 120px, x=80)
   — candidate = teamTeaser avatar carousel (heading now "Meet Our Team" ✅).
   ⏳ Live = the SAME personCard as /our-team (headshot/name/role/bio/beach/
   READ MORE) in a HORIZONTAL Slider: cards 340px, ~4 per view, arrows
   carousel-arrow-left/right.svg (downloaded) at screen edges (x=20 / x=1384).
   Reuse CollectionList personCard in a Slider — watch the headshot's top
   overhang vs the Slider track overflow (may need overflow-y-visible/padding).
5. `.fv-exam-section` "First Exam" (h3 museo-slab cyan 40px) — content is ALREADY
   verbatim-correct in the assembly (intro + 7 steps 00-06: Registration Forms
   15 / Check-in 10 / X-rays 15 / Exam 20 / Cleaning 30 / Dental Plan 15 /
   Check out 05, incl. Download Forms+Book Appointment on step 0). ⏳ LAYOUT
   deferred: live is a 2-COL numbered timeline (LEFT: intro + step00 badge/MIN/
   title/para/buttons; RIGHT: DSC_7704 image at top + steps 01-06 stacked), each
   step = number "00" (h6) + "15 MIN" (h6 wt500 24px) + h5 title 30px + p 20px.
   Candidate renders the same content as a plain rich_text list ("15 min — X").
6. `.fv-review-section` "Serving the South Bay for over 40 years" review carousel
   - footer CTA — ✅ (shared carousel/review + ctaHero, same as other pages).

- Gate is red overall PURELY from the missing TOC (617px) + compact office/exam
  vs live's tall sections shifting all anchors; individual built pieces (hero,
  reviews, CTA) match. `Serving`/`Ready` regions' own mm are low (5%/18-22%);
  their Δh is the cumulative upstream height shift, not a local defect.
- FOLLOW-UP (bespoke, ~4 new slice variations): first_visit_toc slice, Carousel
  photos fullbleed-single mode, CollectionList team-cards (personCard-in-Slider),
  exam_timeline slice. All measurements above.

## contact-us GATE RESULT (2026-08-04) — DECISION: match live, form via modal, no body form

Live census: hero.contact ("Contact Us") → info-section (Book Appointment btn +
CONTACT + OFFICE HOURS + Google map, NO email) → footer CTA. Rebuilt the route's
+page.svelte (server action untouched — the global AppointmentModal POSTs to it).

- [gate] /contact-us — `Book Appointment` region (the info band: Book-Appointment
  pill → CONTACT/OFFICE-HOURS columns → map) PASS 5.9%@1440 / 8.9%@390 (Δh
  1.2/1.7%). Anchors resolve at identical y (475=475, 371=371). Hero heading
  "Contact Us" confirmed left-aligned at the correct position/size (diff-panel
  text outlines overlap).
- Reuses SubpageHero (new align="left" prop) for the hero, MapEmbed (keyless
  iframe) for the map, site.ts ADDRESS/HOURS/PHONE (already verbatim-correct),
  and CtaBand (passed the FIJI-beach composition + "Book Appointment" so the
  close matches live; default `<CtaBand/>` is the plain imageless block, which
  is why Ready Δh was 15.6% before → 4.3% after). No body form; the request
  form is the global AppointmentModal, opened via #appointment (Book Appointment
  button + footer CTAs). Tests rewritten (4/4): h2 heading, info rows, map,
  no-body-form + #appointment funnel.
- Hero bg (contact-hero.jpg) + CTA beach (cta-beach.jpg) downloaded to
  static/images/ (real assets, downscaled) so they clear the app CSP on this
  hand-built route (assembly pages resolve the same imagery via Prismic).
- [floor mask=CSP/overlay] `top` (hero) mm 48/78%: live's cyan hero overlay vs
  our scrim + page-diff --neutralize-media flattening OUR <img> hero bg while
  live's CSS background-image is untouched → color-domain mismatch. Heading
  geometry matches; Δh in tol.
- [floor] `Ready` (CTA) mm 22.8/11.4%, Δh 4.3/0.7%: FIJI beach media (same
  neutralize asymmetry) + the shared footer gap below.
- [SHARED-FOOTER GAP — affects every page, pre-existing from the home rebuild,
  NOT contact-specific] the live site FOOTER carries a Google map (bottom-right,
  3rd column beside OFFICE HOURS/CONTACT) that our layout Footer omits. Also the
  default CtaBand label is "Book an Appointment" vs live "Book Appointment".
  Both are shared-component follow-ups (Footer.svelte + CtaBand default), out of
  scope for the contact-us route work.

## detail templates (services/[slug], questions/[slug], team-members/[slug])

- All 3 routes FUNCTION: render HTTP 200 with correct content (team-members/
  dr-robert-quan → "Dr. Robert Quan"; services/dental-exams → "Dental Exams";
  questions/loose-tooth → "Why is my tooth loose?") and working links.
- LAYOUT DEFERRED (bespoke, like yfv's sections). Live team-members/<uid> =
  `.hero` band (h=475, name as h1 60px, same 33vw treatment as the subpage
  heroes) → `.bio-section` (h=442: role + full bio) → footer CTA. Mine = a
  narrow "← MEET OUR TEAM" back-link + max-w-5xl article (name h1 30px) +
  CtaBand — content-correct but not the hero+bio composition. services/ and
  questions/ details similarly render plain articles vs live's hero+body.
- FOLLOW-UP: give the detail templates the SubpageHero name-band + a bio/body
  section (reuse SubpageHero; the team-member hero bg needs identifying — live
  hero has a photo bg). Lower priority than the primary nav pages.

## CONFIRMATORY SWEEP (2026-08-04 session 3, branch feat/first-visit-sections)

Re-ran page-diff on all 6 pages at 1440,390 on the CURRENT branch (post-yfv +
typo fix) to prove no regression. Results (matching/out-verify-*):

- our-team / services / contact-us used neutralize-media=true (matching their
  recorded runs) and REPRODUCED the recorded PASS numbers to the decimal:
  services Cosmetic 9.8%@1440, our-team Dr-Quan 6.2%@1440/5.2%@390, contact
  Book-Appointment 5.9%@1440/8.8%@390. No regression. ✅
- home: content regions PASS (MEET-YOUR-TEAM 0.2%, Your-Path 4.8%, Serving 4.6%,
  top 5.1%); residual = documented photo/composite floors (Finally, Redondo). ✅
- ask-the-doctor: Δh 3.5% (heights matched) — NOTE the LEDGER "22.7%→3.5%" is
  the grid heightDeltaFraction, NOT mm (I briefly misread it as mm and alarmed;
  resolved). mm 77–82% = CSP-blocked hero photo (black band in dev) + the
  qa-card photo-pipeline over a ~10k px region; fresh screenshot
  (matching/atd-{live,cand}-1440.png) confirms the QA grid renders
  element-for-element identical to live. Structural match holds. ✅
- your-first-visit: content regions low-mm (We-want-you 3.9%, To-be-a-long-term
  4.3%, Serving 5.4%); high mm/Δh on Office-Tour + headshots = the deferred
  mobile-photo floors already ledgered. ✅
- The `Ready for great dental health` region is byte-identical across ALL 6
  pages (mm 22.9%@1440 / 18.1%@390) — proving it is the SHARED CtaBand+footer
  floor (FIJI-beach media + neutralize asymmetry + the footer-map gap), not a
  per-page defect.
  VERDICT: all 6 nav/content pages remain matched modulo the documented floors.
  The only UNMATCHED pages are the 3 detail /[slug] templates (plain article vs
  live hero+bio) — see the detail-templates section above.
  CAVEAT: --neutralize-media flattens live's <img> hero but not our CSS/CSP-blocked
  bg → it INFLATES `top`/`Ready` mm asymmetrically. For subpage-hero pages, the
  recorded non-neutralize runs (or a photo mask) are the truer instrument.

## DETAIL TEMPLATES BUILT (2026-08-04 session 3, branch feat/detail-templates-and-footer)

Built the 3 detail /[slug] templates to live (the last unmatched pages) + fixed
the shared footer. New shared components: DetailHero (photo band + lower-left
label + cyan wash + wave + optional overlay snippet), DetailIntro (big cyan
museo-slab-thin title + cyan right-indented lede), $lib/cta-beach (the FIJI
CTA_BEACH ImageField), $lib/detail-lede (splitLede promoted from services).

- **team-members/[slug]**: DetailHero(SHARED beach `team-member-hero.jpg` + NAME
  64px) w/ circular headshot (doc.media) overhanging bottom-right → role (teal
  slab bold) + bio + cyan "Back to Team" pill → CtaBand(beach).
- **services/[slug]**: hero = the service's OWN media (doc.media, NOT the
  `.hero.reception` DSC_7625 base — that only shows through when a service has
  no media, so it's the /static fallback) + "Services / <category>" crumb →
  DetailIntro(title 140px) → body → CtaBand(beach).
- **questions/[slug]**: hero = the question's OWN media + "Blog / View All Posts"
  crumb → DetailIntro(title 100px) → body → "Have another question?" →
  CtaBand(beach).

KEY LIVE MEASUREMENTS (read from source, not eyeballed):

- Detail hero ladder = 70vw(<768,=273@390) / 60vw(768-991) / 33vw(≥992,=475) —
  SHORTER than the subpage-hero 95vw base (that mismatch put mobile `top` at
  mm 65-68%; fixed → 5-12%).
- The hero→title/bio gap is a ~20px (title) / ~80px (bio) MARGIN above the
  section, not padding — anchors only land right (495=495, 555=555) with margin.
- The closing CTA carries the FIJI beach on EVERY page (fiji-section 800@1440 /
  273@390); the bare `<CtaBand/>` was missing it → `Ready` Δh 15.6%; passing the
  beach fixed it to Δh 4.3% on all 3.
- Body copy: 12px/18 mobile → 20px/30 desktop, 10px paragraph gap, w=1024
  (svc/qa) / full (team). CRITICAL: `@layer base { main :where(p) }` (app.css:310)
  pins paragraphs to a clamp(17-19px) — a DIRECT rule on <p>, so a wrapper
  `text-[..]` (inherited) is IGNORED. Needs a DIRECT hit `[&_p]:text-[12px]`
  (utilities beat @layer base). This is the app.css comment's own documented
  trap; it flattened the mobile bio from Δh 86% → 9.9%.
- Live puts ~236px(svc)/197px(qa) of whitespace between the last body para and
  the CTA (detail-page body sections are generously padded) → added lg:pb.

GATE (5 rounds, matching/out-detail{,2,3,4,5}-*): @1440 `top`+`Ready` PASS on all
3 (top 1.6-6.4%, Ready 5.4% Δh 4.3%); content regions mm 4.5-7.4%. @390 `top`
PASS on all 3. Anchors land exactly at every viewport.
DECLARED RESIDUALS (floors / stop-after-5-rounds):

- [floor-photo-pipeline] mm 4.5-15% across regions = Prismic-imgix heroes +
  team headshot vs live's webflow originals, plus text AA fringing (dE 5-11);
  positions match. Same floor as every nav page.
- [residual-mobile-spacing] title+lede region Δh @390 (svc 29.6%, qa 33.6%) +
  qa body Δh @1440 15.9%: my detail pages read slightly more compact than live's
  generously-padded ones; content + typography + order all verified matched
  (body content probe: 10-11 paras, 1964 vs 1956 chars, identical 20/30 font).
  Same "deferred mobile-spacing polish" class as yfv — would settle with a
  focused mobile pass; not a structural defect.
  Visual screenshots (matching/dt-{team,svc,qa}-{live,cand}.png) confirm
  near-identical rendering. Content parity verified. svelte-check 0, eslint clean,
  656/656 tests, prettier clean.

## SHARED FOOTER (same branch)

- CtaBand default label "Book an Appointment" → "Book Appointment" (live) — the
  detail routes render `<CtaBand/>` and must match. Home passes its own label
  (unaffected); Hero/cta.test.ts passes an explicit label (still green).
- Footer Google-map: the LEDGER's "footer omits the map" note was STALE — the
  layout already wires `<Footer showMap columns=.../>` and MapEmbed renders in
  the 3rd grid column (verified in the candidate DOM). Live uses a Webflow map
  WIDGET (not an iframe) so a `iframe[src*=maps]` probe reads false there, but
  both show the South Bay map. No change needed.

## SHARED FOOTER — geometry rebuilt from live's own rules (2026-08-04, round 8)

The footer region ("Want to learn more") had sat at EXACTLY 13.7% @390 across
19 consecutive gate runs (out-q1..q8, out-svc1..7, out-team1..6) — it had never
actually been worked, only carried. Probed live's ladder element-by-element at
390/834/1440 and rebuilt it from `matching/spec/beachfront.css` + computed
values, NOT from the strip.

DEFECTS FOUND + FIXED (all measured, all three bands):

- Row rhythm: live has TWO footer row classes with different rhythm —
  `.footer-links` (margins 12/16/20 → pitch 36/48/60) and
  `.footer-contact-info` (NO margins; the 24/32/40 line-height IS the pitch).
  We applied one uniform `gap-3` to both, so the hours/address rows ran at the
  LINK pitch (36 vs live's 24 at mobile). The tel: link is a link but belongs
  to the contact rhythm → the split is per COLUMN, not per item (`linkRhythm`).
- Make a Payment pill: h 41→38/54/66 (live's measured rects), md padding
  →200px wide, mt 8→42/33/27, mb 0→36 mobile (live puts 60px below it).
- heading→first-row gap: 10/10/30 → live's 10/32/40 (grid mt).
- map→legal-row gap: 48/48/140 → live's 84/112/140.
- **Tablet/landscape layout was structurally wrong.** Live's `.footer-cols`
  restacks by band (rules read from spec CSS): ≤479 cols 100%; 480–767 cols
  66% (stacked but narrow); 768–991 `.footer-col-3{width:66%}` so cols 1+2 sit
  SIDE BY SIDE at 33% and the map wraps below at 66%; ≥992 three across. We
  stacked everything full-width from 480–991 — the whole 480–991 range was
  wrong and no gate covered it (detail-page matrix was 1440,390 only).
- Container gutter: flat 19.5px → live's 5% (≤479) / 8% (480–767) / 48px (≥768,
  = its 1.5rem against a stepped root). At 1440 max-w-1280 still centres at 80.
- Legal row: live insets it 0.5rem of its own root (12/16/20px) and caps it at
  75% at tablet; ours was flush at x=0.

EVIDENCE — chrome-only diff (map hidden on BOTH sides, since live's map is a
same-origin JS widget and ours a cross-origin iframe):
@390 0.65% @650 0.64% @834 0.90% @1440 0.83%
matching/probe-footer-chrome.mjs; ladder probes matching/footerB{390,834,1440}.txt
— every measured gap equals live's at all three bands.

- [floor-live-embed] The footer Google map. Live = a `.gm-style` JS widget
  (same-origin, composites in a full-page capture); ours = a cross-origin
  `<iframe>`, which Chromium does NOT composite in a full-page capture (OOPIF)
  → it captures BLANK while rendering correctly in-view (proof:
  matching/states/map-inview-{ref,cand}.png). Embed PARAMETERS matched per
  Floors-4: same centre and zoom, 351×400 / 487×400 boxes. This is the entire
  residual of the "Want to learn more" region score (13.4% @390 / 7.8% @1440
  vs 0.65%/0.83% with the map excluded). Self-approvable mask, Floors 4.
- [SKILL FINDING — Tailwind grid resets] `lg:row-start-1` is NOT a reset for
  `md:row-start-2`; it is an explicit placement that claims row 1 col 1 and
  shunts every auto-placed sibling one slot right (silently reordered the whole
  desktop footer to map|links|contact; chrome diff 0.87→1.32% caught it).
  The reset is `lg:row-start-auto`. Belongs in the trap table.
- [SKILL FINDING — sparse-text regions] The tablet footer was 2-col on live and
  1-col on ours — a gross structural defect — yet the chrome mismatch was only
  1.08%, because a text-only region has very few ink pixels. A LOW mismatch on
  a sparse region proves nothing; read the diff image. Belongs in the trap table.

## DETAIL TEMPLATES + SHARED CHROME — round 8→16 (2026-08-04)

Gate: page-diff @1440,390, threshold 0.10, NO masks, not truncated
(matching/out-r10-{team,svc,qa} = the final run, 02:46–02:47Z).
RESULT: 27/30 detail-template regions PASS. The 3 remaining fails are the same
region on all three pages — "Want to learn more" @390 — which is the footer's
live-embed floor (below).

FIXED THIS ROUND (each measured off live, then read back computed):

- Shared NAV: `.header-logo` is 2rem of live's stepped root = 48/64/80px and
  `.header-hamburger` 1rem = 24×19 / 32×25 / 40×31. Only the desktop 80/40 had
  ever been matched — the mobile bar carried an 80px logo (67% too big) and a
  40px burger on EVERY page. Bar gutter 24 → live's 20/48/60. The burger's
  a11y min-w-11 tap target was centring the glyph 10px inboard of live's right
  edge → justify-end (keeps the 44px target, restores live's x at all three).
- Shared FOOTER: see the previous ledger section (row rhythm, pill rect,
  tablet 2-col restack, gutters, legal row).
- DETAIL md TIER (768–991) had never been calibrated — live is FLAT across the
  whole band and we were wrong on every value: hero name 44/52 → 28/38, crumb
  30/40 → 21/26, body 12/18 (team) → 16/24, service title 56/70 → 72/80,
  question title 50/60 → 100/120, section gutter 20 → 48.
- team role ("Dentist"): 24/32 → live's 16/24 from 390 through 991 (the 8px
  error pushed every bio paragraph out of register; region 12.9% → 6.0%).
- team HEADSHOT: live's `.member-page-headshot` is `8rem` + `bottom:-2rem`
  against the stepped root with two narrow-band overrides = 96/144/256/320 and
  -14/-14/-64/-80; positioned by a left offset that lands on 64.2% of the
  viewport at every breakpoint. Ours was 130px at ≤991 and right-anchored.
  Also `object-position: 50% 0%` (headshots crop from the top) and NO white
  ring — live's rule has no border. Region `top` @390 12.3% → 3.1%,
  @1440 6.2% → 1.1%.
- BODY `<strong>`: rendered w400, live w700. Tailwind Preflight sets
  `strong { font-weight: bolder }`, and `bolder` against the body's 300 resolves
  to 400 — NOT bold. Needs an explicit `[&_strong]:font-bold`.
- BODY sub-heading spacing — the round's subtlest find. The blank line above a
  webflow sub-heading was authored TWO ways, and the migration dropped both
  (live's `.w-richtext` children, matching/probe-body-dom.mjs, 5 documents):
  services use a STANDALONE empty <p> (dental-exams 2, implants 2, whitening 8;
  trailing <br> in a paragraph: 0 across all four) = 38px of whitespace;
  questions use a trailing <br> INSIDE the previous paragraph (4 on the sampled
  Q&A) = 28px. The old code reproduced BOTH as a `\n`+ZWJ appended to the
  previous paragraph, which is the QUESTIONS mechanism — right for Q&A (7.5%),
  wrong for services, where it made the paragraph 23 lines vs live's 22 and put
  every later line 10px out of register (region stuck at 10.2%).
  Now: DetailParagraph tags bold-only paragraphs from the node's real span
  offsets (CSS cannot — `strong:only-child` ignores text nodes) and DetailBody
  spaces them per template via `subheadingGap`, stepping with the line-height
  (18/24/30): break = lh+10, block = 10+lh+10.
  svc "What to expect" 10.2% → 7.3% @390 and 3.7% → **0.0%** @1440;
  qa @1440 2.0% → 1.8%.

DECLARED RESIDUALS:

- [floor-live-embed] "Want to learn more" @390 13.4/13.4/12.8% — entirely the
  footer Google map (Chromium does not composite a cross-origin iframe in a
  full-page capture; live's is a same-origin JS widget). Chrome-only diff with
  the map hidden on both sides: 0.65% @390, 0.83% @1440. Self-approvable mask
  per Floors 4; left UNMASKED in the run above so the number is disclosed.
- [residual] qa body carries ~4px of drift below its `<ol>`, because live's
  list also ends in a trailing <br> that a paragraph-level rule can't model.
- [ACK-REQUIRED — content, not render] The blank-line COUNT varies per document
  (services/dental-cleanings has 0 empty blocks), so no component rule is right
  everywhere. The real fix is to carry live's blank lines into the Prismic docs
  — a seed re-run + a publish by Tucker. Flagged, not guessed at.
- [SKILL FINDING — harness] Running `npm test` (playwright) CONCURRENTLY with a
  page-diff sweep starved the capture: svc "Ready for great" @1440 read 30.1%
  in that run with the CTA beach photo simply absent from the candidate frame,
  and returned to 3.5% on a clean re-run. Gate sweeps must run alone.

NO REGRESSION on the six nav pages: out-r10-{home,yfv,our-team,services,atd,
contact} are byte-identical to the pre-round sweep (out-verify-*) except the
footer-driven "Ready for great" regions, which IMPROVED 22.9% → 21.9% @1440 and
18.1% → 17.4% @390. Those pages' large residuals are the pre-existing
content/assembly gaps documented in matching/PAGES.md (unpublished Prismic
migration), untouched by this round.
Verification: 656/656 unit, 8/8 playwright, svelte-check 0 errors, lint clean.

### Addendum — style-census sweep (Phase 6), same round

Re-running the cheap gates after the fixes caught two SHARED-CHROME defects the
pixel gate is structurally blind to (small text, no layout shift):

- "Read Reviews" label line-height: live uses the unitless ratio **2.75**
  (38.5 / 41.25 / 55 / 68.75 px). Ours hard-coded px and was 18px short at
  mobile and 14px short at desktop.
- CTA beach caption ("FIJI ISLANDS"): live uses **1.15** (11.5 / 17.25 / 23 /
  28.75). Ours was 6px short at desktop.
  Both now match live at 390/480/767/834/1440 (matching/probe-cta-labels.mjs).

FINAL GATE STATE (matching/out-final-*, run alone, threshold 0.10, no masks,
not truncated; reference index.html sha256 re-verified UNCHANGED
e9ef1363…d11d7a52):

- detail templates 27/30 regions PASS — the 3 fails are all
  "Want to learn more" @390 (the footer map embed floor, 0.65% on chrome).
- svc "What to expect" @1440 = 0.0%, team "Dentist" @1440 = 0.0%.
- 6 nav pages: 0 regressions vs the pre-round sweep; their remaining failures
  are the pre-existing content/assembly gaps in matching/PAGES.md.
- style-census residuals now 5 rows/viewport, all documented classes: the pill
  `line-height:0` deviation ×3, the ACK'd footer AA colour, and a crumb
  markup-shape artifact (live splits "Services" and the category into separate
  elements; ours is one string at the identical 20/26 slab — pixel-verified by
  `top` 3.1%/0.6% PASS).
- text-diff exit 0 (clean) on all three templates at 1440 and 390.

## SYSTEMIC — live's root-font ladder is OFFSET BY 1px from its class breakpoints

Read straight from live's source (matching/spec/index.html inline <style> and
matching/spec/beachfront.css), confirmed by measuring the root at 14 widths:

root font-size: html{40px} @media(max-width:992px){32px} @media(max-width:768px){24px}
Webflow CLASS breakpoints: max-width 991 / 767 / 479 (the ONLY widths in beachfront.css)

So the root has just THREE values — 40px >=993, 32px 769-992, 24px <=768 — and
the two ladders disagree by 1px at 768 and at 992. That produces two DEGENERATE
1px-wide states on live:

- at exactly 768: root 24 with the >=768 class layout (page 7769px vs 9338px at 769)
- at exactly 992: root 32 with the >=992 class layout
  NEITHER can be reproduced with a fixed root, and neither should be chased.

CONSEQUENCE — this is the root cause of the whole tablet band being wrong:
our md tier is 768-991, and anything calibrated by measuring live at EXACTLY
768 picks up root 24, but the band it governs (769-991) runs at root 32. Every
rem-derived value calibrated that way is 3/4 of live's — equivalently, the
correct value is 4/3 of what was measured at 768.

RULE for this project: calibrate the md tier at 834 (or any 769-991 width),
NEVER at 768. Calibrate lg at 1200/1440, never at 992. The detail-page md work
committed in 474f4d9 was calibrated at 834 and is therefore correct (its
md:px-[48px] = 1.5rem x 32 checks out); the home/QA-card md values were
calibrated at 768 and are 4/3 short — itemised in the round below.
Belongs in the matching-a-page trap table.

## GATE-SURFACE BUG — the dev CSP was blocking live's image CDN

`/dev/match/<uid>` renders the canonical assemblies with LIVE's own image URLs
(cdn.prod.website-files.com) so the gates can run without a Prismic publish —
but `img-src` in svelte.config.js never allowed that host. Every subpage hero
photo was therefore CSP-BLOCKED and the gate was diffing a black band against
live's photograph. That is what the 49-76% `top` regions on our-team / services
/ ask-the-doctor actually were: not a layout defect, a blocked image.
Fixed by allowing the host in DEV ONLY (`NODE_ENV !== "production"`); production
serves Prismic-hosted copies, so it cannot ship. With the photo painting, the
same region also exposed a REAL defect underneath it — live anchors these hero
photos `background-position: 0 100%` (left-bottom) while ours centre-cropped, so
at 1440 we showed a slice 200px higher than live (hillside where live has the
shoreline and lifeguard tower).
our-team `top`, measured at the same threshold, no masks:
1440 58.7% -> 17.8% 834 76.3% -> 18.9% 390 69.8% -> 20.5%
The residual is the documented photo-pipeline floor (our imgix re-export vs
live's webflow original).
LESSON for the trap table: when a whole region reads 50-80% and its Δh is ~0,
suspect a BLOCKED or missing asset before suspecting layout — geometry that
wrong would move the height too.

## OVERNIGHT ROUND CLOSE (2026-08-05) — 52/138 -> 83/153 regions

Full sweep `matching/out-final-*`, 9 pages x 1440/834/390, threshold 0.10, NO
masks, no truncation. Per-page baseline -> final:
home 9/27->17/27 · our-team 6/15->10/15 · contact 5/12->9/12 ·
services 1/15->4/15 · atd (gate hard-failed)->7/15 · yfv 2/24->5/24 ·
team-detail 10/15->12/15 · svc-detail 9/15 · qa-detail 10/15
Reference index.html sha256 re-verified UNCHANGED at close.

DECLARED FLOORS confirmed this round:

- [floor-photo-pipeline] subpage hero `top` regions settle at 17-29% unmasked;
  with --mask-photos ask-the-doctor's `top` drops 40-48% -> 3.9-6.6%, which
  confirms the residual is the Prismic/imgix re-export vs live's webflow
  original, not geometry (Δh is 0 on our-team at all three viewports).
- [floor-live-embed] footer "Want to learn more" 12.0-12.9% at 834/390 — the
  cross-origin map iframe, unchanged and already evidenced at 0.65% chrome.

OPEN / ACK-REQUIRED:

- [ACK-REQUIRED — unexplained] ask-the-doctor's 40-card grid stays at 78-81%
  WITH --mask-photos while its geometry matches live exactly (349x320 cards,
  2 columns, 40 cards in live's order, Δh 1.4-2.2%). dE 34 means a large-area
  COLOUR delta, not layout. Both sides' card gradients were probed and match at
  1440 and 390 (and the 834 tier was fixed this round). Cause not established;
  NOT guessed at. Needs a focused round.
- [regression - disclosed] 8 regions moved 1-15pp the wrong way vs baseline
  (home Your Path/Serving @834; yfv Dr. Robert Quan @1440 and "To be a long
  term health partner" @834/@390; services General Dentistry @1440/@390;
  contact Book Appointment @834). All were ALREADY failing; none flipped a
  passing region. They are knock-on shifts from the shared wave/CTA geometry
  landing on sections whose own geometry is still wrong — those pages each
  still carry 9-15 open findings.
- [content] The closing-CTA heading now carries live's hard line breaks
  ("Ready for <br/>great dental <br/>health?"). This is CONTENT and will ship
  to Prismic on the next seed run — flagged for the operator.
- [PRISMIC, not curated] person.teaser (11 docs), news_article.summary (34 of
  40), collection_item labels + ordering (3 docs). Deliberately NOT hardcoded
  despite the curate-and-flag latitude: each is authored CMS copy and the
  operator should see the list before it is pinned into the assemblies file.

## CMS CONTENT ROUND (2026-08-05) — the four authored fields, modelled not pinned

Operator direction: "fix the content gaps right, those data should be modeled in
and served from prismic". Superseded the "curate in beachfront-pages.js + flag"
call from the overnight round.

MODELLED (customtypes/*/index.json + src/prismicio-types.d.ts):
person.teaser Text /our-team card excerpt
person.order Number editorial roster order
news_article.summary Text Ask-the-Doctor card copy
news_article.home_order Number home featured row, 1 = hero card
collection_item.link_label Text services-panel link wording
collection_item.order Number position within its category panel

EVIDENCE that each is genuinely AUTHORED, not derivable:

- person.teaser — 9 of 11 are a prefix of `body` but every cut point differs
  (74/90/75/64/83/98/92/93/89/75/88 chars, no char, word, or sentence rule
  fits); linda and michelle do not match the body at all.
- news_article.summary — 18 of 40 are not a prefix of `body`.
- collection_item.link_label — this was NOT a wrong title. Live's panel prints
  "dental veneers" while /services/dental-veneers prints h2 "Dental Veneers",
  both at text-transform:none (probed). 8 detail-page titles checked against
  ours: all 8 identical. So live carries a SECOND authored label, which is why
  three read differently outright: oral-cancer-dentistry -> "oral cancer
  screening", mi-paste -> "Mi paste / Mi Paste plus", nitrous-oxide ->
  "Nitrous oxide (n2O)".
- collection_item.order — Prismic's document order matches live's panel order
  in NONE of the four panels.
- news_article numbering NEEDS no field: date-desc position reproduces live's
  01-40 exactly, verified for all 40. Left derived.

DELETED from the templates (were pinned-by-uid maps): QuestionList `TEASERS`
(6 entries) and `FEATURED_UID`/`CURATED_UIDS`; CollectionList `TEAM_ORDER`.
Each render site now reads the document and keeps the old derivation as the
fallback for an unfilled field, so the slices still work on other sites.

PAYLOAD + MECHANISM:

- src/lib/beachfront-entities.js — machine-transcribed from live by
  matching/gen-entities.mjs (no value typed by hand). 11 + 40 + 24 entries.
- scripts/seed-entity-content.mjs — stages all three types into the Migration
  release. `--dry-run` verified: 75 documents, 5 beach assets already in the
  library. NOT RUN for real — awaiting the operator's publish.
- [deviation] scripts/seed-person-gallery.mjs was FOLDED INTO the above and
  deleted. Reason: the Migration API's PUT replaces a document and the staged
  version cannot be read back (GET /documents 403s at the gateway with the
  write token — probed both with and without pagination params), so two
  scripts writing `person` would each drop the other's fields depending on run
  order. One script per type is now a documented rule (docs/migration.md).
- src/routes/dev/match/[uid] fills only fields that arrive EMPTY from the same
  module, so the gates measure the post-publish render and the patch becomes a
  no-op the moment the release is published.

GATES:

- text-diff our-team/services/atd/home at 1440 and 390: every residual row is
  one of the four documented artifact classes — off-canvas nav (negative y),
  the Google map iframe's internals ("find us here!" is injected by the embed;
  it does not appear anywhere in matching/spec/index.html), live's <br>-split
  home step labels, and our deliberate skip link + carousel live-region text.
  ZERO entity-content rows remain.
- page-diff full sweep `matching/out-cms-*` vs `out-final-*`: 83/153,
  **0 regressions**. Improvements where the content changed: services Cosmetic
  Dentistry @1440 8.9->8.3, contact Book Appointment @834 20.1->18.8, our-team
  Dr. Robert Quan -0.1/-0.2 at all three viewports. The services panels' own
  mm is dominated by geometry (dh 60-70% at 834), so the label/order fix is
  invisible there until ServiceCategoryBand's card ladder is fixed.
- [deviation - a11y] Our card images keep their CMS alt text (person names,
  question titles) where live ships them undescribed; text-diff's ALT TEXT
  section shows this as ours-only. Deliberate: the alt is real CMS content and
  live's omission is a defect, not a target. Does not affect any exit code.

## GEOMETRY ROUND 1 (2026-08-05) — home 17/27 -> 19/27, 0 regressions

Three systemic findings, all read from live's own stylesheet, all confirmed by
two consecutive SETTLED probe reads:

1. [fixed] `.heads{width:5rem;height:5rem;margin-right:1rem}` has NO media
   override, so against live's stepped root the team row is 200/160/120px with
   40/32/24 gaps. Slider only had desktop+mobile tiers keyed at 768, so the
   whole 768-991 band rendered the 200px DESKTOP cell. Added tablet (768-991)
   and xs (480-767) tiers to Slider; every new prop falls back to its desktop
   counterpart so existing callers are unchanged.
   MEET YOUR TEAM @834: 45.9% -> 0.8% -> PASS after the holder margin.
2. [fixed] `.expanding-text{opacity:0}` flips to 1 only at `max-width:767px` —
   so live's click-to-expand card is the treatment for the ENTIRE 768+ range and
   the always-visible-copy card is phone-only. SectionGrid split at 992, so
   768-991 rendered the phone card: body copy live hides, and no "+" control.
   Also `._w-half` on the h1 (50% of the content column, full only <=767) and
   the 16rem/14rem card box. "Finally have a dentist" @834: 43.0% -> PASS,
   with every card box now byte-identical to live at 1440/834/390.
3. [fixed] The home services band is sized in rem off the same stepped root:
   `.h-8...my-3` rows are 2.5rem tall (100/80/60) with .75rem margins, and
   `.button` is padding 1.3em on a 25/20/15px font => 67/54/41px. Ours held the
   <=767 values all the way to 991. "Our dental team in Redondo" @834:
   27.0% -> 10.3%.

[reverted - my model was wrong] Applying live's `.home-healthy-mouth-section
{padding-bottom:1.5rem}` with no padding-top, `.home-ssb-section{margin-bottom:
1.5rem}`, and `.home-ask-the-doctor-section{margin-top:8rem}` (<=479) took home
from 19/27 to 15/27 (Your Path regressed at all three viewports, Redondo @390
9.1% -> 22.3%). The RULES are right — I read them from the stylesheet — but our
sections' CONTENT heights differ from live's (ssb -8 @834 / +176 @1440; healthy
-30 @834), and the old empirical padding was absorbing that. Reverted; the
content-height error is the real defect and has to be found first. Kept the
md/lg atd overlap tiers, which were neutral.

[HARNESS - important] The probes were reading UNSETTLED rects on BOTH sides.
matching/probe-anchors.mjs now waits for `document.getAnimations()` to have
nothing running, then re-reads; two consecutive reads must agree. The polluted
reads had "Your Path" at -162 where the settled value is -258 and "Beyond the
Smile" at -53 where it is +43 — i.e. they had the SIGN wrong. Any conclusion
drawn from a probe without that settle is worthless.

## GEOMETRY ROUND 2 (2026-08-05) — services 4/15 -> 6/15

`.service-block{width:15rem;height:16rem;margin:2rem .5rem}` with `height:19rem`
at <=991, `17rem` at <=767 and `width:13rem` at <=479 — so live's card is
600x640 / 480x608 / 360x408 / 312x408 and we were rendering the <=479 card
(312x408) at every width below 992. Same root-font-ladder class as round 1.
Also from live's own rules: `.service-grid.my-8` tracks are 16rem (640/512/384)
and only two-up at >=992; `.service-block-teef` is 2.5rem at top:-1.25rem
right:1.5rem (100/80/60); the panel label `h6.services-links` is 14/9/7px.
Cosmetic Dentistry @834 32.4% (dh 60.9%) -> PASS, @390 15.1% -> PASS.
Our card box now matches live exactly at 1440/834/390 (480x608 at x=177 @834).

[verified, NOT changed] The panel label really is **7px** at <=767 — a value
that looks like a typo. Live's h6.services-links measures 14px/38.5 at 1440,
9px/24.75 at 834, 7px/19.25 at 390. Only the tablet step was missing.

[reverted - my model was wrong] Adding the last row's trailing margin to the
grid's padding-bottom (+40/32/24) improved General Dentistry's dh (15.0->10.0
@1440) but made mm WORSE (28.8->31.4). The extra rows are live CONTENT, not
blank space, so growing our region only widened the compared area over a
mismatch. The region's real defect is inside it, not below it.

## GEOMETRY ROUND 3 (2026-08-05) — your-first-visit person slider

[CORRECTS AN EARLIER LEDGER ENTRY] The 2026-08-04 round recorded that "the yfv
Meet-Our-Team SLIDER uses a different ladder — do not copy the grid's tiers onto
it". That is wrong. `.team-list-item.m-2` is ONE element; the slider adds
`.display-inline`, which overrides the width at the two EXTREMES only:

> =992 grid 8rem (320) vs slider 8.5rem (340)
> <=479 grid 100% x 16rem (303x384) vs slider 10rem x 18rem (240x432)
> Between 480 and 991 they are byte-identical (16rem x 24rem = 512x768 @834).
> Gating the tablet tiers off for the slider therefore left it rendering the PHONE
> card across the whole band and cost `.fv-meet-our-team-section` 846px of height
> at 834 (live 1416, ours 570). Replaced the boolean with a `variant` prop.

Measured live's slider (settled, two agreeing reads): card 340x480 / 512x768 /
240x432, pitch 426.67 / 640 / 288, first card x 123 / 161 / 75, heading
120/140 from 768 UP (only <=767 steps to 56/70), section margin-bottom 3rem.

yfv Dr. Robert Quan: 47.1 -> 43.4 @1440, 51.6 -> 37.8 @834 (dh 39.2 -> 19.9),
30.1 -> 29.5 @390. /our-team unchanged at 10/15 — the shared card is safe.

- [regression - disclosed] Office Tour @834 42.2% -> 48.7% (dh 54.7 -> 41.5).
  That region ENDS at the "Dr. Robert Quan" anchor, so moving the team section
  to its correct position lengthened it. The Office Tour slider itself is still
  718px short of live at 834 (live 1732, ours 1014) — that is the real defect
  and the next thing to fix, not a reason to put the phone card back.

## THREE-STRIKE ESCALATION (2026-08-05) — presented, not re-attempted

Operator asked how to enforce the skill's discipline. Built the enforcement
(repo CLAUDE.md rules 1-4; matching/strikes.mjs; matching/gate.sh SPEC
preflight) and ran the stall detector over the full out-*/report.json corpus.
It independently surfaced the regions below. Per the skill's 3-strike rule these
are PRESENTED, not given a fourth attempt, and NOT masked/rethresholded.

Caveat recorded up front: report.json cannot store intent, so strikes.mjs counts
any gate run in which a region was still failing and did not improve. It is a
STALL detector (upper bound on attempts), not a literal attempt counter.

1. yfv `top` — 76.2% @834 / 71.6% @390 / 44.7% @1440, BYTE-IDENTICAL across 6
   runs. Identical to the tenth of a percent means no attempt ever landed on it;
   the 6 runs were aimed at other regions of the same page. Diagnosis already
   exists and was never applied: live's `.hero.group-photo` has its OWN height
   ladder (60vh max 60vw >=992 / 70vw max 100vw <=991 / 80vh max 70vw <=767 /
   95vw <=479) and ours uses the shared `.hero.redondo` ladder. This is
   diagnosed-but-unapplied, not unexplained.

2. yfv `Office Tour` — 48.7% + dh 41.5% @834, flat across 6 runs. Live's
   section is 1732px at 834, ours 1014px: 718px short. Same class as above —
   known shortfall, never worked.

3. atd `Beyond the Smile` — 79.1% @1440 / 79.3% @834 / 82.7% @390. This is the
   one that is genuinely unexplained, and the bisect CONTRADICTS this ledger's
   earlier conclusion.

   Full @1440 history (mm / dE / dh):
   out-atd-r1 64.3% 26.9 22.7%
   out-atd-r3 64.9% 24.0 22.7% (neutralize-media)
   out-atd-r4 77.3% 30.2 3.5% <-- height FIXED, pixels got WORSE
   out-atd-r6 77.5% 34.4 3.5%
   out-atdcheck 79.1% 35.5 2.1%
   out-cms-atd 79.1% 35.5 2.1%

   The earlier entry concluded "dE 34 means a large-area COLOUR delta, not
   layout." The r3->r4 transition argues the opposite. If the 40 cards were
   individually correct, closing the height gap should IMPROVE the overlap
   score; mismatch rising monotonically as dh falls is the signature of a
   vertically OFFSET grid, where each card is compared against a different
   card. Card gradients vary card-to-card, so a one-row offset presents exactly
   as a large-area colour delta.

   HYPOTHESIS (untested, do not treat as fact): the grid's first-card y inside
   the region differs between live and ours, and the previously-probed
   "geometry matches exactly" checked card DIMENSIONS (349x320, 2 cols, 40 cards
   in order) but never checked the first card's OFFSET or row-for-row
   alignment. Test = probe the y of card 01 relative to the region top on both
   sides, then card 03/05 to confirm pitch, BEFORE touching any colour.

   Superseding note: the earlier "cause not established; NOT guessed at" entry
   stands as honest, but its stated conclusion (colour, not layout) should be
   treated as UNSUPPORTED pending the offset probe above.

### atd "Beyond the Smile" — RESOLVED as a GATE-SURFACE BUG (2026-08-05)

The offset hypothesis above is CONFIRMED, and the cause is not colour, not the
grid, and not ours-vs-live rendering at all. Probe: matching/probe-atd-offset.mjs
(selectors READ FROM matching/spec/ask-the-doctor.html, not guessed — the first
version of the probe climbed the DOM heuristically, landed on a 1440x10547
page wrapper, and produced garbage; recorded as a harness lesson).

Grid internals are IDENTICAL at 1440:
row pitch live 520 ours 520
cell height live 520 ours 520
card height live 400 ours 400
grid absolute y live 555 ours 555 <-- same place on the page
card width live 600 ours 620 <-- the one real defect, +20px

Every cell is offset -220px RELATIVE TO THE REGION TOP while sitting at the same
ABSOLUTE y. So the anchor moved, not the content. Resolving the anchor element:

live: <div class="qa-text"> y=636 h=320 "beyond the smile: ...healthrout"
<h5 class="qa-question"> y=856 h=80 "beyond the smile: ...health"
ours: <h3 class="absolute bottom-3 left-[4%] ..."> y=855 h=80

page-diff cuts at the FIRST document-order element whose collapsed text starts
with the anchor. Live has a `.qa-text` WRAPPER (question + teaser, 320 tall)
that our card lacks, so live cuts at 636 and we cut at 855. The two pages have
been cut 220px apart for every atd run in the corpus. The 79-83% mismatch and
dE 34 are the arithmetic consequence of comparing offset windows.

CORRECTION: the earlier ledger conclusion "dE 34 means a large-area COLOUR
delta, not layout" is WRONG, and so is my own "vertically offset grid"
refinement of it — the grid is not offset, the CUT is. Both entries stand as
recorded process; both conclusions are superseded by this one.

Also note our question <h3> is ABSOLUTELY POSITIONED (`absolute bottom-3
left-[4%] w-[92%]`) where live's `.qa-question` is in flow inside `.qa-text`.
That is a genuine structural divergence from live and is the actual fix: mirror
live's `.qa-block > .qa-text > (.qa-question + teaser)` flow structure. Doing so
fixes the DOM and the gate cut together. Deferred to the spec-driven atd round
so it is done against the Phase 1 spec rather than patched blind.

STILL OPEN after this: card width 600 vs 620 (+20px).

### ANCHOR PARITY SWEEP (2026-08-05) — 4 gate anchors measure the wrong windows

New instrument: matching/probe-anchor-parity.mjs. After the atd finding above,
checked EVERY gate anchor on all 9 pages for whether page-diff's cut lands on a
structurally comparable element on both sides.

First pass flagged 26 anchors by tag difference — too noisy to act on. What
actually breaks a region comparison is the cut element CONTAINING different
content, which shows as a HEIGHT RATIO, not a tag difference: live using <div>
where we use <footer> for the same ~710px block is cosmetic; live wrapping a
heading in a 320px `.qa-text` where we cut at the 80px heading is fatal.
Re-flagged on ratio >= 1.5x. Honest count: 4.

atd "Beyond the Smile" <div.qa-text> h=320 vs <h3> h=80 4.0x
svc "Back to All Services" <div> h=66 vs <div> h=146 2.2x
qa "Have another question" <section> h=67 vs <div> h=106 1.6x
home "Beyond the Smile" <div> h=120 vs <h3> h=80 1.5x

Consequence: those four region scores are arithmetic on misaligned windows and
must NOT be treated as rendering defects until the cut is comparable. atd and
home share ONE root cause (the QuestionCard structure — our question <h3> is
absolutely positioned where live's `.qa-question` sits in flow inside
`.qa-text`), so one structural fix corrects both.

Also recorded: on the first sweep all four `svc` anchors came back UNRESOLVED on
live; a re-run resolved them normally. That was a transient load failure, not a
missing anchor. Worth remembering before anyone "fixes" an anchor on one bad
read — the skill's own hard-fail-on-unresolved rule assumes the fetch succeeded.

The footer anchor "Want to learn more" cuts at <div.footer-info-section> on live
and <footer> on ours, 714 vs 702px — comparable, NOT a problem. Recorded because
it looks alarming in a tag-only diff and will otherwise be re-investigated.

## SPEC-DRIVEN ROUND 1 (2026-08-05) — home 19/27 -> 21/27

First round run under the new discipline: Phase 1 spec written FIRST
(matching/SPEC.md, 10,717 lines, 1,315 citations, built from
matching/spec-sections/ by matching/build-spec.mjs), every fix citing a line.

FIXED — the review band (`.home-ssb-section` / `.review-slider-holder`):

- heading bottom margin `.mb-8` = 2rem (beachfront.css:3998-4000) -> 80/64/48.
  We had a flat 48. NB `.mb-8` also carries `font-size:1rem` inside the <=991
  block (:7972-7974), so this heading is 60/32/24 — our sizes were already
  right, only the margin was wrong.
- `.review-slider-holder` margin-top is TABLET-ONLY: 4rem in the <=991 block
  (:8338), reset to 0 at <=767 (:8940), NO rule >=992. Ladder = 0/128/0. This
  was the single biggest missing value (128px at 834).
- `.review-slider-holder-viewport` 15rem x 12rem (:7586) -> 600x480 / 480x384;
  `height:auto` at <=479 (:9512); holder `padding-bottom:.5rem` (:9508) = 12.
- `.big-review` `margin-bottom:2rem` at <=479 (:9349-9353) = 48 — this is what
  makes live's mobile viewport 310 (card 262 + 48). We had none.
- Removed our container's py-16/pb-9: live's `.content-width` has no vertical
  padding in this section.

RESULT home: Serving @834 mm 5.5->1.8 dh 15.5%->2.4% PASS · @1440 mm 4.9->0.6
dh 7.2%->2.0% PASS · @390 dh 1.1->1.9% PASS. All three PASS. Downstream anchor
drift at 834 collapsed: Your Path -104->-16, Redondo -122->-34, Beyond -102->-14.
Page 19/27 -> 21/27. 665 unit tests pass, svelte-check 0 errors.

TWO MISTAKES MADE AND CAUGHT BY THE GATE (recorded, not hidden):

1. Added live's h1 `margin-top:20px` (:2106) as a wrapper margin. WRONG —
   `.content-width` has no padding, so on live that margin COLLAPSES out of the
   section and lands in the gap above; live's anchor therefore sits at the
   section's border-box top. Reproducing it as a wrapper margin double-counted
   it, pushed our anchor 20px down, and because page-diff cuts AT the anchor it
   shortened the region from the top: Serving @834 dh 15.5% -> 18.5%, page
   19->18/27 (matching/out-spec1-home). Reverted.
2. Put the `.home-ssb-section` margin on the SHARED Carousel slice. That class
   exists on index.html ONLY (grep: your-first-visit.html has
   `.review-slider-holder` with no section wrapper), so it leaked 36-60px onto
   yfv. Now gated behind `primary.layout === "home"`.

DISCLOSED REGRESSION — yfv `Serving the South Bay` @834 dh 2.6% -> 12.2%, PASS
-> FAIL (yfv 5/24 -> 4/24). Not masked, not rethresholded. The same round
IMPROVED that region's pixels everywhere (mm @1440 5.8->0.7, @834 5.2->2.0) and
its height at the other two viewports (@1440 dh 30.5->18.6, @390 17.4->13.4).

OPEN QUESTION behind it (measured, cause NOT established — do not guess):
live renders this identical slider markup SHORTER on yfv than on home —
live home 661 / 573 / 451 (1440 / 834 / 390)
live yfv 632 / 550 / 446
ours 685 / 581 / 461 (same component on both pages)
A 29 / 23 / 5 px per-page difference on live with no per-page class other than
`.home-ssb-section` (which is a MARGIN, outside the section box). Until that is
explained, a single shared component cannot match both pages, and forcing yfv
by hand would be exactly the uncited empirical patching this round exists to
stop. Next step is to diff the two documents' review-section markup, not to
tune a number.

### RESOLVED — live's yfv review section is 29/23/5px shorter because of CONTENT

The open question from the round above is closed, and it was not a rule.

Dumping the direct children of `.content-width` inside the review section on
both LIVE pages (matching probe /tmp/probe-kids.mjs, settled):

live home `.home-ssb-section` secH 661 @1440 / 573 @834 — THREE children
<h1 .text-align-center.mb-8> h 72 m 20/80
<div .review-slider-holder> h 480 m 0/0
<div .display-flex.flex-align-…> h 69 m -40/120 <-- Read Reviews row
live yfv `.fv-review-section` secH 632 @1440 / 550 @834 — TWO children
<h1 .text-align-center.mb-8> h 72 m 20/80
<div .review-slider-holder> h 480 m 0/0

632 = 72 + 80 + 480 exactly. Home adds the Read Reviews row at -40 margin-top,
giving 661. The holders are BYTE-IDENTICAL on the two pages at all three
viewports (1280x480 mt=0 / 738x384 mt=128 / 351x322 mt=0 pb=12), which is what
proved the difference was content and not the tablet margin I had suspected —
and it independently CONFIRMS that the global `.review-slider-holder`
`margin-top:4rem` (:8338) applies on both pages, so that fix was right.

`.fv-review-section` has NO rule anywhere in beachfront.css — it is a bare hook.
Both documents contain the string "Read Reviews" exactly once, so a text grep
does NOT distinguish them; on yfv that occurrence is in the footer CTA. Only a
child-level DOM dump separates them.

FIX: the Read Reviews row is gated behind the same `layout === "home"` flag as
the section margin, and its own ladder corrected to live's measured
-1rem/3rem against the stepped root: **-24/72 · -32/96 · -40/120**.

RESULT — home 21/27 (held), yfv 5/24 -> **7/24**. Serving now PASSes on BOTH
pages at all three viewports with no height failure:
home mm 0.6 / 1.8 / 4.7 yfv mm 0.6 / 1.9 / 5.0
The disclosed yfv regression from the previous round is therefore CLEARED, not
carried.

ONE MORE SELF-INFLICTED ERROR, caught by the gate: I first wrote the row's
ladder as `-mt-10 mb-30` in the BASE tier — i.e. put the desktop value where the
mobile value belongs. Home @390 dh went to 8.0% and the page dropped 21->20.
This is the two-tier trap inverted, and it is worth noting that writing the
ladder out as three explicit values is what made it obvious.

### contact — fix list APPLIED and REVERTED (2026-08-05). Values right, DOM wrong.

Applied all 8 geometry items from matching/fix-lists/contact.md. Every value was
re-verified against the stylesheet by hand before applying, and every one held:
.info-section margin-bottom:35px, NO padding :6589-6591 VERIFIED
._w-40pc / .su-w-full-tablet 40% -> 100% at <=991 :3530, :8215 VERIFIED
.footer-contact-header 20 base / 16 at <=991 / 16 at <=479 :6337,:8130,:9240 VERIFIED
.footer-contact-info 20 base / 16 at <=991 / 12 at <=767 :6345,:8130,:8699 VERIFIED
.button.text-color-primary-dark margin-bottom:60px <=767 :8636-8638 VERIFIED
.mr-8 + .pr-8 = 2rem each -> 160/128/96 inter-column :3961,:4219 VERIFIED

RESULT: contact 9/12 -> 7/12. Book Appointment @834 mm IMPROVED 18.8% -> 14.3%
but its dh went 2.0% -> 6.1%, and @390 went PASS -> FAIL (12.3%). Reverted;
re-gated at 9/12 to confirm restoration (matching/out-spec8-contact).

WHY THIS MATTERS more than the score: every value was source-correct and the
page still regressed. That is the same signature as the yfv review section
earlier today — live's RULES landing on a DOM whose COMPOSITION differs from
live's, so the rules compose into different totals. There, the cause turned out
to be a third child element present on one page and absent on the other, and it
was only found by dumping the direct children of the container on both sides.

DO NOT re-apply these values until that structural diff is done for
`.info-section`: dump its direct children on live and ours at 1440/834/390 and
reconcile the CHILD LIST first. Stopped at 2 attempts rather than making a third
blind pass.

HARNESS LESSON for the fix-list workflow: a subagent fix list can carry real,
openable line numbers and still be unsafe to apply, because a correct rule is
not the same as a correct RESULT. Fix lists must include a child-list diff of
the container, not just per-property citations. The contact list's own
"Collapse check" and "Shared-component check" fields were both answered
correctly and neither could have caught this.

## SPEC-DRIVEN ROUND 2 (2026-08-05) — the shared hero-gradient bug: +6 regions

Two independent fix lists (services, our-team) landed on the SAME shared
component, SubpageHero, and together they explain three pages' `top` regions —
including services `top`, which strikes.mjs had flagged as stalled for 3+ runs.

THE BUG: `SubpageHero` painted BOTH of live's hero gradient divs, unconditionally,
using the `.dark` bottom stop, on every subpage. Counting the divs in the saved
documents settles what live actually does:

document top bot bot.dark
index.html 1 1 0
our-team.html 1 1 0
ask-the-doctor.html 1 1 0
your-first-visit.html 1 1 0
contact-us.html 1 1 1 <-- the ONLY .dark
services-live.html 0 0 0 <-- the ONLY page with NO wash

So we were wrong in two different ways at once:

- `/services` gets NO wash at all. Its entire hero is
  `<section class="hero redondo"><div class="bot-wave">…</div><h2
class="subpage-hero-heading">Services</h2></section>`
  (matching/spec/services-top.html). We were painting ~half the region cyan at
  dE 40-90.
- Every page except contact-us uses the BASE bottom stop
  `.hero-bot-gradient` = `linear-gradient(#0000,#129ecccc)` (alpha 0.8,
  beachfront.css:6484-6490). We were emitting `.hero-bot-gradient.dark` =
  `linear-gradient(#0000,#129ecc 77%)` (OPAQUE from 77% down, :6492-6494),
  which is contact-us only.

FIX: `wash` (default true, false for /services via `hero_wash` on the assembly)
and `botGradient` ("base" default, "dark" for contact-us only).

RESULT:
services 6/15 -> 9/15 top mm 23.9-29.7% -> 1.9 / 2.0 / 4.5% all PASS
our-team 10/15 -> 13/15 top mm 17.8-20.5% -> 0.2 / 0.4 / 1.2% all PASS
contact 9/12 -> 9/12 held (it keeps .dark, correctly)
atd 7/15 -> 7/15 top mm 40-48% -> 0.2 / 0.7 / 1.3%
665 unit + 8 e2e pass, svelte-check 0 errors. Net +6 regions.

NEW, CLEANLY EXPOSED: ask-the-doctor's `top` now matches almost exactly on
COLOUR (mm 0.2-1.3%) and fails purely on HEIGHT — dh 34.6 / 28.7 / 36.0% at
1440 / 834 / 390. That height error was there all along, hidden behind a colour
mismatch big enough to fail the region on its own. This is the second time
today that fixing one defect turned a muddy region into a single clean signal
(cf. the atd card grid, where correcting the height exposed the anchor-cut bug).
The atd hero band height is now the page's top defect and is next.

METHOD NOTE: neither fix list found this alone. services' list said "the hero
has no gradient divs"; our-team's said "we use the .dark stop where live uses
the base one". Only counting the divs across ALL saved documents showed that
BOTH were true and that contact-us was the single exception justifying the
current code. Cross-page evidence beat per-page evidence.

## SPEC-DRIVEN ROUND 3 (2026-08-05) — detail templates, qa 10/15 -> 13/15

Applied items 1-4 of matching/fix-lists/qa.md. Every citation re-verified by
hand before applying; all four held:
.my-4 { margin-top:1rem; margin-bottom:1rem } :3824-3827 VERIFIED
li { font-size:20px; line-height:1.8em } base + li { font-size:12px } at <=767 :2192, :8383 VERIFIED
.col-2-of-3 {66%} / .col-1-of-3 {33%} :6440-6447 VERIFIED
.text-body-large { margin-top:20; margin-bottom:40 } :7760-7765 VERIFIED

THE `li` LADDER is the interesting one and is a textbook instance of the trap:
there is NO `li` rule in the <=991 block at all. The base 20px/1.8em therefore
survives all the way down to 767, where <=767 takes it to 12px. Ladder =
20 / 20 / 12, NOT 20 / 16 / 12. We had `md:[&_li]:text-[16px]` — a plausible
midpoint that exists nowhere in the stylesheet. Interpolating a tablet value
between two known ones is the same class of error as a two-tier ladder, and it
is harder to see because the result looks like a ladder.

Also fixed: the "Have another question" wrapper carried `pb-[24px] lg:pb-[40px]`
INSIDE the gate's cut box; live's band is the button alone and the space below
it is the CTA h2's collapsed `.my-4` margin, which our CtaBand already emits —
so the padding double-counted it. This was ALSO the anchor-parity 1.6x flag
recorded in the ANCHOR PARITY SWEEP above: that flag was our own padding, not a
structural mismatch. Both cuts land on the button's top edge; the ratio
resolves to 66/67 with the padding gone. One of the four flagged anchors is
therefore now cleared and was never a cut problem.

RESULT: qa 10/15 -> 13/15 (exactly what the fix list predicted from its own CSS
injection test), svc 9/15 -> 10/15 via the shared DetailBody/DetailIntro,
team 12/15 held. 665 unit + 8 e2e pass, svelte-check 0 errors.

NOTE ON THE TEST HARNESS: `npm test`'s playwright leg intermittently reports
"7 passed" instead of 8 with no failure listed. Re-running playwright alone
gives 8/8 every time. Flake in the combined run, not a regression — recorded so
it is not mistaken for one later.

## SPEC-DRIVEN ROUND 4 (2026-08-05) — atd 7/15 -> 13/15. The stalled region is SOLVED.

`ask-the-doctor` "Beyond the Smile" — 79-83% across 8 gate runs, carried as
ACK-REQUIRED/unexplained since 2026-08-04, twice given a WRONG cause in this
ledger ("large-area colour delta", then my own "vertically offset grid") — is
fixed. It was a missing wrapper element.

LIVE'S CARD (matching/spec/ask-the-doctor.html + beachfront.css):
.qa-block width 15rem, height 10rem (12rem <=767)
.qa-label FLOW child, height 2rem
img.qa-image absolute, inset 0
.qa-text FLOW child, height 8rem (10rem <=767), mx 4%
h5.qa-question absolute inside .qa-text
.qa-answer translateY(200%) until opened
Resolved against the stepped root, and they SUM:
card 10rem/10rem/12rem = 400 / 320 / 288
label 2rem = 80 / 64 / 48
text 8rem/8rem/10rem = 320 / 256 / 240
80+320=400 · 64+256=320 · 48+240=288 exact at all three.

OURS made all three children ABSOLUTE, so no element wrapped the question. Live's
`.qa-text` collapses to text starting with the question, so page-diff cut live at
that 320px box and cut us at the bare 80px <h3> — 220px apart. Every atd region
was compared against the wrong content. That is the whole of the 79-83% AND of
`top`'s 34.6/28.7/36.0% height failure (220/635 = 34.6%, which is exactly the
reported dh — the arithmetic identifies itself once you look).

SECOND ELEMENT, found by the parity probe mid-fix: home's featured row uses
`.qa-text.m-2` (:7292-7301), a DIFFERENT box — absolute at bottom:0,
`height: 3rem` = 120/96/72, width 80%, margin-left 1rem. Applying the numbered
box to both took home's parity ratio from 1.5x to 2.7x. QuestionCard now takes
`variant: "numbered" | "teaser"`.

RESULT:
ask-the-doctor 7/15 -> 13/15
Beyond the Smile 79.1/79.3/82.7% -> 4.6 / 1.0 / 1.7 all PASS
top dh 34.6/28.7/36.0% -> 0.2 / 0.3 / 0.7 all PASS
Back to Top -> 0.1 / 0.0 / 2.8 all PASS
remaining 2 fails = the declared [floor-live-embed] map iframe only
home 21/27 -> 22/27
665 unit + 8 e2e pass, svelte-check 0 errors.

ANCHOR PARITY IS NOW CLEAN: probe-anchor-parity.mjs reports "All anchors resolve
to comparable elements" for atd and home. Of the four flags raised in the sweep,
three are now resolved (atd + home here, qa in round 3) and one remains (svc
"Back to All Services").

THE LESSON, since this cost two days: the region was never a rendering defect,
and every attempt to fix it AS one was doomed regardless of how carefully the
values were derived. What found it was not a better probe of the same thing but
a different question — "what element does the gate actually cut on, on each
side?" That question is now a standing instrument (matching/probe-anchor-parity.mjs)
and should be run BEFORE any region is treated as geometry.

## SPEC-DRIVEN ROUND 5 (2026-08-05) — yfv hero, 7/24 -> 11/24. All three `top` PASS.

Four defects in one region, each cited, applied one at a time with a gate between
so each could be attributed:

1. HEIGHT LADDER. `.hero.group-photo` has its OWN four-step ladder, and the top
   step is viewport-HEIGHT based while the rest are width-based:

   > =992 `height:60vh; max-height:60vw` (beachfront.css:5322-5328) = 540
   > <=991 `height:70vw; max-height:100vw` (:7984-7990) = 583.8
   > <=767 `height:80vh; max-height:70vw` (:8451-8454)
   > <=479 `height:95vw; max-height:none` (:9082-9086) = 370.5
   > We had TWO steps (95vw / min(60vh,60vw)), so 480-991 rendered the desktop
   > value: 500.4 at 834 vs live's 583.8. After the fix the hero measures
   > 540/584/371 on BOTH sides — exact.

2. OVERLAYS. Our group-photo hero painted ONE neutral scrim
   `rgba(0,0,0,0.32)`; live carries the same two CYAN divs as every other
   opener — `.hero-top-gradient` over the top 25% (:6477-6482) and
   `.hero-bot-gradient` over the bottom 50% (:6484-6490), both alpha 0.8.
   `top` @1440 44.7% -> 3.2%, dE 17.8 -> 2.0.

3. IMAGE FRAMING, and it is a THREE-step ladder. The <=991 rule also sets
   `background-position:0%; background-size:115%` (:7984-7990) where >=992 is
   `cover`/`50%` (:5322-5328) — but at <=479 `:9082-9086` puts `background-size`
   back to `cover` while `position:0%` still cascades. Applying the 115% framing
   across the whole <=991 range took @390 42.2% -> 47.6%; scoping it to 480-991
   took @834 39.8% -> 1.4%.

4. MARGIN vs PADDING at the section seam. Live's space under the hero is
   `.content-width.mt-6` INSIDE `.fv-toc-section` = 1.5rem = 60/48/36, and the
   section has no padding, so that margin COLLAPSES OUT and the section's border
   box begins 60/48/36 below the hero. We had it as `pt-9`, which keeps the box
   against the hero. Because this section IS the "We want you to feel
   comfortable" anchor and page-diff cuts on the box, padding-vs-margin was the
   entire residual dh (10.0/7.6/8.8%). This is the THIRD time today the
   margin/padding distinction changed a gate result rather than just spacing
   (cf. the home h1 that collapses out, and the qa CTA padding).

RESULT: `top` 44.7/72.5/71.6% -> 2.9 / 1.3 / 2.5%, all PASS, no dh failure.
yfv 7/24 -> 11/24. 665 unit + 8 e2e, svelte-check 0 errors.

HARNESS LESSON: while doing this I put an HTML comment INSIDE a `<section>`
tag's attribute list. `npx svelte-check --threshold error` reported **0 errors**
on that file, and `npm test` passed. The GATE caught it — every anchor on the
candidate resolved to NULL and page-diff hard-failed (exit 2, matching/
out-spec16-yfv). Type-checking and unit tests do not see markup that parses into
the wrong DOM; the gate does. Do not treat a clean svelte-check as evidence the
page renders.

### yfv Office Tour — slider height + the MISSING §8 hours block (same round)

Two defects, both cited:

1. HEIGHT. The slider holder carries two competing 0,1,0 rules —
   `.h-half-screen-width` `height:50vw` (beachfront.css:3173-3175) and
   `.su-h-screen-to-tablet` `height:100vh` (:5656-5658). The second is LATER in
   the sheet, so 100vh wins at >=768: the box is viewport-HEIGHT dependent, not
   width dependent. `:8554-8556` sets `height:auto` at <=767. We had fixed
   pixels (293/560/900).

2. MISSING CONTENT. Census §8 "Hours + contact pair" was not built at all —
   `.content-width > div.w-layout-hflex.mt-6.su-flex-v-mobile` with two
   `.footer-contact-block.mb-4.mr-8`, INSIDE `<section id="tour"
class="fv-virtual-tour-section">` (verified in the saved HTML), which is why
   it belongs in the Carousel fullbleed branch and not a new slice. 184px of the
   region at 834. NOT new hardcoded copy: it renders the same PHONE/ADDRESS/
   HOURS from src/lib/site.ts that already feed the footer and /contact-us.
   Ladders: `.mt-6` 60/48/36 (:3917-3919), `.mb-4` 40/32/24 (:3985-3988),
   `.mr-8` 80/64/48 (:3961-3963), `.su-flex-v-mobile` column at <=767 ONLY
   (:5291-5293 / :8434-8436) — still a ROW at 834; header 20/40·16/32·16/32,
   rows 20/30·16/24·16/24. Header text has a real nbsp in the source.

RESULT Office Tour: dh 16.8 / 21.8 / 33.3% -> **2.4 / 11.2 / 2.3%**;
mm 29.5 / 48.8 / 24.3% -> 26.7 / 33.4 / 18.2%. Height is essentially solved at
1440 and 390; 834 still carries 11.2%.

RESIDUAL IS LARGELY THE DECLARED PHOTO FLOOR. Diagnostic re-run with
--mask-photos (matching/out-photocheck-yfv, NOT the gate result — the gate
stays unmasked at 0.10): @390 18.2% -> 8.9% PASS, @834 33.4% -> 22.0%. So the
photo pipeline explains roughly half at 834 and all of the margin at 390; the
rest of 834 is still real and unexplained. Not masked, not rethresholded.

### yfv "Dr. Robert Quan" — attempt 2 REVERTED. Escalating rather than a third pass.

Applied `.team-slider-holder`'s explicit clipped-viewport ladder
(beachfront.css:6654-6659 / :8226-8231 / :8777-8779):

> =992 width:100% height:16rem = 100% x 640
> <=991 width:20rem height:35rem = 640 x 1120
> <=767 width:16rem = 384 x 840
> All three citations verified by hand. Result was NET NEGATIVE:
> @1440 mm 43.4 -> 43.4 dh 24.4 -> 21.5 (marginally better)
> @834 mm 37.8 -> 36.5 dh 19.9 -> 26.2 (worse)
> @390 mm 29.5 -> 29.1 dh 18.2 -> 67.5 (much worse)
> our-team held at 13/15, so the shared card is not implicated. Reverted.

WHY IT IS WRONG: there is no <=479 HEIGHT override for `.team-slider-holder`,
so `35rem` should still be 840 at 390 — but our cards are 432 tall there, and a
fixed 840 holder simply adds ~400px of blank that live does not show. Live must
therefore be resolving that box differently than the cascade alone suggests
(a JS-set inline height is the obvious candidate — §10's markup contract records
that the slider's width IS set inline by Webflow's script, so height may be too),
or the holder is not the element our wrapper corresponds to.

THIS IS ATTEMPT 2 on this region and it moved the wrong way. Per CLAUDE.md rule
3 the next step is a different MODEL, not a third pass at the same one, and the
model that needs checking is "which live element does our wrapper actually
correspond to" — the same question that cracked ask-the-doctor. Deferred to a
round with the budget to dump the holder's computed box AND its inline style on
live at all three viewports and compare child-by-child, rather than reasoning
from the stylesheet alone.

### services — the `background` SHORTHAND was erasing the card's base colour

One-line fix, six regions moved. Live's service-card panel is TWO layers:
`.bg-color-primary { background-color: var(--primary) }` beachfront.css:5885-5887
plus a gradient IMAGE on top.
We wrote it as the `background` shorthand, which RESETS `background-color` to
transparent — so the gradient's translucent lower stop (rgba(54,91,109,0.57))
had nothing behind it and composited against the card instead of against cyan.

Cosmetic Dentistry 8.3 / 8.3 / 5.9 -> 0.5 / 0.4 / 0.1 (already passing; now near-exact)
General Dentistry 28.8 / 28.7 / 18.0 -> 18.3 / 19.3 / 11.3

Region count holds at 9/15 because Cosmetic was already inside threshold and
General still fails, but this is the largest colour correction on the page and
it makes the residual on General a clean signal rather than a compound one.

WORTH GENERALISING: `background: <gradient>` is not equivalent to
`background-image: <gradient>` when the reference also sets a background-color.
Grep the codebase for other `style="background:linear-gradient(` uses before
assuming this was the only instance.

AUDIT of the other 19 `style="background:linear-gradient(` uses: all are overlay
washes layered OVER a photo, and each one's live counterpart (`.hero-top-gradient`
:6477, `.hero-bot-gradient` :6484, `.box-gradient` :6995, `.box-gradient-overlay`
:7335) sets `background-image` ONLY, with no background-color to erase. The
services card was the unique case because its panel is a SOLID cyan block with a
gradient on top rather than a wash over an image. No blanket change made.

- [deviation] yfv `.fv-meet-our-team-section` — the "Dr. Robert Quan" region
  (escalated at attempt 2 after two cited value-fixes made it worse) was never a
  value problem. `matching/probe-yfv-cut.mjs` reproduces capture.mjs's anchor
  finder verbatim and prints the matched element on both sides. Two defects:
  (1) our slider's roster ORDER was /our-team's, not this list's — live sorts the
  two Collection Lists differently (/our-team = `person.order`; the yfv slider =
  doctors by surname then everyone alphabetically, read off live 2026-08-05), so
  "Dr. Robert Quan" was our card 1 and the finder matched the whole slider
  WRAPPER at track top; (2) even with the order right, our generic Slider cell
  sits between track and card where live has nothing, so the card's margin-top
  (`beachfront.css:6538-6540` / ≤991 `:8183-8187` / ≤479 `:9271-9276`) left the
  outermost per-card box 160/256/96px above live's card box.
  Fix: authored `order_uids` on the slice (a Collection List's sort is a
  per-list setting, so it does not belong on the shared `person.order`), and the
  top margin moved from the card to the Slider cell via a new `slideClass` prop
  — the cell IS live's card box; the card is its content. Deviation recorded
  because our DOM keeps an element live does not have.
  Cut y after: 2744 vs 2749 @1440, 2966 vs 2887 @834, 1994 vs 1860 @390.
  Region Δh: +0.9% / -5.3% / +1.7%. Pixels 43.4/37.8/29.5% -> pass/1.6%/pass.
  yfv 11/24 -> 13/24 (matching/out-y22-yfv).

- [deviation] yfv `#tour.fv-virtual-tour-section` — the section is now
  box-for-box identical to live (1212 / 1132 / 660 at 1440/834/390, same three
  children at the same offsets). Four defects, each read from source:
  - `h1{margin-bottom:10px}` `beachfront.css:2104-2108` is a FIXED px and does
    not step with the root ladder; we had `mb-6` (24) on the wrapper. -14/vp.
  - live's dot strip is `div.display-none.w-slider-nav` and `.display-none` is
    `display:none` `beachfront.css:2214-2216` — the 8 dots exist and are never
    operable. Ours rendered them in FLOW: 24px + a 32px margin = +56.
  - section trailing space is `.mb-6` `beachfront.css:3994-3996` = 60/48/36; we
    had `mb-10 lg:mb-24` (40/40/96) plus an invented `lg:pb-4` (live's section
    has no padding at all).
  - `.content-width` padding is `1.5rem` = 60/48/36 stepping to 8%/5% below 768;
    `px-5 lg:px-20` landed 80 at 1440 by coincidence but put the heading at
    x=20 where live has x=48.
    The slide image is NOT an object-fit: live sets none, so the img is
    `max-width:100%` (`beachfront.css:232-236`) at natural aspect, top of the
    block box — 1440x1080 clipped by a 900 mask at 1440, but 834x626 LETTERBOXED
    in the same 900 mask at 834, over `.w-slider{background:#ddd}` (`:1190-1198`).
    `object-cover` filled the grey band live leaves empty; `h-auto w-full` +
    `bg-[#ddd]` reproduces all three. Office Tour 26.7/33.4/18.4% -> pass at
    1440/834/390. yfv 13/24 -> 16/24 (matching/out-y25-yfv).

- [deviation] yfv `#exam.fv-exam-section` (census §11-13, the largest region on
  the page) — rebuilt from live's composition, which is TWO rows inside
  `.content-width`, not the 2-column grid we had. The old build merged §11's
  intro column with §12's registration box and hung the six steps off the photo;
  the section came out 458px short at 834 with the wrong x on every child.
  Structure now: row 1 = `._w-30pc.su-w-60pc-tablet.su-w-full-mobile` (30/60/100%)
  - `img._w-60pc.su-w-full-mobile`; row 2 = `.registration-forms-box` +
    `.first-exam-step-container`. Both rows are `su-flex-v-tablet` (column ≤991,
    `beachfront.css:8004`) with `align-items:center` (`:7886-7888`).
    Section box after: 2169 / 3025 / 2274 == live at 1440/834/390, child-for-child.
    Two spec corrections found while doing it, both now in the SPEC:
  * `.button` has NO height — `height:auto; padding:1.3em 1em; line-height:0`
    (`beachfront.css:6028-6040`) — so its box is 2.6em+2 and follows a FOUR-tier
    font ladder: 25 base, 20 ≤991 (`:8045-8047`), 15 ≤767 (`:8632-8634`), 14
    ≤479 for both colourways (`:9173-9175`, `:9185-9187`). Heights 67/54/41/38.
    We shipped a flat 66px. Expressing the padding in `em` makes the box track
    the ladder rather than restating it.
  * §12's h6 does NOT get `white-space:nowrap` — computed `normal` on live
    `[probed 390]`, so the "10 MIN" label wraps to two lines inside the 48px
    circle column. The `.text-breaking-no-wrap` citation in §12 does not apply
    to the exam-step h6; SPEC corrected.
    yfv 16/24 -> 20/24 (matching/out-y26-yfv). "To be a long term health partner"
    27.3/23.5/8.5% -> pass at all three; "We want you to feel comfortable" @390
    also cleared on the button ladder.

- [deviation] yfv `.fv-toc-section` (census §3-5) — rebuilt. Live keeps the
  BUTTON PAIR in the right column under the visit list, not beside the lede:
  `.w-layout-hflex.su-flex-v-tablet.my-6.flex-justify-between` holds
  `p.text-body-large._w-half.max-w-490px` and
  `div._w-half.px-4.su-w-full-tablet`, and the second of those holds
  `.visit-list` AND the unclassed button div. With the buttons on the left the
  section was 67px short at 1440 and both columns 36px narrow (`lg:px-20` = 80
  against `.content-width`'s 60). Section box after: 497 / 475 == live at
  1440/834.
  Two things worth recording beyond the ladders:
  - the `.my-6` on the inner row (`beachfront.css:3834-3837`) collapses out
    BOTH ways. We had reproduced the top half (as this section's `mt`) and
    missed the bottom, leaving the region exactly 60/48/36 short — Δh
    10.8/9.2/7.8% with the pixels already at ~1%.
  - the button holder is UNCLASSED, so it keeps live's inherited
    `body{font-size:64px; line-height:1.2em}` (`beachfront.css:2096-2102`) and
    that 76.8px strut — not the buttons — sets the line-box height: the pair is
    167 / 79 / 134 tall against 133 / 54 / 136 of button. This is the only
    place on the page where live's inherited default is load-bearing.

- [ACK-REQUIRED: operator copy decision costs a region at 390]
  `.fv-toc-section` @390 is Δh 14.9% and will not close while the copy stands.
  `beachfront-pages.js` records "Live renders 'Book an Apointment' (a typo on
  the reference); Tucker asked to ship the correct spelling here". The extra
  `p` makes our button 179px wide against live's 170. Live's pair is
  170 + 24 (`.mr-4`) + 151 = 345 in a 351 column — it fits by 6px. Ours is 354
  and wraps, and one extra line box of live's 76.8px strut is +77px on a 510px
  region = the whole 14.9%. Pixels are already at 1.1%.
  Options are the operator's: (a) keep the correct spelling and accept this
  region failing at 390 only, (b) restore live's typo, (c) accept a documented
  deviation from live's `.mr-4` at ≤479 to buy back the 9px. Nothing was
  changed; the region is left failing rather than papered over.

- [deviation] yfv `.team-slider-holder` height ladder, applied HEIGHT-ONLY.
  `beachfront.css:6654-6659` `height:16rem` + `overflow:hidden`; ≤991
  `:8226-8231` `35rem`; ≤479 `:9309-9312` `23rem` -> 640 / 1120 / 552. Only at
  390 does that equal the cards' own stack: at 1440 it CLIPS the card's 20px
  bottom margin and at 834 it reserves 64px of empty space below them, which
  was the whole of that region's residual Δh (6.3%).
  The ≤991 rule also sets `width:20rem` with auto side margins. That half is
  NOT applied: our track is not live's JS-positioned one and narrowing it to a
  single-card window is what made this region worse on the previous attempt
  (@390 Δh 18.2 -> 67.5). Recorded as a deviation rather than left implicit.
  yfv 20/24 -> 21/24 (matching/out-y29-yfv). The page is now at its ceiling:
  the 3 open rows are 2 declared map-iframe floors + the ACK-REQUIRED copy item.

- [deviation] services `.service-block` — the "General Dentistry" region was the
  yfv-Quan defect a second time: page-diff's anchor finder only looks at
  `h1-h6,p,a,li,span,div,section,button`, so our `<article>` card was invisible
  and the cut landed on the inner 60% block 80px lower (region 680 against
  live's 800). Live's element is a `div`; ours is now a div too — the card is a
  navigational panel of links under an h3, not standalone syndicated content.
  Also `.service-grid.my-8` carries `margin:2rem 0` = 48/64/80 OUTSIDE the grid
  box (live's section ends flush with the grid). We had only the 40/32/24 the
  next section's own leading margin collapses out, so the last region was one
  `1rem` short at every viewport. Bottom margin only: a matching `mt` would move
  the section's border box, which is where "Cosmetic Dentistry" is cut.
  services 9/15 -> 13/15 (matching/out-s3-services). The 2 open rows are the
  declared map-iframe floors.

- [deviation] detail templates — `.button` is ONE ladder, not two. The `size`
  prop on OutlineButton ("default" 66px flat / "detail" 38 then 66 at lg) was a
  two-tier approximation of a four-tier rule: live's `.button` is
  `height:auto; padding:1.3em 1em; line-height:0` (`beachfront.css:6028-6040`)
  over a font ladder of 25 / 20 (`:8045-8047`) / 15 (`:8632-8634`) / 14
  (`:9173-9175`, `:9185-9187`), i.e. 67 / 54 / 41 / 38.4. Prop removed; the
  padding is now `em` so the box follows the ladder instead of restating it.
  Measured live back-links confirm the page-specific margins differ per
  template and are NOT part of the button: svc is
  `.button.text-color-primary-dark` with `margin-bottom:60px` at ≤767
  (`:8636-8638`, inside the flex holder — live's holder is 98 tall at 390
  against our 38); team is `.button.text-color-primary.mt-2`, where `.mt-2`
  overrides that margin to 0 and adds 12/16 above; questions has neither.
- [deviation] svc `.service-page-body-section` — live's body column is
  `._w-80pc.su-w-full-mobile` (80%, `beachfront.css:3561-3563`; 100% ≤767,
  `:8426-8428`). Our `max-w-[1024px]` equals 80% at 1440 and nowhere else: at
  834 the column was 738 wide against live's 590 and the same copy wrapped 306px
  shorter. The back-link holder is `.my-8` = `2rem` (`:3839-3842`) = 48/64/80,
  both halves margin; we had invented 86/130 above and 108/80 below.
  svc 10/15 -> 12/15 (matching/out-d2-svc).

- [ACK-REQUIRED: content, needs a seed + publish] svc "What to expect" @1440 is
  Δh 5.1% with pixels at 0.0%. Live's `.w-richtext` for dental-exams is SIX
  paragraphs: four of copy and two EMPTY ones (a zero-width joiner) acting as
  spacers, each one line-height + its 10px margins. DetailBody already
  synthesises the MID one in CSS (`[&_.detail-subheading]:mt-[38/44/50px]`,
  which lands live's exact y element-by-element) but there is no equivalent for
  the TRAILING one, and a blanket trailing pad would be wrong: the count varies
  per document (dental-cleanings has none). Closing this needs live's blank
  lines carried into the Prismic docs — the same seed + publish already noted in
  DetailBody's comment. Left failing rather than padded.

- [deviation] contact `.info-section` — the structural diff the previous entry
  demanded, done before touching values. Live is
  `section > div.content-width > (a.button.mt-6, div.w-layout-hflex.mt-6
.su-flex-v-mobile > 2x .footer-contact-block.mb-4[.mr-8],
div.w-layout-hflex.mt-6 > div._w-40pc.su-w-full-tablet)`. Five defects, none
  of which the earlier probed fix list would have caught:
  - the map column is `._w-40pc.su-w-full-tablet` — 40% (`beachfront.css:3530`)
    at ≥992 and 100% at ≤991 (`:8215-8217`). `max-w-[512px]` equals 40% at 1440
    and nowhere else; at 834 the map was 512 wide inside live's 738. That is
    226x400px of the region and most of its 18.8%.
  - `.footer-contact-info` (`:6345-6351`) is `20px / 2em` — 16px ≤991
    (`:8130-8132`), 12px ≤767 (`:8699-8701`) — and because the line-height is
    `2em` it is ALWAYS 2x the size: 40 / 32 / 24. We had a flat 24 on 16px type,
    so every block was one line short.
  - the button is the same `.button` ladder (54/67/38) and carries
    `margin-bottom:60px` at ≤767 (`:8636-8638`); being inline-level it does NOT
    collapse with the next block's margin, it adds to it.
  - spacing between blocks is `.mt-6` = 36/48/60 (`:3917-3919`), not `mt-8`.
  - the section has NO padding-bottom on live — its box ends flush with the map.
    contact 9/12 -> 10/12 (matching/out-c3-contact); the 2 open rows are the
    declared map-iframe floors.

- [deviation] team detail — live's role line is `h4.text-color-primary-dark
.mt-8.mb-4`; `.mb-4` is `margin-bottom:1rem` (`beachfront.css:3985-3988`) =
  24/32/40 and we had a flat `mt-6` (24) on the body, so every paragraph below
  carried the drift (8px at 834, 16 at 1440). The back-link carries `.mt-2` =
  12/16/20 (`:3901-3903`) inside a `.w-layout-hflex.flex-align-center.mb-8`
  holder; the 22/30 we shipped was probed rather than read and was 6px out at 834. team 12/15 -> 13/15 (matching/out-t2-team); the 2 open rows are the
  declared map-iframe floors.

- [deviation] home `.home-healthy-mouth-section` ("Your Path to Oral Health") —
  STALLED 15 gate runs at 15.4% @834, and it was a model error, not a value
  error. Live's block is `.content-width.display-flex.su-flex-v-tablet` and its
  two columns have DIFFERENT tablet behaviour:
  `._w-half.p-4.su-w-full-tablet` (the heading) goes 100% at ≤991, while
  `._w-half.p-4.su-mx-auto-mobile` (the photo) stays 50% until ≤767. So at 834
  live is a full-width heading over a HALF-width centred photo, and we rendered
  a 2-column row. The steps below are the mirror image: `.home-steps-container
.su-flex-v-mobile` is a `space-between` ROW of 30%-wide `.home-step`s from
  768 up and only stacks at ≤767 — we stacked them at 834.
  Three more, all read from source: the `.p-4` padding (24/32/40) is what wraps
  live's 120px heading to THREE lines at 834 (a 674 column, not 738); the
  section has NO padding-top at any viewport and a `3.5rem` = 84/112/140 tail
  (we had 96/96/60 and 192/192/140); and the heading block sits FLUSH against
  the steps (we had an invented 48). `min-width:auto` on our flex steps also had
  to be released or they held their min-content (223/235/277 vs live's uniform
  221).
  Section box after: 1082 / 1250 / 1266 against live's 1081 / 1276 / 1304.
  home 22/27 -> 23/27 (matching/out-h2-home).

- [deviation] home `.home-services-section` — two source-cited fixes landed:
  live's `._w-full.display-flex` has NO column gap (`._w-half` is a true 50%:
  640 at 1440, 369 at 834; our `gap-12` made them 616/345), and the body box is
  80% of the column at EVERY width (512 of 640, 295 of 369) — `lg:max-w-xl`
  (576) had overridden that at desktop. The text column also carries `.py-2`
  (`beachfront.css:4080-4083`) = 12/16/20. @1440 now passes.
- [THREE STRIKES] home @834 "Our dental team in Redondo" — 10.0% -> 10.9% ->
  13.5% -> 10.9% across four gate runs (h2/h3/h4/h5). Attempts: (1) remove the
  invented column gap, (2) add live's `.py-2` to the text column, (3) set the
  link-list pitch to the 72/90 that reproduces live's measured 384/480 column.
  (3) made it WORSE and was reverted; (1) and (2) are cited and stay.
  What is still unexplained: live's text column measures 480 @1440 / 384 @834
  while its own content is only 422 / 341, so its height comes from the SIBLING
  link column — and reproducing that sibling height directly (attempt 3) did not
  close the region. The next step is a different MODEL: dump live's
  `._w-half.flex-vertical` child-by-child (row heights, icon boxes, whether the
  list is `justify-content: space-between` rather than gapped) instead of
  fitting a gap value to a total. Not attempted a fourth time.

- [deviation] home `.home-ask-the-doctor-section` "View All Questions" — live's
  section is 1838 tall against an 1800px list, and 1838 - 1800 = 38 is exactly
  the button: it sits FLUSH under the list with no margin, and it is the
  standard `.button` box (38.4 / 54 / 67), not the fixed 41 we shipped with a
  48px `mt-12` above it. That 89-vs-38 was the whole of "Beyond the Smile"'s
  Δh 6.5% at 390. home 23/27 -> 24/27 (matching/out-h6-home).

- [ACK: RESOLVED 2026-08-05 by operator] yfv `.fv-toc-section` @390.
  Presented as three options (keep the correct spelling and accept the region
  failing at 390; restore live's typo; deviate from `.mr-4` at ≤479 to buy back
  the 9px). Tucker chose: **keep the correct spelling, accept the fail.**
  The region stays red at 390 ONLY, at Δh 14.9% with pixels at 1.1%, and is
  recorded in matching/floors.mjs as an ACCEPTED deviation — not a floor, and
  not reclassified to make the number go away. It remains visible in
  `node matching/next.mjs` under its own heading.

- [SPEC CORRECTION, verified on live 2026-08-05] `_chrome.md` §0 claimed the
  chrome markup is byte-identical on all 9 pages and explained `.form-modal`'s
  absence from the two detail captures as "an artifact of the capture, not of
  the site". That is FALSE, and false in the direction that hides a defect.
  `matching/probe-chrome-count.mjs` + a 2.5s-settle follow-up on LIVE:
  `.form-modal` is PRESENT on `/`, `/your-first-visit`, `/our-team`,
  `/services`, `/ask-the-doctor`, `/contact-us` and `/questions/<uid>`, and
  ABSENT on `/services/<uid>` and `/team-members/<uid>` — both of which still
  ship TWO `.show-form` buttons. Live's own "Book Appointment" pills are dead on
  those two templates: the handler runs and finds nothing to open.
  Our build renders a working modal there. That is a divergence FROM live in the
  user's favour and is the operator's call to keep or match — nothing changed.
  Also settled: every page's `.header` carries the same 11 links and one
  `.dropdown-modal`; a `.footer` showing 13 links instead of 10 is Google Maps'
  runtime DOM inside the already-declared-floor iframe, not chrome.
  The per-page "shared chrome (32 / 31 / 24)" totals are mutually inconsistent
  and are now flagged UNRECONCILED in all five files that carry one — Phase 5
  must recount them element-by-element before using one as a denominator.

- [ACK: RESOLVED 2026-08-05 by operator] the two dead "Book Appointment"
  buttons on live's `/services/<uid>` and `/team-members/<uid>` (no
  `.form-modal` in those documents). Tucker chose: **keep ours working and
  declare the divergence.** Our build opens a real appointment modal on all
  nine pages. Phase 5 records live's broken state as reference behaviour we
  deliberately did NOT reproduce; it is not a defect against us.

- [PHASE 5, round 1 — shared chrome] `matching/states.mjs` + `states/index.mjs`.
  Scope is the operator's call of 2026-08-05: chrome verified ONCE in depth,
  then per-page uniques, with a cross-page sweep still to write so a
  page-specific chrome override cannot hide.
  The harness is a DIFF, not an assertion list — every expected value is read
  off live in the same run, so no number is hardcoded. `__box` is reported but
  only fails when a state asks for it (a modal that opens on both sides should
  not fail for being a different size, and the size should not vanish either);
  opacity carries a 0.02 tolerance because live samples .61 where its rule says
  .6 (the IX2 inline value on revealed elements).
  Round 1: 9 chrome states, 1/9 -> 3/9 after two fixes. FIXED: live's footer
  links and phone are `.inline-link`, whose ONLY hover rule is `opacity:.6`
  (`beachfront.css:7391`, census row 37) — ours held opacity at 1 and DARKENED
  the colour instead, a different affordance entirely, and page-diff cannot see
  either. Also aligned the off-canvas nav/logo/hamburger fades from .5 to .6.
  STILL OPEN (5), all invisible to the pixel gate:
  1. logo hover — live fades to .6, ours does not fade at all.
  2. off-canvas nav link colour — live `rgb(18,158,204)` (cyan), ours white.
  3. footer link colour — live cyan, ours `rgb(54,91,109)` (teal). A REST-state
     colour, so the Phase 3 style census should have caught it; that it did not
     is itself worth chasing.
  4. footer "Make a Payment" and 5. the closing CTA button — live does NOT fade
     on hover (opacity stays 1, the IX2 inline `opacity:1` beating
     `.button:hover`, exactly as `_chrome.md` §9 item 2 predicted); ours fades
     to .6. Ours is wrong in the opposite direction from the usual.

- [DEVIATION RETIRED 2026-08-05] "all pill buttons — live's `.button` uses
  `line-height: 0` + 1.3em padding; we match the RENDERED RECT instead of the lh
  trick. Every 'lh=0px vs lh=Npx' census row on a pill is this one deviation."
  That deviation is no longer necessary and is withdrawn. Live's rule
  (`beachfront.css:6028-6040`, `height:auto; padding:1.3em 1em; line-height:0`)
  is directly reproducible: expressing the padding in `em` yields the same box
  AND the same computed line-height, which is what every one of those census
  rows was actually reporting. All 8 remaining hand-rolled pills converted
  (CtaBand, Footer, Nav ×2, Hero, QuestionList ×2, SectionGrid) — OutlineButton
  had already moved earlier in this session.
  Phase 3 census 192 -> 124 rows. Geometry unchanged: gate p1 home 24/27,
  yfv 21/24, services 13/15, contact 10/12 — threshold 0.10, no masks.
  A declared deviation that turns out to be reproducible should be RETIRED, not
  carried: it was suppressing ~68 real census rows behind a "known" label.
- [PHASE 3] `matching/census.sh` — the style gate now runs the same 9 pages ×
  3 viewports gate.sh drives, prints a per-page matrix, and exits 1 while any
  count is non-zero. Phase 3 had never been driven to zero; it was only ever
  run ad hoc, which is how a rest-state colour defect survived long enough for
  Phase 5 to find it independently.

- [PHASE 3, round 2] census 124 -> 100. Three real defects, all on yfv:
  - `.circle-time-number` is museo-SANS on live — `beachfront.css:6722-6727`
    sets only colour/align/size/line-height, so it inherits the body family. We
    had it on museo-slab (8 rows).
  - the TOC and exam `h3`s were rendering our AA-safe `-deep` where live is
    cyan. They CROSS the 24px AA line across the ladder (40px at ≥992, 21px
    below), which the all-or-nothing `.h-primary` opt-in cannot express, so
    app.css gains `.h-primary-lg`: live's cyan at ≥992 only, keyed at 992 to
    match live's own rem ladder rather than Tailwind's `lg`.
    Geometry unchanged (gate p2: yfv 21/24, home 24/27, threshold 0.10, no masks).
    Of the ~100 remaining rows a large share are the census's TEXT-collision
    class — it matches snippets by text, so live's exam-step "01" (museo-sans
    45px white) is being compared against our TOC visit-number "01" (museo-slab
    24px teal), and "meet our team" collides between live's 120px h2 and our 40px
    h3. Those need adjudicating one at a time, not fixing.

- [HARNESS FIX, shared skill] `style-census.mjs` keys on TEXT, not on elements,
  so every element carrying a string lands under one key — and the old rule
  (fail whenever the two sides' style SETS differ) reported a byte-identical
  element as a mismatch whenever any same-text sibling differed. Driving this
  project's census to zero, that noise was indistinguishable from a real defect:
  "book an appointment" was failing while our pill matched live exactly, because
  a 40px heading elsewhere shares the string.
  `diffCensus` now tags each row `mismatch` (the sides share NO tuple — a
  defect) or `ambiguous` (they share one but a side has extras — usually a
  collision, still worth adjudicating). Exit is driven by mismatches; `--strict`
  fails on both; ambiguous rows always print under their own heading.
  Committed in the skill's own repo with two tests. On this project it split
  100 undifferentiated rows into 69 real + 31 collisions.
- [PHASE 3, round 3] census 100 -> 57 mismatches (+32 ambiguous). Fixes:
  Office Tour h1 is 28/38 at ≤991 (we had 25) and cyan at every tier; the
  `.we-offer-section` intro's `[&_p]` utilities set the SIZE but not the
  line-height, so the paragraph fell back to a base rule and rendered 48 against
  live's 45 — the child needs the direct hit, the same trap as the sizes beside
  it; the service-card headings and yfv's "Meet Our Team" took the cyan opt-in.
  Geometry unchanged: gate p3 services 13/15, yfv 21/24, home 24/27,
  our-team 13/15 — threshold 0.10, no masks.
  Of the 57 remaining, **27 are the ACK'd footer "want to learn more?" AA
  colour** (9 pages × 3 viewports of one permanent, operator-approved
  deviation), leaving ~30 real rows.

- [PHASE 3, round 4] census 57 -> 48 mismatches. Fixes: the person card's
  READ MORE is 14/22 at 834 AND 390 and 16/24 at 1440 `[probed in the census
run]` — we had a flat 16/24, and the §10 spec table also had it wrong (it
  recorded 19.2/28.8 at 834); "Back to Top" is `.button.text-color-primary`, so
  it takes the fourth tier of the button ladder (14px ≤479, `:9185-9187`) and
  we had started at 15.
  A caught regression worth recording: setting the QA card title to live's
  30/45 fixed 6 rows on HOME and broke 40 on ask-the-doctor, because live
  renders the SAME card at 45 in the home carousel and 40 in the atd grid. The
  component already models that split (`variant: teaser | numbered`), so the
  line-height is now variant-dependent. Net 57 -> 48; had the atd run not been
  in the same sweep the "fix" would have shipped a 40-row regression.
  Geometry unchanged: gate p4 atd 13/15, home 24/27, our-team 13/15, qa 13/15 —
  threshold 0.10, no masks.
  Of the 48, **27 are the ACK'd footer AA colour**, leaving ~21 real. Ten of
  those 21 are the SAME AA class at 21px (service-card and yfv TOC/exam h3s,
  where live uses its cyan below the 24px AA line) and need the operator to say
  whether the footer ACK extends to them — see the question raised at handover.

- [PHASE 3, round 5] the review card's reviewer-place line-height: live is 16/19
  at 1440 and 13/15 at 834; we had 25. Corrected at ≥992 ONLY. The first attempt
  pushed 19 down every tier and made the census WORSE (48 -> 49): the small
  tiers carry the declared a11y size bump (ledger: "place 10->16"), so their
  tuple cannot match live's whatever line-height is chosen, and forcing 19 there
  just moved the mismatch. Applying a desktop value across the ladder is the
  same two-tier trap this project keeps hitting — it caught me here too.
  Census steady at 48 mismatches, of which 27 are the ACK'd footer AA colour.
  Geometry unchanged: gate p5 home 24/27, yfv 21/24, threshold 0.10, no masks.

- [ACK: RESOLVED 2026-08-05 by operator] the AA colour swap EXTENDS to every
  heading below 24px, not just the footer. Tucker: "extend the ACK, keep AA
  everywhere." Live uses its cyan (#129ecc, 3.09:1 on the pale canvas) on 21px
  headings; we ship #0e7799 there and live's exact cyan at >=24px via the
  `.h-primary` / `.h-primary-lg` opt-ins. Now declared in
  matching/census-deviations.mjs — same contract as floors.mjs: subtracted from
  the gate's total, printed under its own count, never silently dropped.

- [PHASE 3 CLEAN 2026-08-05] `bash matching/census.sh` reports **0 undeclared
  type mismatches** on all 9 pages x 3 viewports, from 192 at the start of this
  stretch (42 declared, 32 ambiguous same-text rows). Geometry unchanged: gate
  p6 home 24/27, yfv 21/24, our-team 13/15, qa 13/15 — threshold 0.10, no masks.
  The last rows were all the same shape and it is worth naming: THREE separate
  elements turned out to render different type on different PAGES — the QA card
  title (45 in the home carousel, 40 in the atd grid), and the review card's
  place line twice over (16/25 home vs 16/19 yfv at 1440; 10/15 vs 10/12 at
  390). Each had been "fixed" once from a single page's reading and each broke
  the other page. A value read on one page is not the component's value.

- [PHASE 5, round 2 — chrome complete] 3/9 -> 6/9 pass + 3 declared, exit 0.
  Fixed: the header logo had NO hover state at all (live fades to .6 like every
  other clickable in the chrome — ours was the one affordance on the bar giving
  no feedback); live's `.button.text-color-primary-dark` pills do NOT fade on
  hover, an IX2 inline `opacity:1` beating `.button:hover{opacity:.6}` exactly
  as `_chrome.md` §9 item 2 predicted, and ours faded — the background
  transition stays, so the affordance is live's rather than none.
  One harness defect of my own: the closing-CTA state was resolving to the FIRST
  `a[href="#appointment"]` in the document rather than the CTA band's button,
  because the harness reads its target with `document.querySelector` and an
  ambiguous selector silently measures a different element. The button now
  carries a `closing-cta-button` hook, mirroring live's own `.show-form`.
  Declared (matching/states/deviations.mjs, same contract as floors.mjs): the
  three remaining rows are all the AA colour class the operator extended today —
  live paints its cyan on 16px footer links and on the off-canvas nav links,
  where #129ecc is 3.09:1 on the pale footer.
  Geometry and type unchanged: gate p7 home 24/27, yfv 21/24, contact 10/12;
  census still CLEAN.

- [PHASE 5 — cross-page chrome sweep] The operator's scope call (verify the
  chrome ONCE, then per-page uniques) is only safe if a page-specific override
  cannot hide, so `matching/states.mjs sweep-<page>` re-runs the four states a
  page could plausibly re-style — the panel opening, a nav link, a footer link,
  the closing CTA — against all nine. Result is UNIFORM: 2 pass + 2 declared on
  every page, no page-specific chrome behaviour anywhere. The scoping decision
  is now evidenced rather than assumed.
  The modal state is deliberately excluded from the sweep: `/services/<uid>` and
  `/team-members/<uid>` have no `.form-modal` on live at all, so running it
  there would be measuring live's own dead buttons.

- [PHASE 6, round 1 — content gate re-run] Checklist item 4 ("re-run text-diff
  AND style-census — fixes since Phase 2/3 regress content and styles").
  style-census: CLEAN. text-diff yfv @1440: 26 residual rows, EVERY one assigned:
  - 14 negative-y — the off-canvas nav + form modal artifact class.
  - 3 — `<br>`-split heading: live is `We are excited to meet <br>and care for
you.`, verified in the saved HTML, so live yields two text nodes to our one.
  - 5 — Google Maps embed internals ("keyboard shortcuts", "terms", "report a
    map error"…), inside the already-declared floor.
  - 3 — our slider live-region announcements, the declared a11y additions.
  - 1 — "book an apointment": live's typo against the corrected spelling Tucker
    chose to ship. The ACK'd copy deviation, showing up in a second gate.
    ONE REAL DEFECT FOUND AND FIXED: live's exam intro carries an inline
    `<strong>We ask for 2 hours of your time.</strong>` — SPEC.md §11 recorded it
    ("keep the tag") and the migration had dropped it, so live's paragraph is
    three text nodes to our one. Restored via `withStrong` in beachfront-pages.js,
    which propagates to the seed as well as the gate surface.
    Geometry and type unchanged: gate p8 yfv 21/24; census CLEAN.
    Checklist status: item 4 DONE. Items 1 (floors judged by chrome), 3 (hover
    sweep), 5 (small-text sweep), 6 (paired walkthrough) and 7 (ledger
    reconciliation) still open; item 2 (interaction inventory complete) is blocked
    on the per-page Phase 5 work and on the UNRECONCILED chrome counts.

- [PHASE 6, item 3 — hover sweep] `matching/hover-sweep.mjs`. Parses every
  `:hover`/`:focus` rule block out of `beachfront.css` (42 of them), strips the
  pseudo-class, finds the element on LIVE and measures the rest→hover delta for
  the properties the rule actually declares. Rules whose selector matches
  nothing on a page are ABSENT (they belong to another page); rules whose
  element is present but changes nothing measurable are INERT. Across home + yfv:
  18 ACTIVE, 13 INERT, 53 ABSENT-instances.
  DEFECT FOUND: three DISTINCT hover values that I had flattened to one, two of
  which COMPOUND on live — `a:hover` .6, `.header-logo:hover` .5
  (`beachfront.css:6096`, census row 16) on the IMG, and
  `.header-hamburger:hover` .4 (`:6114`, row 17). Live's logo therefore settles
  at .6 x .5 = .3 effective and its hamburger at .4, where ours sat at a flat
  .6 for all three. The Phase 5 chrome round did NOT catch this: its state
  checks the LINK, and the link's .6 was right — the compounding img was
  invisible to it. That is the value of sweeping the stylesheet rather than
  only the states you thought to write.
  Still to verify against ours (all page-specific, i.e. Phase 5 per-page work):
  `.expanding-box` 0→1, `.qa-block` 0→1, `.plus-minus-block` .51,
  `.head-link` .6, `.primary-on-hover` 0→1, `.big-review-arrow-*` 0→1,
  `.visit-list-item`, `.services-links` .6, `.social-logo-big-review` .6.

- [PHASE 6, item 6 — paired walkthrough] `matching/walk.mjs`. Reads the page's
  paths and anchors straight out of `gate.sh` so the walkthrough can never cover
  a different census than the pixel gate, scrolls each section into view,
  settles it, and shoots ref+cand pairs into `matching/states/`.
  home @1440 captured: 8 sections, anchors within 0–23px on both sides.
  VERDICT — section 04 "Our dental team in Redondo" (LOOKED AT, not inferred):
  left column matches almost exactly — same wrap points, same button position.
  The RIGHT column is OFFSET: our three service links sit ~35px higher and ~20px
  left of live's. Row PITCH is identical (160px both sides).
  **This is the model the three-strikes region needed.** Attempt 3 changed the
  link-list GAP to reproduce live's 480/384 column height; the pitch was already
  correct, so that attempt was fitting the wrong variable and it made the region
  worse. The defect is the column's START POSITION (and a horizontal offset),
  not the spacing between its rows.
  Not attempted — the region is at three strikes and the operator has not
  released it. Recorded here so a fourth attempt starts from evidence.
  Sections 00-03 and 05-07 captured but NOT yet reviewed; item 6 stays open
  until every pair has a written verdict.

- [FOUR STRIKES — home @834 "Our dental team in Redondo"] Operator released the
  region for a fourth attempt on the strength of the walkthrough's new model.
  Result: 10.9% -> 10.8% -> 10.9%. It did NOT close, and the attempt is only
  half kept:
  - KEPT (verified): the icon→label gap is 40 on live against our 20. Our label
    now starts at x=860 at 1440, matching live's 860 exactly [probed after].
  - REVERTED (a no-op): `h-full justify-center` on the link list. The walkthrough
    said live's list is centred in a 480-tall column with ~30px above; ours
    measures 640x422 with row0 at the column's very top, so there is nothing to
    centre — our column is exactly as tall as its content and never stretches to
    live's 480. Keeping a change that provably did nothing would be carrying an
    unevidenced edit.
    What the fourth attempt established: the ROW is the missing piece. Live's
    `._w-full.display-flex` is 520 tall with both columns at 480; ours is 502 with
    columns at 422. So neither column stretches on our side and both are ~58 short
    — the offset the walkthrough saw is a symptom of that, not its cause.
    Blocked on evidence I could not get: live's service rows are not
    `<a>`-with-text, so the selector that measured ours returned NONE on live and
    I could not dump its row/column boxes directly. The next attempt needs live's
    actual `.head-link` / `.flex-vertical` markup read out of the saved HTML
    first — the same "read the real class names from source" step that fixed
    probe-atd-offset.mjs and cracked ask-the-doctor.
    Stopped here rather than taking a fifth swing.

- [PHASE 6, item 6 — home @1440 pairs 00 and 02 reviewed]
  VERDICT 00 "Finally have a dentist": MATCH. Heading, the three Comfort/
  Comprehensive/Caring cards, the MEET YOUR TEAM eyebrow and the headshot row
  all land together. One residual: the team-carousel arrows sit ~10px further
  toward the screen edges on ours (live x≈31/1414, ours x=0/1404).
  VERDICT 02 "Serving the South Bay": two real defects, BOTH now fixed, and
  both were passing the pixel gate at 0.10 — this is the walkthrough earning
  its place.
  - the "what they say:" hand mark carried a `-rotate-6` live does not apply.
    Live's slant is IN the artwork, which is why its box is 240x57 against our
    rotated 228x77, and its arrow is 120x51 where ours was 67x34 — barely half
    size. Both now measure live's box exactly: 240x57 @ x=160 y=1956 and
    120x51 @ x=260 y=2016 [probed after].
  - the review-slider arrows sat 24px further out on each side and 64px lower.
    Now x=360 / x=1050 @ y=2116 — live's own 360/2116 and 1050/2114.
    Geometry and type held: gate w1 home 24/27, census CLEAN.

- [PHASE 6, item 6 — home @1440 pair 06 reviewed] "Ready for great dental
  health": the heading lands exactly; two spacing defects below it, both inside
  a region the pixel gate passes.
  - heading→"Book Appointment" gap was 96 against live's 85 [probed both].
  - live's "Read Reviews" GROUP is 220 wide against our 165, because live's
    holder is an unclassed `div` inheriting `body{font-size:64px}` and the gap
    between the label and the `+` is that 64px WORD SPACE — 31px, where our
    flex row had `mr-3` (12, measured 17). Third time this project has been
    caught by live's inherited body type; set explicitly here because our button
    is a flex row with no text node between the two children.
    Both now match: pill gap 85, label starting at x=610 like live's.
    And the census immediately caught a consequence of yesterday's `<strong>`
    restoration: the tag renders at weight 400, not live's 700, because the
    wrapper sets `[&_p]:font-light` (300) and preflight's `strong{font-weight:
bolder}` resolves RELATIVE to it. Fixed with an absolute `[&_strong]:font-bold`
    — the same direct-hit rule the sizes beside it already follow.

- [PHASE 6, item 6 — home @1440 pairs 05 and 07 reviewed]
  VERDICT 07 (footer): our three columns were 416 wide with a 16px gap
  (`lg:gap-4`), pushing the middle column to x=512 and the map to x=943. Live's
  are 422 and BUTT together: col1 x=80, col2 x=502, col3 x=924 [probed].
  FIXED — ours now 422 @ 502. Residual, unfixed: the boilerplate row is
  distributed ~4% wider than live's (live x=100/397/643/861, ours
  100/410/670/901), and the map's own Google UI differs (declared floor).
  VERDICT 05 — a finding the pixel gate STRUCTURALLY CANNOT SEE, and the reason
  is worth recording. Live's `.ask-the-doctor-handwriting-anchor.click-through`
  is `position:sticky; top:0; height:10rem` [probed: sticky, top 0, h 400, z 6],
  so the hand mark and Dr Quan's headshot TRAVEL with the scroll. Ours is
  `absolute; top:100px; height:0` with a JS glide (`floatAlong`), and at the
  same scroll offset the pair sits ~150px below live's. A full-page screenshot
  renders a sticky element at its UN-STUCK position, so page-diff scores the two
  as identical; only scrolling to the section and shooting the viewport shows it.
  ATTEMPTED AND REVERTED: `md:sticky md:h-[320px] lg:h-[400px]` reproduces live's
  computed box exactly (sticky, top 0, h 400) but adds 400px of FLOW height to
  our list container, and home fell 24/27 -> 23/27 with "Our dental team in
  Redondo" at Δh 48.5%. So live absorbs that 400px somewhere our DOM does not —
  the next attempt needs live's list container measured with the anchor IN it,
  not the anchor alone. Reverted; home back to 24/27.
  Also unfixed in 05: our `.qa-text` wraps ~100px narrower than live's (live's
  card-07 title breaks after "for my", ours after "routine").

- [PHASE 6, item 6 — home @1440 pairs 01 and 03 reviewed]
  VERDICT 00 (repeat, for completeness): MATCH; only the team-carousel arrows
  sit ~10px further toward the screen edges than live's.
  VERDICT 03 "Your Path to Oral Health": heading, subtitle, circular photo and
  all three STEP labels land exactly. The step TITLES wrap differently — live
  breaks "Have a / Complete Exam" and "Receive a / No-Pressure Plan"; ours
  breaks "Have a Complete / Exam" and "Receive a No- / Pressure Plan". This is
  the already-ledgered `<br>`-split artifact: live hard-codes the break in the
  CMS text and our content has none. Worth noting that ours hyphen-breaks
  "No-Pressure", which reads worse than live's; carrying live's break into the
  content would fix it the same way the exam intro's `<strong>` was fixed.
  Not changed — it is a content decision, and it is on the report.
  home @1440 walkthrough status: 6 of 8 pairs reviewed (00, 02, 03, 04, 05, 07).
  01 and 06's siblings remain, plus every pair at 390.

- [deviation | PUBLISHED CONTENT — the Prismic round trip drops what the fixture sets]
  Discovered by comparing the REAL routes against /dev/match/_, which no gate
  had ever done: every gate runs against /dev/match/_, and that route reads
  src/lib/beachfront-pages.js directly, so nothing the seed loses was visible.
  Full-page diff, real vs matched, at 1440:
  / 29.46% Δh -316
  /services 19.71% Δh -168
  /our-team 13.87% Δh -168
  /your-first-visit 7.37% Δh -169
  /ask-the-doctor 5.19% Δh -168
  TWO independent loss mechanisms, both silent (HTTP 200, no warning):
  (1) The Migration API drops any field the slice model does not declare.
  Four were undeclared: hero/subpage `image_position` `heading_style`
  `hero_wash`, carousel/review `layout`. Every dropped value was a
  NON-default, so the three subpage heroes fell back to a centered,
  washed, plain-styled hero (24-43% of the first viewport) and home lost
  the Read Reviews expander under the review slider.
  Fixed in the models; not live until the models are PUSHED to Prismic
  and the pages re-seeded.
  (2) The Migration API strips `\n` from StructuredText. The closing CTA
  heading is live's `Ready for <br>great dental <br>health?` — 3 lines,
  h=504. Seeded, it came back unbroken: 2 lines, h=336. That is the
  -168 on every page. Fixed by giving the copy back to CtaBand.
  NOTE this retires the open question on the "Your Path to Oral Health" step
  titles above: carrying live's hard breaks into the CMS text CANNOT work via
  `\n` — mechanism (2) would eat them. A break that must survive has to live
  in the component, or be modelled as real structure (separate blocks/fields).
  Both mechanisms now have a mechanical check in
  src/lib/beachfront-pages.test.ts, verified failing before verified passing.

- [deviation | `id="hero"` on every subpage hero, not just ask-the-doctor]
  Live carries `id="hero"` on exactly one page — `<section id="hero" class="hero
ask-a-dentist">` on /ask-the-doctor — because that is the only page whose
  content ends in the `Back to Top` pill (`<a href="#hero">`). We copied the
  pill verbatim but never its target, so the link went nowhere and `pnpm build`
  hard-failed: SvelteKit's prerenderer resolves in-page anchors and errors on a
  missing id. Emitting it from SubpageHero unconditionally means our-team and
  services carry an unused attribute live lacks. Accepted: an `id` is inert —
  invisible to the pixel gate and the style census — and scoping it would mean
  teaching the hero which sibling slices its page has. Verified: build passes.

- [VERIFIED — the Prismic round trip now preserves everything, release published]
  Master republished 2026-08-06T16:58. All five previously-stripped fields are
  present on the published documents: home `carousel.layout="home"`,
  your-first-visit `collection_list.order_uids` (11 uids), our-team
  `heading_style=meet image_position=left-bottom`, services
  `image_position=left-bottom hero_wash=false`, ask-the-doctor
  `image_position=top`; the closing band's heading is 0 blocks on all five, so
  CtaBand's 3-line default applies; and yfv's book_label is "Book an
  Appointment". (`heading_style` absent on services/atd and `layout` null on
  yfv are CORRECT — the fixture sets them only where live differs from the
  component default.)

  Full-page diff, REAL route vs its /dev/match/* twin, 1440, before -> after:
  / 29.46% Dh -316 -> 0.29-0.58% Dh 0
  /services 19.71% Dh -168 -> 0.04% Dh 0
  /our-team 13.87% Dh -168 -> 0.01% Dh 0
  /your-first-visit 7.37% Dh -169 -> 0.03% Dh -1
  /ask-the-doctor 5.19% Dh -168 -> 0.00% Dh 0
  Every height delta is now 0 (yfv -1px), so the structural loss is fully
  closed. Home's residual is NOT a defect: it varies run to run
  (0.29/0.45/0.58 over three measurements) and a 200px-band scan finds no band
  above 0.3%, i.e. it is diffuse sub-threshold noise from slider position and
  reveal timing differing between two independent page loads — the same class
  the settled-scroll protocol exists to manage. The real routes are now
  equivalent to the surface every gate was measured against.

## FOOTER BOILERPLATE — deliberate divergence from live (2026-08-07, branch feat/site-improvements)

- [deviation | operator-directed 2026-08-07: "remove all and make the copyright
  current"] footer `.footer-boiler-holder` row — live ships FOUR plain-text
  items ("©2023 Beachfront Dentistry", "All Rights Reserved", "Privacy Policy",
  "Sitemap") and this rebuild reproduced all four exactly. Two of them are dead
  navigation: "Privacy Policy" and "Sitemap" are not links on live — every
  captured page renders the row as
  `<div class="footer-copyright">Privacy Policy</div>`, plain `<div>`s with no
  `<a>` (matching/spec/index.html and all six subpage captures) — and they lead
  nowhere here either, so they read to a patient as broken links; the year had
  been frozen since 2023.

  Replaced by ONE derived line, `copyrightLine()` in src/lib/site.ts:
  "© <current year> Beachfront Dentistry. All Rights Reserved." The year is
  computed at render (build time for the prerendered routes), never typed —
  a literal is only correct until the next January, which is precisely how live
  reached 2023. Guarded by src/lib/site.test.ts ("copyrightLine()", 4 asserts,
  including an explicit "no hardcoded past year").

  MATCHING IMPACT — measured, not predicted. `bash matching/gate.sh
rfooter0807 home` (threshold=0.1, no masks, matrix 1440/834/390):
  24/27 PASS, the SAME 24 as the pre-change baseline out-perffix-home. Diffing
  the two runs row by row, exactly ONE of 27 regions moved:

  PASS vw1440 Want to learn more mm=7.2% -> 7.3% dE=2.7 Dh=1.7% (both)

  Every other region, including the two footer rows that fail on the map floor
  (vw390 13.4%, vw834 12.0%), is byte-identical — the boilerplate row is 7px
  text at mobile and 12px at desktop, so at the small sizes the delta is below
  the report's precision. One page is the complete test here: the footer is
  shared chrome rendered from the layout, and home exercises it at all three
  matrix viewports. This is the first intentional CONTENT divergence from the
  reference on the nav pages, so it is ledgered rather than treated as a
  regression when a future round sees the footer number sit 0.1pp higher.

- [content | operator-directed 2026-08-07: same instruction] three published
  news_articles head their related-links list with "Related reading (internal
  links)" — the parenthetical is an SEO brief telling the writer what to put
  there, published verbatim as body copy. Trimmed to "Related reading" (the
  heading introduces a real list of two article links, so dropping the whole
  block would take the heading with it). Handled in scripts/lib/body-links.mjs
  `SCAFFOLDING`; affects how-to-stop-a-toothache-fast,
  when-tooth-pain-is-a-dental-emergency, why-do-teeth-hurt-more-at-night.
  Invisible to every gate — the gates read /dev/match/*, which never touches
  news_article — so the mechanical check is scripts/lib/body-links.test.js.

## YFV FORM CTAs REMOVED — deliberate divergence (2026-08-07, feat/site-improvements)

- [deviation | operator-directed 2026-08-07: "remove both buttons"]
  /your-first-visit "Registration Form" (first_visit_toc) and "Download Forms"
  (exam_timeline). Live ships BOTH as `href="#"`
  (matching/spec/your-first-visit.html: `<a href="#" class="button
text-color-primary w-button">Registration Form</a>` and `<a href="#"
class="button text-color-primary-dark mt-2 w-button">Download Forms</a>`),
  and the rebuild reproduced the dead target faithfully. They render as real,
  focusable, styled CTAs that do nothing — the worst kind of dead link, because
  the affordance looks live. There is NO forms destination anywhere in the
  reference to point them at: app.modento.io/beachfront-dentistry is the only
  external host live links to and it sits exclusively behind "Make a Payment",
  so aiming a registration link at it would send a patient expecting paperwork
  to a payment screen. Presented to the operator with three options; answer was
  remove.

  Both fields are dropped from the FIXTURE only
  (src/lib/beachfront-pages.js). FirstVisitToc and ExamTimeline already render
  the CTA `{#if p.form_label}`, and both slice models still declare
  form_label/form_link, so restoring the button is one edit in Prismic the day a
  real URL exists — no code change. Guarded by beachfront-pages.test.ts's
  "wires no link to a dead '#' target", verified to fail (naming both
  form_link paths) with the fixture restored.

  GATE — bash matching/gate.sh rforms0807 yfv (threshold=0.1, no masks,
  matrix 1440/834/390): 21/24 PASS, the same count as the baseline, but the
  regions moved and the movement is the point:

  - @834 NOTHING changed. Every anchor is byte-identical to the previous run.
    The buttons share a row there and the row height is set by the survivor.
  - @390 the previously ACK-ACCEPTED failure is RESOLVED, and not by accident.
    Probed: the TOC section box is h=474.2 on BOTH pages, with 01/02/03 and the
    button at identical offsets (+170.5/+230.5/+290.5/+375.8). Live's two
    buttons share one row (both at +375.8, w=170.1 and 151.1). Our corrected
    spelling makes that button 178.9 wide instead of 170.1, and those 8.8px
    wrapped "Registration Form" onto a second row — the +76px that had been
    ACKed on 2026-08-05 as "the extra letter". Removing the second button
    collapses the wrap: every anchor from "Office Tour" down went from 76-77px
    tall (993 vs ref 917 … 5696 vs 5619) to within 1px of live (917/917 …
    5619/5619).
  - @1440 the cost lands here: live STACKS the buttons at desktop, so removing
    one shortens the TOC region by 84px (ref 557 -> cand 473, dh=15.1%) and every
    anchor below shifts up 84px. This is a NEW failing region, accepted on
    purpose. It is the price of the removal, not a layout bug — the paired
    captures matching/states/yfv-toc-{ref,cand}-1440-formsremoved.png (local
    only; matching/states/\*.png is gitignored) show the surviving button
    correctly spaced above "Office Tour", no dangling gap. Do NOT chase it as
    geometry.
  - exam_timeline lost no height at any viewport (that region's dh is 2.7% at
    1440, was 2.8%) — "Download Forms" sat beside "Book Appointment".

## A11Y AUDIT MOVED TO REAL PAGES (2026-08-07, feat/site-improvements)

- [a11y | OPERATOR DECISION OPEN] brand cyan `#129ecc` on the pale band
  `#e7f5fa` measures **2.77:1 against a 3:1 threshold** — WCAG 2.1 AA (1.4.3)
  for large text, missed by 0.23. Found by pointing axe at real routes for the
  first time (tests/a11y/pages.spec.ts); the suite had only ever audited three
  `/dev/*` fixtures, which cannot show a slice's colour against the section it
  actually lands in.

  ONE root cause, every failing node identical (axe's own fg/bg data):
  /services 4 nodes - the service-block <h3> titles, 40px
  /our-team 11 nodes - every team member's <h5> name, 30px
  /your-first-visit 4 nodes - "Registration Forms" <h5> + the 25px CTA
  Nothing else on any of the nine audited pages violates anything.

  This is the SAME defect already resolved for the footer's "Want to learn
  more?" heading, where the operator ACKed swapping live's cyan for the AA-safe
  `--primary-deep` ("footer color is fine", 2026-08-03). That ACK was scoped to
  one heading; this is the same swap across three pages' most prominent
  headings, so it is a brand-colour decision and is NOT being taken unilaterally
  on a pixel-matching rebuild. Measured candidates on the pale band:
  #129ecc 2.78:1 live's cyan, current, FAILS
  #0f8fb8 3.34:1 minimal darkening, closest to the brand
  #0e7799 4.58:1 the existing --primary-deep token, already in the footer
  Either passes; the choice is how far from live's cyan to move.

  NOT suppressed while it waits. pages.spec.ts records the rule per page AND
  asserts the exact colour pair, so a contrast failure with any other pair fails
  the run, and any new rule on any page fails it too — verified by removing
  /services from the known list (fails, naming all four <h3>s) and by altering
  the expected pair (fails, naming the real one). Deleting the constant when the
  colour is chosen tightens the suite to zero automatically.

- [a11y | third-party] the YouTube player on service detail pages reports
  aria-allowed-attr, aria-prohibited-attr and button-name violations INSIDE its
  iframe. Google's markup, not ours, and unreachable from here — excluded by
  iframe src alongside the footer Google map (already a declared pixel floor).
  Everything around both embeds is still audited.

## PUBLISH VERIFIED (2026-08-07, release published by the operator)

The Migration release containing the link repairs, the article-scaffolding
trim, the yfv form-CTA removal and the SEO tab was PUBLISHED. Verified with the
new matching/gate-published.mjs, which is the check CLAUDE.md has required since
the migration defects ("after any seed, diff a real route against its
/dev/match/* twin") and which nothing previously automated.

All 5 core pages x 1440/834/390 — height delta 0 EVERYWHERE, 0 text lines lost:

home 0 / 0 / 0
your-first-visit 0 / 0 / 0
our-team 0 / 0 / 0
services 0 / 0 / 0
ask-the-doctor 0 / 0 / 0

So the Migration API dropped nothing this time: every field the fixtures set
survived the round trip, which is only true because the slice models and the
`page` custom type were pushed first (assertModelsInSync in seed-pages.mjs,
push-custom-types.mjs reporting "All custom types match Prismic").

Head fields, which live ONLY on the published document and are invisible to
every pixel/text gate: all five meta descriptions present (143-150 chars), and
home's meta_title override live as "Beachfront Dentistry | Dentist in Redondo
Beach, CA". Published article bodies re-scanned: 0 blocks still carrying
"(internal links)", 4 clean "Related reading" headings.

## QA CARD ANSWER WAS CLIPPED ON HOME (2026-08-07, operator-reported)

- [defect | FIXED] `.qa-text` is `overflow: hidden` and holds the answer that
  slides in when an "Ask the Doctor" card opens. Live gives the HOME (teaser)
  variant of that box TWO heights:
  .qa-text.m-2 { height: 3rem } (:7292)
  .qa-text.m-2.active { height: 8rem; transition: height .2s } (:7303)
  Only the collapsed 3rem was implemented, so the box stayed 72/96/120 in both
  states while the answer sliding into it is 172-193px tall. Measured before the
  fix, first home card, after opening:
  1440 box 120px answer 193px CLIPPED 73px
  834 box 96px answer 172px CLIPPED 76px
  390 box 72px answer 183px CLIPPED 111px (61% of the answer hidden)
  The box is `justify-end`, so it cut the ANSWER COPY from the top while leaving
  "Read More" visible — which is why it read as truncated text, not a dead card.

  The active rule is never overridden: `.qa-text.m-2.active` (three classes)
  beats the <=767 `.qa-text { height: 10rem }` (one class), so 8rem holds at
  every width — 320 / 256 / 192 against live's stepped root (40/32/24).
  After the fix, ours vs live, same probe:
  1440 ours box 320 answer 193 (fits) live box 320 answer 214 (fits)
  834 ours box 256 answer 172 (fits) live box 256 answer 183 (fits)
  390 ours box 192 answer 183 (fits) live box 192 answer 195 (clips 3px)
  Box geometry now matches live exactly at all three; live clips 3px of its own
  slightly longer copy at 390, which we do not reproduce.

  ONLY the expanded height changed. The COLLAPSED box is deliberately untouched
  because it is the element page-diff cuts on for the "Beyond the Smile" anchor.
  Confirmed zero pixel cost — `bash matching/gate.sh qafix0807 home atd`,
  threshold 0.1, no masks, matrix 1440/834/390: home 24/27 with every row
  BYTE-IDENTICAL to the previous run, atd byte-identical to its baseline.

  WHY NOTHING CAUGHT IT: every gate in this project — page-diff, style-census,
  text-diff, and the new gate-published — measures the page in its DEFAULT
  state. This defect exists only after a click. That is the matching skill's
  Phase 5 (interaction states) blind spot, and it had no mechanical check at
  all. tests/interaction/qa-expand.spec.ts is now that check: it asserts the
  RENDERED GEOMETRY (answer scrollHeight <= clipping box height, and Read More
  inside the box) at all three viewports, plus the collapsed contract (answer
  translated out, `inert` so the hidden link stays untabbable). Verified to fail
  on the pre-fix component at all three viewports with the exact numbers above.

## INCIDENTAL-UTILS REFORMATTED — deliberate divergence (2026-08-10, fix/fleet-audits)

`matching/spec/incidental-utils.js` was prettier-formatted to clear the fleet
lint audit (reddoor-maintenance `src/audits/lint.ts` globs `**/*.{ts,js,svelte}`
and consults neither `.prettierignore` nor `.gitignore`, so the untracked
capture was audited and failed). The file is NO LONGER a byte-faithful copy of
live's `raw.githack.com/tucksravin/incidental-js/main/webflow/utils.js` —
tabs→spaces, single→double quotes, semicolons added; 55 → 51 lines. Every rule
it states is semantically unchanged. Line citations re-mapped in spec-sections
(and SPEC.md rebuilt): `toggle` 14-23 → 14-22, resize decoupler 34-36 → 33-35,
`getContentWidthMargin` 43-51 → 41-50. `services.md` census line
"`incidental-utils.js` — **1**: 14" still holds (toggle still starts at 14).
Future byte-diffs against live's raw file will mismatch on whitespace/quotes —
compare semantically, or re-capture and reformat.

## REFERENCE MOVED — production cut over, gate REF repointed (2026-08-10, feat/markup-round-2026-08)

- [infrastructure] `www.beachfrontdentistry.com` no longer serves the Webflow
  reference: it 301s to the apex, which serves OUR Netlify build (verified
  2026-08-10: 29 `_app/immutable` asset refs, zero `website-files.com` refs,
  `server: Netlify`). The cutover happened after the 2026-08-07 23:40
  qafix0807 run — that run still measured the stalled team region at its
  historical 10.9%, which our own build would not produce. From the cutover
  until today, `matching/gate.sh` was silently comparing the candidate with
  itself; any run in that window would have gone green for the wrong reason
  (none were run).
- [fix] gate.sh REF → `https://beachfront-dentistry.webflow.io` — the Webflow
  original is still published there under the same site id
  (`data-wf-site="64af3f93339537d6b661b556"`, `home-hero-heading` present).
  matching/pages/*.live.html (Last Published 2026-07-22) remain the frozen
  markup captures. First run against the new REF is tagged `mkbase`
  (pre-markup-round baseline) so score drift REF-side (e.g. a staging-domain
  webflow badge, if any) is separable from this round's deliberate changes.

## MARKUP ROUND — the five left gutters become ONE (2026-08-10, feat/markup-round-2026-08)

Designer round, MarkUp board d486b3c5-eed8-4324-9158-289bd4ee8ccb (Tim Holmes,
2026-08-07, pinned on deploy-preview-17 at ~1294px). The home page had FIVE
differently-computed left gutters that coincide near x=80 only at exactly
1440 — at 1294 they splayed to 24/48/60/73/80. Probing the REFERENCE
(webflow.io staging) showed live itself keeps ONE gutter almost everywhere:
`.content-width` = 80/60/60/48/19.5 at 1440/1294/1200/834/390
(beachfront.css:5858-5867, 8%≤767 :8627-8630, 5%≤479 :9164-9167). Three of the
five pins were therefore OUR matching bugs that the 1440-only lg sampling had
hidden; two are real deviations Tim requested. After the round, every probed
anchor (logo, hero h1, "Finally" heading, first card, MEET YOUR TEAM title,
first team circle, FIJI label, footer heading) sits at 80/60/60/48/19.5, and
the hero CTA's right edge equals the hamburger's at 1440/1294/1200/834
(1360/1234/1140/786).

- [fidelity fix] hero h1 box — thread ebedbcc9-3c30-42e5-b3f4-7089fe36be86
  (pin #1, https://app.markup.io/markup/d486b3c5-eed8-4324-9158-289bd4ee8ccb/#thread/ebedbcc9-3c30-42e5-b3f4-7089fe36be86).
  Ours was max-w-1360+px-6 (h1 x=64/24/24/24/24, from the pre-matching build);
  live's h1 sits in `.content-width` (probed 80/60/60/48/19.5). Now the shared
  gutter box (Hero/index.svelte). The video region's pixel floor (top region
  mm 6-7% PASS) hid a 16-24px error at every width — pin #1 was a matching
  defect report, not a taste request.
- [deviation] hero CTA right edge — thread 2c0b1886-c579-43c0-aa70-d8c1f274c520
  (pin #2, https://app.markup.io/markup/d486b3c5-eed8-4324-9158-289bd4ee8ccb/#thread/2c0b1886-c579-43c0-aa70-d8c1f274c520).
  Live: `.button.position-absolute-bottom-right` right:2rem inside
  `.content-width` (beachfront.css:6073-6076) → right edge gutter+20px in
  (1340@1440, 1214@1294). Tim: "right align to the hamburger menu" → offset is
  now the gutter itself, `lg:right-[max(60px,calc(50%_-_640px))]` → 1360@1440
  (unchanged — ours was already 1360, a pre-existing 20px infidelity at 1440),
  1234@1294 = hamburger. Deviates +20px from live everywhere in lg; invisible
  to the gate matrix (1440 row unchanged).
- [deviation] "Finally…" card row — thread bdabccea-788f-4df8-9832-12a64544cba5
  (pin #3, https://app.markup.io/markup/d486b3c5-eed8-4324-9158-289bd4ee8ccb/#thread/bdabccea-788f-4df8-9832-12a64544cba5).
  Live insets the three `.expanding-box` cards 12.5px inside the content box
  (margin 0 12.5px, beachfront.css:6927-6928; width calc(33% − 25px),
  index.html:88-102; probed first card x=92.5@1440, 72.5@1294). Tim: flush to
  the heading → dropped our `lg:px-[13px]` (SectionGrid/index.svelte); cards
  grow 397→406 in the same 1280 box, gap stays live's 31px. First card now
  80@1440 vs live 92.5 — EXPECTED gate diff in "Finally have a dentist" @1440.
  Tablet/mobile columns untouched (live's own x=112 indent at 834 stays; pin
  was the desktop row).
- [fidelity fix] team rail inset — thread 234a7635-c747-45c2-b7a2-9cb27cdefb6b
  (pin #4, https://app.markup.io/markup/d486b3c5-eed8-4324-9158-289bd4ee8ccb/#thread/234a7635-c747-45c2-b7a2-9cb27cdefb6b).
  Live sets `.heads-slider-holder` padding-left with JS getContentWidthMargin()
  (index.html:177; matching/spec/incidental-utils.js:41-50; SPEC §3.3) = the
  content gutter at every width. Our fixed trackPadStart="80px" reproduced the
  1440 sample only (first circle 80 at 1294 vs title 60). Now
  "max(60px, calc(50% - 640px))" — that function in pure CSS
  (CollectionList/index.svelte team variation). Identical at 1440/834/390 →
  no gate movement; the stalled "Our dental team in Redondo" @834 region is
  NOT re-attempted by this round (strikes.mjs: flat 10.9% across 29 runs,
  awaiting operator).
- [deviation + fidelity fix] FIJI ISLANDS label — thread
  9ae81c12-aef2-4a2f-bec2-26aacad680f4 (pin #11,
  https://app.markup.io/markup/d486b3c5-eed8-4324-9158-289bd4ee8ccb/#thread/9ae81c12-aef2-4a2f-bec2-26aacad680f4).
  Live `.cta-beach-label` left: 60px in `.content-width`
  (beachfront.css:6372-6379 → 80/60/60/60), 8%≤767 (:8714-8717), 5%≤479
  (:9248-9251). Ours was 5% + lg:left-20: WRONG vs live at 992-1399 (80 vs 60)
  AND at 480-767 (5% vs 8%). Now the shared-gutter ladder
  (5% / xs 8% / md 48px / lg max(60px,50%−640px)): equals live at every width
  EXCEPT 768-991, where Tim's "left-align all the way down" takes the 48px
  gutter over live's 60px. EXPECTED (improving) gate movement @834 in every
  "Ready for great dental health" region that shows the beach band: label x
  41.7 → 48 against ref 60. Applies to all six nav pages (Hero cta hardcodes
  the caption, Hero/index.svelte:186).
- [fidelity fix] footer gutter — same thread 9ae81c12 (pin #11). The old model
  ("flat 48px from 768 up" + inner 1280 cap, Footer.svelte) reproduced live's
  1440/834/390 samples but is 12px short across 992-1399: live's footer box is
  the `.content-width` ladder (1.5rem stepped root → 60px ≥992; probed footer
  heading x=60@1294/1200 vs ours 48). Wrapper is now the shared gutter box;
  at ≥1400 the render is byte-identical (1400−120 = the same 1280 column), so
  no gate movement at any matrix width.

Verification: matching/probe-markup-align.mjs (kept). AFTER, cand:
1440 all-anchors 80 · 1294 all 60 · 1200 all 60 · 834 all 48 (card 112 = live's
own tablet indent; logo 20@390 = live's nav px-20 vs 5% content quirk) ·
390 all 19.5; CTA right = hamburger right at 1440/1294/1200/834.
Gate rounds: mkbase (pre-edit baseline, new REF) → markupa1 (post-edit).

## MARKUP ROUND A2 — /your-first-visit, five pins (2026-08-10, feat/markup-round-2026-08)

Designer round, MarkUp board 4b8d52d2-fdc8-4432-83e5-1fd2339dc420 (page
/your-first-visit). Before/after probe: scratch probe-yfv-a2 at
1440/1354/1294/834/390 against the webflow.io reference. Baseline gate:
markupa1-yfv (24 regions; fails = footer WTLM 12.85@390 / 12.01@834 and the
operator-ACK'd "We want you to feel comfortable" hΔ15.08@1440 — all
pre-existing).

- [fidelity fix] group-photo hero h1 — thread
  ed09da97-36ac-4ad9-b796-c53c5a0f580c (pin #1,
  https://app.markup.io/markup/4b8d52d2-fdc8-4432-83e5-1fd2339dc420/#thread/ed09da97-36ac-4ad9-b796-c53c5a0f580c).
  Two defects, both ours. (a) Live's `.first-visit-heading` is absolute with
  no `left`, so its static position inside `.content-width` IS the gutter
  (your-first-visit.html:121; beachfront.css:6593-6605 + gutter ladder
  :5858-5867/:8627-8630/:9164-9167; ref probed 80/60/60/48/19.5). Ours was
  `left-5 lg:left-20` — right at exactly 1440, wrong everywhere else
  (80@1354/1294 vs 60; 20@834 vs 48; 20@390 vs 19.5). Now the shared gutter
  ladder (Hero/index.svelte groupphoto). (b) The reference hard-breaks the
  headline after "meet" ("We are excited to meet <br>and care for you.",
  your-first-visit.html:121); we rendered one line at every lg width. The
  break is restated in the COMPONENT because the Migration API strips `\n`
  from StructuredText (docs/migration.md) — seeded content cannot carry it.
  AFTER: x=80/60/60/48/19.5, 2 lines at every width = ref. Expected gate
  movement in "top" (hero) at all three matrix widths, toward the ref.
- [deviation] toc lede top — thread a6fdb602-eefa-4fcc-9760-2470af210a60
  (pin #2,
  https://app.markup.io/markup/4b8d52d2-fdc8-4432-83e5-1fd2339dc420/#thread/a6fdb602-eefa-4fcc-9760-2470af210a60).
  "Vertically align to the top of the 1, 2, 3 list." The 20px offset is
  live's own `.text-body-large` margin-top (beachfront.css:7761), and the
  reference renders it too (ref probed tocP 620 vs list 600 at every lg
  width) — a requested deviation, not a defect. `lg:[&_p]:mt-0`
  (FirstVisitToc/index.svelte) zeroes it in the desktop row only; the
  stacked ≤991 layout keeps live's margins (delta −130/−140 @834/390,
  unchanged). Pin caveat: the pin's x lands near the arrow column, but the
  arrows were already flush — the paragraph reading is the only defect.
  AFTER: delta 0 @1440/1354. Expected small mm movement in "We want you to
  feel comfortable" @1440 (its ACK'd hΔ 15.08 floor is untouched).
- [deviation + fidelity fix] meet-our-team first card — thread
  e23604c9-fb66-4925-9878-9c3247390b44 (pin #4,
  https://app.markup.io/markup/4b8d52d2-fdc8-4432-83e5-1fd2339dc420/#thread/e23604c9-fb66-4925-9878-9c3247390b44).
  "Should left align to headline above." Fidelity half: live's h2 sits in
  `.content-width` (your-first-visit.html:121; beachfront.css:5858-5867) —
  our heading wrapper was missing the max-w-1400 cap, so it sat at 60@1440
  where live has 80. Now capped (CollectionList/index.svelte slider branch):
  h2 x=80/60/60 = live. Deviation half: live's first CARD sits a cell margin
  past the gutter (gutter + 43.33 = 123.3@1440, probed; our old
  trackPadStart="80px" reproduced that 1440 sample). Tim wants the card
  flush with the h2, so lg trackPadStart is now
  `calc(max(60px, 50% - 640px) - 43.33px)` — first-card = h2 gutter at
  every lg width (80/60/60 probed @1440/1354/1294); ≤991 tiers untouched
  (161/75 @834/390 = live's own indents). Known approximation, shared with
  A1's team rail: Slider's arrow-travel bound parseFloats the pad (NaN→0
  for calc), so the last arrow step can stop one cell short below ~1400 —
  static render and gate are unaffected. Expected gate movement @1440 in
  the team-slider region ("Dr. Robert Quan" / the region holding the h2),
  toward Tim's ask (h2 toward the ref, card away from it).
- [deviation] first-exam photo corners — thread
  4cdf4f23-cdfc-4275-b7ea-1dc764285c81 (pin #6,
  https://app.markup.io/markup/4b8d52d2-fdc8-4432-83e5-1fd2339dc420/#thread/4cdf4f23-cdfc-4275-b7ea-1dc764285c81).
  "Round corners like the registration form background to the left." NEW
  design request: the reference gives this img no radius (probed 0px both
  sides — only `.registration-forms-box` carries 25px,
  beachfront.css:6693-6695). `rounded-[25px]` on the row-1 PrismicImage
  (ExamTimeline/index.svelte), all widths. AFTER: 25px at
  1440/1354/1294/834/390. Expected small mm movement (corner pixels) in the
  exam region at all three matrix widths, away from the ref by design.
- [deviation] registration box sticky travel — thread
  2b40d1f7-b53c-4091-828d-030ad2f15f6a (pin #7,
  https://app.markup.io/markup/4b8d52d2-fdc8-4432-83e5-1fd2339dc420/#thread/2b40d1f7-b53c-4091-828d-030ad2f15f6a).
  "Should continue be sticky until the bottom aligns with the bottom of
  step six." Sticky travel is bounded by the MARGIN box, so live's
  `margin-bottom:3rem` = 120px ≥992 (beachfront.css:6693-6699) froze the
  box 120px above step six (probed 5253.6 vs 5373.6 @1440; the ref's own
  box freezes 280px short — Tim is deviating from live here too).
  `lg:mb-0` (ExamTimeline/index.svelte); ≤991 keeps live's static margins.
  No compensating spacer: the row's height is the taller steps column, so
  the section border box is unchanged at every width (probed heights
  2108.6/2089.2/2064.0/3024.5/2274.1 before = after; meetTop unchanged).
  AFTER: box bottom = step six bottom (short by 0.0) @1440/1354/1294,
  instant-scroll probe (triage's smooth-scroll probe had produced a false
  "never sticks" reading). Invisible to the gate: fullPage captures render
  the page unscrolled, where the box paints at its static position.

Verification (A2): scratch pin-probe at 1440/1354/1294/834/390, cand vs the
webflow.io ref (deleted with the round). AFTER, cand: h1 x=80/60/60/48/19.5
and 2 lines at every width (=ref); toc lede top = list top at lg; meet h2 =
first card = 80/60/60; exam photo radius 25px everywhere; sticky box bottom
= step-six bottom (short by 0.0) @1440/1354/1294 with the exam section's
border box unchanged at every width.
Gate rounds: markupa1 (baseline) → markupa2 (threshold 0.1, matrix
1440/834/390, mask [], neutralizeMedia false). Movement confined to intended
regions: "top" 2.85→0.12 @1440 / 2.45→0.66 @390 / 1.28→1.22 @834 (pin #1,
toward ref); WTFC @1440 mm 0.41→2.03 (pin #2 deviation; its ACK'd hΔ 15.08
unchanged); "Office Tour" @1440 1.13→3.20 (the pin-#4 card shift above the
Dr._Robert_Quan anchor cut; the h2 fidelity half moves toward ref);
"Dr. Robert Quan" @1440 2.14→16.24 NEW FAIL — pin #4's requested deviation
(every card 43.33px left of the ref; the diff png is pure horizontal
displacement, no breakage; @834/390 rows unchanged at 1.45/3.13). Left OPEN
awaiting operator ACK as a deviation floor (same class as the WTFC hΔ row);
threshold untouched, nothing masked. Footer WTLM floors 12.85@390 /
12.01@834 unchanged. next.mjs after: 131/153, yfv 20/24, 3 open failures
(this DRQ row, plus svc/contact outside this round).

## MARKUP ROUND B — the Q&A card cluster (2026-08-10, feat/markup-round-2026-08)

Designer round, MarkUp boards d486b3c5-eed8-4324-9158-289bd4ee8ccb (home,
pins #9/#10) and 3c082cae (ask-the-doctor, pins #1/#2). All four pins target
the shared QuestionCard / QuestionList pair. Before/after probed on
localhost:5173 / and /ask-the-doctor at 1440/834/390 with reveal transforms
neutralized (below-fold `.qa-item`s carry animateIn's translateY(160/96) until
revealed — an un-neutralized probe reads inter-card gaps up to 160px too big;
one triage number in this round's brief had that error: "~120px vertical" was
right, an earlier raw probe's 280 was polluted).

- [deviation] Read More bottom padding — threads
  3d255366-5bb2-4cb1-9a90-439d49ef63ef (home pin #9,
  https://app.markup.io/markup/d486b3c5-eed8-4324-9158-289bd4ee8ccb/#thread/3d255366-5bb2-4cb1-9a90-439d49ef63ef)
  and bd8c37b0-2e1c-4dc2-a466-8073e204d90c (atd pin #1, "Same comments as the
  homepage"). Live's `.qa-text` boxes are FLUSH — `.qa-text`
  (beachfront.css:7282) and `.qa-text.m-2.active` (:7303) end at the card
  bottom, so the revealed Read More pill touches the edge (probed offset 0px:
  teaser 1440/834/390, numbered 1440/834). Tim: "same padding as the headline
  to the bottom of box" — the headline ladder is `.qa-question`
  margin-bottom .5rem (:7311) = 12/16/20, so the box gets pb-3/4/5
  (QuestionCard.svelte textBoxClass). AFTER: offset 20/16/12 teaser,
  20/16 numbered md/lg. Two probed carve-outs: (1) numbered base keeps NO pb —
  the ≤479 expanded card is 384px over a 240px flow box (96px under the pill
  already; offset 96 before = after) and 240−12 would re-clip the tallest
  panel (231px); (2) teaser base expanded height 192→244 — the six-card sweep
  found 231px answer panels @390 that ce0c59d's 8rem=192 box (verified on a
  183px card) was ALREADY clipping by 39px, and 231+12 needs 243. AFTER:
  pClippedTop 0 on the tallest card at every width, both variations.
  Collapsed geometry untouched (padding doesn't move absolute children; the
  anchor-cut `.qa-text` heights are unchanged) — gate-invisible, and the gate
  agreed (home OdT/BtS mm flat at 1440/834).
  NOT touched: the box still expands on open — pin #9's "I don't think it
  needs to expand… Thoughts?" is a design QUESTION on a live-match behaviour
  (.qa-text.m-2.active height transition, :7303); awaiting Tim's verdict.
- [deviation] home teaser "View All Questions" gap — thread
  ce17fba0-94d6-4e22-9863-8ee192b92ecc (home pin #10,
  https://app.markup.io/markup/d486b3c5-eed8-4324-9158-289bd4ee8ccb/#thread/ce17fba0-94d6-4e22-9863-8ee192b92ecc).
  Live butts the button row against the last card (probed gap 0.0px at
  1440/834/390 — no margin between `.qa-collection-list` and the button row).
  Tim: "add 40px of space between button and last question" — stated-value
  mt-10 on the button row (QuestionList/index.svelte teaser branch). AFTER:
  40.0 at all three widths. Gate consequence on home "Beyond the Smile" (the
  region holding the 6 cards + button): Δh 1.7→3.4% @1440 / 1.5→3.6% @834
  (PASS), and @390 3.4→5.8% — over the 5% height cap, mm still 1.7% —
  NEW FAIL by stacking on the region's pre-existing ±33/63px anchor drift.
  Left OPEN awaiting operator ACK as a deviation floor (same class as the
  DRQ row); threshold untouched, nothing masked.
- [deviation] atd numbered grid 30px gap — thread
  b7be52f2-11d0-467c-b4ea-ca086b9aa29f (atd pin #2, first half; the
  "meet the team" half is Round C / CollectionList, untouched here).
  Live's spacing: `.w-col-6` padding 0 10px (20px column gutter) + the 520px
  `.ask-the-doctor-collection-item` cell over a 400px card = probed gaps
  h20/v120 @1440, h20/v96 @834, v12 @390. Tim: "consistent vertically and
  horizontally… Let's use 30px" — one gap-[30px] on the grid wrapper at every
  width, per-cell px/pb wrappers removed (QuestionList/index.svelte numbered
  branch). AFTER: h30/v30 @1440+834, v30 @390; card width 620→625 @1440,
  341.5→346.5 @834, 317.5→337.5 @390. Open-state at 30px: an expanded card
  grows inside its own grid cell (margin-top + the ≤479 re-height), auto rows
  push the rows below — probed gap-while-open 30, overlap false, at all three
  widths (screenshot atd-1440 in round scratch, deleted with it). Gate
  consequence on atd "Beyond the Smile" (the whole-grid region, 78% of the
  page): mm 4.6→61.7 @1440 (Δh 17.6%) / 1.0→60.5 @834 (Δh 16.2%) /
  1.7→66.9 @390 (Δh 5.8%); anchor deltas −1830/−1350/+690 = 19 rows ×
  (120/96/12→30). The ref cannot agree with a requested rhythm change of this
  size — left OPEN awaiting operator ACK as a deviation floor. atd "top" and
  "Back to Top" regions flat (0.2/0.3/0.7 and 0.0×3): the card x/width shift
  washes out in the pale label bar.

Strikes before the round: home @834 "Our dental team in Redondo" pixels
10.9%, flat across 31 runs — STALLED, presented for escalation, not
re-attempted (it holds §6 + card 1's collapsed label/image; this round
changed no collapsed-state geometry and the row is 10.9 before = after).
atd: clear.
Gate round: markupb (threshold 0.1, matrix 1440/834/390, mask [],
neutralizeMedia false), out-markupb-home / out-markupb-atd. Movement
confined to the two ledgered deviation regions above; footer WTLM floors
13.4/12.0 (home) and 12.8/12.0 (atd) unchanged; the two ACK-pending rows
from A1/A2 (home "Finally have a dentist" 4.6 @1440 PASS, yfv DRQ @1440)
untouched.

## MARKUP ROUND C — the person-card cluster (2026-08-10, feat/markup-round-2026-08)

Designer round, MarkUp boards 7944efa6 (our-team, pins #2/#3), 4b8d52d2-fdc8-4432-83e5-1fd2339dc420
(yfv, pin #5) and 3c082cae (atd, pin #2's meet-the-team half — its QuestionList
half landed in Round B). All four pins land on CollectionList's shared
personCard (grid on /our-team, slider on /your-first-visit). Before/after:
matching/probe-markupc.mjs (round scratch, deleted with it) on
localhost:5173/dev/match/{our-team,your-first-visit} and the webflow.io
reference, 1440/1294/834/390, reveal transitions neutralized. Reference probed
2026-08-10: our-team card1 x=200/127 @1440/1294, h-gap 40, v-gap 180.4, cards
320x480, teaser rm→banner 22 — our before-state matched every number, so each
entry below is a REQUESTED deviation from a faithful match, not a fidelity fix.
(One reference nuance: live renders "Dr. Michael Hopkins" as ONE name line at
320w where our museo-slab metrics wrap it to two, which is why only OUR build
showed pin #3's buried READ MORE — the box model live uses has the same trap.)

- [deviation] grid cards → content gutter + 30px gaps — threads
  338f6e07-02bc-4d14-9bad-45c4cd362e6c (our-team board 7944efa6 pin #2:
  "Width of these can grow so that the margins match the text margins on the
  other page… I do like the spacing in between the blocks … Let's use 40 px")
  and b7be52f2-11d0-467c-b4ea-ca086b9aa29f (atd board 3c082cae pin #2, which
  SUPERSEDES the 40: "Let's use 30px. That is a happy medium for all things
  considered."). Live: fixed 320px (8rem) cards with margin 4rem .5rem .5rem
  ≥992 (`.team-list-item.m-2`, beachfront.css:6530-6536 + :6538-6540),
  justify-centred in the 1280 grid box → probed x=200/127 @1440/1294, 40px
  h-gap, 180px v-gap (= ours before). Tim: card outer edges on the shared
  content gutter, 30px both axes → at lg the `.team-grid-section` becomes
  the `.content-width` box (max-w-1400 + lg:px-[60px],
  beachfront.css:5858-5867 = max(60px, 50% − 640px) per edge), cards drop
  their lg margins for lg:gap-[30px] on the section, live's 4rem first-row
  clearance moves to the section as lg:pt-40 (:6538-6540 — first-card y
  unchanged), and the width derives from the box, never a hardcoded 1280:
  lg:w-[calc((100%-60px)/3)] → 406.7@1440 / 371.3@1294. ≤991 single-column
  ladder untouched (probed identical). AFTER @1440: card1 x=80 = gutter,
  full-row card 3 right = 953.3 + 406.7 = 1360 = vw − gutter, h+v gaps
  30/30, row rhythm 510 (was 660); the 2-card last row stays justify-centred
  (live's own `.w-row` behaviour). Bonus: at 406.7px "Dr. Michael Hopkins"
  fits ONE line, so no lg grid card grows and all rows sit at exactly 480.
  atd pin #2 sub-question (box-to-box vs photo-to-box): resolved BOX-to-box
  30px. Consequence to flag in the resolve reply: the lg headshot overhang is
  100px, so each row 2+ circle overlaps the row above's beach banner by
  ~70px; the photo-to-box alternative is 130px box-to-box.
  Gate consequence @1440/1294: the whole team-grid region reflows (cards
  406.7 wide at the gutter vs live's 320 at x=200; v rhythm 660 → 510/row)
  and the section shrinks ~450px, so every region below it on our-team
  shifts up — expected fails vs the ref, listed in the round report.
- [deviation] card box grows — thread 986a647b-badc-4ecc-9bd5-4292bba404ca
  (our-team board 7944efa6 pin #3: "The box needs to grow, or this type needs
  to get smaller so it doesn't rag like this." Taking the box-grows arm).
  Live fixes the card box per tier (the hard-won four-value ladder,
  beachfront.css:6530-6536 / :6538-6540 / ≤991 :8183-8187 / ≤479 :9271-9276
  = 320x480 / 512x768 / 384x576 / 303x384) and pins `.team-grid-beach`
  absolutely over the bottom 30% (:6564-6569), so a two-line name pushes READ
  MORE under the banner (probed before: rm→banner −18 @1440 grid+slider MH,
  −30.8 @390 grid MH). Now every ladder height is a MIN-height, the card is a
  flex column, the banner is in flow at the px the 30% resolves to
  (115.2 grid / 129.6 slider ≤479, 172.8 xs, 230.4 md, 144 lg) with mt-auto,
  and the content column keeps pb-[10px]/lg:pb-5 so READ MORE stays clear. A
  card whose content fits renders at exactly the live height; only overflow
  cards grow. Gate consequence: grown MH cards shift our-team @390 below-rows
  and (with the row-stretch from pin #2's flex grid) can move @1440 rows.
- [deviation] bio = 3-line clamp of the real bio — thread
  4dd560d2-3dad-4240-b5bb-3a5d64a6cedd (yfv board 4b8d52d2 pin #5: "Ideally,
  the truncated text is three lines visually and then stops… I want it
  visually to be three lines every time, and then it gets cut off somewhere
  in the third line."). Live clips the AUTHORED `person.teaser` at height
  7.5ch (`.m-2.team-teaser`, beachfront.css:3770-3773 → 75px at the fixed
  16px card font), and the authored "..." cut points rag (before @1440,
  our-team card 1: a 33px orphan third line). Now `line-clamp-3` over
  `person.body` (teaser only as fallback for a person with no bio) — the
  ellipsis lands mid-line-3, box 75→72px. CONTENT deviation from the
  reference on both pages: 9 of 11 teasers are bio prefixes (visible diff =
  line 3's tail + ellipsis position), 2 differ outright.
- [deviation] yfv slider gap halved — same thread 4dd560d2 ("less space in
  between the two. Like 50% less. || Then the containers get bigger."). Our
  A2 cells carried the live-derived 43.33px lg margin each side → 86.7px gap
  @1440 (probed = the reference; live's JS track shows 51.3 @1294 where our
  uniform CSS showed 86.7 — pre-existing A2 note). Now lg:mx-[21.67px], cell
  itemWidth 383.34 (= 340 + 2×21.67), gap 43.3. The A2 trackPadStart
  compensation (LEDGER A2, commit c075d8c) moves IN THE SAME commit:
  calc(max(60px, 50% − 640px) − 21.67px) keeps card 1 on the h2's gutter.
  "The containers get bigger" is satisfied by pin #2's box growth + pin #2
  (our-team) card widening; slider card width stays live's 340 — flag for
  the resolve reply if Tim meant the slider card itself.
- [consequence] yfv `.team-slider-holder` lg 16rem height → min-height —
  live's fixed 640px viewport (beachfront.css:6654-6659) would clip a grown
  card, so lg is h-auto/min-h-[640px], and the slider card's lg mb-5 (live
  `.m-2`'s .5rem, which the 640 holder clipped invisibly — see the 2026-08
  holder note in the slice) is dropped so the auto height still equals 640
  when nothing grows. ≤991 keeps live's fixed heights: probed slack 24/72/96
  (sm/xs/md) absorbs every measured growth case.
- ACK note: this round re-moves yfv "Dr. Robert Quan" @1440, whose A2
  deviation value is still ACK-pending — unavoidable, pin #5 targets the same
  slider. The pending A2 value is superseded by this round's, same board.

Strikes before the round: clear on both pages (no failing region stalled 3+
runs). Home check after: the team-circles rail (A1 943b602) probed byte-stable
— cell 1 x=80, 200px cells, 40px gap @1440; the `team` variation branch has no
diff hunks this round.
Gate round: markupc (threshold 0.1, matrix 1440/834/390, mask [],
neutralizeMedia false), out-markupc-our-team / out-markupc-yfv, baselines
markupa1-our-team / markupa2-yfv. Movement confined to the pinned regions:
our-team DRQ 3.9→37.2 @1440 (Δh 17.5% — the grid reflow + the section
shrinking ~450px) and 5.0→23.7 @390 (Δh 0.7% — MH's card +37.8 and the bio
text swap); yfv DRQ 16.2→27.2 @1440 (Δh 5.1% — gap halving + MH card 515,
holder 640→675; supersedes the ACK-pending A2 value, same slider). Three
sub-threshold ripples stay PASS: yfv "Office Tour" 3.2→4.2 @1440 (cards 2+
moved left; their overhanging circles sit in that region's band), yfv DRQ
3.1→4.8 @390 and 1.5→1.6 @834 + our-team DRQ 2.4→2.6 @834 (clamped-bio
text). Every other row is value-stable to 0.1pp, including the WTLM footer
floors at yfv (12.8/12.0) and our-team @834/1440 (12.0/7.3); one drift on the
already-ACK'd our-team @390 WTLM floor, 12.9→13.4 (map-region noise on the
page that grew 37.8px — no mask, no threshold change, left as the same
floor). All three deviation regions left OPEN awaiting operator ACK.

## MARKUP ROUND D — the team-member detail template (2026-08-10, feat/markup-round-2026-08)

Four pins on /team-members/<slug> (boards ad8322a7 team-member detail +
7944efa6 our-team). Gate page `team` runs the REAL route
(/team-members/dr-robert-quan) — there is no /dev/match twin for the detail
templates — and `svc` is gated as the shared-component control (DetailHero /
DetailBody / animateIn are shared with the services + questions templates).
Strikes before the round: clear on team and svc.

- [deviation] per-person hero — threads b7a00984-7a22-4830-ab3a-1fe1b636497e
  (team-member board pin #1: "This should be the same image on their small
  thumbnail module.") + 17e321d9-3717-4a6a-810f-d9be03e60de2 (our-team board
  pin #4: "The beach image should be the background hero image. Conceptually,
  each staff member picked their favorite beach…") — ONE fix. Live's webflow
  template gives EVERY member hero the same shared beach photo (the hard-coded
  /images/team-member-hero.jpg copy of it); now the hero is the person's own
  gallery[0] — the SAME image as their /our-team card banner (person docs
  carry the seeded gallery in Prismic; verified images.prismic.io URLs on the
  real /our-team, e.g. Quan→bali, Stacey→cabo-lalo) — with the shared photo as
  fallback for a person with no gallery. The dev/match our-team twin only
  patches EMPTY galleries, so real route and twin read identical gallery[0].
  Gate consequence @all: the team hero region ("top"/"Dentist" band) diffs vs
  the ref per person — expected deviation rows. Caveat for the resolve reply:
  stacey/enrique's cabo-lalo gallery image carries the our-team card's
  portrait crop (rect 674x900), so as a 1440-wide hero it upscales soft; if
  Tim wants a sharper hero the gallery asset needs an uncropped/wider crop in
  Prismic, not a render change.
- [deviation] 700px measure cap — thread b42973fe-6f2a-43d2-ac43-87c8187d9a7e
  (pin #3: "This text width is way too long. I want this to be 70% width ||
  Or maybe a max width of 700 pixels, and then as the screen size gets
  smaller, it starts to rag."). Taking the 700px arm (the || alternative
  supersedes the 70% first thought). Live has no cap below the 1440 container
  — the bio measured 1280px wide @1440, 1194 @1354, 738 @834. Now
  max-w-[700px] on the team DetailBody call ONLY; services keeps its
  live-derived `w-full md:w-4/5` and questions its `max-w-[1024px]` — Tim
  pinned the team page; flag extending the cap to the other detail bodies in
  the resolve reply.
- [deviation] title→body gap halved to the button's ladder — thread
  25b788a1-ecb1-436e-bd80-293ad0f277f4 (pin #4: "Half as much vertical space
  between the job title and the body text. Should be consistent between the
  button and the body text as well."). Live's role line is
  `h4.text-color-primary-dark.mt-8.mb-4`, `.mb-4` = `margin-bottom:1rem`
  (beachfront.css:3985-3988) = 24/32/40 on the stepped root — the value the
  template carried. Now the body takes the `.mt-2` half-rem ladder the Back
  to Team button already cites (`margin-top:.5rem`, beachfront.css:3901-3903)
  = 12/16/20: title→body 40→20 @1440 (halved) AND equal to body→button 20 —
  both clauses of the pin in one value. Team detail only.
- [fix] name-reveal fail-safe — thread 738ad46b-0be6-4d92-a1c0-73a53e4c298e
  (pin #2, the DETERMINATE half: "Sometimes this name shows up and sometimes
  it doesn't."). Probed: with IntersectionObserver stubbed inert, the hero
  name settles at opacity 0 FOREVER (it even fades out from first paint,
  since applyHidden's transition is already attached) — the only mechanism
  that can hide it, matching Tim's intermittent experience in MarkUp's
  embed. animateIn gains an opt-in viewport-mode `failSafe` (timer that
  forces the revealed state; cleared only after the normal reveal actually
  executes, so a throttled-rAF reveal is also covered) + a guard that reveals
  in place when IntersectionObserver is missing entirely. DetailHero's label
  block opts in at 1500ms; no other call site changes. Not a geometry change
  — settled state is byte-identical (opacity 1, translateY 0). The ALIGNMENT
  half of the pin ("never aligned correctly") is needs-Tim — the name was NOT
  moved.

Gate round: markupd (threshold 0.1, matrix 1440/834/390, mask [],
neutralizeMedia false), out-markupd-team / out-markupd-svc, against a fresh
pre-change baseline markupd0 (same pages, same settings, run this round).
Movement confined to the pinned region: team "Dentist" (the role+bio band)
0.0→6.1 @1440 (Δh 2.8%→39.4% — the 700px measure wraps the bio into more
lines, outweighing the halved title gap: cand Back-to-Team anchor 920→1050),
0.4→9.9 @834 (Δh 12.6%) and 6.0→13.0 @390 (dE 3.6→9.6 — the body width is
unchanged at 390, the −12px title-gap shift misaligns the band's text vs
ref). Sub-threshold ripples on team "top" only (1.1→2.5 @1440, 1.2→1.4 @834,
3.1→2.5 @390): the per-person bali hero vs the ref's shared beach reads
close in tone, so the pin-1 deviation never crosses threshold. WTLM footer
floors byte-stable on team (12.9 @390 / 12.0 @834 / 7.3-PASS @1440). svc
control: EVERY row identical to its markupd0 baseline — including the
pre-existing vw1440 "What to expect" Δh=5.1% (mm=0.0) fail and the WTLM
floors 12.9/12.0 — so the shared DetailHero / DetailBody / animateIn changes
are visually inert outside the team template. No mask, no threshold change.
The three team "Dentist" rows left OPEN awaiting operator ACK.

## MARKUP ROUND E — three home one-offs (2026-08-10, feat/markup-round-2026-08)

- [deviation] steps-band circle centers on the headline block — thread
  badfa786-0b08-4dce-8431-cacaa688f627 (pin #6: "Ideally, this circle image
  is horizontally center-aligned to the headline on the left, so it needs to
  come down."). The reference TOP-ALIGNS its two `._w-half` columns (50%,
  `beachfront.css:2867-2871`; photo column pads pt 20 / pb 40 at the 40px
  root) — probed on beachfront-dentistry.webflow.io: circle center vs the
  headline+subhead block center is +7.5px @1440 but **-89px @1294** (the
  120px h2 wraps 3→4 lines and the block grows past the circle). Ours
  matched live to 0.1px at both widths before the fix. Now the row is
  `lg:items-center` and the circle column carries `lg:pt-0 lg:pb-10`
  (pb − pt = 40px = the subtitle's trailing mb-10, cancelling the block's
  half-margin bias), so the flex-centered circle lands exactly on the
  headline+subhead block center at ANY lg width, whichever column is taller
  (probed after: -0.1px @1440, 0.0px @1294). Sub-lg stacked pads untouched —
  probe deltas @834/@390 byte-identical before/after. Tim said "the
  headline"; block-center is the chosen reading — vs the h2 alone the circle
  now sits +42.5px lower, offer the h2-only variant in the resolve reply.
  SectionGrid steps: `src/lib/slices/SectionGrid/index.svelte` (row + image
  column). Expected gate movement: home "Your Path to Oral Health" only.
- [deviation] navigation flash white, not black — thread
  65939802-f1e8-496e-b282-6e82730d7b83 (pin #12: "it goes black and then
  loads the next page. Is there any way you can go white on the next page,
  or even the Beachfront blue…"). The black was never a probed live rule —
  `TransitionOverlay.svelte:14`'s `bg-black` default is starter-template
  chrome from the Initial commit (63a7b3d). Sole usage
  `src/routes/+layout.svelte` now passes an explicit class with `bg-white`;
  the component default is untouched (PreNavTransition, also bg-black by
  default, is unused outside its tests). The overlay mounts only between
  beforeNavigate/afterNavigate, so first paint over the hero video is
  unaffected. Tim offered white OR brand blue — white chosen; the swap is
  one class at the usage site. Not a gated surface (overlay never shows on
  direct page loads).
- [deviation] favicon.ico regenerated with real alpha — thread
  784b9a3f-3479-4e4c-9b5f-5df9f40c9323 (pin #13: "The favicon looks like it
  has white corners around the circle Beachfront logo, versus a PNG with a
  transparent background."). The shipped ico WAS live's own (Webflow
  logo=blue.ico, `src/app.html:5-7`): single 32px BMP entry, corners probed
  OPAQUE white 255,255,255,255. static/favicon.png is NOT a substitute — it
  is the starter's white-on-transparent placeholder (top opaque colors
  221/221/221 and 255/255/255), wrong branding, left unlinked (and behind a
  1y immutable Netlify header, so its URL must not be repurposed).
  Regenerated static/favicon.ico from static/apple-touch-icon.png (live's
  own webclip: 256px RGBA, corners alpha 0, body #009CCD) as 32+16
  PNG-in-ICO entries via the repo's sharp devDep — no new dependencies; all
  four corners now alpha 0. Tim's offered PNG not needed. Caveat for the
  resolve reply: in the webclip the tooth glyph is a transparent CUTOUT
  (the asset has no white pixels), so the tab background shows through the
  tooth; if Tim wants a white tooth inside the circle his PNG is needed
  after all. Also fixed: `+layout.svelte` JSON-LD `logo` pointed at
  /favicon.svg, a file that never existed in static/ — now
  /apple-touch-icon.png (256px, meets Google's >=112px logo guidance).
  Not a gated surface (browser chrome, not page pixels).

Gate round: markupe (threshold 0.1, matrix 1440/834/390, mask [],
neutralizeMedia false), out-markupe-home, against out-markupb-home (the
last home run, 2026-08-11 00:02; rounds C/D gated team/svc only and their
ledger recorded svc as a byte-identical control, so markupb is a valid home
baseline). Movement confined to the pinned region: home "Your Path to Oral
Health" 1.0→1.8 @1440 (dE 0.8→1.2, Δh 1.6% unchanged — the circle drops
~26px to the block center; PASS with margin). Its @834 (1.6/0.9/1.1) and
@390 (6.2/3.7/1.8) rows byte-identical — the stacked layout was not
touched. Every other row on home identical to baseline, including the three
pre-existing ACK-pending FAILs at exactly their stalled values: WTLM 13.4
@390 / 12.0 @834, OdT @834 10.9 (33 runs flat), Beyond the Smile @390
Δh 5.8 (26 runs flat). No mask, no threshold change, anchors identical.

## MARKUP ROUND F — every Book CTA becomes Request (2026-08-11, feat/markup-round-2026-08)

Thread 5980c9d7-6212-4c78-930d-5a1b3a969ac6 (board 4b8d52d2, pin #3), Tim:
"Everywhere that says 'book an appointment', it needs to say 'request
appointment' … This is how it was on the old site."

- DEVIATION (site-wide, deliberate): the REF (beachfront-dentistry.webflow.io)
  itself says "Book" on every one of these instances — Tim's "how it was on
  the old site" is only half-true (the reference's desktop nav pill and its
  request-form modal DO say "Request appointment"; every band/menu/info-band
  button says "Book"). The pin outranks the reference on wording, so each
  instance maps Book→Request keeping its own article shape ("Book an
  Appointment"→"Request an Appointment", "Book Appointment"→"Request
  Appointment"). Instances (rendered text):
  - beachfront-pages.js ctaHero cta_label (closing band, seeded on ALL 5 nav
    pages): "Request Appointment"
  - beachfront-pages.js home "Your Path" steps grid: cta_label + step-01
    item_heading → "Request an Appointment"
  - beachfront-pages.js yfv FirstVisitToc book_label → "Request an
    Appointment" (this label now deviates from the REF twice over: spelling —
    REF has the "Apointment" typo — and wording)
  - beachfront-pages.js yfv ExamTimeline book_label → "Request Appointment"
  - CtaBand.svelte default ctaLabel (all detail routes: team-members/[slug],
    services/[slug], questions/[slug]) → "Request Appointment"
  - Nav.svelte hamburger-menu CTA → "Request an Appointment" (menu is closed
    at capture, so no gated pixels move)
  - contact-us/+page.svelte info-band button + closing CtaBand → "Request
    Appointment"
    Already correct before this round: desktop nav pill ("Request Appointment",
    Nav.svelte) and the AppointmentModal ("Request an appointment" /
    "Request Appointment" submit).
- GATE DEFINITION CHANGE (forced, contact only): gate.sh's contact info-band
  anchor WAS the literal button text "Book Appointment". Anchors must resolve
  on BOTH pages (prefix match on rendered text) and the REF keeps "Book"
  while the candidate now says "Request", so no button-label anchor can
  resolve on both. First try "CONTACT (310) 378-9241" resolved on the
  candidate only (ANCHOR_UNRESOLVED @1440): the ref band reuses adjacent
  `.footer-contact-*` divs whose textContent concatenates with NO whitespace
  ("CONTACT(310) 378-9241…"), so a spaced CONTACT-phone anchor can never
  prefix-match it. Re-anchored to "OFFICE HOURS" — the ref's header div is
  "OFFICE HOURS" and norm() collapses the nbsp, so it is a clean element
  prefix on both pages, first occurrence in document order on both (the
  footer's OFFICE HOURS block comes later). Consequences: the region label in
  reports/strike history changes (old "Book Appointment" history for contact
  ends), and the renamed button + the CONTACT column now sit in the region
  ABOVE the anchor ("top"), so the expected text-swap diff for contact lands
  in "top" instead of the info-band row. Threshold 0.10, matrix 1440/834/390,
  no masks — unchanged.
- EXPECTED MOVED ROWS: every page's closing-band region ("Ready for great
  dental health") swaps ~7ch of button text vs the REF's "Book Appointment";
  home "Your Path to Oral Health" additionally swaps the grid CTA + step-01
  heading (3 chars longer, may rewrap at 390); yfv's TOC and First Exam
  regions swap one outline-button label each; contact's "top" region swaps
  the info-band button. Documented per-row in the round F gate results below
  at the moment they are measured.
- PRISMIC: the five changed fixture strings live in the seeded `page` docs, so
  the fixture edit alone would fork the twins from the real routes. Re-seeded
  via the ONE owner of the `page` type, scripts/seed-pages.mjs (PUT replaces
  whole documents; models unchanged this round, assertModelsInSync guards).
  Writes land in the unpublished Migration release — the real site keeps
  saying "Book" until the operator publishes the release in Prismic.

Gate round: markupf (threshold 0.1, matrix 1440/834/390, mask [],
neutralizeMedia false), ALL NINE pages (every page's closing band swaps
button text, so nothing was sampled). Result: every row on every page is
byte-identical to its page's latest baseline (markupd for team/svc, w4 for
qa, markupe for home, markupc for yfv/our-team, markupa1 for services,
markupb for atd) EXCEPT the regions the pin touches:

- "Ready for great dental health" (all 9 pages): +0.0 to +0.1pp from the
  Book→Request swap, PASS everywhere with margin (worst 7.1 @834, a
  pre-existing level).
- home "Your Path to Oral Health": @1440 1.8→2.0 PASS, @834 1.6→1.8 PASS,
  @390 6.2→4.7 PASS — the longer "Request an Appointment" wraps CLOSER to
  the ref's own line breaks at 390, so the swap improved the region.
- yfv "We want you to feel comfortable" (contains the TOC button): @390
  1.1→1.3 / @834 0.8→1.0 PASS; @1440 2.0→2.1 with its pre-existing
  ACK-pending Δh 15.1 FAIL unchanged. The ExamTimeline button swap is <0.1pp
  inside "To be a long term health partner" (unchanged at 2.6/1.0/2.7, PASS).
- contact: region relabelled per the anchor change above; "top" (now holds
  the swapped button) 1.5→1.3 @1440 / 4.3→2.6 @390 PASS. NEW region "OFFICE
  HOURS": 9.6 @834 PASS, 5.8 @390 PASS, **10.5 @1440 FAIL — FLOOR CANDIDATE,
  operator's call**: the diff image (fail-vw1440-OFFICE_HOURS.png) shows the
  candidate's Google-map iframe painting blank/differently at capture plus
  minor hours-column jitter; the same absolute mismatch scored 8.5 PASS on
  every stable prior run under the old wider "Book Appointment" region
  (which included the button strip in the denominator). Re-run (markupf2)
  reproduced 10.5/9.6/5.8 exactly — deterministic capture behaviour of the
  live embed, not flicker, and no text/geometry change of ours is inside the
  red area. Same mechanism as the ACK-pending WTLM map rows. NOT
  reclassified, NOT masked, threshold untouched.
  All pre-existing ACK-pending FAILs sit at exactly their stalled values:
  team Dentist 13.0/9.9/6.1, home OdT @834 10.9, home+atd Beyond the Smile
  (@390 Δh 5.8; atd 61.7/60.5/66.9), yfv+our-team Dr. Robert Quan (27.2 /
  37.2+23.7), yfv WWYTFC @1440 Δh 15.1, svc What-to-expect @1440 Δh 5.1, and
  the WTLM footer-map rows (12.0-13.4) on all nine pages.

## OPERATOR ACK — 2026-08-11, markup round floors accepted

Tucker, in conversation ("floor is fine"), ACKs the markup-round deviation
floors and the OFFICE HOURS floor candidate presented at the round checkpoint:

- atd "Beyond the Smile" ×3 (61.7/60.5/66.9) — 30px grid rhythm, thread b7be52f2
- home "Beyond the Smile" @390 Δh 5.8 — 40px button gap, thread ce17fba0
- our-team "Dr. Robert Quan" @1440 37.2 / @390 23.7 — gutter+30×30+box growth,
  threads 338f6e07 / 986a647b
- yfv "Dr. Robert Quan" @1440 27.2 — card onto gutter + halved gap,
  threads e23604c9 / 4dd560d2
- team "Dentist" ×3 (6.1/9.9/13.0) — 700px measure + halved gaps,
  threads b42973fe / 25b788a1
- contact "OFFICE HOURS" @1440 10.5 — map-embed capture behaviour under the
  post-Round-F anchor; accepted as a floor.

Still open (not covered by this ACK): home "Our dental team in Redondo" @834
10.9 — the pre-existing 33-run stall predating the markup round; needs a new
model or an explicit acceptance of its own.

Prismic migration release for the Round F wording (5 page docs) reported
in flight by the operator at the same checkpoint.

## MARKUP ROUND G1 — the wave loses its flat spot (2026-08-11, feat/markup-round-2026-08)

- PIN: thread 7dd0c2f2 (our-team board 7944efa6, pin #1), "Flat spot in the
  curve". The flaw is the REFERENCE'S OWN: live's injected SVG
  (matching/spec/detail-svc.html:123) draws the crest with one cubic
  (+250.45,-0.39, controls y=-2.14/-3.15) whose middle dwells within 3px of
  its peak for ~194px of screen at 1440 (|dy/dx|<0.10 for 312px). Operator
  directive in conversation: where the original site itself has the flaw,
  follow Tim's instruction over the reference — a DELIBERATE SITE-WIDE
  deviation, pre-ACK'd.
- DEVIATION (by design): src/lib/components/WaveDivider.svelte's middle cubic
  is replaced by four G1-continuous cubics rolling crest(553,2) →
  dip(631,18.5) → crest(707,6.5) across the same span. Junction points
  (493.39,14.58)/(743.84,14.19) and their tangents (-0.203/+0.210), the
  flanks, viewBox, fill mechanics (V0 H0 V27.35 + 600.21 arc) and the crest
  reach (min y 2.00 vs live's 1.61) are unchanged, so every A-round seam fix
  holds. Flatness after: crest dwell 77px (was 194), |dy/dx|<0.10 span 51px
  (was 312), <0.05 span 27px (was 158), <0.02 span 11px (was 63) — the
  remaining spans straddle true extrema, as a sine's would.
- SCOPE: WaveDivider renders on every page (Hero ×2, SectionGrid, DetailHero,
  SubpageHero, Footer arc) — the REF keeps the flat curve, so every wave-seam
  region on all nine pages may move against it. Those rows are EXPECTED and
  covered by the operator's pre-ACK; they are listed per-row in the markupg1
  gate results below at the moment they are measured. Anything that moves
  OUTSIDE a wave region is a regression, not a deviation.
- Threshold 0.10, matrix 1440/834/390, no masks — unchanged.

Gate round: markupg1 (threshold 0.1, matrix 1440/834/390, mask [],
neutralizeMedia false), ALL NINE pages (the footer arc is on every page, so
nothing was sampled). Measured moved rows — every one a wave-seam region,
every one PASS→PASS, worst delta +0.4pp, all pre-ACK'd per the operator
directive above:

- "top" (hero seam; SubpageHero/DetailHero/Hero wave): team 2.5→2.7 / 1.4→1.6
  / 2.5→2.7; svc 0.6→0.8 / 0.5→0.7 / 3.1→3.2; qa 2.3→2.4 / 2.1→2.2 /
  2.7→2.8; home 6.0→6.2 / 3.6→3.8 / 7.3→7.4; yfv 0.1→0.4 / 1.2→1.4 /
  0.7→0.9; our-team 0.2→0.3 / 0.4→0.5 (@390 seam lands in "Our"); services
  1.7→1.9 / 2.0→2.2 / 4.5→4.7; atd 0.2→0.5 / 0.3→0.5 / 0.7→0.9; contact
  1.3→1.5 / 0.5→0.7 / 2.6→2.7 (order 1440/834/390 where three moved).
- our-team "Our" (hero seam continues below the split anchor): 0.0→0.2 @1440,
  2.5→2.9 @834, 4.6→4.9 @390.
- "Ready for great [dental health]" (closing CTA band — the footer arc's
  crest pokes up into it): all nine pages, +0.2 to +0.4pp, e.g. home
  0.5→0.8/6.7→6.9/2.4→2.8; worst absolute 7.1→7.3 @834 (team/svc/qa/
  contact), PASS with margin.
- home "Your Path to Oral Health" @1440 2.0→2.1 (SectionGrid mirror wave,
  steps→services seam); @834/@390 moved <0.05pp.

Every row NOT listed is byte-identical to its markupf baseline, including
the "Want to learn more" footer-map rows and every ACK'd floor at its exact
stalled value: team Dentist 13.0/9.9/6.1, home OdT @834 10.9, home BtS @390
Δh 5.8, atd BtS 61.7/60.5/66.9, our-team DRQ 37.2/23.7, yfv DRQ 27.2, yfv
WWYTFC @1440 Δh 15.1, svc What-to-expect @1440 Δh 5.1, contact OFFICE HOURS
@1440 10.5. Per-page exit=1 is those floors, nothing new.

### G1b amendment — the roll was a bump; one crest now (2026-08-11)

OPERATOR FEEDBACK on the G1 shape, verbatim: "for the shape, you're adding a
little bump instead of following the same consistent wave shape." Numerically
he is right: the wave's own rhythm is trough@321 → crest@620 → trough@1106
(half-wavelengths 299/486 viewBox px), and G1's crest–dip–crest inserted
extrema 74-80px apart — a 4-6× shorter local wavelength, i.e. an extra
oscillation, not the wave continuing.

NEW SHAPE (replaces G1's four cubics): ONE crest, the wave's own wavelength,
fuller and rounder than live's flat lid. Two G1-continuous cubics through the
same span — peak (615,0.6) vs live's (620,1.61), tight tangent-matched
controls (0.18·dx at the peak, dx/3 at the junctions), junctions
(493.39,14.58)/(743.84,14.19) and tangents (-0.203/+0.210) unchanged.

- Wavelength: crest@614 between troughs @321/@1106 → half-waves 293/492,
  inside the flanks' own 299/486 rhythm (G1's inserted pair: 80/74). No
  extrema added.
- Flatness vs live (screen px @1440): peak dwell-within-3px 194→156,
  |dy/dx|<0.05 span 158→112, <0.02 span 63→23, and the crest reaches 1px
  higher (min y 0.6 vs 1.61 of the 120 viewBox) — a fuller arc whose top
  turns continuously instead of live's near-straight lid (live's controls
  at y=-2.14/-3.15 run its mid-section as a line). Honest bound: a single
  roll with these fixed junction tangents cannot dwell much less — a true
  sine of this wavelength/amplitude dwells ~185px — so the numbers held are
  "no added extrema AND dwell/slope spans at-or-below live's", not G1's
  two-crest spans (77/26/11), which bought their sharpness with the bump.

Gate round: markupg1b (threshold 0.1, matrix 1440/834/390, mask [],
neutralizeMedia false), ALL NINE pages, baselines = each page's latest run
(markupg4 for home/yfv, markupg3 for atd, markupg1 for the other six).
Moved rows — same wave-seam set as G1, all PASS→PASS, and every delta now
NEGATIVE (the single crest sits closer to the ref's own crest than the G1
roll did; most rows return to their exact pre-G1 markupf values):

- "top": team 2.7→2.5 / 1.6→1.4 / 2.7→2.5; svc 0.8→0.6 / 0.7→0.5 / 3.2→3.1;
  qa 2.4→2.3 / 2.2→2.1 / 2.8→2.7; home 6.2→6.0 / 3.8→3.6 / 7.4→7.3; yfv
  0.4→0.1 / 1.4→1.2 / 0.9→0.7; our-team 0.3→0.2 / 0.5→0.4 (@390 in "Our");
  services 1.9→1.7 / 2.2→2.0 / 4.7→4.5; atd 0.5→0.2 / 0.5→0.3 / 0.9→0.7;
  contact 1.5→1.3 / 0.7→0.5 / 2.7→2.6 (order 1440/834/390).
- our-team "Our": 0.2→0.0 @1440, 2.9→2.5 @834, 4.9→4.7 @390.
- "Ready for great [dental health]": all nine pages, −0.2 to −0.4pp (e.g.
  home 0.8→0.5/6.9→6.7/2.8→2.4; worst absolute 7.3→7.1 @834).
- home "Your Path to Oral Health" @1440 2.1→2.0 (SectionGrid mirror seam).

Every other row byte-identical to its baseline; every ACK'd floor at its
exact stalled value (list above), no new FAILs — per-page exit=1 is the
floors, nothing else.

## MARKUP ROUND G2 — the open Q&A card stops growing (2026-08-11, feat/markup-round-2026-08)

DEVIATION BY DESIGN — designer override of a live-match, interaction state
only. MarkUp thread 3d255366-5bb2-4cb1-9a90-439d49ef63ef (home board, pin #9,
second half — the first half, reveal + Read More padding, shipped ce0c59d +
1d5641e): Tim: "the box expands but I don't think it needs to since the
headline disappears. Thoughts?" Applied to BOTH QuestionList variations per
atd pin bd8c37b0-2e1c-4dc2-a466-8073e204d90c ("same comments as the
homepage"). Operator directive 2026-08-11: follow Tim's instruction over the
live behavior. Both pins already resolved on MarkUp — silent refinement, no
MarkUp action.

THE LIVE RULES OVERRIDDEN (each named, per rule 1 — the freeze deliberately
does NOT reproduce them):

- `.qa-text.m-2.active { height: 8rem; transition: height .2s }`
  beachfront.css:7303 — the teaser box's own expand.
- `.qa-label.active { margin-top: -2rem }` beachfront.css:7236 — the bar
  riding up above the card. The bar now stays put as the always-visible
  disclosure toggle; consequently `.qa-image.active`'s 0 0 25px 25px radius
  (:7330-ff) is also moot and the media radius is static.
- `.qa-block.active { margin-top: 2rem }` beachfront.css:7210 plus the ≤479
  re-height (:9454, measured 288→384) — the card's own drop/growth.

NEW CONTRACT: an open card keeps its collapsed footprint (288/320/400 at
base/md/lg, top edge unmoved, neighbours still); the disappearing headline +
in-place bar fund the answer's room: expanded `.qa-text` = card − label =
240 (xs..767) / 256 (md) / 320 (lg), Round B pb 12/16/20 held.

TIM'S PREMISE VERIFIED, NOT ASSUMED (probe 2026-08-11, every card: 6 home
teaser + 40 atd numbered × 1440/834/390, panels measured un-transformed,
fonts settled; need = answer + Read More + pb, room = card − label):

- teaser need 243/212/243 vs room 320/256/240 → @390 SHORT 3px on two
  cards (do-teeth-turn-yellow-as-you-age, tooth-broke-off — the same 231px
  panels Round B measured).
- numbered need 243/236/219 vs room 320/256/240 → fits everywhere (wider
  box: mx-4% vs w-4/5).
- off-matrix 650 band check: worst need 195 (home) / 171 (atd) vs room 240 →
  fits, so the xs..767 band freezes outright.
  ONE MINIMAL-GROWTH EXCEPTION, viewport-level: the <480 teaser card grows
  288→291 on open (+3px, the minimum clearing 243; followers shift exactly
  those 3px — reported, not hidden). Everything else is frozen outright.
  CONSEQUENCE for numbered base: its old carve-out (no pb, 96px of pill room
  funded by the 288→384 card growth) dies with the growth — it now takes pb-3
  like the teaser, and its pill sits 12px above the card bottom (was 96px).
  Padding is invisible collapsed, so the anchor-cut element's collapsed
  geometry is untouched at every width.

POST-CHANGE PROOF (probe + tests/interaction/qa-expand.spec.ts, which now
asserts THIS contract, sweeping every card on both pages × the matrix):
topShift 0 everywhere (was 48/64/80); height Δ 0 everywhere except home@390
+3 (was +96); pill offsets 20/16/12 both variants all viewports; box
scrollHeight == clientHeight (clip zero) for all 46 cards × 3 viewports;
neighbour stillness exact (0 / +3 as declared); footprint restores exactly on
close. 7/7 playwright tests green.

Gate round: markupg2 (threshold 0.1, maxHeightDelta 0.05, matrix
1440/834/390, mask [], neutralizeMedia false), pages home + atd as
no-regression — the freeze is interaction-state, invisible to static
captures, and the logs prove it: every measured row BYTE-IDENTICAL to
markupg1 on both pages (diff of out-markupg2-_.log vs out-markupg1-_.log,
tag lines excluded, empty). Per-page exit=1 is the pre-ACK'd floors at their
exact stalled values (home OdT @834 10.9, home BtS @390 Δh 5.8, atd BtS
61.7/60.5/66.9, footer-map rows) — untouched, per the do-not-disturb list.

## MARKUP ROUND G3 — the floating doctor stops hopping (2026-08-11, feat/markup-round-2026-08)

DEVIATION BY DESIGN — designer override of a live-match, interaction state
only. MarkUp thread a7c2e0d0-5e13-4cfd-bb17-a21ecee7b188 (home board, pin 7):
Tim: "I like the user experience of 'Ask The Doctor' and the [floating
Doctor image] of the original site. I do not like the jumping from question
to question." Operator directive 2026-08-11: follow Tim over the live
behavior — keep the floating handwriting+headshot pair, remove the discrete
per-question hops.

THE LIVE BEHAVIOR OVERRIDDEN (named per rule 1, quoting the record that was
in floatAlong.ts's own header): "the ask-the-doctor handwriting + doctor
headshot pair slides down the question column as the visitor scrolls,
gliding to the BOTTOM-MOST FULLY VISIBLE question. Movement is quantized per
question — the transform only changes when the target index changes — and
the glide itself is CSS (the node's own transition, live's anchor rule:
transform 1s cubic-bezier(0.19,1,0.22,1); set in the markup, not here)."
Sources: floating-doc.js (live ships the class with its instantiation
commented out on home — SPEC.md:2031 — so the operator's spec was already
the authority for running it at all) and `.ask-the-doctor-handwriting-anchor
{ transition: transform 1s cubic-bezier(.19,1,.22,1) }` beachfront.css:7670.
The 1s hop transition is deleted from the pair's class list in
QuestionList/index.svelte — JS owns the motion frame-by-frame now, so a CSS
transition would only fight it.

NEW CONTRACT (floatAlong.ts): position is a CONTINUOUS function of scroll.
The viewport bottom (the same edge that decided "fully visible" before) is
interpolated piecewise-linearly between consecutive item BOTTOMS onto the
items' offsetTop ladder — the pair passes through every position the old
code hopped between and everything in between, clamped to [item 0, last
item] so it never leaves the column. A ~150ms-time-constant rAF follow keeps
the float soft; target continuous in scroll + follow continuous in time = no
input can produce a step. Scroll-0 leaves the node's style untouched
(byte-identical static captures); reduced-motion stays a complete no-op
(pair pinned statically at rest — the pre-existing behavior, kept); below
1024px the float stays inert (mobile pair rests in flow, kept). floatAlong
has exactly one consumer (QuestionList teaser variation, home only — atd's
numbered variation has no pair, and live's own atd FloatingDoctor is dead
code per SPEC.md D.4).

PROOF (probe @1440, 93 samples at 25px scroll increments, entrance reveals
pre-fired): BEFORE inline-target plateaus 0/420/840/1260/1680/2100 with a
420px jump inside one 25px step (5 steps >60px); AFTER max per-step delta
25.2px — proportional (slope ~1.0), 0 steps >60px, 0 monotone violations,
clamp past column exactly 2100 = colTravel. Scroll-0 unchanged to the pixel
(pair rect top 4508.84375 / left 420, transform none, before AND after).
Open-card-mid-scroll lurch 0.0px (G2's frozen cards keep every item offset).
tests/interaction/float-drift.spec.ts now asserts this contract (5/5 green:
scroll-0 untouched, continuity bound 60px + monotone + column-bounded +
exact clamp, no open-card lurch, reduced-motion static, atd pair-free);
floatAlong.test.ts pins the mapping + the no-step follow (10/10).
Probe-methodology note: animateIn's one-shot reveals sit ON the `.qa-item`s,
so an unswept page's card rects move on their own for ~1s as each reveals —
sweeps must fire the reveals first or they measure reveal motion on top of
the drift (this cost one false 80px reading).

Gate round: markupg3 (threshold 0.1, maxHeightDelta 0.05, matrix
1440/834/390, mask [], neutralizeMedia false), pages home + atd as
no-regression — the drift is interaction-state, invisible to static
captures, and the logs prove it: every measured row BYTE-IDENTICAL to
markupg2 on both pages (diff of out-markupg3-_.log vs out-markupg2-_.log,
tag lines excluded, empty). Per-page exit=1 is the pre-ACK'd floors at their
exact stalled values (home OdT @834 10.9, home BtS @390 Δh 5.8, atd BtS
61.7/60.5/66.9, footer-map rows) — untouched, per the do-not-disturb list.

## MARKUP ROUND G4 — the review box becomes the mask (2026-08-11, feat/markup-round-2026-08)

DEVIATION BY DESIGN — designer override of a live-match, interaction state
only. MarkUp thread 29e4fcac-8dee-4cfe-a3f5-4ef9e4c79524 (home board, pin 5):
Tim: "the light blue background stays the same. When you click left or
right, the content, all except for the overlapping logo, slides out as if
this light blue background was a mask. Then the overlapping logo, either
just dissolves or does a dissolve / slides down to go out, and then a
dissolve / slide up to appear. Right now, it's a little bit weird that all
the content goes behind the words and the arrow and just randomly disappears
at a certain point." Tim marked it nice-to-have; operator directive: follow
his instructions. Of his two logo variants the SIMPLER is implemented —
plain cross-dissolve ("just dissolves"); the slide-down/up variant is
offered in the pin's resolve reply.

THE LIVE BEHAVIOR OVERRIDDEN (named per rule 1): `.big-review-slider`
`transition: transform 2s cubic-bezier(.19,1,.22,1)` (beachfront.css:
7563-7572, SPEC.md:1678) translates the WHOLE `.big-review` card — pale-blue
box, quote, reviewer row AND the overhanging `.social-logo-big-review`
badge — across the 600px holder viewport, which is exactly the "randomly
disappears" Tim describes. Our pre-G4 port reproduced it faithfully on the
shared Slider (full-content-width viewport, worse clip edge than live's).

THE G4 MECHANISM (src/lib/slices/Carousel/index.svelte, review variation
only — `photos` and every other Slider consumer untouched, Slider.svelte
itself untouched): the pale-blue card is static chrome; its padding moved
onto the track cells so an overflow-hidden rounded-[25px] mask fills the
card and clips the sliding quote/author track at the card's own border box
(rounded corners included); the five badge anchors stack on the card layer
(NOT the track) in identical rects and cross-dissolve (active opacity-100,
rest opacity-0 + pointer-events-none + inert). The badge genuinely varies —
seeded reviews are 3 Yelp + 2 Google — so the dissolve is observable on the
3→4 and 5→1(wrap) steps and degrades to a visually-static badge when
adjacent sources match. Slide timing keeps live's 2s expo rule verbatim;
the dissolve runs the same 2000ms with ease-in-out because the expo curve
front-loads opacity and reads as a pop, not a dissolve. Carousel semantics
preserved 1:1 (region role, arrow assets/labels/positions, wrap-around,
ArrowLeft/Right, swipe, aria-live position, hidden-slide inert);
reduced-motion falls to an instant swap via app.css:490-497's global reset.

RESTING RENDER UNCHANGED, measured: card/badge/arrow/region rects identical
to pre-G4 at 390/834/1440 on home and at 390 on your-first-visit (all
five cards measure equal heights at every gated width — 262/320/400 — so
the uniform mask box is the same box the gate always saw). yfv team slider
(shared Slider) probe identical before/after: first-card x 58.3 w 383.3,
gap 0.1, arrows x 0/1403.6, next-step -383.34px.

PROOF (probe @1440, timed samples after a Next click): card rect frozen at
{420,272,600x400} through 0/503/1029/1503ms and settle; track glides
-456.0 → -580.1 → -597.9 → exactly -600 (one card width); elementFromPoint
15px outside both card edges never hits track content at any sample; badge
wrapper rects frozen at {910,612,80x80} while opacities cross 1/0 →
0.872/0.128 → 0.296/0.704 → 0.066/0.934 → 0/1; five Next clicks wrap to a
byte-identical section screenshot; under reduced-motion emulation the track
reads exactly -600 and badges 0/1 at 105ms after the click.
tests/interaction/review-mask.spec.ts pins the contract (4/4 green:
scroll-rest untransformed, mid-flight card+badge stillness + no outside
paint + monotone glide + dissolve crossing, pixel-identical wrap cycle,
instant reduced-motion swap); review.test.ts adds the structural contract
(card outside the track, mask overflow-hidden, badges off-track dissolve-
only, figure/figcaption semantics kept per slide, keyboard wrap).

Gate round: markupg4 (threshold 0.1, matrix 1440/834/390, mask [],
neutralizeMedia false), pages home + yfv as no-regression — the redesign is
interaction-state, invisible to static captures. Comparison baselines:
out-markupg3-home (this branch's previous round) and out-g4base-yfv (freshly
captured at the pre-G4 working tree, since yfv's last round predates G2/G3).

## MARKUP ROUND H1 — the divider becomes a real sine (2026-08-11, feat/markup-round-2026-08)

OPERATOR DIRECTIVE, verbatim: "rewiggling is fine, I want a real sine wave
even if it means we add some height to the page. I'm no longer concerned
about matching the original webflow." That withdraws the matching constraint
for this element entirely — the G1b shape (single crest inside live's own
asymmetric swoosh) is superseded, and every wave-seam mismatch against the
webflow reference is ACK'd BY DIRECTIVE, the same mechanism as the existing
deviation floors.

THE SHAPE: src/lib/components/WaveDivider.svelte now draws
y = 60 − 32·sin(2π·3x/1200) — a genuine sine, three full periods across the
1200 viewBox, uniform amplitude 32 (crest 28 / trough 92). Chosen from a
3-candidate sheet (n=2 A=40 / n=3 A=32 / n=4 A=24, scratchpad sheet-h1.png):
n=4 turns scalloped at 390, n=2 reads as one more broad swoosh; n=3 lands
~2.25 visible periods at 1440 (λ≈639px screen) and stays graceful at 390.
Constructed as 4 cubic Hermite segments per period (exact quarter-period
knots + tangents, dx/3 handles; max deviation from the true sine 0.35px —
visually exact). Integer periods make y(0)=y(1200), so the mirrored mount is
seamless. HEIGHT: amplitude 32 fits the existing 120 viewBox with 28px
margins, so the offered height growth was NOT needed — heightClass ladders
(72/96/120, footer 96/128/160), the 133%/169% widths, the V0 H0 close and
every A-round overlap-seam offset are untouched. Consequence: zero layout
shift (every Δh in the gate is byte-identical) and seams verified watertight
in all six mounts (Hero ×2, SectionGrid mirror, DetailHero, SubpageHero,
Footer arc) at 1440/1294/834/390 — scratchpad wave-compare-h1.png.

Gate round: markuph1 (threshold 0.1, matrix 1440/834/390, mask [],
neutralizeMedia false), ALL NINE pages, baselines = markupg1b everywhere.
Moved rows — wave-seam regions only, all ACK'd by the directive above:

- "top" (hero seam): team 2.5→6.7 / 1.4→4.7 / 2.5→7.0; svc 0.6→2.9 /
  0.5→2.8 / 3.1→4.6; qa 2.3→4.8 / 2.1→3.8 / 2.7→4.6; home 6.0→9.6 /
  3.6→7.0 / **7.3→10.1 FAIL @390 — the one row the sine pushes over
  threshold; ACK'd by directive, not masked, threshold untouched**; yfv
  0.1→5.3 / 1.2→4.4 / 0.7→5.0; our-team 0.2→6.8 / 0.4→5.4 / 1.2→5.9;
  services 1.7→5.6 / 2.0→5.7 / 4.5→7.4; atd 0.2→4.9 / 0.3→3.9 / 0.7→4.6;
  contact 1.3→5.9 / 0.5→4.2 / 2.6→5.3 (order 1440/834/390).
- "Ready for great [dental health]" (footer arc): all nine pages, to 3.9-4.0
  @1440 / 9.6-10.0 @834 (PASS at the line) / 6.9-7.5 @390.
- our-team "Our": 0.0→0.2 / 2.5→3.0 / 4.7→5.1.
- home "Your Path to Oral Health" (SectionGrid mirror): 2.0→4.0 / 1.8→3.2 /
  4.7→5.7.

Every other row byte-identical to markupg1b, every pre-existing ACK'd floor
at its exact stalled value (team Dentist 13.0/9.9/6.1, home OdT @834 10.9,
home BtS @390 Δh 5.8, atd BtS 61.7/60.5/66.9, our-team DRQ 37.2/23.7, yfv
DRQ 27.2, yfv WWYTFC @1440 Δh 15.1, svc What-to-expect @1440 Δh 5.1, contact
OFFICE HOURS @1440 10.5, WTLM map rows 12.0-13.4) — per-page exit=1 is the
floors plus the one ACK'd home row, nothing else.

## MARKUP ROUND H2 — the hero label and the menu join the content gutter (2026-08-11, feat/markup-round-2026-08)

The two remaining designer pins, decoded by the operator. Tucker, on thread
738ad46b-2b6d-4392-bc58-73e67df1e07e (team board ad8322a7 pin #2, Tim: the
name "never aligned correctly"): the complaint means "horizontal alignment to
the content width" — "and the menu is too" extends the same decode to thread
bac4decb-8db3-43c9-b52c-7e06eb179f28 (team pin #5, Tim's capture: Make
Payment below the fold with no scroll). Standing directive from H1 still in
force, verbatim: "I'm no longer concerned about matching the original
webflow" — so every reference disagreement below is ACK'd BY DIRECTIVE, not
awaiting one.

FIX 1 — DetailHero label (team name h1 / svc + qa crumbs, one shared
component): the old lg:left-20 was a 1440-only sample of the gutter. The
label now rides the SHARED content-gutter ladder (the same geometry as
Nav.svelte's band: 20px @<768, 48px 768–991, max(60px, 50% − 640px) ≥992 —
80 @1440, 60 @1294). Probed before/after on all three templates at
1440/1354/1294/834/390: before x = 80/80/80/48/20 (adrift 20px across the
entire 992–1439 band); after x = 80/60/60/48/20 — on the gutter at every
width. The gate never saw this defect because its matrix (1440/834/390)
samples exactly the three widths where left-20 happened to agree.

FIX 2 — nav menu overlay: the links column leaves its absolute top-[10%]
box (the structural detachment behind Tim's below-the-fold capture) and
lives in NORMAL FLOW inside the scrolling dialog, left-aligned on the same
gutter ladder (mx-auto max-w-[1400px] px-5/md:px-12/lg:px-[60px]). The
overlay's logo/X band now mirrors the closed bar's exact px/py ladder too,
so the chrome doesn't jump on open. Rhythm preserved: the per-link
mt-5/mb-2.5 + gap-2.5 (a 40px slot, 90px pitch at lg) became gap-10 — the
identical 40px slot, minus the first link's top margin, which is what keeps
the whole menu on one screen at 1354×930 (Tim's capture size: content bottom
924 ≤ 930, no scroll). Scroll contract probed: 1280×700 and 390×660 scroll
to the last item fully visible; the fly transition now comes from
$lib/transitions (the repo's own rule) so reduced-motion users get an
instant menu. DEVIATION from live's centered column — left-aligned per the
directive above; live's webflow modal centers its links. ACK'd by directive.

Mechanical check: tests/interaction/nav-menu.spec.ts — column on the gutter
at 1440/834/390, normal-flow + overflow-y-auto structure pinned, scroll
contract at both short viewports, no-scroll at 1354×930, and the DetailHero
label pinned at 1440/1354/1294/834/390 (the off-matrix widths the pixel gate
can never guard).

Gate round: markuph2 (threshold 0.1, matrix 1440/834/390, mask [],
neutralizeMedia false), pages team/svc/qa + home as no-regression. Moved
rows: exactly ONE — qa "top" @1440 4.8→4.7 (with the capture scrollbar the
formula lands the crumb at live's own 72.5px where the fixed 80px sat 7.5px
wide; an improvement, PASS either side). team/svc/home logs byte-identical
to markuph1 after tag-strip; every ACK'd floor at its exact stalled value
(team Dentist 13.0/9.9/6.1, home OdT @834 10.9, home top @390 10.1, home
BtS @390 Δh 5.8, svc What-to-expect @1440 Δh 5.1, WTLM map rows 12.0-13.4)
— per-page exit=1 is the floors, nothing else. The menu is closed in every
gate capture; its geometry is guarded by the interaction suite above.

CORRECTION (2026-08-11, same day): the left-alignment of the menu LINKS was
our misreading of the decode. Operator, verbatim: "nav should still have
links centered like before." The column's horizontal presentation is
restored to centered (items-center, full-width column — matching the
pre-H2 centering, which also matches live's webflow modal, so the
deviation-by-directive noted above for left-alignment is WITHDRAWN).
Everything structural from Fix 2 stands: normal flow inside the scrolling
dialog, the gap-10 rhythm (90px pitch at lg), the scroll contract (last
item reachable at 1280×700 / 390×660, scroll-free at 1354×930), the
overlay chrome mirroring the closed bar's band, and the reduced-motion fly.
Fix 1 (DetailHero label on the content gutter) is NOT affected.
tests/interaction/nav-menu.spec.ts now asserts centered links instead of
on-gutter links; structure/scroll/label tests unchanged. Gate round
markuph3 (threshold 0.1, matrix 1440/834/390, mask [], neutralizeMedia
false) on home as no-regression — the menu is closed at capture.

## MARKUP ROUND H4 — the wave lands level and lets go of the text (2026-08-11, feat/markup-round-2026-08)

- PIN: thread 7dd0c2f2 (our-team board 7944efa6), the same thread H1 answered.
  TWO operator corrections, verbatim:
  (1) "sine should be only up/down on each page landing at the same height"
  (2) "wave should never touch the text"
  Standing directive still in force, verbatim: "I'm no longer concerned about
  matching the original webflow." Every wave row that moves against the REF in
  this round is therefore ACK'd BY DIRECTIVE, not a failure. Rows that are NOT
  wave rows moving would still be regressions; none did (see gate results).

- CORRECTION 1 — the ends. H1's path was a true sine, but the SVG was stretched
  to 133% of an `overflow-hidden` box (169% in the footer), so only the leading
  1/1.33 (1/1.69) of the viewBox was ever on screen: 2.26 visible periods, not 3. The wave entered at its mid-line and left on a crest. MEASURED right-end
  minus left-end y, page coordinates, BEFORE (every one of the 19 mounts on the
  9 gate pages, at 1440/1294/834/390):

      mount                     1440     1294     834      390
      Hero / SubpageHero        −31.98   −31.98   −25.59   −19.20
      DetailHero                −31.98   −31.98   −25.59   −19.20
      SectionGrid (mirror)      +31.98   +31.98   +25.59   +19.20
      Footer arc (169%)         +42.10   +42.10   +33.68   +25.18

  i.e. exactly one full amplitude of net rise or fall across every divider on
  the site. AFTER, same 76 measurements: |Δ| ≤ 0.01px, worst case 0.01px, and
  the visible period count is 2.0 at every mount and every width.

  The fix is structural, not a tuned number (src/lib/components/WaveDivider.svelte):
  · the `width` PROP IS GONE. The SVG is now `calc(100% + 1.3px)` of its clip
  box, hard-coded — the rendered width IS the viewBox width, so nothing can
  be cropped mid-period. Footer.svelte's `width="169%"` override is removed.
  · TWO whole periods: y = 60 − 32·cos(πx/300), knots at x=0/300/600/900/1200
  (28/92/28/92/28), 4 cubic Hermite segments per period, max deviation from
  the true cosine 0.35px (same fidelity as H1's sine fit).
  · COSINE, not sine, so dy/dx = 0 at BOTH ends. The 1.3px hairline-seam
  overhang therefore costs a second-order error: computed |Δy| ≤ 0.037px
  across every width × box height, versus 0.36–0.80px for the sine phase.
  Level ends are a property of the curve, not of any mount's arithmetic.
  Visible wavelength barely moves — 0.44W → 0.50W on the section waves, 0.56W →
  0.50W in the footer — so the divider keeps its character. Side effect, noted
  rather than hidden: the path is now symmetric about x=600, so SectionGrid's
  `mirror` (rotateY 180) is a visual no-op. The prop and class are KEPT because
  they are part of the services-band DOM the gates measure.

- CORRECTION 2 — the text. METRIC, stated so it can be argued with: clearance is
  the distance from a glyph box (Range.getClientRects on the text node, so real
  line boxes, not element boxes) to the wave's VISIBLE CURVED EDGE, measured
  over that glyph's own x-range, with the SVG's CTM applied so the stretch, the
  clip and the rotate-180/-scale-x-100 are all folded in. The flat fill between
  that edge and the box's own edge is excluded because it is by construction the
  same colour as the band it seams into (that is what `fill` is for). THRESHOLD
  8px: the site's smallest spacing step (Tailwind `2`), and 8× the worst
  antialiasing/rounding error of the stretched SVG edge, so it stays a gap the
  eye can see at any DPR. Both numbers are reported below — the strict
  painted-extent figure too, so nothing is hidden behind the choice of metric.

  BEFORE: 64 of 299 sampled text rows overlapped the wave; min clearance
  −49.31px (team "Dr. Robert Quan" @1294). Worst per mount:

      mount / page                  1440     1294     834      390
      Hero group-photo (yfv)        −12.0    −12.0    −30.0    −27.2
      SubpageHero subpage (svc,atd) −10.5    −18.8    −24.9    −27.3
      SubpageHero meet (our-team)   −42.9    −46.5    −32.0    −26.2
      SubpageHero contact           −42.0    −42.0    −36.6    −16.2
      DetailHero (team/svc/qa)      −44.5    −49.3    −22.6    −25.0
      Footer arc (FIJI ISLANDS)     −14.0    −1.4     −24.0    +10.0
      Hero full-bleed (home)        +20.9    +20.6    +34.0    +68.3
      SectionGrid (home)           +134.0   +134.0    +81.4    +52.8

  AFTER: 0 of 299 rows below 8px; min clearance 17.4px (contact hero @834).
  Worst per mount:

      mount / page                  1440     1294     834      390
      Hero group-photo (yfv)         28.0     28.0     26.4     20.8
      SubpageHero subpage (svc,atd)  28.0     28.0     19.4     17.8
      SubpageHero meet (our-team)    28.0     28.0     18.4     17.8
      SubpageHero contact            28.0     28.0     17.4     21.8
      DetailHero (team/svc/qa)       28.0     29.0     23.4     17.8
      Footer arc                     70.0     67.0     52.9     49.8
      Hero full-bleed (home)         20.9     20.6     58.6     68.3
      SectionGrid (home)            134.0    134.0     81.4     53.1

  THE RULE, one line: no glyph sits inside a divider's box. Every flipped mount
  now takes the divider's OWN height ladder as its bottom offset — 72/96/120,
  the literal `heightClass` — which is 30% more room than the crest strictly
  needs (the crest reaches 76.67% of the box) and is the version anyone can
  check by eye. Sites changed:
  · Hero/index.svelte group-photo heading: bottom-[24px]/lg:bottom-20 →
  bottom-[72px] md:bottom-[96px] lg:bottom-[120px]
  · SubpageHero heading block: all THREE live ladders (subpage bottom:2%+mb:5%,
  meet .75rem, contact 1rem) → the same 72/96/120. DEVIATION from live.
  · DetailHero label: bottom-[10%] (a fraction of the band, tracking nothing)
  → 72/96/120. DEVIATION from live.
  · SubpageHero's first subheading loses `-mt-[10px]` ("nudges up 10px into
  the wave, matching live") — the only text on the site inside a divider box
  from BELOW. Strict overlap was −10.0/−14.0; edge margin 6.8px @390, under
  the 8px bar. DEVIATION from live. Costs our-team 10px of height, all of it
  inside the hero's own `top` region — the ONLY height any page gained.
  · CtaBand's FIJI caption: bottom-[20%]/lg:bottom-[31%] are fractions of the
  PHOTO, but the thing to clear is the FOOTER's wave, and this section's
  `-mb-[10%]` (a percentage of WIDTH) drags the footer up over the photo by
  39/83/144px @390/834/1440 — so no percentage of the photo's height could
  ever track it. Now bottom:calc(10vw + 128px) at md and calc(10vw + 160px)
  at lg — the footer wave's own box heights — which holds the clearance
  constant across a whole band instead of drifting.
  ≤767 is deliberately UNTOUCHED — see the open item below.
  Every hero offset is an ABSOLUTE box, so none of them adds page height.

  RESIDUAL, disclosed: one row is still negative under the STRICT painted-extent
  metric — our-team "Our" @834, −4.0px. That is the h2's font ascender box (72px
  face in an 80px line box) reaching 4px over the seam into the flat white fill;
  the ink is nowhere near, and against the wave's visible edge the same row
  clears by 18.4px. Not chased: tuning to a font's ascender against a fill that
  is the same white as the page behind it would be tuning to the metric.

- OPEN ITEM, not caused by this round and not fixed by it: at ≤767 the FIJI
  caption is rendered but invisible — the CtaBand's `-mb-[10%]` puts it 80px
  BELOW the footer's top at 390, buried under the footer, opacity 0 (its reveal
  never fires). The wave does not touch it because nothing paints it. Fixing it
  would reveal content at 390 that no pin asked for; flagged for the operator.

- SEAMS (correction 3, watertight): pixel-sampled the two rows straddling every
  divider's flat edge, full width, all 19 mounts × 4 widths, on the pre-change
  and post-change builds. The hairline signal is BYTE-IDENTICAL before and
  after: worst 116/255 at home/1440/services x=977, 75 at home/1294 x=962, 70 at
  team/834 x=773, 95 at team/390 x=264 — all four are content crossing the seam
  (the big-teal-tooth badge, the headshot), present at the same x with the same
  value on both builds. No new gap, and none of the A-round overlap mechanics
  (heights, the V0 H0 close, the absolute footer overlay) was touched.

Mechanical checks (both corrections, because a path-string test cannot see
either): tests/interaction/wave-divider.spec.ts — 16 tests, the 4 routes that
between them mount every caller (Hero ×2, SectionGrid, SubpageHero, DetailHero,
Footer) × 1440/1294/834/390, asserting per mount |endDelta| ≤ 1px, exactly 2
visible periods, and ≥8px clearance to the curved edge, all measured through
getScreenCTM on the live DOM after a scroll sweep (an unrevealed heading is
opacity 0 and would otherwise hide the collision the test exists to catch).
1294 is in the matrix deliberately: the pixel gate never sees it, and it is
where the footer arc's end delta was worst relative to the copy around it.
src/lib/components/WaveDivider.test.ts adds three unit pins — width is
`calc(100% + 1.3px)` (any overflow factor reintroduces the H1 defect), y(0) =
y(1200), and the knots are the 28/92 alternation of two whole periods.
tests/interaction/nav-menu.spec.ts stopped selecting the DetailHero label by
`[class*="bottom-[10%]"]` — a spacing change silently broke a test about
HORIZONTAL alignment — and now uses a `data-detail-label` hook.

Gate round: markuph4 (threshold 0.1, matrix 1440/834/390, mask [],
neutralizeMedia false), all nine pages; baselines markuph3 for home, markuph2
for team/svc/qa, markuph1 for yfv/our-team/services/atd/contact. 48 rows moved,
EVERY ONE of them a wave row — `top` (the hero band and its divider), `Ready for
great [dental health]` (the CtaBand photo the footer arc overlays, and the moved
caption), home's `Your Path to Oral Health` (the SectionGrid band's top wave
seam falls inside it: y≈3667 at 1440 against the region's 2585→3937, and
likewise at 834 and 390) and home's `Want to learn more` @390 13.4→13.3 (the
ACK'd map-noise floor, improving by 0.1). NOTHING outside a wave region moved:
every other row is byte-identical to its baseline.
· Hero regions vs the REF, PASS throughout, worse because the heading is now
20-60px off live's position by design: atd 4.9→7.2/3.9→5.4/4.6→7.5
(1440/834/390), yfv 5.3→7.9/-/5.0→7.6, contact 5.9→7.8/4.2→5.1/5.3→6.7,
our-team 6.8→8.2/5.4→6.0/5.9→7.7, services 5.6→6.7/5.7→6.5/7.4→8.9.
· our-team `top` gains Δh 2.2%/2.0%/2.8% — that is the 10px from the dropped
-mt, and it is the ONLY Δh any page gained. Every other Δh in the round is
at its baseline value, which is the proof that the hero moves added no page
height.
· FOUR rows crossed the line, all the same row on different pages: `Ready for
    great` @834 10.0 → 10.1 on contact/qa/svc/team. The same region moved
+0.2 (9.6→9.8) on home/yfv/atd/services/our-team; those four were sitting
exactly ON 10.0. ACK'd by directive — this region is the footer arc's.
· One row IMPROVED past an ACK'd floor: home `top` @390 10.1 → 9.8, FAIL →
PASS. Recorded because a floor moved, even upward. It is a wave row.
· Every other ACK'd floor is at its EXACT value: team Dentist 13.0/9.9/6.1,
home OdT @834 10.9, home BtS @390 Δh 5.8, svc What-to-expect @1440 Δh 5.1,
atd BtS 61.7/60.5/66.9, our-team DRQ 37.2/23.7, yfv DRQ 27.2, yfv WWYTFC
@1440 Δh 15.1, contact OFFICE HOURS @1440 10.5, WTLM map rows 12.0-13.4.
Per-page exit=1 is those floors, nothing else.

Evidence in the scratchpad (02eae5da…/scratchpad): before.json / before2.json /
after.json / after2.json (the 76-mount end-height + clearance measurements both
ways), detail-before.txt (collision provenance), 76 before + 76 after crops in
shots-before/ and shots-after/, and the composite sheets SHEET-h4-1440.png,
SHEET-h4-1294.png, SHEET-h4-834.png, SHEET-h4-390.png.

---

## 2026-08-13 — mobileux (mobile UX pass)

Operator: "do a mobile pass of the site … some general ux failures". Findings
were measured across 9 routes at 390/360/430; four were acted on. Two of them
are DELIBERATE DEVIATIONS from live and are recorded here as such.

**Not deviations** (they move us TOWARD the reference, and are cited to it):
· Review chevrons were a flat 30×33 at every width, pinned `mx-6` INSIDE the
card, printing over the quote at 390/360 — 551px² of overlap on "The staff was
excellent". Live's `.big-review-arrow-*` is `width:.75rem`
(beachfront.css:7594-7600, :7614-7620) = 18/24/30 against the stepped root,
and `left/right:-.75rem` at ≤479 (:9517-9526) parks them OUTSIDE the holder.
Probed on the REF: arrow x=2..20 against a card at x=27 (25px clear) @390,
x=24 @480, x=84 @600, x=168 @767, x=360 @1440. Ours now lands on those same
numbers, 0 overlap at all six widths.
· The 480–767 tier of `.review-slider-holder-viewport{width:15rem}`
(:7586-7592) was MISSING — the ladder was keyed at 768, so that whole band
kept the ≤479 fill-the-wrapper behaviour and the card ran 427px wide at 480
against live's 360. CLAUDE.md's standing root-font trap, found because the
arrows-on-text defect would not resolve there. Fixed to live: 60..420 @480,
120..480 @600. Neither width is in the gate matrix.

**Deviation 1 — /services no longer scrolls sideways below 375px.**
`.service-grid.my-8{grid-template-columns:16rem 1fr}` (:6153-6160) is a 384px
track and `.service-block{width:13rem}` (:9210-9213) a 312px card, so
`justify-items-center` offsets the card 36px and its right edge lands at
gutter+348. That fits 390 (368) and 375 (367) and NOT 360 (366 > 360):
/services was the one page on the site that scrolled sideways on a 360px phone.
Live overflows there too, so the fix is a deviation — keyed to `max-[374px]`,
strictly BELOW every width the gate samples. Verified: 390/834/1440 card boxes
unchanged, and 320/360/375 now all fit.

**Deviation 2 — services sub-link rows 19.25px → 24px at ≤767.**
`.services-links` is `font-size:7px` (:9219-9222) with `line-height:2.75em`
(:6222-6230) = a 19.25px row, and that row IS the whole tap target (no padding,
no overlay). It fails WCAG 2.2 AA 2.5.8 and fails the spacing exception too —
at a 19.25px pitch the 24px circles on adjacent links overlap. Only this band
is short (2.75em already gives 24.75 at md, 38.5 at lg). THE TYPE SIZE IS
UNTOUCHED; only the pitch moves, inside a `.service-block` whose height is
fixed at 408px, so the card box the gate cuts on does not move. Cost, measured:
services @390 "Cosmetic Dentistry" 0.4 → 1.5, "General Dentistry" 0.9 → 1.4 —
against a 10.0 threshold. No region changed state.

**Not a deviation, no geometry:** the two Google Maps on /contact-us (live has
two `w-widget-map` widgets too, so BOTH stay) shared one accessible name.
Live's map iframes are `aria-hidden="true" tabindex="-1"`; ours are focusable,
so identical titles were two indistinguishable tab stops (WCAG 4.1.2). Titles
are now distinct. Attribute-only.

**Rejected after measuring** — recorded so they are not re-opened:
· Team-card "Read More" reads 113×21.6 and looks like an AA failure. It is not:
`after:inset-0` makes the whole card the target — hit-tested 25/25 across a
302×384 card.
· The 7px footer boilerplate and the 7px services labels are live's own rules,
not ours.
· The "544px void" in the mobile footer was a lazy map iframe caught mid-load
by the screenshot, not a layout defect. The map loads (58 responses).

Gate round: mobileux (threshold 0.1, matrix 1440/834/390, mask [],
neutralizeMedia false) on home/yfv/services/our-team/contact.

**The aggregate score fell 117/153 → 109/153 and NONE of it is this round.**
`next.mjs` compares against the last run per page, which was markuph4 on
2026-08-11 19:42 — and two changes merged to main after it without a re-gate:
8c4c536 (the photographs moved to Prismic/imgix, 2026-08-12 17:38) and 7458f43
(the wave divider went from two cosine periods to ONE sine period, 2026-08-12
19:56). The drifted rows are exactly `top` and `Ready for great dental health`
on EVERY page — the two regions that contain a wave (the hero's bottom edge and
the footer arc dipping into the CTA beach), which is the same signature the
markuph4 entry above records for the previous wave round.
Proven, not inferred: the source changes were stashed and the gate re-run on
identical code the same afternoon (tag `basetoday`). our-team scored 9/15 and
contact 8/12 — matching this round's numbers row for row, to the decimal.
Baseline-today vs this round, over the five gated pages: **67/93 → 67/93, no
region changed state**, the only movement being the two services rows above
(+1.1, +0.5) and contact @834 OFFICE HOURS improving 0.3.
Four rows crossed 10.0 between markuph4 and today on unchanged code: `Ready for
great dental health` @834 (9.8 → 11.1) and `top` @1440 (8.2 → 11.0) among them.
Those belong to the one-period wave directive, which outranks live by operator
instruction — they need an ACK or a floor, and that is the operator's call, not
this round's. Flagged, not reclassified.

---

## 2026-08-13 — "Read Reviews" opens under the footer wave (deviation)

**Reported by the operator:** "when opened the logos sit underneath the wave in
the footer." Confirmed on every route that mounts the closing CTA band, at
every phone width. Two independent defects, one symptom.

**Deviation from live — the disclosure direction.** Live's
`.socials-container.active { bottom: -120% }` (`beachfront.css:7553-7556`)
hangs the row BELOW its label. In the CTA band that lands it on the footer,
whose wave is also absolutely positioned; both are `z-index:auto`, so CSS 2.1
Appendix E step 8 paints them in tree order and the footer, being the later
sibling, covers the logos. Overlap of the wave's box measured on /contact-us:
115 / 97 / 48px at 360 / 390 / 480; clears by 124-162px at 767 / 834 / 1440.

**Live has the same defect** — probed at 390 on beachfront-dentistry.webflow.io,
all three logo centres hit-test to the wave's own `<svg>` and only a sliver of
the Google mark clears it. There is no live rule to copy, so this is a
deliberate deviation rather than a fidelity fix, and is logged as one.

Shipped: `placement="above-sm"` on the CTA-band mount only — it discloses
upward below 768 and keeps live's downward direction from 768 up. The
review-slider mount is unchanged (it has room). Chosen because it is the only
option that costs the CLOSED page nothing: the row is `absolute` +
`opacity-0` + `inert` when shut, so no gate region can move at any width.
Lifting the band over the footer and `isolation:isolate` were both built and
measured, and both take the beach photo with them so the wave stops dipping
into it — rejected. Recorded in SPEC.md §4.4a.

**Not a deviation — the tap-swallowing strip.** The footer wave's WRAPPER had
no `pointer-events-none`; only the `<svg>` inside it did. That left a
full-width 96px strip intercepting taps: at 360, **0%** of the "Read Reviews"
button was hittable and the control could not be opened at all (37% at 390).
Straight bug, no live rule involved.

**Not a deviation — the icon ladder.** The row's icons were a flat
`w-12 lg:w-20` (48/80). Live sizes them on the anchor: `._w-8 { width: 2rem }`
(`beachfront.css:3463-3465`) against the stepped root is 80/64/48, and
`._w-8.clickable.su-w-6-portrait { width: 1.5rem }` (`beachfront.css:9034-9036`)
takes it to 36 at ≤479. The captured markup carries all three classes
(`matching/spec/index.html`, `contact-us.html`). Ours therefore rendered 48
where live renders 36 (≤479) and 48 where live renders 64 (768-991) — a
standing infidelity now corrected. Invisible to every gate for the same reason
as the rest of this entry.

**Why no gate caught any of it:** the pixel matrix screenshots the page as
loaded, and this row is `opacity:0` until a click. The OPEN state has never
been gated. `tests/interaction/mobile-ux.spec.ts` now covers it — 5 routes ×
6 widths (320-767), asserting tappability, paint order at each logo centre,
and clearance to the wave's PAINTED arc.

**Clearance is measured against the painted arc, not the box** — the same way
`tests/interaction/wave-divider.spec.ts` samples it, via
`getPointAtLength`/`getScreenCTM`. The arc's crest only reaches ~77% of the
box, so below 352px the row re-enters the box while staying ≥19px clear of the
ink (floor asserted at 8px). That is only harmless because the
`pointer-events-none` above holds, which is why the spec asserts both together
rather than either alone.

### Same round — `strikes.mjs` was failing OPEN on six of nine pages

Not a geometry item; a defect in the check that enforces rule 3.

`strikes.mjs` derived its page name from the ref URL (`pageOf`, line 32-35)
while `gate.sh` and `next.mjs` key on the gate page KEY. Those agree only where
the key equals the path — `home`, `our-team`, `services`. For the other six the
documented round protocol ("`node matching/strikes.mjs <page>`" with the key you
just passed to `gate.sh`) matched no run at all, and an empty match printed
`strikes: clear — no failing region has stalled` and exited 0.

So rule 3 was being enforced on 10 of 33 stalled regions. `yfv`, `contact`,
`atd`, `svc`, `qa` and `team` each reported clear while holding 4 / 2 / 3 / 5 /
4 / 5 stalled regions respectively — 23 hidden. Every one of them had been
flat for 16+ runs.

Fixed two ways: the filter now accepts EITHER vocabulary (the key is recovered
from the run dir exactly as `next.mjs` does it), and a name that matches no run
now exits 2 with the known-page list instead of reporting clear. A check whose
job is to stop work may not fail open.

Confirmed after the fix: home 5, yfv 4, our-team 4, services 1, contact 2,
atd 3, svc 5, qa 4, team 5 = 33, which reconciles with the unfiltered run.

## MARKUP ROUND I1 — the chrome stops reacting to a cursor that never moved (2026-09-01, main)

MarkUp round of 2026-09-01, Tim, 8 pins across three boards (Navigation
5e733d0b, our-team ad15707f, home d486b3c5). This entry covers the six that
landed; pins 4, 7 and 8 are held for the operator and are recorded at the end.

Every fix here was REPRODUCED before it was written — `matching/probe-markup-i1
.mjs` … `-i4.mjs`, all at 1440 against the local dev server. None of these
states is reachable by a static gate capture, which is why all six had survived
every round to date.

### Pin #1 (thread dc881aa2…) — "a blue background shows up [on hover]"

DEVIATION REMOVED, not added. The home hero CTA hovered to an OPAQUE
`#0e7799`. Live's own rule is `.button:hover { opacity:.6; background-color:
#129ecc4a }` (`beachfront.css:6042-6045`) — a 29%-alpha wash. The opaque fill
was this repo's invention, introduced by the OutlineButton consolidation on a
contrast argument. The wash is restored; live's paired `opacity:.6` stays
dropped, because that half IS the "affordance you can't see" defect the
consolidation existed to remove (7.31:1 → 2.87:1, measured then).
No contrast regression: the ink never moves — white at rest, white on hover —
so the hover state is now exactly as legible as the rest state instead of
jumping to a different ground mid-interaction. Verified: hover bg
`rgba(18,158,204,0.29)`.

### Pin #2 (thread b8a40d69…) — "a white weird border around the logo"

That border is our own focus ring. `trapFocus` moves focus into the overlay on
open, and the overlay's first focusable is the logo `<a href="/">`, whose
LOGO_LINK carries `focus-visible:ring-2 focus-visible:ring-white`. Probed:
`document.activeElement` IS that anchor.
Chromium declines `:focus-visible` for a programmatic focus following a mouse
click, so the ring is invisible here and visible for Tim on WebKit — the bug is
real in both engines, only the symptom is browser-specific. Fixed at the source
rather than per-browser: `trapFocus` now honours `data-autofocus` on the
CONTAINER, and the menu dialog takes `tabindex="-1" data-autofocus`. AT still
announces the dialog; Tab still enters the column in order; no real destination
is ringed for merely being first in the DOM. Shift+Tab from the container wraps
to the last item (it would otherwise walk backwards out of the overlay).

### Pin #3 (thread f7f7cbbd…) — the X's background, and the "jittery" link hover

TWO defects in one pin, both measured.

(a) The pill under the X. The trigger and the Close share ONE SLOT — that is
the point of the swap. So the click that opens the menu leaves the cursor
resting exactly where the Close then mounts, and a `group-hover:` pill is at
full strength in the frame the overlay appears, with nothing hovered on
purpose. Probed with the pointer never moved after the click: pill opacity
0.7 at "rest", 0.7 on hover — indistinguishable from an always-on decoration,
which is how Tim read it. The hover variants are dropped; every PRESS channel
survives (`group-active`, `group-data-[pressed]`), which is all the band
comment above ICON_PILL ever argued for — its case is entirely about touch.

(b) The link hover. Not motion — RASTERISATION. `hover:opacity-60` takes the
row to a non-opaque opacity, promoting it to its own compositing layer, where
the glyphs re-rasterise with greyscale AA instead of subpixel: the text
visibly changes weight the instant the hover starts. On the way out it lands
back on exactly 1.0 and the repaint happens at the END of the fade — hence
"jittery to hover over, but smooth when I mouse out", which is the asymmetry
that identifies it. Nothing moves in either direction: the row's rect is
identical to two decimals hovered and not.
Now `hover:text-[#9fc9d6]` — that same 0.6-white composited against the wash
once, as a flat colour (0.6·255 + 0.4·(14,119,153)). Element stays opaque, no
layer, subpixel AA throughout. FIDELITY COST, stated: the wash is 92% opaque,
so where the beach photo shows through, the flat colour differs from a true
composite by at most 8% of the 40% ground term. Sub-perceptual, and the price.

### Pin #5 (thread 20a4af72…) — "I like how these raise but … ease the easing"

The easing was never the problem: the raise had NO TRANSITION AT ALL, and this
was a repo-wide defect, not a card one.

`animateIn.applyHidden` writes `style.transition` INLINE, and an inline
declaration outranks every class. It was never taken back off, so the reveal's
list — `opacity, transform` — stayed the element's transition list for the rest
of the page's life. CollectionList's CARD_AFFORDANCE asks for
`transition-[box-shadow,translate] duration-200 ease-out` and hovers
`-translate-y-1`, which Tailwind v4 compiles to the `translate` PROPERTY. The
inline list names `transform`, not `translate`, and not `box-shadow` — so both
hover channels were unanimated and the card snapped its 4px.
Probed before: the card reports `transition-property: "opacity, transform"`,
`duration: 0.75s` — the reveal's, not the card's.
`animateIn` now releases its inline transition/delay/transform/opacity when the
reveal ends (`transitionend` on its own `opacity`, with a
`duration + delay + 300ms` timer for every path where no transition ever runs:
reduced motion, the no-IntersectionObserver reveal-in-place, a triggered mount
that hides and shows in one frame, and a `transitionend` lost to a background
tab). Re-hiding cancels a pending release, so triggered call sites still work.
Verified after: the card computes `box-shadow, translate` / 0.2s /
`cubic-bezier(0,0,0.2,1)`, inline transition released, and the raise caught
MID-FLIGHT at `translate: 0px -1.38228px` of its -4px travel.
This is the widest-blast-radius change in the round — it hands every revealing
element on the site back to its stylesheet. Full suite green, incl.
reveal-first-paint and float-drift.

### Pin #6 (thread 4cb2a3cb…) — "The image is overlapping the row of tiles above"

ROUND C HAD ALREADY FLAGGED THIS AND PARKED IT FOR TIM, in CollectionList's own
comment and in LEDGER ROUND C: "30 is BOX-to-box: the 100px headshot overhang
means row 2+ circles overlap the row above's banner." The reply arrived. The
flagged risk is now a rejected outcome, so the axis that caused it moves.
Measured before, at 1440: every card's portrait starts exactly 100px above its
own card top, rows sat 30px apart → each circle cut 70px into the banner of the
row above, on every seam.
`lg:gap-[30px]` → `lg:gap-x-[30px] lg:gap-y-[160px]`. 160 is not a clearance
minimum reverse-engineered from the symptom; it is live's own row rhythm,
`.team-list-item.m-2 { margin-top: 4rem }` (`beachfront.css:6538-6540`) against
the ≥993 root of 40px, leaving the overhang 60px of daylight. The HORIZONTAL 30
is untouched, so Tim's content-gutter alignment and `(100%−60px)/3` both hold.
Verified: worst portrait overlap 0px at 1440/834/390; row gap exactly 160 @1440.

Gate round: markupi1 (threshold 0.1, maxHeightDelta 0.05, matrix 1440/834/390,
mask [], masked [], neutralizeMedia false), page our-team, ref
`beachfront-dentistry.webflow.io` (production is our own build since
2026-08-10 — see LEDGER 2026-08-10), baseline out-readreviews-our-team.
The changed region IMPROVED and nothing else moved:
vw1440 "Dr. Robert Quan" 37.1% → 26.9% dE 21.1 → 14.4 Δh 17.5% → 3.0%
anchor "Ready for great" cand 3301 → 3691 against ref 3761
i.e. the grid was 460px shorter than live and is now 70px short — the 4rem row
rhythm, restored. Every other row is byte-identical to the baseline. The six
remaining FAILs are the pre-existing stalled regions `strikes.mjs` lists; none
was touched, and no threshold, mask or matrix was altered to get here.

Suite: 789 unit + 204 interaction green, svelte-check 0/0. NOTE for the record:
a first `playwright test tests/interaction/` run at 4 workers showed 6
failures (float-drift, image-sizing, 4× mobile-ux). All 6 pass in isolation and
the full dir is green at `--workers=2`; clean main was re-run under stash to
confirm. Contention flake against the single dev server, not a regression —
recorded because "it passed on the rerun" is exactly the sentence that hides a
real one.

### Pin #7 (thread ceb918b8…) — "still showing a line when I load the page in Safari"

FOUND AND FIXED, and it was not a wave seam. Round H4 had already proved every
divider seam watertight (19 mounts × 4 widths, pixel-sampled), so the search
was widened rather than aimed: `probe-markup-i6.mjs` sweeps EVERY pixel row of
the full home page in WebKit **and** Chromium for a row that is both darker
than its neighbours and near-uniform across x — content crossing a seam is dark
in a few columns, a rendering hairline is dark all the way across.

Exactly one hit, on either page, in either engine: **y=1476 @1293, spanning 77%
of the width** — the bottom edge of the SectionGrid card row. The engine split
IS Tim's report, measured: the row survives every resize in WebKit and vanishes
on the first resize in Chromium ("disappears sometimes and then reappears
sometimes… but if I load the page at the beginning, it always shows up").

Then isolated by injecting candidate fixes one at a time against the same
scanner — child overhang, layer promotion, `isolation:isolate`, an opaque
background: all four left it at 7.95. `box-shadow: none` took it to 0.11. The
"line" is the card's own `shadow-sm`: a 1px-offset 10%-black shadow on a
fractional bottom edge (1476.39) rasterises differently per engine and per
pixel snap.

Removing it is a FIDELITY fix, not a concession. Live's own `.expanding-box` /
`.expanding-image` — same 25px radius, same 362×280 box — computes
`box-shadow: none` (probed on beachfront-dentistry.webflow.io). The shadow was
ours. Both SectionGrid cards lose it.
Verified after: 0 line rows at load and after all five resizes, in BOTH engines,
on / and /our-team.

Gate round: markupi1b (threshold 0.1, maxHeightDelta 0.05, matrix 1440/834/390,
mask [], neutralizeMedia false), page home, ref beachfront-dentistry.webflow.io,
baseline out-readreviews-home. TWO rows moved, both toward live:
vw1440 "Our dental team in Redondo" 9.5% → 9.4%
vw1440 "Finally have a dentist" 4.6% → 4.5%
Every other row byte-identical — which is the expected signature for deleting a
shadow live never had.

### Pin #4 (thread c5a1f351…) — the Meet↔Our gap. DELIBERATE DEVIATION, operator-ACKed

Tim: "can we decrease the space between 'Meet' and 'Our'?", follow-up "ideally
'Meet' comes down 30px and 'Our' comes up 40px."

WHY THIS NEEDED A DECISION AND DID NOT GET ONE FROM ME. Measured at 1440
(probe-markup-i5.mjs): the Meet↔Our gap is 120px and the hero divider's lg box
is 120px. They are the same object. "Our"'s line-box top sits exactly on the
hero's bottom edge (475.2 = hero bottom = wave box bottom), so not one pixel of
Tim's 70px can come from spare space — closing the gap means either shrinking
the wave or putting the headline over it. That is a design call, and it
contradicts the standing directive this repo already carries ("wave should never
touch the text", thread 7dd0c2f2, which is why H4 deleted a 10px nudge from
this very heading). Operator chose 2026-09-01: **let the headline sit on the
wave**, keep the divider's size.

WHAT SHIPPED

- `Meet` (SubpageHero band heading, `meet` variant only): `lg:bottom-[120px]`
  → `lg:bottom-[96px]`, a 24px drop.
- `Our Team` (the `.our-team-subtitle-section` headings): `lg:-mt-10` (40px)
  plus `relative z-20` so they paint ABOVE the wave's `z-10`.
- `bg-white` is DROPPED from that section for the `meet` variant. This is
  load-bearing, not tidying: an opaque 40px white band pulled over the hero
  would paint full-width, and where the wave's fill is shallowest (28 of its
  120px box) it would cover PHOTO and slice a straight edge through the
  divider's shape. Body is already white (app.css:42,459), so removing it costs
  nothing and lets only the TEXT overlap.

24, NOT 30 — the one number in this round that is not Tim's. The site's own
floor is 8px of clearance to the wave's painted edge
(`wave-divider.spec.ts` MIN_CLEARANCE). A 30px drop breaks it: probed at 7.59px
@1294 and 2.9px @993, where the hero is only 327.7px tall against a divider
that stays a flat 120. Widening that floor to fit the request is what rule 4
forbids, so the request bent instead. At 24 the clearance is
8.9 / 12.2 / 13.7 / 15.4 at 993 / 1200 / 1294 / 1440.
Net: the gap closes 120 → 56 at every lg width — 64 of the 70 asked for, and
Tim is told the number on the pin rather than having it quietly rounded.
≤991 is untouched (74 @390, 89 @834).

THE CLEARANCE RULE IS REPLACED FOR THIS COPY, NOT SUSPENDED. The headings carry
`data-wave-overlap`; `wave-divider.spec.ts` skips them in the blanket
MIN_CLEARANCE scan and asserts the rule that actually governs them instead —
their GLYPH INK must start below the wave's fill edge, i.e. they sit on white
and never on the photograph. Ink, not line box: a 140px face in a 168px line
box carries ~20px of leading, so a line-box test would condemn an overlap the
letters never make (the line box does cross the fill edge by 2.7px @993; zero
glyphs do). Ascent comes from canvas metrics for the element's own resolved
font, so the check needs no image decoding and no new dependency. 4 new tests,
993/1200/1294/1440, all green. Independently confirmed by pixel
difference-mask before the spec was written: 0 of 4821 glyph pixels on
non-white at 1200/1294/1440, and 12 of 4852 (0.25%) at 993 — boundary
antialiasing, which is exactly what the ink rule tolerates and the line-box
rule would not.

Gate round: markupi1c (threshold 0.1, maxHeightDelta 0.05, matrix
1440/834/390, mask [], neutralizeMedia false), our-team, ref
beachfront-dentistry.webflow.io, baseline markupi1 (this round's own).
vw1440 "top" mm 11.0% → 8.6% dE 6.8 → 5.4 BUT Δh 2.2% → 6.5%
vw1440 "Our" 0.2% → 0.5%
anchor "Our" cand 475 → 435 against ref 465
Everything else byte-identical. READ THAT HONESTLY: the pixel mismatch
IMPROVED and the HEIGHT delta got worse, and the height delta is now the
reason the region fails. That is not a defect to chase — it is the deviation
itself, priced. We were 10px BELOW live's "Our"; we are now 30px ABOVE it,
because live keeps the 120px gap and the operator has chosen 56. Δh 6.5% on
this region is the standing cost of pin #4 and must not be "fixed" by anyone
later; nor may maxHeightDelta be widened to hide it.

### Pin #8 (thread 717b8986…) — the floating doctor. THIRD directive on one behaviour

Tim: "I still don't like how jittery the doctor's photo and the ask the doctor
handwriting moves down from one question to the next. I just wanted to move
smoothly down as you scroll."

WHY THIS WENT TO THE OPERATOR. This is the third pass on the same 40 lines, and
the directives conflict on their face:
(1) 2026-08-11 "I do not like the jumping from question to question" → made
position CONTINUOUS in scroll.
(3) 2026-08-13 "it should sit in the same place for each card" → reversed (1),
because a continuous mapping pins the pair to a fixed SCREEN position and
lets cards slide through it. Quantized again.
(4) 2026-09-01 (this pin) → rejects (3)'s motion.
Taken literally, (4) asks to undo (3) and (3) asked to undo (1). Presented as
such; operator chose a fourth option on 2026-09-01 — scroll-driven smoothstep —
rather than reverting to (1).

THE MEASUREMENT THAT SHOWED (3) WAS NOT SIMPLY WRONG. Probed at 1440 in 40px
scroll steps, before: 57 of 87 steps moved the pair 0px, and each handover then
moved it ~345px inside a SINGLE step — 8.6x the input. So quantizing put the
pair in the right PLACE and gave it the wrong MOTION, and the ~150ms rAF follow
could never fix that, because it smoothed in TIME: it softened the handover's
edges but never its SIZE. One notch of wheel still commanded a whole card.

WHAT SHIPPED. Position is a pure, continuous function of SCROLL. No time-based
motion at all — the rAF only coalesces scroll events into one write per frame,
so there is no loop to settle and no state that can move while the page is
still. Within the interval a card owns, the pair GLIDES from the previous rung
to that card's rung across the first 70% (smoothstep, peak slope 1.5) and then
HOLDS exactly on the rung for the remaining 30%. Both directives survive: (3) as
the hold, (4) by construction, since output continuous in input admits no step.
After: worst 85.1px per 40px step (2.13x — the designed peak of 1.5/0.7), 47 of
87 steps still perfectly still, screen-space worst 45.1px.

ONE REAL MISTAKE, RECORDED because it was invisible to every check that existed.
The glide was first written to run BACKWARD into the next handover — ending on
it rather than starting from it. That is equally continuous and equally smooth,
and it silently broke directive 2 ("anchor to the top fully visible question"):
the pair arrived at the next card's rung up to a whole band (294px of scroll)
BEFORE that card reached the line, i.e. it was anchored to the wrong question
for most of the scroll. The existing unit tests caught it — they assert the
anchor, and two of them failed — which is the only reason it did not ship. The
mapping now runs the glide forward from the handover it belongs to.

TESTS REWRITTEN, NOT RELAXED. `float-drift.spec.ts` and `floatAlong.test.ts`
both encoded the quantized contract and had to change; each old assertion was
replaced by the one that governs now, and the suite got STRICTER, not looser:

- "every settled position is exactly a card offset" → continuity (no scroll
  step commands >2.5x its own size) AND holds (≥15% of steps perfectly still),
  so a mapping that went fully continuous — the thing directive 3 rejected —
  now fails, where before it simply would not have been tested;
- "the handover renders intermediate FRAMES" (a time property, which a
  time-decayed follow satisfies while still lurching) → the handover is
  sampled in SCROLL, and no 15px notch may move the pair more than 2.5x that;
- NEW: nothing moves while the page is still, which makes reintroducing a
  time-decayed catch-up impossible to do silently;
- the unit "holds one card's offset across the whole range" → "glides in over
  the first 70%, then holds the rung EXACTLY" (exact equality, not tolerance);
- the rAF-follow describe → "writes once per scroll burst and never animates
  on its own", asserting the coalescing and that NO follow-up frame is queued.
  float-drift also dropped from ~84s to ~16s: its 1500ms-per-sample settle waits
  existed only for the follow that no longer exists.

Gate round: markupi1d (threshold 0.1, maxHeightDelta 0.05, matrix 1440/834/390,
mask [], neutralizeMedia false), home, ref beachfront-dentistry.webflow.io,
baseline markupi1b. EVERY measured row byte-identical — the only differing line
in the log is the report path. Expected and required: the mapping is 0 at scroll
0, so the static capture is untouched, and that is asserted independently by
float-drift's scroll-0 test.
Suite: 789 unit + 208 interaction green, svelte-check 0/0. (One qa-expand
"within a frame of the click" case failed once under 2-worker load and passes in
isolation and on re-run — same contention flake as the earlier six, recorded for
the same reason.)

---

## 2026-09-01 — MARKUP ROUND I2 (operator, from the PR #38 deploy preview)

Three directives, relayed by the operator after looking at the preview. All
three are DESIGN decisions that depart from live; none is a matching deviation,
and none of the three was reachable from the reference.

### 1. The doctor float: quantized again, eased in CSS, debounced

> "the snap still feels real weird, stick with one spot per card, ship just the
> fix with an eased translation transition" … "probably wants a debounce as well
> to avoid jittery feelings"

FIFTH directive on this one behaviour, and the second reversal. The record is in
`floatAlong.ts`'s header; the short version is that 1 and 4 asked for smooth, 3
and 5 asked for one-spot-per-card, and these are not simultaneously satisfiable
by a POSITION mapping — a continuous position cannot be a fixed position. I1
tried to satisfy both by making the mapping continuous over 70% of each pitch
and holding for the other 30%; the operator's "still feels real weird" is that
compromise being rejected. The resolution is that they were never the same
question: POSITION is quantized (3, 5) and MOTION is eased (1, 4), with the
easing moved out of the scroll mapping and into a CSS transition.

Live's own curve and duration are reused verbatim — `transform 1s
cubic-bezier(.19, 1, .22, 1)`, `.ask-the-doctor-handwriting-anchor`,
beachfront.css:7670. NOT a taste call, and worth stating plainly because
directive 1 originally rejected live's behaviour: what pin #7 rejected was
live's bottom-most anchor teleporting the pair up to 420px per 25px of scroll,
not the curve. With directive 2's top-most anchor halving the hop and the new
debounce collapsing a flick to one transition, the same curve now reads as a
glide.

DEBOUNCE = 120ms, and it is debounced on INDEX CHANGE, not on scroll activity.
That distinction is the whole design: debouncing on scroll activity would freeze
the pair for as long as someone kept scrolling slowly and then jump at the end,
which is the defect it exists to prevent.

### 2. Float wrapper z-10 → z-30

> "z indexes are wrong for the floating doctor"

The card header button is `relative z-10` and the cards come AFTER the float
wrapper in the DOM, so at equal z-index the tie broke in the headers' favour
wherever the doctor overlaps the column's right edge (`lg:-ml-10`, 40px). Live
has no such tie: `.qa-header` computes to z-index 5 and
`.ask-the-doctor-headshot` to 9 — four levels clear, deliberately.

REGRESSION FROM I1, and worth recording as one. Nothing here creates a stacking
context to contain the header: the card is `relative` with z-auto. It only
LOOKED contained while `animateIn` left an inline transform on the card forever
(a transform makes a stacking context) — and I1's fix was to release that
transform on `transitionend`. So I1 fixed the transition bug and exposed a
latent stacking tie in the same change.

Honest note on method: four probes (`probe-markup-i2-z*.mjs`) tried to catch
this as pixels first and all four were inconclusive or actively misleading —
`elementFromPoint` names the background because the pair is
`pointer-events-none`, and the raise-z diff is confounded by layer promotion
changing antialiasing (~1500px of scattered "change" over a 200×200 box with no
occluder at all). The defect was settled by reading live's z-values, i.e. by
rule 1, after the pixels had wasted four rounds.

### 3. The nav press pill is gone entirely

> "the blue still shows up on active for the nav, pretty sure tim just wants it
> totally gone"

I1 removed the pill's `group-hover:` variants (Navigation pin #3). This removes
the `bg-primary` disc outright — all four instances and the `ICON_PILL`
constant.

This costs NO touch feedback, which is the one thing the original pill note
argued for. `ICON_GLYPH` independently carries `group-active:scale-90
group-active:opacity-90` and the matching `group-data-[pressed]` pair, so a
press still dips and shrinks the icon itself on every input path. `pressProps` /
`data-pressed` therefore stay live and are NOT dead code — a test asserts both
halves (the disc is gone, the glyph still responds) so a later cleanup cannot
remove the feedback by mistaking the attribute for orphaned.

### Verification

793 unit (+4) green, svelte-check 0/0. float-drift rewritten again: the
continuity assertions I1 added are replaced by the quantization they now
contradict, and the suite gained the two properties that were previously
untested — that the hop is interpolated by the COMPOSITOR (sampled from the
computed transform, since the inline style jumps straight to the destination)
and that a flick past four cards settles once, on the card landed on.

No gate run: pixel matching is PAUSED (`matching/PAUSED`), and none of these
three changes touches a static capture — the float mapping is 0 at scroll 0, the
z-index changes no geometry, and the pill is invisible at rest.

---

## MARKUP ROUND I3 — Tim's Discord clarifications, 2026-09-02

Two items, both reported against deploy-preview-38 (which by then carried I1 +
I2), both in Discord `#beachfront-dentistry-website` rather than on a board.
The operator's instruction was these two only; everything else on the boards
stays cleared.

### 1. "still seeing the line" — Safari. I1 fixed the wrong line.

> Tim: "still seeing the line:" [screenshot] · Tuck: "hmm chrome? or are you on
> something else for this?" · Tim: "safari"

**I1's diagnosis was wrong and this supersedes it.** I1 (pin #7, commit
173fd60) swept the page for a dark, near-uniform row, found exactly one at
y=1476 spanning 77% of the width, and removed the SectionGrid card's
`shadow-sm`. That row was real and the shadow was ours, so the change stands on
its own fidelity grounds — but it was not Tim's line.

**What his line actually is, measured off the screenshot he posted:**

- Colour, sampled at five x across the row: `rgb(182,170,145)`, constant. That
  is verbatim the terminal stop of the hero's bottom wash
  (`Hero/index.svelte:359`, live's `beachfront.css:6497`) and it appears
  nowhere else on the site as a painted line.
- Position, by landmark match rather than guesswork. Three landmarks in his
  crop — the H1's last-line ink top (60), the line (400), the H2's first blue
  ink (508) — against the same three in our render. The span 60→508 is 448
  device px against 225 CSS px rendered at 1440, so his crop is scale **1.991**
  (Retina 2x, no zoom), and the line lands at CSS y **1259.8** where the hero's
  bottom edge is **1260.0**. Both offsets agree independently: −171 CSS to the
  ink top (rendered −171), +54 to the blue ink (rendered +54).
- Strength: the row is FULL sand, not a blend of sand and white. So the white
  wave fill contributes nothing to it — a whole-device-row shortfall, not edge
  antialiasing.

Root cause: **four edges met on one line with zero overlap** — the hero's
bottom, the wash's bottom, the divider clip box's bottom, and the closing `V0`
edge of the wave path. The width has carried explicit hairline insurance since
round H4 (`width: calc(100% + 1.3px)`, and the comment calls it that); the
height carried none. Rasterise the rotated SVG one device row off the wash
behind it and the wash shows.

**[disclosed — NOT REPRODUCED]** The raster was not reproduced anywhere I can
drive:

| engine                                   | matrix                                               | result |
| ---------------------------------------- | ---------------------------------------------------- | ------ |
| Playwright WebKit + Chromium             | DPR 1/2 × widths 1440/1293/1171, viewport + fullPage | clean  |
| Playwright WebKit + Chromium             | viewport heights 890–910 × 5 scroll offsets, DPR 2   | clean  |
| real WKWebView (`swiftc`, offscreen, 2x) | 1440 × 15 window heights                             | clean  |

The defect is in Tim's on-screen compositor, which none of those reach. So this
round fixes **the invariant, not the raster**: overlap instead of abutment,
which no rounding, layer snapping or framebuffer resampling can undo. Stated
here because "fixed" would be a stronger claim than the evidence supports —
Tim's confirmation on his own machine is what closes this.

The check is `tests/interaction/wave-divider.spec.ts`, a new third assertion on
the existing 16-case matrix (4 routes × 4 widths, every mount): the fill's flat
closing edge must sit ≥1px PAST the clip box's seam edge. It scored **0 at all
16** before the change and 1.8–4px after.

**The wave itself does not move.** Box height moves to the wrapper; the svg
becomes 102.5% of it at −2.5%, against a viewBox extended 3 units to
`0 -3 1200 123`. 102.5%/123 = 1/120 and 2.5% = 3/120, so the scale and every
point on the curve are algebraically unchanged at every height in the ladder.
A/B'd against the old markup at 72/96/120/160 × flip/mirror in both engines at
DPR 1 and 2: max |Δ| on the curve **0.0000px** at 120 and 160, **0.0070px** at 96. What does change is ~1% of pixels along the curve's antialiased edge (the
raster grid now starts at −2.5%) — same curve, re-antialiased. Recorded because
"byte-identical" would have been the stronger claim and it is not true.

Two stale selectors keyed to the literal old viewBox were found and repointed
at the component's new `data-wave` hook: `tests/interaction/mobile-ux.spec.ts`
(32 tests, which is how it was caught) and `matching/probe-shared.mjs` /
`matching/probe-svcdx-tiers.mjs`. A selector that silently matches nothing is a
spec that passes by measuring an absent element.

### 2. The doctor pair is sticky — DIRECTIVE 6, reversing 3 and 5

> Tim: "these elements still jump from question to question:" [screenshot] ·
> Tuck: "oh i thought you wanted it smoother … you just want it as a straight
> scroll?" · Tim: "sticky on scroll through that section" · Tuck: "got it, the
> old behavior"

**[deviation — operator directive, reverses an earlier operator directive]**
This is the sixth directive on one behaviour and it contradicts the third
("it should sit in the same place for each card") and the fifth ("stick with
one spot per card"), landing back on the mechanism the first asked for. All six
are recorded verbatim in `QuestionList/index.svelte`'s markup so a seventh
round cannot re-derive a rejected one; the previous five lived in
`floatAlong.ts`, which this round deletes.

Every mechanism 1–5 was a mapping from scroll to `transform`, and every
complaint (1, 4, 6) was about how that mapping felt. So the answer is not a
better mapping: `position: sticky`, `lg:`-gated, on the zero-height anchor at
the top of the question column. There is no per-frame code left, no debounce,
no easing curve and nothing to tune, and "does not jump" is true by
construction rather than by tuning.

`floatAlong.ts` (221 lines) and `floatAlong.test.ts` (479) are DELETED, not
disabled — a dead action that five directives argued over is exactly what a
seventh round resurrects by accident. Unit count therefore drops 793 → 778.

`tests/interaction/float-drift.spec.ts` is rewritten around the new property,
at 1440/1294/1024: while the column owns the viewport the pair's viewport y
holds to ≤1.5px of spread, no single 40px scroll step moves it more than that,
and it must RELEASE at the column's bottom (or it would be `fixed`, not
sticky). Before the change the same probe measured a **3080px** sweep.

### Verification

778 unit green, svelte-check 0 errors / 0 warnings, eslint clean, 223
interaction green.

**[pre-existing — not touched by this round]** 8 interaction tests fail on this
branch both with and without these changes, verified by stashing and re-running
each file: `qa-expand.spec.ts` ×6 ("the answer's first pixel clears the mask
within a frame of the click") and `appointment-modal.spec.ts` ×2 (focus-ring
and button-state timing). They are logged here rather than fixed because the
operator scoped this round to the two Discord items.

No gate run: pixel matching is PAUSED (`matching/PAUSED`). Neither change moves
a static capture — the wave's curve is unchanged to 0.007px by measurement, and
the sticky anchor is at its rest position at scroll 0.

#### Addendum, 2026-09-02 — the line IS confirmed fixed on a real Safari

The "[disclosed — NOT REPRODUCED]" caveat above is superseded by an operator
observation on the machine that has the defect, and the sequence is worth
keeping because it is the only before/after this bug has ever produced:

- Operator loaded deploy-preview-38 while the fix was still building, i.e. got
  the PRE-fix build: "it seemed to show up on my first load of safari and then
  disappeared [when] I looked into inspector".
- Post-fix build, fresh private window: "not a cache thing, I can't reproduce
  it in a private window now."

Same machine, same browser, one build apart. That is the check the headless
matrix could not be.

It also finally names the mechanism. Web Inspector clears the row on the spot,
exactly as a resize did in Tim's original pin ("if I resize the page, then it
disappears sometimes and then reappears sometimes, but if I load the page at
the beginning, it always shows up"). Opening Inspector forces WebKit to
re-rasterise and drop the composited layer. So this was a FIRST-PAINT
COMPOSITING artifact, not a layout one — which is precisely why 60+ renders
across Playwright WebKit, Chromium and a real offscreen WKWebView all came back
clean: none of them paint through the on-screen compositor. Any future
"can't reproduce it headlessly" on this site should suspect the same thing
before widening the search.

Corollary for anyone testing this class of bug: DevTools destroys it. Capture
with a screenshot (which does not force a repaint), never with the inspector.

Residual risk, stated: the hero is 90vh, so the seam's subpixel position is a
function of window HEIGHT, and this is confirmed at one window size on one
machine. The overhang is 1.8-4px against a one-device-row (0.5 CSS px)
shortfall, so it has 3-8x of margin, but a second sighting at a different
window height would be worth more than another headless sweep.
