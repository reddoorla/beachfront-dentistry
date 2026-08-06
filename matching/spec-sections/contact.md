## contact — Contact Us (`/contact-us`)

**Governing rule (CLAUDE.md #1): source prescribes, rects only verify.** Every
geometry/type value below carries a `beachfront.css:<line>` or
`contact-us.html:<line>` citation. Values that genuinely exist only as computed
output (Webflow IX2 inline styles, Google Maps runtime DOM, line-box /
margin-collapse results) are tagged `[probed-only]` and are the only numbers
here without a line.

Structural sample: `matching/spec/contact-us.html` (Webflow page id
`655680f0c897c56b081e91c8`, `contact-us.html:1`).
Stylesheet: `matching/spec/beachfront.css`.
Probe: `https://www.beachfrontdentistry.com/contact-us` at 1440 / 834 / 390,
scrolled in 250px steps @80ms, then held until `document.getAnimations()`
reported nothing running (the map and the contact block both carry a 2000ms
`outExpo` reveal — an unsettled read has the map at `opacity: 0` and 4rem low,
which is exactly the state the saved HTML capture froze it in).

**Shared chrome is NOT re-specified here.** Nav bar, off-canvas panel,
appointment form modal, closing CTA band, and footer are specced in
`matching/spec-sections/_chrome.md` (§3, §3.6, §4, §5). This page's markup for
those regions is byte-identical to `index.html` per `_chrome.md` §0. This file
adds only: the contact hero, the info-section, and the page-unique interaction /
animation wiring.

**Root-font ladder on this page.** `contact-us.html:11-13` `html{font-size:40px}`,
`:16-18` `@media (max-width:992px){html{font-size:32px}}`, `:20-22` `(max-width:768px)
→ 24px`, `:24-26` `(max-width:480px) → 24px` (no-op). Repeated verbatim at
`contact-us.html:70`, `:72-74`, `:76-78`, `:80-82`. Webflow class gates are
`beachfront.css:7852` (≤991), `:8372` (≤767), `:9011` (≤479). **Offset by 1px →
every rem has three values.** Resolution table: `_chrome.md` §1.

Inherited body type (constant, no media override — grep `'^  body {'` returns
nothing): `beachfront.css:2096-2102` `color:#333; font-family: museo-sans,
sans-serif; font-size: 64px; font-weight: 300; line-height: 1.2em` → **64px /
76.8px at all three widths**. This matters: it is the strut of the anonymous
line box that holds the info-section's inline-block button (see §5 box notes).

---

## A. Section census

Numbered top to bottom in document order. `y@1440` is document-space top of the
element's border box, settled.

| # | label | anchor (unique opening text) | y@1440 | y@834 | y@390 |
|---|---|---|---|---|---|
| 1 | Nav header bar (chrome, fixed overlay) | *(no text — `img.header-logo` at x=80 y=21.45)* | 0 | 0 | 0 |
| 2 | Off-canvas nav panel (chrome, offscreen) | `Home Page` | −1350 `[probed-only]` | −1350 | −1350 |
| 3 | Appointment form modal (chrome, offscreen) | `Request Appointment` | −1350 `[probed-only]` | −1350 | −1350 |
| 4 | Hero — photo + double gradient + wave + heading | `Contact Us` | 0 | 0 | 0 |
| 5 | Info: "Book Appointment" pill | `Book Appointment` ⚠ **not unique** | 535.19 | 548.39 | 406.50 |
| 6 | Info: CONTACT + OFFICE HOURS blocks | `1706 S Elena Ave. Suite B` ⚠ **not unique** | 661.19 | 650.39 | 540.88 |
| 7 | Info: location map (Google Maps widget) | *(no text of ours — `[aria-label="Beachfront Dentistry"]`)* | 921.19 | 858.39 | 832.88 |
| 8 | Closing CTA band (chrome) | `Ready for great dental health` | 1361.19 | 1293.39 | 1267.88 |
| 9 | Footer info (chrome) | `Want to learn more` | 2581.19 | 2138.00 | 1717.88 |

Document height: **3276 / 3104 / 2830** `[probed-only]`.

Sections 1–3 are fixed/offscreen and contribute nothing to document flow.
**Only four sections are in flow: 4 (hero), 5+6+7 (one `<section class="info-section">`),
8+9 (one `<section class="footer">`).**

### Gate-region mapping — where defects will hide

The gate cuts this page at three anchors: `Book Appointment`,
`Ready for great dental health`, `Want to learn more`. That yields four regions:

| region | span @1440 | height | census sections inside |
|---|---|---|---|
| R0 | 0 → 535.19 | 535.19 | **1 (chrome) + 4 (hero) + the top 60px of the info-section** |
| R1 | 535.19 → 1361.19 | **826.00** | **5 + 6 + 7 + the 40px info→footer gap** |
| R2 | 1361.19 → 2581.19 | 1220.00 | 8 (chrome CTA band) |
| R3 | 2581.19 → 3276 | 694.81 | 9 (chrome footer) |

**Explicit dilution warnings:**

1. **R0 straddles a section boundary.** The cut is on the button, not on the
   info-section's top edge. So 475.19px of hero and 60px of info-section share
   one region. A wrong hero height (a 4-step vw ladder, see §4) or a wrong
   `.mt-6` on the button both land in R0 and can cancel each other.
2. **R1 is one 826px region holding THREE census sections** (button, the
   two-column contact/hours blocks, the 400px map) **plus the collapsed
   info→footer gap**. The contact/hours blocks are only 200px of that 826 — a
   fully-wrong `mr-8 + pr-8` inter-column gap (160px at 1440) is ~19% of R1's
   height and can sit under the 0.10 threshold once the 400px map (which is a
   third-party canvas and will never match anyway) dominates the diff. **Do not
   read a passing R1 as "the contact blocks are right."** Verify §6 and §7
   against their own rects.
3. The whole page is only four gate regions for nine census sections. Two of
   the four regions are pure chrome.

### Anchor-uniqueness hazards (verified against `document.body.innerText`)

| string | occurrences in rendered text |
|---|---|
| `Book Appointment` | **2** — info-section pill AND the CTA band pill |
| `Book an Appointment` | 1 (nav panel only) |
| `1706 S Elena` | **2** — info-section block AND footer col-2 |
| `Monday - Thursday` | **2** — info-section block AND footer col-2 |
| `Make a Payment` | **2** — nav panel AND footer col-1 |
| `Ready for` | 1 |
| `Want to learn more` | 1 |
| `Contact Us` | 1 |
| `Request Appointment` | 1 |
| `Home Page` | 1 |
| `OFFICE HOURS` | **0** — the source is `OFFICE&nbsp;HOURS` (`contact-us.html:121`), rendered as `OFFICE HOURS`. A plain-space anchor will never match. |

The gate's `Book Appointment` anchor resolves to the *first* match (y=535.19)
only if the matcher takes the first occurrence. **This is the single biggest
risk on this page** — see §E.1.

---

## B. Per census section

Sections 1, 2, 3, 8, 9 → `_chrome.md` §3, §3.3, §3.6, §4, §5. Nothing on this
page overrides them. The only page-level deltas are:

- The nav panel's `Contact` link carries `aria-current="page"` + `w--current`
  (`contact-us.html:121`). No style attaches to `w--current` anywhere in
  `beachfront.css` (grep returns no rule) — it is inert.
- `data-w-id` GUIDs are re-minted per page (`_chrome.md` §0); the chrome GUIDs
  on this page are `d74a87ea-…` (header bar hamburger), `6eca16bd-…` (nav
  "Book an Appointment"), `8dfa6638-…` (panel close hamburger),
  `b914d569-…` (form-modal close), `1273e294-…4f5b/4f5f/4f60/4f62/4f6a` (CTA),
  `9daf7a34-…` ("Read Reviews"), `b1ce8885-…` (footer "Make a Payment").
- The form's `data-wf-page-id="655680f0c897c56b081e91c8"` and
  `data-wf-element-id="b914d569-4c40-98cb-736a-37015bfda114"`
  (`contact-us.html:121`).

---

### 4. HERO — `<section class="hero contact">`

Markup (`contact-us.html:121`, minified onto one line):

```
<section class="hero contact">
  <div class="hero-top-gradient"></div>
  <div class="hero-bot-gradient dark"></div>
  <div class="content-width">
    <h2 class="contact-heading"><br>Contact Us</h2>
  </div>
  <div class="bot-wave"> …jQuery-injected <svg>… </div>
</section>
```

**The `<br>` before "Contact Us" is load-bearing.** It produces an empty first
line, so the h2 is always **two** line boxes and its height is exactly
`2 × line-height` at every tier. Drop the `<br>` and the heading halves in
height and jumps up by one line — this is the most likely single-token defect
in the hero.

#### 4.1 Section box

`.hero` `beachfront.css:5295-5300`: `align-items:center; height:33vw;
display:block; position:relative`.
`.hero.contact` `beachfront.css:5316-5320`: background image + `background-position:50%`
+ `background-size:cover`. **No margin, no padding, at any tier.**

Height is a **four-step vw ladder** keyed entirely on the *Webflow* gates
(991/767/479), never on the root gates:

| rule | source | height |
|---|---|---|
| base ≥992 | `beachfront.css:5297` | `33vw` |
| ≤991 (`.hero, .hero.redondo`) | `beachfront.css:7980-7982` | `60vw` |
| ≤767 (`.hero`) | `beachfront.css:8438-8440` | `70vw` |
| ≤479 (`.hero.contact`) | `beachfront.css:9078-9080` | `95vw` |

There is **no** `.hero.contact` rule in the ≤991 or ≤767 blocks — the generic
`.hero` rules govern those bands.

| | 1440 | 992 | **991** | 834 | **768** | **767** | 390 |
|---|---|---|---|---|---|---|---|
| declared | 33vw | 33vw | 60vw | 60vw | 60vw | 70vw | 95vw |
| **height** | **475.19** | 327.36 | **594.60** | **500.39** | **460.80** | **536.90** | **370.50** |

Measured `[probed]`: 1440 `{x:0,y:0,w:1440,h:475.188}` · 834 `{0,0,834,500.39}` ·
390 `{0,0,390,370.5}`. Note 834 is **taller** than 1440 — that is correct.

Background asset (real file, do not redraw):
`https://cdn.prod.website-files.com/64af3f93339537d6b661b556/64b82f76a234d4cb1be79547_BD_office_2020_IMG_2869.jpg`
(`beachfront.css:5317`). Computed `background-position: 50% 50%`,
`background-size: cover` at all three widths `[probed]`.

#### 4.2 The two gradient overlays

| | source | declarations | h@1440 | h@834 | h@390 |
|---|---|---|---|---|---|
| `.hero-top-gradient` | `beachfront.css:6477-6482` | `background-image: linear-gradient(#129ecccc, #0000); width:100%; height:25%; position:absolute` (no `top` — static-position top = 0) | 118.80 | 125.09 | 92.63 |
| `.hero-bot-gradient` | `beachfront.css:6484-6490` | `background-image: linear-gradient(#0000,#129ecccc); width:100%; height:50%; position:absolute; bottom:0` | 237.59 | 250.19 | 185.25 |
| `.hero-bot-gradient.dark` | `beachfront.css:6492-6494` | **replaces** the image with `linear-gradient(#0000, #129ecc 77%)` | ← | ← | ← |

Computed `[probed]`: top = `linear-gradient(rgba(18,158,204,0.8), rgba(0,0,0,0))`;
bottom = `linear-gradient(rgba(0,0,0,0), rgb(18,158,204) 77%)` — **the dark
variant is fully opaque at its 77% stop**, and it is what makes the wave read
white against solid `#129ecc`. Both are percentage heights of the hero, so they
track the four-step vw ladder automatically; do not hard-code px.

#### 4.3 `h2.contact-heading` — a FOUR-combination type ladder

`.contact-heading` `beachfront.css:6580-6587`:
```
color: #fff; text-align: left; width: auto; padding-right: 33%;
position: absolute; bottom: 1rem;
```
Overrides: ≤991 `beachfront.css:8199-8203` `{ text-align:left; width:auto;
font-size:75px }` · ≤767 `beachfront.css:8763-8767` `{ width:auto;
padding-right:0%; font-size:50px }` · ≤479 `beachfront.css:9289-9291`
`{ width:auto }` (font-size **not** restated).

`h2` base `beachfront.css:2114-2121`: `color: var(--primary); margin-top:20px;
margin-bottom:10px; font-family: museo-slab, sans-serif; font-size:140px;
font-weight:100; line-height:168px`. `h2` ≤991 `beachfront.css:7858-7861`
`{ font-size:72px; line-height:80px }`. `h2` ≤479 `beachfront.css:9012-9016`
`{ overflow-wrap:anywhere; font-size:56px; line-height:70px }`.

**Class beats element**, so `font-size` comes from `.contact-heading` at every
tier below 992 while `line-height` keeps coming from bare `h2`. Result is four
distinct combinations across the ladder, and the class rule's 75px at ≤991
*overrides* the element rule's 72px:

| | ≥992 (1440) | ≤991 (834) | ≤767 | ≤479 (390) |
|---|---|---|---|---|
| font-size | **140** `:2119` | **75** `:8202` | **50** `:8766` | **50** (inherited from ≤767 — `:9289` sets no size, and the `h2` 56px at `:9014` **loses to the class**) |
| line-height | **168** `:2121` | **80** `:7860` | **80** `:7860` | **70** `:9015` |
| height (2 lines) | **336** | **160** | 160 | **140** |
| padding-right | `33%` = **462** | `33%` = **275.22** | `0%` | **0** `:8765` |
| bottom | `1rem` = **40** | **32** | (24 @768) | **24** |
| colour / family / weight | `#fff` `:6581` · museo-slab `:2118` · 100 `:2120` | ← | ← | ← |
| letter-spacing / transform | `normal` / `none` (no rule) | ← | ← | ← |

Measured `[probed]`: 1440 `{x:80, y:89.19, w:1187.77, h:336}` ·
834 `{48, 298.39, 664.03, 160}` · 390 `{19.5, 196.5, 259.20, 140}`.

**The visual bottom gap is `1rem` + the h2's own `margin-bottom:10px`**, because
an absolutely-positioned box's `bottom` offset is measured to its *margin* edge.
So hero-bottom → heading-bottom = **50 / 42 / 34px** at 1440 / 834 / 390, not
40 / 32 / 24. `[probed]` confirms: 475.19−425.19 = 50; 500.39−458.39 = 42;
370.50−336.50 = 34.

Width is shrink-to-fit + the percentage padding: `w = textWidth + 0.33 ×
containingBlockWidth`. The `.content-width` (`_chrome.md` §2) is the containing
block, so 33% resolves against **1400 / 834 / —** (not against the 1280/738
content column). Text advance is a constant `5.184 × font-size` for
"Contact Us" in museo-slab 100 `[probed]`: 725.77 / 388.81 / 259.20.

`x` = the `.content-width` padding-left, i.e. **80 / 48 / 19.5** — the heading
is at the *static* position (no `left` is declared), so it inherits the
container's padding box.

#### 4.4 `.bot-wave` — jQuery-injected SVG, rotated on the PARENT

The `<svg>` is **not in the authored markup** — it is appended at runtime:
`contact-us.html:131` `$(".bot-wave").append(' <svg data-name="Layer 1" … viewBox="0 0 1200 120" preserveAspectRatio="none"><path d="M321.39,56.44c58-10.79,…Z" class="shape-fill"></path></svg> ');`
(The `contact-us.html` capture already contains it because the capture is
post-JS.) Same path data as the footer wave.

Wrapper `.bot-wave` `beachfront.css:6008-6016`: `z-index:8; width:100%;
line-height:0; position:absolute; bottom:0; left:0; overflow:hidden`.
**Plus a page-local inline `<style>` override** —
`contact-us.html:28-30` `.bot-wave { transform: rotate(180deg) }`.
`.bot-wave.flip` (`beachfront.css:6018-6022`) is **not** used here.

SVG sizing, page-local: `contact-us.html:32-37`
```
.bot-wave svg { position: relative; display: block;
                width: calc(133% + 1.3px); height: 3rem; }
```
Fill: `contact-us.html:40-42` `.bot-wave .shape-fill { fill: #FFFFFF }`
(computed `rgb(255,255,255)` `[probed]`).

| | 1440 | 834 | 390 |
|---|---|---|---|
| wrapper h (= svg h, `3rem`) | **120** | **96** | **72** |
| svg width `calc(133% + 1.3px)` | **1916.50** | **1110.52** | **520.00** |
| wrapper rect | `{0, 355.19, 1440, 120}` | `{0, 404.39, 834, 96}` | `{0, 298.5, 390, 72}` |
| svg rect x (post-rotation) | **−476.50** | **−276.52** | **−130.00** |

`3rem` is the **classic three-tier trap on this page**: 120 / 96 / 72. At 768 it
is **72px** (root 24) while the hero is still on its ≤991 `60vw`; at 992 it is
**96px** (root 32) while the hero is still on desktop `33vw`. Neither state is
reachable from a two-tier ladder.

The rotation is on the **wrapper**, not the svg — computed
`transform: matrix(-1,0,0,-1,0,0)` on `.bot-wave`, `none` on the svg `[probed]`.
The svg is 33% wider than the wrapper and the wrapper clips (`overflow:hidden`),
so the visible band is the svg's left 100%-width slice rendered upside-down.
Reproducing the rotation on the `<svg>` instead of the wrapper puts the clip on
the wrong side and changes the visible crest position. (Same failure mode as
`_chrome.md` §4.6.)

**Assets in this section:** hero jpg (above); the wave is inline SVG path data
(`contact-us.html:131`), not a file. No icons, no video.

---

### 5. INFO — "Book Appointment" pill

`<section class="info-section">` `beachfront.css:6589-6591`:
**`margin-bottom: 35px` and nothing else.** No padding, no background, no
max-width, no border, no media override (grep `.info-section` returns exactly
one hit). The section's entire vertical rhythm comes from its children's
`mt-6` margins.

Contained in `.content-width` (`_chrome.md` §2) → content column
**1280 / 738 / 351** at x **80 / 48 / 19.5**.

The pill: `contact-us.html:121`
```
<a data-w-id="1f5e4e47-1e95-594b-b6d5-3e11752be582" href="#"
   class="button text-color-primary-dark mt-6 w-button">Book Appointment</a>
```
Type + box: `_chrome.md` §6.1–6.3 (`.button` `beachfront.css:6028-6040`,
`.button.text-color-primary-dark` `:6047-6051`, ≤991 `:8049-8052`,
≤767 `:8636-8638`, ≤479 `:9173-9175`). Recap of the measured box, verified on
this page:

| | 1440 | 834 | 390 |
|---|---|---|---|
| font-size / line-height | 25 / 0 | 20 / 0 | 14 / 0 |
| colour | `rgb(54,91,109)` = `--primary-dark` | ← | ← |
| padding-x (`1em`) | 25 | 20 | 14 |
| **height** | **66** | **54** | **38.375** |
| width (text-dependent) | 281.08 | 225.27 | 158.30 |
| `.mt-6` `beachfront.css:3917-3919` (`1.5rem`) | **60** | **48** | **36** |
| `margin-bottom` | 0 | 0 | **60** (`beachfront.css:8636-8638`, ≤767) |
| border / radius | `1px solid var(--primary-dark)` / `8px` | ← | ← |

Measured rects `[probed]`: 1440 `{80, 535.19, 281.078, 66}` ·
834 `{48, 548.39, 225.266, 54}` · 390 `{19.5, 406.5, 158.297, 38.375}`.

**Box-structure note that decides where the space lives:** the button is
`display: inline-block` (Webflow `.w-button` `beachfront.css:265-275`). It sits
in an anonymous block inside `.content-width` whose strut is the inherited
64px/76.8px body type (`beachfront.css:2096-2102`). Measured, the anonymous
block's bottom lands **exactly on the button's bottom margin edge** at every
tier `[probed-only]`, so the next sibling's `mt-6` reads as a clean gap:

- 1440: 535.19 + 66 = 601.19, next block at 661.19 → **60** = `1.5rem`
- 834: 548.39 + 54 = 602.39, next at 650.39 → **48**
- 390: 406.5 + 38.375 = 444.875, +60 (`margin-bottom`) = 504.875, next at
  540.88 → **36**

That exactness is a line-box coincidence (the button's below-baseline extent,
~24.25px at 1440, slightly exceeds the strut's ~22.4px descent). **If the
rebuild changes the body font-size, the line-height, or turns this into a flex
child, that coincidence can break and introduce a few px of drift that lands
entirely inside gate region R1.** Prefer reproducing it as `inline-block` in a
plain block context with the same 64px/1.2em strut.

`margin-bottom: 60px` at ≤767 is a **hard px, not rem** — it does not scale, and
it fires at 767, one pixel *after* the root has already dropped to 24px at 768.
At exactly 768 the pill has `margin-top: 36px` and `margin-bottom: 0`.

---

### 6. INFO — CONTACT + OFFICE HOURS blocks

```
<div data-w-id="43260768-1818-72a0-75b2-ccd4443974af"
     class="w-layout-hflex mt-6 su-flex-v-mobile">
  <div class="footer-contact-block mb-4 mr-8 pr-8">
    <div class="footer-contact-header">CONTACT</div>
    <div class="footer-contact-info">(310) 378-9241</div>
    <div class="footer-contact-info">1706 S Elena Ave. Suite B</div>
    <div class="footer-contact-info">Redondo Beach, CA 90277</div>
  </div>
  <div class="footer-contact-block mb-4">
    <div class="footer-contact-header">OFFICE&nbsp;HOURS</div>
    <div class="footer-contact-info">Monday - Thursday / 7am - 5pm</div>
    <div class="footer-contact-info">Friday / 7am - 2pm</div>
    <div class="footer-contact-info">Saturday - Sunday / Closed</div>
  </div>
</div>
```
(`contact-us.html:121`. Note `OFFICE&nbsp;HOURS` — a non-breaking space.
Note also: **no `<a>` wrapper on the phone number here**, unlike the footer's
copy of the same block, which does wrap it in `a[href="tel:(310)-378-9241"]`.)

#### 6.1 Flex container

| property | source | 1440 | 834 | 390 |
|---|---|---|---|---|
| `flex-direction` | `.w-layout-hflex` `beachfront.css:2056-2060` → `row`; `.su-flex-v-mobile` ≤767 `beachfront.css:8434-8436` → `column` | row | row | **column** |
| `align-items` | `beachfront.css:2058` | `flex-start` | ← | ← |
| `display` | `beachfront.css:2059` / `.su-flex-v-mobile` `beachfront.css:5291-5293` | flex | flex | flex |
| `justify-content` | `.mt-6.su-flex-v-mobile` `beachfront.css:3921-3923` | `flex-start` | ← | ← |
| `margin-top` (`.mt-6` `1.5rem`, `beachfront.css:3917-3919`) | | **60** | **48** | **36** |
| rect | `[probed]` | `{80, 661.19, 1280, 200}` | `{48, 650.39, 738, 160}` | `{19.5, 540.88, 351, 256}` |

There is **no `gap`** on this flex container anywhere in `beachfront.css`. All
inter-column space is the first child's margin+padding (§6.2). The container's
height is the tallest item's *outer* height (child height + `mb-4`), which is
why it reads 200 / 160 / 256 rather than 160 / 128 / 208.

#### 6.2 The blocks — the three-tier `2rem + 2rem` gap

`.footer-contact-block` has **no base rule** in `beachfront.css`; the only
selector containing it is `.footer-contact-block.mb-4.mr-8.mt-8,
.footer-contact-block.mb-4.mt-8` `beachfront.css:6324-6326` (`margin-top:2rem`),
which does **not** apply here (no `.mt-8`). So the block is a bare block box and
all of its geometry comes from the three utility classes:

| utility | source | declared | 1440 | 834 | 390 |
|---|---|---|---|---|---|
| `.mb-4` | `beachfront.css:3985-3988` | `margin-top:0; margin-bottom:1rem` | 40 | 32 | 24 |
| `.mr-8` (first block only) | `beachfront.css:3961-3963` | `margin-right:2rem` | **80** | **64** | **48** |
| `.pr-8` (first block only) | `beachfront.css:4219-4221` | `padding-right:2rem` | **80** | **64** | **48** |

**The gap between the CONTACT text column and the OFFICE HOURS text column is
`mr-8 + pr-8` = `4rem` = 160 / 128 / 96px.** At 992 it is 128px while the type
is still desktop-sized; at 768 it is 96px while the flex is still `row`. This
is the page's most three-tier-sensitive number — see §E.2.

Measured `[probed]`:

| | 1440 | 834 | 390 |
|---|---|---|---|
| CONTACT block rect | `{80, 661.19, 325.125, 160}` | `{48, 650.39, 260.109, 128}` | `{19.5, 540.88, 195.078, 104}` |
| — its content width | 245.125 | 196.109 | 147.078 |
| HOURS block rect | `{485.125, 661.19, 297.25, 160}` | `{372.109, 650.39, 237.797, 128}` | `{19.5, 668.88, 178.359, 104}` |
| HOURS block x − CONTACT block x | **405.125** | **324.109** | (stacked) |

Both blocks are **shrink-to-fit in the row direction** (flex items with
`width:auto`, no `flex-basis`), so their widths are text-driven and will differ
by a fraction if the font stack falls back. Do not pin them.

At 390 the container is `column`, so the second block's top =
first block bottom (644.88) + `mb-4` (24) = **668.88** — `mb-4` becomes the
*inter-block* gap on mobile and a *trailing* gap on desktop. Where that space
lives changes with the direction; a rebuild that models it as a `gap` gets 390
right and 1440 wrong (it would add 40px below the row).

#### 6.3 Type — three tiers, two families

| element | source | 1440 | 834 | 390 |
|---|---|---|---|---|
| `.footer-contact-header` | `beachfront.css:6337-6343`; ≤991 `:8130-8132`; ≤479 `:9240-9242` | museo-slab **500**, `#365b6d`, **20 / 40** (`line-height:2em`) | **16 / 32** | **16 / 32** |
| `.footer-contact-info` | `beachfront.css:6345-6351`; ≤991 `:8130-8132`; ≤767 `:8699-8701` | museo-sans **300**, `#365b6d`, `margin:0`, **20 / 40** | **16 / 32** | **12 / 24** |

Computed `[probed]` at 1440: header `museo-slab, sans-serif` / 500 /
`rgb(54,91,109)`; info `museo-sans, sans-serif` / 300 / `rgb(54,91,109)`.
`letter-spacing: normal`, `text-transform: none` at all tiers — **"CONTACT" and
"OFFICE HOURS" are uppercase in the source text, not via `text-transform`**
(`contact-us.html:121`). A rebuild that stores them title-case and uppercases in
CSS will render identically but will break a content-diff.

Block heights follow directly: 1440 `40 + 3×40 = 160` · 834 `32 + 3×32 = 128` ·
390 `32 + 3×24 = 104`. **Note the 390 asymmetry** — the header stays 16px while
the info rows drop to 12px, so the block is not a uniform 4×24.

Identical markup to `_chrome.md` §5.4/§5.5 (footer col-2), same ladder.

---

### 7. INFO — location map

```
<div class="w-layout-hflex mt-6">
  <div class="_w-40pc su-w-full-tablet">
    <div class="footer-map w-widget w-widget-map"
         data-widget-style="roadmap"
         data-widget-latlng="33.817617,-118.385433"
         aria-label="Beachfront Dentistry" title="Beachfront Dentistry"
         data-enable-scroll="true" data-enable-touch="true"
         data-widget-zoom="12" data-widget-tooltip="Find us here!"
         role="region"
         data-w-id="c9c37807-cd0e-69da-7681-33364d4a2b9c"></div>
  </div>
</div>
```
(`contact-us.html:121`.) The `hflex` has exactly **one** child — it is a
single-column row, not a two-up.

| property | source | 1440 | 834 | 390 |
|---|---|---|---|---|
| row `margin-top` (`.mt-6`, `1.5rem`) | `beachfront.css:3917-3919` | **60** | **48** | **36** |
| row `flex-direction` | `beachfront.css:2056-2060` | row | row | row (`.su-flex-v-mobile` is **absent** here — this row never stacks) |
| column width | `._w-40pc` `beachfront.css:3530-3532` = 40%; ≤991 `.su-w-full-tablet` `beachfront.css:8215-8217` = 100%; ≤767 `beachfront.css:8769-8771` = 100% | **512** (40% of 1280) | **738** | **351** |
| map width | `.w-widget-map` `beachfront.css:1002-1004`; ≤991 `.footer-map` `beachfront.css:8166-8168` | 100% → **512** | **738** | **351** |
| map height | `.w-widget-map` `beachfront.css:1004` | **400** | **400** | **400** |

Measured `[probed]`: 1440 `{80, 921.19, 512, 400}` · 834 `{48, 858.39, 738, 400}` ·
390 `{19.5, 832.88, 351, 400}`. **Height is a hard 400px at every tier** — the
only fixed-px block on this page.

`.w-widget-map` support rules (`_chrome.md` §5.7): label `beachfront.css:1007-1010`,
img `:1012-1014`, `.gm-style-iw` `:1016-1018`, `.gm-style-iw > button`
`:1020-1022`.

**Injected DOM `[probed-only]`.** Webflow hydrates this into a Google Maps JS
canvas. The widget gets an inline `overflow: hidden` and its first child is
`<div style="height:100%;width:100%;position:absolute;top:0;left:0;
background-color: rgb(229,227,223)">` — that grey is Google's loading colour,
measured `rgb(229,227,223)` `[probed]`. Below that Google builds ~250 nested
divs of 256×256 raster tiles from
`https://maps.googleapis.com/maps/vt?pb=…&key=AIzaSyBeDSBIt7egD0XZXx8Q6yHsorGsc-X0Oak`
plus the POI pin `https://maps.gstatic.com/mapfiles/api-3/images/spotlight-poi3.png`
(26×37) and a drag cursor `https://maps.gstatic.com/mapfiles/openhand_8_8.cur`.
Google's own `<style>` blocks are injected into `<head>`
(`contact-us.html:1-9`) and the Maps API `<script>` tags at `contact-us.html:69`;
both are third-party — do not port them.

**Do not attempt to pixel-match the tiles.** This region is inside gate region
R1 and will always diff; the number that must be right is the widget's **box**
(512/738/351 × 400 at the y values above), not its contents.

Google's own chrome inside the widget (zoom in/out, fullscreen, "Keyboard
shortcuts", "Terms", "Report a map error") is counted as part of the single map
control in §C.

---

### 8/9. Closing CTA band + footer — chrome, with one measured delta

Fully specced in `_chrome.md` §4 and §5. The one page-specific fact:

**The info-section → footer gap is 40 / 35 / 35, not 35 / 35 / 35.**
`.info-section { margin-bottom: 35px }` (`beachfront.css:6589-6591`) is an
adjacent-sibling margin against the footer's *collapsed-through* top margin.
`<section class="footer">` has **no rule at all** in `beachfront.css` (grep
`'^\.footer {'` returns nothing), its first child `.cta-section` is an empty,
rule-less, zero-height div (`_chrome.md` §4), so the `<h2 class="text-align-center
my-4">`'s `margin-top: 1rem` (`.my-4` `beachfront.css:3824-3827`) collapses out
through both and meets the info-section's 35px. The used gap is
`max(35, 1rem)`:

| | 1440 | 834 | 390 |
|---|---|---|---|
| `.my-4` margin-top (`1rem`) | **40** | 32 | 24 |
| `.info-section` margin-bottom | 35 | 35 | 35 |
| **used gap** | **40** | **35** | **35** |
| info-section bottom → footer top `[probed]` | 1321.19 → 1361.19 | 1258.39 → 1293.39 | 1232.88 → 1267.88 |

At 992 the gap is **35** (root 32 → `1rem` = 32 < 35); at 768 it is **35**
(root 24). Only ≥993 produces 40. A rebuild that puts this space in a *padding*
(or that gives `.footer` a `padding-top`) kills the collapse and produces
35 + 40 = 75 at 1440. **This gap sits at the R1/R2 boundary, so getting it wrong
shifts every subsequent y on the page.**

CTA `h2` rects on this page `[probed]`: 1440 `{0, 1361.19, 1440, 504}` (3 lines ×
168) · 834 `{0, 1293.39, 834, 240}` (3 × 80) · 390 `{0, 1267.88, 390, 180}`
(3 × 60). `.footer-learn-more` `{80, 2581.19, 1280, 40}` / `{48, 2138, 738, 40}` /
`{19.5, 1717.88, 351, 40}`.

---

## C. Interaction inventory

**Counting rule** (state it so Phase 5 re-derives the same number): one entry
per *user-facing control* — an element a user can click, focus, or drag that
navigates or changes state — plus any standalone `cursor: pointer` element with
no handler. A wrapper `<a>` and the `<img>` inside it that carries the IX2
`data-w-id` are **one** control. Scroll-reveal-only `data-w-id` wrappers are
**not** controls (they are §D). Each Google Maps widget counts as **one**
control regardless of its internal Google buttons. The mechanical superset
(`a[href], button, input, textarea, select` + every `[data-w-id]` + every
standalone `cursor:pointer`, excluding map internals) returns **41 DOM nodes**
`[probed]`; collapsing wrapper/child pairs and removing the 5 reveal-only
wrappers and the 1 duplicate gives the 34 below.

### Header bar — chrome (2)
1. `a.link-block-5[href="/"]` → logo home link. Asset
   `…/64b05fba026f33ef80c866b8_logo%3Dwhite.svg`. Hover: `a:hover{opacity:.61}`
   `beachfront.css:2181-2183`.
2. `a.link-block-4[href="#"]` wrapping `img.header-hamburger[data-w-id="d74a87ea-…"]`
   → **opens** the nav panel. IX2 `e-9` `MOUSE_CLICK` → `a-4`: `TRANSFORM_MOVE`
   on `.dropdown-modal`, `yValue: 150 vh`, **500ms**, easing `ease` `[probed-only]`.
   Asset `…/64b05fbaef335a499638ada7_menu%3Dwhite%2C%20state%3Didle.svg`.

### Off-canvas nav panel — chrome (11)
3–9. Seven `a.no-text-dec` links: `/` "Home Page", `/your-first-visit`
"First Visit", `/our-team` "Meet Our Team", `/services` "Services",
`/ask-the-doctor` "Ask the Doctor", `/contact-us` "Contact"
(**`aria-current="page"` + `w--current`** on this page), `tel:310-378-9241`.
10. `a.button.text-color-primary-dark.show-form.nav[href="#"][data-w-id="6eca16bd-…"]`
    "Book an Appointment" → IX2 `e-307` → `a-5` **and** jQuery
    `$(".show-form").click(showForm)` (`contact-us.html:134-143`).
11. `a.button.text-color-primary-dark.nav[href="https://app.modento.io/beachfront-dentistry"]`
    "Make a Payment".
12. `img.header-hamburger[data-w-id="8dfa6638-…"]` (bare `<img>`, no `<a>`) →
    **closes** the panel. IX2 `e-7` → `a-3`: `TRANSFORM_MOVE .dropdown-modal
    yValue: -150 vh`, 500ms, `ease` `[probed-only]`.
    Asset `…/64b05fba486da5a75e84f0f1_menu%3Dwhite%2C%20state%3Dactive.svg`.
13. `img.header-logo` inside `.position-absolute-top-left` — **`cursor: pointer`
    but no `href` and no handler.** A hover affordance only; verified as the
    single `pointer-standalone` hit on the page `[probed]`. Do not wrap it in a
    link "to fix it" — that changes the count.

### Appointment form modal — chrome (7)
14. `a.inline-link[href="/"]` → modal logo (`…/64b05fbadd859049da3fd17a_logo%3Dblue.svg`).
15. `a.inline-link[href="#"]` wrapping `img.header-hamburger[data-w-id="b914d569-…"]`
    → **closes** the modal. IX2 `e-21` → `a-6`: `TRANSFORM_MOVE .form-modal
    yValue: -150 vh`, 500ms `[probed-only]`.
16. `input#name-2[type=text][required]` — `.text-field`.
17. `input#Email-2[type=email][required]`.
18. `input#Phone[type=tel][required]`.
19. `textarea#message[maxlength=5000]`.
20. `input[type=submit].button.text-color-primary` value `Submit`,
    `data-wait="Please wait..."`.
Focus state for 16–19: `.w-input:focus{border-color:#3898ec; outline:0}`
`beachfront.css:536-539`. Success/failure panes `.w-form-done` / `.w-form-fail`
are pre-rendered and hidden.
**`.hide-form` binds to nothing** — `$(".hide-form").click(hideForm)`
(`contact-us.html:144`) has no matching element on this page (the
class appears exactly once in the file, inside that script). Harmless because
`.form-modal{opacity:1}` `beachfront.css:7443-7456`.

### Info section — **page-unique** (2)
21. `a.button.text-color-primary-dark.mt-6[href="#"][data-w-id="1f5e4e47-1e95-594b-b6d5-3e11752be582"]`
    "Book Appointment". IX2 `e-27` `MOUSE_CLICK` → **`a-5`** — i.e. it opens the
    appointment modal (`TRANSFORM_MOVE .form-modal yValue: 150 vh`, 500ms)
    `[probed-only]`. **This is a 4th trigger for `a-5` that `_chrome.md` §3.6
    does not list** (that section names only `6eca16bd`, `1273e294-…4f60`,
    `b1ce8885`). Note it carries **no `.show-form` class**, so the jQuery
    `showForm` opacity handler does *not* fire for it — which is fine, because
    `.form-modal` is already `opacity: 1` in CSS.
    **Hover differs from the CTA pill:** this button has *no* IX2 inline style,
    so `.button:hover{opacity:.6; background-color:#129ecc4a}`
    `beachfront.css:6042-6045` applies in full. Measured `[probed]`
    `opacity 1 → 0.6`, `background rgba(0,0,0,0) → rgba(18,158,204,0.29)`.
    The CTA pill (control 23) changes **background only** because IX2 pins
    `opacity: 1` inline (`_chrome.md` §4.7). **Do not normalise these two.**
22. `div.footer-map.w-widget.w-widget-map[data-w-id="c9c37807-…"]` — the
    location map. Drag-pannable, `data-enable-scroll="true"` (wheel zoom on),
    `data-enable-touch="true"`, `data-widget-zoom="12"`,
    `data-widget-tooltip="Find us here!"`. Google renders its own zoom /
    fullscreen / keyboard-shortcuts / Terms / "Report a map error" controls
    inside — all counted here as one.

### Closing CTA band — chrome (5)
23. `a.button.text-color-primary-dark.show-form[href="#"][data-w-id="1273e294-…4f60"]`
    "Book Appointment" → IX2 `e-17` → `a-5` + jQuery `showForm`.
24. `div.block-link.social-link-block[data-w-id="9daf7a34-…"]` "Read Reviews" —
    a click **toggle**, two mechanisms at once: IX2 `e-211` `MOUSE_CLICK` →
    `a-8` (open) and `e-212` `MOUSE_SECOND_CLICK` → `a-9` (close), **plus**
    jQuery `$('.social-link-block').click(toggle)` (`contact-us.html:157`) where `toggle` comes from
    `matching/spec/incidental-utils.js` and adds/removes the class `active` on
    the element **and every descendant**. IX2 detail `[probed-only]`:
    `a-8` = `STYLE_OPACITY .socials-container → 1` (2000ms `outExpo`) +
    `GENERAL_DISPLAY → flex` (0ms) + `TRANSFORM_MOVE yValue: 40%` (2000ms
    `outExpo`); `a-9` = `TRANSFORM_MOVE yValue: 0%` (2000ms `outExpo`) +
    `STYLE_OPACITY → 0` (**500ms** `outExpo`) then `GENERAL_DISPLAY → none`.
    The `active` class is what swaps `.expanding-plus` / `.expanding-minus`.
25. `a[href="https://www.google.com/maps/place/Beachfront+Dentistry/@33.8176193,…"]`
    → `…/64c97c6baf968f274ee2edb4_Google_%20G%20_Logo.svg`.
26. `a[href="https://www.facebook.com/RedondoDentists"]`
    → `…/64c97b32e9cac72606fcb185_Facebook_f_logo_(2021).svg`.
27. `a[href="https://www.yelp.com/biz/beachfront-dentistry-redondo-beach"]`
    → `…/64b85e991827e8bce95c4536_Yelp_logo.png`.
    25–27 hover: `._w-8.clickable:hover{opacity:.6}` `beachfront.css:3474-3476`.

### Footer — chrome (7)
28–31. Four `a.inline-link` → `/your-first-visit`, `/our-team`, `/services`,
`/ask-the-doctor`. Hover `.inline-link:hover{opacity:.6}` `beachfront.css:7391-7393`.
32. `a.button.text-color-primary-dark[href="https://app.modento.io/…"][data-w-id="b1ce8885-…"]`
    "Make a Payment" — IX2 `e-303` → `a-5` (yes, it *also* opens the form modal
    on click while navigating) `[probed-only]`.
33. `a.inline-link[href="tel:(310)-378-9241"]` wrapping the footer's
    `.footer-contact-info` phone row. **Present only in the footer** — the
    info-section's identical-looking phone row (§6) is *not* a link.
34. Footer `div.footer-map.w-widget.w-widget-map` (col-3) — second Maps widget,
    same attributes, different box (`_chrome.md` §5.7).

Global hover rules that touch controls above: `a:hover{opacity:.61}`
`beachfront.css:2181-2183`, `a:active,a:hover{outline:0}` `beachfront.css:33-35`,
`.button:hover` `beachfront.css:6042-6045`, `.inline-link:hover`
`beachfront.css:7391-7393`, `._w-8.clickable:hover` `beachfront.css:3474-3476`.
Full 42-rule hover census: `_chrome.md` §7.

Non-control JS with a visible effect (not counted): the inline script
(`contact-us.html:146-154`) fires
`alert("Please use Portrait!")` on load and on `window:resize` whenever
`innerWidth < 792 && innerHeight < innerWidth`. **This will fire in a headless
landscape probe at 390×900? No — 900 > 390, so it does not. It DOES fire at
e.g. 767×400.** Keep gate viewports portrait-shaped.

**INTERACTION COUNT: 34**

---

## D. Animation census

All motion on this page is Webflow **IX2**, read from
`Webflow.require("ix2").store.getState().ixData` `[probed-only]`. There is no
IntersectionObserver, no scroll-linked/continuous parameter group, and no CSS
`@keyframes` on this page's own elements. The store is site-wide (127 events);
events scoped to this page carry the prefix `655680f0c897c56b081e91c8|`.

### The one reveal recipe — action list `a-7` ("up and in")

`useFirstGroupAsInitialState: true`; trigger `SCROLL_INTO_VIEW`,
`scrollOffsetValue: 0 %`, no delay.

| group | actions | duration | easing |
|---|---|---|---|
| g0 (initial state, applied at load) | `TRANSFORM_MOVE yValue: 4, yUnit: rem` + `STYLE_OPACITY value: 0` | 500 | (unset) |
| g1 (reveal) | `TRANSFORM_MOVE yValue: 0, yUnit: rem` + `STYLE_OPACITY value: 1` | **2000** | **`outExpo`** |

`4rem` travel resolves to **160 / 128 / 96px** at 1440 / 834 / 390 — a genuine
three-tier value, and IX2 writes the *unit* into the inline style
(`translate3d(0px, 4rem, 0px)`), so it re-resolves live on resize.

Pre-settle inline style (verified, and the state the saved
`contact-us.html` capture froze the map in):
`transform: translate3d(0px, 4rem, 0px) scale3d(1,1,1) rotateX(0deg) rotateY(0deg) rotateZ(0deg) skew(0deg,0deg); transform-style: preserve-3d; opacity: 0;`
Post-settle: `translate3d(0px, 0rem, 0px) …; opacity: 1;`

### Which elements reveal on this page

| element | data-w-id | IX2 event | census § |
|---|---|---|---|
| `div.w-layout-hflex.mt-6.su-flex-v-mobile` (the CONTACT + HOURS row, **as a whole** — the two blocks do not animate separately) | `43260768-1818-72a0-75b2-ccd4443974af` | `e-141` | 6 |
| `div.footer-map.w-widget.w-widget-map` (info-section map) | `c9c37807-cd0e-69da-7681-33364d4a2b9c` | `e-143` | 7 |
| CTA `h2` "Ready for great dental health?" | `1273e294-…4f5b` | `e-73` | 8 (chrome) |
| CTA button wrapper `.display-flex…mt-8` | `1273e294-…4f5f` | `e-85` | 8 |
| CTA button itself | `1273e294-…4f60` | `e-75` | 8 |
| CTA reviews wrapper `.display-flex…mt-3` | `1273e294-…4f62` | `e-77` | 8 |
| `.cta-beach-label` "FIJI ISLANDS" | `1273e294-…4f6a` | `e-87` | 8 |
| footer "Make a Payment" | `b1ce8885-…` | `e-305` | 9 |

**Nothing in the hero animates.** No reveal on `.hero`, the gradients, the
heading, or the wave — they are painted at their final position on first frame.

**The info-section "Book Appointment" pill does NOT reveal.** It has a
`data-w-id` but its only binding is `e-27 MOUSE_CLICK → a-5`; it carries **no
inline style** in either the saved capture or a settled probe. Adding a reveal
to it would be a fabricated animation *and* would break its hover (§C.21).

### Click-driven motion (not scroll)

| list | effect | duration / easing |
|---|---|---|
| `a-3` | `TRANSFORM_MOVE .dropdown-modal yValue: -150 vh` | 500 / `ease` |
| `a-4` | `TRANSFORM_MOVE .dropdown-modal yValue: +150 vh` | 500 / `ease` |
| `a-5` | `TRANSFORM_MOVE .form-modal yValue: +150 vh` | 500 / (unset → linear) |
| `a-6` | `TRANSFORM_MOVE .form-modal yValue: -150 vh` | 500 / (unset → linear) |
| `a-8` / `a-9` | `.socials-container` open / close | 2000 `outExpo` (close opacity is 500) |

Resting offsets these move *against*: `.dropdown-modal{top:-150vh}`
`beachfront.css:6390-6401`; `.form-modal{margin-top:-150vh}`
`beachfront.css:7443-7456`.

### CSS transitions on this page

`.button` `beachfront.css:6039`: `transition: opacity .2s,
background-color .2s cubic-bezier(.215,.61,.355,1)` — the only CSS transition
that touches a page-unique element (control 21). Google's tile fades
(`transition: opacity 200ms linear`) are third-party inline styles.

**Probe discipline:** read no rect until
`document.getAnimations().every(a => a.playState !== "running")` **and** the map
has stopped its 200ms tile fades. Reading early puts the map 4rem low at
`opacity: 0` and the contact row 4rem low — i.e. the sign of the y error is
*positive* (element too low), which is the same direction as a too-large `mt-6`.

---

## E. Known-suspect list

**E.1 — `Book Appointment` is not a unique anchor (highest confidence).**
It appears **twice** in `document.body.innerText`: the info-section pill
(`contact-us.html:121`, y@1440 = 535.19) and the CTA band pill
(`contact-us.html:121`, inside `<section class="footer">`, y@1440 = 1945.19 `[probed]`).
The gate uses it as region cut #1. If the matcher takes the last match, or if
the rebuild reorders/duplicates, R0 swallows two thirds of the page and R1
collapses to nothing. **Fix the anchor set, not the page** — e.g. cut on
`Contact Us` (unique, y=0) or on the info-section's `(310) 378-9241`… which is
*also* duplicated in the footer. The only unambiguous page-unique strings are
`Contact Us`, `Ready for`, `Want to learn more`, `Request Appointment`,
`Home Page`, `Read Reviews`, `FIJI ISLANDS`. Everything in §6 is duplicated in
the footer.

**E.2 — `.footer-contact-block.mr-8.pr-8`: a `4rem` gap, three tiers, and it
lives half in margin and half in padding.**
`beachfront.css:3961-3963` (`margin-right:2rem`) + `beachfront.css:4219-4221`
(`padding-right:2rem`) → **160 / 128 / 96px**. A two-tier ladder keyed at 768
renders 160px across the whole 768–991 band where live renders 128 (and 96 at
exactly 768). Because the split is margin+padding, a rebuild that collapses it
to a single `margin-right: 4rem` will be *geometrically* identical at 1440 but
will differ at 390 — where `flex-direction: column`
(`beachfront.css:8434-8436`) makes `margin-right` inert while `padding-right`
still reserves 48px inside the block (measured block width 195.078 = 147.078
text + 48 padding `[probed]`). Ditto a rebuild using flex `gap`: there is no
`gap` in the source.

**E.3 — `.bot-wave svg { height: 3rem }` (`contact-us.html:36`) is a page-local
inline-`<style>` rule, not in `beachfront.css`.**
120 / 96 / 72px. Anyone grepping only `beachfront.css` will never find it and
will guess. Its sibling `width: calc(133% + 1.3px)` (`contact-us.html:35`) and
the `transform: rotate(180deg)` on the **wrapper** (`contact-us.html:28-30`) are
in the same block. Putting the rotation on the `<svg>` instead of `.bot-wave`
flips which 1440px slice of the 1916.5px svg the `overflow: hidden`
(`beachfront.css:6015`) keeps — the crest lands on the wrong side of the
viewport.

**E.4 — `h2.contact-heading` has a FOUR-combination size ladder and the class
beats the element at ≤479.**
font-size 140 / 75 / 50 / 50 (`beachfront.css:2119`, `:8202`, `:8766`, and
*nothing* at `:9289`) against line-height 168 / 80 / 80 / 70
(`beachfront.css:2121`, `:7860`, `:7860`, `:9015`). The two ladders have
different step points. The specific trap: at ≤479 the `h2` rule
(`beachfront.css:9012-9016`) declares `font-size: 56px`, but `.contact-heading`
at ≤767 (`beachfront.css:8766`) declares `50px` and **wins on specificity**. A
rebuild that flattens h2 into a single token will render 56px at 390 where live
renders 50px, and will also miss `overflow-wrap: anywhere`
(`beachfront.css:9013`).

**E.5 — The heading's bottom gap is `1rem` + `10px`, not `1rem`.**
`bottom: 1rem` (`beachfront.css:6586`) is measured to the *margin* edge, and
`h2` carries `margin-bottom: 10px` (`beachfront.css:2117`). Used gap **50 / 42 /
34**. A rebuild that zeroes the h2 margin (a common reset) moves the heading
down 10px at every tier — inside gate region R0, where 475px of hero dilutes it.

**E.6 — The leading `<br>` in `<h2 class="contact-heading"><br>Contact Us</h2>`.**
Two line boxes at every tier: height 336 / 160 / 140. If the CMS/Prismic model
stores this as plain text "Contact Us", the heading is half as tall and sits one
line-height lower. This is a *content* defect that presents as a *geometry*
defect.

**E.7 — The info→footer gap is a margin collapse, and it is 40 at 1440 but 35 at
834 and 390.** `.info-section{margin-bottom:35px}`
(`beachfront.css:6589-6591`) vs `.my-4{margin-top:1rem}`
(`beachfront.css:3824-3827`) collapsing through the rule-less `<section
class="footer">` and its rule-less empty `.cta-section`. Used = `max(35, 1rem)`.
Any padding introduced on `.footer` or `.cta-section` breaks the collapse and
adds 32–40px. It sits exactly on the R1/R2 gate boundary.

**E.8 — `.button.text-color-primary-dark { margin-bottom: 60px }` at ≤767
(`beachfront.css:8636-8638`) applies to the info-section pill.**
It is a hard 60px (not rem) and it exists only below 768. Measured at 390:
pill bottom 444.875 + 60 + `mt-6` 36 = 540.88 = the contact row's top `[probed]`.
Omitting it compresses the mobile info-section by 60px. It is easy to miss
because at 1440/834 the pill has `margin-bottom: 0`.

**E.9 — The pill is `display: inline-block` and the following gap depends on the
line box.** The 64px/76.8px body strut (`beachfront.css:2096-2102`) and the
button's `line-height: 0` (`beachfront.css:6038`) happen to make the anonymous
block's bottom coincide exactly with the button's bottom margin edge
`[probed-only]`. Rebuilding the pill as `display:block` or as a flex child will
be *approximately* right and can be a few px off. Keep `inline-block` and keep
the body strut.

**E.10 — `OFFICE&nbsp;HOURS` uses a non-breaking space** (`contact-us.html:121`).
`innerText` contains `OFFICE HOURS`, so a content gate matching
`"OFFICE HOURS"` returns **0** hits `[probed]`. Also: the labels are uppercase
*in the source text*, not via `text-transform` (computed `text-transform: none`
at all tiers `[probed]`).

**E.11 — The info-section phone number is NOT a link; the footer's identical row
IS.** `contact-us.html:121` — info-section: bare
`<div class="footer-contact-info">(310) 378-9241</div>`; footer col-2:
`<a href="tel:(310)-378-9241" class="inline-link"><div class="footer-contact-info">…</div></a>`.
Making the info-section one a link adds a hover (`.inline-link:hover`
`beachfront.css:7391-7393`) and breaks the §C count of 34.

**E.12 — Two hover behaviours for the same-looking pill.** Info-section
"Book Appointment" dims to `opacity .6` on hover; CTA "Book Appointment" does
**not** (IX2 pins `opacity: 1` inline — `_chrome.md` §4.7). Measured on live at
1440 `[probed]`. Do not "fix" the asymmetry.

**E.13 — The hero height ladder steps on 991/767/479 (vw) while everything
inside it steps on 992/768/480 (rem).** `33vw / 60vw / 70vw / 95vw`
(`beachfront.css:5297`, `:7981`, `:8439`, `:9079`) vs `bottom: 1rem`
(`beachfront.css:6586`) and `height: 3rem` (`contact-us.html:36`). At **992**
the hero is 327.36px tall (desktop `33vw`) while the wave inside is already 96px
(root 32) — the wave is 29% of the hero. At **991** the hero jumps to 594.6px
while the wave stays 96px. Any single-breakpoint hero implementation gets one of
those two states wrong. Calibrate at **834, never 768; 1200/1440, never 992**.

**E.14 — `_chrome.md` §3.6 undercounts `a-5`'s triggers.** It lists three
(`6eca16bd`, `1273e294-…4f60`, `b1ce8885`); on this page there are **four** —
`1f5e4e47-…` (the info-section pill, IX2 `e-27`) `[probed-only]`. If the
rebuild wires the modal only off `.show-form`, the info-section pill becomes a
dead `href="#"` (it has no `.show-form` class).

**E.15 — Confirmed against the current build** (`src/routes/contact-us/+page.svelte`,
read-only; listed because these are already-materialised instances of E.2/E.7,
not speculation):

| # | build | live | source | delta at 1440 / 834 / 390 |
|---|---|---|---|---|
| a | `text-[20px] leading-[40px]` on **every** contact/hours row, no breakpoint | header 20/40 → 16/32 → 16/32; info 20/40 → 16/32 → **12/24** | `beachfront.css:6337-6343`, `:8130-8132`, `:8699-8701`, `:9240-9242` | block height **160 / 160 / 160** vs live **160 / 128 / 104** → 0 / **+32** / **+56**, and everything below shifts |
| b | map `max-w-[512px]` at all widths | `._w-40pc` 40% → `.su-w-full-tablet` **100%** at ≤991 | `beachfront.css:3530-3532`, `:8215-8217`, `:8769-8771` | width 512 / **512** / 351 vs live 512 / **738** / 351 → **−226 at 834** on the biggest block in R1 |
| c | `gap-8 sm:gap-20` (32 / 80px, `sm:`=640) | `mr-8` + `pr-8` = `4rem` split margin+padding | `beachfront.css:3961-3963`, `:4219-4221`, `:8434-8436` | 80 / 80 / 32 vs live **160 / 128 / 96** → short at **all three** |
| d | `mt-8 lg:mt-14` (32 / 56px, `lg:`=1024) | `.mt-6` = `1.5rem` | `beachfront.css:3917-3919` | 56 / 32 / 32 vs live **60 / 48 / 36** |
| e | `pt-8 pb-12 lg:pt-14 lg:pb-20` on the section | live has **zero padding**; only `margin-bottom:35px`, and the trailing gap is a *collapse* | `beachfront.css:6589-6591`, `:3824-3827` | trailing space 80 / 48 / 48 (padding) vs live **40 / 35 / 35** (collapsed margin) — and it lives in the wrong box, so the R1/R2 gate cut owns different pixels |
| f | info-section phone is `<a href={PHONE.href}>` with `hover:underline` | bare `<div class="footer-contact-info">` — **not a link** | `contact-us.html:121` | breaks §C's count of 34 and adds a hover live does not have |
| g | `uppercase` utility on "Contact" / "Office Hours" | literal uppercase text, `text-transform: none` | `contact-us.html:121` (+ computed `[probed]`) | renders the same, fails a content diff (and `OFFICE&nbsp;HOURS`, E.10) |
| h | `WaveDivider` default `h-[72px] md:h-[96px] lg:h-[120px]` (`md:`=768, `lg:`=1024) | `3rem` on the root ladder (992 / 768) | `contact-us.html:36` | **correct at 1440 / 834 / 390**, but wrong at **exactly 768** (96 vs 72) and across **993–1023** (96 vs 120). Off-gate, so the matrix will never catch it. |

Row (a) is the highest-confidence defect on the page: a genuine three-tier
ladder built as a one-tier constant, on a block whose height cascades into
every y below it inside gate region R1.

---

### `[probed-only]` inventory for this page

Values here have no stylesheet line and must be re-derived, not copied:

1. All IX2 event→action-list bindings, durations, easings, and the `4rem`
   travel (§D). Raw store read from
   `Webflow.require("ix2").store.getState().ixData`.
2. The inline reveal styles IX2 writes, and the resulting `opacity: 1` that
   defeats `:hover` on CTA controls but **not** on the info-section pill (§C.21).
3. The margin-collapse result at the info→footer boundary (§8/9) — 40 / 35 / 35.
4. The line-box coincidence under the inline-block pill (§5).
5. Google Maps' entire runtime DOM, its tile URLs, its `rgb(229,227,223)`
   loading background, and its internal controls (§7).
6. The `.bot-wave` `<svg>` itself (jQuery-appended at `contact-us.html:131`) —
   present in the saved capture only because the capture is post-JS.
7. Absolute document-space y values in §A and throughout — these are this
   page's; only the relative offsets are portable.
8. `document.body.innerText` occurrence counts used for anchor uniqueness (§A).

Raw probe output for re-checking:
`/private/tmp/claude-501/-Users-tuckerlemos-Documents-GitHub-beachfront-dentistry/6d044138-56ae-4e63-92d6-364d232bdf07/scratchpad/contact-probe.json`
(rects + computed type/box at 1440/834/390 + full IX2 `ixData`), produced by
`…/scratchpad/probe-contact.mjs`, `…/scratchpad/probe-inter.mjs`,
`…/scratchpad/probe-hover.mjs`, `…/scratchpad/probe-anchor.mjs`.
