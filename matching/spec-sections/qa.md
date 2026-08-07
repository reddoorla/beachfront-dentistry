## qa — Q&A / blog detail template (`/questions/<slug>`)

Page: `/questions/regular-dental-cleanings-support-your-whole-body-health`
Live: <https://www.beachfrontdentistry.com/questions/regular-dental-cleanings-support-your-whole-body-health>
Local HTML: `matching/spec/detail-qa.html` (149 lines; the whole `<body>` is the
single minified line `detail-qa.html:113`, so every markup citation below that
points at `:113` means "inside that one line" — the surrounding structure is
quoted inline so it is greppable).
Webflow item: `data-wf-item-slug="regular-dental-cleanings-support-your-whole-body-health"`,
collection `655680f0c897c56b081e9176`, page id `655680f0c897c56b081e91c9`
(`detail-qa.html:1`).

**Governing rule (CLAUDE.md #1): source prescribes, rects only verify.** Every
geometry/type value below carries a `beachfront.css:<line>` or
`detail-qa.html:<line>` citation. Values that exist only as computed output
(Webflow IX2 inline styles, margin-collapse results, `vw`/`%` resolution,
shrink-to-fit widths, srcset selection) are tagged `[probed-only]` and are the
only numbers here without a line.

Shared nav / closing-CTA / footer are **not** re-specced here — see
`matching/spec-sections/_chrome.md` §1 (root-font ladder), §2 (`.content-width`),
§3 (nav + form modal), §4 (CTA band), §5 (footer), §6 (button pattern),
§7 (hover census).

Probe: Playwright chromium, 12 widths (1440 / 1200 / 993 / 992 / 991 / 834 /
769 / 768 / 767 / 480 / 479 / 390), `waitUntil:"networkidle"`, scrolled in 250px
steps @80ms, then held until `document.getAnimations()` reported nothing
running plus a 400ms settle. The article body and the "Have another question?"
button both reveal on scroll with a **2000ms outExpo** — an unsettled read has
the sign of their y-offset wrong. Probe scripts:
`/private/tmp/.../scratchpad/probe-qa.mjs`, `probe-qa2.mjs`.

---

### A. SECTION CENSUS

y values are the **section border-box top** at 1440 (page coords, settled).
Where the anchor text sits below the box top, the anchor y is given too.
All anchors verified **unique** on this page (`body.innerText.split(t).length-1
=== 1` for every row) and comma-free.

| #   | label                                                                              | anchor (unique, comma-free)                     | y@1440                               | owner          |
| --- | ---------------------------------------------------------------------------------- | ----------------------------------------------- | ------------------------------------ | -------------- |
| 1   | Header / nav bar `section.header`                                                  | _(no unique text — anchor by `section.header`)_ | 0 (h 120)                            | **chrome §3**  |
| 2   | Hero band `section.hero` — photo + 2 gradients + JS-injected wave + blog back-link | `Blog / View All Posts`                         | 0 (h 475.19); anchor y 367.67        | this file §B.2 |
| 3   | Page title `h2.heading-30`                                                         | `Beyond the Smile`                              | 495.19 (h 380)                       | this file §B.3 |
| 4   | Lede row `.display-flex` — empty `.col-1-of-3` + `h5.text-body-large`              | `Here in beautiful Redondo Beach`               | 885.19 (h 285); anchor y 905.19      | this file §B.4 |
| 5   | Article body `section.dynamic-content-section`                                     | `At Beachfront Dentistry`                       | 1170.19 (h 1134)                     | this file §B.5 |
| 6   | "Have another question?" band `section.other-questions-section`                    | `Have another question`                         | 2384.19 (h 67)                       | this file §B.6 |
| 7   | Closing CTA band                                                                   | `Ready for great`                               | 2491.19 (h 1200 to fiji bottom)      | **chrome §4**  |
| 8   | Footer `.footer-info-section`                                                      | `Want to learn more`                            | 3691.19 (h 714.41); anchor y 3711.19 | **chrome §5**  |

**CENSUS SECTION COUNT: 8** (5 unique to this page: 2, 3, 4, 5, 6 — of which
**3 and 4 share the single `section.headings-section` element**; 3 are chrome).

Section-element y/h at the gate matrix `[probed]`:

| element                           | 1440                 | 834                  | 390                   |
| --------------------------------- | -------------------- | -------------------- | --------------------- |
| `section.header`                  | y 0 h 120            | y 0 h 96             | y 0 h 72              |
| `section.hero`                    | y 0 h **475.19**     | y 0 h **500.39**     | y 0 h **273**         |
| `section.headings-section`        | y 495.19 h **675**   | y 520.39 h **870**   | y 293 h **610**       |
| ‣ `h2.heading-30`                 | y 495.19 h 380       | y 520.39 h **620**   | y 293 h 320           |
| ‣ `.display-flex` (lede row)      | y 885.19 h 285       | y 1150.39 h 240      | y 623 h 280           |
| `section.dynamic-content-section` | y 1170.19 h **1134** | y 1390.39 h **1080** | y 903 h **958.72**    |
| `section.other-questions-section` | y 2384.19 h **67**   | y 2534.39 h **54**   | y 1909.72 h **38.38** |
| `section.footer` (CTA + footer)   | y 2491.19 h 1914.41  | y 2620.39 h 1811.02  | y 1972.09 h 1562.59   |
| ‣ `.footer-info-section`          | y 3691.19 h 714.41   | y 3449 h 982.41      | y 2410.09 h 1124.59   |
| document height                   | **4406**             | **4431**             | **3535**              |

Note 834 is _taller_ than 1440 overall (4431 vs 4406) — driven entirely by
`h2.heading-30` staying at 100px while the column narrows to 738px (§B.3).

#### A.1 Gate-region map — where a small defect can hide

`matching/gate.sh:88-90` cuts this page at
`At Beachfront Dentistry,Have another question,Ready for great,Want to learn more`
→ **4 anchors, 5 regions**:

| region | span @1440                      | px              | % of page | census rows inside    |
| ------ | ------------------------------- | --------------- | --------- | --------------------- |
| R0     | top → `At Beachfront Dentistry` | 0–1170.19       | **26.6%** | **1, 2, 3, 4** ← four |
| R1     | → `Have another question`       | 1170.19–2384.19 | 27.6%     | 5                     |
| R2     | → `Ready for great`             | 2384.19–2491.19 | **2.4%**  | 6                     |
| R3     | → `Want to learn more`          | 2491.19–3711.19 | 27.7%     | 7 (chrome)            |
| R4     | → end                           | 3711.19–4405.59 | 15.8%     | 8 (chrome)            |

**R0 is the dilution trap on this page.** It contains the whole hero _and_ the
whole headings section. Worked examples at the 0.10 threshold:

- The blog back-link `h3` is an 80px-tall box in a 1170px region → **6.8%**.
  Getting its three-tier size ladder wrong (§E.2) moves only that box, so at
  834 the whole 24px type error is ≈ 3% of R0 — **under threshold, invisible**.
- The hero's own height error (§E.1) is 267px at 992/991 → would blow R0 wide
  open, but 992/991 is not in the gate matrix; at 834 a two-tier build renders
  33vw = 275px against live's 60vw = 500px, a 225px shift that _does_ register.
- `h2.heading-30` is 380/1170 = **32%** of R0, so a size error there shows.

Conversely **R2 is only 107px tall**, so the "Have another question?" button is
gated at near-1:1 — a 2px padding error is ~2% of the region and a wrong
font-size tier is instantly fatal. Do not let R2's easiness create confidence
about R0.

#### A.2 The four inter-section gaps — every one of them is a _margin_, not padding

`section.headings-section`, `section.dynamic-content-section` and
`section.other-questions-section` have **no rule anywhere in
`beachfront.css`** (verified: `grep -n 'headings-section\|dynamic-content-section\|other-questions-section' beachfront.css`
returns nothing). They are bare `<section>` — `display:block` only, from the
normalize block `beachfront.css:11-13`. Zero padding, zero border. So **every**
vertical gap on this page is a child margin that has collapsed _out_ of its
section box, and the gate cuts on the section box.

| boundary                                          | 1440   | 834    | 390    | what owns it                                                                           | source                                |
| ------------------------------------------------- | ------ | ------ | ------ | -------------------------------------------------------------------------------------- | ------------------------------------- |
| hero ⟶ headings-section                           | **20** | **20** | **20** | `h2 { margin-top: 20px }` collapsed up out of the section                              | `beachfront.css:2116`                 |
| headings-section ⟶ dynamic-content-section        | **0**  | **0**  | **0**  | nothing escapes — see below                                                            | `beachfront.css:3023-3026`            |
| dynamic-content-section ⟶ other-questions-section | **80** | **64** | **48** | `.dynamic-content-body { margin-bottom: 2rem }` collapsed down out of the section      | `beachfront.css:7647`                 |
| other-questions-section ⟶ footer                  | **40** | **32** | **24** | CTA `h2.my-4 { margin-top: 1rem }` collapsed up through the zero-height `.cta-section` | `beachfront.css:3824-3827`; chrome §4 |

Three structural facts a rebuild will get wrong if it uses padding:

1. **The 20px hero→title gap lives ABOVE the headings-section box.** It is in
   gate region R0 either way, but the section's own `y` is 495.19, not 475.19.
   `.heading-30`'s `padding-top: 20px` (`beachfront.css:7847`) is a _separate_
   20px that sits INSIDE the h2 box and does not collapse. Total optical
   lead-in from hero bottom to the h2's line box is 20 (margin) + 20 (padding).
2. **The lede's `margin-bottom: 40px` does NOT escape.** `.text-body-large`
   declares it (`beachfront.css:7762`), but the lede sits inside
   `.col-2-of-3`, which is a flex item of `.display-flex`
   (`beachfront.css:3023-3026`) and therefore a BFC root. The 40px is trapped
   inside `.col-2-of-3`'s height. That is why headings-section and
   dynamic-content-section are flush at every width. A build that puts the lede
   in a non-flex wrapper leaks 40px into the R0/R1 boundary.
3. **The 2rem gap below the article steps on the ROOT ladder, not the Webflow
   ladder** — 80 ≥993 / 64 at 992–769 / 48 ≤768 `[probed across 12 widths]`.
   It changes at **992** and **768**, one pixel off from every Webflow tier on
   this page. See §E.6.

---

### B. PER-SECTION SPEC

#### B.0 Type stack + the root-font ladder (recap)

Fonts are Typekit `museo-slab` / `museo-sans`, loaded by
`https://use.typekit.net/tao4byj.js` (`detail-qa.html:1`). `WebFont.load` also
pulls Lato + Montserrat (`detail-qa.html:1`) — **neither is used by any rule on
this page**; do not ship them as a match requirement.

Base: `body { color:#333; font-family: museo-sans, sans-serif; font-size:64px;
font-weight:300; line-height:1.2em }` `beachfront.css:2096-2102`.

**`line-height: 1.2em` on `body` computes to a fixed `76.8px` and inherits as a
length.** Every element on this page that does not declare its own line-height
renders at 76.8px, at _all three widths_ (`.dynamic-content-body` and the `<ol>`
both measure `line-height: 76.8px` at 1440/834/390 `[probed]`). A rebuild that
writes `line-height: 1.2` (unitless) instead of `1.2em` inherits a _ratio_ and
silently changes every such box.

CSS variables `beachfront.css:2047-2053`:
`--primary:#129ecc` · `--primary-dark:#365b6d` · `--primary-light:#e7f5fa` ·
`--secondary:#b6aa91` · `--secondary-dark:#2b2a29` · `--secondary-light:#cecece`.

Root-font ladder (chrome §1) is re-declared in this page's own head:
`html{font-size:40px}` `detail-qa.html:3-5` (repeated `:62`);
`@media(max-width:992px){32px}` `detail-qa.html:8-10` (repeated `:64-66`);
`@media(max-width:768px){24px}` `detail-qa.html:12-14` (repeated `:68-70`);
`@media(max-width:480px){24px}` `detail-qa.html:16-18` (repeated `:72-74`, no-op).
Webflow class breaks are `beachfront.css:7852` (991), `:8372` (767),
`:9011` (479), `:9611` (second 991). **Offset by 1px → three px values per rem.**

`.content-width` (chrome §2) is used unmodified by all four page sections
(`detail-qa.html:113`). Verified identical here `[probed]`:
pad-x **60 / 48 / 19.5**, box `{x:20,w:1400}` / `{x:0,w:834}` / `{x:0,w:390}`,
content column **1280 / 738 / 351**.

---

#### B.1 Header / nav bar (census 1) — chrome

Not re-specced; see chrome §3. `section.header` markup on this page
(`detail-qa.html:113`) differs from `index.html`'s only in its `data-w-id`
GUIDs (`d74a87ea-f9c1-d0eb-6fb6-c8992fcf73c0` open, `8dfa6638-f698-fdd7-603c-6f04af7990e4`
close) and in carrying **no** `w--current` (§B.7). It is `position:absolute`
over the hero — both boxes start at `y = 0` — h **120 / 96 / 72** `[probed]`.

---

#### B.2 Hero band — `section.hero` (census 2)

Markup (`detail-qa.html:113`), five stacked children in this order:

```
<section class="hero">
  <img class="hero-dynamic-image" sizes="100vw" srcset="…7 widths…">
  <div class="hero-top-gradient"></div>
  <div class="hero-bot-gradient"></div>
  <div class="bot-wave click-through"></div>     ← EMPTY in source; SVG injected by JS
  <div class="content-width">
    <div class="service-label-container">
      <a href="/ask-the-doctor" class="text-color-white w-inline-block">
        <h3 class="text-color-white">Blog / View All Posts</h3>
      </a>
    </div>
  </div>
</section>
```

**B.2.1 The hero height ladder — THREE tiers, all `vw`, all Webflow-keyed**

| tier        | declaration                                                                   | source                     |
| ----------- | ----------------------------------------------------------------------------- | -------------------------- |
| base (≥992) | `.hero { align-items:center; height:33vw; display:block; position:relative }` | `beachfront.css:5295-5300` |
| ≤991        | `.hero, .hero.redondo { height: 60vw }`                                       | `beachfront.css:7980-7982` |
| ≤767        | `.hero { height: 70vw }`                                                      | `beachfront.css:8438-8440` |

There is **no `.hero` rule in the ≤479 block** (`beachfront.css:9072` and below
only touch `.hero.redondo/.contact/.group-photo/.home/.ask-a-dentist`), so 70vw
runs all the way to 0.

Measured across 12 widths `[probed]` — note the 267px cliff at 992→991:

| vw     | 1440   | 1200 | 993    | **992**    | **991**    | 834    | 769    | **768** | **767**    | 480  | 479    | 390  |
| ------ | ------ | ---- | ------ | ---------- | ---------- | ------ | ------ | ------- | ---------- | ---- | ------ | ---- |
| height | 475.19 | 396  | 327.69 | **327.36** | **594.59** | 500.39 | 461.39 | 460.8   | **536.89** | 336  | 335.30 | 273  |
| rule   | 33vw   | 33vw | 33vw   | 33vw       | 60vw       | 60vw   | 60vw   | 60vw    | 70vw       | 70vw | 70vw   | 70vw |

Gate matrix: **475.19 / 500.39 / 273**.

**B.2.2 Photo**

`.hero-dynamic-image` `beachfront.css:6428-6433`:
`object-fit:cover; width:100%; height:100%; position:absolute` (no `top/left` —
static-position resolves to the hero's padding box origin, i.e. 0,0).

Asset — real file, never redraw (`detail-qa.html:113`):

```
https://cdn.prod.website-files.com/64b1c843b071dc32170ea053/689bb3f231f2003a4066605c_couple_running_in_beach-cropped.jpg
```

`srcset` ships 7 renditions: `-p-500` 500w, `-p-800` 800w, `-p-1080` 1080w,
`-p-1600` 1600w, `-p-2000` 2000w, `-p-2600` 2600w, and the 3020w original.
`sizes="100vw"`, `loading="lazy"`, `alt=""`.
Selection at DPR 1 `[probed-only]`: 1440→`-p-1600`, 1200→`-p-1600`,
993…834→`-p-1080`, 769…767→`-p-800`, 480…390→`-p-500`. This is the OG/Twitter
image too (`detail-qa.html:1`), so it is the CMS `Featured Image` field.

**B.2.3 The two gradient overlays**

| element              | declaration                                                                                                | source                     | resolved h (1440/834/390)                                |
| -------------------- | ---------------------------------------------------------------------------------------------------------- | -------------------------- | -------------------------------------------------------- |
| `.hero-top-gradient` | `background-image: linear-gradient(#129ecccc, #0000); width:100%; height:25%; position:absolute`           | `beachfront.css:6477-6482` | **118.80 / 125.09 / 68.25**, y 0                         |
| `.hero-bot-gradient` | `background-image: linear-gradient(#0000, #129ecccc); width:100%; height:50%; position:absolute; bottom:0` | `beachfront.css:6484-6490` | **237.59 / 250.19 / 136.50**, y 237.59 / 250.20 / 136.50 |

`#129ecccc` = `rgba(18,158,204,0.8)` — verified as the computed
`linear-gradient(rgba(18, 158, 204, 0.8), rgba(0, 0, 0, 0))` at all three widths.
This page uses the **bare** `.hero-bot-gradient`; the `.dark` / `.home` /
`.home-blue` variants (`beachfront.css:6492-6502`) are NOT applied.

**B.2.4 The bottom wave — JS-injected, 180°-rotated on the PARENT, white fill**

The `<div class="bot-wave click-through">` is **empty in the served HTML**.
jQuery appends the SVG at runtime:

```js
$(".bot-wave").append(' <svg data-name="Layer 1" xmlns="…" viewBox="0 0 1200 120"
  preserveAspectRatio="none"> <path d="M321.39,56.44c58-10.79,…Z" class="shape-fill"></path></svg> ');
```

`detail-qa.html:120-123`. **This is JS-injected DOM** — a static rebuild must
emit the `<svg>` itself, and must keep the exact 8-command path (identical to
the footer divider path at `detail-qa.html:115`, and to `matching/spec/live-*.svg`
siblings).

Box:

- `.bot-wave` `beachfront.css:6008-6016`: `z-index:8; width:100%; line-height:0;
position:absolute; bottom:0; left:0; overflow:hidden`
- `.bot-wave { transform: rotate(180deg) }` — **on the wrapper, not the svg** —
  `detail-qa.html:20-22`
- `.bot-wave svg { position:relative; display:block; width:calc(133% + 1.3px);
height:3rem }` `detail-qa.html:24-29`
- `.bot-wave .shape-fill { fill:#FFFFFF }` `detail-qa.html:32-34`
- `.click-through { pointer-events:none }` `detail-qa.html:81-83`
- `.bot-wave.flip` (`beachfront.css:6018-6022`) is **not** applied here.

Resolved `[probed]`:

|                          | 1440                             | 834                            | 390                         |
| ------------------------ | -------------------------------- | ------------------------------ | --------------------------- |
| `.bot-wave` rect         | `{x:0, y:355.19, w:1440, h:120}` | `{x:0, y:404.39, w:834, h:96}` | `{x:0, y:201, w:390, h:72}` |
| svg height (`3rem`)      | **120**                          | **96**                         | **72**                      |
| svg width (`133%+1.3px`) | **1916.5**                       | **1110.52**                    | **520**                     |
| svg rect x               | **−476.5**                       | **−276.52**                    | **−130**                    |
| computed transform       | `matrix(-1, 0, 0, -1, 0, 0)`     | ←                              | ←                           |

The negative svg `x` is the whole point: the svg is laid out at `left:0` inside
a 1440-wide wrapper and _then_ the wrapper is rotated 180°, so the visible
1440px is the **mirrored left 75% of the path**, flush to the wrapper's right
edge. A rebuild that centers the svg, or that applies `rotate(180deg)` to the
`<svg>` instead of the wrapper, produces a different wave silhouette at the
same box size — the exact class of defect chrome §4.6 documents for the footer
divider.

The wave's `3rem` height steps on the **root** ladder (992/768), while the hero
height it sits inside steps on the **Webflow** ladder (991/767). At 992 the
wave is 96px inside a 327px hero; at 991 it is 96px inside a 595px hero.

**B.2.5 The blog back-link — `Blog / View All Posts`**

`.service-label-container` `beachfront.css:6508-6512`:
`display:flex; position:absolute; bottom:10%`. No `left` — static-position
resolves against the `.content-width` padding box, so its x is exactly the
container's `padding-left` `[probed]`: **80 / 48 / 19.5** (the 1440 value is
20 margin + 60 padding). No override in any media block.

The `<a class="text-color-white w-inline-block">`:

- `.text-color-white` `beachfront.css:4429-4434`: `z-index:5; color:#fff;
text-decoration:none; position:relative`
- `.w-inline-block` `beachfront.css:246-249`: `max-width:100%; display:inline-block`
  (blockified to `display:block` as a flex item `[probed-only]`)
- **`a` base** `beachfront.css:2174-2179`: `color: var(--primary);
background-color:#129ecc0d; border-radius:5px; transition: opacity .2s`

**The `a` base ships a `rgba(18,158,204,0.05)` wash and a 5px radius on this
link** — verified computed `background-color: rgba(18, 158, 204, 0.05)`,
`border-radius: 5px` at all three widths. It is faint but it is real, it is the
full 390×80 / 205×56 box, and it is not overridden by `.text-color-white`.

The `<h3 class="text-color-white">`:

- `h1…h6` reset `beachfront.css:383-386`: `margin-bottom:10px; font-weight:bold`
- `h3` reset `beachfront.css:400-404`: `margin-top:20px; font-size:24px; line-height:30px`
- `h3` theme `beachfront.css:2124-2132`: `color: var(--primary); margin:20px 0 10px;
font-family: museo-slab, sans-serif; font-size:40px; font-weight:300; line-height:50px`
- ≤991 `h3 { font-size:21px; line-height:26px }` `beachfront.css:7863-7866`
- **no `h3` rule in the ≤767 or ≤479 blocks** — 21/26 runs to 0

|                            | 1440                         | 834                        | 390                          |
| -------------------------- | ---------------------------- | -------------------------- | ---------------------------- |
| family / weight            | museo-slab / 300             | ←                          | ←                            |
| font-size                  | **40px**                     | **21px**                   | **21px**                     |
| line-height                | **50px**                     | **26px**                   | **26px**                     |
| colour                     | `#fff` (`:4430`)             | ←                          | ←                            |
| letter-spacing / transform | normal / none                | ←                          | ←                            |
| margin                     | `20px 0 10px` (`:2126-2127`) | ←                          | ←                            |
| h3 rect                    | `{80, 367.67, 390.28, 50}`   | `{48, 414.36, 204.91, 26}` | `{19.5, 209.70, 204.91, 26}` |
| `a` / container rect       | `{80, 347.67, 390.28, 80}`   | `{48, 394.36, 204.91, 56}` | `{19.5, 189.70, 204.91, 56}` |
| container `bottom:10%` →   | **47.52**                    | **50.03**                  | **27.30**                    |

Container height = h3 margin-top 20 + h3 height + margin-bottom 10 (flex item →
BFC → margins do not collapse out): **80 / 56 / 56**.
Sweep confirms the 991 break, not 767 `[probed]`: 40px at 1440/1200/993/**992**,
21px from **991** down.

**B.2.6 Stacking order — the wave paints OVER the link**

`.bot-wave` `z-index:8` (`beachfront.css:6009`) vs the link's `z-index:5`
(`beachfront.css:4430`). At 1440 the link box is y 347.67–427.67 and the wave
box is y 355.19–475.19 — they overlap by 72px, and the white `shape-fill` wins.
This is correct on live; do not "fix" the z-order to lift the label clear.

---

#### B.3 Page title — `h2.heading-30` (census 3)

Markup: `<h2 class="heading-30">Beyond the Smile: Supporting Your Whole-Body Health</h2>`
(`detail-qa.html:113`). Plain text, **no `<br>`** — unlike the CTA h2 (chrome §4.1).

Cascade:

- `h1…h6` reset `beachfront.css:383-386`: `margin-bottom:10px; font-weight:bold`
- `h2` reset `beachfront.css:394-398`: `margin-top:20px; font-size:32px; line-height:36px`
- `h2` theme `beachfront.css:2114-2122`: `color: var(--primary); margin:20px 0 10px;
font-family: museo-slab, sans-serif; font-size:140px; font-weight:100; line-height:168px`
- **`.heading-30` `beachfront.css:7846-7850`: `padding-top:20px; font-size:100px;
line-height:1.2em`**
- ≤991 `h2 { font-size:72px; line-height:80px }` `beachfront.css:7858-7861`
  — **loses to `.heading-30` on specificity (class > element), so it never applies here**
- ≤479 `h2 { overflow-wrap:anywhere; font-size:56px; line-height:70px }`
  `beachfront.css:9012-9016` — the two size declarations again lose to
  `.heading-30`, but **`overflow-wrap: anywhere` has no class-level competitor
  and DOES apply** `[probed: computed "anywhere" at 479 and 390, "normal" at 480+]`
- ≤479 `.heading-30 { font-size:50px; line-height:1.2em }` `beachfront.css:9601-9604`

|                                    | 1440                       | 834       | 390          |
| ---------------------------------- | -------------------------- | --------- | ------------ |
| family / weight                    | museo-slab / **100**       | ←         | ←            |
| font-size                          | **100px**                  | **100px** | **50px**     |
| line-height (`1.2em`)              | **120px**                  | **120px** | **60px**     |
| colour                             | `var(--primary)` `#129ecc` | ←         | ←            |
| letter-spacing / transform / align | normal / none / start      | ←         | ←            |
| margin-top / bottom                | 20 / 10                    | 20 / 10   | 20 / 10      |
| padding-top                        | **20**                     | **20**    | **20**       |
| `overflow-wrap`                    | normal                     | normal    | **anywhere** |
| box width (= content column)       | 1280                       | 738       | 351          |
| lines                              | 3                          | **5**     | 5            |
| box height (20 + lines×lh)         | **380**                    | **620**   | **320**      |

**Full sweep — the size does not move until 479** `[probed]`:

| vw        | 1440 | 1200 | 993 | 992 | 991 | 834 | 769 | 768 | 767 | 480     | **479** | 390 |
| --------- | ---- | ---- | --- | --- | --- | --- | --- | --- | --- | ------- | ------- | --- |
| font-size | 100  | 100  | 100 | 100 | 100 | 100 | 100 | 100 | 100 | **100** | **50**  | 50  |

Live renders a **100px** headline in a 351–644px column across the whole
480–767 band. That is not a mistake in the reading — it is what the specificity
of `.heading-30` produces, and it is why 834 is the tallest of the three gate
widths. See §E.3.

---

#### B.4 Lede row — `.display-flex` > `.col-1-of-3` + `.col-2-of-3` (census 4)

Markup (`detail-qa.html:113`):

```
<div class="display-flex">
  <div class="col-1-of-3 su-w-full-mobile"></div>     ← EMPTY spacer, no content
  <div class="col-2-of-3 su-w-full-mobile">
    <h5 class="text-body-large">Here in beautiful Redondo Beach, …</h5>
  </div>
</div>
```

**B.4.1 The columns**

| selector                 | declarations                                   | source                     |
| ------------------------ | ---------------------------------------------- | -------------------------- |
| `.display-flex`          | `flex-wrap: wrap; display: flex`               | `beachfront.css:3023-3026` |
| ≤991                     | `.display-flex { font-size: .6rem }`           | `beachfront.css:7890-7892` |
| ≤767                     | `.display-flex { flex-wrap: wrap }` (restated) | `beachfront.css:8386-8388` |
| `.col-1-of-3`            | `width: 33%`                                   | `beachfront.css:6445-6447` |
| `.col-2-of-3`            | `width: 66%; position: relative`               | `beachfront.css:6440-6443` |
| `.su-w-full-mobile` ≤767 | `width: 100%`                                  | `beachfront.css:8426-8428` |

`.su-w-full-mobile` fires at **767**, not 991. Resolved `[probed]`:

|                           | 1440                | 834              | 390                    |
| ------------------------- | ------------------- | ---------------- | ---------------------- |
| `.col-1-of-3` w           | 422.39 (33%)        | 243.53 (33%)     | **351 (100%)**         |
| `.col-2-of-3` w           | 844.80 (66%)        | 487.08 (66%)     | **351 (100%)**         |
| `.col-1-of-3` h           | 285 (flex stretch)  | 240              | **0** (wrapped, empty) |
| layout                    | side-by-side        | **side-by-side** | stacked (wraps)        |
| row `font-size` (`.6rem`) | 64 (inherited body) | **19.2**         | **14.4**               |

At 834 the two columns are still **side by side at 33/66** — a build that
stacks them at md is wrong by 487px of column width. Full sweep of `.col-1-of-3`
width: 422.39 (1440) · 356.39 (1200) · 288.08 (993) · 295.67 (992) · 295.34
(991) · 243.53 (834) · 222.08 (769) · 229.67 (768) · **644.28 (767)** · 403.22
(480) · 431.13 (479) · 351 (390).

The `.6rem` font-size at ≤991 is inherited by both columns (19.2 / 14.4px) and
is overridden on the lede itself, so it is only visible to em-based descendants
— but reproduce it, because it is the row's inherited size.

**B.4.2 The lede `h5.text-body-large`**

Text (`detail-qa.html:113`): "Here in beautiful Redondo Beach, it's easy to
prioritize self-care—whether it's a sunset walk, a fresh smoothie, or some ocean
air to recharge. But one of the most important (and often overlooked) parts of
your overall wellness? Regular dental cleanings." Note the em-dash and the two
curly apostrophes (`&#x27;` in source for the second one).

Cascade:

- `h1…h6` reset `beachfront.css:383-386`; `h5` reset `beachfront.css:412-416`
- `h5` theme `beachfront.css:2144-2152`: `color: var(--primary); margin:10px 0;
font-family: museo-slab, sans-serif; font-size:30px; font-weight:300; line-height:40px`
- **there is no `h5` override in the ≤991, ≤767 or ≤479 blocks** (chrome §5.1
  proves the same for `.footer-learn-more`) — all movement comes from the class
- `.text-body-large` `beachfront.css:7760-7765`: `margin-top:20px;
margin-bottom:40px; font-size:30px; line-height:1.5em`
- ≤991 `.text-body-large { font-size: 20px }` `beachfront.css:8363-8365`
- ≤479 `.text-body-large { margin-bottom:20px; font-size:20px }` `beachfront.css:9573-9576`
- the `.max-w-32` / `._w-half.max-w-490px` / `.text-color-primary.mt-8._w-620px`
  variants (`beachfront.css:7767-7777`) are **not** applied here

|                       | 1440                            | 834                              | 390                     |
| --------------------- | ------------------------------- | -------------------------------- | ----------------------- |
| family / weight       | museo-slab / 300                | ←                                | ←                       |
| font-size             | **30px**                        | **20px**                         | **20px**                |
| line-height (`1.5em`) | **45px**                        | **30px**                         | **30px**                |
| colour                | `var(--primary)` `#129ecc`      | ←                                | ←                       |
| margin-top            | 20                              | 20                               | 20                      |
| margin-bottom         | **40**                          | **40**                           | **20**                  |
| rect                  | `{502.39, 905.19, 844.80, 225}` | `{291.53, 1170.39, 487.08, 180}` | `{19.5, 643, 351, 240}` |
| lines                 | 5                               | 6                                | 8                       |

Sweep: 30px down to **992**, 20px from **991**; margin-bottom 40 down to **480**,
20 from **479** `[probed]`. Two different breakpoints on one element.

---

#### B.5 Article body — `section.dynamic-content-section` (census 5)

Markup (`detail-qa.html:113`):

```
<section class="dynamic-content-section"><div class="content-width">
  <div data-w-id="12109889-0f86-9f5f-65a7-d6d1ec131029"
       style="…transform:translate3d(0, 4rem, 0)…;opacity:0"
       class="dynamic-content-body _w-80pc su-w-full-tablet w-richtext"> … </div>
</div></section>
```

**B.5.1 The rich-text container**

| selector                                         | declarations                                                                        | source                     |
| ------------------------------------------------ | ----------------------------------------------------------------------------------- | -------------------------- |
| `.dynamic-content-body`                          | `margin-top:2rem` `:7646` · `margin-bottom:2rem` `:7647` · `font-size:30px` `:7648` | `beachfront.css:7645-7649` |
| `.dynamic-content-body._w-80pc.su-w-full-tablet` | **`margin-top: 0`**                                                                 | `beachfront.css:7651-7653` |
| `._w-80pc`                                       | `width: 80%`                                                                        | `beachfront.css:3561-3563` |
| `.su-w-full-tablet` ≤991                         | `width: 100%`                                                                       | `beachfront.css:8215-8217` |
| `.su-w-full-tablet` ≤767                         | `width: 100%` (restated)                                                            | `beachfront.css:8769-8771` |
| `.w-richtext:before, .w-richtext:after`          | `content:" "; grid-area:1/1/2/2; display:table`                                     | `beachfront.css:1672-1676` |
| `.w-richtext:after`                              | `clear: both`                                                                       | `beachfront.css:1678-1680` |
| `.w-richtext ol, .w-richtext ul`                 | `overflow: hidden`                                                                  | `beachfront.css:1686-1688` |

**`.w-richtext`'s `display:table` pseudo-elements are load-bearing.** They sit
at both ends of the flow and block margin collapse through the container, so
the last `<p>`'s `margin-bottom:10px` (`beachfront.css:424-427`) stays _inside_
`.dynamic-content-body` instead of collapsing away. Measured proof at 1440
`[probed]`: last `<p>` bottom 2294.19, `.dynamic-content-body` bottom 2304.19 —
exactly 10px of trapped margin. Drop the pseudo-elements and the section is 10px
short at every width and the 2rem gap below it double-counts.

|                                           | 1440                   | 834            | 390            |
| ----------------------------------------- | ---------------------- | -------------- | -------------- |
| width                                     | **1024** (80% of 1280) | **738** (100%) | **351** (100%) |
| margin-top                                | 0                      | 0              | 0              |
| margin-bottom (`2rem`)                    | **80**                 | **64**         | **48**         |
| own font-size                             | 30px                   | 30px           | 30px           |
| own line-height (inherited `1.2em` of 64) | **76.8px**             | ←              | ←              |
| box height                                | 1134                   | 1080           | 958.72         |

Width sweep `[probed]`: 1024 (1440) · 864 (1200) · 698.39 (993) · **716.80
(992)** · 895 (991) · 738 (834) · 673 (769) · 696 (768) · 644.28 (767) ·
403.22 (480) · 431.13 (479) · 351 (390). The 992 row is 80% because
`.su-w-full-tablet` has not fired yet; the 991 row is 100%.

**B.5.2 Rich-text child typography — `p` and `li` DIVERGE in the 768–991 band**

| selector       | declarations                                                                                         | source                     |
| -------------- | ---------------------------------------------------------------------------------------------------- | -------------------------- |
| `p` reset      | `margin-top:0; margin-bottom:10px`                                                                   | `beachfront.css:424-427`   |
| `p` theme      | `color: var(--primary-dark); margin-bottom:10px; font-size:20px; font-weight:300; line-height:1.5em` | `beachfront.css:2166-2172` |
| `p` ≤991       | `font-size: 16px`                                                                                    | `beachfront.css:7877-7879` |
| `p` ≤767       | `font-size: 16px` (restated)                                                                         | `beachfront.css:8378-8380` |
| `p` ≤479       | `font-size: 12px`                                                                                    | `beachfront.css:9018-9020` |
| `ul, ol` reset | `margin-top:0; margin-bottom:10px; padding-left:40px`                                                | `beachfront.css:446-450`   |
| `ul` theme     | `margin-top:0; margin-bottom:10px; padding-left:40px; font-size:24px` — **`ul` only, NOT `ol`**      | `beachfront.css:2185-2190` |
| `li`           | `color: var(--primary-dark); font-size:20px; line-height:1.8em`                                      | `beachfront.css:2192-2196` |
| `li` ≤767      | `font-size: 12px` — **there is NO `li` rule at ≤991**                                                | `beachfront.css:8382-8384` |
| `b, strong`    | `font-weight: bold`                                                                                  | `beachfront.css:41-43`     |

| style                             | 1440                                     | 834                  | 390           |
| --------------------------------- | ---------------------------------------- | -------------------- | ------------- |
| `p` size / lh (`1.5em`)           | **20 / 30**                              | **16 / 24**          | **12 / 18**   |
| `p` colour                        | `#365b6d`                                | ←                    | ←             |
| `p` margin                        | `0 0 10px 0`                             | ←                    | ←             |
| `li` size / lh (`1.8em`)          | **20 / 36**                              | **20 / 36** ← not 16 | **12 / 21.6** |
| `li` colour                       | `#365b6d`                                | ←                    | ←             |
| `ol` size / lh                    | 30 / 76.8 (inherited)                    | ←                    | ←             |
| `ol` padding-left / margin-bottom | 40 / 10                                  | ←                    | ←             |
| `strong`                          | inherits parent size, `font-weight: 700` | ←                    | ←             |
| family (all of the above)         | museo-sans                               | ←                    | ←             |

Sweep of the divergence `[probed]`: at 834 `p` is **16px/24** while `li` is
**20px/36**; `li` does not drop until **767**. The 768–991 band therefore
renders list items 25% larger than the surrounding paragraphs. This is live's
real behaviour (there is simply no `li` rule in the ≤991 block) and it is the
single most likely thing a rebuild normalises away. See §E.4.

**B.5.3 Block inventory — 12 top-level children, and the ZWJ paragraphs**

Order and measured heights `[probed]` (`detail-qa.html:113`):

| #   | tag                        | opening text                                                             | h@1440  | h@834   | h@390      |
| --- | -------------------------- | ------------------------------------------------------------------------ | ------- | ------- | ---------- |
| 1   | `p`                        | `At Beachfront Dentistry, we believe your dental care…` (ends `<br/>‍`)  | 120     | 96      | 90         |
| 2   | `p`                        | `<strong>It's More Than Just a Clean Mouth</strong>`                     | 30      | 24      | 18         |
| 3   | `p`                        | `A professional cleaning goes far beyond…` (ends `<br/>‍`)               | 120     | 120     | 126        |
| 4   | `p`                        | `<strong>Healthy Mouth, Healthy Body</strong>`                           | 30      | 24      | 18         |
| 5   | `ol start="1" role="list"` | 4 × `li`                                                                 | **324** | **360** | **280.72** |
| 6   | `p`                        | `<strong>Why Consistency Matters</strong>`                               | 30      | 24      | 18         |
| 7   | `p`                        | `We recommend professional cleanings <strong>every six months</strong>…` | 60      | 72      | 72         |
| 8   | `p`                        | `When you visit Beachfront Dentistry…` (ends `<br/>‍`)                   | 120     | 96      | 90         |
| 9   | `p`                        | `<strong>Let's Keep You Feeling Your Best</strong>`                      | 30      | 24      | 18         |
| 10  | `p`                        | `If it's been a while since your last cleaning…`                         | 60      | 48      | 54         |
| 11  | `p`                        | `<strong>Call us or book online today</strong> to schedule…`             | 60      | 48      | 36         |
| 12  | `p`                        | **`‍` (U+200D ZERO WIDTH JOINER only)**                                  | **30**  | **24**  | **18**     |

The 4 `<li>` heights at 1440: 72 / 72 / 72 / 108 (= 324 with no extra gaps).

**Two content facts that silently change the section height:**

1. **Paragraphs 1, 3 and 8 end with `<br/>‍`** — a hard break followed by a lone
   U+200D. Each buys one extra empty line box (30 / 24 / 18px). `<li>` 4 ends
   the same way, and `<li>` 1–3 end with `<strong>‍</strong>` (a ZWJ inside a
   `<strong>`, which does _not_ add a line because there is no `<br>`).
2. **Paragraph 12 is a ZWJ-only paragraph** and is a full line box tall
   (30 / 24 / 18) plus its 10px trapped margin. A rebuild whose rich-text
   serializer strips "empty" paragraphs loses 40 / 34 / 28px off the bottom of
   region R1 and shifts everything below.

Height check from source (1440): 120+10+30+10+120+10+30+10+324+10+30+10+60+10+
120+10+30+10+60+10+60+10+30 = 1124, plus the trapped trailing 10 = **1134** ✓
matches the probed section height exactly.

The article contains **no links, no images, no figures, no headings** — 12
paragraphs/lists only. `.w-richtext figure*` (`beachfront.css:1690-1796`) is
dead code on this page.

---

#### B.6 "Have another question?" band — `section.other-questions-section` (census 6)

Markup (`detail-qa.html:113`):

```
<section class="other-questions-section">
  <div class="content-width flex-align-center flex-justify-center">
    <a data-w-id="0d259ad5-e5d9-f99b-5490-1521e7c4b7e2"
       style="…translate3d(0, 4rem, 0)…;opacity:0"
       href="/ask-the-doctor" class="button text-color-primary w-button">Have another question?</a>
  </div>
</section>
```

Container: `.content-width` (chrome §2) + `.flex-align-center`
`beachfront.css:2953-2956` (`align-items:center; display:flex`) +
`.flex-justify-center` `beachfront.css:2984-2987` (`justify-content:center;
display:flex`). Note `.content-width`'s `height:100%` (`beachfront.css:5861`)
resolves to `auto` against an auto-height block parent, so the section's height
**is** the button's height — there is no extra padding anywhere.

Button: `.button.text-color-primary` — full pattern in **chrome §6**; the rows
that apply here:
`.w-button` `beachfront.css:265-275` · `.button` `beachfront.css:6028-6040` ·
`.button` ≤991 → 20px `beachfront.css:8045-8047` · ≤767 → 15px
`beachfront.css:8632-8634` · `.button.text-color-primary`
`beachfront.css:6065-6067` (`border-color: var(--primary)`) · ≤479 → 14px
`beachfront.css:9185-9187` · `.text-color-primary` `beachfront.css:5936-5938`
(`color: var(--primary)`).

|                                                | 1440                | 834         | 390           |
| ---------------------------------------------- | ------------------- | ----------- | ------------- |
| font-size                                      | **25px**            | **20px**    | **14px**      |
| padding (`1.3em` / `1em`)                      | `32.5px 25px`       | `26px 20px` | `18.2px 14px` |
| height (`line-height:0` ⇒ padding+border only) | **67**              | **54**      | **38.375**    |
| measured width                                 | **337.56**          | **270.45**  | **189.92**    |
| button x (centred)                             | 551.22              | 281.77      | 100.03        |
| border                                         | `1px solid #129ecc` | ←           | ←             |
| radius                                         | `8px`               | ←           | ←             |
| family / weight                                | museo-slab / 300    | ←           | ←             |
| background                                     | `rgba(0,0,0,0)`     | ←           | ←             |
| margin                                         | 0 on every side     | ←           | ←             |

Sweep `[probed]`: 25px ≥992 · 20px 991–768 · **15px at 767 and 480** (h 41,
`.button` ≤767) · 14px ≤479 (h 38.375, `.button.text-color-primary` ≤479).
The `.button.text-color-primary-dark` ≤767 `margin-bottom: 60px`
(`beachfront.css:8636-8638`) is a **different** variant and must NOT be applied
here — this section has zero margins at every width.

The section is 67 / 54 / 38.375px tall and that is the entirety of gate region
R2. There is nothing else in it.

---

#### B.7 Closing CTA band + footer (census 7, 8) — chrome

Not re-specced. `section.footer` markup on this page is byte-identical to
`index.html`'s modulo `data-w-id` GUIDs (chrome §0). The only page-specific
observations:

- **No nav link on this page carries `aria-current="page"` / `w--current`.**
  A CMS detail page under `/questions/` matches no top-level nav item. Verified:
  `grep -c 'w--current' matching/spec/detail-qa.html` → 0. Every other specced
  page has exactly one. Do not port an "active" state here.
- Measured chrome geometry on this page `[probed]`, for the R3/R4 baseline:
  `h2` "Ready for great…" `{y 2491.19, h 504}` / `{2620.39, 240}` /
  `{1972.09, 180}` at font 140/168 · 72/80 · 50/60;
  `.fiji-section` `{y 3035.19, h 800}` / `{2892.39, 640}` / `{2176.09, 273}`;
  `.footer-info-section` `{y 3691.19, h 714.41}` / `{3449, 982.41}` /
  `{2410.09, 1124.59}`; `.footer-learn-more` y 3711.19 / 3465 / 2422.09.
- `.cta-section` is an empty zero-height `<div>` with no rule anywhere
  (chrome §4, `beachfront.css` grep returns nothing) — it exists only so the
  CTA `h2`'s `.my-4` top margin has something to collapse through.
- The footer wave divider `.custom-shape-divider-bottom-1689290473` is declared
  in this page's own head at `detail-qa.html:39-58` (`transform:rotate(180deg);
margin-top:-4rem; width:calc(169% + 1.3px); height:4rem;
.shape-fill{fill:#e7f5fa}`) and its SVG is inline in the markup at
  `detail-qa.html:113-116` — unlike the hero wave, it is **not** JS-injected.

---

### C. INTERACTION INVENTORY

Enumerated from the settled live DOM at 1440 (every `a`, `button`, `input`,
`select`, `textarea`, every `[data-w-id]`, and every element with
`cursor:pointer` or a class matching
`/open|active|expand|menu|modal|dropdown|accordion|slider/`), excluding the
Google-Maps widget's internal controls (counted once as the widget) — the same
counting rule as `services.md` and `our-team.md`.

**Unique to this page (2)**

| #   | element                                                                                                            | behaviour                                                                                                                                                                | source                                                                                                                                                                                                     |
| --- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `a.text-color-white.w-inline-block[href="/ask-the-doctor"]` wrapping `h3` "Blog / View All Posts" (hero back-link) | navigate to `/ask-the-doctor`; hover → `opacity: .61` over `.2s`; background stays `rgba(18,158,204,0.05)`                                                               | `detail-qa.html:113`; `a` `beachfront.css:2174-2179` (transition + wash), `a:hover` `beachfront.css:2181-2183`. Verified `[probed]` 1 → **0.61** on hover, bg unchanged                                    |
| 2   | `a.button.text-color-primary.w-button[href="/ask-the-doctor"][data-w-id="0d259ad5-…"]` "Have another question?"    | navigate to `/ask-the-doctor`; hover → **background-color only** `rgba(0,0,0,0)` → `rgba(18,158,204,0.29)` over `.2s cubic-bezier(.215,.61,.355,1)`; **opacity stays 1** | `.button:hover` `beachfront.css:6042-6045`; `.button` transition `beachfront.css:6039`. IX2 leaves an inline `opacity:1` on this element, which outranks `.button:hover{opacity:.6}` — verified `[probed]` |

The hover asymmetry between #1 and #2 is real and is the same mechanism chrome
§4.7 documents for the CTA button: the IX2 reveal writes `opacity` inline, and
an inline declaration beats a class `:hover`. #1 has no `data-w-id`, so it has
no inline style and _does_ dim. Do not normalise these to each other.

**Shared chrome present in this page's DOM (31)** — behaviour spec'd in

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

| #     | element                                                                                                                                                                    | ref         |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| 3     | `a.link-block-5` header logo → `/`                                                                                                                                         | chrome §3.1 |
| 4     | `a.link-block-4` + `img.header-hamburger[data-w-id=d74a87ea-f9c1-d0eb-6fb6-c8992fcf73c0]` — open panel                                                                     | chrome §3.4 |
| 5     | `img.header-hamburger[data-w-id=8dfa6638-f698-fdd7-603c-6f04af7990e4]` inside `.dropdown-modal` — close panel                                                              | chrome §3.4 |
| 6–12  | 7 × `a.no-text-dec > h3.modal-link` (Home Page · First Visit · Meet Our Team · Services · Ask the Doctor · Contact · (310) 378-9241) — **none marked current**             | chrome §3.5 |
| 13    | panel `a.button.show-form.nav[data-w-id=6eca16bd-bda4-9c3f-5c28-ccf469c0bdbe]` "Book an Appointment"                                                                       | chrome §3.6 |
| 14    | panel `a.button.nav` "Make a Payment" → `app.modento.io/beachfront-dentistry`                                                                                              | chrome §3.1 |
| 15    | CTA `a.button.show-form[data-w-id=1273e294-…4f60]` "Book Appointment"                                                                                                      | chrome §4.3 |
| 16    | `div.block-link.social-link-block[data-w-id=9daf7a34-be47-31c9-4e49-3c5364089b3b]` "Read Reviews" toggle                                                                   | chrome §4.4 |
| 17–19 | 3 × `a._w-8.clickable.su-w-6-portrait` — Google Maps reviews · Facebook · Yelp                                                                                             | chrome §4.4 |
| 20–23 | 4 × footer `a.inline-link` (Your First Visit · Our Team · Services · Ask the Doctor)                                                                                       | chrome §5.3 |
| 24    | footer `a.button[data-w-id=b1ce8885-f42d-42d8-f54d-811279eda66b]` "Make a Payment"                                                                                         | chrome §5.3 |
| 25    | footer `a.inline-link[href="tel:(310)-378-9241"]`                                                                                                                          | chrome §5.5 |
| 26    | `.footer-map.w-widget.w-widget-map` Google Maps widget (pan / zoom / fullscreen / Street View — third-party, counted once; it injects 21 further controls `[probed-only]`) | chrome §5.7 |
| 27    | form-modal `a.inline-link` logo → `/`                                                                                                                                      | chrome §3.6 |
| 28    | form-modal `a.inline-link` + `img.header-hamburger[data-w-id=b914d569-4c40-98cb-736a-37015bfda111]` close                                                                  | chrome §3.6 |
| 29    | form-modal `input[type=text]#name-2`                                                                                                                                       | chrome §3.6 |
| 30    | form-modal `input[type=email]#Email-2`                                                                                                                                     | chrome §3.6 |
| 31    | form-modal `input[type=tel]#Phone`                                                                                                                                         | chrome §3.6 |
| 32    | form-modal `textarea#message`                                                                                                                                              | chrome §3.6 |
| 33    | form-modal `input[type=submit].button.text-color-primary.w-button`                                                                                                         | chrome §3.6 |

**Explicitly NOT counted** (not controls, or states of counted controls):

- `div.dynamic-content-body[data-w-id=12109889-…]`, `h2[data-w-id=1273e294-…4f5b]`,
  the two `div.display-flex…[data-w-id=…4f5f/…4f62]` wrappers and
  `div.cta-beach-label[data-w-id=…4f6a]` — IX2 **scroll targets**, `cursor:auto`,
  no click handler. They belong to §D, not §C.
- `img.expanding-plus` / `img.expanding-minus` / `div.plus-minus-block` — visual
  children of #16; clicks bubble to the toggle.
- `.socials-container` — a revealed container, not a control; its 3 anchors are #17–19.
- The 4 `.footer-copyright` `<div>`s — plain divs, not links (`detail-qa.html:117`).
- The 21 Google-Maps internal `<button>`/`<a>` nodes (`gm-control-active`,
  `gm-ui-hover-effect`, `gm-style-cc`, Terms, Report-a-map-error, …) — folded
  into #26.
- The **portrait `alert()`** at `detail-qa.html:138-146` — fires on load and on
  `window:resize` when `innerWidth < 792 && innerHeight < innerWidth`. Native
  dialog, not a DOM control. It **will block a headless probe**; register
  `p.on("dialog", d => d.dismiss())`.
- Hover-only rules (`a:hover` `beachfront.css:2181`, `.button:hover`
  `beachfront.css:6042`, `.inline-link:hover` `beachfront.css:7391`,
  `.modal-link:hover` `beachfront.css:6424`) — states of counted elements.

**INTERACTION COUNT: 33**

---

### D. ANIMATION CENSUS

Read from Webflow's IX2 store shipped in
`beachfront-dentistry.schunk.f0bc49bb141fcb49.js` (loaded at `detail-qa.html:113`),
plus this page's own jQuery block (`detail-qa.html:119-149`). The IX2 JSON is not
in any file under `matching/spec/`, so its event/action ids are `[probed-only]`;
the resulting inline styles are quoted from the served HTML and are citable.

**D.1 The two page-unique scroll reveals — IX2 action list `a-7` "up and in"**

| event           | target                                                           | element                                        |
| --------------- | ---------------------------------------------------------------- | ---------------------------------------------- |
| `e-183` → `a-7` | `655680f0c897c56b081e91c9\|12109889-0f86-9f5f-65a7-d6d1ec131029` | `.dynamic-content-body` (census 5)             |
| `e-181` → `a-7` | `655680f0c897c56b081e91c9\|0d259ad5-e5d9-f99b-5490-1521e7c4b7e2` | `a.button` "Have another question?" (census 6) |

Both: `animationType:"custom"`, `eventTypeId:"SCROLL_INTO_VIEW"`,
`actionTypeId:"GENERAL_START_ACTION"`, `config.delay:0`,
`scrollOffsetValue: 0, scrollOffsetUnit: "%"`, `loop:false`,
`mediaQueries:["main","medium","small","tiny"]` — i.e. **active at every
breakpoint**, no offset, fires the moment the element's box enters the viewport.
Webflow's `SCROLL_INTO_VIEW` is implemented on a scroll listener + bounding-box
test, not `IntersectionObserver`; an `IntersectionObserver` reimplementation with
`threshold: 0` and `rootMargin: 0` is behaviourally equivalent for a static match.

`a-7` (`useFirstGroupAsInitialState: true`):

| group              | actions                                                             | duration | easing        |
| ------------------ | ------------------------------------------------------------------- | -------- | ------------- |
| g0 = initial state | `TRANSFORM_MOVE yValue: 4, yUnit: "rem"` + `STYLE_OPACITY value: 0` | 500      | linear (`""`) |
| g1 = reveal        | `TRANSFORM_MOVE yValue: 0, yUnit: "rem"` + `STYLE_OPACITY value: 1` | **2000** | **outExpo**   |

Because `useFirstGroupAsInitialState` is true, Webflow **pre-renders g0 into the
HTML**, so the offset is citable, not probed:

```
style="-webkit-transform:translate3d(0, 4rem, 0) …;transform:translate3d(0, 4rem, 0) …;opacity:0"
```

`detail-qa.html:113` (on both elements).

Travel resolves on the **root** ladder, `4rem` = **160 / 128 / 96px**
(`[probed]` computed pre-scroll `matrix(1,0,0,1,0,160)` at 1440,
`matrix(1,0,0,1,0,96)` at 390).

Settled state `[probed]` — the inline style is rewritten, not removed:

```
transform: translate3d(0px, 0rem, 0px) scale3d(1,1,1) rotateX(0deg) rotateY(0deg) rotateZ(0deg) skew(0deg,0deg);
opacity: 1; transform-style: preserve-3d;
```

The surviving inline `opacity: 1` is what defeats `.button:hover{opacity:.6}` on
the "Have another question?" button (§C #2).

**Probe consequence:** at 1440 the article body's pre-settle top is 160px below
its final position. Any rect read before
`document.getAnimations().every(a => a.playState !== "running")` reports
`section.dynamic-content-section` at the right y (the section box does not move —
only its child is transformed) but every _child_ rect 160px low. Read settled.

**D.2 Chrome animations also present on this page** (spec'd in chrome, listed
for completeness)

| element                                                                                                                                                                                        | trigger                              | action                                                                                                                                                                                                                |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `h2[data-w-id=1273e294-…4f5b]` "Ready for great…"                                                                                                                                              | `SCROLL_INTO_VIEW`                   | `a-7` — same 4rem / 2000ms outExpo; pre-rendered `translate3d(0, 4rem, 0); opacity:0` at `detail-qa.html:113`                                                                                                         |
| `div[data-w-id=…4f5f]` (Book Appointment wrapper), `a[data-w-id=…4f60]`, `div[data-w-id=…4f62]` (reviews wrapper), `div[data-w-id=…4f6a]` `.cta-beach-label`, footer `a[data-w-id=b1ce8885-…]` | `SCROLL_INTO_VIEW`                   | `a-7` (chrome §4.7)                                                                                                                                                                                                   |
| `.social-link-block` "Read Reviews"                                                                                                                                                            | `MOUSE_CLICK` / `MOUSE_SECOND_CLICK` | `a-8` open: opacity→1 **2000ms outExpo**, `display:flex` @0ms, `translateY(+40%)` **2000ms outExpo**; `a-9` close: `translateY(0)` **2000ms outExpo**, opacity→0 **500ms outExpo**, then `display:none` (chrome §4.4) |
| `.header-hamburger` ×3                                                                                                                                                                         | `MOUSE_CLICK`                        | nav panel open/close (chrome §3.4)                                                                                                                                                                                    |

**D.3 Non-IX2 scripted behaviour on this page**

| what                        | code                                                                                                                                                    | source                                                                      |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Hero wave SVG injection     | `$(".bot-wave").append('<svg …>')`                                                                                                                      | `detail-qa.html:119-123`                                                    |
| Appointment modal show/hide | `showForm = () => $(".form-modal").css("opacity","1")`; `hideForm` sets `"0"`; bound `$(".show-form").click(showForm); $(".hide-form").click(hideForm)` | `detail-qa.html:126-136`                                                    |
| Portrait nag                | `alert("Please use Portrait!")` on load and on `window:resize` when `innerWidth<792 && innerHeight<innerWidth`                                          | `detail-qa.html:138-146`                                                    |
| Reviews toggle              | `$('.social-link-block').click(toggle)` — `toggle` adds/removes `.active` on the clicked element **and every descendant**                               | `detail-qa.html:149`; `toggle` at `matching/spec/incidental-utils.js:14-23` |
| Resize decoupler            | `$(window).resize(() => $(window).trigger("window:resize"))`                                                                                            | `matching/spec/incidental-utils.js:34-36`                                   |

`incidental-utils.js` is loaded from
`https://raw.githack.com/tucksravin/incidental-js/main/webflow/utils.js`
(`detail-qa.html:113`); the captured copy is `matching/spec/incidental-utils.js`.
`getContentWidthMargin()` (`incidental-utils.js:43-51`) is defined but **not
called on this page** — there is no slider here.

**Nothing on this page is scroll-linked** (no `SCROLL_MOTION`, no `position:sticky`,
no parallax). Every animation is either scroll-_triggered_ (one-shot) or click-driven.

---

### E. KNOWN-SUSPECT LIST

Ranked by how likely our build gets it wrong × how much geometry it moves.

**E.1 `.hero` height is a THREE-tier `vw` ladder — 33 / 60 / 70**
`beachfront.css:5297` (33vw) · `:7981` (≤991 → 60vw) · `:8439` (≤767 → 70vw).
A two-tier ladder keyed at 768 renders **33vw = 275px at 834** where live is
**60vw = 500px** — a 225px error that pushes every census row below it. The
breakpoints are Webflow's (991/767), _not_ the root ladder's, and the units are
`vw`, so the root font-size is irrelevant here. Sweep proof: 327.36 at 992 →
594.59 at 991. **Gate matrix: 475.19 / 500.39 / 273.**

**E.2 The hero back-link `h3` breaks at 991, not 767**
`h3` 40px/50 `beachfront.css:2129` + `:2131`; ≤991 21px/26 `beachfront.css:7863-7866`;
**nothing at ≤767 or ≤479**. At 834 live is 21px. An md tier keyed at 768 leaves
40px there — 24px of type and 24px of container height (80 vs 56) inside gate
region R0, where it is only ~3% of the region and **will not trip the 0.10
threshold**. This is the defect most likely to survive a green gate.

**E.3 `h2.heading-30` stays 100px all the way down to 480 — it does NOT use the
`h2` ≤991 rule**
`.heading-30` `beachfront.css:7846-7850` (100px/1.2em) beats
`h2` ≤991 `beachfront.css:7858-7861` (72px/80) on specificity, and beats
`h2` ≤479 `beachfront.css:9012-9016` (56px/70) too; the only class-level step is
`beachfront.css:9601-9604` (≤479 → 50px/1.2em). Ladder: **100 / 100 / 50**.
Two independent ways to get this wrong:
(a) applying the `h2` ≤991 72px at 834 — shrinks the title box from 620 to ~440
and lifts every row below by 180px;
(b) keying the 50px step at 768 instead of 479 — same class of error, opposite sign.
Also carry `overflow-wrap: anywhere` at ≤479 only (`beachfront.css:9013`), which
_is_ inherited from the element rule because `.heading-30` does not declare it.

**E.4 `<li>` and `<p>` diverge in the 768–991 band**
`p` ≤991 → 16px `beachfront.css:7877-7879`; `li` has **no ≤991 rule** and does
not drop until ≤767 `beachfront.css:8382-8384`. At 834 live renders `li` at
**20px / 36px** next to `p` at **16px / 24px**. A rebuild that sets one
`--body-size` for the whole rich text makes the ordered list 4px too small at md
and shortens `section.dynamic-content-section` by 80px (360 → 280). Note also
`li` line-height is `1.8em` (`beachfront.css:2195`) against `p`'s `1.5em`
(`beachfront.css:2171`) — different ratios, not just different sizes.
Related: `ul` gets `font-size: 24px` at `beachfront.css:2189` but the selector is
`ul` **only**, so this page's `<ol>` inherits 30px from `.dynamic-content-body`
(`beachfront.css:7648`). Do not "tidy" that into `ul, ol`.

**E.5 `.w-richtext`'s `display:table` pseudo-elements trap 10px at the bottom**
`beachfront.css:1672-1680`. Without them the last `<p>`'s `margin-bottom:10px`
collapses out and `section.dynamic-content-section` is 10px short at every
width, while the 2rem gap below stays 80/64/48 (it is `max(10, 80)` either way,
so the gap does not compensate). Measured: last `<p>` bottom 2294.19, container
bottom 2304.19 at 1440.

**E.6 The three vertical gaps use two different breakpoint ladders**

- hero → title: 20px flat, from `h2 { margin-top: 20px }` `beachfront.css:2116` (no ladder)
- article → button: `2rem` `beachfront.css:7647` → **80 / 64 / 48**, stepping at
  **992 and 768** (root ladder)
- button → footer: `1rem` `beachfront.css:3825` → **40 / 32 / 24**, same root ladder

Meanwhile `.content-width` pad-x steps at 992 / 768 / 767 / 479 (chrome §2) and
the columns step at 767. Five distinct breakpoints in ~1100px of page. Anything
keyed to a single `md` value is wrong somewhere.

**E.7 The hero wave: injected by JS, rotated on the wrapper, and it paints over
the label**
Three separate ways to lose it. (a) The `<div class="bot-wave">` is **empty** in
the served HTML — the SVG comes from `$(".bot-wave").append(…)` at
`detail-qa.html:123`; a static rebuild that copies the markup verbatim gets no
wave at all. (b) `transform: rotate(180deg)` is on `.bot-wave`
(`detail-qa.html:20-22`), not on the `<svg>`; combined with
`width: calc(133% + 1.3px)` and `left:0` this makes the _mirrored left 75%_ of
the path visible (svg rect x = −476.5 at 1440), not a centred crop.
(c) `.bot-wave` `z-index: 8` (`beachfront.css:6009`) vs the label's `z-index: 5`
(`beachfront.css:4430`) — the white wave overlaps the label box by 72px at 1440
and wins. All three are correct on live.

**E.8 The `a` base wash on the hero back-link**
`beachfront.css:2174-2179` gives every bare `<a>` `background-color:#129ecc0d` +
`border-radius:5px`. `.text-color-white` (`beachfront.css:4429-4434`) does not
clear it, and neither `.no-text-dec` nor `.inline-link` is on this element.
Verified computed `rgba(18,158,204,0.05)` / `5px` at all three widths over a
390×80 box. A reset that zeroes `a { background: none }` removes a real, if
subtle, band from the hero.

**E.9 The ZWJ content**
Paragraphs 1, 3, 8 and `<li>` 4 end with `<br/>` + U+200D, and paragraph 12 is
U+200D alone (`detail-qa.html:113`). That is 4 extra line boxes plus a whole
extra paragraph — **150 / 120 / 90px** of article height at 1440 / 834 / 390. A
Prismic rich-text round-trip that normalises away empty nodes or trailing
`<br>`s shortens region R1 by that much. Check the serializer, not the CSS.

**E.10 `.display-flex { font-size: .6rem }` at ≤991**
`beachfront.css:7890-7892`. Inherited by `.col-1-of-3` / `.col-2-of-3`
(19.2px at 834, 14.4px at 390 `[probed]`). Invisible on this page because the
only text child sets its own size — but it is a live inherited value, and it is
the same `.display-flex` class the CTA band uses. Carry it.

**E.11 The empty `.col-1-of-3` must still exist**
It is an empty `<div>` (`detail-qa.html:113`) whose only job is to indent the
lede by 33%. At ≤767 `.su-w-full-mobile` (`beachfront.css:8426-8428`) makes it
100% wide and it collapses to **h 0** while the row wraps. A rebuild that drops
the empty div and uses `margin-left: 33%` instead gets 1440/834 right and 390
wrong (the lede would keep an indent it should not have).

**E.12 Gate-anchor caveat**
The gate string `Ready for great` (`matching/gate.sh:90`) is **not contiguous in
`innerText`** — the CTA `h2` is `Ready for <br/>great dental <br/>health?`
(`detail-qa.html:113`), so `body.innerText` contains `Ready for \ngreat dental`.
`page-diff` evidently normalises whitespace (this anchor is used on all 9 pages
and the gate runs), but if a future refactor of the matcher tightens that, this
anchor and `Ready for great dental health` on the nav pages both break at once.
The other three anchors on this page are contiguous and verified unique
(`At Beachfront Dentistry` ×1, `Have another question` ×1, `Want to learn more` ×1).
Recommended census anchors for the two rows the gate does not cut on:
`Blog / View All Posts` (×1) and `Beyond the Smile` (×1) — the latter is also a
gate anchor on **home** and **atd**, but anchors are per-page so there is no
collision; flagged only so nobody "de-duplicates" it.

---

## `[probed-only]` inventory

Values with NO stylesheet line. They were read off the rendered reference
and must be re-derived if anything upstream changes — never copied blindly
into a fix, and never cited as though they were a rule (repo CLAUDE.md
rule 1).

17. `qa.md:17` — shrink-to-fit widths, srcset selection) are tagged `[probed-only]` and are the
18. `qa.md:245` — Selection at DPR 1 `[probed-only]`: 1440→`-p-1600`, 1200→`-p-1600`,
19. `qa.md:320` — (blockified to `display:block` as a flex item `[probed-only]`)
20. `qa.md:732` — | 26 | `.footer-map.w-widget.w-widget-map` Google Maps widget (pan / zoom / fullscreen / Street View — third-party, counted once; it injects 21 furthe
21. `qa.md:771` — in any file under `matching/spec/`, so its event/action ids are `[probed-only]`;
