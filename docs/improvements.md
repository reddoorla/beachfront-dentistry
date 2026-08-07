# Beachfront Dentistry — suggested improvements

Working list of high-leverage, low-effort improvements, produced by auditing the
repository across six dimensions and then putting every finding through a separate
skeptic pass that opened the cited file and rejected anything inaccurate, already
done, out of scope, or bigger than a few hours' work.

**44 items.** Every one cites a real file and line. Nothing here is speculative —
if a claim couldn't be verified against the current code, it isn't in this document.

## How to read this

- **Impact** is what it changes for a patient trying to book an appointment, or for
  Google, or for whoever maintains the site next.
- **Effort** is honest: `trivial` is under 15 minutes, `small` is under an hour,
  `medium` is a few hours. Anything larger was excluded by design.
- 🎨 marks the 17 items a designer will either notice on the site or needs to
  make a call on. Those are collected in **For the designers** at the end.

Sections are ordered so you can work top-down and stop whenever you run out of time.

---

## Do these first — high impact, ~15 minutes each

9 items. Together these are the best return on time in the whole list:
they close a WCAG failure that locks out every phone held sideways, cut several
megabytes off first load, and remove copy that reads as neglect.

### 1. Adobe Fonts kit ships font-display:auto — display type is invisible for up to 3s

`src/app.html#L16` · **high impact** · **trivial** · 🎨 designer sign-off

**What's wrong.** I fetched the kit referenced on line 16 (https://use.typekit.net/tao4byj.css, 13,231 bytes): all 18 of its @font-face rules are `font-display:auto`, which in Chrome means a ~3s block period — text in museo-sans/museo-slab paints nothing at all until the font arrives or the timer expires. Every heading on this site is museo-slab, so on a slow connection the page renders with its headings blank. It is also a serialized 3-hop render-blocking chain: HTML -> use.typekit.net/tao4byj.css -> its `@import url("https://p.typekit.net/p.css?...")` -> the 54 woff2 files. src/app.css:57-67 already defines carefully category-matched fallbacks (Avenir Next / Rockwell) that font-display:auto never gets to show.

**Fix.** In the Adobe Fonts web project for kit tao4byj, set Font display to `swap` (Kit Settings -> Font display) and republish — no code change, and it converts the FOIT into an FOUT into the fallback stack that app.css already tunes. While in there, prune museo-slab-rounded from the kit if unused (app.css only declares museo-sans and museo-slab), which shrinks the render-blocking CSS.

### 2. Fix the hardcoded footer boilerplate row: stale ©2023 and dead "Privacy Policy" / "Sitemap" labels

`src/routes/+layout.svelte#L109` · **high impact** · **trivial** · 🎨 designer sign-off · _found independently by the CMS and UX audits_

**What's wrong.** `src/routes/+layout.svelte` L108-L114 hardcodes the footer heading and the whole boilerplate row: `legal={["©2023 Beachfront Dentistry", "All Rights Reserved", "Privacy Policy", "Sitemap"]}`. Two problems a reviewer will land on immediately. (1) The year is frozen at 2023 — it is three years stale and will keep aging. (2) `Footer.svelte` L276-L278 renders each of these as `<p>{item}</p>`, plain text, so "Privacy Policy" and "Sitemap" look like links that do nothing; there is no `/privacy-policy` route in `src/routes` at all, while `/sitemap.xml` does exist and could be linked. `matching/LEDGER.md` has no entry for any of this, so it is copied-from-live rather than a decided deviation. None of it is editable in Prismic either.

**Fix.** In `+layout.svelte` L110 make the year dynamic: `` `©${new Date().getFullYear()} Beachfront Dentistry` ``. Then either drop "Privacy Policy" from the array until a page exists, or add a `FooterText`-shaped `href` so `Footer.svelte`'s link branch renders them (point Sitemap at `/sitemap.xml`). If you take the settings-singleton finding, move this row and the "Want to learn more?" heading (L108) into that document at the same time.

### 3. Four pages ship with no <h1> — give SubpageHero's title an aria-level="1"

`src/lib/components/SubpageHero.svelte#L174` · **high impact** · **trivial** · _found independently by the accessibility and SEO audits_

**What's wrong.** SubpageHero renders the page title as `<h2>` (line 174), and it is the only title on /our-team, /services, /ask-the-doctor and /contact-us. Verified against the prerendered output: `build/our-team.html`, `build/services.html` and `build/ask-the-doctor.html` each contain **zero** `<h1>` elements; /contact-us goes through the same component (src/routes/contact-us/+page.svelte:52 with `heading2` "Contact Us") so it is the fourth. Screen-reader users who navigate by top-level heading get nothing on four of the six nav pages, and the document outline starts at level 2 with no root. This repo already has the exact fix pattern: src/lib/components/RichTextHeading.svelte:24 keeps the visual tag and overrides only the announced level via `aria-level`, with the comment "Keep the original tag (so the visual size is unchanged) and only override the announced level." So this costs zero pixels and cannot disturb the gate. (/your-first-visit has the opposite problem — `build/your-first-visit.html` has two `<h1>`s, the hero and the "Office Tour" section heading at src/lib/slices/Carousel/index.svelte:153.)

**Fix.** Add an `ariaLevel` prop to SubpageHero defaulting to `1` and emit `aria-level={ariaLevel}` on the `<h2>` at line 174. Leave the below-wave `subheadings` h2s (lines 209-217) at their default level 2 so /our-team reads Meet(1) → Our(2)/Team(2). Optionally demote the Carousel "Office Tour" h1 (src/lib/slices/Carousel/index.svelte:153) to `aria-level="2"` so your-first-visit has exactly one level-1 heading.

### 4. Hero video preload="auto" pulls 4.8 MB before hydration, even for reduced-motion visitors

`src/lib/components/HeroBackgroundVideo.svelte#L66` · **high impact** · **trivial**

**What's wrong.** The <video> ships `preload="auto"` (confirmed in build/index.html's rendered tag), so the browser starts downloading static/hero/beachfront-hero.webm (4,774,741 bytes) — or beachfront-hero.mp4 (6,373,412 bytes) on Safari/iOS — as soon as the markup parses, in parallel with the LCP poster that the component preloads at fetchpriority=high two lines above. The component's own design already starts playback from JS ($effect, lines 39-50) and deliberately skips play() under prefers-reduced-motion — but preload="auto" means those visitors still pay the full 4.8 MB for a video that never plays.

**Fix.** Change line 66 to `preload="none"`. The existing `el.play()` in the $effect triggers the load itself, so playback still starts right after hydration but no longer competes with the poster/LCP, and reduced-motion visitors download nothing. If you want to keep the first frame warm, `preload="metadata"` is the conservative middle ground.

### 5. menu-beach.jpg is a 2.25 MB camera original hidden under a 92% opaque cyan wash

`src/lib/components/Nav.svelte#L330` · **high impact** · **trivial**

**What's wrong.** The mobile menu panel's inline background-image points at /menu-beach.jpg. `sharp` reports it as 5472x3648, 2,304,779 bytes — an unresized camera master. The same declaration layers `linear-gradient(rgba(18,158,204,0.92), rgba(18,158,204,0.92))` over it, so 92% of the photo is covered by flat cyan. Because it is a CSS background on a conditionally-rendered element, it is not fetched until the visitor taps the hamburger — which means the first menu open on a phone costs 2.25 MB and the panel shows flat cyan until it lands. It also has no Cache-Control (see the netlify.toml finding), so it revalidates.

**Fix.** Re-encode with the already-installed `sharp` to ~1600px wide at q70 (or WebP) and overwrite static/menu-beach.jpg — roughly 120 KB, a ~19x reduction. At 8% visible opacity the quality loss is undetectable. Optionally also add a `<link rel="prefetch">` for it so the panel is never blank, though at 120 KB it will not be.

### 6. Remove (or make dismissible) the landscape blocker that locks out every touch device

`src/routes/+layout.svelte#L119` · **high impact** · **trivial** · 🎨 designer sign-off · _found independently by the accessibility and UX audits_

**What's wrong.** `<LandscapeModal />` renders on every non-frozen page. LandscapeModal.svelte:10-16 shows it when `(pointer: coarse)` AND `(orientation: landscape) and (max-width: 1023px)` — which is every phone held sideways. Lines 29-41 render a full-screen opaque black `role="dialog" aria-modal="true"` overlay containing only an `<h3>Please Switch to Portrait Mode</h3>`: no close button, no Escape handler, no `use:trapFocus`, and nothing behind it is reachable. That is a straight WCAG 2.1 SC 1.3.4 (Orientation, AA) failure — a user whose device is mounted or locked in landscape can never use the site. It is also worse than the reference: matching/SPEC.md §D.5 records live's behaviour as `alert("Please use Portrait!")` at `innerWidth < 792 && innerHeight < innerWidth` — a dismissible browser alert that returns the user to the page. And because `aria-modal="true"` hides the rest of the document from AT while focus is never moved into the dialog, a VoiceOver user in landscape gets a page with no reachable content at all. The gate viewports are 1440/834/390 (all portrait-shaped), so this was never exercised — yet matching/LEDGER.md:72-90 documents a whole calibration round for the 480–767 "mobile-landscape band", meaning the team deliberately styled a viewport range this modal blacks out.

**Fix.** Delete `<LandscapeModal />` from src/routes/+layout.svelte:119 (the simplest correct fix — the site's 480–767 band is already calibrated and reads fine in landscape). If the nag must stay to mirror live, give it a real Close button, wire `use:trapFocus={{ onEscape: close }}`, and dismiss permanently for the session once closed — never leave a non-dismissible overlay.

### 7. Remove the 11 internal `blux_*` slices from the page slice picker

`customtypes/page/index.json#L87` · **high impact** · **trivial**

**What's wrong.** `customtypes/page/index.json` L25-L124 offers 30 slice choices in the Slice Zone. Eleven of them (L87-L122: `blux_section`, `blux_text`, `blux_block`, `blux_grid`, `blux_gallery`, `blux_carousel`, `blux_media`, `blux_media_text`, `blux_embed`, `blux_table`, `blux_collection`) are Blux-migration internals that no Beachfront page uses — `src/lib/beachfront-pages.js` only ever emits `hero`, `section_grid`, `collection_list`, `carousel`, `question_list`, `first_visit_toc`, `exam_timeline`, `service_category_band`. Their editor UI is unusable by design: `src/lib/slices/BluxBlock/model.json` L18-L32 exposes fields labelled "payload (serialized JSON tree)", "widget_kind" and "widget_html", and `src/lib/slices/BluxCarousel/model.json` exposes ~20 raw CSS-ish fields (`overlay`, `max_content_width`, `dots_position`, `transition_speed`). An editor adding a section to a page scrolls a 30-item list where a third of the entries produce a broken or empty band.

**Fix.** Delete the eleven `blux_*` entries from the `choices` object in `customtypes/page/index.json` (L87-L122) and push the type. Removing a choice only hides it from the picker — it does not touch existing documents, and no Beachfront page document contains one. Consider also trimming the unused generic starter slices (`lead_text`, `text_columns`, `grid_band`, `title_band`, `split_feature`, `media_full`, `location_map`) down to the eight this site actually renders plus `rich_text`/`gallery` as general-purpose escape hatches.

### 8. Stop fetching the below-fold CTA beach at fetchpriority="high"

`src/lib/components/HeroBackgroundImage.svelte#L64` · **high impact** · **trivial**

**What's wrong.** `fetchpriority="high"` is hardcoded on the <img> (line 64) and no `loading` attribute is ever set, so it applies even when the caller passes `preload={false}`. CtaBand.svelte:149 correctly passes `preload={false}` (so no duplicate <link rel=preload>), but the image element itself still races the real LCP hero. Verified in the build: every prerendered page carries exactly TWO fetchpriority="high" images — the hero and the closing CTA band beach that sits at the very bottom of the document. build/services/invisalign.html -> hero + /images/cta-beach.jpg (419 KB); build/our-team.html, build/services.html, build/your-first-visit.html -> hero + the Prismic beach. I measured that Prismic beach candidate: 408 KB at w=1920, 645 KB at w=2560 (which is what a DPR-2 laptop selects, since sizes="100vw"). That is up to 645 KB fetched at highest priority, before the hero, for something ~4 screens down. This is exactly the multi-instance hazard the component's own doc comment (lines 6-14) warns about.

**Fix.** Make both attributes follow the existing `preload` prop rather than hardcoding: `fetchpriority={preload ? "high" : "auto"}` and add `loading={preload ? "eager" : "lazy"}` alongside it at lines 64-65. No call-site changes needed — CtaBand already passes `preload={false}`, and DetailHero/SubpageHero/Hero already pass `preload={true}`.

### 9. Two link types delete their focus outline with no replacement ring

`src/lib/slices/CollectionList/index.svelte#L215` · **high impact** · **trivial** · 🎨 designer sign-off

**What's wrong.** Two anchors apply Tailwind v4's `focus-visible:outline-hidden` (which sets `outline-style: none` outside forced-colors mode) with no `focus-visible:ring-*` to replace it, so keyboard focus becomes completely invisible — WCAG 2.4.7 Focus Visible (AA). (1) src/lib/slices/CollectionList/index.svelte:215 — `<a {href} class="focus-visible:outline-hidden">` wrapping each team member's name; confirmed in `build/our-team.html` as `<a href="/team-members/dr-robert-quan" class="focus-visible:outline-hidden">` and repeated for all eleven people, plus the same slider on /your-first-visit. (2) src/lib/slices/FirstVisitToc/index.svelte:60 — the three numbered `.visit-list-item` TOC cards; confirmed in `build/your-first-visit.html` as `<a href="#office-tour" class="visit-list-item … focus-visible:outline-hidden …">`. Tabbing /our-team therefore loses the caret for eleven consecutive stops. This is inconsistent with the rest of the codebase, where every other control pairs `outline-hidden` with a ring (e.g. OutlineButton.svelte:46, QuestionCard.svelte:150, the sibling "Read More" link at CollectionList/index.svelte:239).

**Fix.** Append the same ring utilities the sibling links already use to both anchors: `focus-visible:ring-primary-deep focus-visible:ring-2 focus-visible:ring-offset-2` on src/lib/slices/CollectionList/index.svelte:215, and the same on src/lib/slices/FirstVisitToc/index.svelte:60 (that card sits on white, so `ring-primary-deep` reads). Focus rings paint outside the box, so neither changes the resting layout the gate measures.

---

## High impact, up to a few hours

### 10. Add LocalBusiness/Dentist JSON-LD to the layout

`src/routes/+layout.svelte#L57` · **high impact** · **small**

**What's wrong.** The site ships zero structured data. I grepped the prerendered output — `grep -c "ld+json" build/index.html build/services.html build/services/dental-crowns.html` returns 0 for all three. This is the single biggest local-SEO gap: for a dental practice, LocalBusiness/Dentist schema is what feeds the Google knowledge panel, map pack eligibility, hours display, and click-to-call in SERPs. The plumbing is already built and unused: `Seo.svelte` accepts a `jsonLd` prop (src/lib/components/Seo.svelte#L29, #L94-97) and `seo.ts` exports `jsonLdScript` + `organizationJsonLd` (src/lib/seo.ts#L45, #L134), but `+layout.svelte#L57-63` never passes `jsonLd`. Every input already exists as a constant: PHONE (src/lib/site.ts#L2), ADDRESS (#L25), HOURS (#L33), sameAs URLs in REVIEW_DESTINATIONS (#L9-21), and geo coordinates are literally embedded in the Google Maps href at src/lib/site.ts#L12 (`@33.8176193,-118.3853988`).

**Fix.** Add a `dentistJsonLd()` helper to src/lib/site.ts (or seo.ts) returning `{"@context":"https://schema.org","@type":"Dentist",name:SITE_NAME,url:origin,telephone:"+13103789241",image:origin+"/hero/beachfront-hero-poster.jpg",address:{"@type":"PostalAddress",streetAddress:"1706 S Elena Ave. Suite B",addressLocality:"Redondo Beach",addressRegion:"CA",postalCode:"90277",addressCountry:"US"},geo:{"@type":"GeoCoordinates",latitude:33.8176193,longitude:-118.3853988},openingHoursSpecification:[...]}` built from HOURS, plus `sameAs` from REVIEW_DESTINATIONS hrefs. Pass it as `jsonLd={...}` on the `<Seo>` call in +layout.svelte#L57 so it lands on every page. Derive the openingHoursSpecification entries from the existing HOURS pairs (Mon-Thu 07:00-17:00, Fri 07:00-14:00, skip the Closed row) so the footer and the schema cannot drift — the same drift-guard pattern site.test.ts already uses.

### 11. Make `collection_type` and `category_tag` Select fields — today a typo silently renders an empty section

`src/lib/slices/CollectionList/model.json#L19` · **high impact** · **small**

**What's wrong.** Two slice fields are free Text but must byte-match a value defined elsewhere, with no placeholder, no options and no validation. (1) `CollectionList/model.json` L19-L21, L42-L44, L65-L67, L88-L90 define `collection_type` as `{"type": "Text", "config": {"label": "collection_type"}}`. `src/lib/blux-catalog/collections-load.ts` feeds that string straight to `client.getAllByType`, and its catch block returns `[]` for an unknown type — so an editor who types "Person" or "people" instead of `person` gets the "Meet Our Team" heading followed by nothing, with no error anywhere. (2) `ServiceCategoryBand/model.json` L46 defines the per-card `category_tag` the same way; `ServiceCategoryBand/index.svelte`'s `docsFor()` splits each `collection_item.tags` string on commas and requires an exact `includes()` match, so a mismatched tag renders the full tinted category card with a completely empty cyan link panel. Both failure modes look like a design bug, not a content bug.

**Fix.** In `CollectionList/model.json`, change all four `collection_type` fields to `{"type": "Select", "config": {"label": "Collection to show", "options": ["person", "collection_item", "news_article"]}}`. In `ServiceCategoryBand/model.json` L15 and L46, change `category_tag` to a Select with the four live values verbatim: `"Cosmetic Dentistry", "Restore Your Smile", "General Dentistry", "Specialty Services"` (these are the exact strings seeded in `src/lib/beachfront-pages.js` L633/L642/L651/L660 — keep them byte-identical so existing documents keep matching). Push with `scripts/push-slice-models.mjs`.

### 12. No image anywhere on the site uses loading="lazy"

`src/lib/slices/QuestionList/index.svelte#L156` · **high impact** · **small**

**What's wrong.** I parsed the prerendered build: build/index.html has 65 <img> and 0 with loading="lazy"; build/ask-the-doctor.html has 89 <img> (42 Prismic) and 0 lazy; build/your-first-visit.html 59 imgs (38 Prismic), 0 lazy; build/our-team.html 31 imgs (24 Prismic), 0 lazy. The only `loading="lazy"` occurrences in src/ are in components that never render on this site (ProductListing, ProductDetail, BluxNode) plus MapEmbed's iframe. So on /ask-the-doctor every one of the 42 question-card photos is requested during initial page load, competing with the hero. Combined with the missing `sizes` above, that is several MB of images on the critical path.

**Fix.** Add `loading="lazy"` to every below-the-fold image call site — the PrismicImage instances listed in the `sizes` finding, plus the raw <img> at CollectionList:253, Carousel:320,321,386, SectionGrid:222,565,572, QuestionList/QuestionCard:166,173, ServiceCategoryBand:139, FirstVisitToc:72. Leave the hero path (HeroBackgroundImage) eager. `decoding="async"` on the same elements is a free extra (currently only HeroBackgroundImage.svelte:65 has it).

### 13. Point the axe and Lighthouse runs at real pages, not dev fixtures

`tests/a11y/fixtures.spec.ts#L4` · **high impact** · **small** · 🎨 designer sign-off · _found independently by the code-health and accessibility audits_

**What's wrong.** The axe suite audits exactly three routes — /dev/a11y-fixtures, /dev/animate-in, /dev/blux-page (lines 4-8) — and lighthouserc.json's `collect.url` is the single URL http://localhost:5173/dev/a11y-fixtures. No real page (/, /your-first-visit, /our-team, /services, /ask-the-doctor, /contact-us, or any of the three detail templates) is ever checked by axe or Lighthouse, even though those pages carry the hand-built markup most likely to have contrast, heading-order, and landmark issues: inline `style="color:#129ecc"` headings in DetailIntro/DetailHero, an h2-only /contact-us with no h1, and the modal/slider/accordion interactions. The site is about to go to professional designers, who will run exactly these checks.

**Fix.** Add the real routes to both lists — extend the `pages` array in tests/a11y/fixtures.spec.ts with `/`, `/your-first-visit`, `/our-team`, `/services`, `/ask-the-doctor`, `/contact-us`, plus one representative detail page per template (e.g. /services/dental-exams, /questions/<uid>, /team-members/<uid>), and add the same paths to `ci.collect.url` in lighthouserc.json. Both are array edits; fix or explicitly waive whatever the first run reports before the design review.

### 14. Raise the /services category-card link labels above the 7px / 19px floor

`src/lib/slices/ServiceCategoryBand/index.svelte#L177` · **high impact** · **small** · 🎨 designer sign-off

**What's wrong.** Every link into a service detail page from /services renders at `text-[7px] leading-[19.25px]` below 768px and `md:text-[9px] md:leading-[24.75px]` from 768–991 (confirmed verbatim in `build/services.html`). Two problems compound. Size: 7px uppercase bold with 1.28px tracking, white on the cyan panel, is not readable text — and these are not decorative captions, they are the only navigation into /services/<uid> on a phone. Target: because the anchor is `flex items-center` with `leading-[19.25px]` and the rows are stacked `<li>`s with no spacing, each hit target is ~19px tall, under the 24×24 CSS px minimum of WCAG 2.2 SC 2.5.8 (AA) — and the "inline within a sentence" exception does not apply to a stacked list of block links. matching/LEDGER.md records this as "[verified, NOT changed] The panel label really is 7px at <=767 — a value that looks like a typo", i.e. it is a faithful copy of live rather than a considered decision, and the project has already taken exactly this kind of deviation before (LEDGER lines 3-7: the operator-ACK'd AA colour swap on the footer heading, kept permanently because live's cyan fails contrast).

**Fix.** Raise the mobile and tablet steps to `text-[12px] leading-[24px] md:text-[14px] md:leading-[26px]` (desktop `lg:text-[14px]` is already fine), which clears both the legibility and the 24px target minimum, and add a LEDGER entry alongside the footer AA-colour precedent so the gate delta is disclosed rather than silent. The panel is a fixed-height 40% box, so verify the two link columns still fit at 390 before committing.

### 15. Re-encode the hero video: 6.4 MB for a 15-second 720p loop

`src/lib/slices/Hero/index.svelte#L121` · **high impact** · **small** · 🎨 designer sign-off

**What's wrong.** macOS metadata on static/hero/beachfront-hero.mp4: 15.467s, 1280x720, 6,373,412 bytes — about 3.3 Mbps for a slow muted drone flyover. The webm sibling is 4,774,741 bytes (~2.5 Mbps). A 720p background loop with little high-frequency motion encodes cleanly at 1.0-1.5 Mbps. Together these two files are 11 MB of the repo's 14 MB static payload, and one of them is the largest single request on the home page.

**Fix.** Re-encode both once and commit the results: `ffmpeg -i beachfront-hero.mp4 -c:v libx264 -crf 26 -preset slow -profile:v high -pix_fmt yuv420p -movflags +faststart -an beachfront-hero.mp4` (~2 MB) and `ffmpeg -i … -c:v libvpx-vp9 -crf 36 -b:v 0 -row-mt 1 -an beachfront-hero.webm` (~1.2 MB). Adding an AV1 or HEVC source is optional. Compare a frame against the current file before committing; at CRF 26 on this footage it is visually identical.

### 16. Relabel the custom types and fields from developer jargon to what an editor actually sees on the page

`customtypes/person/index.json#L50` · **high impact** · **small**

**What's wrong.** The three content types are the generic fleet-starter shapes with their generic labels, and nothing tells an editor what any field does. In `customtypes/person/index.json`: L9 `uid`, L12 `title` is actually the person's NAME, L33 `media` is their HEADSHOT, L50 `tags (comma-separated)` is their JOB TITLE (`CollectionList/index.svelte` renders `doc.data.tags` as the uppercase role line under the name), and L38-L46 `gallery` / `image` / `caption` is the FAVORITE BEACH banner + white caption pinned across the bottom 30% of every /our-team card. Nobody would guess that. Meanwhile L52 `date` and L55 `link` are never read by any person template — dead fields in the editor UI. The type names are worse: `customtypes/news_article/index.json` L3 is labelled "News Article" but holds the 40 Ask-the-Doctor questions, and `customtypes/collection_item/index.json` L3 is labelled "Collection Item" but holds every service detail page. An editor asked to "add a new service" has to be told which of these two to open.

**Fix.** Edit the `label` strings (content is untouched — labels are display-only). `person`: title → "Name", media → "Headshot", tags → "Job title (shown under the name)", gallery → "Favorite beach (image + caption for the card banner)", and delete the unused `date` and `link` fields. `collection_item`: rename the type label to "Service", title → "Service name", media → "Hero photo (falls back to the shared reception photo)", tags → "Category — must match a category card on /services", link → "YouTube embed URL (optional)" (that is what `src/routes/services/[slug]/+page.svelte` L47-L50 reads it for). `news_article`: rename the type label to "Ask the Doctor Question", title → "Question", body → "Answer", summary → "Card excerpt". Add `placeholder` text on the free-text fields while you are in there.

### 17. Seed real meta titles + descriptions for the five core pages

`scripts/seed-pages.mjs#L198` · **high impact** · **small**

**What's wrong.** The five top-level pages ship no meta description at all and a near-worthless title. Verified in the prerendered output: build/index.html, build/services.html and build/our-team.html contain no `<meta name="description">`, no `og:description`, and no `twitter:description` — only `og:title` content="Beachfront Dentistry | Home" / "| Services" / "| Meet Our Team". The cause is scripts/seed-pages.mjs#L197-198, which writes only `title` and `slices` into the Prismic doc, leaving the page custom type's whole "SEO & Metadata" tab (customtypes/page/index.json — meta_title, meta_description, meta_image) empty, so `pageMeta()` (src/lib/blux-catalog/page-doc.ts#L82-90) returns undefined for all of them and `Seo.svelte#L57` skips the tag. Compounding it, the homepage title resolves to "Beachfront Dentistry | Home" (src/lib/beachfront-pages.js#L201) — "Home" is dead weight in the most valuable title tag on the site, with no service or city keyword anywhere. Detail pages under /services and /team-members do get descriptions, so the pages that rank hardest are the only ones without.

**Fix.** Add a `META` map next to TITLES in src/lib/beachfront-pages.js#L200 with a `meta_title` and `meta_description` per uid — e.g. home: "Beachfront Dentistry | Dentist in Redondo Beach, CA" / "Family and cosmetic dentistry in Redondo Beach for over 40 years. Relaxed visits, no-pressure treatment plans. Call (310) 378-9241."; services: "Dental Services in Redondo Beach | Beachfront Dentistry"; and so on for our-team, your-first-visit, ask-the-doctor. Keep descriptions 140-155 chars. Then spread it into the seeded doc at scripts/seed-pages.mjs#L198: `data: stripEmpty({ title: [...], ...(META[uid] ?? {}), slices })`. Nothing renders `data.title` on the page (the [uid] route renders only the SliceZone), so this is pixel-neutral and the matching gate is unaffected.

### 18. The appointment modal never shows an error and loses focus on success

`src/lib/components/AppointmentModal.svelte#L43` · **high impact** · **small** · 🎨 designer sign-off · _found independently by the accessibility, UX and code-health audits_

**What's wrong.** This is the site's only conversion form (every `#appointment` CTA opens it — src/routes/+layout.svelte:45-51). Its script block declares no `$props()` at all, so the `form` action result is unreachable: the `use:enhance` callback at lines 43-48 special-cases only `result.type === "success"` and otherwise calls `update()`, which stores the failure on the page but renders nothing. A visitor whose submission is rejected (bot-timing screen, missing field, ingest outage) sees the form sit there unchanged with no message — no error text, no `aria-live` announcement, no focus move. The repo already ships the right component for this and it goes unused here: src/lib/components/Form.svelte builds a `role="alert"` error summary and focuses it (lines 21-25, 29-45). Separately, on success the `{#if submitted}` swap at line 35 unmounts the whole form including the `<button type="submit">` that currently has focus, so focus drops to `<body>` inside an open `<dialog>`; and the confirmation `<p role="status">` at line 36 is inserted into the DOM already containing its text, which screen readers do not reliably announce (a live region must exist before its content changes).

**Fix.** Accept `let { form } = $props()` and wrap the fields in the existing `<Form errors={form?.errors}>` so failures render the focused `role="alert"` summary. For the success path, render an always-present empty `<div role="status" aria-live="polite">` outside the `{#if submitted}` block and write the confirmation text into it, and `bind:this` the confirmation heading with `tabindex="-1"` and `.focus()` it in the success branch so focus lands somewhere real.

### 19. Two patient-facing paperwork CTAs are dead links (href="#")

`src/lib/beachfront-pages.js#L401` · **high impact** · **small** · 🎨 designer sign-off

**What's wrong.** On /your-first-visit, `form_link: webLink("#")` appears twice — the "Registration Form" button in the TOC band (#L400-401) and the "Download Forms" button in the exam timeline (#L474-475). Both render through OutlineButton.svelte#L44, which passes the value straight to `href`, producing `<a href="#">`. Clicking either looks like a normal button press and jumps the page to the top — nothing downloads, nothing opens. These sit directly beside the working "Book an Appointment" button, so they read as equally live. Registration paperwork is one of the two things a new patient actually comes to that page for. matching/LEDGER.md#L382-383 already flags this as an open item ("Registration/Download-Forms links are '#' placeholders (need the real patient-forms URL)") — it has not been closed, and a designer review will land on it immediately.

**Fix.** Ask the practice for the real patient-forms URL (likely a Modento page, given MODENTO_URL in src/lib/site.ts#L3) and replace both `webLink("#")` calls, then re-seed. If no URL exists yet, remove `form_label` from both slices so the buttons don't render at all — FirstVisitToc/index.svelte#L172 and ExamTimeline/index.svelte#L216 both guard on the label, so deleting it cleanly hides the button rather than shipping a dead one.

### 20. Add `sizes` to every PrismicImage — headshots currently download at 2048–3840px

`src/lib/slices/CollectionList/index.svelte#L145` · **high impact** · **medium**

**What's wrong.** No PrismicImage call site in the repo passes `sizes` or `widths` (grep for `sizes=` across src/lib + src/routes returns only HeroBackgroundImage.svelte:50,60). @prismicio/svelte emits a srcset of [640, 828, 1200, 2048, 3840] but with no `sizes` the browser applies the spec default of 100vw and picks a candidate sized to the viewport, not to the box. Verified in build/our-team.html: the team headshots render at `size-[120px] … md:size-[320px] lg:size-[200px]` with srcset [640,828,1200,2048,3840] and no sizes. I measured the real bytes from images.prismic.io for one (Dr. Quan, served as AVIF): w=2048 is 126 KB and w=3840 is 341 KB, versus 10 KB at w=400 — which is the correct candidate for a 200px box at DPR 2. So a 1440px desktop pulls 126 KB per headshot and a Retina laptop pulls 341 KB, ~12x and ~34x over. There are 24 such Prismic images on /our-team, 28 on /, 38 on /your-first-visit, 42 on /ask-the-doctor. Separately, CollectionList/index.svelte:253 renders `<img src={beach.image.url}>` with no srcset at all (confirmed `widths:[]` in the build) — 11 instances on /our-team, 37 KB each where 640w would be 20 KB.

**Fix.** Add a `sizes` attribute matching each rendered box to the PrismicImage call sites — CollectionList:124,145,205; SectionGrid:298,413,459,519,610,622; Carousel:204,406,436; QuestionList:156 + QuestionCard:102; ExamTimeline:174; MediaText:23,51; ScreenWidthMedia:167; team-members/[slug]/+page.svelte:51. For the headshots that is `sizes="(min-width:992px) 200px, (min-width:768px) 320px, (min-width:480px) 240px, 120px"`, ideally with `widths={[120,240,320,400,640]}` so the srcset stops offering 3840w at all. For the raw `<img>` at CollectionList:253, route it through PrismicImage (or `srcset()`/`imgix()` from $lib/utils/image, which already exist and are unused outside HeroBackgroundImage).

### 21. Move practice contact details (phone, address, hours, booking/payment URLs) into a Prismic settings singleton

`src/lib/site.ts#L2` · **high impact** · **medium**

**What's wrong.** Every fact a dental practice actually changes is in code, in three separate files. `src/lib/site.ts` holds PHONE (L2), MODENTO_URL (L3), REVIEWS_URL/REVIEW_DESTINATIONS (L5-L21), ADDRESS (L25-L28) and HOURS (L33-L37). `src/lib/blux/site-config.json` L33-L47 repeats the same hours/phone/address as footer column rows, plus the nav labels (L4-L10) and the Facebook URL (L14-L17). `src/lib/components/MapEmbed.svelte#L10` repeats the address a third time. Nothing in Prismic touches any of it. A holiday-hours change, a new phone line, or a suite-number change is a developer ticket and a deploy — for a five-page practice site this is the single most frequently edited content on the whole site, and it is the only content an editor cannot reach. (`src/lib/site.test.ts` guards site.ts↔site-config.json drift, so this is not a correctness bug — it is purely an editor-access gap.)

**Fix.** Add a non-repeatable `settings` custom type in `customtypes/settings/index.json` with: Phone display + Phone tel link, Address line 1 / line 2, an Office Hours group (Days text + Times text), Booking URL, Payment URL, and a Review Links group (Label / URL / Icon). Fetch it once in `src/routes/+layout.server.ts` (`client.getSingle("settings")`) and pass it through `page.data` to Nav, Footer, MapEmbed and `/contact-us`. Keep `src/lib/site.ts` as the typed fallback so nothing breaks before the doc is published, and widen `site.test.ts` to assert the fallback still matches. Doing just phone + address + hours captures most of the value if you want to time-box it.

---

## Worth doing

### 22. "Anything we should know?" is a one-line text input

`src/lib/components/AppointmentModal.svelte#L86` · **medium impact** · **trivial** · 🎨 designer sign-off

**What's wrong.** The only free-text field on the appointment form renders as a single-line `<input type="text">` — Field.svelte defaults to `type = "text"` (#L36) and only branches to a `<textarea>` when `type === "textarea"` (#L74). The prompt invites a narrative answer ("Anything we should know?" — dental anxiety, insurance, an urgent problem), but the visitor sees a one-row box that scrolls horizontally as they type. On a phone this is the difference between a useful triage note and a truncated fragment, and it's the field that most changes how the practice preps for the visit.

**Fix.** Add `type="textarea"` to that Field (Field.svelte already handles rows, defaulting to 4). Consider a clearer label such as "Anything we should know? (optional)" so it doesn't read as required alongside the three starred fields.

### 23. Both typekit preconnect hints are on the wrong crossorigin mode

`src/app.html#L14` · **medium impact** · **trivial**

**What's wrong.** Line 14 preconnects https://use.typekit.net WITHOUT crossorigin, and line 15 preconnects https://p.typekit.net WITH crossorigin. That is backwards for what each host actually serves. I checked the kit CSS: all 54 font URLs are `src:url("https://use.typekit.net/af/...")` — @font-face fetches are always CORS-mode, so the anonymous connection warmed by line 14 cannot be reused and each font pays a fresh DNS+TLS handshake. Conversely the only thing fetched from p.typekit.net is the non-CORS `p.css` stylesheet pulled in by the kit's @import, which the crossorigin-only hint on line 15 does not warm either. Both hints are currently dead weight on the font critical path.

**Fix.** Replace lines 14-15 with three hints: `<link rel="preconnect" href="https://use.typekit.net">`, `<link rel="preconnect" href="https://use.typekit.net" crossorigin>`, and `<link rel="preconnect" href="https://p.typekit.net">`. Emitting both modes for use.typekit.net is the standard pattern precisely because that host serves a stylesheet and CORS fonts.

### 24. Derive the footer map query from ADDRESS instead of a fourth hardcoded copy

`src/lib/components/MapEmbed.svelte#L10` · **medium impact** · **trivial**

**What's wrong.** `MapEmbed.svelte` L9-L11 defaults its query to the literal string `"Beachfront Dentistry, 1706 S Elena Ave, Redondo Beach, CA"`. Both call sites use that default: `src/routes/+layout.svelte` L104-L116 renders `<Footer showMap />` with no `mapQuery`, and `src/routes/contact-us/+page.svelte` renders `<MapEmbed />` bare. This is a fourth copy of the practice address (after `site.ts` L25-L28, `site-config.json` L44-L45, and the contact page's own `<address>` rows), and it is the only one `src/lib/site.test.ts` does not guard — that test checks the tel link, the payment URL, the hours rows and both address lines against `site-config.json`, but never touches MapEmbed. If the practice moves, the footer and contact maps silently keep pointing at the old building while every visible line of text is correct.

**Fix.** In `MapEmbed.svelte`, `import { ADDRESS } from "$lib/site"` and default the prop to `` `Beachfront Dentistry, ${ADDRESS.line1}, ${ADDRESS.line2}` ``. One line, removes the copy, and folds the map into the existing drift guard for free.

### 25. Grow the smoke manifest past the starter default of "/"

`tests/smoke/routes.ts#L38` · **medium impact** · **trivial**

**What's wrong.** `smokeRoutes` still contains the single inherited entry for `/` (lines 38-49), and the file's own header says "each site's figma-slices build grows the list as real routes land". tests/smoke/pages.spec.ts iterates that list asserting HTTP status, a hydration marker, and zero console errors — so the nine nav pages and the three detail templates (services/questions/team-members, ~75 documents behind them) have no status or hydration check in CI at all. A broken loader, a CSP violation, or a hydration crash on /services/<uid> ships green.

**Fix.** Add one `{ path, name, hydrationMarker: "footer" }` entry per real route: /your-first-visit, /our-team, /services, /ask-the-doctor, /contact-us, plus one stable uid per detail template. Keep `hydrationMarker: "footer"` (present on every page via +layout.svelte). Pure data edit to one array.

### 26. Mobile menu's 800px slide ignores prefers-reduced-motion

`src/lib/components/Nav.svelte#L4` · **medium impact** · **trivial**

**What's wrong.** Nav.svelte imports `fade` from `$lib/transitions` (line 7) but `fly` from `svelte/transition` (line 4). The `fly` is the one that matters: line 331 animates the shipped Beachfront full-screen menu with `transition:fly={{ y: -800, duration: 700, easing: quintOut }}` — the largest single movement on the site. Svelte's JS-driven transitions run on the Web Animations API and are not touched by the global CSS reset in src/app.css:490-498, which is precisely why src/lib/transitions.ts exists; its header comment (lines 13-17) states the rule outright: "Svelte's JS-driven transitions (Web Animations API) do NOT honor the CSS prefers-reduced-motion reset in app.css. … Components import fade/fly/slide from here instead of 'svelte/transition'." So a motion-sensitive user opening the menu gets a full-viewport panel sweeping 800px in 700ms. Every other motion surface in the codebase does honour the preference (animateIn.ts:74-80, floatAlong.ts:25, Slider.svelte:138-145, CountUp.svelte:74), which makes this the lone gap.

**Fix.** Change line 4 to drop `fly` from the `svelte/transition` import and add it to the existing `$lib/transitions` import on line 7: `import { fade, fly } from "$lib/transitions";`. The wrapper collapses duration and delay to 0 under reduced motion, so the menu still appears instantly — no markup or timing change for everyone else.

### 27. Modal close button is a 20×20 tap target

`src/lib/components/Modal.svelte#L56` · **medium impact** · **trivial** · 🎨 designer sign-off

**What's wrong.** The `✕` on the shared Modal is `<button type="button" class="absolute top-4 right-4 …">` with `<X size={20} />` inside and no padding or min-size, so its hit area is exactly 20×20 CSS px — under the 24×24 minimum of WCAG 2.2 SC 2.5.8 (AA), and well under the 44px the codebase applies everywhere else (Nav.svelte:98, 266, 304, 354 all use `min-h-11 min-w-11`; Slider's dots use `h-6 min-w-6` with the comment "24px hit target (WCAG 2.5.8)"). This is the close control on the appointment modal — the site's primary conversion surface — so it is the one dismiss affordance a visitor on a phone is most likely to need and most likely to miss.

**Fix.** Add `flex min-h-11 min-w-11 items-center justify-center` to the button's class on line 59 and shift the anchor to `top-2 right-2` so the enlarged box keeps the glyph at its current position. The icon itself stays `size={20}`, so nothing visible changes.

### 28. No Cache-Control on any /static asset — 11 MB revalidates on every visit

`netlify.toml` · **medium impact** · **trivial**

**What's wrong.** netlify.toml sets `public, max-age=31536000, immutable` only for /_app/immutable/* and /favicon.png. Everything shipped from static/ inherits Netlify's default `public, max-age=0, must-revalidate`: the 6.4 MB mp4 and 4.8 MB webm under /hero/, the 2.25 MB /menu-beach.jpg, /images/_.jpg (contact-hero 426 KB, cta-beach 419 KB, team-member-hero 224 KB, service-hero 168 KB), /beaches/_.jpg (932 KB), plus ~30 files under /icons/ and /annotations/. On a repeat visit or an internal navigation that remounts them, each one costs a conditional round-trip before the 304 comes back — on the icon set alone that is dozens of serialized RTTs.

**Fix.** Add [[headers]] blocks to netlify.toml for `/hero/*`, `/images/*`, `/icons/*`, `/beaches/*`, `/annotations/*` and `/menu-beach.jpg` with `Cache-Control = "public, max-age=31536000, immutable"` (these are content-stable assets; bump a filename if one ever changes), or a conservative `public, max-age=604800, stale-while-revalidate=86400` if you would rather not commit to immutable.

### 29. Reuse CTA_BEACH and the shared closing heading on /contact-us

`src/routes/contact-us/+page.svelte#L36` · **medium impact** · **trivial** · 🎨 designer sign-off

**What's wrong.** /contact-us re-declares the closing band's inputs by hand: `ctaBeach` (lines 36-43) is a byte-for-byte copy of `CTA_BEACH` in src/lib/cta-beach.ts, and `ctaHeading` (line 45) restates CtaBand's `DEFAULT_HEADING` string `"Ready for \ngreat dental \nhealth?"` (src/lib/components/CtaBand.svelte:31) — the exact literal CtaBand's comment says must live in exactly one place because the Prismic Migration API strips newlines. The three detail routes correctly `import { CTA_BEACH } from "$lib/cta-beach"` and pass no heading. So a copy or line-break change made in CtaBand silently leaves /contact-us on the old three-line string, and a beach-asset swap leaves it on the old file.

**Fix.** In src/routes/contact-us/+page.svelte, delete the local `ctaBeach` and `ctaHeading` consts, `import { CTA_BEACH } from "$lib/cta-beach"`, and render `<CtaBand backgroundImage={CTA_BEACH} caption="FIJI ISLANDS" />` — dropping the `heading` and `ctaLabel` props, since CtaBand's defaults are already "Book Appointment" + `#appointment`. Re-run the contact gate to confirm the rendered band is unchanged.

### 30. Ship a default OG image so social shares are not blank

`src/lib/seo.ts#L19` · **medium impact** · **trivial** · 🎨 designer sign-off

**What's wrong.** `DEFAULT_OG_IMAGE = ""`, so any page without a Prismic `meta_image` shares with no card. Confirmed in the built output: build/index.html, build/services.html and build/our-team.html emit no `og:image` and fall back to `<meta name="twitter:card" content="summary">` — the small text-only card. That covers the homepage and every top-level page, i.e. exactly the URLs a practice pastes into Facebook, a Google Business post, or a text message to a patient. The detail pages do get cards (build/services/dental-crowns.html carries a correct 1200x630 imgix-cropped og:image), which makes the gap on the main pages more conspicuous, not less. A suitable asset is already committed at static/hero/beachfront-hero-poster.jpg (160 KB).

**Fix.** Crop static/hero/beachfront-hero-poster.jpg (or the exterior/office shot) to exactly 1200x630, save it as static/og-default.jpg, and set `export const DEFAULT_OG_IMAGE = "/og-default.jpg";` at src/lib/seo.ts#L19. `resolveOgImage` already makes root-relative paths absolute against the page origin (#L109-111) and +layout.svelte#L60 already threads the constant through, so no other change is needed — `twitter:card` flips to `summary_large_image` automatically at Seo.svelte#L84. Consider adding a per-page `meta_image` later; the site-wide default is the 10-minute win.

### 31. Stop truncating detail-page meta descriptions mid-word

`src/routes/services/[slug]/+page.server.ts#L28` · **medium impact** · **trivial**

**What's wrong.** All 75 detail pages build their description with `asText(doc.data.body).slice(0, 155)` — a hard character cut with no word boundary and no ellipsis. The prerendered evidence: build/services/dental-crowns.html ships `content="Many people put off going to the dentist… This may be due to fear, or becau"` and build/team-members/dr-robert-quan.html ships `"…earning his degree in Bio"`. The same line is duplicated in three loaders — services/[slug]/+page.server.ts#L28, team-members/[slug]/+page.server.ts#L21, questions/[slug]/+page.server.ts#L20 — so it affects 24 service pages, 40 question pages and 11 team pages. A snippet that stops mid-word looks broken in a SERP and reads as a low-quality page.

**Fix.** Add one exported helper to src/lib/seo.ts, e.g. `export function metaExcerpt(text: string, max = 155): string { const t = text.trim().replace(/\s+/g, " "); if (t.length <= max) return t; const cut = t.slice(0, max - 1); return cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:.\-]$/, "") + "…"; }` and call it from all three loaders in place of the inline `.slice(0, 155)`. It is pure and already covered by the existing src/lib/seo.test.ts pattern, so add two cases there (short text passes through; long text ends on a word plus an ellipsis).

### 32. Warn editors that news_article `date` renumbers the whole Ask-the-Doctor catalog

`customtypes/news_article/index.json#L54` · **medium impact** · **trivial**

**What's wrong.** `src/lib/slices/QuestionList/index.svelte` L63-L75 sorts every `news_article` doc by `data.date` descending and assigns `canonicalNumber = index + 1` — "a question's 1-based position here is the number live prints on its card". Those numbers are printed on the cards on both the home teaser and /ask-the-doctor. So publishing one new question with today's date shifts the printed number of all 40 existing questions by one, and back-dating or correcting a single date reshuffles the catalog. The field's label in `customtypes/news_article/index.json` L54 is just `"date"` — nothing warns the editor, and unlike the sibling fields (`summary` L52 and `home_order` L47, both of which carry explanatory labels) this one has no hint at all.

**Fix.** Change L54's label to something self-documenting: `"Publish date — sets the question's printed number (newest question is #1, so a new date renumbers the whole list)"`. If stable numbering matters, the sturdier fix is to add an explicit `question_number` Number field and read it in `QuestionList/index.svelte` L72-L75, falling back to the date order when it is empty.

### 33. 404 page is unbranded starter chrome with no route back into the site

`src/routes/+error.svelte#L13` · **medium impact** · **small** · 🎨 designer sign-off

**What's wrong.** Every 404 on the site lands here: a bad /services/<slug> (thrown at src/routes/services/[slug]/+page.server.ts#L31, "Service not found"), a bad /questions/<slug>, a bad page uid (src/routes/[[preview=preview]]/[uid]/+page.server.ts#L38, "Page not found"). The page is an unstyled `<h1>404</h1>`, a 70%-opacity message, and a single underlined "Go home" link — no brand voice, no phone number, no links to Services / Our Team / Contact, and none of the type or colour system the rest of the site uses. For a local practice this is the page a visitor hits after clicking a stale link from Google or an old flyer, and the highest-value action (call the office) isn't offered. Secondary defect: this component sets `<title>` in svelte:head (#L6) while the layout's <Seo> already emits one (src/routes/+layout.svelte#L57), so error pages ship two <title> tags and the browser shows the layout's generic "Beachfront Dentistry", not the 404.

**Fix.** Rewrite +error.svelte using the site's own type (font-slab heading, #365b6d/#0e7799 palette), with friendly copy ("We couldn't find that page"), a tel: link to PHONE from $lib/site, a #appointment button, and links to /services, /our-team and /contact-us. Drop the local <title> and instead have the layout compose it, or keep the tag and remove the duplicate by passing a title through page data.

### 34. Add /contact-us to the sitemap and give it a meta description

`src/routes/sitemap.xml/+server.ts#L58` · **medium impact** · **small**

**What's wrong.** The contact page — the highest-intent local page on a dental site, carrying the NAP block, office hours and the map — is absent from the sitemap and has no description. build/sitemap.xml contains 80 `<url>` entries and `grep -o "contact[^<]*" build/sitemap.xml` returns nothing. The cause is that the entry list at sitemap.xml/+server.ts#L58 is built purely from Prismic `page` docs plus the three entity types in ENTITY_ROUTE_PREFIX; /contact-us is a hand-built filesystem route (`prerender = false`, src/routes/contact-us/+page.server.ts#L8) so it can never appear. Its loader (#L12-15) also returns only `{ formTs, title: "Contact" }`, so the page ships the title "Beachfront Dentistry | Contact" with no meta description, no og:description and no og:image.

**Fix.** In sitemap.xml/+server.ts, add a `STATIC_ROUTES = ["/contact-us"]` constant and append `...STATIC_ROUTES.map((path) => ({ path, lastmod: new Date().toISOString() }))` to `entries` at #L58 (guarded the same way as the frozen/placeholder branches). Then in contact-us/+page.server.ts#L12-15 return `meta_title: "Contact Beachfront Dentistry | Redondo Beach, CA"` and `meta_description: "Visit Beachfront Dentistry at 1706 S Elena Ave, Redondo Beach, CA 90277. Open Mon-Thu 7am-5pm, Fri 7am-2pm. Call (310) 378-9241."` — both flow straight through +layout.svelte#L58-59 with no component change. src/routes/sitemap.xml/server.test.ts already exists, so add an assertion that the contact URL is present.

### 35. Add BreadcrumbList structured data to the 75 detail pages

`src/routes/services/[slug]/+page.svelte#L53` · **medium impact** · **small**

**What's wrong.** Detail pages already display a breadcrumb visually — DetailHero renders `Services / Cosmetic Dentistry` (src/routes/services/[slug]/+page.svelte#L41-43, passed as `label`) — but it is emitted as a plain `<p>` (src/lib/components/DetailHero.svelte#L78-83) with no links and no BreadcrumbList JSON-LD. Combined with the total absence of structured data (0 `ld+json` matches in the build), the 24 service pages, 40 question pages and 11 team pages all show a bare URL in search results instead of a `beachfrontdentistry.com > Services > Cosmetic Dentistry` trail. The route prefixes are already centralised in src/lib/blux-catalog/entity-routes.ts, and each loader already resolves the parent label (`category` at services/[slug]/+page.server.ts#L26, `role` at team-members/[slug]/+page.server.ts#L20).

**Fix.** Once the `jsonLd` prop is wired on `<Seo>` (see the LocalBusiness finding), have the three detail loaders also return a `breadcrumbs: [{name,url}]` array — e.g. Home -> Services -> <title> — and have +layout.svelte build a BreadcrumbList node from `page.data.breadcrumbs` when present, passing it alongside the site-wide business node as the array `jsonLd` already accepts (src/lib/components/Seo.svelte#L50-52). Build the intermediate hrefs from ENTITY_ROUTE_PREFIX so they cannot drift from the real routes. No visual change; the on-page crumb stays exactly as it is.

### 36. Apply the "dark pills do not fade on hover" decision to the remaining dark pills

`src/lib/components/OutlineButton.svelte#L46` · **medium impact** · **small** · 🎨 designer sign-off

**What's wrong.** matching/spec/beachfront.css:6042-6044 gives `.button:hover { opacity:.6; background-color:#129ecc4a }`, and matching/LEDGER.md's Phase-5 round-2 entry records that live's `.button.text-color-primary-dark` pills do NOT fade (an IX2 inline `opacity:1` beats the rule) — "the background transition stays". That fix landed in CtaBand.svelte:96 and Footer.svelte:144 (bg only, no `hover:opacity-60`) but not in the other teal #365b6d pills, which are still copy-pasted class strings: src/routes/contact-us/+page.svelte:67 and src/lib/slices/SectionGrid/index.svelte:345 both keep `hover:opacity-60` (SectionGrid's comment even claims "live hover"), and OutlineButton.svelte:46 has `transition-opacity hover:opacity-60` with no background fill at all — so its teal "Back to All Services" and cyan "Back to Team"/"Have another question?" pills fade where live fills. Three different hover behaviours for one visual button, across pages a designer will click through side by side.

**Fix.** Make the teal/dark pills match CtaBand: replace `transition-[opacity,background-color] hover:bg-[#129ecc4a] hover:opacity-60` with `transition-[background-color] hover:bg-[#129ecc4a]` at contact-us/+page.svelte:67 and SectionGrid/index.svelte:345. In OutlineButton.svelte:46 swap `transition-opacity hover:opacity-60` for `transition-[background-color] hover:bg-[#129ecc4a]` on the teal variant and `transition-[opacity,background-color] hover:bg-[#129ecc4a] hover:opacity-60` on the cyan one (live's base `.button:hover`). Re-run matching/states.mjs on the affected pages.

### 37. Four shipped copy defects a designer will read as bugs

`src/lib/beachfront-pages.js#L486` · **medium impact** · **small** · 🎨 designer sign-off

**What's wrong.** The seeded content carries reference typos and one broken truncation verbatim: (1) #L486 "your dental helath goals and is completed before appointment" — misspelling plus a missing article; (2) #L506 "We are do our best to make you comfortable"; (3) #L392 "Here some ways to give you a clear idea of what to expect" (missing "are"), which is the first sentence a visitor reads on /your-first-visit; (4) #L117 a homepage review quote that ends mid-word with no ellipsis — "…I actually like going to get my checkups and cleani" — while all four sibling quotes end with a proper "...". Items 1-3 sit in the numbered first-exam steps, the most-read copy on that page. The project has already established that correcting reference typos is in scope — #L395-398 ships "Book an Appointment" where live has "Apointment" at Tucker's request — so these are the same call, just not yet made.

**Fix.** Fix in place and re-seed: "dental health goals and it is completed before the appointment"; "We do our best to make you comfortable"; "Here are some ways"; and either complete the Tonya S. quote from Yelp or truncate it at a word boundary with "..." to match the other four cards.

### 38. Give /contact-us a no-JS path to the appointment form

`src/routes/contact-us/+page.svelte#L13` · **medium impact** · **small**

**What's wrong.** +layout.svelte:120-123 documents the invariant "no-JS clicks land harmlessly at the document end — /contact-us covers no-JS users", but /contact-us no longer has a form: its own comment (lines 12-15) says "There is NO body form", and contact-us/page.test.ts:41 asserts `container.querySelector("form")` is null. With JS off or broken, the #appointment anchors jump to an empty `<div id="appointment">`, the modal never mounts its form, and there is no submit path anywhere on the site — only the tel: link. The route's server action still exists and works; nothing reaches it. The layout comment now asserts something false, which is how the gap survived review.

**Fix.** Add a `<noscript>` block on /contact-us containing the same four fields as AppointmentModal (name/email/phone/message plus the `ts` and `bot-field` inputs) posting to the route's existing default action — invisible to JS visitors and to the pixel gate, so the live match is unaffected. Then correct the +layout.svelte comment to name what actually covers no-JS. Extract the field set into a snippet or small component so the modal and the noscript form cannot drift.

### 39. Make seed-pages.mjs use the shared migration lib instead of its own stale copy

`scripts/seed-pages.mjs#L150` · **medium impact** · **small**

**What's wrong.** scripts/lib/prismic-migration.mjs exists as the shared mechanism, and seed-entity-content.mjs imports it — but seed-pages.mjs re-implements the same primitives inline: REPO (line 28), THROTTLE_MS (41), fetchWithRetry (46), expectOk (54), stripEmpty (65), listExistingAssets (86), and the POST-then-PUT staging loop (lines 192-230, duplicating `stageDocument`). The copies have already drifted in a way that will break: `lookupPageIds()` (line 150) queries `/documents/search?ref=…&pageSize=100` with NO type filter and NO pagination, then keeps only `d.type === "page"` — whereas the lib's `masterDocs(type)` filters by type and pages through `total_pages`. The repo already holds ~80 documents (seed-entity-content.mjs's header: 11 person + 40 news_article + 24 collection_item, plus the 5 pages), so roughly twenty more entity documents will push a `page` stub off result page 1 and the seed dies with "update <uid>: no master id (publish stub first?)" — a confusing failure whose real cause is missing pagination.

**Fix.** Import `fetchWithRetry, expectOk, stripEmpty, sleep, throttleMs, headersFor, masterDocs, stageDocument, repo` from ./lib/prismic-migration.mjs and delete the local duplicates (lines 28-83 plus the inline staging block). Replace `lookupPageIds()` with `new Map((await masterDocs("page")).map((d) => [d.uid, d.id]))`, which is type-filtered and paginated, and route the per-page write through `stageDocument`. The asset-upload helpers are the remaining genuine difference — either keep them local or lift `listExistingAssets` into the lib, since seed-entity-content.mjs has its own near-identical copy.

### 40. Seed alt text with the page images — every CMS image currently uploads with an empty alt

`scripts/seed-pages.mjs#L127` · **medium impact** · **small**

**What's wrong.** `scripts/seed-pages.mjs` L122-L134 uploads every page image to the Prismic asset library with only `form.append("file", blob, filename)` — no alt. Compare `scripts/seed-entity-content.mjs` L125, which does `form.append("alt", caption)` for the beach photos, so the pattern is already established and just was not applied here. The consequence: the Comfort / Comprehensive / Caring cards, both doctor headshots, the five reviewer photos, all eight office-tour slides and every hero background land in Prismic with a blank alt, and each component renders `<PrismicImage fallbackAlt="">` (e.g. `src/lib/slices/SectionGrid/index.svelte` L459, L519; `src/lib/slices/CollectionList/index.svelte` L146, L206), which resolves to `alt=""`. Meaningful photographs are announced to screen readers as decorative, and an editor gets no prompt in the media library to fix it.

**Fix.** Add an `ALT` map to `src/lib/beachfront-pages.js` keyed by the same `IMG` keys (e.g. `comfort: "A patient relaxing in a Beachfront Dentistry treatment chair"`, `quan: "Dr. Robert Quan"`, `tour1: "The Beachfront Dentistry reception area"`), then in `scripts/seed-pages.mjs` L127 add `form.append("alt", ALT[key] ?? "")` alongside the file. Re-running the script reuses existing assets by filename (L116-L120), so also patch the existing uploads once via the Asset API, or edit the ~20 alts by hand in the Prismic media library.

### 41. Stop turning every Prismic failure into a 404 in the detail loaders

`src/routes/services/[slug]/+page.server.ts#L31` · **medium impact** · **small**

**What's wrong.** All four Prismic-backed loaders wrap the whole fetch in `try { … } catch { error(404, …) }` — services/[slug]:31-33, questions/[slug]:23-25, team-members/[slug]:24-26, and both [[preview=preview]] routes (+page.server.ts:32-34, [uid]/+page.server.ts:38-40). The bare catch cannot tell "this uid does not exist" from a DNS failure, a Prismic 5xx, an aborted fetch, or a TypeError thrown inside `pageMeta`/`splitLede` on a malformed document. Any of those is reported to the visitor and to crawlers as a hard 404 "Service not found". These routes are prerendered for known uids, but they still run live for a document published between builds and for every Prismic preview session — the exact moments an editor is watching — and a transient outage there both misleads the editor and is the wrong status for a search engine to cache.

**Fix.** Narrow the catch: `catch (err) { if (err instanceof prismic.NotFoundError || (err as { name?: string })?.name === "NotFoundError") error(404, …); throw err; }` (an unhandled throw becomes a 500, which +error.svelte already renders and which crawlers treat as retry-later). Do it once in a small shared helper — the three detail loaders are otherwise the same six lines — and add a case to src/routes/services/slug-load.test.ts asserting a non-NotFound rejection does not produce a 404.

### 42. Unit-test the two pieces of detail-template logic that silently change layout

`src/lib/components/DetailParagraph.svelte#L18` · **medium impact** · **small**

**What's wrong.** DetailParagraph's `isSubheading` (lines 18-26) decides, from raw Prismic span offsets (`Math.min(...strong.map(s => s.start)) <= 0 && Math.max(...strong.map(s => s.end)) >= node.text.length`), whether a paragraph is a body sub-heading — which drives the 28/38px-plus-ladder gap above it on every service and question page. There is no DetailParagraph.test.ts (nor DetailBody/DetailHero/DetailIntro/CtaBand tests). The adjacent CtaBand fallback `heading?.length ? heading : DEFAULT_HEADING` (CtaBand.svelte:71) has already regressed once in production — its comment records the seeded pages rendering a headless band because Prismic returns `[]`, not `undefined`, for an empty rich text — and it is still untested. Both are pure, cheap to test, and their failure mode is silent: nothing errors, the page just lays out wrong on ~75 detail pages.

**Fix.** Add src/lib/components/DetailParagraph.test.ts with four cases: fully-bold paragraph → `detail-subheading`; paragraph merely ending in a bold run → no class; multiple bold spans covering the whole text → subheading; no spans → no class. Add src/lib/components/CtaBand.test.ts asserting the three-line default heading renders for `heading={[]}`, for an omitted prop, and that a supplied heading wins.

### 43. Static detail-page heroes ship one fixed-size JPEG with no srcset

`src/routes/contact-us/+page.svelte#L24` · **medium impact** · **medium**

**What's wrong.** Four hero images are hand-built ImageFields pointing at /static paths: contact-hero.jpg (1200x1600, 426 KB), cta-beach.jpg (1600x1200, 419 KB), team-member-hero.jpg (1600x1067, 224 KB), service-hero.jpg (1600x1067, 168 KB). HeroBackgroundImage feeds them through `imgix()`/`srcset()` from $lib/utils/image, but both functions early-return for non-Prismic hosts (isPrismicImageUrl checks hostname === images.prismic.io), so these render with `srcset` omitted — confirmed in build/team-members/dr-robert-quan.html, where the preloaded fetchpriority=high hero is a bare `/images/team-member-hero.jpg` with `sizes` but no srcset. 75 of the 86 prerendered pages reference at least one of these, so a 390px phone downloads a 1600px JPEG as its LCP element, and /contact-us downloads 426 KB of it.

**Fix.** Generate 2-3 widths plus WebP/AVIF for each of the four files with the already-installed `sharp` (e.g. contact-hero-{640,1024,1600}.{webp,jpg}), then either add a `srcsetOverride`/`sizes` prop to HeroBackgroundImage for local assets or import them through the vite-imagetools pipeline that is already wired up in vite.config.ts (@zerodevx/svelte-img + the existing Img.svelte wrapper). Even without srcset, re-encoding contact-hero.jpg and cta-beach.jpg to WebP at their current dimensions cuts them roughly in half.

### 44. The appointment CTA is called four different things, and the trigger doesn't match the modal

`src/lib/components/AppointmentModal.svelte#L38` · **low impact** · **trivial** · 🎨 designer sign-off

**What's wrong.** Every one of these opens the same modal: "Make Appointment" (src/lib/beachfront-pages.js#L230, home hero), "Book an Appointment" (#L298 home steps band, #L398 first-visit TOC, src/lib/components/Nav.svelte#L396 mobile menu), "Book Appointment" (CtaBand.svelte#L58 default, src/routes/contact-us/+page.svelte#L69), and "Request Appointment" (Nav.svelte#L248). Some of that spread is live's own inconsistency, but two parts are ours and are the ones that hurt: the mobile menu button says "Book an Appointment" and the modal it opens is titled "Request an appointment" with a submit button reading "Request Appointment" — the visitor is handed a different verb the moment the dialog opens, which reads as a different action. Separately, the Nav's desktop phone/CTA cluster (#L235-256, including that "Request Appointment" pill) is dead code on this site: the layout passes `hamburgerOnly`, so #L236-238 renders it `hidden` at every width.

**Fix.** Pick one verb — "Book" is used most and is what the CTA band and contact page already say — and align the modal: heading "Book an appointment", submit button "Book Appointment". Then normalise the home hero (#L230) and re-seed. Optionally delete the unreachable desktop CTA cluster in Nav.svelte#L235-256 for this site so nobody edits a label that never ships.

---

## For the designers

Items above that need a design decision rather than just implementation:

- **Adobe Fonts kit ships font-display:auto — display type is invisible for up to 3s** — `src/app.html` (high/trivial)
- **Fix the hardcoded footer boilerplate row: stale ©2023 and dead "Privacy Policy" / "Sitemap" labels** — `src/routes/+layout.svelte` (high/trivial)
- **Remove (or make dismissible) the landscape blocker that locks out every touch device** — `src/routes/+layout.svelte` (high/trivial)
- **Two link types delete their focus outline with no replacement ring** — `src/lib/slices/CollectionList/index.svelte` (high/trivial)
- **Point the axe and Lighthouse runs at real pages, not dev fixtures** — `tests/a11y/fixtures.spec.ts` (high/small)
- **Raise the /services category-card link labels above the 7px / 19px floor** — `src/lib/slices/ServiceCategoryBand/index.svelte` (high/small)
- **Re-encode the hero video: 6.4 MB for a 15-second 720p loop** — `src/lib/slices/Hero/index.svelte` (high/small)
- **The appointment modal never shows an error and loses focus on success** — `src/lib/components/AppointmentModal.svelte` (high/small)
- **Two patient-facing paperwork CTAs are dead links (href="#")** — `src/lib/beachfront-pages.js` (high/small)
- **"Anything we should know?" is a one-line text input** — `src/lib/components/AppointmentModal.svelte` (medium/trivial)
- **Modal close button is a 20×20 tap target** — `src/lib/components/Modal.svelte` (medium/trivial)
- **Reuse CTA_BEACH and the shared closing heading on /contact-us** — `src/routes/contact-us/+page.svelte` (medium/trivial)
- **Ship a default OG image so social shares are not blank** — `src/lib/seo.ts` (medium/trivial)
- **404 page is unbranded starter chrome with no route back into the site** — `src/routes/+error.svelte` (medium/small)
- **Apply the "dark pills do not fade on hover" decision to the remaining dark pills** — `src/lib/components/OutlineButton.svelte` (medium/small)
- **Four shipped copy defects a designer will read as bugs** — `src/lib/beachfront-pages.js` (medium/small)
- **The appointment CTA is called four different things, and the trigger doesn't match the modal** — `src/lib/components/AppointmentModal.svelte` (low/trivial)

### Divergences from the live site that are already decided

These are deliberate and recorded in `matching/LEDGER.md`. Flagging them so nobody
re-opens a settled question during review — but each is still reversible if design
disagrees:

- **Brand cyan is darkened for small text.** Live uses `#129ecc`, which is 3.09:1 on
  the pale canvas — AA-safe for large text only. Headings at 24px and above keep
  live's exact cyan; below that they ship `#0e7799`. Colour is the only difference.
- **A 16px legibility floor.** A few labels live sets at 10–13px are raised to 16px.
- **Spelling corrected.** Live's "Book an Apointment" ships as "Appointment".
- **Dead buttons made live.** Live's service and team detail templates ship two
  non-functional "Book Appointment" buttons; ours work.
- **The closing CTA heading is component-owned**, not per-page editable, because the
  Prismic Migration API strips the hard line breaks that band depends on.

---

## Method, and what this did not cover

Six parallel audits — accessibility, SEO & metadata, performance, UX & content,
code health, and editor experience — each followed by an independent skeptic that
re-opened every cited file. 11 findings were merged as duplicates where two
auditors independently found the same issue; those are marked inline, and the
agreement is a good signal of severity.

Deliberately out of scope: the `/dev/match/*` gate surfaces and `matching/`
tooling (internal, not shipped), `docs/superpowers/` (planning records), and any
change larger than a few hours. The pixel-matching backlog is tracked separately in
`matching/LEDGER.md` and `matching/SPEC.md` and is not repeated here.

Not audited: anything requiring a running production environment — real Lighthouse
numbers, Core Web Vitals field data, analytics, or form deliverability end-to-end.
