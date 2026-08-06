## svc — Service detail (`/services/dental-exams`)

Page: `/services/dental-exams` ·
Live: <https://www.beachfrontdentistry.com/services/dental-exams>
Local HTML: `matching/spec/detail-svc.html` (Webflow-published source; the entire
`<body>` markup is the single minified line `detail-svc.html:113`, continuing at
`detail-svc.html:117` after the footer wave `<svg>` at `:114-116`).

**Governing rule (CLAUDE.md #1): source prescribes, rects only verify.** Every
geometry/type value below carries a `beachfront.css:<line>` or
`detail-svc.html:<line>` citation. Values that exist only as computed output
(Webflow IX2 inline styles, margin-collapse results, `vw`/`%` resolution,
shrink-to-fit text reflow) are tagged `[probed-only]` / `[probed]` and are the
only numbers here without a line.

Shared nav / closing-CTA / footer are **not** re-specced here — see
`matching/spec-sections/_chrome.md` §1 (root-font ladder), §2 (`.content-width`),
§3 (nav), §4 (CTA band), §5 (footer), §6 (button pattern), §7 (hover census).

Probe: Playwright chromium, 9 widths (1440 / 992 / 991 / 834 / 768 / 767 / 480 /
479 / 390), `p.on("dialog", d => d.dismiss())` registered (the portrait `alert()`
at `detail-svc.html:138-140`), scrolled in 250px steps @80ms then held until
`document.getAnimations().every(a => a.playState !== "running")` plus a 800–900ms
settle. **Two elements on this page reveal with a 2000ms outExpo** (§D) — an
unsettled read has their y **160px too low** at 1440 and their opacity between
0 and 1. Raw output: `/tmp/bf-svc-probe.json`, `/tmp/bf-svc-probe2.json`,
`/tmp/bf-svc-ix2.json`, `/tmp/bf-svc-wids.json`,
`/tmp/bf-svc-interactions.json`.

---

### A. SECTION CENSUS

y values are the **section/block border-box top** at 1440 (page coords, settled).

| #   | label                                                                            | anchor (unique, comma-free)                     | y@1440                      | owner          |
| --- | -------------------------------------------------------------------------------- | ----------------------------------------------- | --------------------------- | -------------- |
| 1   | Header / nav bar — `section.header`                                              | _(no unique text — anchor by `section.header`)_ | 0 (h=120, **out of flow**)  | **chrome §3**  |
| 2   | Hero band — `section.hero.reception` + absolute breadcrumb                       | `General Dentistry`                             | 0 (h=475.19; label @347.67) | this file §B.2 |
| 3   | Page title — `h2` inside `section.service-page-title-subtitle-section`           | _(prefer selector — see caveat)_                | 495.19 (h=168)              | this file §B.3 |
| 4   | Lede two-column block — `.display-flex` > empty `.col-1-of-3` + `.col-2-of-3`    | `Few people place a visit`                      | 673.19 (h=555)              | this file §B.4 |
| 5   | Body rich text — `.content-width.mt-6 > ._w-80pc.w-richtext`                     | `What to expect`                                | 1288.19 (h=900)             | this file §B.5 |
| 6   | Back-link pill row — `.content-width.flex-align-center.flex-justify-center.my-8` | `Back to All Services`                          | 2268.19 (h=66)              | this file §B.6 |
| 7   | Closing CTA band                                                                 | `Ready for great`                               | 2414.19                     | **chrome §4**  |
| 8   | Footer — `.footer-info-section`                                                  | `Want to learn more`                            | 3614.19 (h=714.41)          | **chrome §5**  |

**CENSUS SECTION COUNT: 8** (5 unique to this page: 2, 3, 4, 5, 6 — where 3+4
share one `<section>` element and 5+6 share another; 3 are chrome).

Only **five** `<section>` elements exist in the document
(`detail-svc.html:113`): `.header`, `.hero.reception`,
`.service-page-title-subtitle-section`, `.service-page-body-section`, `.footer`.
Census rows 3/4 and 5/6 are _sub-blocks_, not sections — see the dilution table.

**Title anchor caveat.** `Dental Exams` is the `h2` text but it is **not safe as
a text anchor**: the same string appears in `<title>Beachfront Dentistry | Dental
Exams</title>` and, case-insensitively, **six** times in the body copy
(`Why are dental exams important?`, `Dental exams are the best way…`,
`Regular dental exams are crucial…`). Anchor census row 3 by selector
(`section.service-page-title-subtitle-section > .content-width > h2`).
`Services` is likewise **not unique** — 4 occurrences (nav panel `h3.modal-link`,
hero breadcrumb, `/services` back-link, footer `.footer-links`).
`General Dentistry` **is** unique (1 occurrence, the hero breadcrumb) and is the
correct hero anchor. Note the source string carries a **trailing space**:
`General Dentistry ` (`detail-svc.html:113`).

Section-element y/h at the gate matrix `[probed]`:

| section                                          | 1440                 | 834                  | 390                  |
| ------------------------------------------------ | -------------------- | -------------------- | -------------------- |
| `.header` (absolute, `beachfront.css:5836-5842`) | y 0 h 120            | y 0 h 96             | y 0 h 72             |
| `.hero.reception`                                | y 0 h **475.19**     | y 0 h **500.39**     | y 0 h **273**        |
| `.service-page-title-subtitle-section`           | y 495.19 h **733**   | y 520.39 h **510**   | y 293 h **700**      |
| `.service-page-body-section`                     | y 1288.19 h **1046** | y 1078.39 h **1066** | y 1029 h **1034.38** |
| `.footer` (CTA + footer)                         | y 2414.19 h 1914.41  | y 2208.39 h 1811.02  | y 2111.38 h 1562.59  |
| `.footer-info-section`                           | y 3614.19 h 714.41   | y 3037 h 982.41      | y 2549.38 h 1124.59  |
| document height                                  | 4329                 | 4019                 | 3674                 |

Full nine-width section table (the trap bands are **992** and **768**):

| width               | 992                | 991           | 768           | 767            | 480         | 479            |
| ------------------- | ------------------ | ------------- | ------------- | -------------- | ----------- | -------------- |
| root font           | **32px**           | 32px          | **24px**      | 24px           | 24px        | 24px           |
| `.hero.reception` h | **327.36**         | **594.59**    | 460.8         | 536.89         | 336         | 335.3          |
| title section y/h   | 347.36 / **1126**  | 614.59 / 450  | 480.8 / 540   | 556.89 / 420   | 356 / 710   | 355.3 / 540    |
| body section y/h    | 1521.36 / **1330** | 1112.59 / 946 | 1056.8 / 1122 | 1012.89 / 1049 | 1102 / 1481 | 931.3 / 890.38 |
| document height     | **4679**           | 3918          | 3840          | 3963           | 4312        | 3486           |

At **992** the page is 4679px tall; at **991** it is 3918px — a **761px** swing
across one pixel of viewport. Nothing keyed at 768 can produce that.

#### Gate-region ↔ census mapping (where defects hide)

The gate cuts this page at four anchors: `What to expect` /
`Back to All Services` / `Ready for great` / `Want to learn more`. That yields
five regions against eight census sections:

| gate region                                   | census sections it contains                              | span@1440                              | dilution risk                                                                                                                                                                                                                                        |
| --------------------------------------------- | -------------------------------------------------------- | -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R0 top → `What to expect`                     | **1 header + 2 hero + 3 title + 4 lede** (four sections) | 0 → 1288 (1288px, **30% of the page**) | **CRITICAL.** The hero breadcrumb (80px) is **6%** of R0; the `h2` title (168px) is **13%**; the empty `.col-1-of-3` spacer is 0%. All three sit under the 0.10 threshold _even if 100% wrong_. Only the lede block (555px = 43%) can trip it alone. |
| R1 `What to expect` → `Back to All Services`  | **5 body rich text**                                     | 1288 → 2268 (980px)                    | LOW — one block owns the region. But its height is **text-reflow-driven**: a wrong container width changes line counts and shifts everything below (see E1).                                                                                         |
| R2 `Back to All Services` → `Ready for great` | **6 back-link pill row**                                 | 2268 → 2414 (146px)                    | LOW — smallest region on the page, so the pill's 66px box is 45% of it. Good sensitivity. Note it also swallows the pill's collapsed trailing `2rem`.                                                                                                |
| R3 `Ready for great` → `Want to learn more`   | 7 CTA band                                               | 2414 → 3634                            | chrome §4                                                                                                                                                                                                                                            |
| R4 `Want to learn more` → end                 | 8 footer                                                 | 3634 → 4329                            | chrome §5                                                                                                                                                                                                                                            |

**Two anchors that would split R0 and de-dilute it** — both unique and
comma-free, both verified against the settled DOM:
`General Dentistry` (hero breadcrumb, y@1440 = 347.67) and
`Few people place a visit` (lede, y@1440 = 693.19). Adding them turns R0's four
sections into three regions of 348 / 345 / 595px.

**All four inter-block gaps on this page are COLLAPSED MARGINS, not padding**
(§B.7). Every `<section>` on this page has `margin: 0; padding: 0` computed
`[probed, all 9 widths]`. Expressing any of these gaps as section `padding` moves
the space from "between gate regions" into the region below it _and_ stops it
collapsing, doubling several of them.

---

### B. PER-SECTION SPEC

#### B.0 Page-level facts

**Root-font ladder** (the systemic trap — chrome §1). This page ships the same
inline `<style>` twice: `detail-svc.html:1-19` (head) and `detail-svc.html:61-75`
(a `.w-embed` at the top of `<body>`, byte-identical for the font rules).

| rule                                                     | source                                                       |
| -------------------------------------------------------- | ------------------------------------------------------------ |
| `html { font-size: 40px }`                               | `detail-svc.html:3-5` (repeat `:62`)                         |
| `@media (max-width: 992px) { html { font-size: 32px } }` | `detail-svc.html:8-10` (repeat `:64-66`)                     |
| `@media (max-width: 768px) { html { font-size: 24px } }` | `detail-svc.html:12-14` (repeat `:68-70`)                    |
| `@media (max-width: 480px) { html { font-size: 24px } }` | `detail-svc.html:16-18` (repeat `:72-74`) — no-op, same 24px |

Webflow class breakpoints: `beachfront.css:7852` (≤991), `:8372` (≤767),
`:9011` (≤479), plus a page-irrelevant ≤991 grid block at `:9611`.
**Offset by 1px → every rem resolves to THREE pixel values.** Root font
`[probed]`: 1440→40px · 992→**32px** · 991→32px · 834→32px · 768→**24px** ·
767→24px · 480→24px · 479→24px · 390→24px.

**Every rem on this page, resolved** (this is the whole spec in one table):

| declared                                      | source                     | ≥993 (root 40)  | 992–769 (root 32) | ≤768 (root 24)                                   |
| --------------------------------------------- | -------------------------- | --------------- | ----------------- | ------------------------------------------------ |
| `.mx-1` `.25rem` (breadcrumb `/`)             | `beachfront.css:3854-3857` | **10px**        | **8px**           | **6px**                                          |
| `.mt-6` `1.5rem` (body wrapper top)           | `beachfront.css:3917-3919` | **60px**        | **48px**          | **36px**                                         |
| `.my-8` `2rem` (pill row top+bottom)          | `beachfront.css:3839-3842` | **80px**        | **64px**          | **48px**                                         |
| `.content-width` pad-x `1.5rem`               | `beachfront.css:5864-5865` | **60px**        | **48px**          | **36px** (then 8% ≤767 `:8627`, 5% ≤479 `:9164`) |
| `.bot-wave svg` height `3rem`                 | `detail-svc.html:24-29`    | **120px**       | **96px**          | **72px**                                         |
| `.header` height `3rem`                       | `beachfront.css:5839`      | **120px**       | **96px**          | **72px**                                         |
| `.display-flex` font-size `.6rem` (≤991 only) | `beachfront.css:7890-7892` | _(not applied)_ | **19.2px**        | **14.4px**                                       |
| IX2 `a-7` travel `4rem`                       | `[probed-only]`, §D        | **160px**       | **128px**         | **96px**                                         |

All confirmed `[probed]` at all 9 widths.

CSS variables `beachfront.css:2047-2054`:
`--primary #129ecc` · `--primary-dark #365b6d` · `--primary-light #e7f5fa` ·
`--secondary #b6aa91` · `--secondary-dark #2b2a29` · `--secondary-light #cecece`.

Body default `beachfront.css:2096-2102`: `color:#333; font-family: museo-sans,
sans-serif; font-size:64px; font-weight:300; line-height:1.2em`. Fonts are
Typekit (`use.typekit.net/tao4byj.js`, `detail-svc.html:1`) — `museo-slab` +
`museo-sans`; Google Fonts (Lato, Montserrat) load but nothing on this page uses
them.

**Two class names used on this page have NO rule anywhere.** Grepped
`beachfront.css` (0 hits) and both inline `<style>` blocks:
`.service-page-title-subtitle-section` and `.service-page-body-section`. They are
bare block `<section>` elements — zero padding, zero margin, zero background,
`position: static` `[probed]`. **All of their box geometry is the collapsed
margins of their children.** This is the single most important structural fact
for the gate cut on this page (§B.7).

**Page-local CSS that is NOT in `beachfront.css`** — `detail-svc.html:77-111`
(`.filter-to-primary-dark`, `.click-through`, `.expanding-minus`,
`.expanding-box` + its own 991/480 ladder, `.ellipsis-three-lines`). Of these
only `.expanding-minus` (`detail-svc.html:84-86`) touches this page — it
positions the CTA band's minus glyph (chrome §4.4). The rest is site-wide
boilerplate with no matching element here.

**No `.form-modal` on this page.** `[probed]`
`document.querySelector(".form-modal") === null` on the settled live DOM at 1440,
and the string is absent from `detail-svc.html`. This is a **real structural
difference from the nav pages**, not a capture artifact (chrome §0 records the
opposite for the index pages — treat that note as index-page-scoped). Consequence:
the two `.show-form` buttons that _do_ exist (nav panel "Book an Appointment",
CTA "Book Appointment") run `showForm` at `detail-svc.html:126-129` against an
empty jQuery set — **clicking them is a visible no-op on this page**. Do not
render a form modal here.

---

#### B.1 Header / nav — see chrome §3

Byte-identical markup on `detail-svc.html:113`. `data-w-id`s on this page are
`d74a87ea-f9c1-d0eb-6fb6-c8992fcf73c0` (open) / `8dfa6638-f698-fdd7-603c-6f04af7990e4`
(close) / `6eca16bd-bda4-9c3f-5c28-ccf469c0bdbe` (panel Book button) — same GUIDs
as the home page. `.header` is `position: absolute; top: 0`
(`beachfront.css:5836-5842`), so it is **out of flow** and overlays the hero:
header y=0 h=120 and hero y=0 h=475.19 simultaneously `[probed]`. The hero owns
the first 475px of document flow, not 120+475.

The nav link with `aria-current="page"` / `w--current` on this page is
**`/services`** (`Services`), not a service-specific link.

---

#### B.2 Hero band — `section.hero.reception`

Markup (`detail-svc.html:113`):

```
<section class="hero reception">
  <img class="hero-dynamic-image" src="…running-into-our-golden-years.jpg"
       loading="lazy" sizes="100vw" srcset="…-p-500 500w, …-p-800 800w,
       …-p-1080 1080w, …-p-1600 1600w, … 1800w">
  <div class="bot-wave"></div>            <!-- svg injected at :123 -->
  <div class="hero-top-gradient"></div>
  <div class="hero-bot-gradient"></div>
  <div class="content-width">
    <div class="service-label-container">
      <h3 class="service-page-label">Services</h3>
      <h3 class="service-page-label mx-1">/</h3>
      <h3 class="service-page-label">General Dentistry </h3>
    </div>
  </div>
</section>
```

Child order `[probed]`: `IMG.hero-dynamic-image` → `DIV.bot-wave` →
`DIV.hero-top-gradient` → `DIV.hero-bot-gradient` → `DIV.content-width`.

##### Box + the height ladder

`.hero` `beachfront.css:5295-5300`: `align-items:center; height:33vw;
display:block; position:relative` (`align-items` is inert under `display:block`).
`.hero.reception` `beachfront.css:5310-5314`: `background-image:url(…DSC_7625.jpg);
background-position:100%; background-size:cover`.

Height overrides — a **pure-vw ladder** (root-font-independent) with only THREE
rules, and **critically `.hero.reception` has NO ≤479 rule**:

| rule | source                                                                                                                                                 | height       |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------ |
| base | `beachfront.css:5297`                                                                                                                                  | `33vw`       |
| ≤991 | `beachfront.css:7980-7982` (`.hero, .hero.redondo`)                                                                                                    | `60vw`       |
| ≤767 | `beachfront.css:8438-8440` (`.hero`)                                                                                                                   | `70vw`       |
| ≤479 | **none matches `.hero.reception`** — `beachfront.css:9072/9078/9082/9088/9093` name only `.redondo`/`.contact`/`.group-photo`/`.home`/`.ask-a-dentist` | still `70vw` |

| viewport              | 1440       | 992        | 991        | 834        | 768       | 767        | 480     | 479       | 390      |
| --------------------- | ---------- | ---------- | ---------- | ---------- | --------- | ---------- | ------- | --------- | -------- |
| declared              | 33vw       | 33vw       | 60vw       | 60vw       | 60vw      | 70vw       | 70vw    | **70vw**  | **70vw** |
| **height `[probed]`** | **475.19** | **327.36** | **594.59** | **500.39** | **460.8** | **536.89** | **336** | **335.3** | **273**  |

The 992→991 step is **+267.23px on one pixel of viewport**. Every other hero on
the site goes to `95vw` at ≤479; this one does not. A template that shares one
hero-height ladder across all detail pages will render **370.5px at 390** (95vw)
where live renders **273px** — a 97.5px error that shifts the entire page.

`.hero.reception` also picks up `padding: 0` at ≤767 (`beachfront.css:8447-8449`)
— **inert**, since `.hero` declares no padding.

##### Assets — the CSS background is never visible

Two images are declared for this band and **only the `<img>` is seen**:

| layer                                       | URL                                                                                                                      | source                | visible?               |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | --------------------- | ---------------------- |
| CSS `background-image` on `.hero.reception` | `https://cdn.prod.website-files.com/64af3f93339537d6b661b556/64b1ced3281a341a1cc50074_DSC_7625.jpg`                      | `beachfront.css:5311` | **NO** — fully covered |
| `img.hero-dynamic-image`                    | `https://cdn.prod.website-files.com/64b1c843b071dc32170ea053/64d1402a4309c0bf7d84ce63_running-into-our-golden-years.jpg` | `detail-svc.html:113` | **YES**                |

`.hero-dynamic-image` `beachfront.css:6428-6433`: `object-fit:cover; width:100%;
height:100%; position:absolute` — it fills the section exactly
(`[probed]` 1440×475.19 / 834×500.39 / 390×273, `object-fit: cover`,
`max-width: 100%`), so the reception photo behind it is dead weight. **A rebuild
that renders the CSS background instead of the per-service `<img>` shows the
wrong photograph** (an office interior instead of two people walking on a beach).

The `<img>` is served from a **different CDN site bucket**
(`64b1c843b071dc32170ea053`, the CMS asset bucket) than every other asset on the
page (`64af3f93339537d6b661b556`). `srcset` resolution `[probed]`: 1440 →
`-p-1600.jpg`, 834 → `-p-1080.jpg`, 390 → `-p-500.jpg`; `sizes="100vw"`;
`loading="lazy"`.

##### Gradient overlays

Both are plain absolutely-positioned `<div>`s with **percentage heights of the
hero**, no z-index, painting in DOM order above the `<img>`:

| element              | source                     | declarations                                                                                                        | 1440                  | 834                  | 390                 |
| -------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------- | --------------------- | -------------------- | ------------------- |
| `.hero-top-gradient` | `beachfront.css:6477-6482` | `background-image: linear-gradient(#129ecccc, #0000); width:100%; height:25%; position:absolute` (implicit `top:0`) | h **118.8**           | h **125.09**         | h **68.25**         |
| `.hero-bot-gradient` | `beachfront.css:6484-6490` | `background-image: linear-gradient(#0000, #129ecccc); width:100%; height:50%; position:absolute; bottom:0`          | y 237.59 h **237.59** | y 250.2 h **250.19** | y 136.5 h **136.5** |

`#129ecccc` computes to `rgba(18, 158, 204, 0.8)` `[probed]` — **0.8 alpha, not
0.8 lightness**. No `.dark` / `.home` / `.home-blue` modifier
(`beachfront.css:6492/6496/6500`) is present on this page.

##### `.bot-wave` — white wave divider, JS-injected SVG

Base `beachfront.css:6008-6016`: `z-index:8; width:100%; line-height:0;
position:absolute; bottom:0; left:0; overflow:hidden`.
Page-local overrides in the head `<style>`:

- `.bot-wave { transform: rotate(180deg) }` — `detail-svc.html:20-22`
- `.bot-wave svg { position:relative; display:block; width: calc(133% + 1.3px); height: 3rem }` — `detail-svc.html:24-29`
- `.bot-wave .shape-fill { fill:#FFFFFF }` — `detail-svc.html:32-34`

**The `rotate(180deg)` is on the PARENT wrapper, not the svg** (same trap as the
footer divider, chrome §4.6). Computed wrapper transform is
`matrix(-1, 0, 0, -1, 0, 0)` `[probed]`; the svg itself has `transform: none`.

**The SVG is jQuery-injected**, `detail-svc.html:123`:
`$(".bot-wave").append(' <svg data-name="Layer 1" … viewBox="0 0 1200 120" preserveAspectRatio="none"><path d="M321.39,56.44c58-…" class="shape-fill"></path></svg> ')`.
Webflow ships an **empty** `<div class="bot-wave">` at `detail-svc.html:113`.
`[probed]` exactly **one** svg child at every width — do not render one in markup
_and_ port the injector.

|                                           | 1440                            | 834                              | 390                    |
| ----------------------------------------- | ------------------------------- | -------------------------------- | ---------------------- |
| wrapper rect `[probed]`                   | `{0, 355.19, 1440, 120}`        | `{0, 404.39, 834, 96}`           | `{0, 201, 390, 72}`    |
| svg height (`3rem`)                       | **120**                         | **96**                           | **72**                 |
| svg width (`calc(133% + 1.3px)`)          | **1916.5**                      | **1110.52**                      | **520**                |
| svg rect after parent rotation `[probed]` | `{−476.5, 355.19, 1916.5, 120}` | `{−276.52, 404.39, 1110.52, 96}` | `{−130, 201, 520, 72}` |

Nine-width svg width `[probed]`: 1916.5 / 1320.66 / 1319.33 / 1110.52 / 1022.73 /
1021.41 / 639.69 / 638.36 / 520.

**Z-order note `[probed]`:** `.bot-wave` has `z-index: 8`
(`beachfront.css:6009`) and the breadcrumb's `.content-width` has `z-index: auto`
— so `elementFromPoint` over the breadcrumb text returns the `svg`. The
breadcrumb still reads because the wave's white fill only occupies the lower
part of its 120px box; but the wave **is** the top layer where they overlap
(label box 367.67–417.67, wave box 355.19–475.19 at 1440). Any rebuild that puts
the label above the wave will paint the label over the white crest on the right
side of the band.

##### `.service-label-container` — the breadcrumb, an absolute overlay

`beachfront.css:6508-6512`: `display:flex; position:absolute; bottom:10%`.
No responsive override anywhere (grep: 1 hit total). It is positioned against the
hero's `.content-width` (`position: relative`, `beachfront.css:5866`), so its
left edge is that container's **padding-left**, and `bottom: 10%` resolves
against the **hero's height**.

|                                   | 1440                       | 834                        | 390                         |
| --------------------------------- | -------------------------- | -------------------------- | --------------------------- |
| rect `[probed]`                   | `{80, 347.67, 532.42, 80}` | `{48, 394.36, 285.03, 56}` | `{19.5, 189.7, 268.22, 56}` |
| `left` (= `.content-width` pad-l) | 60px                       | 48px                       | 19.5px                      |
| `bottom: 10%` of hero h           | **47.52**                  | **50.03**                  | **27.30**                   |
| container height                  | **80**                     | **56**                     | **56**                      |

Nine-width `bottom` `[probed]`: 47.52 / 32.73 / 59.45 / 50.03 / 46.08 / 53.69 /
33.59 / 33.52 / 27.30 — it tracks the hero height ladder, so it inherits the
992/991 discontinuity.

##### `h3.service-page-label` type — a THREE-tier ladder that steps at 992 and 480

`.service-page-label` `beachfront.css:6504-6506`: `color: #fff` — that is the
_entire_ rule. Everything else comes from the `h3` ladder:
base `beachfront.css:2124-2132` (museo-slab / 300 / **40px** / **50px** /
`margin: 20px 0 10px`), ≤991 `beachfront.css:7863-7866` (**21px / 26px**),
plus the page-specific ≤479 override `beachfront.css:9267-9269`
(**`font-size: 20px`** — line-height is _not_ re-declared, so it stays 26px).

|                               | 1440                   | 834         | 390         |
| ----------------------------- | ---------------------- | ----------- | ----------- |
| font-family                   | museo-slab, sans-serif | ←           | ←           |
| font-weight                   | 300                    | ←           | ←           |
| **font-size / line-height**   | **40 / 50**            | **21 / 26** | **20 / 26** |
| colour                        | `#fff`                 | ←           | ←           |
| letter-spacing / transform    | normal / none          | ←           | ←           |
| margin (each `h3`)            | `20px 0 10px`          | ←           | ←           |
| `.mx-1` on the `/` (`.25rem`) | **10px**               | **8px**     | **6px**     |
| container height (26/50 + 30) | **80**                 | **56**      | **56**      |

Nine-width font-size `[probed]`: **40 / 40 / 21 / 21 / 21 / 21 / 21 / 20 / 20**.
**At 992 it is still 40px** — the root has stepped to 32 but Webflow's ≤991 rule
has not fired. A ladder keyed at 768 renders 40px across the whole 768–991 band
where live renders 21px, and the container is 80px tall instead of 56px.

The three `h3` margins (`20px / 10px`, `beachfront.css:2126-2127`) are **flex
items** — they do **not** collapse, which is why the container is
`line-height + 30`, not `line-height`.

##### Reveal

**None.** The hero carries no `data-w-id` and appears in no IX2 event
`[probed, /tmp/bf-svc-wids.json]`. It must be fully opaque and untransformed on
first paint.

---

#### B.3 Page title — `h2` "Dental Exams"

Markup (`detail-svc.html:113`):
`<section class="service-page-title-subtitle-section"><div class="content-width"><h2>Dental Exams</h2>…`

A **bare `<h2>` with no class**. All type is the base `h2` ladder:
`beachfront.css:2114-2122` (`color: var(--primary); margin: 20px 0 10px;
museo-slab; font-size:140px; font-weight:100; line-height:168px`),
≤991 `beachfront.css:7858-7861` (**72 / 80**),
≤479 `beachfront.css:9012-9016` (**`overflow-wrap: anywhere`; 56 / 70**).

|                                    | 1440                             | 834                     | 390                     |
| ---------------------------------- | -------------------------------- | ----------------------- | ----------------------- |
| font-family / weight               | museo-slab, sans-serif / **100** | ←                       | ←                       |
| **font-size / line-height**        | **140 / 168**                    | **72 / 80**             | **56 / 70**             |
| colour                             | `#129ecc` (`--primary`)          | ←                       | ←                       |
| letter-spacing / transform / align | normal / none / start            | ←                       | ←                       |
| margin                             | `20px 0 10px`                    | ←                       | ←                       |
| `overflow-wrap`                    | normal                           | normal                  | **anywhere**            |
| rect `[probed]`                    | `{80, 495.19, 1280, 168}`        | `{48, 520.39, 738, 80}` | `{19.5, 293, 351, 140}` |

Nine-width font-size `[probed]`: **140 / 140 / 72 / 72 / 72 / 72 / 72 / 56 / 56**.
At **992 it is still 140px / 168px** in a 32px-root viewport. At 390 the title
**wraps to two lines** (h = 140 = 2 × 70).

**Its `margin-top: 20px` is the hero→title gap.** It collapses out through
`.content-width` (no border, no padding-top, `beachfront.css:5858-5867`) and out
through the section, landing as **exactly 20px at every one of the 9 widths**
`[probed]`. Do not express it as section padding-top.

---

#### B.4 Lede two-column block

Markup (`detail-svc.html:113`):

```
<div class="display-flex">
  <div class="col-1-of-3 su-w-full-mobile"></div>          <!-- EMPTY spacer -->
  <div class="col-2-of-3 su-w-full-mobile">
    <h5 class="text-body-large">Few people place a visit to their dentist …</h5>
  </div>
</div>
```

The first column is **deliberately empty** — it is the whole right-indent
mechanism. There is no `margin-left` / `padding-left` anywhere; the lede is
pushed right purely by a 33%-wide empty sibling.

##### The wrapper — `.display-flex`

`beachfront.css:3023-3026`: `flex-wrap: wrap; display: flex`.
≤991 `beachfront.css:7890-7892`: **`font-size: .6rem`**.
≤767 `beachfront.css:8386-8388`: `flex-wrap: wrap` (redundant).

`[probed]` inherited font-size on this wrapper: **64px** at 1440/992 (body
default `beachfront.css:2098`), **19.2px** at 991–769, **14.4px** at ≤768. Three
tiers, and the ≥992 value is body's 64px, not `.6rem` of anything. It is
overridden by the `h5` below, but it sets the line-box metrics of the flex line
and of any bare text.

##### The columns

`.col-1-of-3` `beachfront.css:6445-6447`: `width: 33%` — **that is the entire
rule**, no responsive override (grep: 1 hit).
`.col-2-of-3` `beachfront.css:6440-6443`: `width: 66%; position: relative` — no
responsive override (grep: 1 hit).
`.su-w-full-mobile` `beachfront.css:8426-8428` (**≤767 only**): `width: 100%`.

|                            | 1440       | 992    | 991    | 834        | **768**    | 767                | 390     |
| -------------------------- | ---------- | ------ | ------ | ---------- | ---------- | ------------------ | ------- |
| content column             | 1280       | 896    | 895    | 738        | **696**    | 644.28             | 351     |
| **col-1 width `[probed]`** | **422.39** | 295.67 | 295.34 | **243.53** | **229.67** | **644.28**         | **351** |
| **col-2 width `[probed]`** | **844.8**  | 591.36 | 590.69 | **487.08** | **459.36** | **644.28**         | **351** |
| layout                     | 2-up       | 2-up   | 2-up   | 2-up       | **2-up**   | **1-up (wrapped)** | 1-up    |

**The columns stay side-by-side at 768 and only stack at 767.** A build that
stacks at `md` (768) collapses the indent one pixel early and, more importantly,
gives the lede the full 696px instead of 459.36px — different wrap, different
height, everything below moves. 33% + 66% = 99%, so there is a **1% gutter**
(12.8 / 7.38 / 0px) that is a rounding artefact of the percentages, not a gap
property.

##### `h5.text-body-large` — the lede

`h5` base `beachfront.css:2144-2152`: `color: var(--primary); margin: 10px 0
10px; museo-slab; font-size:30px; font-weight:300; line-height:40px`.
`.text-body-large` `beachfront.css:7760-7765` **overrides** it:
`margin-top:20px; margin-bottom:40px; font-size:30px; line-height:1.5em`.
≤991 `beachfront.css:8363-8365`: `font-size: 20px`.
≤479 `beachfront.css:9573-9576`: `margin-bottom: 20px; font-size: 20px`.
**`h5` has no responsive rule of its own** anywhere in the sheet — every step
comes from `.text-body-large`.

|                                       | 1440                           | 834                             | 390                     |
| ------------------------------------- | ------------------------------ | ------------------------------- | ----------------------- |
| font-family / weight                  | museo-slab, sans-serif / 300   | ←                               | ←                       |
| **font-size / line-height (`1.5em`)** | **30 / 45**                    | **20 / 30**                     | **20 / 30**             |
| colour                                | `#129ecc` (`--primary`)        | ←                               | ←                       |
| letter-spacing / transform / align    | normal / none / start          | ←                               | ←                       |
| **margin-top / margin-bottom**        | **20 / 40**                    | **20 / 40**                     | **20 / 20**             |
| rect `[probed]`                       | `{502.39, 693.19, 844.8, 495}` | `{291.53, 630.39, 487.08, 360}` | `{19.5, 463, 351, 510}` |

Nine-width font-size `[probed]`: **30 / 30 / 20 / 20 / 20 / 20 / 20 / 20 / 20**;
margin-bottom **40 × 7 then 20 / 20** (≤479 only).
So this is a **30→20 ladder gated at 991** crossed with a **40→20 margin ladder
gated at 479** — two different switch points on one element.

Its `margin-top: 20px` is _inside_ the flex item (flex items do not collapse), so
it is real 20px of offset from the column top at every width `[probed]`.

---

#### B.5 Body rich text — `.content-width.mt-6 > ._w-80pc.su-w-full-mobile.w-richtext`

Markup (`detail-svc.html:113`):

```
<section class="service-page-body-section">
  <div data-w-id="c413430e-997e-a422-b45f-0c6440cb98e9"
       style="…translate3d(0, 4rem, 0)…; opacity:0"          <!-- IX2, §D -->
       class="content-width mt-6">
    <div class="_w-80pc su-w-full-mobile w-richtext">
      <p><strong>What to expect during a dental exam</strong></p>
      <p>During your dental exam, …</p>
      <p>&zwj;</p>                                            <!-- U+200D -->
      <p><strong>Why are dental exams important?</strong></p>
      <p>Dental exams are the best way …</p>
      <p>&zwj;</p>                                            <!-- U+200D -->
    </div>
  </div>
  …
</section>
```

##### The wrapper

`.content-width` chrome §2 (`beachfront.css:5858-5867`, max-width 1400, pad-x
`1.5rem` → 8% ≤767 `:8627-8630` → 5% ≤479 `:9164-9167`).
`.mt-6` `beachfront.css:3917-3919`: `margin-top: 1.5rem` — **no responsive
override** (grep: `.mt-6` has 2 hits, the second being
`.mt-6.su-flex-v-mobile` `beachfront.css:3921-3923`, which does not match).

`margin-top` `[probed, 9 widths]`: **60 / 48 / 48 / 48 / 36 / 36 / 36 / 36 / 36**.
Three tiers stepping on the **root** ladder at 992 and 768 — _not_ on Webflow's
991/767.

##### The rich-text column width — a THREE-VALUE width function

`._w-80pc` `beachfront.css:3561-3563`: `width: 80%` — no responsive override
(the only other `_w-80pc` selector, `beachfront.css:7651`, is a 3-class compound
that does not match).
`.su-w-full-mobile` `beachfront.css:8426-8428` (**≤767**): `width: 100%`.

| viewport             | 1440     | 992       | 991     | 834        | **768**   | 767        | 480        | 479        | 390     |
| -------------------- | -------- | --------- | ------- | ---------- | --------- | ---------- | ---------- | ---------- | ------- |
| declared             | 80%      | 80%       | 80%     | 80%        | **80%**   | 100%       | 100%       | 100%       | 100%    |
| **width `[probed]`** | **1024** | **716.8** | **716** | **590.39** | **556.8** | **644.28** | **403.22** | **431.13** | **351** |

Note the width **increases** from 556.8 at 768 to 644.28 at 767 — the only place
on the page where a narrower viewport yields a wider column.

##### Rich-text type

`p` `beachfront.css:2166-2172`: `color: var(--primary-dark); margin-bottom:10px;
font-size:20px; font-weight:300; line-height:1.5em` (+ `margin-top: 0` from
`beachfront.css:424-427`). ≤991 `beachfront.css:7877-7879`: `font-size:16px`;
≤767 `beachfront.css:8378-8380`: `font-size:16px` (same); ≤479
`beachfront.css:9018-9020`: `font-size:12px`.
`strong` `beachfront.css:41-43`: `font-weight: bold` (700) — same size/colour.
Family is inherited `museo-sans` from `body` (`beachfront.css:2098`); **no
`museo-slab` in the body copy**.

|                                       | 1440                         | 834         | 390         |
| ------------------------------------- | ---------------------------- | ----------- | ----------- |
| family / weight                       | museo-sans, sans-serif / 300 | ←           | ←           |
| **font-size / line-height (`1.5em`)** | **20 / 30**                  | **16 / 24** | **12 / 18** |
| colour                                | `#365b6d` (`--primary-dark`) | ←           | ←           |
| letter-spacing / transform / align    | normal / none / start        | ←           | ←           |
| paragraph margin                      | `0 0 10px 0`                 | ←           | ←           |
| `strong` weight / size                | **700** / same               | ←           | ←           |

Nine-width `p` font-size `[probed]`: **20 / 20 / 16 / 16 / 16 / 16 / 16 / 12 / 12**.
At **992 body copy is still 20px** inside a 716.8px column — that is why the page
is 4679px tall there.

`.w-richtext` itself contributes only Webflow clearfix pseudo-elements
(`beachfront.css:1672-1680`) and `overflow: hidden` on nested lists
(`beachfront.css:1686-1688`); there are no lists, figures, images or links in
this document's rich text — **6 `<p>` children, nothing else** `[probed]`.

##### The two invisible paragraphs — do not strip them

Children 3 and 6 are `<p>` containing a single **U+200D ZERO WIDTH JOINER**
(verified byte-level in `detail-svc.html:113`). They render as full-height empty
line boxes:

|                                                       | 1440     | 834      | 390      |
| ----------------------------------------------------- | -------- | -------- | -------- |
| each empty `<p>` (line-height + `margin-bottom:10px`) | **40px** | **34px** | **28px** |
| both together                                         | **80px** | **68px** | **56px** |

A rich-text pipeline that drops empty paragraphs loses **80 / 68 / 56px** of
column height and pulls the pill, the CTA band and the footer up by that much.

##### Measured heights (the reflow curve — use it to sanity-check width errors)

| viewport                       | 1440    | 992      | 991     | 834     | 768      | 767     | 480      | 479     | 390     |
| ------------------------------ | ------- | -------- | ------- | ------- | -------- | ------- | -------- | ------- | ------- |
| column width                   | 1024    | 716.8    | 716     | 590.39  | 556.8    | 644.28  | 403.22   | 431.13  | 351     |
| p font-size                    | 20      | 20       | 16      | 16      | 16       | 16      | 16       | 12      | 12      |
| **richtext height `[probed]`** | **900** | **1200** | **828** | **948** | **1020** | **900** | **1332** | **744** | **888** |

At a fixed 16px, height is ~inversely linear in width: 716→828, 644.28→900,
590.39→948, 556.8→1020. **Every 100px of width error at 834 costs roughly 100px
of height**, and that error propagates to every y below it.

Rich-text child y positions at 1440 `[probed]`: 1288.19 (h 30) / 1328.19 (h 390) /
1728.19 (h 30) / 1768.19 (h 30) / 1808.19 (h 330) / 2148.19 (h 30).

##### Reveal

`data-w-id="c413430e-997e-a422-b45f-0c6440cb98e9"` → IX2 `e-147` →
action list `a-7` "up and in". See §D.

---

#### B.6 Back-link pill row — `.content-width.flex-align-center.flex-justify-center.my-8`

Markup (`detail-svc.html:113`):

```
<div class="content-width flex-align-center flex-justify-center my-8">
  <a data-w-id="fdaf2531-298e-9f20-187e-3c39f84fa21e"
     style="…translate3d(0, 4rem, 0)…; opacity:0"
     href="/services" class="button text-color-primary-dark w-button">Back to All Services</a>
</div>
```

Row box: `.content-width` (chrome §2) + `.flex-align-center`
`beachfront.css:2953-2956` (`align-items:center; display:flex`) +
`.flex-justify-center` `beachfront.css:2984-2987` (`justify-content:center;
display:flex`) + `.my-8` `beachfront.css:3839-3842` (`margin-top: 2rem;
margin-bottom: 2rem`). **No responsive override on `.my-8`** — the only other
matching selectors (`beachfront.css:5912`, `:6153`, `:8092`, `:8409`) are
multi-class compounds that do not match this element.

`margin-top` = `margin-bottom` `[probed, 9 widths]`: **80 / 64 / 64 / 64 / 48 /
48 / 48 / 48 / 48**. Root ladder, three tiers.

The pill is `.button.text-color-primary-dark` — **fully spec'd in chrome §6**
(`beachfront.css:6028-6040` base, `:6047-6051` dark variant with hard
`padding-top/bottom: 32px`, `:8045-8047` ≤991 `font-size:20px`,
`:8049-8052` ≤991 padding back to `1.3em`, `:8632-8634` ≤767 `font-size:15px`,
`:8636-8638` ≤767 **`margin-bottom: 60px`**, `:9173-9175` ≤479 `font-size:14px`).

|                          | 1440                            | 834                             | 390                                    |
| ------------------------ | ------------------------------- | ------------------------------- | -------------------------------------- |
| pill rect `[probed]`     | `{578.44, 2268.19, 283.11, 66}` | `{303.55, 2090.39, 226.89, 54}` | `{115.28, 1965, 159.42, 38.38}`        |
| font-size / padding      | 25 / `32px 25px`                | 20 / `26px 20px`                | 14 / `18.2px 14px`                     |
| border / radius          | `1px solid #365b6d` / `8px`     | ←                               | ←                                      |
| **pill `margin-bottom`** | **0**                           | **0**                           | **60px** (≤767, `beachfront.css:8636`) |
| **row height**           | **66**                          | **54**                          | **98.38**                              |

Nine-width row height `[probed]`: 66 / 66 / 54 / 54 / 54 / 101 / 101 / 98.38 /
98.38. **The 60px only exists ≤767, and because the pill is a flex item its
margin does NOT collapse — it lives INSIDE the row box.** So below 768 the total
space between the pill and the CTA band is `60 (inside the row) + 48 (collapsed
below the section)` = 108px, split across two different boxes. Modelling all 108
as one gap puts 60px in the wrong gate region.

##### Reveal + the hover trap

`data-w-id="fdaf2531-298e-9f20-187e-3c39f84fa21e"` → IX2 `e-197` → `a-7` (§D).

`[probed]` hover at 1440: `background-color` `rgba(0,0,0,0)` →
**`rgba(18, 158, 204, 0.29)`**; **opacity stays 1**. `.button:hover`
(`beachfront.css:6042-6045`) declares `opacity: .6; background-color: #129ecc4a`,
but IX2 leaves `opacity: 1` as an **inline style** after the reveal settles, and
inline beats the class rule. Same mechanism as the CTA button (chrome §4.7).
A rebuild without the reveal will fade this pill to 0.6 on hover where live does
not.

---

#### B.7 Where the vertical space actually lives (gate-cut critical)

Neither `.service-page-title-subtitle-section` nor `.service-page-body-section`
has a single CSS rule (§B.0). Every gap on this page is a **collapsed margin**:

| gap @1440                               | px     | where it comes from                                                                          | source                                        |
| --------------------------------------- | ------ | -------------------------------------------------------------------------------------------- | --------------------------------------------- |
| hero bottom → title section top         | **20** | `h2 { margin-top: 20px }` collapsed out through `.content-width` and the section             | `beachfront.css:2106`                         |
| title section bottom → body section top | **60** | `max(h5's margin-bottom 40, .mt-6's 1.5rem = 60)` — adjoining margins collapse to the larger | `beachfront.css:7761` + `beachfront.css:3918` |
| rich text bottom → pill row top         | **80** | `.my-8`'s `margin-top: 2rem` vs the last `<p>`'s 10px — collapses to 80                      | `beachfront.css:3840`                         |
| pill row bottom → footer top            | **80** | `.my-8`'s `margin-bottom: 2rem` collapsed out of the section                                 | `beachfront.css:3841`                         |

Resolved at the gate matrix, all `[probed]`:

| gap           | 1440   | 992    | 834    | **768** | 390                           |
| ------------- | ------ | ------ | ------ | ------- | ----------------------------- |
| hero → title  | 20     | 20     | 20     | 20      | 20                            |
| title → body  | **60** | **48** | **48** | **36**  | **36**                        |
| body → pill   | **80** | **64** | **64** | **48**  | **48**                        |
| pill → footer | **80** | **64** | **64** | **48**  | **48** (+60 _inside_ the row) |

Consequences of getting the box wrong:

- Express **title → body** as `padding-top` on `.service-page-body-section` and
  the 40px `margin-bottom` of the lede stops collapsing → the gap becomes
  **100 / 88 / 76** instead of 60 / 48 / 36, _and_ 60px moves from R0 into R1.
- Express **pill → footer** as `padding-bottom` and it stops collapsing out of
  the section: R2 grows by 80/64/48px and the CTA band's y is unchanged only by
  accident.
- The section box for `.service-page-body-section` **ends at the pill's bottom
  edge** (1440: y 1288.19 + h 1046 = 2334.19 = pill bottom) `[probed]`. The
  trailing 80px is entirely outside it.

---

### C. INTERACTION INVENTORY

Enumerated from the settled live DOM at 1440 (every `a`, `button`, `input`,
`select`, `textarea`, `[data-w-id]`, and every element with `cursor: pointer` or
a class matching `/open|active|expand|menu|modal|dropdown|accordion|slider/`),
excluding the Google-Maps widget's internal controls (counted once as the
widget). Raw: `/tmp/bf-svc-interactions.json` (53 raw nodes → 25 controls after
de-duplicating visual children of a single control).

**Unique to this page (1)**

| #   | element                                                                                                | behaviour                                                                                                           | source                                                                                                                                    |
| --- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `a.button.text-color-primary-dark.w-button[data-w-id=fdaf2531-…]` "Back to All Services" → `/services` | navigate; hover → `background-color: rgba(18,158,204,0.29)`, **opacity pinned at 1** by the IX2 inline style (§B.6) | `detail-svc.html:113`; `beachfront.css:6042-6045` (`:hover`), `:6039` (transition `.2s` opacity + `.2s cubic-bezier(.215,.61,.355,1)` bg) |

**Shared chrome present in this page's DOM (24)** — behaviour spec'd in

> **The shared-chrome count on this line is UNRECONCILED.** Across the nine
> page specs the same shared chrome is declared as 32 / 31 / 24, and
> `_chrome.md` §0 asserts the markup is byte-identical. Both cannot be true.
> What IS verified on live 2026-08-05 (`matching/probe-chrome-count.mjs`):
> every page's `.header` carries the same 11 links and one `.dropdown-modal`;
> the `.footer` carries 10 links (a 13 is Google Maps' runtime DOM inside the
> declared-floor iframe, not chrome); and `.form-modal` is ABSENT on
> `/services/<uid>` and `/team-members/<uid>`, which ship two dead
> `.show-form` buttons. Phase 5 must recount this figure element-by-element
> against `_chrome.md`'s inventory before using it as a coverage denominator —
> a wrong denominator silently excuses a skipped state.

`_chrome.md`; listed so the Phase-5 count is fixed.

| #     | element                                                                                                                                                                                                                                                  | ref         |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| 2     | `a.link-block-5` header logo → `/`                                                                                                                                                                                                                       | chrome §3.1 |
| 3     | `a.link-block-4` + `img.header-hamburger[data-w-id=d74a87ea-…]` — open panel (IX2 `e-9` → `a-4`)                                                                                                                                                         | chrome §3.4 |
| 4     | `img.header-hamburger[data-w-id=8dfa6638-…]` inside `.dropdown-modal` — close panel (IX2 `e-7` → `a-3`)                                                                                                                                                  | chrome §3.4 |
| 5–11  | 7 × `a.no-text-dec > h3.modal-link` (Home Page · First Visit · Meet Our Team · **Services** `w--current` · Ask the Doctor · Contact · (310) 378-9241)                                                                                                    | chrome §3.5 |
| 12    | panel `a.button.show-form.nav[data-w-id=6eca16bd-…]` "Book an Appointment" (IX2 `e-307` → `a-5` + jQuery `detail-svc.html:135`) — **no-op on this page, no `.form-modal` exists** (§B.0)                                                                 | chrome §3.6 |
| 13    | panel `a.button.nav` "Make a Payment" → `app.modento.io/beachfront-dentistry`                                                                                                                                                                            | chrome §3.1 |
| 14    | CTA `a.button.show-form[data-w-id=1273e294-…4f60]` "Book Appointment" (IX2 `e-17` → `a-5`) — **no-op, same reason**                                                                                                                                      | chrome §4.3 |
| 15    | `div.block-link.social-link-block[data-w-id=9daf7a34-…]` "Read Reviews" toggle (IX2 `e-211`→`a-8`, `e-212`→`a-9`, plus jQuery `$('.social-link-block').click(toggle)` at `detail-svc.html:149`, `toggle` defined in `matching/spec/incidental-utils.js`) | chrome §4.4 |
| 16–18 | 3 × `a._w-8.clickable.su-w-6-portrait` — Google Maps reviews · Facebook · Yelp                                                                                                                                                                           | chrome §4.4 |
| 19–22 | 4 × footer `a.inline-link` (Your First Visit · Our Team · **Services** `w--current` · Ask the Doctor)                                                                                                                                                    | chrome §5.3 |
| 23    | footer `a.button[data-w-id=b1ce8885-…]` "Make a Payment" (IX2 `e-303` → `a-5`)                                                                                                                                                                           | chrome §5.3 |
| 24    | footer `a.inline-link[href="tel:(310)-378-9241"]`                                                                                                                                                                                                        | chrome §5.5 |
| 25    | `.footer-map.w-widget.w-widget-map` Google Maps widget (pan / zoom / fullscreen / Street View — third-party, counted once)                                                                                                                               | chrome §5.7 |

**Explicitly NOT counted** (not elements, or not actuatable):

- The **portrait `alert()`** at `detail-svc.html:138-140`, re-armed on
  `window:resize` at `:142-146` — fires when
  `innerWidth < 792 && innerHeight < innerWidth`. A native dialog, not a DOM
  control. It **will block a headless probe**; every probe here registers
  `p.on("dialog", d => d.dismiss())`.
- `img.expanding-plus` / `img.expanding-minus` / `div.plus-minus-block` —
  visual children of #15; clicks bubble to the toggle.
- The `img.header-logo` inside `.dropdown-modal` — it has `cursor: pointer` from
  `beachfront.css:6090-6094` but is **not wrapped in an anchor** and has no
  `data-w-id`; it is decorative.
- `.socials-container` — a revealed container, not a control; its 3 anchors are
  #16–18.
- The 4 `.footer-copyright` items — plain `<div>`s, not links.
- `.form-modal` and its 7 controls (logo, close, 3 inputs, textarea, submit) —
  **absent from this page** (§B.0). This is the whole difference from
  `services.md`'s count of 55: 24 unique cards + 31 chrome there, vs 1 unique +
  24 chrome here.
- Hover-only states (`a:hover` `beachfront.css:2181`, `.inline-link:hover`
  `:7391`, `.button:hover` `:6042`) — states of counted elements.

**INTERACTION COUNT: 25**

---

### D. ANIMATION CENSUS

Read from live's IX2 store (`Webflow.require("ix2").store.getState().ixData`)
plus the page's own jQuery. `[probed-only]` — IX2 data ships inside the Webflow
runtime bundles (`beachfront-dentistry.schunk.36b8fb49256177c8.js`,
`.schunk.f0bc49bb141fcb49.js`, `.1897c86d.bafe3d049a8a5f18.js`, loaded at
`detail-svc.html:117`), not in any file under `matching/spec/`.
Dump: `/tmp/bf-svc-ix2.json` (127 events site-wide; 16 reference elements on this
page).

**Elements on this page carrying `data-w-id`: 12** `[probed]` — **2 are
page-unique**:

| `data-w-id`                            | element                                              | event   | type               | action list |
| -------------------------------------- | ---------------------------------------------------- | ------- | ------------------ | ----------- |
| `c413430e-997e-a422-b45f-0c6440cb98e9` | `div.content-width.mt-6` (the whole rich-text block) | `e-147` | `SCROLL_INTO_VIEW` | `a-7`       |
| `fdaf2531-298e-9f20-187e-3c39f84fa21e` | `a.button` "Back to All Services"                    | `e-197` | `SCROLL_INTO_VIEW` | `a-7`       |

The other 10 are chrome: `d74a87ea` (`e-9`→`a-4`, open nav), `8dfa6638`
(`e-7`→`a-3`, close nav), `6eca16bd` (`e-307`→`a-5`), `1273e294-…4f5b/4f5f/4f60/
4f62/4f6a` (`e-73/e-85/e-75+e-17/e-77/e-87` → `a-7`/`a-5`, CTA band),
`9daf7a34` (`e-211`→`a-8`, `e-212`→`a-9`, Read Reviews), `b1ce8885`
(`e-303`→`a-5`, `e-305`→`a-7`). Chrome §3.4, §4.4, §4.7.

**`a-7` is the ONLY animation on this page.** Action list, title **"up and in"**
(verbatim from the store):

```
useFirstGroupAsInitialState: true
group 1 (INITIAL STATE, written as an inline style before paint)
  TRANSFORM_MOVE   yValue: 4   yUnit: "rem"   duration: 500   delay: 0   easing: ""
  STYLE_OPACITY    value: 0                   duration: 500   delay: 0   easing: ""
group 2 (ON TRIGGER)
  TRANSFORM_MOVE   yValue: 0   yUnit: "rem"   duration: 2000  delay: 0   easing: "outExpo"
  STYLE_OPACITY    value: 1                   duration: 2000  delay: 0   easing: "outExpo"
```

Trigger config for both page-unique events:
`{loop:false, playInReverse:false, scrollOffsetValue:0, scrollOffsetUnit:"%"}`.
Webflow's `SCROLL_INTO_VIEW` is **IntersectionObserver-driven** (not
scroll-linked, not click) with a 0% offset — it fires once when the element's box
first intersects the viewport. With `playInReverse:false` the reveal **never
replays or reverses** on scroll-out.

> **The travel distance is itself a three-tier rem value.** `yUnit: "rem"` with
> `yValue: 4` resolves against the live root font at animation time:

|                     | 1440      | 992       | 991       | 834       | 768      | 390      |
| ------------------- | --------- | --------- | --------- | --------- | -------- | -------- |
| root                | 40px      | 32px      | 32px      | 32px      | 24px     | 24px     |
| **travel (`4rem`)** | **160px** | **128px** | **128px** | **128px** | **96px** | **96px** |

Duration **2000ms**, easing **outExpo** = `cubic-bezier(0.19, 1, 0.22, 1)`, at
every tier. Group 1's `duration: 500` never runs — `useFirstGroupAsInitialState`
applies it instantly as the pre-paint inline style.

Authored initial inline style (present in the shipped HTML, `detail-svc.html:113`,
on **both** elements):

```
-webkit-transform:translate3d(0, 4rem, 0) scale3d(1,1,1) rotateX(0) rotateY(0) rotateZ(0) skew(0,0);
… transform:translate3d(0, 4rem, 0) …; opacity:0
```

Settled state `[probed, 1440/834/390]`:
`transform: matrix(1, 0, 0, 1, 0, 0)`, `opacity: 1`, and the inline style is
rewritten to `translate3d(0px, 0rem, 0px) …; opacity: 1; transform-style:
preserve-3d`. **That inline `opacity: 1` is what defeats `.button:hover
{opacity:.6}`** on the back-link (§B.6).

**Not animated on this page:** the header, the hero and everything inside it
(image, wave, both gradients, breadcrumb), the `h2` title, and the entire lede
two-column block. None carries `data-w-id`; none appears in any IX2 event. They
must be fully opaque and untransformed on first paint. **The `h2` "Dental Exams"
and the lede do NOT reveal** — a rebuild that animates the whole detail template
uniformly is wrong for the top half of the page.

**CSS transitions in play (page-unique):**

- `.button { transition: opacity .2s, background-color .2s cubic-bezier(.215,.61,.355,1) }` `beachfront.css:6039`
- `a { transition: opacity .2s }` `beachfront.css:2174-2179`

**Runtime DOM mutation:** `$(".bot-wave").append(<svg…>)` at
`detail-svc.html:123` injects the hero wave after DOM-ready. A probe that reads
`.bot-wave` before jQuery runs sees an empty 0-height wrapper.

**Probe discipline for this page:** the 2000ms outExpo means an early read
returns the rich-text block and the pill up to **160px too low** at 1440 with
`opacity` between 0 and 1 — and because the rich text is 900px tall, an unsettled
read also mis-sizes `.service-page-body-section` and everything below. Always
scroll in ≤250px steps with ≥80ms dwell, hold until
`document.getAnimations().every(a => a.playState !== "running")`, then settle
≥800ms.

---

### E. KNOWN-SUSPECT LIST

Ordered by confidence that our build has it wrong. Our template is
`src/routes/services/[slug]/+page.svelte`; Tailwind breakpoints in
`src/app.css:32-36` are `xs 480 / sm 640 / md 768 / lg 992 / xl 1280`.

**E1 — the rich-text column is `80%` with a `100%` step at 767, not a
`max-width: 1024px`. This is the biggest defect on the page.**
`beachfront.css:3561-3563` (`._w-80pc { width: 80% }`) +
`beachfront.css:8426-8428` (`.su-w-full-mobile { width:100% }`, ≤767) resolve to
**1024 / 716.8 / 716 / 590.39 / 556.8 / 644.28 / 403.22 / 431.13 / 351** across
the 9 widths. Our build hard-codes `max-w-[1024px]`
(`src/routes/services/[slug]/+page.svelte:66`) inside a section padded
`px-5 md:px-12 lg:px-20`, which gives **738px at 834** — **147.6px (25%) too
wide**. From the measured reflow curve (§B.5) that is roughly **−140px of
column height**, which propagates in full to the pill, the CTA band and the
footer. It is also wrong in the other direction at 992 (our 1024-cap vs live's
716.8 → the 992 band's document height is 4679 on live). Width must be a
percentage of `.content-width`'s content box, with the 100% step at **767, not
768**.

**E2 — `.mt-6` and `.my-8` are three-tier root-font values; our build ships
two-tier hard-coded pixels, and puts one of them in `padding`.**
Live: `.mt-6` = `1.5rem` (`beachfront.css:3917-3919`) → **60 / 48 / 36**;
`.my-8` = `2rem` (`beachfront.css:3839-3842`) → **80 / 64 / 48**, symmetric,
**both sides margins that collapse**.
Our build (`+page.svelte:64` and `:88`): `mt-14 lg:mt-[100px]` (= 56 / 100) and
`mt-[86px] pb-[108px] lg:mt-[130px] lg:pb-[80px]`.
Resolved error, per width:

|                          | 1440                           | 992          | 834          | 768          | 390             |
| ------------------------ | ------------------------------ | ------------ | ------------ | ------------ | --------------- |
| body top: live / ours    | 60 / **100**                   | 48 / **100** | 48 / **56**  | 36 / **56**  | 36 / **56**     |
| pill top: live / ours    | 80 / **130**                   | 64 / **130** | 64 / **86**  | 48 / **86**  | 48 / **86**     |
| pill bottom: live / ours | 80 (margin) / **80 (padding)** | 64 / **108** | 64 / **108** | 48 / **108** | 48+60 / **108** |

Every cell is wrong except one, and the `pb-[108px]` is the fingerprint of a
probed number: 108 = `60 (button margin ≤767, beachfront.css:8636) + 48 (.my-8 at
root 24)` measured at 390 and then applied at **all** widths. Using `pb-` also
means the space cannot collapse and sits inside R2 instead of between regions
(§B.7).

**E3 — the hero has no ≤479 rule, so `.hero.reception` stays `70vw` at mobile
where every other hero on the site goes `95vw`.** `beachfront.css:5297` (33vw) →
`:7980-7982` (≤991 60vw) → `:8438-8440` (≤767 70vw), and the ≤479 block
(`:9072`, `:9078`, `:9082`, `:9088`, `:9093`) names `.redondo`, `.contact`,
`.group-photo`, `.home`, `.ask-a-dentist` — **never `.reception`**. Live at 390 is
**273px**; a shared detail-hero component applying 95vw renders **370.5px**, a
97.5px error at the very top of the page that shifts all eight census sections.
Also: 992 → **327.36px** vs 991 → **594.59px**, a 267px step nothing keyed at 768
can express.

**E4 — the hero photo is the per-service `<img>`, not the `.hero.reception` CSS
background.** `beachfront.css:5311` sets `…64b1ced3281a341a1cc50074_DSC_7625.jpg`
(the office/reception interior) but `img.hero-dynamic-image`
(`beachfront.css:6428-6433`: `object-fit:cover; width:100%; height:100%;
position:absolute`) covers it completely with
`…64d1402a4309c0bf7d84ce63_running-into-our-golden-years.jpg`
(`detail-svc.html:113`), from a **different CDN bucket**
(`64b1c843b071dc32170ea053`). Our template treats the reception photo as a
fallback (`+page.svelte:30-40`) — correct in shape, but any page where
`data.doc.data.media` is unfilled will show a photo live never shows here, and
the pixel gate will read it as a total hero miss.

**E5 — `.service-page-label`'s size ladder steps at 992 and 480, and its
container height follows.** `beachfront.css:6504-6506` contributes only `color`;
size comes from `h3` base `beachfront.css:2124-2132` (**40 / 50**), ≤991
`beachfront.css:7863-7866` (**21 / 26**), and the page-specific ≤479
`beachfront.css:9267-9269` (**20px**, line-height left at 26). Resolved
**40 / 40 / 21 / 21 / 21 / 21 / 21 / 20 / 20**. Because the three `h3`s are flex
items their `20px/10px` margins (`beachfront.css:2126-2127`) do not collapse, so
`.service-label-container` is **80 / 56 / 56** tall. A two-tier ladder keyed at
768 renders a 40px breadcrumb in an 80px box across all of 768–991, where live
renders 21px in a 56px box. The separator's `.mx-1` is a _rem_ (`.25rem`,
`beachfront.css:3854-3857`) → **10 / 8 / 6** — a fourth switch point.

**E6 — the lede columns stack at 767, not at 768, and the indent is an EMPTY
div.** `.col-1-of-3 {width:33%}` (`beachfront.css:6445-6447`) and
`.col-2-of-3 {width:66%}` (`beachfront.css:6440-6443`) have **no responsive rule
at all**; the stack comes solely from `.su-w-full-mobile`
(`beachfront.css:8426-8428`, **≤767**). At 768 live is still 2-up
(229.67 / 459.36) `[probed]`. A build that stacks at `md`/768 gives the lede
696px instead of 459.36px — a different wrap and a different section height in
the exact band this project keeps getting wrong. There is no `margin-left`
anywhere: reproduce the empty 33% spacer or the indent is unreproducible.

**E7 — `.text-body-large` has two switch points on one element: size at 991,
margin-bottom at 479.** `beachfront.css:7760-7765` (`margin-top:20px;
margin-bottom:40px; font-size:30px; line-height:1.5em`), `:8363-8365` (≤991
`font-size:20px`), `:9573-9576` (≤479 `margin-bottom:20px; font-size:20px`).
`h5` itself never changes (`beachfront.css:2144-2152`, no responsive rule). So
size is **30/20/20** but margin-bottom is **40/40/20**. A single-ladder
implementation gets one of the two wrong at 390. Note also `.text-body-large`
**wins over `h5`'s own `30px/40px`** on source order, so the line-height at 1440
is `1.5em` = **45px**, not 40px.

**E8 — the two U+200D paragraphs are real vertical space.**
`detail-svc.html:113` contains `<p>&zwj;</p>` twice (byte-verified U+200D).
Each renders `line-height + 10px margin` = **40 / 34 / 28px**; together
**80 / 68 / 56px**. Prismic rich-text serialisation routinely drops empty
paragraphs, which silently shortens the body block and drags the pill, CTA and
footer up. Any rich-text renderer must preserve them (or the space must be
reintroduced deliberately, and recorded in `LEDGER.md`).

**E9 — `.display-flex` carries `font-size: .6rem` only below 992.**
`beachfront.css:7890-7892`. Inherited font-size on the lede wrapper is **64px**
at ≥992 (body default, `beachfront.css:2098`), **19.2px** at 991–769, **14.4px**
at ≤768 `[probed]`. The `h5` overrides it for the visible text, but it sets the
flex line's strut and any bare-text metrics. A `.display-flex` utility with a
fixed font-size — or none — changes the line box at exactly the 991 seam.

**E10 — the reveal covers only the bottom half of the page, and its inline
`opacity:1` changes hover.** Only `c413430e-…` (rich text) and `fdaf2531-…`
(pill) carry `data-w-id` on this page (`detail-svc.html:113`); the hero, `h2`
title and lede do **not** (§D). Travel is `4rem` → **160 / 128 / 96px**, three
tiers. And because IX2 leaves `opacity: 1` inline, the pill's hover is
**bg-only** (`rgba(18,158,204,0.29)`), not the `opacity:.6` that
`beachfront.css:6042-6045` would give a static button `[probed]`.

**E11 — there is no `.form-modal` on this page, so both "Book" buttons are
no-ops.** Verified `[probed]` on the live DOM and absent from
`detail-svc.html`. `showForm` (`detail-svc.html:126-129`) is bound at
`detail-svc.html:135` against an empty set. Rendering a form modal here adds DOM
(and 7 controls) that live does not have — content diff plus a wrong Phase-5
interaction count.

**E12 — the wave's `rotate(180deg)` is on the wrapper and its height is a rem.**
`detail-svc.html:20-22` (wrapper transform), `:24-29`
(`svg { width: calc(133% + 1.3px); height: 3rem }`), `:32-34` (`fill:#FFFFFF`),
over `beachfront.css:6008-6016` (`z-index:8; bottom:0; overflow:hidden`). Height
**120 / 96 / 72**, width **1916.5 / 1110.52 / 520**, svg x **−476.5 / −276.52 /
−130** `[probed]`. Rotating the svg instead of the wrapper mirrors the crest to
the wrong side; the svg is **injected** at `detail-svc.html:123`, so shipping it
in markup _and_ porting the injector renders two waves.

**E13 — `.content-width`'s pad-x takes four values between 768 and 1440, and our
section uses Tailwind's.** Live `[probed]`: 60 (1440) / 48 (992) / 48 (991) /
48 (834) / **36 (768)** / **61.36 (767, 8%)** / 19.5 (390, 5%) —
`beachfront.css:5864-5865`, `:8627-8630`, `:9164-9167`. Our
`px-5 md:px-12 lg:px-20` (`+page.svelte:64`, `:88`) gives 20 / 48 / 80 and
matches live only at 834 and (coincidentally) at 1440. At 768 it is 48 vs 36; at
767 it is 48 vs 61.36; at 390 it is 20 vs 19.5. Since the rich-text column is a
_percentage of this box_ (E1), every pad-x error is also a column-width error.

---

### F. CITATION INDEX

Machine-counted over sections A–E of this file (a bare `:NNNN` resolves to the
file named immediately before it, which is how it reads in prose).

**`beachfront.css` — 62 distinct rule/marker lines:**
41, 424, 1672, 1686, 2047, 2098, 2102, 2106, 2114, 2124, 2126, 2144, 2166, 2174,
2181, 2953, 2984, 3023, 3561, 3839, 3840, 3841, 3854, 3917, 3921, 5295, 5297,
5310, 5311, 5836, 5858, 5864, 5866, 6008, 6009, 6028, 6039, 6042, 6047, 6090,
6428, 6440, 6445, 6477, 6484, 6492, 6504, 6508, 7390, 7651, 7760, 7761, 7852,
7858, 7863, 7877, 7890, 7980, 8045, 8049, 8092, 8363, 8372, 8378, 8386, 8409,
8426, 8438, 8447, 8627, 8632, 8636, 9011, 9012, 9018, 9072, 9078, 9082, 9088,
9093, 9164, 9173, 9267, 9573, 9611.

**`detail-svc.html` — 20 distinct lines:**
1, 3, 8, 12, 16, 20, 24, 32, 61, 62, 64, 68, 72, 77, 84, 113, 117, 123, 126, 135,
138, 142, 149.

**`src/routes/services/[slug]/+page.svelte` — 4:** 30, 64, 66, 88.
**`src/app.css` — 1:** 32.

---

## `[probed-only]` inventory

Values with NO stylesheet line. They were read off the rendered reference
and must be re-derived if anything upstream changes — never copied blindly
into a fix, and never cited as though they were a rule (repo CLAUDE.md
rule 1).

13. `svc.md:13` — shrink-to-fit text reflow) are tagged `[probed-only]` / `[probed]` and are the
14. `svc.md:152` — | IX2 `a-7` travel `4rem` | `[probed-only]`, §D | **160px** | **128px** | **96px** |
15. `svc.md:774` — plus the page's own jQuery. `[probed-only]` — IX2 data ships inside the Webflow
