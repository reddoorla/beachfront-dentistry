## yfv — /your-first-visit ("Beachfront Dentistry | First Visit")

**Governing rule (CLAUDE.md #1): source prescribes, rects only verify.** Every
number below carries a `beachfront.css:<line>` or `your-first-visit.html:<line>`
citation. Numbers that exist only as computed output (Webflow IX2 inline styles,
jQuery-set values, viewport-unit results, inline-block strut) are tagged
`[probed-only]` and are the only citation-free values here.

Shared chrome (nav/header, `.form-modal`, closing CTA band, Fiji band, footer)
is **already specced** in `matching/spec-sections/_chrome.md`. This file
references it and never restates it. Sections 1, 14–17 of the census below are
chrome; §2–13 are unique to this page.

Structural sample: `matching/spec/your-first-visit.html` (158 lines, minified —
`grep -n` gives the cited line numbers).
Probe: `https://www.beachfrontdentistry.com/your-first-visit` at 1440×900 /
834×1112 / 390×844 (plus 992×900 and 768×1024 to prove the trap band), scrolled
in 250px steps @80ms then held until `document.getAnimations()` reported nothing
running. The `a-7` reveal is a **2000ms outExpo** — an unsettled read has the
sign of the y-offset wrong, and one such read on this page reported
`translate3d(0, 0.216rem, 0)` mid-flight.

---

### 0. THE ROOT-FONT LADDER on this page

The same inline `<style>` as every other page, present **twice**:

| rule | source |
|---|---|
| `html { font-size: 40px }` | `your-first-visit.html:11-13` (repeated `:70`) |
| `@media (max-width: 992px) { html { font-size: 32px } }` | `your-first-visit.html:16-18` (repeated `:72-74`) |
| `@media (max-width: 768px) { html { font-size: 24px } }` | `your-first-visit.html:20-22` (repeated `:76-78`) |
| `@media (max-width: 480px) { html { font-size: 24px } }` | `your-first-visit.html:24-26` (repeated `:80-82`) — no-op |

Webflow class rules break at 991 (`beachfront.css:7852`), 767 (`:8372`),
479 (`:9011`), plus a second 991 block at `:9611`. **Offset by 1px, so every rem
resolves to THREE pixel values.** Calibrate md at **834, never 768**.

Resolution table used throughout this file:

| rem | 1440 (root 40) | 834 (root 32) | 390 (root 24) |
|---|---|---|---|
| `.2rem` | 8 | 6.4 | 4.8 |
| `.25rem` | 10 | 8 | 6 |
| `.4rem` | 16 | 12.8 | 9.6 |
| `.5rem` | 20 | 16 | 12 |
| `.6rem` | 24 | 19.2 | 14.4 |
| `.75rem` | 30 | 24 | 18 |
| `1rem` | 40 | 32 | 24 |
| `1.5rem` | 60 | 48 | 36 |
| `2rem` | 80 | 64 | 48 |
| `2.5rem` | 100 | 80 | 60 |
| `3rem` | 120 | 96 | 72 |
| `3.5rem` | 140 | 112 | 84 |
| `4rem` | 160 | 128 | 96 |
| `5rem` | 200 | 160 | 120 |
| `8rem` | 320 | 256 | 192 |
| `8.5rem` | 340 | 272 | 204 |
| `10rem` | 400 | 320 | 240 |
| `12rem` | 480 | 384 | 288 |
| `15rem` | 600 | 480 | 360 |
| `16rem` | 640 | 512 | 384 |
| `18rem` | 720 | 576 | 432 |
| `20rem` | 800 | 640 | 480 |
| `23rem` | 920 | 736 | 552 |
| `24rem` | 960 | 768 | 576 |
| `35rem` | 1400 | 1120 | 840 |

**Proof of the offset on this page** (`[probed-only]`, five widths):

| viewport | root | `.content-width` pad-x | `.hero.group-photo` h | `#tour h1` | "Meet Our Team" h2 | `.circle-time-number` |
|---|---|---|---|---|---|---|
| 1440 | 40 | 60 | 540 | 60px | **120px** | **45px** |
| **992** | **32** | **48** | **540** (60vh) | **60px** ← still desktop | **120px** | **45px** |
| **991** | 32 | 48 | 693.7 (70vw) | **28px** ← Webflow fires | **120px** | 45px |
| 834 | 32 | 48 | 583.8 | 28px | **120px** | **45px** |
| **768** | **24** ← root fires | **36** ← not 48 | 537.6 | 28px | 120px | **45px** |
| **767** | 24 | 61.36 (8%) | 536.9 | 28px | 120px | **30px** ← ≤767 fires |
| 390 | 24 | 19.5 | 370.5 | 28px | 56px | 30px |

Read the 992 and 768 rows together. Three of the six columns above take a value
at 834 that a two-tier ladder keyed at 768 cannot produce.

`.content-width` itself is specced in `_chrome.md §2`
(`beachfront.css:5858-5867`, ≤767 8% `:8627-8630`, ≤479 5% `:9164-9167`).
Verified on this page `[probed]`: 1440 `{x:20, w:1400, pad-x 60}` ·
834 `{x:0, w:834, pad-x 48}` · 390 `{x:0, w:390, pad-x 19.5}`.

Colour tokens (`beachfront.css:2047-2053`): `--primary #129ecc`,
`--primary-dark #365b6d`, `--secondary #b6aa91`, `--primary-light #e7f5fa`,
`--secondary-dark #2b2a29`, `--secondary-light #cecece`.

---

## A. SECTION CENSUS

`y@1440` is the settled document-space top of the block. 17 census sections;
the gate cuts this page at **7** anchors, so several census sections share a
gate region — flagged inline.

| # | label | anchor (unique, comma-free) | y@1440 | y@834 | y@390 |
|---|---|---|---|---|---|
| 1 | Nav / header (chrome) | `Home Page` | 0 | 0 | 0 |
| 2 | Hero — group photo + wave | `We are excited to meet` | 0 | 0 | 0 |
| 3 | TOC lede paragraph | `We want you to feel comfortable` | 600 | 631.8 | 406.5 |
| 4 | TOC visit list (3 rows) | `Take a Virtual Tour` | 600 | 781.8 | 566.5 |
| 5 | TOC button pair | `Registration Form` | 947 | 1052.8 | 782.3 |
| 6 | Office Tour heading | `Office Tour` | 1156.5 | 1154.8 | 916.7 |
| 7 | Office tour slider (8 slides) | `previous slide` | 1238.5 | 1202.8 | 964.7 |
| 8 | Hours + contact pair | `OFFICE HOURS` | 2198.5 | 2362.8 | 1320.5 |
| 9 | Meet Our Team heading | `Meet Our Team` | 2428.5 | 2546.8 | 1612.5 |
| 10 | Team slider (11 cards) | `Dr. Robert Quan` | 2588.5 | 2842.8 | 1764.5 |
| 11 | First Exam intro + photo | `To be a long term health partner` | 3348.5 | 4058.8 | 2388.5 |
| 12 | Registration Forms sticky box | `Registration Forms` | 3927.05 | 4587.6 | 2868.9 |
| 13 | Exam steps 01–06 | `Check-in` | 3927.05 | 5163.6 | 3300.9 |
| 14 | Review heading | `Serving the South Bay for over 40 years` | 5597.05 | 7147.6 | 4710.9 |
| 15 | Review slider + decorations | `This is my favorite dentistry team to date` | 5749.05 | 7313.6 | 4834.9 |
| 16 | Closing CTA band (chrome) | `Ready for great dental health` | 6269.05 | 7729.6 | 5180.9 |
| 17 | Fiji band + footer (chrome) | `Want to learn more` | 6813 / 7489 | 8001.6 / 8574.2 | 5384.9 / 5630.9 |

Document height `[probed-only]`: 8183 / 9541 / 6743 (and 7933 @992, 8019 @768).

### Gate-region → census mapping (where defects hide)

| gate anchor | census sections it swallows | risk |
|---|---|---|
| `We want you to feel comfortable` | **3, 4, 5** — 496.5px tall @1440, includes the whole 3-row visit list **and** both buttons | a broken 50px list row is 10% of the region; a broken button height is 13% — both can sit under 0.10 |
| `Office Tour` | **6, 7, 8** — 1212px tall @1440; the 900px-tall (100vh) slider is 74% of it | the 72px `#tour h1` is **6%** of the region. A completely wrong heading size will not move the score. **Check §6 in isolation.** |
| `Dr. Robert Quan` | **9, 10** — 800px @1440 | h2 (140px) is 17.5% |
| `To be a long term health partner` | **11, 12, 13** — 2168px @1440, the largest region on the page. Holds the intro row (538px), the sticky reg box (480px) **and** all six exam steps (1590px) | the reg box is 22%; an individual `.exam-step` (230px) is **10.6%** — right at the threshold. **Six separate blocks are being averaged here.** |
| `Serving the South Bay for over 40 years` | **14, 15** — 632px @1440 | the h1 is 11% |
| `Ready for great dental health` | **16** (chrome) | — |
| `Want to learn more` | **17** (chrome) | — |

Census sections **2** (hero, 540px) has no gate anchor of its own — the hero
`<h1>` text "We are excited to meet and care for you." is the only string in it.
Add it as an anchor if the gate is ever re-cut.

---

## B. PER-SECTION SPEC

Section-level box facts first, because the gate cuts on the section box:

| `<section>` | source | margin | padding |
|---|---|---|---|
| `.hero.group-photo` | `beachfront.css:5295-5300`, `:5322-5328` | 0 | 0 |
| `.fv-toc-section` | **no rule exists in `beachfront.css`** — bare `<section>`; all its space lives in `.content-width.mt-6` (`:3917-3919`) and `.my-6` (`:3834-3837`) on children | 0 | 0 |
| `#tour.fv-virtual-tour-section.mb-6` | only `.fv-virtual-tour-section.mb-8.pb-8` `beachfront.css:6634-6636` exists and does **not** match; the space is `.mb-6` `:3994-3996` | mb **60 / 48 / 36** | 0 |
| `#meet.fv-meet-our-team-section` | `beachfront.css:6638-6640` `margin-bottom: 3rem` | mb **120 / 96 / 72** | 0 |
| `#exam.fv-exam-section` | `beachfront.css:6642-6645` `color: var(--primary-dark); margin-bottom: 2rem` | mb **80 / 64 / 48** | 0 |
| `.fv-review-section` | **no rule exists** — bare `<section>` | 0 | 0 |

**All four inter-section gaps live in `margin-bottom` on the section above, not
in padding.** The gate region therefore *owns* the trailing gap. Reproducing any
of these as a `padding-bottom` or as a `margin-top` on the next section moves the
gap across the cut line and breaks two regions instead of zero.

---

### §2 — Hero (`section.hero.group-photo`)

Markup `your-first-visit.html` (pretty line 268-282): four children —
`.hero-top-gradient`, `.hero-bot-gradient`, `.bot-wave` (with SVG),
`.content-width > h1.first-visit-heading.su-w-full-mobile`.

**Box.** `.hero` `beachfront.css:5295-5300`: `align-items:center; height:33vw;
display:block; position:relative`.
`.hero.group-photo` `beachfront.css:5322-5328`: `background-position:50%;
background-size:cover; height:60vh; max-height:60vw`.
≤991 `beachfront.css:7984-7990`: `background-position:0%; background-size:115%;
height:70vw; max-height:100vw`.
≤767 `beachfront.css:8451-8454`: `height:80vh; max-height:70vw`.
≤479 `beachfront.css:9082-9086`: `background-size:cover; height:95vw;
max-height:none`.

Resolved heights: **540** @1440×900 (60vh, under the 864 cap) ·
**583.8** @834 (70vw) · **370.5** @390 (95vw). At 992 it is still 540 and at
768 it is 537.6 — the ≥993 branch is **viewport-*height* dependent**
(`60vh`), the others are width-dependent. `[probed]` confirms 540 at both
1440×900 and 992×900.

**Background image** (both the base and the ≤991 rule name the same file):
`https://cdn.prod.website-files.com/64af3f93339537d6b661b556/64b8367c61b87df9edf5b314_DSC_7547.jpg`
— `beachfront.css:5323` / `:7985`.

**Overlays (absolute, no transform):**
- `.hero-top-gradient` `beachfront.css:6477-6482`: `linear-gradient(#129ecccc, #0000);
  width:100%; height:25%; position:absolute` → measured 1440×135 / 834×145.9 /
  390×92.6 at y=0.
- `.hero-bot-gradient` `beachfront.css:6484-6490`: `linear-gradient(#0000, #129ecccc);
  width:100%; height:50%; position:absolute; bottom:0` → 270 / 291.9 / 185.3 tall,
  top at y = 270 / 291.9 / 185.3. (`.dark`/`.home`/`.home-blue` variants at
  `:6492`, `:6496`, `:6500` are **not** used here.)
- `.bot-wave` `beachfront.css:6008-6015`: `z-index:8; width:100%; line-height:0;
  position:absolute; bottom:0; left:0; overflow:hidden`, **plus the page's own
  inline style** `your-first-visit.html:28-30` `transform: rotate(180deg)`.
  `.bot-wave svg` `your-first-visit.html:32-37`: `position:relative; display:block;
  width: calc(133% + 1.3px); height: 3rem` → **120 / 96 / 72px**.
  `.bot-wave .shape-fill` `your-first-visit.html:40-42`: `fill:#FFFFFF`.
  Measured wave top y = 420 / 487.8 / 298.5.
  **The 180° rotation is on the PARENT `.bot-wave`, not on the `<svg>`** — same
  trap as the footer divider (`_chrome.md §4.6`). The SVG path itself is
  `viewBox="0 0 1200 120" preserveAspectRatio="none"`, path `d` beginning
  `M321.39,56.44c58-10.79,…` (`your-first-visit.html`, pretty line 275).
  The `.bot-wave.flip` variant (`beachfront.css:6018-6022`) is **not** used here.
- **JS duplicates the wave.** `your-first-visit.html` inline script (pretty
  line 1321-1324) runs `$(".bot-wave").append('<svg …>')` — the server HTML
  *already* contains one `<svg>`, so after load `.bot-wave` holds **two** SVGs;
  the second is clipped by `overflow:hidden` and is invisible. Do not reproduce
  the duplicate; do reproduce the single visible wave.

**Typography — `h1.first-visit-heading.su-w-full-mobile`**
Text: `We are excited to meet <br>and care for you.` (hard `<br>`,
`your-first-visit.html` pretty line 280).

| | 1440 | 834 | 390 |
|---|---|---|---|
| family | museo-slab, sans-serif `beachfront.css:2108` | ” | ” |
| weight | 300 `beachfront.css:2110` | ” | ” |
| size / line-height | **60 / 72** `beachfront.css:2109-2111` | **28 / 38** `beachfront.css:7853-7856` | **25 / 38** `beachfront.css:9293-9295` |
| colour | `#fff` `beachfront.css:6594` | ” | ” |
| align | left `beachfront.css:6595` | ” | ” |
| letter-spacing / transform | normal / none | ” | ” |
| width | 60% `beachfront.css:6602` | 60% `beachfront.css:8206` | 100% `beachfront.css:8770` |
| position | absolute, `bottom: 2rem` = **80** `beachfront.css:6604` | absolute, `bottom: 1rem` = **32** `beachfront.css:8208` | `bottom: 1rem` = **24** `beachfront.css:8208` |
| margin | `20px 0 0` (`:2106` top + `:6603` bottom 0) | ” | ” |

Measured rects `[probed]`: 1440 `{x:80, y:316, w:840, h:144}` ·
834 `{x:48, y:475.8, w:500.4, h:76}` · 390 `{x:19.5, y:270.5, w:390, h:76}`.
Note at 390 the box is 390 wide (100% of `.content-width`'s **content** box is
351, but `width:100%` + `position:absolute` resolves against the padding box).

Header (§1) sits on top of the hero at y=0 with height 120 / 96 / 72 — see
`_chrome.md §3.2`.

---

### §3 — TOC lede (`section.fv-toc-section`)

Wrapper chain: `section.fv-toc-section > .content-width.mt-6 >
.w-layout-hflex.su-flex-v-tablet.my-6.flex-justify-between`.

- `.mt-6` `beachfront.css:3917-3919` → `margin-top: 1.5rem` = **60 / 48 / 36**.
  (`.mt-6.su-flex-v-mobile` `:3921-3923` does not match here.)
- `.my-6` `beachfront.css:3834-3837` → `margin-top/bottom: 1.5rem` = **60 / 48 / 36**.
  Both margins are on the *inner* flex row, not on the section.
- `.w-layout-hflex` `beachfront.css:2056-2060`: `flex-direction:row;
  align-items:flex-start; display:flex`.
- `.flex-justify-between` `beachfront.css:3008-3011`: `justify-content:space-between; display:flex`.
- `.su-flex-v-tablet` `beachfront.css:5623-5625` (`display:flex`), ≤991
  `:8004-8006` and ≤767 `:8530-8532` → `flex-direction: column`.
  **The row becomes a column at 991, one pixel before the root font drops.**

**Typography — `p.text-body-large._w-half.max-w-490px.slab.su-w-full-tablet`**
Text: "We want you to feel comfortable before your first visit. Here some ways
to give you a clear idea of what to expect:"

| | 1440 | 834 | 390 |
|---|---|---|---|
| family | museo-slab (`.slab` `beachfront.css:6328-6330`) | ” | ” |
| weight | 300 (`p` `beachfront.css:2170`) | ” | ” |
| size / line-height | **30 / 45** (`1.5em`) `beachfront.css:7762-7764` | **20 / 30** `beachfront.css:8363-8365` | **20 / 30** `beachfront.css:9573-9576` |
| colour | `var(--primary-dark)` `#365b6d` `beachfront.css:2167` | ” | ” |
| margin | `20px 0 40px` `beachfront.css:7761-7762` | same | `20px 0 20px` `beachfront.css:9574` |
| width | 50% `beachfront.css:2869` | 100% `beachfront.css:8216` | 100% `beachfront.css:8770` |
| max-width | **490px** `beachfront.css:7775-7777` (`.text-body-large._w-half.max-w-490px`) | 490px | 490px |

Measured `[probed]`: 490×180 @1440 (x=80) · 490×90 @834 (x=48) ·
351×120 @390 (x=19.5, capped by the container, not by the 490 max).

Right column `div._w-half.px-4.su-w-full-tablet.su-px-0-tablet`:
`._w-half` `beachfront.css:2867-2871` (`object-fit:fill; width:50%; position:relative`),
`.px-4` `beachfront.css:4130-4133` → padding-x `1rem` = **40 / 32 / 24**,
≤991 `._w-half.px-4.su-w-full-tablet.su-px-0-tablet` `beachfront.css:7881-7884`
→ `padding-left/right: 0`.
**`.su-px-0-tablet`, `.su-w-60pc-tablet` and `.max-w-490px` have no standalone
rule anywhere in `beachfront.css`** — they exist only as parts of combo
selectors. Reimplementing them as real utility classes will over-apply.
Measured: 640 wide pad-x 40 @1440 · 738 wide pad-x 0 @834 · 351 wide pad-x 0 @390.

---

### §4 — TOC visit list

`div.w-layout-vflex.visit-list` (`.w-layout-vflex` `beachfront.css:2078-2082`:
`flex-direction:column; align-items:flex-start; display:flex`).
**`.visit-list` has no rule** — it is `.w-layout-vflex` only.

Three `a.visit-list-item.w-inline-block`, each
`h6.visit-list-number` + `h3.px-2.my-0` + `img.download-icons`:

| # | number | title | href |
|---|---|---|---|
| 01 | `01` | Take a Virtual Tour | `#tour` |
| 02 | `02` | Meet Our Team | `#meet` |
| 03 | `03` | First Exam Details | `#exam` |

**`.visit-list-item`** `beachfront.css:6607-6618`: `cursor:pointer;
background-color:#0000; border:1px #000` (no style ⇒ no border painted);
`justify-content:flex-start; align-items:center; width:100%;
margin-bottom:1.5rem; text-decoration:none; transition:opacity .2s; display:flex`.
≤991 `beachfront.css:8211-8213` → `margin-bottom: 1rem`.
Resolved margin-bottom: **60 / 32 / 24** — a three-value ladder out of two rules.
Hover `beachfront.css:6620-6622` → `opacity: .67`.
Border-radius 5px is inherited from the Webflow `.w-inline-block` default
(`_chrome.md §3.2` cites `beachfront.css:2174-2179`) `[probed: 5px]`.
Measured item box: 560×50 @1440 · 738×50 @834 · 351×36 @390.

**`h6.visit-list-number`** `beachfront.css:6628-6632`: `letter-spacing:1.92px;
font-size:24px; display:inline-block`.
≤479 `beachfront.css:9297-9299` → `font-size: 20px`.
Base `h6` `beachfront.css:2154-2164` supplies colour `var(--primary-dark)`,
`text-transform:uppercase`, `margin:10px 0`, museo-slab, weight 700,
line-height 30px. `h6` ≤991 `beachfront.css:7872-7875` sets
`font-size:12px; line-height:15px` — **the font-size loses on specificity
(0,1,0 beats 0,0,1) but the line-height wins**, so:

| | 1440 | 834 | 390 |
|---|---|---|---|
| size / line-height | **24 / 30** | **24 / 15** | **20 / 15** |
| letter-spacing | 1.92px | 1.92px | 1.92px |
| colour / transform | `#365b6d` / uppercase | ” | ” |

Measured heights 30 / 15 / 15 confirm it. **This is a genuine 24/24/20 ×
30/15/15 split — neither axis breaks at the same width.**

**`h3.px-2.my-0`** — `h3` `beachfront.css:2124-2132` (museo-slab, 300,
40/50, `var(--primary)` `#129ecc`); ≤991 `beachfront.css:7863-7866` → 21/26.
`.px-2` `beachfront.css:4120-4123` → padding-x `.5rem` = **20 / 16 / 12**.
`.my-0` `beachfront.css:3804-3807` → margin-y 0.
Resolved: **40/50 · 21/26 · 21/26**.

**`img.download-icons`** src
`https://cdn.prod.website-files.com/64af3f93339537d6b661b556/64b83c94c89c8dae60fa869b_download-arrow.svg`
(same file for all three rows). `beachfront.css:7806-7808` → `height:100%`;
≤767 `beachfront.css:9001-9003` → `height: 1.5rem` = **36px @390**.
Measured 51×50 / 51×50 / 36.7×36.

---

### §5 — TOC button pair

Plain `<div>` (no class) holding two `.w-button` anchors. Full button spec is
`_chrome.md §6` — do not re-derive; the measured heights there
(66 / 54 / 38.375 for `text-color-primary-dark`, 67 / 54 / 38.375 for
`text-color-primary`) reproduce exactly on this page.

Page-specific modifiers only:
- Button 1 `a.button.text-color-primary-dark.mr-4.show-form` "Book an Apointment"
  (live's typo — keep it). `.mr-4` `beachfront.css:3949-3951`-family utility
  → `margin-right: 1rem` = **40 / 32 / 24** `[probed 40/32/24]`.
  ≤767 `.button.text-color-primary-dark` `beachfront.css:8636-8638`
  → `margin-bottom: 60px` (measured 60 @390).
  ≤479 `.button.text-color-primary-dark.mr-4.show-form` `beachfront.css:9177-9179`
  → `margin-top: 0`.
- Button 2 `a.button.text-color-primary` "Registration Form" — `href="#"`,
  **no click handler at all** (see §C.5).

Measured: 302.25×66 + 268.23×67 @1440 · 242.2×54 + 214.98×54 @834 ·
170.14×38.375 + 151.09×38.375 @390 (wrapping to two lines at 390 because of the
60px bottom margin on button 1).

---

### §6 — Office Tour heading

`section#tour.fv-virtual-tour-section.mb-6 > .content-width > h1` (bare `h1`,
no class, carries `data-w-id="c9a05a4b-b940-4d5f-6439-b5fc3ca217de"`).

| | 1440 | 834 | 390 |
|---|---|---|---|
| family / weight | museo-slab / 300 `beachfront.css:2108-2110` | ” | ” |
| size / line-height | **60 / 72** `beachfront.css:2109-2111` | **28 / 38** `beachfront.css:7853-7856` | **28 / 38** `beachfront.css:8373-8376` |
| colour | `var(--primary)` `#129ecc` `beachfront.css:2105` | ” | ” |
| margin | `20px 0 10px` `beachfront.css:2106-2107` | ” | ” |

The tier boundary is **991, not 767** — at 992 this heading is still 60px.

---

### §7 — Office tour slider (Webflow native `w-slider`)

**Markup contract** (`your-first-visit.html`, pretty lines 317-373) — this is a
stock Webflow Slider component and the data-attributes are load-bearing:

```
div._w-full.h-half-screen-width.su-h-screen-to-tablet
  div.h-full._w-full.w-slider  role="region" aria-label="carousel"
      data-delay="4000" data-animation="slide" data-autoplay="false"
      data-easing="ease" data-hide-arrows="false" data-disable-swipe="false"
      data-autoplay-limit="0" data-nav-spacing="3" data-duration="500"
      data-infinite="true"
    div.w-slider-mask#w-slider-mask-0
      div.w-slide[aria-label="N of 8"][role=group]  × 8   (+ aria-hidden on 2-8)
        img (srcset ladder 500/800/1080/1600/2000/2600[/3200]w + full)
      div.w-slider-aria-label[aria-live=off][aria-atomic=true][data-wf-ignore]
    div.w-slider-arrow-left[role=button][tabindex=0][aria-controls=w-slider-mask-0]
      div.w-icon-slider-left
    div.w-slider-arrow-right[role=button][tabindex=0][aria-controls=w-slider-mask-0]
      div.w-icon-slider-right
    div.display-none.w-slider-nav.w-round
      div.w-slider-dot × 8  (inline style="margin-left:3px; margin-right:3px")
```

**Height — the sneakiest box on the page.** The outer div carries two
competing 0,1,0 rules:
`.h-half-screen-width` `beachfront.css:3173-3175` → `height: 50vw`
vs `.su-h-screen-to-tablet` `beachfront.css:5656-5658` → `height: 100vh`.
**`:5656` is later in the sheet, so 100vh wins at ≥768.**
≤767 `beachfront.css:8554-8556` → `height: auto`.

| | 1440×900 | 834×1112 | 390×844 |
|---|---|---|---|
| outer div | **900** (100vh) | **1112** (100vh) | **319.8** (auto) `[probed-only]` |

The ≥768 height is **viewport-height dependent**, not width dependent. The
390 value (319.8) is the image's 292.5px rendered height plus the ~27.3px
inline-block baseline strut of `.w-slide` inside the block `.w-slider-mask`
(`beachfront.css:1211-1219` `display:inline-block` under `:1200-1209`
`display:block`, with the inherited 76.8px line-height) — `[probed-only]`,
not derivable from any single declaration.

`.w-slider` `beachfront.css:1190-1198`: `text-align:center; clear:both;
background:#ddd; height:300px; position:relative` — the `height:300px` is
**overridden by `.h-full` `beachfront.css:3149-3151` (`height:100%`)**, which is
later in the sheet. The `#ddd` background is visible only as letterboxing.
`.w-slider-mask` `beachfront.css:1200-1209`: `z-index:1; white-space:nowrap;
height:100%; position:relative; overflow:hidden`.
`.w-slide` `beachfront.css:1211-1219`: `width:100%; height:100%;
display:inline-block; position:relative`.
`.w-slider-arrow-left/right` `beachfront.css:1285-1298`: `cursor:pointer;
color:#fff; width:80px; margin:auto; font-size:40px; position:absolute;
inset:0; overflow:hidden` (+ `:1308-1311` z-index 3 / `right:auto`,
`:1313-1316` z-index 4 / `left:auto`). Measured 80×900 / 80×1112 / 80×319.8.
`.w-icon-slider-left/right` `beachfront.css:1318-1323`: `width:1em; height:1em;
margin:auto; inset:0` — glyphs from the base64 `webflow-icons` font
`beachfront.css:171-176`, characters `beachfront.css:190-196`.
`.w-slider-nav` `beachfront.css:1221-1231` + `.w-round > div` `:1233-1235`;
**`.display-none` `beachfront.css:2214-2216` hides the whole dot strip** — the
8 dots exist in the DOM and are never operable. `.w-slider-dot`
`beachfront.css:1261-1270` and `.w-active` `:1272-1274` are dead here.
`.w-slider-aria-label` `beachfront.css:1325-1332` is the visually-hidden
live region.

**Image sources (8 slides, in order)** — all under
`https://cdn.prod.website-files.com/64af3f93339537d6b661b556/`:

1. `6542a1154feb8b0a92630033_BD_office_2020_IMG_2870_horiz.jpg` (3024w, `sizes="(max-width: 3024px) 100vw, 3024px"`)
2. `6542a134d4645bea1c787068_BD_office_2020_IMG_2880_horiz.jpg` (3024w)
3. `6542a12e0369ef3b0d3504d4_BD_office_2020_IMG_2877.jpg` (4032w)
4. `6542a12762a6c6205a77f81d_BD_office_2020_IMG_2875.jpg` (3526w)
5. `6542a10997b561809dbcf82a_1706_Village_Pro_building_exterior_image_crop_3000px.jpg` (3000w)
6. `64b847552e330d5af9486457_BD_office_2020_IMG_2883.jpg` (4032w)
7. `6542a13f035d60f4138f9688_BD_office_2020_IMG_2881_horiz.jpg` (2367w)
8. `6542a1c2fec0efaa4cd03347_BD_office_2020_IMG_2882_horiz.jpg` (2883w)

All `loading="lazy"`, `alt=""`, no `object-fit` — the img is
`max-width:100%` (`beachfront.css:232-236`) so it renders at container width ×
natural aspect and **overflows the 900px mask**, clipped by
`.w-slider-mask{overflow:hidden}`. Measured img box 1440×1080 @1440.

---

### §8 — Hours + contact pair

`.content-width > div.w-layout-hflex.mt-6.su-flex-v-mobile` holding two
`.footer-contact-block`. Reuses footer classes but is **not** in the footer.

- `.mt-6` `beachfront.css:3917-3919` → **60 / 48 / 36**.
- `.su-flex-v-mobile` `beachfront.css:5291-5293` (`display:flex`);
  ≤767 `beachfront.css:8434-8436` → `flex-direction: column`.
  Column at **390 only** — still a row at 834.
- `.footer-contact-block.mb-4.mr-8`: `.mb-4` `beachfront.css:3985-3988`
  (`margin-top:0; margin-bottom:1rem` = **40 / 32 / 24**);
  `.mr-8` `beachfront.css:3961-3963` (`margin-right:2rem` = **80 / 64 / 48**).
  The combo rule `.footer-contact-block.mb-4.mr-8.mt-8` `beachfront.css:6324-6326`
  does **not** match (no `.mt-8` here).
- `.footer-contact-header` `beachfront.css:6337-6343`: `color:var(--primary-dark);
  museo-slab; font-size:20px; font-weight:500; line-height:2em`;
  ≤991 `beachfront.css:8130-8132` → 16px; ≤479 `:9240-9242` → 16px.
  Resolved **20/40 · 16/32 · 16/32**. Text `OFFICE&nbsp;HOURS` / `CONTACT` —
  the non-breaking space is in the source.
- Rows are `div.text-body` `beachfront.css:7751-7754` (20px / 1.5em);
  ≤991 `beachfront.css:8359-8361` → 16px; ≤479 `:9555-9558` → 16px / 1.5em.
  Resolved **20/30 · 16/24 · 16/24**, colour `#333` (inherited `body`
  `beachfront.css:2097`).

Content: `Monday - Thursday / 7am - 5pm`, `Friday / 7am - 2pm`,
`Saturday - Sunday / Closed`; `(310) 378-9241`, `1706 S Elena Ave. Suite B`,
`Redondo Beach, CA 90277`.

Measured block: 297.25×130 @1440 · 237.8×104 @834 · 237.8×104 @390.

---

### §9 — Meet Our Team heading

`h2.text-align-center.font-weight-thin.mb-4` — **the single biggest type trap on
this page.**

`.text-align-center.mb-4` `beachfront.css:4491-4495`:
`margin-bottom: .5rem; font-size: 120px; line-height: 140px`.
≤479 `.text-align-center.mb-4` `beachfront.css:9050-9053`:
`font-size: 56px; line-height: 70px`.

`h2` base is 140/168 (`beachfront.css:2114-2122`) and `h2` ≤991 is 72/80
(`beachfront.css:7858-7861`) — **both lose**, because the combo selector is
(0,2,0) and lands in the base cascade. The **only** breakpoint on this heading
is **479**:

| | 1440 | 834 | 390 |
|---|---|---|---|
| size / line-height | **120 / 140** | **120 / 140** | **56 / 70** |
| margin-bottom | `.5rem` = 20 | `.5rem` = **16** | `.5rem` = **12** |
| weight | 100 (`.font-weight-thin` `beachfront.css:6122-6124`) | ” | ” |
| family / colour | museo-slab / `var(--primary)` | ” | ” |
| align | center `beachfront.css:4460-4462` (`text-decoration:none` too) | ” | ” |

Measured `[probed]`: 1280×140 @1440 · 738×**280** @834 (it wraps to two lines at
120px in a 738px column) · 351×140 @390. **A build that steps this to 56px at
768 renders it half-size across the entire 480–991 band.**
≤479 also adds `.text-align-center{white-space:normal}` `beachfront.css:9042-9044`.

---

### §10 — Team slider (11 CMS cards, custom JS)

**Markup contract** — Webflow Collection List **on top of** the legacy
`w-row`/`w-col` grid:

```
div.slider-arrows-anchor            (height:0 positioning anchor)
  img.team-slider-arrow.filter-to-primary.left   (inline style opacity:0; pointer-events:none — set by JS)
  img.team-slider-arrow.filter-to-primary.right
div.team-slider-holder.w-dyn-list   (overflow:hidden viewport)
  div.team-slider.w-dyn-items.w-row  data-w-id=0f5db9c9-…  (inline width set by JS)
    div.team-list-item.m-2.display-inline.w-dyn-item.w-col.w-col-4  × 11
        (inline style="margin-right:Npx; margin-left:Npx" set by JS)
      a.inline-link > img.team-grid-headshot
      a.inline-link > h5.text-align-center
      h6.text-align-center.h7
      p.m-2.team-teaser.text-body.mb-1
      img.team-grid-beach   +   h6.team-beach-name
      a.flex-align-center._w-half.bg-color-transparent
        div.team-teasewr-read-more.flex-child-align-end.flex-align-end.display-flex
        img.read-more-arrow.filter-to-primary-dark
```

`.w-row` `beachfront.css:714-722` (table clearfix), ≤767 `:872-875` (margin-x 0);
`.w-col` `beachfront.css:729-736` (`float:left; width:100%; padding:0 10px`),
`.w-col-4` `:755-757` (33.3333%). **All of it is overridden**: `.team-list-item`
sets an explicit width and `padding-left:0` (`beachfront.css:6535`) /
`padding-right:0` (`:6544`), and `.display-inline` (`beachfront.css:2206-2208`)
replaces the float layout. Reproducing the `w-col` padding is a 20px error per card.

**`.team-slider-holder`** `beachfront.css:6654-6659`: `width:100%; height:16rem;
position:relative; overflow:hidden`.
≤991 `beachfront.css:8226-8231`: `width:20rem; height:35rem; margin-left/right:auto`.
≤767 `beachfront.css:8777-8779`: `width:16rem`.
≤479 `beachfront.css:9309-9312`: `width:12rem; height:23rem`.

| | 1440 | 834 | 390 |
|---|---|---|---|
| width | 100% = **1280** | `20rem` = **640** | `12rem` = **288** |
| height | `16rem` = **640** | `35rem` = **1120** | `23rem` = **552** |
| margin-x | 0 | auto (measured 49) | auto (measured 31.5) |

**`.team-slider`** `beachfront.css:6647-6652`: `transition: transform 2s
cubic-bezier(.19, 1, .22, 1); position:absolute; top:0; left:0`.
≤991 `beachfront.css:8219-8224`: `white-space:nowrap; width:1000rem;
display:inline; left:1rem`. ≤767 `beachfront.css:8773-8775`: `left:-1rem`.
≤479 `beachfront.css:9301-9307`: `flex-direction:column; width:1000rem;
height:21rem; display:inline; left:0`.
The CSS `width` is then **replaced by JS** (see below).

**`.team-list-item.m-2.display-inline`** — the ladder already litigated once on
this project (CLAUDE.md, "the `.team-list-item` ladder"):

| rule | source | decls |
|---|---|---|
| base | `beachfront.css:6530-6536` | `background: var(--primary-light); border-radius:20px; width:8rem; height:12rem; padding-left:0` |
| `.m-2` | `beachfront.css:3762-3764` | `margin:.5rem` |
| `.m-2` combo | `beachfront.css:6538-6540` | `margin-top: 4rem` |
| `.m-2.display-inline` | `beachfront.css:6542-6545` | `width: 8.5rem; padding-right:0` |
| ≤991 `.m-2` | `beachfront.css:8183-8187` | `width:16rem; height:24rem; margin: 8rem 1rem 1rem` |
| ≤991 `.m-2.display-inline` | `beachfront.css:8189-8191` | `width: 16rem` |
| ≤479 `.m-2` | `beachfront.css:9271-9276` | `width:100%; height:16rem; margin-top:4rem; padding-top:2.5rem` |
| ≤479 `.m-2.display-inline` | `beachfront.css:9278-9282` | `white-space:nowrap; width:10rem; height:18rem` |

| | 1440 | 834 | 390 |
|---|---|---|---|
| width | `8.5rem` = **340** | `16rem` = **512** | `10rem` = **240** |
| height | `12rem` = **480** | `24rem` = **768** | `18rem` = **432** |
| margin-top | `4rem` = **160** | `8rem` = **256** | `4rem` = **96** |
| margin-bottom | `.5rem` = **20** | `1rem` = **32** | `1rem` = **24** |
| margin-left/right | **JS-set 43.3333** | **JS-set 64** | **JS-set 24** |
| padding-top | 0 | 0 | `2.5rem` = **60** |
| radius / bg | 20px / `#e7f5fa` | ” | ” |

**JS: `team-slider.js`** (loaded from
`https://raw.githack.com/tucksravin/incidental-js/main/webflow/specific/beachfront/team-slider.js`,
`your-first-visit.html` pretty line 1352). It depends on `getContentWidthMargin()`
from `matching/spec/incidental-utils.js`. Verbatim contract:

```
portSize = $(".team-slider-holder").width();
inc      = portSize/3;
slideHorMargin = (portSize - 3*$(".team-list-item").outerWidth(false))/6;
if (innerWidth < 992) {
    inc = portSize;
    slideHorMargin = (portSize - $(".team-list-item").outerWidth(false))/2;
    $(".team-slider").css("margin-left", "-" + slideHorMargin/2 + "px");
}
if (innerWidth < 768) $(".team-slider").css("margin-left", 0);
$(".team-list-item").css("margin-right"/"margin-left", slideHorMargin + "px");
$(".team-slider").css("width", length * $(".team-list-item").outerWidth(true) + "px");
next: transform = translateX(-inc * i);   prev: translateX(-inc * i)
hideRight at i == length-1;  showLeft at i == 1;  hideLeft at i == 0
$(".left").css({opacity:0, pointer-events:none}) on init
```

Resolved `[probed]`:

| | 1440 | 834 | 390 |
|---|---|---|---|
| `portSize` | 1280 | 640 | 288 |
| `inc` (stride per click) | **426.667** | **640** | **288** |
| `slideHorMargin` | **43.3333** | **64** | **24** |
| `.team-slider` inline width | **4693.33px** | **7040px** | **3168px** |
| `.team-slider` margin-left | 0 | **-32px** | 0 |

Note the JS **breaks at 992/768, the root-font ladder's boundaries, not
Webflow's 991/767** — a third, independent breakpoint set. At exactly 991 the
CSS is in tablet mode but `inc` is still `portSize/3`.

Verified `[probed]`: click right once → `translateX(-426.667px)`; twice →
`translateX(-853.333px)`; `.left` opacity 0 → 1 after the first click.

**`.team-slider-arrow`** `beachfront.css:6666-6668` (`height:1rem`),
`.filter-to-primary` `:6670-6673` (`cursor:pointer; transition:opacity .2s`),
hover `:6675-6677` (`opacity:.6`), `.left` `:6679-6684`, `.right` `:6686-6691`;
≤991 `:8233-8243`; ≤767 `:8781-8789`; ≤479 `:9314-9322`.

| | 1440 | 834 | 390 |
|---|---|---|---|
| height | `1rem` = **40** | `1.5rem` = **48** | `1.5rem` = **36** |
| top | `3.5rem` = **140** | `15rem` = **480** | `8rem` = **192** |
| left / right | **-1.5rem = ∓60** | **0** | **∓5%** |

`.slider-arrows-anchor` `beachfront.css:6661-6664`: `height:0; position:relative`
— the arrows are absolutely positioned against a zero-height box that sits
immediately after the h2, so their y is `h2 bottom + top`.

**`.filter-to-primary` has no rule anywhere** — not in `beachfront.css`, not in
the page's inline `<style>`. Computed filter is `none` `[probed]`. The arrows
render at the SVG's own colour. **Do not add a recolour filter.**
By contrast `.filter-to-primary-dark` **is** defined, in the page's own embed:
`your-first-visit.html:85-87` →
`filter: brightness(0%) saturate(100%) invert(29%) sepia(33%) saturate(599%) hue-rotate(155deg) brightness(100%) contrast(87%)`.

Arrow assets:
`…/6508d8102d754d9bb2bd3f70_left-arrow.svg` · `…/6508d7f2898b1f24f98c7668_right-arrow.svg`.

**Card internals:**

| element | source | 1440 | 834 | 390 |
|---|---|---|---|---|
| `img.team-grid-headshot` | `beachfront.css:6551-6562`; ≤991 `:8193-8197`; ≤479 `:9284-9287` | `5rem`=**200**², mt **-100** | `10rem`=**320**², mt **-160** | `5rem`=**120**², mt **-120** (mt from the ≤991 `-5rem`) |
| ” other decls | `object-fit:cover; object-position:50% 0%; border-radius:100rem; margin-left/right:auto; transition:opacity .2s; display:block` | | | |
| `h5.text-align-center` | `beachfront.css:2144-2152` (no override) | **30 / 40**, museo-slab 300, `var(--primary)`, margin `10px 0` | same | same |
| `h6.text-align-center.h7` (role) | `.h7` `beachfront.css:7734-7740` | **16 / 25**, **museo-sans** 300, `var(--primary-dark)`, ls 1.28px, uppercase | same | same |
| `p.m-2.team-teaser.text-body.mb-1` | `.m-2.team-teaser` `beachfront.css:3770-3773` (`height:7.5ch; overflow:hidden`); `.m-2.team-teaser.text-body.mb-1` `:3775-3777` (`font-size:16px`); ≤991 `:7968-7970` (`white-space:normal`); `.mb-1` `:3973-3975` (`margin-bottom:.25rem`) | **16 / 24**, box 300×75, m `20/20/10/20` | 16/24, 480×75, m `16/16/8/16` | 16/24, 216×75, m `12/12/6/12` |
| `img.team-grid-beach` | `beachfront.css:6564-6573` | `width:100%; height:30%`, radius `0 0 20px 20px`, absolute bottom 0 → **340×144** | 512×230.4 | 240×129.6 |
| `h6.team-beach-name` | `beachfront.css:7370-7376` (`color:#fff; font-weight:300; absolute; bottom:.25rem; left:.5rem`) + `h6` base/≤991 | **24 / 30**, bottom 10, left 20 | **12 / 15**, bottom 8, left 16 | **12 / 15**, bottom 6, left 12 |
| `div.team-teasewr-read-more…display-flex` | `beachfront.css:7429-7441` (16px / 1.5em, ls 1.03px, uppercase, `var(--primary-dark)`, margin-x `.5rem`, `text-align:right`, `display:block`) **but `.display-flex` ≤991 `beachfront.css:7890-7892` sets `font-size:.6rem`** | **16 / 24** | **19.2 / 28.8** ← *larger than desktop* | **14.4 / 21.6** |
| `img.read-more-arrow.filter-to-primary-dark` | no `.read-more-arrow` rule; filter from `your-first-visit.html:85-87` | 10×11 | 10×11 | 10×11 |

`a.inline-link` `beachfront.css:7382-7389` (`cursor:pointer; background:#0000;
border:1px #000; text-decoration:none; transition:opacity .2s; display:inline`),
hover `:7391-7393` (`opacity:.6`).
`.flex-align-center` `beachfront.css:2953-2956`, `._w-half` `:2867-2871`,
`.flex-align-center._w-half` `:2958-2960` (`text-decoration:none`),
`.bg-color-transparent` `:4585-4587`, `.flex-align-end` `:2962-2965`,
`.flex-child-align-end` `:2913-2915`.

**Roster + assets (11 cards, CMS order).** Headshots under
`https://cdn.prod.website-files.com/64b1c843b071dc32170ea053/`:

| # | name | role | slug | headshot | beach label / image |
|---|---|---|---|---|---|
| 1 | Dr. Michael Hopkins | Dentist | `/team-members/dr-michael-hopkins` | `64bb0fca292b8b83528cc2ff_BD_Dr-Hopkins-Headshot_crop.jpg` | Cabo — `64bb1017e17c11a72e17236f_beach-img_gaddafi-rusli-2ueUnL4CkV8-unsplash.jpg` |
| 2 | Dr. Robert Quan | Dentist | `/team-members/dr-robert-quan` | `64bb0fbee7ccd4a6c98eb3bc_BD_Dr-Quan-Headshot_crop.jpg` | Bali — `64bb0f96fd2a4cab9f42ccaa_beach-img_elizeu-dias-RN6ts8IZ4_0-unsplash.jpg` |
| 3 | Alicia | Dental Hygenist *(live's spelling)* | `/team-members/alicia` | `64bc459e10fba50752b252b6_Alicia_7530_crop.jpg` | Santa Barbara — `64bc4afd03823445f34950b3_beach-img_cristofer-maximilian-uQDRDqpYJHI-unsplash.jpg` |
| 4 | Christina | Dental Hygienist | `/team-members/christina` | `64bc4d1ccc874d4a3f88fb11_BH_christina_DH.jpg` | Myrtle Beach — `64bc4bcdb9c30f671929f6d2_beach-img_aleksandra-boguslawska-MS7KD9Ti7FQ-unsplash.jpg` |
| 5 | Enrique | Dental Assistant | `/team-members/enrique` | `64bb0ecf51f2b29911ad5374_enrique.jpg` | Cabo — `64bb0e4c778125db87203f95_beach-img_lalo-hernandez-Amo081zdJsI-unsplash.jpg` |
| 6 | Lanette | Dental Hygienist | `/team-members/lanette` | `64bc51dd4bea106fb5db4e6a_lanette_beachfront.jpg` | Cabo — `64bb1017e17c11a72e17236f_…` |
| 7 | Linda | Administrator | `/team-members/linda` | `64bc4b3dfa9c2b4c2d919bb3_Linda_edit_7595.jpg` | Myrtle Beach — `64bc4bcdb9c30f671929f6d2_…` |
| 8 | Michelle | Administrator | `/team-members/michelle` | `64bc4c68082c3534bd2fc72a_michelle_beachfront.jpg` | Cabo — `64bb1017e17c11a72e17236f_…` |
| 9 | Raquel | Hygiene Coordinator | `/team-members/raquel` | `64bc4ed80b3b039b77fbb8ca_raquel-beachfront.jpg` | Bali — `64bb0f96fd2a4cab9f42ccaa_…` |
| 10 | Sabrina | Dental Hygienist | `/team-members/sabrina` | `64bc4daf6430fa15b0c2480a_BH_sabrina.jpg` | Santa Barbara — `64bc4afd03823445f34950b3_…` |
| 11 | Stacey | Dental Hygenist *(live's spelling)* | `/team-members/stacey` | `64bb0dfdfd2a4cab9f4157f7_DSC_7537_sq_headshot_crop.jpg` | Cabo — `64bb0e4c778125db87203f95_…` |

Read-more arrow (all 11):
`https://cdn.prod.website-files.com/64af3f93339537d6b661b556/64b070f15651708aded7ab3e_Arrow.svg`.
All card images are `loading="eager"`.

---

### §11 — First Exam intro row

`section#exam.fv-exam-section > .content-width >
div.w-layout-hflex._w-full.mb-4.su-flex-v-tablet.flex-justify-between`
(`data-w-id="b018c59b-…"`, reveals as one unit).

- `._w-full` `beachfront.css:2885-2887`; ≤991 combo `:7886-7888`
  (`._w-full.flex-justify-between.su-flex-v-tablet { align-items: center }`)
  — **applies here**, so the stacked column is centre-aligned at 834 and 390.
- `.mb-4` `beachfront.css:3985-3988` → `margin-bottom: 1rem` = **40 / 32 / 24**.
- `su-flex-v-tablet` → column at ≤991.

Left column `div._w-30pc.su-w-60pc-tablet.su-w-full-mobile`:
`._w-30pc` `beachfront.css:3526-3528` (30%);
≤991 `._w-30pc.su-w-60pc-tablet` `beachfront.css:7956-7958` → 60%;
≤767 `._w-30pc.su-w-60pc-tablet.su-w-full-mobile` `beachfront.css:8405-8407` → 100%;
≤479 same selector `beachfront.css:9038-9040` → 100%.
Measured **384 / 442.8 / 351**.

- `h3` "First Exam" — bare `h3`: **40/50** `beachfront.css:2124-2132` →
  **21/26** ≤991 `beachfront.css:7863-7866`. Margin `20px 0 10px`.
- `p.su-w-full-mobile.text-body` — `.text-body` `beachfront.css:7751-7754`
  20/1.5em; ≤991 `:8359-8361` 16px; ≤479 `:9555-9558` 16/1.5em.
  Resolved **20/30 · 16/24 · 16/24**, colour `var(--primary-dark)`.
  Contains an inline `<strong>`: "**We ask for 2 hours of your time.**" —
  `strong` picks up `font-weight:bold` from UA/Webflow reset; keep the tag.

Right image `img._w-60pc.su-w-full-mobile`:
`._w-60pc` `beachfront.css:3540-3542` (60%);
`.su-w-full-mobile` ≤767 `beachfront.css:8426-8428` → 100%.
src `https://cdn.prod.website-files.com/64af3f93339537d6b661b556/64b8507bcb8d755f8682eef1_DSC_7704.jpg`,
`loading="lazy"`, srcset 500/800/1080/1600/2000/2600w + full.
Measured **768×538.5 / 442.8×310.8 / 351×246.4**.

---

### §12 — Registration Forms box (sticky)

Second row: `div.w-layout-hflex._w-full.flex-justify-between.su-flex-v-tablet`
(no `data-w-id` — the row itself does not reveal).

**`.registration-forms-box`** `beachfront.css:6693-6704`:
`background: var(--primary-light); border-radius:25px; justify-content:flex-start;
width:12rem; height:12rem; margin-bottom:3rem; padding:1rem; display:flex;
position:sticky; top:1rem`.
≤991 `beachfront.css:8245-8250`: `width:20rem; height:16rem; margin-bottom:2rem;
position:static`. ≤767 `beachfront.css:8791-8795`: `width:100%; max-width:20rem;
height:16rem`. ≤479 `beachfront.css:9324-9326`: `height:16rem`.

| | 1440 | 834 | 390 |
|---|---|---|---|
| width | `12rem` = **480** | `20rem` = **640** | 100% = **351** (max `20rem`=480) |
| height | `12rem` = **480** | `16rem` = **512** | `16rem` = **384** |
| padding | `1rem` = **40** | **32** | **24** |
| margin-bottom | `3rem` = **120** | `2rem` = **64** | `2rem` = **48** |
| position / top | **sticky / 40** | static | static |
| radius / bg | 25px / `#e7f5fa` | ” | ” |

**`position: sticky` only at ≥992.** It sticks against the `#exam .content-width`
column while the six steps scroll past. A build that omits the sticky (or applies
it at all widths) diverges by hundreds of pixels mid-scroll.

**`.circle-time-holder.mr-2`** — the only base rule is
`.circle-time-holder.p-2` `beachfront.css:6706-6710` which **does not match**
(the markup has `.mr-2`, not `.p-2`). So it is a plain block flex-item:
`.mr-2` `beachfront.css:3941-3943` → `margin-right:.5rem` = **20 / 16 / 12**;
≤479 `.circle-time-holder.mr-2` `beachfront.css:9328-9330` → `padding-top:.5rem` = **12**.
Do **not** add `flex-direction:column; align-items:center` — that is the `.p-2`
variant used elsewhere.

**`.step-circle`** `beachfront.css:6712-6719`: `background: var(--primary);
border-radius:50%; justify-content:center; align-items:center;
width:2rem; height:2rem; display:flex`.
≤991 `:8252-8255` → `4rem`; ≤767 `:8797-8800` → `3rem`; ≤479 `:9332-9335` → `2rem`.
Resolved **80 / 128 / 48**. (At 768 it is `3rem`×24 = 72; at 767 also 72.)

**`.circle-time-number`** `beachfront.css:6722-6727`: `color:#fff;
text-align:center; font-size:45px; line-height:1em`.
≤767 `beachfront.css:8802-8804` → `font-size: 30px`.
Resolved **45 / 45 / 30** — the only break is at **767**, so the whole 768–991
band renders 45px. Content `00`.

**`h6.text-align-center.font-weight-bold.slab.font-size-24.text-breaking-no-wrap`**
("15 min"):
`.text-align-center.font-weight-bold` `beachfront.css:4483-4485` → `font-weight:500`;
`.text-align-center.font-weight-bold.slab.font-size-24` `:4487-4489` → `font-size:24px`;
≤767 `.text-align-center.font-weight-bold.slab.font-size-24.text-breaking-no-wrap`
`beachfront.css:8417-8419` → `font-size:12px`;
`.text-breaking-no-wrap` `:4569-4571` is `white-space:nowrap` **but does NOT
apply to this h6** — live computes `white-space: normal` on it `[probed 390,
2026-08-05]`, which is why the label wraps to two 15px lines inside the 48px
circle column (measured h 30). Do not add `nowrap` here;
`.slab` `:6328-6330` → museo-slab; `.font-size-24` has **no rule of its own**.
`h6` base `:2154-2164` gives ls 1.28px, uppercase, `var(--primary-dark)`,
margin `10px 0`, line-height 30px; `h6` ≤991 `:7872-7875` sets 12/15 — the
**font-size loses on specificity, the line-height wins**:

| | 1440 | 834 | 390 |
|---|---|---|---|
| size / line-height | **24 / 30** | **24 / 15** | **12 / 15** |
| weight | 500 | 500 | 500 |

Measured heights 30 / 15 / 30 `[probed]` (the 390 box is 30 because the
uppercase text wraps to two 15px lines inside the 48px circle column).

**`.exam-content-holder`** — no base rule; ≤767 `beachfront.css:8806-8811`
(`flex-direction:column; justify-content:flex-start; align-items:flex-start;
display:flex`), ≤479 `:9337-9341` (`flex-direction:column;
justify-content:flex-start; display:flex`). **Block at 1440 and 834; flex column
at 390.**

Content: `h5` "Registration Forms" (30/40 at all three widths), `p.text-body`
(20/30 · 16/24 · 16/24), then two buttons —
`a.button.text-color-primary-dark.mt-2` "Download Forms" and
`a.button.text-color-primary.mt-2.show-form` "Book Appointment".
`.mt-2` `beachfront.css:3901-3903` → `margin-top:.5rem` = **20 / 16 / 12**;
`.button.text-color-primary.mt-2.show-form` `:6069-6071` → `margin-bottom:20px`;
≤767 `.button.text-color-primary-dark.mt-2` `beachfront.css:8640-8643` →
`margin-bottom:0; display:inline-block` (measured `display:block` at 390 — the
`.text-color-primary-dark` ≤767 `margin-bottom:60px` at `:8636-8638` is
overridden to 0 by the later `.mt-2` combo) `[probed]`.

---

### §13 — Exam steps 01–06

**`.first-exam-step-container`** `beachfront.css:6729-6731` (`width:12rem`);
≤991 `:8257-8259` (`width:20rem`); ≤767 `:8813-8816` (`width:100%; max-width:20rem`).
Resolved **480 / 640 / 351 (max 480)**.

**`.exam-step`** `beachfront.css:6733-6736`: `padding: 1rem 0 0; display:flex`.
≤991 `beachfront.css:8261-8263`: `height: 10rem`.
≤767 `beachfront.css:8818-8826`: `width:100%; height:auto; margin-left/right:auto;
padding-bottom:1rem; padding-left:1rem; padding-right:1rem`.
≤479 `beachfront.css:9343-9347`: `padding-top:0; padding-left:.5rem; padding-right:.5rem`.

| | 1440 | 834 | 390 |
|---|---|---|---|
| padding | `40 0 0` | `32 0 0` | `0 12 24 12` |
| height | auto (**230** measured) | **`10rem` = 320** | auto (**180** measured) |

**A fixed `10rem` height exists only in the 480–991 band.** Six steps × 320 =
1920px at 834 vs 1590px at 1440 for the same content.

Each step repeats the §12 internals (`.circle-time-holder.mr-2` >
`.step-circle` > `.circle-time-number`, then `.exam-content-holder` >
`h5` + `p.text-body`), with the same three-tier ladders.
Step 1's `h5` additionally carries `.heading-19` `beachfront.css:7724-7726`
(`font-weight:300` — a no-op, `h5` is already 300) and ≤479 `:9547-9549`
(`margin-top: 0`).

Step content (number / time / title):
`01` 10 min Check-in · `02` 15 min X-rays and Imaging · `03` 20 min Exam ·
`04` 30 min Cleaning · `05` 15 min Dental Plan · `06` 05 min Check out.
(The reg box in §12 is `00` / 15 min / Registration Forms.)

---

### §14 — Review heading

`h1.text-align-center.mb-8` — **the second big type trap.**

`.mb-8` `beachfront.css:3998-4000` → `margin-bottom: 2rem`.
≤991 `.mb-8` `beachfront.css:7972-7974` → **`font-size: 1rem`** — a *margin*
utility that carries a font-size, at (0,1,0), beating `h1` (0,0,1) inside the
same media block:

| | 1440 | 834 | 390 |
|---|---|---|---|
| size | **60** (`beachfront.css:2109`) | **32** (`1rem` @root 32) | **24** (`1rem` @root 24) |
| line-height | **72** (`:2111`) | **38** (`h1` ≤991 `:7855`) | **38** (`h1` ≤767 `:8375`) |
| margin-bottom | `2rem` = **80** | **64** | **48** |
| family / weight / colour | museo-slab / 300 / `var(--primary)` | ” | ” |

**Three genuinely different sizes — 60 / 32 / 24 — none of them the 28px that a
plain `h1` would give.** Measured 72 / 38 / 76 (two lines at 390) `[probed]`.
Text: `Serving the South Bay for over 40 years` (no `<br>`).

---

### §15 — Review slider (5 CMS reviews, custom JS)

```
div.review-slider-holder
  div.position-relative._w-half            (height 0 — decoration anchor)
    img.big-review-arrow-right    data-w-id=5424ce3d-…1718
    img.big-review-arrow-left     data-w-id=5424ce3d-…1719
    img.what-they-say-big-review.filter-to-primary-dark   data-w-id=0a9b7ec5-…fb6
    img.what-they-say-arrow-big-review.filter-to-primary  data-w-id=0a9b7ec5-…fb7
  div.review-slider-holder-viewport.w-dyn-list
    div.big-review-slider.w-dyn-items
      div.big-review-item.w-dyn-item × 5
        div.big-review.p-3  data-w-id=5424ce3d-…171e
          p.text-body
          div.reviewer-container > img.reviewer-photo + div.reviewer-details-container
              > div.reviewer-name + div.reviewer-place
          a.social-logo-big-review > 3 × img (2 always .w-condition-invisible)
```

**`.review-slider-holder`** has **no base rule**.
≤991 `beachfront.css:8338-8340` → `margin-top: 4rem`;
≤767 `beachfront.css:8940-8942` → `margin-top: 0`;
≤479 `beachfront.css:9508-9510` → `padding-bottom: .5rem`.
Resolved margin-top **0 / 128 / 0** — *only the middle tier is non-zero*.
A two-tier ladder keyed at 768 produces 0 at 834 and loses 128px.

**`.position-relative._w-half`** — `beachfront.css:4291-4293` + `:2867-2871`
→ 50%, height 0. The ≤479 combo `.position-relative._w-half.su-w-full-portrait`
`beachfront.css:9038-9040` does **not** match (no `.su-w-full-portrait` here),
so it stays 50% = **640 / 369 / 175.5**. All four decorations position against it.

**`.review-slider-holder-viewport`** `beachfront.css:7586-7592`:
`width:15rem; height:12rem; margin-left/right:auto; overflow:hidden`.
≤479 `:9512-9515`: `width:96%; height:auto`.
Resolved **600×480 / 480×384 / 336.95×310** (the 390 height is content-driven).

**`.big-review-slider`** `beachfront.css:7563-7573`: `justify-content:flex-start;
align-items:flex-start; width:2000%; height:12rem; margin-left:0;
transition: transform 2s cubic-bezier(.19, 1, .22, 1); display:flex;
position:relative; overflow:hidden`.
≤479 `:9499-9502`: `height:auto; margin-left:0`.
Measured widths 12000 / 9600 / 6739 `[probed]` (2000% of the viewport).

**`.big-review-item`** `beachfront.css:7575-7578`: `white-space:normal;
width:15rem; margin-right:5rem` → stride `20rem` = **800 / 640 / 480**.
≤479 `:9504-9506`: `width:10rem` — **overridden by JS at <480** (below).

**`.big-review.p-3`** `beachfront.css:6738-6745` + `:6747-6752`:
`background: var(--primary-light); border-radius:25px; width:15rem;
height:10rem; margin-left/right:auto; flex-direction:column;
justify-content:space-between; display:flex; position:relative`;
`.p-3` `:4050-4052` → `padding:.75rem` = **30 / 24 / 18**.
≤479 `:9349-9353`: `width:100%; height:auto; margin-bottom:2rem`.
Measured **600×400 / 480×320 / 336.9×262**.

**JS: `big-review.js`** (`your-first-visit.html` pretty line 1354):

```
inc = 20                                  // rem
if (innerWidth < 480) {
   mobileSlidesWidth = $(".review-slider-holder-viewport").width()/24;   // "1 rem is 24px"
   $(".big-review-item").css("width", mobileSlidesWidth + "rem");
   inc = 5 + mobileSlidesWidth;
}
next: i++;  if (i % length == 0) { clone all items, appendTo, cloneCount++,
             .big-review-slider width = inc*length*cloneCount + "rem" }
      .big-review-slider transform = translateX(-inc*i + "rem")
prev: i--;  if (i % length == -1) { clone, prependTo, width as above,
             margin-left = -(prepNum*length*inc) + "rem" }
// "webflow specific bugs" — always runs, unconditionally:
$(".big-review").css("opacity", "1");
$(".big-review").css("transform", "translate3d(0, 0, 0)");
```

`length = 5`. Stride `20rem` → **800 / 640 / 456.9px** (at 390 `inc` is
`5 + 14.04 = 19.04rem`). Verified `[probed]`: one click right →
`translateX(-20rem)` and the card width at 390 is **336.94px**, i.e. the
JS `14.04rem`, **not** the CSS `10rem` = 240px.

The last two lines are why `.big-review` never plays the `a-7` reveal —
its pre-scroll inline style is already `transform: translate3d(0,0,0); opacity:1`
`[probed]`. **The five review cards do not animate in.** Every other
`data-w-id` on this page does.

**Decoration positions.** `.big-review-arrow-right` `beachfront.css:7594-7599`
(`cursor:pointer; width:.75rem; position:absolute; top:3.95rem; right:-9rem`),
`.filter-to-primary` variant `:7606-7608` (`right:.25rem`), hover `:7602-7604`
(`opacity:.6`) and `:7610-7612` (`transform: scale(1.01)`);
≤991 `:8342-8344` (`right:3rem`); ≤767 `:8944-8946` (`right:4%`);
≤479 `:9517-9520` (`z-index:10; right:-.75rem`).
`.big-review-arrow-left` mirror: `beachfront.css:7614-7619`, `:7626-7628`
(`left:.25rem`), `:7622-7624`, `:7630-7632`; ≤991 `:8346-8348` (`left:3rem`);
≤767 `:8948-8950` (`left:4%`); ≤479 `:9522-9526` (`z-index:10; left:-.75rem;
right:5.5rem`).
Measured `[probed]`: right arrow 30×33 @{top 158, left 970} · 24×26.4
@{top 126.4, left 633} · 18×19.8 @{top 94.8, left 175.5}.
**`.filter-to-primary` is undefined ⇒ computed `filter: none`** on both arrows.

`.what-they-say-big-review` `beachfront.css:6789-6794` (`width:6rem; absolute;
left:auto; right:8rem`), `.filter-to-primary-dark` variant `:6796-6800`
(`right:8.5rem; transform: rotate(5deg)`);
≤767 `:8832-8837` (`display:block; top:-2rem; right:-5rem`) **and**
`:8839-8841` `.what-they-say-big-review.filter-to-primary-dark { display:none }`;
≤479 `:9364-9367`.
**Two facts a rect will not tell you:**
1. the `rotate(5deg)` at `:6799` **never renders** — IX2 writes a full
   `transform: translate3d(…) scale3d(…) rotateZ(0deg) …` inline style on this
   element, which replaces it. Computed transform is a pure translate `[probed]`.
2. at 390 the image is `display:none` — hidden, not merely off-screen.

`.what-they-say-arrow-big-review` `beachfront.css:6807-6813` (`width:3rem;
absolute; top:1.5rem; right:8.5rem`), `.filter-to-primary` `:6815-6817`
(`right:8rem`); ≤767 `:8843-8846` → **`display: none`**.
Measured 120×51.4 @1440 · 96×41.1 @834 · hidden @390.

Assets:
`…/64d2ad7c6265cb003bf1b590_what_they_say_bw_w_trans.png` (with srcset 500/800w),
`…/64b85dd07cefe69a2f9f1825_what-they-say-arrow.svg`,
`…/6508d7f2898b1f24f98c7668_right-arrow.svg`, `…/6508d8102d754d9bb2bd3f70_left-arrow.svg`.

**Card internals.**
`p.text-body` — 20/30 · 16/24 · 16/24, colour `var(--primary-dark)`
(`beachfront.css:2167`), truncated mid-sentence in the CMS data (keep the
truncation and the trailing `…` / ellipsis exactly as authored).
`.reviewer-container` `beachfront.css:6754-6757` (`justify-content:flex-start; display:flex`).
`.reviewer-photo` `beachfront.css:6759-6763` (`border-radius:50%; width:3rem;
height:3rem; margin-right:.5rem`); ≤991 `:8265-8267` (`height:3rem`, no-op).
→ **120 / 96 / 72** square, margin-right **20 / 16 / 12**.
`.reviewer-details-container` `beachfront.css:6766-6771`.
`.reviewer-name` `beachfront.css:6773-6778` (`var(--primary-dark)`, 30px, 500, 40px);
≤991 `:8269-8272` (**`font-size:20px; line-height:3`** — a unitless 3, i.e. 60px);
≤767 `:8828-8830` (`line-height:1.5em`); ≤479 `:9355-9358` (16px / 24px).
→ **30/40 · 20/60 · 16/24** `[probed heights 40 / 60 / 24]`.
`.reviewer-place` `beachfront.css:6780-6786` (`var(--primary-dark)`;
`text-transform:uppercase; margin-top:.2rem; font-size:.4rem; font-weight:300;
line-height:1.2em`) → **16/19.2 · 12.8/15.36 · 9.6/11.52**, margin-top
**8 / 6.4 / 4.8**.
**The two `.reviewer-place.h7` overrides (`beachfront.css:8828-8830` and
`:9360-9362`, the latter forcing 10px at ≤479) do NOT apply** — the markup is
`<div class="reviewer-place">` with no `.h7`. Measured 9.6px at 390 confirms it.
`.social-logo-big-review` `beachfront.css:6819-6828` (`cursor:pointer;
background:#0000; width:2rem; height:2rem; transition:opacity .2s;
position:absolute; bottom:-.5rem; right:.75rem`), hover `:6830-6832`
(`opacity:.6`); ≤479 `:9369-9372` (`bottom:-.5rem; right:1rem`).
→ **80 / 64 / 48** square. Each holds three `<img>`; the two that do not apply
carry `.w-condition-invisible` `beachfront.css:2039-2041` → `display:none !important`.
Logos: `…/64b85e991827e8bce95c4536_Yelp_logo.png`,
`…/64c97c6baf968f274ee2edb4_Google_%20G%20_Logo.svg`,
`…/64c97b32e9cac72606fcb185_Facebook_f_logo_(2021).svg`.

Review roster (order, source, link):

| # | name | place | logo shown | href |
|---|---|---|---|---|
| 1 | Paul K. | Redondo Beach, CA | Yelp | `yelp.com/biz/beachfront-dentistry-redondo-beach?hrid=BFXba7Bhp7KMgaFkJdBc7w…` |
| 2 | Tonya S. | Hermosa Beach, CA | Yelp | `…hrid=pDz_x-aGJx-qe__EadRGNw…` |
| 3 | Melissa R. | *(empty — `.w-dyn-bind-empty`, `display:none !important`)* | Yelp | `…hrid=BXZVdhsXqpvW_ylTj1Kfiw…` |
| 4 | Jay. N | Redondo Beach | Google | `https://maps.app.goo.gl/u3xjEEDSV9KmAnMq9` |
| 5 | Leigh L. | Redondo Beach | Google | `https://maps.app.goo.gl/mqZFMifn4U4MF92C8` |

Reviewer photos under `https://cdn.prod.website-files.com/64b1c843b071dc32170ea053/`:
`6578f51f8205f87eec5805b9_paul_redondo.jpeg`,
`6578ee0332b2331474f2c1a4_Tonya_hermosa.jpeg`,
`6578f179124927f182f100ea_Melissa_Inglewood.jpeg`,
`657a215b6d045ccd271de4b1_Jay_Newman_google.png`,
`657a2280b90d9c4670a3fca0_Leigh%20Lowery%20google.png`.

---

### §16–17 — Closing CTA, Fiji band, footer

**Chrome. See `_chrome.md §4` (CTA), `§4.5` (Fiji label), `§4.6` (wave divider),
`§5` (footer), `§5.7` (map).** Verified byte-identical on this page
(`_chrome.md §0`). Page-specific facts only:

- The footer wave divider CSS `.custom-shape-divider-bottom-1689290473` is
  re-declared in this page's own head: `your-first-visit.html:47-55`
  (`position:absolute; left:0; width:100%; overflow:hidden; line-height:0;
  **transform: rotate(180deg)**; margin-top:-4rem`) and `:57-66`
  (svg `width: calc(169% + 1.3px); height: 4rem`), fill `#e7f5fa`.
  `-4rem` = **-160 / -128 / -96**; `4rem` height = **160 / 128 / 96**.
- Measured y `[probed]`: `.cta-section` 6269 / 7729.6 / 5180.9 ·
  CTA `h2` 6269 / 7729.6 / 5180.9 (h **504 / 240 / 180**) ·
  button row 6853 / 8033.6 / 5408.9 · reviews row 6949 / 8111.6 / 5505.3 ·
  `.fiji-section` 6813 / 8001.6 / 5384.9 (h **800 / 640 / 273**) ·
  `.cta-beach-label` 7336.5 / 8420.2 / 5572.1 ·
  `.footer-info-section` 7469 / 8558.2 / 5618.9 ·
  `.footer-learn-more` 7489 / 8574.2 / 5630.9 ·
  `.footer-map` 7569 / 8966.2 / 6215.1 (400 tall at every width) ·
  `.footer-boiler-holder` 8089 / 9462.2 / 6687.1.
- Page's own head also declares `.click-through {pointer-events:none}`
  (`your-first-visit.html:89-91`), `.expanding-minus` (`:92-94`),
  `.expanding-box` (`:96-98`, ≤991 `:100-104`, ≤480 `:106-110`) and
  `.ellipsis-three-lines` (`:113-119`). **None of these classes appear in this
  page's markup** — they are the shared site embed. Do not chase them.

---

## C. INTERACTION INVENTORY

Shared-chrome controls are **excluded** and specced in `_chrome.md`
(3 × `.header-hamburger`, 7 × `.modal-link`, 2 nav buttons, the `.form-modal`
close + 4 fields + submit, CTA "Book Appointment", the "Read Reviews"
`.social-link-block` toggle, `.services-links` accordion, footer links,
footer "Make a Payment", Google-Map controls). Counted below are only the
controls that belong to §2–15.

| # | element | section | behaviour | source |
|---|---|---|---|---|
| 1 | `a.visit-list-item[href="#tour"]` | §4 | in-page anchor; Webflow JS smooth-scroll (`scroll-behavior` is `auto` — `[probed]` eased 0→1157px over ~1.12s); hover `opacity:.67` | `beachfront.css:6607-6622` |
| 2 | `a.visit-list-item[href="#meet"]` | §4 | ” | ” |
| 3 | `a.visit-list-item[href="#exam"]` | §4 | ” | ” |
| 4 | `a.button.…mr-4.show-form` "Book an Apointment" | §5 | jQuery `showForm` → `$(".form-modal").css("opacity","1")` + IX2 `a-5` `TRANSFORM_MOVE` `.form-modal` y=150vh / 500ms | `your-first-visit.html` pretty 1327-1336; `_chrome.md §3.6` |
| 5 | `a.button.text-color-primary` "Registration Form" | §5 | **`href="#"` with no handler — dead link.** It carries `data-w-id=44c9c628-…` but that GUID has only a `SCROLL_INTO_VIEW`→`a-7` reveal, no click | `[probed IX2 store]` |
| 6 | `.w-slider-arrow-left` (+`.w-icon-slider-left`) | §7 | Webflow slider prev; `data-duration="500"`, `data-easing="ease"`, `data-animation="slide"`, `data-infinite="true"` | markup; `beachfront.css:1285-1311` |
| 7 | `.w-slider-arrow-right` (+`.w-icon-slider-right`) | §7 | Webflow slider next | `beachfront.css:1285-1316` |
| 8 | `.w-slider-mask` drag / swipe | §7 | `data-disable-swipe="false"` ⇒ pointer + touch drag advances the slide | markup |
| 9 | `img.team-slider-arrow.filter-to-primary.left` | §10 | `window.teamSlider.prev`; starts `opacity:0; pointer-events:none`; hover `opacity:.6` | `team-slider.js:53-69`; `beachfront.css:6675-6684` |
| 10 | `img.team-slider-arrow.filter-to-primary.right` | §10 | `window.teamSlider.next`; hides at `i == length-1` | `team-slider.js:37-66` |
| 11–21 | 11 × `a.inline-link` wrapping `img.team-grid-headshot` | §10 | → `/team-members/<slug>`; hover `opacity:.6` | `beachfront.css:7382-7393` |
| 22–32 | 11 × `a.inline-link` wrapping `h5` | §10 | → same slug; hover `opacity:.6` | ” |
| 33–43 | 11 × `a.flex-align-center._w-half.bg-color-transparent` ("read more" + arrow) | §10 | → same slug | `beachfront.css:2958-2960` |
| 44 | `a.button.…mt-2` "Download Forms" | §12 | **`href="#"`, no `.show-form`, no handler — dead link** | markup |
| 45 | `a.button.text-color-primary.mt-2.show-form` "Book Appointment" | §12 | jQuery `showForm` + IX2 `a-5` (trigger GUID `6e166e67-…`) | `[probed IX2 store]` |
| 46 | `img.big-review-arrow-right` | §15 | `window.slider.next`; hover `opacity:.6` **and** `transform: scale(1.01)` | `big-review.js:31-55`; `beachfront.css:7602-7612` |
| 47 | `img.big-review-arrow-left` | §15 | `window.slider.prev` (clones + prepends, sets negative `margin-left`) | `big-review.js:42-56`; `beachfront.css:7622-7632` |
| 48–52 | 5 × `a.social-logo-big-review` | §15 | external Yelp / Google Maps links; hover `opacity:.6` | `beachfront.css:6819-6832` |

**Documented non-controls** (present but never operable — deliberately *not*
counted, so the number stays reproducible):
- 8 × `.w-slider-dot` inside `.display-none.w-slider-nav.w-round` —
  `beachfront.css:2214-2216` removes the strip from layout.
- 22 × `img.w-condition-invisible` (2 unused logos per review card ×
  5 + the empty `.reviewer-place` on review 3) — `beachfront.css:2039-2041`.
- Every `h6.visit-list-number`, `h3.px-2.my-0`, `img.download-icons`,
  `img.team-grid-headshot`, `h5.text-align-center`,
  `div.team-teasewr-read-more`, `img.read-more-arrow` that reports
  `cursor:pointer` — they inherit it from a clickable ancestor already counted.
  (174 elements report `cursor:pointer` at 1440 `[probed]`; that number is not
  the interaction count.)
- Slider autoplay: `data-autoplay="false"`, `data-autoplay-limit="0"` —
  the tour slider never advances on its own.
- Orientation guard: the page's inline script `alert("Please use Portrait!")`
  when `innerWidth < 792 && innerHeight < innerWidth`
  (`your-first-visit.html` pretty 1339-1347). It fires on load and on
  `window:resize`. Not a user control; **it will block a headless probe if
  dialogs are not dismissed.**

**INTERACTION COUNT: 52**

---

## D. ANIMATION CENSUS

**One mechanism only: Webflow IX2 `SCROLL_INTO_VIEW`, action list `a-7`,
`useFirstGroupAsInitialState`.** Read from
`Webflow.require("ix2").store.getState().ixData` `[probed-only]`:

| group | actions | duration | easing |
|---|---|---|---|
| g0 (initial state, applied at load) | `TRANSFORM_MOVE yValue: 4` (unit rem) + `STYLE_OPACITY 0` | 500 | *(unset → linear)* |
| g1 (reveal) | `TRANSFORM_MOVE yValue: 0` + `STYLE_OPACITY 1` | **2000** | **`outExpo`** |

Travel = `4rem` → **160 / 128 / 96px** upward. No stagger/delay (`delay: 0` on
every item). Not an IntersectionObserver in our code — IX2 uses its own
scroll-position engine, but a single-threshold IO with
`rootMargin` tuned to `scrollOffsetValue` reproduces it.

**Trigger offsets** (`scrollOffsetValue` / `scrollOffsetUnit`):

| `data-w-id` | element | offset |
|---|---|---|
| `71103da4-…` | `a.visit-list-item` #tour | 0 % |
| `c0003259-…` | `a.visit-list-item` #meet | 0 % |
| `7a2ee67f-…` | `a.visit-list-item` #exam | 0 % |
| `0950c185-…` | TOC "Book an Apointment" | 0 % |
| `44c9c628-…` | TOC "Registration Form" | 0 % |
| `c9a05a4b-…` | `#tour h1` "Office Tour" | 0 % |
| `3d588b2b-…` | `.w-layout-hflex.mt-6` (hours + contact, reveals **as one block**) | 0 % |
| `b21ffecc-…` | `h2` "Meet Our Team" | 0 % |
| `37e52dc5-…` | `.slider-arrows-anchor` (both team arrows travel with it) | 0 % |
| `0f5db9c9-…` | `.team-slider` (**all 11 cards reveal as one element**) | 0 % |
| `b018c59b-…` | `#exam` intro row (h3 + p + photo, **one block**) | 0 % |
| `413fec92-…` | `.exam-step` 01 | 0 % |
| `22d841d1-…` | `.exam-step` 02 | **20 %** |
| `eb295353-…` | `.exam-step` 03 | **20 %** |
| `5de05615-…` | `.exam-step` 04 | **20 %** |
| `fcacb919-…` | `.exam-step` 05 | **20 %** |
| `2b7ee8a8-…` | `.exam-step` 06 | **20 %** |
| `5424ce3d-…1714` | `h1` "Serving the South Bay…" | 0 % |
| `5424ce3d-…1718` | `.big-review-arrow-right` | 0 % |
| `5424ce3d-…1719` | `.big-review-arrow-left` | 0 % |
| `0a9b7ec5-…fb6` | `.what-they-say-big-review` | 0 % |
| `0a9b7ec5-…fb7` | `.what-they-say-arrow-big-review` | 0 % |
| `5424ce3d-…171e` | `.big-review` × 5 — **registered but permanently defeated**, see below | 0 % |

**Steps 02–06 fire 20% later than step 01.** Step 01 shares the reg box's row
top, so the six steps do *not* reveal on one line.

**`.big-review` never animates.** `big-review.js:59-60` runs unconditionally at
load and writes `opacity:1` + `transform: translate3d(0,0,0)` as inline styles,
so g0 has already been undone before the first scroll. Pre-scroll inline style
`[probed]`: `transform: translate3d(0px, 0px, 0px); opacity: 1` — i.e. the
resting state. Do not build a reveal on the review cards.

**Settled inline style** (what a settled screenshot must reproduce):
`transform: translate3d(0px, 0rem, 0px) scale3d(1,1,1) rotateX(0deg) rotateY(0deg) rotateZ(0deg) skew(0deg,0deg); opacity: 1; transform-style: preserve-3d`.
Pre-settle: same with `4rem` and `opacity: 0`.
**Consequence, same as `_chrome.md §4.7`:** the inline `opacity: 1` outranks
`.visit-list-item:hover{opacity:.67}` and `.button:hover{opacity:.6}` on every
element in the table above. On this page that means the two TOC buttons and the
three visit-list rows change **background-colour only** on hover, while the team
card links (no `data-w-id`, no inline style) genuinely dim to `.6`. Do not
"fix" the asymmetry.

**Click-driven, non-reveal animations:**

| trigger | action list | effect | duration / easing |
|---|---|---|---|
| `.show-form` (#4, #45) | `a-5` | `TRANSFORM_MOVE` `.form-modal` **y = 150 vh** | 500ms, linear |
| modal close (chrome) | `a-6` | `.form-modal` y = **−150 vh** | 500ms, linear |
| team arrows (#9, #10) | *(none — jQuery)* | `.team-slider` `transform: translateX(-inc·i)` | **CSS** `transition: transform 2s cubic-bezier(.19,1,.22,1)` `beachfront.css:6648` |
| review arrows (#46, #47) | *(none — jQuery)* | `.big-review-slider` `translateX(-inc·i rem)` | **CSS** `transition: transform 2s cubic-bezier(.19,1,.22,1)` `beachfront.css:7569` |
| tour slider arrows (#6, #7) | *(Webflow slider)* | slide | `data-duration="500"`, `data-easing="ease"` |
| in-page anchors (#1–3) | *(webflow.js links module)* | eased window scroll | ~1.12s `[probed-only]`; `scroll-behavior` is `auto` |

**Ordering hazard `[probed-only]`:** IX2 and the slider JS both write the
`transform` **inline style** of `.team-slider`. Clicking an arrow before the
2000ms reveal finishes lets IX2 win and the slide is silently lost. A settled
read is required before any team-slider interaction assertion.

Transitions declared but not driven by IX2:
`.visit-list-item` `transition: opacity .2s` `beachfront.css:6616`;
`.team-slider-arrow.filter-to-primary` `.2s` `:6672`;
`.team-grid-headshot` `.2s` `:6560`; `.inline-link` `.2s` `:7387`;
`.social-logo-big-review` `.2s` `:6824`;
`.button` `opacity .2s, background-color .2s cubic-bezier(.215,.61,.355,1)` `:6039`.

---

## E. KNOWN-SUSPECT LIST

Ranked. Everything here is a place where the ladder has a **third tier** or a
non-obvious cascade winner, i.e. exactly what our build has been getting wrong.

1. **`h2` "Meet Our Team" — 120 / 120 / 56, keyed at 479.**
   `.text-align-center.mb-4` `beachfront.css:4491-4495` (120px/140px) beats both
   `h2` `:2114-2122` (140) and `h2` ≤991 `:7858-7861` (72) on specificity; the
   only override is `beachfront.css:9050-9053` at ≤479. **Any md/lg breakpoint
   we key at 768 or 991 on this heading is wrong at 834.** Measured 120px at
   both 1440 and 834; the 834 box is 280 tall because 120px wraps to two lines
   in a 738px column. If our 834 render is one line, the size is wrong.

2. **`h1.mb-8` "Serving the South Bay…" — 60 / 32 / 24.**
   `.mb-8` `beachfront.css:7972-7974` sets `font-size: 1rem` inside the ≤991
   block; at (0,1,0) it beats `h1` `:7853` (28px) at (0,0,1). So the size is
   `1rem` — i.e. it tracks the *root font ladder*, giving 32 at 834 and 24 at
   390, with line-height 38 from the `h1` rule. Three values, none of them 28.

3. **`.circle-time-number` — 45 / 45 / 30, keyed at 767.**
   `beachfront.css:6722-6727` (45px) with the only override at
   `:8802-8804` (≤767). The whole 768–991 band is 45px. A ladder keyed at 768
   renders 30px at 834 — a 33% error inside the largest gate region on the page.

4. **`.review-slider-holder` margin-top — 0 / 128 / 0.**
   ≤991 `beachfront.css:8338-8340` (`4rem`) then ≤767 `:8940-8942` (`0`).
   Only the *middle* tier is non-zero. A two-tier ladder cannot express this and
   will lose 128px at 834, shifting §15 and everything below it.

5. **`.team-teasewr-read-more` — 16 / 19.2 / 14.4, and the 834 value is
   LARGER than desktop.**
   `.team-teasewr-read-more` `beachfront.css:7436` sets 16px; `.display-flex`
   ≤991 `beachfront.css:7890-7892` sets `font-size: .6rem` at the same (0,1,0)
   but later in source, so it wins. `.6rem` = 19.2 at 834. Any implementation
   that assumes text only shrinks going down the ladder is wrong here.

6. **`.exam-step` gets a fixed `height: 10rem` only in 480–991.**
   `beachfront.css:8261-8263`. Six steps × 320px at 834 vs auto (230px) at 1440
   and auto (180px) at 390. Getting this wrong is a ~800px cumulative error at
   834 inside the `To be a long term health partner` region.

7. **`h6` font-size vs line-height split on `.visit-list-number` and the
   "15 min" labels.** `h6` ≤991 `beachfront.css:7872-7875` sets *both*
   `font-size:12px` and `line-height:15px`, but the more specific class rules
   (`beachfront.css:6628-6632`, `:4487-4489`) override **only the font-size**.
   Result at 834: **24px text on a 15px line**. Implementing these as a single
   `font: 24px/30px` token produces a 15px height error per row.

8. **`.registration-forms-box` is `position: sticky; top: 1rem` at ≥992 only**
   (`beachfront.css:6702-6703`, defeated by `position:static` at
   `:8249`). A non-sticky build matches at the top of the region and diverges by
   up to ~1100px as the steps scroll past.

9. **`.h-half-screen-width` loses to `.su-h-screen-to-tablet`.**
   Both are (0,1,0); `beachfront.css:5656` is after `:3173`, so the tour slider
   box is `100vh`, not `50vw`, at ≥768. It is therefore **viewport-height
   dependent** — 900px at 1440×900, 1112px at 834×1112. Hard-coding `50vw`
   (720px at 1440) is a 180px error and cascades into every y below it.

10. **`.filter-to-primary` does not exist.** Zero rules in `beachfront.css` and
    none in `your-first-visit.html`'s embeds; computed `filter: none` `[probed]`.
    Only `.filter-to-primary-dark` is real, and it lives in the page's own
    `<style>` at `your-first-visit.html:85-87`, not in the stylesheet. Adding a
    recolour to the team-slider arrows or the what-they-say arrow will make them
    the wrong colour.

11. **`.what-they-say-big-review`'s `rotate(5deg)` never renders**
    (`beachfront.css:6799`) — IX2's inline `transform` replaces it. And at ≤767
    the element is `display:none` (`beachfront.css:8839-8841`), as is
    `.what-they-say-arrow-big-review` (`:8843-8845`). Three separate reasons the
    390 render must show neither.

12. **`.reviewer-place` has no `.h7` class**, so
    `beachfront.css:8828-8830` and `:9360-9362` do not apply. Font-size is
    `.4rem` at every tier → **16 / 12.8 / 9.6**, not 10px at 390.

13. **Three independent breakpoint sets are in play.** Webflow 991/767/479;
    the root font 992/768/480; and `team-slider.js` at **992/768**
    (`team-slider.js:19,25`). At exactly 991 the CSS is tablet but `inc` is
    still `portSize/3`; at 992 the root is 32px but every Webflow rule is
    desktop. Do not collapse these into one set.

14. **`.su-px-0-tablet`, `.su-w-60pc-tablet`, `.max-w-490px`, `.font-size-24`,
    `.team-teaser`, `.read-more-arrow`, `.filter-to-primary`, `.visit-list`,
    `.fv-toc-section`, `.fv-review-section` have no standalone rules.** They
    exist only as fragments of combo selectors (or not at all). Implementing
    them as real utilities over-applies; implementing the combos as separate
    classes under-applies.

15. **The `.bot-wave` SVG is duplicated at runtime** by the inline
    `$(".bot-wave").append(…)` (`your-first-visit.html` pretty 1321-1324), and
    the `rotate(180deg)` is on the **parent** `.bot-wave`
    (`your-first-visit.html:28-30`), not on the `<svg>`. Rotating the SVG
    instead flips the fill in the wrong direction.

16. **`.big-review-item` width at 390 is JS-set to `14.04rem` (336.94px),
    overriding the CSS `10rem` (240px)** (`big-review.js:15-19`). And the JS
    comment "mobile 1 rem is 24px" hard-codes the root value — a build that
    changes the mobile root font silently breaks the stride.

17. Two dead `href="#"` buttons ("Registration Form" §5, "Download Forms" §12)
    have **no** click handler. If our build wires them to anything — a download,
    a modal — Phase 5's interaction count and behaviour will not match.

---

### Citation index

All `beachfront.css` line references used above:
82, 171-176, 190-196, 232-236, 714-722, 729-736, 755-757, 872-875, 877-881,
945-947, 1190-1198, 1200-1209, 1211-1219, 1221-1235, 1261-1274, 1285-1316,
1318-1323, 1325-1332, 2039-2041, 2047-2053, 2056-2060, 2078-2082, 2096-2102,
2104-2112, 2114-2122, 2124-2132, 2144-2152, 2154-2164, 2166-2172, 2174-2179,
2206-2212, 2214-2216, 2867-2871, 2885-2887, 2913-2915, 2953-2960, 2962-2965,
3008-3011, 3023-3026, 3149-3155, 3173-3175, 3526-3528, 3540-3542, 3762-3777,
3804-3807, 3834-3837, 3901-3903, 3917-3923, 3941-3943, 3949-3951, 3961-3963,
3973-3975, 3985-3988, 3994-3996, 3998-4000, 4050-4052, 4120-4123, 4130-4133,
4291-4293, 4347-4349, 4460-4462, 4483-4495, 4569-4571, 4585-4587, 5291-5293,
5295-5300, 5322-5328, 5623-5625, 5656-5658, 5858-5867, 6008-6022, 6028-6080,
6122-6124, 6324-6326, 6328-6330, 6337-6343, 6477-6482, 6484-6502, 6530-6545,
6551-6573, 6593-6605, 6607-6622, 6628-6632, 6634-6636, 6638-6645, 6647-6664,
6666-6691, 6693-6704, 6706-6710, 6712-6719, 6722-6727, 6729-6736, 6738-6752,
6754-6786, 6789-6832, 7370-7376, 7382-7393, 7429-7441, 7443-7460, 7466-7486,
7563-7578, 7586-7592, 7594-7632, 7724-7726, 7734-7740, 7751-7754, 7760-7777,
7806-7812, 7852-7892, 7956-7974, 7980-7994, 8004-8006, 8032-8034, 8045-8057,
8130-8132, 8183-8197, 8205-8216, 8219-8243, 8245-8272, 8338-8348, 8359-8380,
8386-8393, 8405-8428, 8434-8436, 8438-8459, 8530-8532, 8554-8556, 8627-8647,
8769-8830, 8832-8846, 8940-8950, 8981-8983, 9001-9008, 9011-9024, 9038-9070,
9072-9095, 9164-9193, 9240-9242, 9271-9326, 9328-9372, 9474-9477, 9499-9526,
9547-9558, 9573-9576, 9611.

All `your-first-visit.html` line references: 11-13, 16-18, 20-22, 24-26, 28-30,
32-37, 40-42, 47-55, 57-66, 70, 72-74, 76-78, 80-82, 85-87, 89-91, 92-94, 96-98,
100-104, 106-110, 113-119.

External JS specced verbatim:
`https://raw.githack.com/tucksravin/incidental-js/main/webflow/specific/beachfront/team-slider.js` (80 lines),
`https://raw.githack.com/tucksravin/incidental-js/main/webflow/specific/beachfront/big-review.js` (63 lines),
`matching/spec/incidental-utils.js` (`getContentWidthMargin()`).

---

## `[probed-only]` inventory

Values with NO stylesheet line. They were read off the rendered reference
and must be re-derived if anything upstream changes — never copied blindly
into a fix, and never cited as though they were a rule (repo CLAUDE.md
rule 1).

7. `yfv.md:7` — `[probed-only]` and are the only citation-free values here.
70. `yfv.md:70` — **Proof of the offset on this page** (`[probed-only]`, five widths):
122. `yfv.md:122` — Document height `[probed-only]`: 8183 / 9541 / 6743 (and 7933 @992, 8019 @768).
416. `yfv.md:416` — | outer div | **900** (100vh) | **1112** (100vh) | **319.8** (auto) `[probed-only]` |
422. `yfv.md:422` — `display:block`, with the inherited 76.8px line-height) — `[probed-only]`,
1147. `yfv.md:1147` — `Webflow.require("ix2").store.getState().ixData` `[probed-only]`:
1215. `yfv.md:1215` — | in-page anchors (#1–3) | *(webflow.js links module)* | eased window scroll | ~1.12s `[probed-only]`; `scroll-behavior` is `auto` |
1217. `yfv.md:1217` — **Ordering hazard `[probed-only]`:** IX2 and the slider JS both write the
