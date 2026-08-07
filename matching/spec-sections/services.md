## services — Services index (hero + lede + 4 service cards)

Page: `/services` · Live: <https://www.beachfrontdentistry.com/services>
Local HTML: `matching/spec/services-live.html` (post-JS DOM capture; body markup
is the single minified line `services-live.html:136`).
Readable extracts: `matching/spec/services-top.html` (hero + lede),
`matching/spec/services-blocks.pretty.html` (the four cards).

**Governing rule (CLAUDE.md #1): source prescribes, rects only verify.** Every
geometry/type value below carries a `beachfront.css:<line>` or
`services-live.html:<line>` / `services-blocks.pretty.html:<line>` citation.
Values that exist only as computed output (Webflow IX2 inline styles, grid
free-space resolution, margin-collapse results, shrink-to-fit widths) are tagged
`[probed-only]` and are the only numbers here without a line.

Shared nav / closing-CTA / footer are **not** re-specced here — see
`matching/spec-sections/_chrome.md` §3 (nav + form modal), §4 (CTA band),
§5 (footer), §6 (button pattern), §2 (`.content-width`), §1 (root-font ladder).

Probe: Playwright chromium, 9 widths (1440 / 992 / 991 / 834 / 768 / 767 / 480 /
479 / 390), scrolled in 250px steps @80ms then held until
`document.getAnimations()` reported nothing running, plus a 600ms settle. The
four cards reveal on scroll (a 2000ms outExpo) — an unsettled read has the
sign of their y-offset wrong.

---

### A. SECTION CENSUS

y values are the **section border-box top** at 1440 (page coords, settled).
Where the anchor text sits lower than the box top, the anchor y is given too.

| #   | label                                     | anchor (unique, comma-free)                     | y@1440                | owner          |
| --- | ----------------------------------------- | ----------------------------------------------- | --------------------- | -------------- |
| 1   | Header / nav bar                          | _(no unique text — anchor by `section.header`)_ | 0 (h=120)             | **chrome §3**  |
| 2   | Hero band `section.hero.redondo`          | _(no unique text — see note)_                   | 0 (h=475.19)          | this file §B.2 |
| 3   | Lede paragraph `section.we-offer-section` | `We offer a wide array of services in cosmetic` | 495.19 (h=270)        | this file §B.3 |
| 4   | Service card 1 — Cosmetic Dentistry       | `Cosmetic Dentistry`                            | 925.19 (h3 @1005.19)  | this file §B.4 |
| 5   | Service card 2 — Restore Your Smile       | `Restore Your Smile`                            | 925.19 (h3 @1005.19)  | this file §B.4 |
| 6   | Service card 3 — General Dentistry        | `General Dentistry`                             | 1725.19 (h3 @1805.19) | this file §B.4 |
| 7   | Service card 4 — Specialty Services       | `Specialty Services`                            | 1725.19 (h3 @1805.19) | this file §B.4 |
| 8   | Closing CTA band                          | `Ready for`                                     | 2525.19               | **chrome §4**  |
| 9   | Footer                                    | `Want to learn more`                            | 3745.19               | **chrome §5**  |

**CENSUS SECTION COUNT: 9** (5 unique to this page: 2, 3, and cards 4–7 which
share one `section` element; 4 are chrome).

Section-element y/h at the gate matrix `[probed]`:

| section                    | 1440                | 834                 | 390                |
| -------------------------- | ------------------- | ------------------- | ------------------ |
| `.header`                  | y 0 h 120           | y 0 h 96            | y 0 h 72           |
| `.hero.redondo`            | y 0 h **475.19**    | y 0 h **500.39**    | y 0 h **370.5**    |
| `.we-offer-section`        | y 495.19 h 270      | y 520.39 h 120      | y 390.5 h 210      |
| `.service-blocks-sections` | y 845.19 h **1600** | y 704.39 h **2944** | y 648.5 h **2016** |
| `.footer` (CTA + footer)   | y 2525.19 h 1914.41 | y 3712.39 h 1811.02 | y 2712.5 h 1562.59 |
| document height            | 4440                | 5523                | 4275               |

**Hero anchor caveat.** The hero's only text is the single word `Services`
(`h2.subpage-hero-heading`, `services-top.html:1`). That string is **not unique
on the page** — it also appears as a `h3.modal-link` in the off-canvas nav panel
and as a `.footer-links` div in footer col 1. The gate must anchor this section
by selector (`section.hero.redondo` / `h2.subpage-hero-heading`), never by text.

#### Gate-region ↔ census mapping (where defects hide)

The gate currently cuts this page at four anchors:
`Cosmetic Dentistry` / `General Dentistry` / `Ready for great dental health` /
`Want to learn more`. That yields five regions against nine census sections:

| gate region                                   | census sections it contains                     | span@1440           | dilution risk                                                                                                                                                           |
| --------------------------------------------- | ----------------------------------------------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R0 top → `Cosmetic Dentistry`                 | **1 header + 2 hero + 3 lede** (three sections) | 0 → 1005 (≈1005px)  | **HIGH.** A 100%-broken lede (270px tall) is only 27% of R0; a broken header (120px) is 12%. Both sit under a 0.10 threshold on their own.                              |
| R1 `Cosmetic Dentistry` → `General Dentistry` | **4 card 1 + 5 card 2** (two sections)          | 1005 → 1805 (800px) | MEDIUM. At 1440 the two cards are side-by-side in one 800px grid row, so a fully broken card is ≤50% of R1. At 834/390 they stack and each owns its own 736/504px band. |
| R2 `General Dentistry` → `Ready for`          | **6 card 3 + 7 card 4** (two sections)          | 1805 → 2525 (720px) | MEDIUM, same shape as R1. Also swallows the grid's trailing collapsed 80px margin.                                                                                      |
| R3 `Ready for` → `Want to learn more`         | 8 CTA band                                      | 2525 → 3745         | chrome §4                                                                                                                                                               |
| R4 `Want to learn more` → end                 | 9 footer                                        | 3745 → 4440         | chrome §5                                                                                                                                                               |

Two anchors that would split R0 and de-dilute it — both unique and comma-free —
are available if the gate is ever re-cut: `We offer a wide array of services in
cosmetic` (lede, y@1440 = 495.19) and `Restore Your Smile` / `Specialty
Services` (the right-hand cards).

**Inter-section space lives in COLLAPSED MARGINS, not padding** (see §B.X). The
80px between the lede box and the service-blocks box belongs to **neither**
region's box. Any rebuild that puts that space in `padding-top` on
`.service-blocks-sections` moves 80px from "between regions" into R1, and the
gate will read a y-shift on every card.

---

### B. PER-SECTION SPEC

Sub-numbers track the §A census numbers. **B.1, B.5, B.6, B.7, B.8 and B.9 are absent by
design** — census 1 (header), 8 (CTA band) and 9 (footer) are shared chrome
(`_chrome.md` §3 / §4 / §5), and census 5/6/7 (cards 2/3/4) are covered together with
card 1 under B.4. B.0 is page-level; B.X is the cross-cutting box-model
note that the gate cut depends on.

#### B.0 Page-level facts

**Root-font ladder** (the systemic trap — chrome §1). This page ships the same
inline `<style>` twice: `services-live.html:3-18` (head) and
`services-live.html:84-97` (a `.w-embed` at the top of `<body>`, byte-identical).

| rule                                                     | source                                               |
| -------------------------------------------------------- | ---------------------------------------------------- |
| `html { font-size: 40px }`                               | `services-live.html:3-5` (repeat `:85`)              |
| `@media (max-width: 992px) { html { font-size: 32px } }` | `services-live.html:8-10` (repeat `:87-89`)          |
| `@media (max-width: 768px) { html { font-size: 24px } }` | `services-live.html:12-14` (repeat `:91-93`)         |
| `@media (max-width: 480px) { html { font-size: 24px } }` | `services-live.html:16-18` (repeat `:95-97`) — no-op |

Webflow class breakpoints: `beachfront.css:7852` (≤991), `:8372` (≤767),
`:9011` (≤479), plus a page-specific ≤991 block at `:9611`.
**Offset by 1px → every rem resolves to THREE pixel values.** Root font
`[probed]`: 1440→40px · 992→**32px** · 991→32px · 834→32px · 768→**24px** ·
767→24px · 390→24px.

CSS variables `beachfront.css:2047-2053`:
`--primary #129ecc` · `--primary-dark #365b6d` · `--primary-light #e7f5fa` ·
`--secondary #b6aa91` · `--secondary-dark #2b2a29` · `--secondary-light #cecece`.

Body default `beachfront.css:2096-2102`: `color:#333; font-family: museo-sans,
sans-serif; font-size:64px; font-weight:300; line-height:1.2em`.

**Page-local CSS that is NOT in `beachfront.css`** — `services-live.html:100-134`
(`.filter-to-primary-dark`, `.click-through`, `.expanding-minus`,
`.expanding-box` + its own 991/480 ladder, `.ellipsis-three-lines`). None of
these classes appear on this page's markup; they are site-wide boilerplate.

**Two class names used on this page have NO rule anywhere**: `.we-offer-section`
and `.service-blocks-sections` (grepped `beachfront.css`, 0 hits, and absent
from the inline styles). They are bare block `<section>` elements with zero
padding, zero margin, zero background. **All of their box geometry is the
collapsed margins of their children.** This is the single most important
structural fact for the gate cut on this page.

---

#### B.2 Hero band — `section.hero.redondo`

Markup `services-top.html:1` = `services-live.html:136`:

```
<section class="hero redondo">
  <div class="bot-wave"> …jQuery-injected <svg>… </div>
  <h2 class="subpage-hero-heading">Services</h2>
</section>
```

##### Box

`.hero` `beachfront.css:5295-5300`: `align-items:center; height:33vw;
display:block; position:relative` (`align-items` is a no-op — `display:block`).
`.hero.redondo` `beachfront.css:5302-5308`: `background-image:url(…);
background-position: 0 100%; background-size: 100%; padding-bottom: 0;
position: relative`.

Height overrides — a **pure-vw ladder**, root-font-independent, so exactly three
Webflow tiers but with a 267px discontinuity at the 991/992 seam:

| rule | source                                                                | height |
| ---- | --------------------------------------------------------------------- | ------ |
| base | `beachfront.css:5297`                                                 | `33vw` |
| ≤991 | `beachfront.css:7980-7982` (`.hero, .hero.redondo`)                   | `60vw` |
| ≤767 | `beachfront.css:8438-8440` (`.hero`) + `:8442-8445` (`.hero.redondo`) | `70vw` |
| ≤479 | `beachfront.css:9072-9076` (`.hero.redondo`)                          | `95vw` |

| viewport              | 1440       | 992        | 991        | 834        | 768       | 767        | 480     | 479        | 390       |
| --------------------- | ---------- | ---------- | ---------- | ---------- | --------- | ---------- | ------- | ---------- | --------- |
| declared              | 33vw       | 33vw       | 60vw       | 60vw       | 60vw      | 70vw       | 70vw    | 95vw       | 95vw      |
| **height `[probed]`** | **475.19** | **327.36** | **594.59** | **500.39** | **460.8** | **536.89** | **336** | **455.05** | **370.5** |

`background-size` ladder: `100%` base (`beachfront.css:5305`) → `cover` only at
≤767 (`:8443`) and ≤479 (`:9074`). **At 834 it is still `100%`, not `cover`.**
`background-position` is `0 100%` at every tier. `object-fit: cover` at ≤479
(`:9073`) is a no-op on a non-replaced element.

_Note:_ `vw` includes the scrollbar in a real browser but not in headless
chromium. Expect ±(scrollbar × 0.33/0.60/0.95) between the probe and a desktop
browser at 1440.

##### Asset

Background image (CSS, not an `<img>`):
`https://cdn.prod.website-files.com/64af3f93339537d6b661b556/64af4ef42e7d98b2fdb91769_beach-in-beautiful-morning-light-at-redondo-beach-75226436.jpeg`
— `beachfront.css:5303`.

##### `h2.subpage-hero-heading` — "Services"

`beachfront.css:6126-6136`: `color:#fff; text-align:center; width:100%;
margin-top:8%; margin-bottom:5%; font-weight:100; position:absolute;
bottom:2%; left:0`.
≤991 `beachfront.css:8076-8080`: `text-align:left; width:80%; left:10%`.
≤479 `beachfront.css:9200-9202`: `left: 10%` (width stays 80%).
Font-size/line-height/family/colour inherit the `h2` ladder:
base `beachfront.css:2114-2122` (140px / 168px / museo-slab / weight 100 via
`:6132`); ≤991 `beachfront.css:7858-7861` (72px / 80px); ≤479
`beachfront.css:9012-9016` (`overflow-wrap:anywhere; 56px / 70px`).

**Four independent ladders that do not align.** Percentages are the trap:
`margin-top: 8%` and `margin-bottom: 5%` resolve against the containing block's
**WIDTH** (the hero), while `bottom: 2%` resolves against its **HEIGHT**.

|                                  | 1440                             | 834                            | 390                      |
| -------------------------------- | -------------------------------- | ------------------------------ | ------------------------ |
| font-size / line-height          | **140px / 168px**                | **72px / 80px**                | **56px / 70px**          |
| font-family / weight             | museo-slab, sans-serif / **100** | ←                              | ←                        |
| colour                           | `#fff`                           | ←                              | ←                        |
| letter-spacing / transform       | normal / none                    | ←                              | ←                        |
| text-align                       | **center**                       | **left**                       | **left**                 |
| width / left                     | `100%` / `0` = 1440 / 0          | `80%` / `10%` = 667.19 / 83.39 | `80%` / `10%` = 312 / 39 |
| margin-top `8%` of hero width    | **115.19px**                     | **66.72px**                    | **31.19px**              |
| margin-bottom `5%` of hero width | **72px**                         | **41.69px**                    | **19.5px**               |
| `bottom: 2%` of hero height      | **9.5px**                        | **10px**                       | **7.41px**               |
| resolved rect `[probed]`         | `{0, 225.69, 1440, 168}`         | `{83.39, 368.7, 667.19, 80}`   | `{39, 273.59, 312, 70}`  |

At **992** it is still `{0, 103.22, 992, 168}` at 140px/168px — desktop type in a
32px-root viewport. A two-tier ladder keyed at 768 renders 140px across the whole
768–991 band. `[probed]`

y is _derived_, not authored: `y = heroHeight − bottom − marginBottom − height`.
Reproduce the box model; do not hardcode `top`.

##### `.bot-wave` — the white wave divider at the hero's bottom edge

Base `beachfront.css:6008-6016`: `z-index:8; width:100%; line-height:0;
position:absolute; bottom:0; left:0; overflow:hidden`.
Page-local overrides in the head `<style>`:

- `.bot-wave { transform: rotate(180deg) }` — `services-live.html:20-22`
- `.bot-wave svg { position:relative; display:block; width: calc(133% + 1.3px); height: 3rem }` — `services-live.html:24-29`
- `.bot-wave .shape-fill { fill:#FFFFFF }` — `services-live.html:32-34`

**The `rotate(180deg)` is on the PARENT wrapper, not the svg** — same trap as the
footer divider (chrome §4.6). The svg is laid out at `left:0` of a `overflow:hidden`
wrapper, then the wrapper's 180° rotation maps it to negative x.

**The SVG is JS-injected.** `services-live.html:145`:
`$(".bot-wave").append(' <svg data-name="Layer 1" … viewBox="0 0 1200 120" preserveAspectRatio="none"><path d="M321.39,56.44c58-…" class="shape-fill"></path></svg> ')`.
Webflow ships an _empty_ `<div class="bot-wave">`; the captured HTML shows it
filled because the capture is post-JS. `[probed]` exactly **one** `svg` child at
every width — do not render one in markup _and_ inject one.

|                                           | 1440                            | 834                         | 390                   |
| ----------------------------------------- | ------------------------------- | --------------------------- | --------------------- |
| svg height (`3rem`)                       | **120px**                       | **96px**                    | **72px**              |
| svg width (`calc(133% + 1.3px)`)          | **1916.5px**                    | **1110.52px**               | **520px**             |
| wrapper rect `[probed]`                   | `{0, 355.19, 1440, 120}`        | `{0, 404.39, 834, 96}`      | `{0, 298.5, 390, 72}` |
| svg rect after parent rotation `[probed]` | `{−476.5, 355.19, 1916.5, 120}` | `{−276.52, …, 1110.52, 96}` | `{−130, …, 520, 72}`  |

`3rem` is a **root-font** value → 120 / 96 / 72; at 992 it is already 96px.

##### Assets

Wave path is inline SVG (no file). Local reference copy of the arrow/tooth SVGs
used further down: `matching/spec/live-arrow.svg`, `live-tooth2.svg`,
`live-tooth3.svg`.

##### Reveal

**None.** The hero carries no `data-w-id` and no IX2 event. It is static.

---

#### B.3 Lede paragraph — `section.we-offer-section`

Markup `services-top.html:5` = `services-live.html:136`:

```
<section class="we-offer-section">
  <div class="content-width">
    <p class="text-body-large text-color-primary mt-8 _w-620px mx-auto text-align-center slab">
      We offer a wide array of services in cosmetic, implant, and general dentistry. From
      present issues like discoloration, decay and misalignment to preventative measures
      for oral cancer and enamel loss- we have you covered.
    </p>
  </div>
</section>
```

Copy is one paragraph, one text node. Note the hyphen-without-space in
`enamel loss- we have you covered.` — reproduce it literally or content diffs
never close.

##### Box

- `section.we-offer-section` — **no rule exists.** Bare block, no padding/margin/bg.
- `.content-width` `beachfront.css:5858-5867` (max-width 1400, padding-x `1.5rem`;
  ≤767 `:8627-8630` → 8%; ≤479 `:9164-9167` → 5%) — chrome §2.
- The `<p>` is the _only_ in-flow child of the only in-flow child of the section,
  and neither ancestor has border or padding-top/bottom → **the p's vertical
  margins collapse straight out through both boxes**. The section's own border-box
  is exactly the paragraph's content box.

`[probed]` at 1440: hero bottom 475.19 + 20 (p's collapsed margin-top) = section
y 495.19; section h 270 = p h 270; section bottom 765.19 + 80 = service-blocks y
845.19 (the p's 40px bottom margin and the grid's 80px top margin **collapse
together to max = 80**).

##### Typography — the `.mt-8` trap

`.text-body-large` `beachfront.css:7760-7765`: `margin-top:20px;
margin-bottom:40px; font-size:30px; line-height:1.5em`.
`.text-body-large.text-color-primary.mt-8._w-620px` `beachfront.css:7767-7769`:
`width: 620px`.
`.mt-8` `beachfront.css:3925-3927`: `margin-top: 2rem`.
`.mx-auto` `beachfront.css:3844-3847`. `.text-align-center`
`beachfront.css:4460-4463` (`text-align:center; text-decoration:none`); ≤479
`:9042-9044` adds `white-space: normal`.
`.slab` `beachfront.css:6328-6330` (`font-family: museo-slab, sans-serif`).
`.text-color-primary` `beachfront.css:5936-5938` (`color: var(--primary)`).
`p` base `beachfront.css:2166-2172` (`color: var(--primary-dark);
margin-bottom:10px; font-size:20px; font-weight:300; line-height:1.5em`).
Overrides: ≤991 `beachfront.css:8363-8365` → `.text-body-large { font-size:20px }`
and `:8367-8369` → the six-class selector gets `max-width:100%`;
≤479 `beachfront.css:9573-9576` → `.text-body-large { margin-bottom:20px;
font-size:20px }`.

> **`.mt-8` IS DEAD ON THIS ELEMENT.** `.mt-8` (`:3925`) and `.text-body-large`
> (`:7760`) are both single-class selectors — equal specificity — so **source
> order decides and `:7760` wins**. Computed `margin-top` is **20px at every
> viewport**, never 2rem. `[probed]` mt = 20px at all 9 widths. A rebuild that
> honours `mt-8` puts 80px there at 1440 and shifts the entire page below the
> hero down by 60px.

|                                   | 1440                             | 834                       | 390                       |
| --------------------------------- | -------------------------------- | ------------------------- | ------------------------- |
| font-family                       | museo-slab, sans-serif (`.slab`) | ←                         | ←                         |
| font-weight                       | 300 (`p` base)                   | ←                         | ←                         |
| font-size / line-height (`1.5em`) | **30px / 45px**                  | **20px / 30px**           | **20px / 30px**           |
| letter-spacing / transform        | normal / none                    | ←                         | ←                         |
| colour                            | `#129ecc` (`--primary`)          | ←                         | ←                         |
| text-align                        | center                           | center                    | center                    |
| **margin-top**                    | **20px** (not 80)                | **20px** (not 64)         | **20px** (not 48)         |
| **margin-bottom**                 | **40px**                         | **40px**                  | **20px** ← `:9573`        |
| width                             | **620px** fixed                  | 620px                     | 620px                     |
| max-width                         | `none`                           | **100%** (`:8367`)        | **100%**                  |
| resolved box width `[probed]`     | 620                              | 620                       | **351** (capped)          |
| rect `[probed]`                   | `{410, 495.19, 620, 270}`        | `{107, 520.39, 620, 120}` | `{19.5, 390.5, 351, 210}` |
| line count `[probed]`             | 6                                | 4                         | 7                         |

At **992**: 30px/45px, `max-width:none`, section h 270 — desktop type again.
At **768**: 20px/30px, mb 40px, `.content-width` padding-x **36px** not 48
(root 24 × 1.5rem), so the p's x = 74. `[probed]`

##### Reveal

**None.** No `data-w-id`, no IX2 event, no transition.

---

#### B.4 Service cards — `section.service-blocks-sections` (census 4–7)

Markup: `matching/spec/services-blocks.pretty.html` (readable), byte source
`services-live.html:136`.

```
<section class="service-blocks-sections">
  <div class="content-width">
    <div class="service-grid my-8">
      <div id="w-node-…" data-w-id="…" style="transform: translate3d(0px, 4rem, 0px) …; opacity: 0;" class="service-block">
        <div class="h-60pc">
          <div class="mt-8 mx-3">
            <h3 class="mb-4">Cosmetic Dentistry</h3>
            <p class="para-20px pr-4">…</p>
          </div>
        </div>
        <div class="h-40pc bg-color-primary display-flex dark-gradient-up px-1">
          <div class="h-full _w-half pl-2 pt-2"> … 4-9 × <a class="block-link display-flex w-inline-block"><h6 class="services-links">…</h6><img …Arrow.svg></a> … </div>
          <div class="h-full _w-half"></div>
        </div>
        <img src="…icon%3Dtooth%203.svg" class="service-block-teef">
      </div>
      × 4
    </div>
  </div>
</section>
```

`section.service-blocks-sections` — **no rule exists.** Bare block.

##### B.4.1 The grid

`.service-grid` `beachfront.css:6142-6151`: `grid-column-gap:20px;
grid-row-gap:20px; grid-template-rows:auto auto; grid-template-columns:1fr 1fr;
grid-auto-columns:1fr; justify-content:center; justify-items:center; display:grid`.
`.service-grid.my-8` `beachfront.css:6153-6160`: **`grid-column-gap:0; grid-row-gap:0;
grid-template-columns: 16rem 1fr; grid-auto-columns:16rem; grid-auto-flow:row;
justify-content: space-around`** (the gaps are zeroed — the visual gutter is the
cards' own `margin: 2rem .5rem`).
≤991 `beachfront.css:8092-8096`: `grid-template-rows: auto auto auto;
grid-template-columns: 16rem; grid-auto-flow: row` → **single column**.
`.my-8` `beachfront.css:3839-3842`: `margin-top:2rem; margin-bottom:2rem`.

Per-card `grid-area` is authored by node-id, and this page has its **own**
≤991 block:

- base `beachfront.css:9606-9609` — `#w-node-_3cf081fa-…-081e91ef`,
  `#w-node-_6eaa37a4-…`, `#w-node-_1e89cd34-…`, `#w-node-_5cbf129a-…` →
  `grid-area: span 1 / span 1 / span 1 / span 1`
- ≤991 `beachfront.css:9611-9615` — same four ids (plus one from another page) →
  the same `span 1` value. Functionally a no-op, but it is the only page-specific
  media block in the stylesheet; keep the ids if the markup is regenerated.

|                                   | 1440                       | 834                       | 390                        |
| --------------------------------- | -------------------------- | ------------------------- | -------------------------- |
| `margin-top` / `-bottom` (`2rem`) | **80 / 80**                | **64 / 64**               | **48 / 48**                |
| `grid-template-columns` declared  | `16rem 1fr`                | `16rem`                   | `16rem`                    |
| resolved tracks `[probed]`        | `640px 640px`              | `512px`                   | **`384px`**                |
| resolved rows `[probed]`          | `800px 800px`              | `736 736 736 736`         | `504 504 504 504`          |
| container (content col)           | 1280                       | 738                       | **351**                    |
| grid rect `[probed]`              | `{80, 845.19, 1280, 1600}` | `{48, 704.39, 738, 2944}` | `{19.5, 648.5, 351, 2016}` |

`[probed-only]` free-space resolution: the `1fr` track has an **auto minimum**
equal to its item's min-content (card width + its 2 × `.5rem` margins), which at
1440 is 640 — the same as the `16rem` track, so the two columns come out equal
by coincidence, not by authoring. At 992 the `1fr` track resolves to 512 while
the container is only 896, so the grid **overflows by 128px** and
`space-around` degenerates to start.

**At 390 the `16rem` track is 384px inside a 351px content column** — the track
overflows by 33px. `justify-items:center` re-centres the 336px card+margins
inside it, so the card itself lands at x = 55.5 and stops 3px short of the right
padding edge. `[probed]` A rebuild that clamps the track to the container puts
the card at x = 19.5 + 7.5 = 27, an 28px x-error.

##### B.4.2 `.service-block` — **the five-value height ladder**

`beachfront.css:6162-6169`: `background-color: var(--primary-light);
border-radius:25px; width:15rem; height:16rem; margin:2rem .5rem;
position:relative`.

- ≤991 `beachfront.css:8098-8100` → `height: 19rem`
- ≤767 `beachfront.css:8659-8661` → `height: 17rem`
- ≤479 `beachfront.css:9210-9213` → `width: 13rem; height: 17rem`

Both dimensions are `rem`, and the class ladder is offset 1px from the root
ladder, so **height takes FIVE distinct pixel values across 390–1440 and width
takes FOUR**:

| viewport | root   | declared h | **height** | declared w | **width** | margin (`2rem .5rem`) |
| -------- | ------ | ---------- | ---------- | ---------- | --------- | --------------------- |
| 1440     | 40     | `16rem`    | **640**    | `15rem`    | **600**   | 80 / 20               |
| **992**  | **32** | `16rem`    | **512**    | `15rem`    | **480**   | 64 / 16               |
| 991      | 32     | `19rem`    | **608**    | `15rem`    | 480       | 64 / 16               |
| 834      | 32     | `19rem`    | **608**    | `15rem`    | **480**   | 64 / 16               |
| **768**  | **24** | `19rem`    | **456**    | `15rem`    | **360**   | 48 / 12               |
| 767      | 24     | `17rem`    | **408**    | `15rem`    | 360       | 48 / 12               |
| 480      | 24     | `17rem`    | 408        | `15rem`    | 360       | 48 / 12               |
| 479      | 24     | `17rem`    | 408        | `13rem`    | **312**   | 48 / 12               |
| 390      | 24     | `17rem`    | **408**    | `13rem`    | **312**   | 48 / 12               |

All `[probed]` and all reproduced exactly by `root × rem`. Gate matrix:
**640 / 608 / 408** tall, **600 / 480 / 312** wide.

Other computed box facts `[probed]`: `border-radius: 25px` (all four corners,
a fixed px value at every tier — **not** a rem), `background-color:
rgb(231,245,250)`, **`overflow: visible`**, `position: relative`.

Card rects `[probed]`:

|        | 1440                       | 834                        | 390                        |
| ------ | -------------------------- | -------------------------- | -------------------------- |
| card 1 | `{100, 925.19, 600, 640}`  | `{177, 768.39, 480, 608}`  | `{55.5, 696.5, 312, 408}`  |
| card 2 | `{740, 925.19, 600, 640}`  | `{177, 1504.39, 480, 608}` | `{55.5, 1200.5, 312, 408}` |
| card 3 | `{100, 1725.19, 600, 640}` | `{177, 2240.39, 480, 608}` | `{55.5, 1704.5, 312, 408}` |
| card 4 | `{740, 1725.19, 600, 640}` | `{177, 2976.39, 480, 608}` | `{55.5, 2208.5, 312, 408}` |

##### B.4.3 The 2rem overhang — `.h-40pc` paints OUTSIDE the card

`.h-60pc` `beachfront.css:3670-3672` → `height: 60%`.
`.h-40pc` `beachfront.css:3657-3659` → `height: 40%`.
`.h-40pc.bg-color-primary` `beachfront.css:3661-3664` →
`border-bottom-right-radius:25px; border-bottom-left-radius:25px`.
`.h-40pc.bg-color-primary.display-flex.dark-gradient-up` `beachfront.css:3666-3668`
→ `background-image: linear-gradient(to bottom, var(--primary) 40%, #365b6d91)`
(computed `linear-gradient(rgb(18,158,204) 40%, rgba(54,91,109,0.569))`).
`.bg-color-primary` `beachfront.css:5885-5887`. `.display-flex`
`beachfront.css:3023-3026` (`flex-wrap:wrap; display:flex`).
`.px-1` `beachfront.css:4115-4118` → `padding-left/right: .25rem`.

> **Structural fact only visible in source.** `.service-block` is a **grid item**,
> therefore a BFC root, therefore its children's margins cannot collapse out of
> it. The `.mt-8` (`2rem`) on the inner `<div class="mt-8 mx-3">` collapses up
> into `.h-60pc` (which has no top border/padding) and **pushes `.h-60pc` down by
> a full 2rem inside the card**. `.h-60pc` (60%) + `.h-40pc` (40%) still sum to
> 100% of the card height, so the whole stack is displaced: **the blue
> `.h-40pc` panel overflows the card's bottom edge by exactly 2rem**, and because
> `.service-block` is `overflow: visible` it paints there. The rounded bottom you
> see belongs to `.h-40pc.bg-color-primary` (`:3661`), **not** to the card.

|                          | 1440                                 | 834                                 | 390                               |
| ------------------------ | ------------------------------------ | ----------------------------------- | --------------------------------- |
| card box                 | y 925.19 h 640 (bottom **1565.19**)  | y 768.39 h 608 (bottom 1376.39)     | y 696.5 h 408 (bottom 1104.5)     |
| `.h-60pc`                | y **1005.19** h 384                  | y **832.39** h 364.8                | y **744.5** h 244.8               |
| displacement (= `.mt-8`) | **+80**                              | **+64**                             | **+48**                           |
| `.h-40pc`                | y 1389.19 h 256 (bottom **1645.19**) | y 1197.19 h 243.19 (bottom 1440.38) | y 989.3 h 163.19 (bottom 1152.49) |
| **overhang past card**   | **80px**                             | **64px**                            | **48px**                          |
| **visual card height**   | **720px**                            | **672px**                           | **456px**                         |

All `[probed]`, and confirmed visually: an element screenshot clipped to the
600 × 640 card box shows the blue panel running flush to the clip edge with no
bottom radius, while the full-page render shows the rounded blue bottom 80px
lower. A rebuild that sets `overflow:hidden` on the card, or lays the panel out
with flex/absolute inside a 640px box, loses 80px of blue at 1440 and mis-places
every card below it by a cumulative 80/64/48px per row.

`.h-40pc` padding-x (`.px-1` = `.25rem`): **10 / 8 / 6px**.
`.h-40pc` rect width == card width (no inset).

##### B.4.4 Card head — `h3.mb-4` + `p.para-20px.pr-4`

Wrapper `<div class="mt-8 mx-3">`:
`.mt-8` `beachfront.css:3925-3927` → `margin-top: 2rem` (**live here — nothing
outranks it on this element, unlike the lede in B.3**);
`.mx-3` `beachfront.css:3864-3867` → `margin-left/right: .75rem`.

|                         | 1440                       | 834                         | 390                       |
| ----------------------- | -------------------------- | --------------------------- | ------------------------- |
| `.mt-8` (`2rem`)        | **80**                     | **64**                      | **48**                    |
| `.mx-3` (`.75rem`)      | **30**                     | **24**                      | **18**                    |
| wrapper rect `[probed]` | `{130, 1005.19, 540, 240}` | `{201, 832.39, 432, 170.5}` | `{73.5, 744.5, 276, 167}` |

`h3` base `beachfront.css:2124-2132`: `color: var(--primary); margin-top:20px;
margin-bottom:10px; font-family: museo-slab, sans-serif; font-size:40px;
font-weight:300; line-height:50px`. ≤991 `beachfront.css:7863-7866` →
`font-size:21px; line-height:26px`. No ≤767 / ≤479 override.
`.mb-4` `beachfront.css:3985-3988`: **`margin-top: 0; margin-bottom: 1rem`** —
note it kills h3's 20px top margin as well.

| `h3.mb-4`                  | 1440                         | 834             | 390             |
| -------------------------- | ---------------------------- | --------------- | --------------- |
| font-family / weight       | museo-slab, sans-serif / 300 | ←               | ←               |
| font-size / line-height    | **40px / 50px**              | **21px / 26px** | **21px / 26px** |
| letter-spacing / transform | normal / none                | ←               | ←               |
| colour                     | `#129ecc` (`--primary`)      | ←               | ←               |
| margin-top                 | **0**                        | **0**           | **0**           |
| margin-bottom (`1rem`)     | **40px**                     | **32px**        | **24px**        |

At **992**: 40px/50px with `margin-bottom: 32px`. At **768**: 21px/26px with
`margin-bottom: 24px`. `[probed]` — three values for the margin (40/32/24) but
only two for the type (40/21), and the two ladders switch at _different_
viewports.

`p.para-20px.pr-4`:
`.para-20px` `beachfront.css:6179-6181` → `font-size: 20px`;
≤991 `beachfront.css:8102-8104` → `15px`; ≤767 `beachfront.css:8663-8665` → `13px`.
`.pr-4` `beachfront.css:4207-4209` → `padding-right: 1rem`.
Inherits `p` base `beachfront.css:2166-2172` (`color: var(--primary-dark);
margin-bottom:10px; font-weight:300; line-height:1.5em`).
The `p` element rules at `:7877-7879` (16px ≤991), `:8378-8380` (16px ≤767) and
`:9018-9020` (12px ≤479) all lose to `.para-20px` on specificity — including at
≤479, where `.para-20px` has no rule of its own and the ≤767 **13px** carries
through. `[probed]` 13px at 390, not 12px.

| `p.para-20px.pr-4`                | 1440                                | 834                         | 390                       |
| --------------------------------- | ----------------------------------- | --------------------------- | ------------------------- |
| font-family / weight              | museo-sans, sans-serif (body) / 300 | ←                           | ←                         |
| font-size / line-height (`1.5em`) | **20px / 30px**                     | **15px / 22.5px**           | **13px / 19.5px**         |
| letter-spacing / transform        | normal / none                       | ←                           | ←                         |
| colour                            | `#365b6d` (`--primary-dark`)        | ←                           | ←                         |
| margin-bottom                     | 10px                                | 10px                        | 10px                      |
| padding-right (`1rem`)            | **40px**                            | **32px**                    | **24px**                  |
| rect `[probed]` (card 1)          | `{130, 1095.19, 540, 150}`          | `{201, 890.39, 432, 112.5}` | `{73.5, 794.5, 276, 117}` |

At **992**: 20px/30px, pr 32. At **768**: 15px/22.5px, pr 24. Three type tiers
(20/15/13) crossed with three padding tiers (40/32/24) switching at different
viewports.

##### B.4.5 Link columns and `a.block-link`

Column wrappers inside `.h-40pc` (per card, from
`services-blocks.pretty.html`):

| card                 | column classes                                                              | source                                                              |
| -------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| 1 Cosmetic Dentistry | `h-full _w-half pl-2 pt-2` (4 links) + `h-full _w-half` (**empty spacer**)  | `services-blocks.pretty.html:12` + `services-blocks.pretty.html:30` |
| 2 Restore Your Smile | `h-full _w-half pl-2 pt-2` (5 links) + `h-full _w-half pl-2 pt-2` (4 links) | `services-blocks.pretty.html:43` + `services-blocks.pretty.html:65` |
| 3 General Dentistry  | `h-full pt-2 pl-2` (6 links) — **one column, no `_w-half`**                 | `services-blocks.pretty.html:94`                                    |
| 4 Specialty Services | `h-full _w-half pl-2 pt-2 su-w-full-tablet dark-gradient-up` (5 links)      | `services-blocks.pretty.html:131`                                   |

`.h-full` `beachfront.css:3149-3151` (`height:100%`).
`._w-half` `beachfront.css:2867-2871` (`object-fit:fill; width:50%; position:relative`).
`.pl-2` `beachfront.css:4263-4265` (`padding-left:.5rem`);
`.pt-2` `beachfront.css:4158-4160` (`padding-top:.5rem`).
`.su-w-full-tablet` **≤991 only** `beachfront.css:8215-8217` → `width: 100%`.
`.dark-gradient-up` on card 4's column has **no matching rule** — the only
selector containing it is the 4-class compound at `beachfront.css:3666`, which
does not match this element. It is inert; do not add a gradient there.

| column width `[probed]`            | 1440                       | 834                        | 390                        |
| ---------------------------------- | -------------------------- | -------------------------- | -------------------------- |
| card 1 col A / col B               | 290 / 290                  | 232 / 232                  | 150 / 150                  |
| card 2 col A / col B               | 290 / 290                  | 232 / 232                  | 150 / 150                  |
| **card 3 (single, shrink-to-fit)** | **262.64** `[probed-only]` | **188.72** `[probed-only]` | **150.77** `[probed-only]` |
| **card 4 (`su-w-full-tablet`)**    | **290** (50%)              | **464** (100%)             | **300** (100%)             |
| `.pl-2` / `.pt-2` (`.5rem`)        | 20 / 20                    | 16 / 16                    | 12 / 12                    |

Card 3's width is content-driven (a `.h-full` flex item with `width:auto`,
sized by its widest nowrap link, `ORAL CANCER SCREENING`) — it is genuinely
`[probed-only]` and must not be hardcoded. Card 4's width flipping from 50% to
100% at 991 is a **hard tier boundary at 991, not 768** (`:8215`).

`a.block-link.display-flex.w-inline-block`:
`.block-link` `beachfront.css:6191-6197`: `white-space:nowrap;
background-color:#0000; align-items:center; display:flex; position:relative`
(the transparent background is what defeats the site-wide
`a { background-color:#129ecc0d; border-radius:5px }` at `beachfront.css:2174-2179`).
`.block-link.display-flex` `beachfront.css:6199-6203`: `white-space:nowrap;
text-decoration:none; transition: opacity .2s`.
`.display-flex` `beachfront.css:3023-3026`; **≤991 `beachfront.css:7890-7892` →
`.display-flex { font-size: .6rem }`** (an inherited rem font-size that exists
only below 992: **19.2px at 834, 14.4px at 390, nothing at 1440**) and ≤767
`beachfront.css:8386-8388` → `flex-wrap: wrap`.

`h6.services-links`:
`.services-links` `beachfront.css:6222-6230`: `color:#fff; margin-top:0;
margin-bottom:0; margin-right:10px; font-size:14px; line-height:2.75em;
text-decoration:none`.

- ≤991 `beachfront.css:8106-8108` → `font-size: 9px`
- ≤767 `beachfront.css:8667-8669` → `font-size: 9px`
- ≤479 `beachfront.css:9219-9222` → `margin-right: 4px; font-size: 7px`

Inherits from `h6` `beachfront.css:2154-2164`: `letter-spacing:1.28px;
text-transform:uppercase; font-family: museo-slab, sans-serif; font-weight:700`
(its `color`, `font-size`, `line-height`, `margin` are all overridden).

| `h6.services-links`          | 1440                             | 834                             | 390                             |
| ---------------------------- | -------------------------------- | ------------------------------- | ------------------------------- |
| font-family / weight         | museo-slab, sans-serif / **700** | ←                               | ←                               |
| font-size                    | **14px**                         | **9px**                         | **7px**                         |
| line-height (`2.75em`)       | **38.5px**                       | **24.75px**                     | **19.25px**                     |
| letter-spacing               | **1.28px**                       | 1.28px                          | 1.28px                          |
| text-transform               | **uppercase**                    | ←                               | ←                               |
| colour                       | `#fff`                           | ←                               | ←                               |
| margin                       | `0 10px 0 0`                     | `0 10px 0 0`                    | **`0 4px 0 0`**                 |
| rect `[probed]` (first link) | `{130, 1409.19, 206.19, 38.5}`   | `{201, 1213.19, 141.23, 24.75}` | `{73.5, 1001.3, 115.25, 19.25}` |

**This is a px ladder, not a rem ladder** — it steps at the Webflow breakpoints
(991 and 479) only, so 992 still renders 14px. Do not key it to the root ladder.
Source casing in the HTML is mixed (`Tooth discoloration`, `dental veneers`,
`Nitrous oxide (n2O)`, `Mi paste / Mi Paste plus`) and is uppercased purely by
`text-transform` — **keep the source casing** or content diffs fail.

Row height per link = the h6's line-height: **38.5 / 24.75 / 19.25px**. Link
counts per card: 4 / 9 / 6 / 5 = **24 links total** `[probed]`.

##### B.4.6 Assets

| asset                         | src                                                                                                         |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------- |
| arrow (24 ×, one per link)    | `https://cdn.prod.website-files.com/64af3f93339537d6b661b556/64b070f15651708aded7ab3e_Arrow.svg`            |
| tooth icon, cards **1 and 3** | `https://cdn.prod.website-files.com/64af3f93339537d6b661b556/64b05fba95fa3003b8c411e7_icon%3Dtooth%203.svg` |
| tooth icon, cards **2 and 4** | `https://cdn.prod.website-files.com/64af3f93339537d6b661b556/64b05fba486da5a75e84f0d0_icon%3Dtooth%202.svg` |

All three exist as files — **never redraw them.** Local copies:
`matching/spec/live-arrow.svg` (intrinsic **10 × 11**),
`matching/spec/live-tooth3.svg` (intrinsic **90 × 90**, square),
`matching/spec/live-tooth2.svg` (intrinsic **91 × 90**, _not_ square).
All carry `loading="lazy" alt=""`.

The arrow has **no CSS rule at all** — it renders at its intrinsic 10 × 11 at
every viewport. `[probed]` `{…, 10, 11}` at 1440, 834 and 390 alike.

`.service-block-teef` `beachfront.css:6183-6189`: `z-index:5; width:2.5rem;
position:absolute; top:-1.25rem; right:1.5rem`. No media overrides — a pure
root-font ladder:

|                         | 1440                      | 834                     | 390                      |
| ----------------------- | ------------------------- | ----------------------- | ------------------------ |
| width (`2.5rem`)        | **100px**                 | **80px**                | **60px**                 |
| height (tooth 3, 1:1)   | 100px                     | 80px                    | 60px                     |
| height (tooth 2, 91:90) | **98.89px** `[probed]`    | **79.11px**             | **59.33px**              |
| top (`−1.25rem`)        | **−50px**                 | **−40px**               | **−30px**                |
| right (`1.5rem`)        | **60px**                  | **48px**                | **36px**                 |
| rect card 1 `[probed]`  | `{540, 875.19, 100, 100}` | `{529, 728.39, 80, 80}` | `{271.5, 666.5, 60, 60}` |

The icon overhangs the card's top edge by 50/40/30px and is the only thing
painting above it. `z-index:5` sits under `.bot-wave`'s `z-index:8` and the
header's `z-index:10`.

##### B.4.7 Reveal — see §D

Each card carries a Webflow-authored inline style
(`services-blocks.pretty.html:4, 35, 86, 123`):
`transform: translate3d(0px, 4rem, 0px) scale3d(1,1,1) rotateX(0) rotateY(0) rotateZ(0) skew(0,0); opacity: 0; transform-style: preserve-3d;`
This is IX2's initial state, injected at runtime — **not** authored CSS. After
settling, `[probed]` `transform: matrix(1,0,0,1,0,0)`, `opacity: 1`.

---

#### B.X Where the vertical space actually lives (gate-cut critical)

Neither `.we-offer-section` nor `.service-blocks-sections` has a single CSS rule.
Every gap on this page is a **collapsed margin between section boxes**:

| gap @1440                                | px     | where it comes from                                                                                                  | source                                        |
| ---------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| hero bottom → lede section top           | **20** | `.text-body-large { margin-top: 20px }` collapsed out through `.content-width` and the section                       | `beachfront.css:7760`                         |
| lede section bottom → blocks section top | **80** | max(lede's `margin-bottom:40px`, grid's `.my-8` `margin-top:2rem`=80) — **adjoining margins collapse to the larger** | `beachfront.css:7761` + `beachfront.css:3840` |
| blocks section bottom → footer top       | **80** | grid's `.my-8` `margin-bottom: 2rem` collapsed out                                                                   | `beachfront.css:3841`                         |
| card top → `.h-60pc` top                 | **80** | `.mt-8` trapped inside the grid item (B.4.3)                                                                         | `beachfront.css:3926`                         |

Resolved at the gate matrix (all `[probed]`):

| gap             | 1440   | 834    | 390    |
| --------------- | ------ | ------ | ------ |
| hero → lede     | 20     | 20     | 20     |
| lede → blocks   | **80** | **64** | **48** |
| blocks → footer | **80** | **64** | **48** |

A rebuild that expresses these as section `padding` instead of collapsing child
margins will (a) shift which gate region owns the space and (b) _double_ the
lede→blocks gap to 120/104/68 because 40 + 80 no longer collapses.

---

### C. INTERACTION INVENTORY

Enumerated from the settled live DOM at 1440 (every `a`, `button`, `input`,
`select`, `textarea`, `[data-w-id]` with a click event, and every element with
`cursor: pointer` or a class matching
`/open|active|expand|menu|modal|dropdown|accordion|slider/`), excluding the
Google-Maps widget's internal controls (counted once as the widget).

**Unique to this page (24)**

| #    | element                                                                                                                    | behaviour                                                        | source                                                                                                                                     |
| ---- | -------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 1–24 | 24 × `a.block-link.display-flex.w-inline-block` (one per service link: 4 in card 1, 9 in card 2, 6 in card 3, 5 in card 4) | navigate to `/services/<slug>`; hover → `opacity: .6` over `.2s` | `beachfront.css:6199-6203` (transition), `:6205-6207` (`:hover{opacity:.6}`); wins over `a:hover{opacity:.61}` `:2181-2183` on specificity |

The 24 hrefs, in DOM order (`services-blocks.pretty.html`): `/services/`
`tooth-discoloration` · `dental-veneers` · `teeth-whitening` · `smile-makeovers` ·
`cerec-crowns` · `dental-implants` · `full-reconstruction` · `porcelain-inlays` ·
`porcelain-veneers` · `dental-bonding` · `dental-bridges` · `dental-crowns` ·
`porcelain-onlays` · `dental-cleanings` · `deep-cleanings` · `laser-dentistry` ·
`oral-cancer-dentistry` · `dental-exams` · `composite-fillings` · `invisalign` ·
`talon-nightguards` · `oraverse` · `mi-paste` · `nitrous-oxide`.

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

`_chrome.md`; listed here only so the Phase-5 count is fixed.

| #     | element                                                                                                                                                                                                                                                               | ref         |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| 25    | `a.link-block-5` header logo → `/`                                                                                                                                                                                                                                    | chrome §3.1 |
| 26    | `a.link-block-4` + `img.header-hamburger[data-w-id=d74a87ea-…]` — open panel (IX2 `e-9` → `a-4`)                                                                                                                                                                      | chrome §3.4 |
| 27    | `img.header-hamburger[data-w-id=8dfa6638-…]` inside `.dropdown-modal` — close panel (IX2 `e-7` → `a-3`)                                                                                                                                                               | chrome §3.4 |
| 28–34 | 7 × `a.no-text-dec > h3.modal-link` (Home Page · First Visit · Meet Our Team · **Services** `aria-current="page" w--current` · Ask the Doctor · Contact · (310) 378-9241)                                                                                             | chrome §3.5 |
| 35    | panel `a.button.show-form.nav` "Book an Appointment" (IX2 `e-307` → `a-5` + jQuery `services-live.html:148-158`)                                                                                                                                                      | chrome §3.6 |
| 36    | panel `a.button.nav` "Make a Payment" → `app.modento.io/beachfront-dentistry`                                                                                                                                                                                         | chrome §3.1 |
| 37    | CTA `a.button.show-form[data-w-id=1273e294-…4f60]` "Book Appointment" (IX2 `e-17` → `a-5`)                                                                                                                                                                            | chrome §4.3 |
| 38    | `div.block-link.social-link-block[data-w-id=9daf7a34-…]` "Read Reviews" toggle (IX2 `e-211`→`a-8`, `e-212`→`a-9`, **plus** jQuery `$('.social-link-block').click(toggle)` at `services-live.html:172`, `toggle` defined in `matching/spec/incidental-utils.js:14-23`) | chrome §4.4 |
| 39–41 | 3 × `a._w-8.clickable.su-w-6-portrait` — Google Maps review page · Facebook · Yelp                                                                                                                                                                                    | chrome §4.4 |
| 42–45 | 4 × footer `a.inline-link` (Your First Visit · Our Team · **Services** `w--current` · Ask the Doctor)                                                                                                                                                                 | chrome §5.3 |
| 46    | footer `a.button[data-w-id=b1ce8885-…]` "Make a Payment" (IX2 → `a-5`)                                                                                                                                                                                                | chrome §5.3 |
| 47    | footer `a.inline-link[href="tel:(310)-378-9241"]`                                                                                                                                                                                                                     | chrome §5.5 |
| 48    | `.footer-map.w-widget.w-widget-map` Google Maps widget (pan / zoom / fullscreen / Street View — third-party, counted once)                                                                                                                                            | chrome §5.7 |
| 49    | form-modal `a.inline-link` logo → `/`                                                                                                                                                                                                                                 | chrome §3.6 |
| 50    | form-modal `a.inline-link` + `img.header-hamburger[data-w-id=b914d569-…]` close (IX2 `e-21` → `a-6` + jQuery `hideForm`)                                                                                                                                              | chrome §3.6 |
| 51    | form-modal `input[type=text]._w-40pc.text-field.w-input`                                                                                                                                                                                                              | chrome §3.6 |
| 52    | form-modal `input[type=email]._w-40pc.text-field.w-input`                                                                                                                                                                                                             | chrome §3.6 |
| 53    | form-modal `input[type=tel]._w-40pc.text-field.w-input`                                                                                                                                                                                                               | chrome §3.6 |
| 54    | form-modal `textarea._w-60pc.text-field.body.w-input`                                                                                                                                                                                                                 | chrome §3.6 |
| 55    | form-modal `input[type=submit].button.text-color-primary.w-button`                                                                                                                                                                                                    | chrome §3.6 |

**Explicitly NOT counted** (not elements, or not actuatable):

- The **portrait `alert()`** at `services-live.html:160-169` — fires on load and
  on `window:resize` when `innerWidth < 792 && innerHeight < innerWidth`. It is a
  native dialog, not a DOM control. It **will block a headless probe** unless the
  page object dismisses dialogs; every probe in this file registers
  `p.on("dialog", d => d.dismiss())` or runs at a width/height that avoids it.
- `img.expanding-plus` / `img.expanding-minus` / `div.plus-minus-block` — visual
  children of #38; clicks bubble to the toggle.
- `.socials-container` — a revealed container, not a control; its 3 anchors are
  #39–41.
- Hover-only states (`a:hover`, `.block-link.display-flex:hover`,
  `.inline-link:hover` `beachfront.css:7391`) — states of counted elements.
- The 4 `.footer-copyright` items — plain `<div>`s, not links
  (`services-live.html:140`).

**INTERACTION COUNT: 55**

---

### D. ANIMATION CENSUS

Read from live's IX2 store (`Webflow.require("ix2").store.getState().ixData`)
plus the page's own jQuery. `[probed-only]` — IX2 data ships inside the Webflow
runtime bundle
(`beachfront-dentistry.schunk.f0bc49bb141fcb49.js` / `.schunk.36b8fb49256177c8.js`,
loaded at `services-live.html:140`), not in any file under `matching/spec/`.

**Elements on this page carrying `data-w-id` (15 total)** — 4 are page-unique:

| `data-w-id`                            | element                 | event                                          | action list |
| -------------------------------------- | ----------------------- | ---------------------------------------------- | ----------- |
| `3cf081fa-b9d3-71fb-98f9-c347f1331064` | `.service-block` card 1 | `SCROLL_INTO_VIEW` `e-91` (auto-stop `e-92`)   | `a-7`       |
| `6eaa37a4-210a-fd62-1e13-74b35a0bdb4c` | `.service-block` card 2 | `SCROLL_INTO_VIEW` `e-93` (auto-stop `e-94`)   | `a-7`       |
| `1e89cd34-34af-262f-159d-fb2903dc344d` | `.service-block` card 3 | `SCROLL_INTO_VIEW` `e-151` (auto-stop `e-152`) | `a-7`       |
| `5cbf129a-b6eb-f6e0-1992-324564fc9877` | `.service-block` card 4 | `SCROLL_INTO_VIEW` `e-97` (auto-stop `e-98`)   | `a-7`       |

The remaining 11 are chrome (`b914d569`, `d74a87ea`, `6eca16bd`, `8dfa6638`,
`1273e294-…4f5b/4f5f/4f60/4f62/4f6a`, `9daf7a34`, `b1ce8885`) — chrome §3.4,
§4.7, §4.4.

**Action list `a-7` — title "up and in"** (the only reveal on this page; the CTA
band's five elements share it, chrome §4.7):

```
useFirstGroupAsInitialState: true
group 1 (INITIAL STATE, applied as an inline style before paint)
  TRANSFORM_MOVE   yValue: 4   yUnit: "rem"   duration: 0    delay: 0   easing: ""
  STYLE_OPACITY    value: 0                   duration: 0    delay: 0   easing: ""
group 2 (ON TRIGGER)
  TRANSFORM_MOVE   yValue: 0   yUnit: "rem"   duration: 2000 delay: 0   easing: "outExpo"
  STYLE_OPACITY    value: 1                   duration: 2000 delay: 0   easing: "outExpo"
```

Trigger config for all four cards:
`{loop:false, playInReverse:false, scrollOffsetValue:0, scrollOffsetUnit:"%"}`.
Webflow's `SCROLL_INTO_VIEW` is **IntersectionObserver-driven** (not
scroll-linked, not click) with a 0% offset — it fires once when the element's
box first intersects the viewport. The paired `autoStopEventId` is a stop-only
counterpart; with `playInReverse:false` the reveal **never replays or reverses**
on scroll-out.

> **The travel distance is itself a three-tier rem value.** `yUnit: "rem"` with
> `yValue: 4` resolves against the live root font at animation time:

|                     | 1440      | 992       | 834       | 768      | 390      |
| ------------------- | --------- | --------- | --------- | -------- | -------- |
| root                | 40px      | 32px      | 32px      | 24px     | 24px     |
| **travel (`4rem`)** | **160px** | **128px** | **128px** | **96px** | **96px** |

Duration is a flat **2000ms** with easing **outExpo**
(`cubic-bezier(0.19, 1, 0.22, 1)`) at every tier. Opacity 0 → 1 over the same
2000ms/outExpo.

**Not animated on this page:** the hero, `.bot-wave`, the lede paragraph, the
tooth icons and the arrow icons. None carry `data-w-id`; none appear in any IX2
event. They must be fully opaque and untransformed on first paint.

**CSS transitions in play (page-unique):**

- `.block-link.display-flex { transition: opacity .2s }` `beachfront.css:6199-6203`
- `a { transition: opacity .2s }` `beachfront.css:2174-2179`

**Runtime DOM mutation:** `$(".bot-wave").append(<svg…>)` at
`services-live.html:145` injects the hero wave after DOM-ready. Any probe that
reads `.bot-wave` before jQuery runs sees an empty 0-height wrapper.

**Probe discipline for this page:** the cards' 2000ms outExpo means an early
read returns a card y that is up to **160px too low** at 1440 and an
`opacity` between 0 and 1. Always scroll in ≤250px steps with ≥80ms dwell, then
hold until `document.getAnimations().every(a => a.playState !== "running")`,
then add a settle delay before reading any rect.

---

### E. KNOWN-SUSPECT LIST

Ordered by confidence that our build has it wrong.

**E1 — `.service-block` height/width: a FIVE-value ladder our two-tier code
cannot express.** `beachfront.css:6165-6166` (`width:15rem; height:16rem`),
`beachfront.css:8098-8100` (≤991 `height:19rem`), `beachfront.css:8659-8661` (≤767 `height:17rem`),
`beachfront.css:9210-9213` (≤479 `width:13rem; height:17rem`). Crossed with the root ladder
(`services-live.html:3-18`), height resolves to **640 (≥993) / 512 (992) / 608
(991–769) / 456 (768) / 408 (≤767)** and width to **600 / 480 / 360 / 312**. A
ladder keyed at 768 renders 640 across the whole 768–991 band where live renders
608 — a **32px per-card error that compounds into ~128px of accumulated y-drift**
by the bottom of the 4-card stack at 834, dragging the CTA band and footer with
it. This is the single highest-confidence defect on the page.

**E2 — `.mt-8` on the lede paragraph is inert and will be applied anyway.**
`beachfront.css:3925-3927` (`.mt-8{margin-top:2rem}`) and `beachfront.css:7760-7765`
(`.text-body-large{margin-top:20px}`) have identical specificity; `beachfront.css:7760` is
later in the file and **wins**. Live's computed `margin-top` is **20px at every
viewport** `[probed, all 9 widths]`. A rebuild that maps the class list
`text-body-large text-color-primary mt-8 _w-620px mx-auto text-align-center slab`
naively to utilities will emit 80/64/48px and push everything from the lede
downward by 60/44/28px. Same trap for `margin-bottom`: `.text-body-large` sets
40px (`beachfront.css:7761`), dropping to 20px only at ≤479 (`beachfront.css:9573-9576`).

**E3 — the 2rem overhang: `.h-40pc` paints outside `.service-block`.**
`.service-block` is a grid item (`beachfront.css:6153-6160` makes the parent a
grid) and therefore a BFC root, so the `.mt-8` (`beachfront.css:3925`) on
`services-blocks.pretty.html:6` cannot collapse out; it displaces `.h-60pc`
(`beachfront.css:3670`) down 2rem and pushes `.h-40pc` (`beachfront.css:3657`) **80/64/48px past the card's
bottom edge**, where `overflow: visible` lets it paint. The visible card is
**720 / 672 / 456px tall**, not 640 / 608 / 408. The rounded bottom belongs to
`.h-40pc.bg-color-primary` (`beachfront.css:3661-3664`), not to the card's `border-radius:25px`
(`beachfront.css:6164`). Any `overflow:hidden`, or flex/absolute layout that keeps the panel
inside the card box, loses the overhang and the bottom radius simultaneously.

**E4 — `.services-links` is a px ladder gated at 991/479, not a rem ladder.**
`beachfront.css:6222-6230` (14px), `beachfront.css:8106-8108` (≤991 → 9px), `beachfront.css:8667-8669`
(≤767 → 9px), `beachfront.css:9219-9222` (≤479 → `margin-right:4px; font-size:7px`). At **992
it is still 14px** even though the root has already stepped to 32. With
`line-height: 2.75em` the row height is **38.5 / 24.75 / 19.25px**, which sets
the height of every link column — 9 rows in card 2 means a 9× multiplier on any
error here. `margin-right` is also three-valued: 10 / 10 / **4**.

**E5 — the lede and the blocks are separated by a COLLAPSED margin, not padding.**
`.we-offer-section` and `.service-blocks-sections` have **zero CSS rules** (0
grep hits in `beachfront.css`, absent from `services-live.html:3-58` and
`:84-134`). The 80/64/48px between them is `max(40px, 2rem)` where the 40 is
`.text-body-large`'s `margin-bottom` (`beachfront.css:7761`) and the 2rem is `.my-8`'s
`margin-top` (`beachfront.css:3840`). Express either as section padding and the gap becomes
120/104/68 — a 40px error at 1440 — _and_ the space moves from "between gate
regions" into region R1.

**E6 — `.subpage-hero-heading`'s four ladders switch at four different places.**
`beachfront.css:6126-6136` + `beachfront.css:8076-8080` (≤991 `text-align:left; width:80%;
left:10%`) + `beachfront.css:9200-9202` (≤479 `left:10%`), with font-size from `h2`
(`beachfront.css:2114-2122` 140/168 → `beachfront.css:7858-7861` 72/80 → `beachfront.css:9012-9016` 56/70). Its
`margin-top:8%` / `margin-bottom:5%` resolve against the hero's **width**
(115.19 / 66.72 / 31.19 and 72 / 41.69 / 19.5) while `bottom:2%` resolves against
the hero's **height** (9.5 / 10 / 7.41). A build that hardcodes `top` or treats
the % margins as height-relative will be wrong at every tier.

**E7 — `.hero.redondo` height jumps 267px across the 991/992 seam.**
`beachfront.css:5297` (33vw) → `beachfront.css:7980-7982` (≤991 60vw) → `beachfront.css:8438-8445` (≤767
70vw) → `beachfront.css:9072-9076` (≤479 95vw). At 992 the hero is **327.36px**; at 991 it is
**594.59px**. Also `background-size` is `100%` at 1440 **and 834**, only becoming
`cover` at ≤767 (`beachfront.css:8443`) / ≤479 (`beachfront.css:9074`) — a build that uses `cover`
everywhere crops the beach photo differently at 834.

**E8 — the `16rem` grid track overflows the container at 390.**
`beachfront.css:8092-8096` sets `grid-template-columns: 16rem` at ≤991; at root
24 that is **384px** inside a **351px** `.content-width` content column
(`beachfront.css:9164-9167`, 5% padding). `justify-items:center` (`beachfront.css:6149`) then re-centres the
336px card+margins, landing the card at **x = 55.5**, not at the padding edge.
Clamping the track to the container moves the card to x ≈ 27.

**E9 — per-card column asymmetry that no single rule expresses.** Card 1 has a
**deliberately empty** `._w-half` spacer (`services-blocks.pretty.html:30-31`);
card 3 has **no `_w-half` at all** so its column is shrink-to-fit
(`[probed-only]` 262.64 / 188.72 / 150.77); card 4 flips 50% → 100% at **991**
via `.su-w-full-tablet` (`beachfront.css:8215-8217`), giving 290 / 464 / 300. Card
4's `dark-gradient-up` class is **inert** — the only selector containing it
(`beachfront.css:3666-3668`) is a 4-class compound that does not match that element.

**E10 — `.display-flex { font-size: .6rem }` exists only below 992.**
`beachfront.css:7890-7892`. It sets an inherited font-size on `.h-40pc` and on
every `a.block-link.display-flex` of **19.2px at 834 / 14.4px at 390 and nothing
at 1440**. The `h6` children override it, but any implementation that adds a
`.display-flex` utility with a fixed font-size, or omits it entirely, changes
line-box metrics around the 10 × 11 arrow.

**E11 — `.para-20px` beats `p` at ≤479, so mobile body text is 13px not 12px.**
`beachfront.css:8663-8665` (`.para-20px{font-size:13px}` at ≤767) has no ≤479
counterpart, so it carries through and outranks `p{font-size:12px}`
(`beachfront.css:9018-9020`) on specificity. `[probed]` 13px / 19.5px at 390.

**E12 — the hero wave SVG is injected, not authored.**
`services-live.html:145`. Live has exactly **one** `svg` inside `.bot-wave`
`[probed]`. A rebuild that ships the SVG in markup _and_ ports the injector
renders two overlapping waves; one that ships neither renders none. Its
`rotate(180deg)` is on the **parent** (`services-live.html:20-22`), its height is
`3rem` = **120 / 96 / 72px** (`:24-29`), and its width is `calc(133% + 1.3px)`
= **1916.5 / 1110.52 / 520px**.

---

### F. CITATION INDEX

Machine-counted over sections A–E of this file (a bare `:NNNN` resolves to the
file named immediately before it, which is how it reads in prose).

**192 citation occurrences · 124 DISTINCT SOURCE LINES across 5 files.**

`beachfront.css` — **94** distinct rule/marker lines:
2047, 2096, 2114, 2124, 2154, 2166, 2174, 2181, 2867, 3023, 3149, 3657, 3661,
3666, 3670, 3839, 3840, 3841, 3844, 3864, 3925, 3926, 3985, 4115, 4158, 4207,
4263, 4460, 5295, 5297, 5302, 5303, 5305, 5858, 5885, 5936, 6008, 6126, 6132,
6142, 6149, 6153, 6162, 6164, 6165, 6179, 6183, 6191, 6199, 6205, 6222, 6328,
7391, 7760, 7761, 7767, 7852, 7858, 7863, 7877, 7890, 7980, 8076, 8092, 8098,
8102, 8106, 8215, 8363, 8367, 8372, 8378, 8386, 8438, 8442, 8443, 8627, 8659,
8663, 8667, 9011, 9012, 9018, 9042, 9072, 9073, 9074, 9164, 9200, 9210, 9219,
9573, 9606, 9611.

`services-live.html` — **19**:
3, 8, 12, 16, 20, 24, 32, 84, 85, 87, 91, 95, 100, 136, 140, 145, 148, 160, 172.

`services-blocks.pretty.html` — **8**: 4, 6, 12, 30, 43, 65, 94, 131.

`services-top.html` — **2**: 1, 5. · `incidental-utils.js` — **1**: 14.

Cross-file: `matching/spec-sections/_chrome.md` §1, §2, §3.1, §3.4, §3.5, §3.6,
§4.3, §4.4, §4.6, §4.7, §5.3, §5.5, §5.7 (shared chrome — not restated here).

`[probed-only]` values in this file — the complete list:

1. Grid free-space / `1fr` auto-minimum resolution (§B.4.1)
2. Card 3's shrink-to-fit column width (§B.4.5)
3. IX2 `a-7` "up and in" definition and all `e-*` event ids (§D)
4. The four cards' Webflow-injected initial inline styles (§B.4.7)
5. Tooth-2's 98.89 / 79.11 / 59.33px rendered heights (91:90 aspect, §B.4.6)
6. Margin-collapse _results_ (the authored margins are all cited; §B.X)
7. `.bot-wave`'s single injected `<svg>` child count (§B.2)

---

## `[probed-only]` inventory

Values with NO stylesheet line. They were read off the rendered reference
and must be re-derived if anything upstream changes — never copied blindly
into a fix, and never cited as though they were a rule (repo CLAUDE.md
rule 1).

14. `services.md:14` — `[probed-only]` and are the only numbers here without a line.
15. `services.md:413` — `[probed-only]` free-space resolution: the `1fr` track has an **auto minimum**
16. `services.md:593` — | **card 3 (single, shrink-to-fit)** | **262.64** `[probed-only]` | **188.72** `[probed-only]` | **150.77** `[probed-only]` |
17. `services.md:599` — `[probed-only]` and must not be hardcoded. Card 4's width flipping from 50% to
18. `services.md:786` — plus the page's own jQuery. `[probed-only]` — IX2 data ships inside the Webflow
19. `services.md:936` — (`[probed-only]` 262.64 / 188.72 / 150.77); card 4 flips 50% → 100% at **991**
20. `services.md:990` — `[probed-only]` values in this file — the complete list:
