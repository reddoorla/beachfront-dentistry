## home — landing page (`/`)

Structural sample: `matching/spec/index.html` (200 lines, body markup is one
70 037-char line — **every markup citation below is `index.html:136`** except
the `<head>`/`w-embed` `<style>` blocks, which have real line numbers and are
cited precisely).

Live probe: `https://www.beachfrontdentistry.com/` at **1440 / 992 / 991 / 834 /
768 / 767 / 480 / 479 / 390** (nine widths, not three — the extra six exist to
pin the 1px offset described in `_chrome.md` §1). Scrolled in 250px steps at
80ms, held until `document.getAnimations()` reported nothing running, then read.
Raw output: `/private/tmp/claude-501/-Users-tuckerlemos-Documents-GitHub-beachfront-dentistry/6d044138-56ae-4e63-92d6-364d232bdf07/scratchpad/home-probe.json`
and `…/home-interact.json`.

**Shared chrome is NOT re-specified here.** Header/nav modal, form modal,
closing CTA band ("Ready for great dental health?"), footer, the button/pill
pattern, and the root-font ladder all live in
`matching/spec-sections/_chrome.md` §1–§9. This file references them.

**Governing rule (CLAUDE.md #1): source prescribes, rects only verify.** Every
geometry/type number below carries a `beachfront.css:<line>` or
`index.html:<line>`. Numbers with no stylesheet origin are tagged
`[probed-only]` and inventoried in §E.6; `[probed]` marks a value that _does_
have a cited source and was additionally measured live.

**Citation shorthand:** inside a table, a bare `` `:1234` `` always means
`beachfront.css:1234`. `index.html` is always written out in full.
553 line citations in this file (241 `beachfront.css:N` + 240 shorthand + 72 `index.html:N`); 55 probe tags.

---

### 0. Page-local `<style>` blocks — source you will not find in beachfront.css

Four declarations that only exist in the page's own embeds and that **govern
three of this page's size ladders**:

| rule                                                                                                                                                        | source                                             | note                                                        |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------- |
| `.bot-wave { transform: rotate(180deg) }`                                                                                                                   | `index.html:20-22`                                 | hero wave                                                   |
| `.bot-wave svg { position:relative; display:block; width:calc(133% + 1.3px); height:3rem }`                                                                 | `index.html:24-29`                                 | **3rem → 120 / 96 / 72px**                                  |
| `.bot-wave .shape-fill { fill:#FFFFFF }`                                                                                                                    | `index.html:32-34`                                 |                                                             |
| `.filter-to-primary-dark { filter: brightness(0%) saturate(100%) invert(29%) sepia(33%) saturate(599%) hue-rotate(155deg) brightness(100%) contrast(87%) }` | `index.html:77-79`                                 | recolours the ATD handwriting PNG                           |
| `.click-through { pointer-events: none }`                                                                                                                   | `index.html:81-83` (repeated `index.html:114-116`) |                                                             |
| `.expanding-minus { top: calc(50% - .0625rem) }`                                                                                                            | `index.html:84-86`                                 | .0625rem → 2.5 / 2 / 1.5px                                  |
| `.expanding-box { width: calc(33% - 25px) }`                                                                                                                | `index.html:88-90`                                 | **desktop width**                                           |
| `@media (max-width:991px){ .expanding-box{ width:16rem } }`                                                                                                 | `index.html:92-96`                                 | **16rem → 512px @834, 384px @768**                          |
| `@media (max-width:480px){ .expanding-box{ width:100% } }`                                                                                                  | `index.html:98-102`                                | breaks at **480, not 479**                                  |
| `.ellipsis-three-lines { overflow:hidden; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical }`                                         | `index.html:105-111`                               | declared, **unused on home**                                |
| `.heads-slider{scrollbar-width:none;overflow-y:hidden}` + `::-webkit-scrollbar{display:none}`                                                               | `index.html:118-125`                               |                                                             |
| `.heads-slider-holder{scrollbar-width:none;overflow-y:hidden}` + `::-webkit-scrollbar{display:none}`                                                        | `index.html:127-133`                               | hides the team rail's scrollbar                             |
| `.custom-shape-divider-bottom-1689290473` (3 rules)                                                                                                         | `index.html:39-58`                                 | **declared, no element on this page uses it** — do not port |

The root-font ladder itself is `index.html:2-18` (repeated `index.html:62-74`).
See `_chrome.md` §1 for the resolution table.

---

## A. SECTION CENSUS

Nine top-level `<section>` boxes + three zero-height `div.w-embed` style
carriers. `y@1440` = document-space top of the section border box.

| #   | label                             | anchor (unique, comma-free)        | y@1440      | h@1440 | y@834   | y@390   |
| --- | --------------------------------- | ---------------------------------- | ----------- | ------ | ------- | ------- |
| 0   | header / nav (chrome)             | _(logo only — no text)_            | 0           | 120    | 0       | 0       |
| 0b  | form modal (chrome)               | `Request Appointment`              | off-canvas  | 900    | —       | —       |
| 1   | **Hero — video + headline**       | `Have a relaxed dental experience` | **0**       | 810    | 0       | 0       |
| 2   | **Three value boxes**             | `Finally have a dentist`           | **850**     | 544    | 699.19  | 630     |
| 3   | **Team headshot rail**            | `MEET YOUR TEAM`                   | **1454**    | 270    | 2663.19 | 1630    |
| 4   | **Review slider + Read Reviews**  | `Serving the South Bay`            | **1804**    | 660.75 | 2934.19 | 1837    |
| 5   | **Path to oral health + 3 steps** | `Your Path to Oral Health`         | **2584.75** | 1081   | 3603.19 | 2359.5  |
| 6   | **Services gradient band**        | `Our dental team in Redondo`       | **3665.75** | 1000   | 4879.19 | 3663.88 |
| 7   | **Ask the Doctor Q&A**            | `Beyond the Smile`                 | **4425.75** | 2587   | 5455.19 | 4527.67 |
| 8   | closing CTA band (chrome §4)      | `Ready for great dental health`    | 7072.75     | —      | 7573.19 | 6402.05 |
| 9   | footer (chrome §5)                | `Want to learn more`               | inside #8   | —      | —       | —       |

Sections 8 and 9 are a single `<section class="footer">` element
(`index.html:136`, `h=1914.41` @1440). `_chrome.md` §4/§5 own them.

### A.1 Gate-region map — where a small broken block can hide

The gate's eight anchors do **not** line up with the eight section boxes. Anchor
text sits at the anchor _element's_ y, not the section's, so five regions
straddle a section boundary. Resolved at 1440:

| gate region                        | spans y           | px       | census sections inside                                                                       |
| ---------------------------------- | ----------------- | -------- | -------------------------------------------------------------------------------------------- |
| R0 _(no anchor — leading region)_  | 0 → 850           | **850**  | **§1 hero, entirely**                                                                        |
| R1 `Finally have a dentist`        | 850 → 1454        | 604      | §2                                                                                           |
| R2 `MEET YOUR TEAM`                | 1454 → 1804       | 350      | §3                                                                                           |
| R3 `Serving the South Bay`         | 1804 → 2624.75    | 820.75   | §4 **+ §5's top 40px pad**                                                                   |
| R4 `Your Path to Oral Health`      | 2624.75 → 3915.75 | **1291** | §5 body + 3 steps + CTA button **+ §6's gradients, `.big-teal-tooth`, `SERVICES` h6**        |
| R5 `Our dental team in Redondo`    | 3915.75 → 4715.75 | 800      | §6 lede/button/3 tooth rows **+ §7's sticky handwriting anchor + qa-card 1's label & image** |
| R6 `Beyond the Smile`              | 4715.75 → 7072.75 | **2357** | rest of §7 — **6 qa cards + "View All Questions"**                                           |
| R7 `Ready for great dental health` | 7072.75 → …       | —        | chrome §4                                                                                    |
| R8 `Want to learn more`            | …                 | —        | chrome §5                                                                                    |

**Where defects hide (say it out loud):**

- **R0 has no anchor at all.** The entire hero — background video, four stacked
  gradients, injected wave SVG, absolutely-positioned h1 and CTA — is one
  850px region. A 60px error in the h1's `bottom` is ~7% of the region.
- **R4 (1291px) contains five independent blocks** across two sections. The
  `.big-teal-tooth` is 130×130 = 1.3% of R4's area; it can be missing outright
  and still clear 0.10.
- **R6 (2357px) is 26% of the page in one region.** Any single `.qa-block`
  is 400/2357 = 17% of it; the "View All Questions" button is 3%.
- **R5 straddles the §6/§7 seam**, which is exactly where the
  `-8rem → +8rem` margin sign flip lives (see §E.1).

---

## B. PER-SECTION SPEC

### §1. Hero — video + headline

`<section class="hero home">` `index.html:136`

#### 1.1 Section box

|                     | source                     | 1440                                                                                                                                                 | 834               | 390                                                |
| ------------------- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- | -------------------------------------------------- |
| base                | `beachfront.css:5295-5300` | `align-items:center; height:33vw; display:block; position:relative`                                                                                  | ”                 | ”                                                  |
| `.hero.home` height | `beachfront.css:5330-5335` | **90vh = 810**                                                                                                                                       | —                 | —                                                  |
| ” ≤991              | `beachfront.css:7992-7994` | —                                                                                                                                                    | **80vw = 667.19** | —                                                  |
| ” ≤767              | `beachfront.css:8456-8459` | —                                                                                                                                                    | —                 | `min-height:240px; max-height:640px`               |
| ” ≤479              | `beachfront.css:9088-9091` | —                                                                                                                                                    | —                 | `background-position:30% 0; height:70vh = **630**` |
| bg image            | `beachfront.css:5331`      | `.../64b991f12be98253c1660fbd_BD_video_still_screenshot_12.39.50%20PM.png`, `background-position:50% 0` (`:5332`), `background-size:cover` (`:5333`) |                   |                                                    |

**Four-state height ladder** `[probed]`: 810 (1440) · **810 (992 — still 90vh)**
· 792.8 (991) · 667.19 (834) · 614.39 (768) · 613.59 (767) · 384 (480) ·
630 (479) · 630 (390). Margin/padding are 0 at every width.

#### 1.2 Background video

`div.bg-video.w-background-video.w-background-video-atom` `index.html:136`.
`beachfront.css:7789-7796`: `z-index:0; object-fit:cover; width:100%;
height:100%; position:absolute; inset:0% auto auto 0%`.
`.bg-video.mobile-only{display:none}` `beachfront.css:7798-7800` — **the
`.mobile-only` variant does not exist in this page's markup**; its ≤767
`display:block` (`beachfront.css:8989-8990`) and ≤479 background-image
(`beachfront.css:9578-9580`) are dead here. Do not port.

Assets (all real files — never redraw):

- poster `https://cdn.prod.website-files.com/64af3f93339537d6b661b556/6531a5d33be0526fd5c1bc35_BD_homepage_video_hd_101823-poster-00001.jpg`
- mp4 `…/6531a5d33be0526fd5c1bc35_BD_homepage_video_hd_101823-transcode.mp4`
- webm `…/6531a5d33be0526fd5c1bc35_BD_homepage_video_hd_101823-transcode.webm`
- `<video autoplay loop muted playsinline data-object-fit="cover">`, poster set
  as an **inline `background-image`** on the `<video>` (`index.html:136`).

#### 1.3 Four stacked overlays (order in DOM = paint order)

| element                   | source                                    | geometry                                                                        | background                                                                                                         |
| ------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `.hero-top-gradient`      | `beachfront.css:6477-6482`                | `w:100%; h:25%; position:absolute` (top 0) → 1440×202.5 @1440                   | `linear-gradient(#129ecccc, #0000)`                                                                                |
| `.hero-mid-gradient`      | `beachfront.css:6876-6882`                | `w:100%; h:50%; absolute; bottom:0%` → 1440×405 @1440                           | `linear-gradient(#0000, #129ecc 65%)` — **base, not `.home`**; the element has no `.home` class (`index.html:136`) |
| `.hero-bot-gradient.home` | `beachfront.css:6484-6490` + `:6496-6498` | `w:100%; h:50%; absolute; bottom:0` → 1440×405 @1440                            | `linear-gradient(#129ecc00 31%, #b6aa91)`                                                                          |
| `.bot-wave`               | `beachfront.css:6008-6016`                | `z-index:8; w:100%; line-height:0; absolute; bottom:0; left:0; overflow:hidden` | white SVG, see 1.4                                                                                                 |

`.hero-mid-gradient.home` (`beachfront.css:6888-6890`) and
`.hero-bot-gradient.home-blue` (`:6500-6502`) are **not used on this page**.

#### 1.4 `.bot-wave` — JS-injected SVG

The `<div class="bot-wave">` ships **empty**. jQuery appends the SVG at
`index.html:143-152`:
`<svg viewBox="0 0 1200 120" preserveAspectRatio="none"><path d="M321.39,56.44c58-10.79,…" class="shape-fill"/></svg>`
(full path data at `index.html:138`).
Height comes from `index.html:24-29` → **120 / 96 / 72px**; `transform:
rotate(180deg)` from `index.html:20-22`; measured `matrix(-1,0,0,-1,0,0)`
`[probed]`. There are **two** `.bot-wave` elements on the page (hero + §5).

#### 1.5 `h1.home-hero-heading`

Text: `Have a relaxed dental experience where you are known and cared for at
<strong>Beachfront Dentistry</strong>` (`index.html:136`).

|                          | source                                                      | 1440                            | 834                    | 390                                  |
| ------------------------ | ----------------------------------------------------------- | ------------------------------- | ---------------------- | ------------------------------------ |
| family / weight / colour | `beachfront.css:2108`, `:2110`, `:6897`                     | museo-slab 300 `#fff`           | ”                      | ”                                    |
| font-size / line-height  | `beachfront.css:2109`+`:2111`; ≤991 `:7853-7856`            | **60 / 72**                     | **28 / 38**            | **28 / 38**                          |
| `text-align`             | `beachfront.css:6898`                                       | left                            | left                   | left                                 |
| width                    | `beachfront.css:6899`; ≤479 `:9382-9384`                    | 60% → **840**                   | 60% → **500.39**       | `auto; padding-right:5%` → **370.5** |
| `margin-top`             | `beachfront.css:2106`                                       | 20                              | 20                     | 20                                   |
| `margin-bottom`          | `beachfront.css:6900`                                       | 0                               | 0                      | 0                                    |
| position / `bottom`      | `beachfront.css:6901-6902`; ≤991 `:8274-8276`; ≤479 `:9386` | absolute `bottom:2rem` = **80** | `bottom:2rem` = **64** | `bottom:6rem` = **144**              |

`.home-hero-heading.su-w-full-mobile` (`beachfront.css:6905-6909`, `:8278-8282`,
`:8848-8850`, `:9389-9391`) is **not used** — the element's class list is
exactly `home-hero-heading`. Ignore all four rules.

**Trap:** `bottom` at 768 is `2rem`@root24 = **48px**, not 64.
Measured `[probed]`: 80 / 64 / 64 / 64 / 48 / 48 / 48 / 144 / 144 across
1440‥390.

#### 1.6 Hero CTA — `a.button.position-absolute-bottom-right.home` "Make Appointment"

Base pill: `_chrome.md` §6.1/§6.2 (plain `.button` variant → **h 67 / 54 / 41**,
fs 25 / 20 / 15).
Placement `beachfront.css:6073-6076`: `bottom:4rem; right:2rem`;
≤991 `beachfront.css:8054-8057`: `bottom:2rem; right:2rem`;
≤767 `beachfront.css:8645-8647`: `width:8rem`;
≤479 `beachfront.css:9189-9193`: `position:absolute; bottom:3rem; left:auto; right:auto`.

Resolved `[probed]`: 1440 `{x:1056.02, y:583, 283.98×67}` · 834
`{x:542.41, y:549.19, 227.59×54}` · 390 `{x:19.5, y:517, 192×41}`.
Note the `width:8rem` at ≤767 is what makes 390's width a flat **192px**
(8rem@24) rather than text-driven.

**Structural fact:** this anchor's class list has **no `.show-form`**
(`index.html:136`), so the jQuery handler at `index.html:170` never binds to it.
Its only click behaviour is IX2 `a-5` (see §D.2). Verified `[probed]` — the
modal still opens, because `.form-modal`'s resting opacity is already 1 and the
IX2 `translateY(150%)` alone brings it on-screen (measured
`matrix(1,0,0,1,0,1350)` after both the hero button and the §5 button).

---

### §2. Three value boxes — "Finally have a dentist that puts you first"

`<section class="home-pyf-section">` `index.html:136`

#### 2.1 Section box

No base rule in `beachfront.css` — the section is an unstyled block.
Only override: ≤767 `beachfront.css:8852-8854` → `padding-top: 2rem`.

|                    | 1440 | 992 | 991   | 834    | **768** | 767    | 390    |
| ------------------ | ---- | --- | ----- | ------ | ------- | ------ | ------ |
| `padding-top`      | 0    | 0   | 0     | 0      | **0**   | **48** | **48** |
| y (doc) `[probed]` | 850  | 842 | 824.8 | 699.19 | 638.39  | 613.59 | 630    |

**Where the space lives:** at ≥768 the 850−810 = **40px gap** above this section
is _not_ section padding — it is the `h1.my-4` `margin-top: 1rem`
(`beachfront.css:3825`) escaping through the section's top edge (margin
collapse, `[probed-only]`). It resolves 40 / 32 / **24 (@768)**. At ≤767 the
`padding-top:2rem` blocks the collapse and the gap becomes 48px of _padding_.
A rebuild that puts this space in a `margin` at 390 or a `padding` at 1440 will
move the gate cut.

#### 2.2 `div.content-width.mb-6`

`.content-width` per `_chrome.md` §2. `.mb-6` = `margin-bottom: 1.5rem`
(`beachfront.css:3994-3996`) → **60 / 48 / 36**.

#### 2.3 `h1.my-4._w-half.su-w-full-mobile`

Text: `Finally have a dentist that puts you first`.

|                                | source                                                                                    | 1440                                      | 834     | 390     |
| ------------------------------ | ----------------------------------------------------------------------------------------- | ----------------------------------------- | ------- | ------- |
| fs / lh                        | `beachfront.css:2109`+`:2111`; ≤991 `:7853-7856`                                          | 60 / 72                                   | 28 / 38 | 28 / 38 |
| family / weight / colour       | `:2108`, `:2110`, `:2105`                                                                 | museo-slab 300 `var(--primary)` `#129ecc` | ”       | ”       |
| `margin-top` / `margin-bottom` | `.my-4` `beachfront.css:3824-3827`                                                        | 40 / 40                                   | 32 / 32 | 24 / 24 |
| width                          | `._w-half` `beachfront.css:2867-2871` (50%); ≤767 `.su-w-full-mobile` `:8426-8428` (100%) | **640**                                   | **369** | **351** |

Measured `[probed]` 1440 `640×144` · 834 `369×76` · 390 `351×76`.

#### 2.4 `div.w-layout-hflex.home-floats-section`

|      | source                     | 1440                                                                                                              | 834                                  | 390                                                                                                                              |
| ---- | -------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| base | `beachfront.css:6911-6916` | `justify-content:space-between; height:9rem = **360**; padding-top:1rem = **40**; padding-bottom:1.5rem = **60**` |                                      |                                                                                                                                  |
| ≤991 | `beachfront.css:8284-8287` | —                                                                                                                 | `flex-direction:column; height:auto` | ”                                                                                                                                |
| ≤767 | `beachfront.css:8856-8860` | —                                                                                                                 | —                                    | `pointer-events:none; padding-top:0; padding-bottom:0`                                                                           |
| ≤479 | `beachfront.css:9393-9402` | —                                                                                                                 | —                                    | `gap:0; flex-wrap:nowrap; justify-content:space-between; align-items:center; padding-top:0; padding-bottom:0; position:relative` |

Resolved `[probed]` h: 360 (1440) / **288 (992 — still `9rem`, root 32)** /
1808 (991 & 834, auto) / **1356 (768, auto)** / 792 (390).
Padding-top/bottom: 40+60 (1440) / 32+48 (834) / **24+36 (768)** / 0+0 (≤767).

**≤479 `pointer-events:none` is inherited from the ≤767 rule and never
restored** — the three boxes at ≤767 are still clickable only because
`.expanding-box` re-establishes its own stacking/`cursor` and the child
`pointer-events` is not reset. `[probed]` the click still lands. Reproduce the
declaration literally; do not "fix" it.

#### 2.5 `div.expanding-box` × 3 — the collapsible cards

All three carry the class list **`expanding-box`** and nothing else
(`index.html:136`). **`.mid` / `.bot` / `.top` / `.left` / `.right` modifiers
are NOT present on home** — `beachfront.css:6941-6977`, `:8295-8298`,
`:8862-8876`, `:9411-9422` are all dead on this page. Do not add them.

|              | source                                                                                   | 1440                                                                            | 992        | 991/834           | **768**           | 390              |
| ------------ | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ---------- | ----------------- | ----------------- | ---------------- |
| **width**    | `index.html:88-90` / `:92-96` / `:98-102`                                                | `calc(33% - 25px)` = **397.39**                                                 | **397.39** | `16rem` = **512** | `16rem` = **384** | `100%` = **351** |
| **height**   | `beachfront.css:6926` (`7rem`); ≤991 `:8291` (`14rem`); ≤479 `:9407` (`10rem`)           | **280**                                                                         | **224**    | **448**           | **336**           | **240**          |
| margin       | `beachfront.css:6927-6928` (`12.5px` l/r); ≤991 `:8292` (`2rem`); ≤479 `:9408` (`.5rem`) | `0 12.5`                                                                        | `0 12.5`   | **64**            | **48**            | **12**           |
| `align-self` | `beachfront.css:6925`; ≤479 `:9405`                                                      | flex-start                                                                      | flex-start | flex-start        | flex-start        | **center**       |
| bg / radius  | `beachfront.css:6919`, `:6921`                                                           | `var(--primary-light)` `#e7f5fa`, `border-radius:25px` (constant at all widths) |            |                   |                   |                  |
| transition   | `beachfront.css:6929`                                                                    | `border-radius 2s cubic-bezier(.95,.05,.795,.035)`                              |            |                   |                   |                  |
| cursor       | `beachfront.css:6920`                                                                    | pointer                                                                         |            |                   |                   |                  |

**This is a FIVE-state width ladder** (397.39 / 397.39 / 512 / 384 / 351) whose
two breakpoints (`991` in the embed, `480` in the embed) do not match either
Webflow's 991/767/479 or the root ladder's 992/768/480. `[probed]` box x/y at
1440: `92.5 / 521.31 / 950.11` all at y=1074 (single row); at 834: all x=112,
y=903.19 / 1479.19 / 2055.19 (column, 576px pitch); at 390: x=19.5,
y=814 / 1078 / 1342 (264px pitch).

Children:

| child                                                    | source                                                                                                                               | 1440                                                                                                                                                                                                                                      | 834                                                                                                                                      | 390                                                                                                                                                   |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `img.expanding-image`                                    | `beachfront.css:6979-6987`                                                                                                           | `object-fit:cover; border-radius:25px; w/h 100%; position:absolute; inset:0%; transition all .65s cubic-bezier(.55,.055,.675,.19)`                                                                                                        |                                                                                                                                          |                                                                                                                                                       |
| `div.box-gradient`                                       | `beachfront.css:6995-7004`; ≤767 `:8882-8884`; ≤479 `:9424-9428`                                                                     | `linear-gradient(#0000, #129ecce6 90%)`, r25, abs 0/0, `transition all .65s cubic-bezier(.19,1,.22,1), border-radius .65s cubic-bezier(.95,.05,.795,.035)`                                                                                | same                                                                                                                                     | ≤767 `linear-gradient(#129eccb3 11%, #129ecc54 87%, #0000)`; ≤479 `linear-gradient(#129ecce6 23%, #052c3940 93%, #0000)` + `transition-duration:.35s` |
| `div.box-gradient-overlay`                               | `beachfront.css:7335-7345`; ≤479 `:9470-9472`                                                                                        | `opacity:0; linear-gradient(#0000, #1089b1c7 31%, #129ecce6 80%)`, r25                                                                                                                                                                    | same                                                                                                                                     | `linear-gradient(#0000, #1089b1c7 16%, #129ecce6 89%)`                                                                                                |
| `p.expanding-text`                                       | `beachfront.css:7015-7024`; ≤991 `:8300-8306`; ≤767 `:8891-8896`; ≤479 `:9430-9435`                                                  | `opacity:0`, `#fff`, `margin:1rem 2rem 1rem .5rem` = **40/80/40/20**, **fs 20 / lh 30**, `display:inline-block`, `transition opacity .65s cubic-bezier(.55,.055,.675,.19)`                                                                | `margin-top/left/right 1.5rem` = 48/48/48 + mb 32, **fs 18 / lh 27**, `transition margin-top .65s ease-out, opacity .65s …`              | `opacity:1` (≤767 `:8892`), `margin 1rem` = 24 all, **fs 20 / lh 30**                                                                                 |
| `div.expanding-label`                                    | `beachfront.css:7034-7047`; ≤767 `:8898-8901`; ≤479 `:9441-9443`                                                                     | `bg var(--primary-light); border-radius 0 0 20px 20px; justify-content:space-between; align-items:center; w:100%; **height 2rem = 80**; padding .5rem = 20; flex; absolute bottom:0; transition all .65s cubic-bezier(.55,.055,.675,.19)` | h **64**, pad 16                                                                                                                         | h `2.5rem` = **60**, pad-x `.5rem` = 12                                                                                                               |
| `h4.text-color-primary-dark.font-weight-bold.m-0`        | `beachfront.css:5920-5922` (fs 30px); h4 lh `:2141` (`1.5em`); weight `:4347-4349`; `.m-0` `:3754-3756`; ≤479 `:9169-9171` (fs 24px) | **30 / 45**, 700, `#365b6d`, margin 0                                                                                                                                                                                                     | **30 / 45** ← _not_ 16px; `.text-color-primary-dark.font-weight-bold.m-0` (0,3,0) outranks the ≤991 `h4{font-size:16px}` at `:7868-7870` | **24 / 36**                                                                                                                                           |
| `div.plus-minus-block.su-display-block-desk-none-mobile` | `beachfront.css:7072-7079`; `.su-display-block…` `:5722-5724`; ≤767 `:8583-8585`                                                     | `cursor:pointer; width/height .625rem` = **25×25**; `position:relative; overflow:visible`                                                                                                                                                 | **20×20**                                                                                                                                | **`display:none`** (`:8583-8585`)                                                                                                                     |
| `img.expanding-plus`                                     | `beachfront.css:7054-7062`                                                                                                           | `w/h 100%; absolute 0/0; transform: rotate(90deg); transition opacity .65s cubic-bezier(.55,.055,.675,.19)`                                                                                                                               |                                                                                                                                          |                                                                                                                                                       |
| `img.expanding-minus`                                    | `beachfront.css:7085-7090` + `index.html:84-86`                                                                                      | `width:100%; max-width:none; absolute; top:.375rem` **overridden** by the embed's `top: calc(50% - .0625rem)` = **10px** @1440 `[probed]`                                                                                                 | 8px                                                                                                                                      | 6px                                                                                                                                                   |

`.plus-minus-block` display `[probed]`: block ≥768 (25 / 20 / 15px), **none at
767 and below** — the ≤767 `.su-display-block-desk-none-mobile` rule at
`beachfront.css:8712` region hides it. So on mobile there is no +/− affordance
on these cards, only on the ATD cards.

Assets (real files, three cards in DOM order):

1. `https://cdn.prod.website-files.com/64af3f93339537d6b661b556/64b998400e0eb30dcc2adf55_DSC_7650.jpg` (Comfort) — 8 srcset entries up to `…_DSC_7650.jpg 8256w`
2. `…/64b9a0735c910a0ec38efc68_cerec-same-day-machine.jpg` (Comprehensive) — 3 srcset entries to 927w
3. `…/64b9a05a616537fb5e59d7e7_BD_office_2020_IMG_2885.jpg` (Caring) — 8 srcset to 3796w

- plus icon `…/64b99fb04451a762305a659f_Plus.svg`, minus icon `…/64b9a1227d5f98ec3f2fe98d_minus.svg`
- all `loading="lazy" sizes="100vw"`.

**Active state** (`[probed]` at 1440, click-toggled — see §C):

|                                            | inactive | `.active`               | source                                                           |
| ------------------------------------------ | -------- | ----------------------- | ---------------------------------------------------------------- |
| `.expanding-box` margin-bottom             | 0        | **80** (`2rem`)         | `beachfront.css:6937-6939`                                       |
| `.expanding-text` opacity                  | 0        | 1                       | `beachfront.css:7026-7027`                                       |
| `.expanding-label` `bottom` / computed top | 0 / 200  | **−80** (`-2rem`) / 280 | `beachfront.css:7049-7052` (≤767 → `bottom:0`, `:8903-8905`)     |
| `.expanding-image` radius                  | 25       | **25 25 0 0**           | `beachfront.css:6990-6993` (≤767 → back to 25 all, `:8878-8880`) |
| `.box-gradient` radius                     | 25       | 25 25 0 0               | `beachfront.css:7006-7009` (≤767 → 25 all, `:8886-8889`)         |
| `.box-gradient-overlay` opacity / radius   | 0 / 25   | **1** / 25 25 0 0       | `beachfront.css:7347-7351` (≤767 `:8926-8929`)                   |
| `.expanding-plus` opacity                  | 1        | **0**                   | `beachfront.css:7064-7066`                                       |
| ≤991 `.expanding-text` margin-top          | 48       | **128** (`4rem`)        | `beachfront.css:8308-8310`                                       |
| ≤479 `.expanding-text` margin-top          | 24       | **12** (`.5rem`)        | `beachfront.css:9437-9439`                                       |

---

### §3. Team headshot rail — "MEET YOUR TEAM"

`<section class="home-meet-your-team-section">` `index.html:136`

#### 3.1 Section box

`beachfront.css:7092-7095`: `margin-bottom: 1.5rem; position: relative`
→ **mb 60 / 48 / 36** `[probed]` (768 → **36**). No padding at any width.
Measured h: 270 / 222 (992) / 207 (991 & 834) / 159 (≤768).

#### 3.2 `h6.text-color-primary-dark.mb-4.font-weight-medium` — "MEET YOUR TEAM"

|                                        | source                                                             | 1440                                                        | 834         | 390         |
| -------------------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------- | ----------- | ----------- |
| fs / lh                                | `beachfront.css:2161`+`:2163`; ≤991 `:7872-7875`                   | **24 / 30**                                                 | **12 / 15** | **12 / 15** |
| family / colour / transform / tracking | `:2160`, `.text-color-primary-dark` `:5897-5899`, `:2157`, `:2156` | museo-slab, `#365b6d`, `uppercase`, `letter-spacing:1.28px` | ”           | ”           |
| weight                                 | `beachfront.css:5924-5926`                                         | **500** (not h6's 700)                                      | ”           | ”           |
| margin                                 | `.mb-4` `beachfront.css:3985-3988`                                 | `0 / 0 / 1rem=40 / 0`                                       | mb **32**   | mb **24**   |

Lives inside a plain `.content-width` (`_chrome.md` §2).

#### 3.3 Rail structure — Webflow CMS list + a jQuery-driven native scroller

DOM (`index.html:136`), **in this order, all siblings of the `.content-width`**:
`img.heads-arrow-right.inline-link.hide-on-portrait` →
`img.heads-arrow-left.inline-link.hide-on-portrait` →
`div.heads-opacity-gradient.click-through.left` →
`div.heads-opacity-gradient.click-through.right` →
`div.heads-slider-holder` > `div.collection-list-wrapper-3.w-dyn-list` >
`div[role=list].heads-slider.w-dyn-items` > 11 × `div[role=listitem].heads.w-dyn-item`.

| element                 | source                                                          | 1440                                                                                                                       | 834                         | 390                         |
| ----------------------- | --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | --------------------------- | --------------------------- |
| `.heads-slider-holder`  | `beachfront.css:7128-7133`                                      | `height:5rem = **200**; margin-bottom:2rem = **80**; position:relative; overflow:scroll`                                   | 160 / 64                    | 120 / 48                    |
| ” `padding-left`        | **JS** `index.html:177` → `getContentWidthMargin()`             | **80** `[probed-only]`                                                                                                     | **48**                      | **19**                      |
| `.heads-slider`         | `beachfront.css:7097-7105`                                      | `white-space:nowrap; flex-wrap:nowrap; height:5rem = **200**; margin-right:240px; display:inline-block; overflow:hidden`   | 160                         | 120                         |
| `.heads` (×11)          | `beachfront.css:7107-7113`                                      | `width/height 5rem = **200**; margin-right:1rem = **40**; inline-block; relative`                                          | 160 / 32                    | 120 / 24                    |
| `.headshot-image.image` | `beachfront.css:7115-7121` + `.image` `:7123-7126`              | `object-fit:cover; border-radius:50%; w/h 100%; inline-block; object-position:50% 0%`                                      |                             |                             |
| `a.head-link`           | `beachfront.css:7357-7364`                                      | `cursor:pointer; background:#0000; w/h 100%; relative; transition opacity .2s`                                             |                             |                             |
| `div.primary-on-hover`  | `beachfront.css:7403-7416`                                      | `opacity:0; background:#129ecca6; border-radius:50%; justify/align center; w/h 100%; absolute 0/0; transition opacity .2s` |                             |                             |
| `h6.rollover-name`      | `beachfront.css:7395-7401` + h6 `:2154-2163`; ≤991 `:7872-7875` | `#fff`, center, `white-space:normal`, `padding-x:4%` = **8**, **24 / 30**, 700, uppercase, ls 1.28, `margin:10px 0`        | pad-x **6.39**, **12 / 15** | pad-x **4.80**, **12 / 15** |

`.heads-slider` total width `[probed]`: 2640 @1440 · 2112 @834 · 1584 @390
(= 11 × (5rem + 1rem) + 240px right margin).

#### 3.4 Rail arrows

|                                   | source                     | 1440                                                                     | 834     | 390                |
| --------------------------------- | -------------------------- | ------------------------------------------------------------------------ | ------- | ------------------ |
| `.heads-arrow-right`              | `beachfront.css:7831-7836` | `z-index:7; height:1rem = **40**; absolute; inset:2rem .25rem auto auto` | 32      | —                  |
| ” `.inline-link`                  | `beachfront.css:7838-7840` | `top:4rem`                                                               |         |                    |
| ” `.inline-link.hide-on-portrait` | `beachfront.css:7842-7844` | `top:3.75rem` = **150**                                                  | **120** | —                  |
| `.heads-arrow-left`               | `beachfront.css:7814-7821` | `z-index:7; height:1rem; absolute; top:2rem; bottom:auto; left:.25rem`   |         |                    |
| ” `.inline-link.hide-on-portrait` | `beachfront.css:7827-7829` | `top:3.75rem` = **150**                                                  | **120** | —                  |
| both ≤479                         | `beachfront.css:9597-9599` | —                                                                        | —       | **`display:none`** |

`[probed]` `.heads-arrow-right` rect: 1440 `{x:1393.64,y:1604,36.36×40}` · 834
`{x:796.92,y:2783.19,29.08×32}` · 390 **absent (display:none)**.
`right:.25rem` = 10 / 8 / — px. Assets:
`…/6508d7f2898b1f24f98c7668_right-arrow.svg`,
`…/6508d8102d754d9bb2bd3f70_left-arrow.svg`.

#### 3.5 Edge fade gradients

`beachfront.css:7504-7510` base (`z-index:6; height:5rem; absolute; two stacked
linear-gradients`), `:7512-7517` `.click-through` (`width:100vw;
margin-bottom:-5rem; position:relative` + `linear-gradient(270deg,#0000 69%,#fff 90%),
linear-gradient(274deg,#fff 5%,#0000 30%)`),
`:7519-7523` `.left` (`linear-gradient(270deg,#0000,#fff 85%); width:200px; left:0`),
`:7525-7530` `.right` (`linear-gradient(to right,#0000,#fff 91%); width:200px;
margin-left:auto; right:0`), ≤991 `:8334-8336` (different gradient stops),
**≤767 `:8931-8933` → `display:none`**.

**The CSS `width:200px` is overwritten by JS**: `index.html:178` sets
`$(".heads-opacity-gradient").css("width", getContentWidthMargin())`.
Measured widths `[probed-only]`: **80 (1440) / 48 (992·991·834) / 36 (768) /
none (≤767)**. `margin-bottom: -5rem` → **−200 / −160 / −120**.

`getContentWidthMargin()` (`matching/spec/incidental-utils.js`, called at
`index.html:177-183` and re-called on the debounced `window:resize` event) is
`(innerWidth − maxWidth)/2 + paddingLeft` when `maxWidth ≤ innerWidth`, else
`paddingLeft` — and it runs both through `parseInt`, so at 390 it returns
**19, not 19.5** `[probed]`, and at 767 it returns **61, not 61.36**.

#### 3.6 Team assets — 11 headshots, `loading="eager"`, `sizes="100vw"`

In DOM order (name → href → src):

1. Dr. Robert Quan → `/team-members/dr-robert-quan` → `https://cdn.prod.website-files.com/64b1c843b071dc32170ea053/64bb0fbee7ccd4a6c98eb3bc_BD_Dr-Quan-Headshot_crop.jpg`
2. Dr. Michael Hopkins → `/team-members/dr-michael-hopkins` → `…/64bb0fca292b8b83528cc2ff_BD_Dr-Hopkins-Headshot_crop.jpg`
3. Stacey → `/team-members/stacey` → `…/64bb0dfdfd2a4cab9f4157f7_DSC_7537_sq_headshot_crop.jpg`
4. Enrique → `/team-members/enrique` → `…/64bb0ecf51f2b29911ad5374_enrique.jpg`
5. Alicia → `/team-members/alicia` → `…/64bc459e10fba50752b252b6_Alicia_7530_crop.jpg`
6. Linda → `/team-members/linda` → `…/64bc4b3dfa9c2b4c2d919bb3_Linda_edit_7595.jpg`
7. Michelle → `/team-members/michelle` → `…/64bc4c68082c3534bd2fc72a_michelle_beachfront.jpg`
8. Christina → `/team-members/christina` → `…/64bc4d1ccc874d4a3f88fb11_BH_christina_DH.jpg`
9. Sabrina → `/team-members/sabrina` → `…/64bc4daf6430fa15b0c2480a_BH_sabrina.jpg`
10. Raquel → `/team-members/raquel` → `…/64bc4ed80b3b039b77fbb8ca_raquel-beachfront.jpg`
11. Lanette → `/team-members/lanette` → `…/64bc51dd4bea106fb5db4e6a_lanette_beachfront.jpg`

All 11 carry a full Webflow `srcset` (`-p-500 / -p-800 / -p-1080 / …`) —
reproduce the srcset, do not ship a single size.

---

### §4. Review slider — "Serving the South Bay for over 40 years"

`<section class="home-ssb-section">` `index.html:136`

#### 4.1 Section box

`beachfront.css:7140-7142`: `margin-bottom: 1.5rem` → **60 / 48 / 36**.
No padding. `[probed]` h 660.75 / 573 / 450.5.

#### 4.2 `h1.text-align-center.mb-8` — **the three-tier trap on this page**

|                          | source                                                                                | 1440                     | 992    | 991    | 834    | **768** | 390    |
| ------------------------ | ------------------------------------------------------------------------------------- | ------------------------ | ------ | ------ | ------ | ------- | ------ |
| font-size                | h1 `beachfront.css:2109`; **≤991 `.mb-8{font-size:1rem}` `beachfront.css:7972-7974`** | **60**                   | **60** | **32** | **32** | **24**  | **24** |
| line-height              | h1 `:2111`; ≤991 `:7855`                                                              | 72                       | 72     | 38     | 38     | 38      | 38     |
| family / weight / colour | `:2108`, `:2110`, `:2105`                                                             | museo-slab 300 `#129ecc` |        |        |        |         |        |
| `text-align`             | `.text-align-center` `beachfront.css:4460-4463`                                       | center                   |        |        |        |         |        |
| `margin-top`             | h1 `:2106`                                                                            | 20                       | 20     | 20     | 20     | 20      | 20     |
| `margin-bottom`          | `.mb-8` `beachfront.css:3998-4000` (`2rem`)                                           | **80**                   | 64     | 64     | **64** | **48**  | **48** |

`.mb-8` is a _spacing_ utility that also carries `font-size: 1rem` inside the
≤991 block. Because it is rem-sized and gated at 991 while the root steps at
992/768, this heading has **three distinct sizes (60 / 32 / 24)** and the
768–991 band renders 32px. All values `[probed]`-confirmed at nine widths.
`.text-align-center` also gets `white-space: normal` at ≤479
(`beachfront.css:9042-9044`).

#### 4.3 `div.review-slider-holder`

**No base rule exists in `beachfront.css`** — grep for `^.review-slider-holder`
returns only media-query blocks. It is a plain block box at ≥992.

|                  | source                                                            | 1440 | 992 | 834     | 767 | 390    |
| ---------------- | ----------------------------------------------------------------- | ---- | --- | ------- | --- | ------ |
| `margin-top`     | ≤991 `beachfront.css:8338-8340` (`4rem`); ≤767 `:8940-8942` (`0`) | 0    | 0   | **128** | 0   | 0      |
| `padding-bottom` | ≤479 `beachfront.css:9508-9510` (`.5rem`)                         | 0    | 0   | 0       | 0   | **12** |

`[probed]` mt: 0 / 0 / **128 (991 & 834)** / **96 (768)** / 0 (≤767).
The 768 value (96) is a distinct fourth state.

#### 4.4 `div.position-relative._w-half.su-w-full-portrait` — the arrow/label layer

`._w-half` `beachfront.css:2867-2871` (50%), `.position-relative` `:4291-4293`;
≤479 `beachfront.css:9038-9040` → `width: 100%`.
`[probed]` **height 0 at every width** — it contains only absolutely-positioned
children and contributes nothing to flow. Widths: 640 / 369 / 351.

| child                                         | source                                                                                                                     | 1440                                                                                                                | 834                                      | 390                                                             |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- | --------------------------------------------------------------- |
| `img.what-they-say-big-review.hide-on-mobile` | `beachfront.css:6789-6794`; ≤767 `:8832-8837`; **≤767 `.hide-on-mobile` `:8839-8841` → `display:none`**; ≤479 `:9364-9367` | `width:6rem = **240**; absolute; right:8rem = **320**` → `{160,1956,240×57.23}`                                     | `{−31,3100.19,192×45.86}`, right **256** | **display:none**                                                |
| `img.what-they-say-arrow-big-review`          | `beachfront.css:6807-6813`; ≤767 `:8843-8846` → `display:none`                                                             | `width:3rem = **120**; absolute; top:1.5rem = **60**; right:8.5rem = **340**`                                       | `{49,3148.19,96×41.14}`                  | **display:none**                                                |
| `img.big-review-arrow-left`                   | `beachfront.css:7614-7620`; ≤479 `:9522-9526`                                                                              | `cursor:pointer; width:.75rem = **30**; absolute; top:4rem = **160**; right:8.25rem = **330**` → `{360,2116,30×33}` | `{129,3228.19,24×26.39}`                 | `z-index:10; left:-.75rem; right:5.5rem` → `{1.5,2057,18×19.8}` |
| `img.big-review-arrow-right`                  | `beachfront.css:7594-7600`; ≤479 `:9517-9520`                                                                              | `width:.75rem; absolute; top:3.95rem = **158**; right:-9rem` → `{1050,2114,30×33}`                                  | `{681,3226.58,24×26.39}`                 | `z-index:10; right:-.75rem` → `{370.5,2055.8,18×19.8}`          |

The four `.filter-to-primary` / `.arrow-big-review` variants
(`beachfront.css:6834-6874`, `:7606-7612`, `:7626-7632`, `:8342-8348`,
`:8944-8950`, `:9374-9380`) are **not present** in this page's class lists —
the two arrows are bare `.big-review-arrow-left/right`. Do not port.

Assets: `…/6508d6b19625bc305fecaf7c_what_they_say_bw_w_trans.png`,
`…/6508d6a44abbab51bb883442_what-they-say-arrow.svg`,
`…/6508d8102d754d9bb2bd3f70_left-arrow.svg`, `…/6508d7f2898b1f24f98c7668_right-arrow.svg`.

#### 4.5 The slider viewport and track

|                                             | source                                                             | 1440                                                                                                                                                                                                     | 834               | **768**           | 390                                                                       |
| ------------------------------------------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- | ----------------- | ------------------------------------------------------------------------- |
| `.review-slider-holder-viewport.w-dyn-list` | `beachfront.css:7586-7592`; ≤479 `:9512-9515`                      | `width:15rem = **600**; height:12rem = **480**; margin-x auto; overflow:hidden`                                                                                                                          | 480 × 384         | **360 × 288**     | `width:96%` = **336.95**, `height:auto` = 310                             |
| `.big-review-slider.w-dyn-items`            | `beachfront.css:7563-7572`; ≤479 `:9499-9502`                      | `justify-content:flex-start; align-items:flex-start; **width:2000%** = 12000; height:12rem = 480; margin-left:0; **transition transform 2s cubic-bezier(.19,1,.22,1)**; flex; relative; overflow:hidden` | 9600 × 384        | 7200 × 288        | `height:auto`, 6739.06 × 310                                              |
| `.big-review-item.w-dyn-item` × 5           | `beachfront.css:7575-7579`; ≤479 `:9504-9506`                      | `white-space:normal; width:15rem = **600**; margin-right:5rem = **200**`                                                                                                                                 | 480 / 160         | 360 / 120         | `width:10rem` **overridden inline by JS** → 336.94 / 120                  |
| `.big-review.p-3`                           | `beachfront.css:6738-6752`; `.p-3` `:4050-4052`; ≤479 `:9349-9353` | `bg var(--primary-light); r25; width:15rem=**600**; height:10rem=**400**; margin-x auto; flex-column; justify-content:space-between; relative; padding .75rem = **30**`                                  | 480 × 320, pad 24 | 360 × 240, pad 18 | `width:100%; height:auto; margin-bottom:2rem = 48` → 336.94 × 262, pad 18 |

**Slider JS contract** — `https://raw.githack.com/tucksravin/incidental-js/main/webflow/specific/beachfront/big-review.js`
loaded at `index.html:200`. Reproduce exactly:

- `window.slider.inc = 20` (rem) at `innerWidth ≥ 480`.
- At `innerWidth < 480`: `mobileSlidesWidth = sliderport.width()/24`, each
  `.big-review-item` gets an inline `width: <mobileSlidesWidth>rem`, and
  `inc = 5 + mobileSlidesWidth`. At 390 that is **14.039rem = 336.94px** and
  `inc = 19.039rem = 456.94px` `[probed]`.
- `next()` → `i++`; when `i % length === 0` it **clones all 5 slides and appends
  them**, bumps `cloneCount`, sets track `width = inc*length*cloneCount + "rem"`,
  then `transform: translateX(-inc*i rem)`. `prev()` mirrors with `prependTo`
  and a compensating negative `margin-left`.
- `[probed]` one right-arrow click at 1440 → `matrix(1,0,0,1,-800,0)` = −20rem,
  slide count still 5 (no clone until wrap).
- **Final two lines of the script force `$(".big-review").css("opacity","1")`
  and `transform: translate3d(0,0,0)`** — this _defeats_ the IX2 reveal that
  Webflow attached to the same elements. The review cards must render at
  opacity 1 with no entrance travel. `[probed]` inline style on `.big-review.p-3`
  is `transform: translate3d(0px, 0rem, 0px) …; opacity: 1; transform-style: preserve-3d`.

#### 4.6 Review card contents

| element                          | source                                                                                | 1440                                                                                                                           | 834                           | 390                             |
| -------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ----------------------------- | ------------------------------- |
| `p.text-body`                    | `beachfront.css:7751-7754`; ≤991 `:8359-8361`; ≤767 `:8981-8983`; ≤479 `:9555-9558`   | **20 / 30**, `#365b6d` (p `:2167`), weight 300 (`:2170`), `margin-bottom:10px` (`:2168`)                                       | **16 / 24**                   | **16 / 24**                     |
| `div.reviewer-container`         | `beachfront.css:6754-6757`                                                            | `justify-content:flex-start; display:flex`                                                                                     |                               |                                 |
| `img.reviewer-photo`             | `beachfront.css:6759-6764`; ≤991 `:8265-8267`                                         | `border-radius:50%; width/height 3rem = **120**; margin-right:.5rem = **20**`                                                  | 96, mr 16                     | 72, mr 12                       |
| `div.reviewer-details-container` | `beachfront.css:6766-6771`                                                            | `flex-column; justify-content:center; align-items:flex-start`                                                                  |                               |                                 |
| `div.reviewer-name`              | `beachfront.css:6773-6778`; ≤991 `:8269-8272`; ≤767 `:8828-8830`; ≤479 `:9355-9358`   | **30 / 40**, weight **500**, `#365b6d`                                                                                         | **20 / 60** (`line-height:3`) | **16 / 24**                     |
| `div.reviewer-place.h7`          | `beachfront.css:6780-6787` + `.h7` `:7734-7740`; ≤767 `:8828-8830`; ≤479 `:9360-9362` | `.h7` wins size: **16 / 25** museo-sans 300 `#365b6d` uppercase, `margin-top:.2rem` = **8**                                    | 16 / 25, mt **6.4**           | **10 / 15**, mt **4.8**         |
| `a.social-logo-big-review`       | `beachfront.css:6819-6828`; ≤479 `:9369-9372`                                         | `cursor:pointer; width/height 2rem = **80**; absolute; bottom:-.5rem = **−20**; right:.75rem = **30**; transition opacity .2s` | 64                            | 48, `bottom:-.5rem; right:1rem` |

`a` inherits `border-radius:5px` + `background-color:#129ecc0d` from the global
`a` rule `beachfront.css:2174-2179` — visible on `.social-logo-big-review`
`[probed]` (`rad=5px`). Reproduce it or the logo picks up a tinted rounded plate
you will not have.

Five reviews in DOM order (name / place / logo / href host):

1. Paul K. / Redondo Beach CA / **Yelp** / `yelp.com/biz/beachfront-dentistry-redondo-beach?hrid=BFXba7Bhp7KMgaFkJdBc7w…`
2. Tonya S. / Hermosa Beach CA / Yelp / `…hrid=pDz_x-aGJx-qe__EadRGNw…`
3. Melissa R. / _(empty — `.w-dyn-bind-empty`)_ / Yelp / `…hrid=BXZVdhsXqpvW_ylTj1Kfiw…`
4. Jay. N / Redondo Beach / **Google** / `maps.app.goo.gl/…`
5. Leigh L. / Redondo Beach / Google / `https://maps.app.goo.gl/mqZFMifn4U4MF92C8`

Each `<a>` contains **three** `<img>` (Yelp / Google / Facebook); the two
inapplicable ones carry `class="w-condition-invisible"` (`display:none`).
Logos: `…/64b85e991827e8bce95c4536_Yelp_logo.png`,
`…/64c97c6baf968f274ee2edb4_Google_%20G%20_Logo.svg`,
`…/64c97b32e9cac72606fcb185_Facebook_f_logo_(2021).svg`.
Reviewer photos: `…/6578f51f8205f87eec5805b9_paul_redondo.jpeg`,
`…/6578ee0332b2331474f2c1a4_Tonya_hermosa.jpeg`,
`…/6578f179124927f182f100ea_Melissa_Inglewood.jpeg`,
`…/657a215b6d045ccd271de4b1_Jay_Newman_google.png`,
`…/657a2280b90d9c4670a3fca0_Leigh%20Lowery%20google.png`.

#### 4.7 "Read Reviews" toggle row

`div.display-flex.flex-align-center.flex-justify-center.shift-up`
`beachfront.css:3032-3035`: `margin-top: -1rem; margin-bottom: 3rem`
→ **−40 / +120** (1440), **−32 / +96** (834), **−24 / +72** (390 and 768).

| child                                                            | source                                                                                                                        | 1440                                                                                                                                                                     | 834                | 390                                                                  |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------ | -------------------------------------------------------------------- |
| `div.block-link.social-link-block`                               | `beachfront.css:6191-6197`; ≤479 `:9215-9217`                                                                                 | `white-space:nowrap; background:#0000; align-items:center; flex; relative`                                                                                               | ”                  | `margin-top:-10px`                                                   |
| `h5.services-links.text-size-25-px.slab.text-color-primary-dark` | `beachfront.css:6222-6230`, `:6232-6234`, `:6236-6242`, `:6244-6248`; ≤991 `:8110-8112`; ≤767 `:8671-8673`; ≤479 `:9228-9230` | museo-slab 300, `#365b6d`, `text-transform:none`, **fs 25 / lh 2.75em = 68.75**, `margin-right:.75rem = **30**`                                                          | **20 / 55**, mr 24 | **14 / 38.5**, mr 18                                                 |
| `div.plus-minus-block`                                           | `beachfront.css:7072-7079`                                                                                                    | 25 × 25                                                                                                                                                                  | 20 × 20            | **15 × 15** (visible here — no `.su-display-block-desk-none-mobile`) |
| `div.socials-container`                                          | `beachfront.css:7541-7551`; ≤767 `:8935-8938`; ≤479 `:9495-9497`                                                              | `opacity:0; justify-content:space-between; width:200%; height:100%; **display:none**; absolute; bottom:-80%; left:-50%; transition opacity 2s cubic-bezier(.19,1,.22,1)` | ”                  | `width:120%; left:-10%; bottom:-50%`                                 |
| `a._w-8.clickable.su-w-6-portrait` × 3                           | `_chrome.md` §7 row 14 (`beachfront.css:3474`); ≤479 `:9034-9036` (`width:1.5rem`)                                            |                                                                                                                                                                          |                    |                                                                      |

Social hrefs: Google Maps place URL, `https://www.facebook.com/RedondoDentists`,
`https://www.yelp.com/biz/beachfront-dentistry-redondo-beach` — all `target="_blank"`.

Active state `[probed]` at 1440: `.socials-container` → `display:flex`,
`opacity:1`, `bottom: -120%` = **−82.5px** (`beachfront.css:7553-7556`),
plus IX2 `translateY(40%)` = **+27.5px** (see §D.3). `.expanding-plus.active`
opacity 1→0 (`beachfront.css:7064-7066`).

---

### §5. Path to oral health + 3 steps

`<section class="home-healthy-mouth-section">` `index.html:136`

#### 5.1 Section box

`beachfront.css:7144-7147`: `padding-bottom: 1.5rem; position: relative`
→ **pb 60 / 48 / 36** `[probed]` (768 → 36). No margins.

#### 5.2 `div.bot-wave.flip`

`beachfront.css:6008-6016` base + `:6018-6022`
(`transform-style:preserve-3d; bottom:-3rem; transform: rotateX(0) rotateY(180deg) rotateZ(0)`).
SVG height from `index.html:24-29` → **120 / 96 / 72**.
Because `.bot-wave.flip` (0,2,0) outranks `.bot-wave` (0,1,0) from
`index.html:20-22`, the flip wave is **mirrored, not rotated 180°** — measured
`matrix3d(-1,0,0,0, 0,1,0,0, 0,0,-1,0, 0,0,0,1)` `[probed]` vs the hero wave's
`matrix(-1,0,0,-1,0,0)`.
`bottom:-3rem` puts it **hanging below the section**: at 1440 its top lands
exactly on the section's bottom edge (y = 3665.75) `[probed]`.

#### 5.3 `div.content-width.display-flex.su-flex-v-tablet`

`.display-flex` `beachfront.css:3023-3026`, `.su-flex-v-tablet`
`beachfront.css:5623-5625` (`display:flex`) + ≤991 `:8004-8006`
(`flex-direction:column`) + ≤767 `:8530-8532`; plus ≤991
`.content-width.display-flex.su-flex-v-tablet` `:8036-8038` → `align-items:center`.
So: **row at ≥992, centred column at ≤991.**

Two children, both `._w-half.p-4` (`beachfront.css:2867-2871` + `.p-4`
`:4054-4056` = `padding: 1rem` → **40 / 32 / 24**):

- text column `._w-half.p-4.su-w-full-tablet` — ≤991 `.su-w-full-tablet`
  `beachfront.css:8215-8217` → `width:100%`; ≤767 `:8769-8771` also 100%.
- image column `._w-half.p-4.su-mx-auto-mobile.su-w-full-mobile` — extra
  `padding-top: .5rem` from `beachfront.css:2877-2879` (**20 / 16 / 12**);
  ≤767 `.su-mx-auto-mobile` `:8525-8528` (`margin-x:auto`) and
  `.su-w-full-mobile` `:8426-8428` (`width:100%`).

`[probed]` text column: 640×625 (1440) · 738×586 (834) · 351×332 (390).

#### 5.4 `h2.text-align-center.mb-4` — "Your Path to Oral Health"

|                                | source                                                                      | 1440                         | 834           | **768**       | 390                       |
| ------------------------------ | --------------------------------------------------------------------------- | ---------------------------- | ------------- | ------------- | ------------------------- |
| **font-size / line-height**    | **`.text-align-center.mb-4` `beachfront.css:4491-4495`**; ≤479 `:9050-9053` | **120 / 140**                | **120 / 140** | **120 / 140** | **56 / 70**               |
| family / weight / colour       | h2 `:2118`, `:2120`, `:2115`                                                | museo-slab **100** `#129ecc` | ”             | ”             | ”                         |
| `margin-top` / `margin-bottom` | h2 `:2116`; `.text-align-center.mb-4` `:4492` (`.5rem`)                     | 20 / **20**                  | 20 / **16**   | 20 / **12**   | 20 / **12**               |
| ≤479 extra                     | h2 `:9012-9016`                                                             | —                            | —             | —             | `overflow-wrap: anywhere` |

`.text-align-center.mb-4` has specificity (0,2,0) and therefore **beats the
`h2 { font-size: 72px }` rule inside the ≤991 block** (`beachfront.css:7858-7861`,
specificity 0,0,1). There is no ≤991 or ≤767 override for the compound
selector — only a ≤479 one. **This heading is 120px at 1440, 834 AND 768**, and
drops to 56px only below 480. `[probed]` at nine widths: 120 everywhere except
479 and 390 (56). Any md tier that shrinks it is wrong.

#### 5.5 `p.text-align-center.mt-4.text-body-large` — "is like a short walk on the beach"

|                 | source                                                                              | 1440          | 834         | 390         |
| --------------- | ----------------------------------------------------------------------------------- | ------------- | ----------- | ----------- |
| fs / lh         | `.text-body-large` `beachfront.css:7760-7765`; ≤991 `:8363-8365`; ≤479 `:9573-9576` | **30 / 45**   | **20 / 30** | **20 / 30** |
| colour / weight | p `:2167`, `:2170`                                                                  | `#365b6d` 300 | ”           | ”           |
| `margin-top`    | `.text-align-center.mt-4.text-body-large` `beachfront.css:4501-4503` (`1rem`)       | **40**        | **32**      | **24**      |
| `margin-bottom` | `.text-body-large` `:7762` (40px); ≤479 `:9574` (20px)                              | 40            | 40          | **20**      |

At ≤479, `.text-body-large{font-size:20px}` (0,1,0) beats
`p{font-size:12px}` (`beachfront.css:9018-9020`, 0,0,1) — the lede stays 20px on
mobile.

#### 5.6 `img.beach-circle`

`beachfront.css:7149-7151`: `border-radius: 50%` and nothing else — it is a
fluid `max-width:100%` image inside `._w-half.p-4`, so its size is entirely
container-driven: **560×560 (1440) · 305×305 (834) · 303×303 (390)**
`[probed]`; 383.5 at 991, 300 at 768.
Asset `https://cdn.prod.website-files.com/64af3f93339537d6b661b556/64b9b4a36fc4120f56bbb2da_walking_on_the_beach.jpg`
(8-entry srcset to 3420w, `sizes="100vw"`, `loading="lazy"`).

#### 5.7 `div.home-steps-container.su-flex-v-mobile`

`beachfront.css:7153-7157`: `justify-content:space-between; margin-bottom:2rem;
display:flex` → **mb 80 / 64 / 48** (768 → 48).
`.su-flex-v-mobile` `beachfront.css:5291-5293` + ≤767 `:8434-8436`
(`flex-direction: column`).

Three `div.home-step`: `beachfront.css:7159-7161` → `width: 30%`;
≤767 `beachfront.css:8907-8910` → `width:100%; margin-bottom:.25rem` (= **6px**).
`[probed]` 384 wide @1440, 221.39 @834, 351 @390 (stacked, 135 tall each).

| child                                                                               | source                                                                                                                   | 1440                                                                        | 834         | 390                                           |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------- | ----------- | --------------------------------------------- |
| `h6.text-color-primary-dark.text-align-center.font-weight-normal` ("STEP 01/02/03") | h6 `beachfront.css:2154-2163`; ≤991 `:7872-7875`; `.font-weight-normal` `:4343-4345`; `.text-color-primary-dark` `:5897` | **24 / 30**, weight **400**, `#365b6d`, uppercase, ls 1.28, margin `10px 0` | **12 / 15** | **12 / 15**                                   |
| `h3.text-align-center.steps-font-m`                                                 | h3 `beachfront.css:2124-2131`; ≤991 `:7863-7866`; **≤479 `.text-align-center.steps-font-m` `:9064-9070`**                | **40 / 50**, weight 300, `#129ecc`, margin `20/10`                          | **21 / 26** | **30 / 40**, weight **100**, margin `10 / 20` |

**`.steps-font-m` inverts at 390** — mobile is _larger_ (30px) than tablet
(21px). Confirmed `[probed]` at all nine widths. `<br/>` breaks are authored:
`Book an <br/>Appointment`, `Have a <br/>Complete Exam`,
`Receive a <br/>No-Pressure Plan` (`index.html:136`).

#### 5.8 `div.flex-justify-center.mb-8` + CTA button

`.flex-justify-center` `beachfront.css:2984-2987` (`justify-content:center; display:flex`);
`.mb-8` `:3998-4000` (`margin-bottom:2rem` → **80 / 64 / 48**) **and, at ≤991,
`font-size: 1rem`** (`beachfront.css:7972-7974`) — measured wrapper font-size
32px @834, 24px @768/390 `[probed]`. It has no text children so it is visually
inert here, but it is the same rule that drives §4.2.

Button `a.button.text-color-primary-dark.show-form` "Book an Appointment" —
dark pill per `_chrome.md` §6.2/§6.3: **h 66 / 54 / 38.38**, fs 25 / 20 / 14,
`[probed]` widths 317.83 / 254.67 / 178.88. `data-w-id="3f35ea91-…"` →
IX2 `a-5` **and** jQuery `showForm` (`index.html:170`) because it carries
`.show-form`. ≤767 adds `margin-bottom: 60px` (`beachfront.css:8636-8638`).

---

### §6. Services gradient band

`<section class="home-services-section">` `index.html:136`

#### 6.1 Section box — where the big inter-section space lives

|                  | source                                                     | 1440     | 992     | 991/834 | **768** | 390     |
| ---------------- | ---------------------------------------------------------- | -------- | ------- | ------- | ------- | ------- |
| `padding-top`    | `beachfront.css:7164` (`4rem`); ≤991 `:8312-8314` (`3rem`) | **160**  | **128** | **96**  | **72**  | **72**  |
| `padding-bottom` | `beachfront.css:7165` (`8rem`)                             | **320**  | **256** | **256** | **192** | **192** |
| `position`       | `beachfront.css:7166`                                      | relative |         |         |         |         |

**`padding-top` has four distinct values (160/128/96/72)** — 992 is its own
state because the root has stepped to 32 but the `3rem` override has not fired.
All of this space is **padding, not margin**, so it belongs to the services
section's gate region, and the 320/256/192px of bottom padding is what the
next section's negative top margin eats (§7.1).

#### 6.2 Two absolute full-bleed gradients

- `div.home-services-blue-to-brown-gradient` `beachfront.css:7173-7180`:
  `linear-gradient(to right, var(--primary), var(--secondary))`
  (`#129ecc → #b6aa91`), `w/h 100%`, `absolute top:0 left:0`.
- `div.home-services-transe-to-white-gradient` `beachfront.css:7182-7189`:
  `linear-gradient(#0000 50%, #fff)`, `w/h 100%`, `absolute top:0 left:0`.

Both are _siblings preceding_ `.content-width` (`index.html:136`) and neither
sets a `z-index`, so the content stacks above them only because
`.text-color-white` (`beachfront.css:4429-4434`) sets `z-index:5; position:relative`
on the labels.

#### 6.3 `img.big-teal-tooth`

|              | source                                                                        | 1440     | 992      | 991/834  | **768**  | 767     | 390    |
| ------------ | ----------------------------------------------------------------------------- | -------- | -------- | -------- | -------- | ------- | ------ |
| `margin-top` | `beachfront.css:7719` (`-4.5rem`); ≤991 `:8355-8357` (`-5rem`)                | **−180** | **−144** | **−160** | **−120** | −120    | −120   |
| `right`      | `beachfront.css:7721` (`25%`); ≤767 `:8978` (`20%`)                           | 25%      | 25%      | 25%      | 25%      | **20%** | 20%    |
| `width`      | natural; ≤767 `beachfront.css:8975-8979` (`55px`); ≤479 `:9542-9545` (`75px`) | **130**  | 130      | 130      | 130      | **55**  | **75** |
| `top`        | ≤767 `beachfront.css:8977` (`2rem`); ≤479 `:9544` (`3rem`)                    | —        | —        | —        | —        | **48**  | **72** |
| `z-index`    | `beachfront.css:7718`                                                         | 10       |          |          |          |         |        |

`[probed]` rects: 1440 `{940,3645.75,130×130}` · 834 `{495.5,4815.19,130×130}` ·
767 `{558.61,4516.13,55×55}` · 390 `{237,3687.88,75×75}`.
Asset `…/64d1a2016814cab087e3edcc_big-teal-tooth.svg`.
`margin-top` alone has **four** states and the width has **three** — and note
55px (767) < 75px (390), another inversion.

#### 6.4 Content grid

`div.content-width` (chrome §2) > `div._w-full.display-flex.su-flex-v-mobile.su-w-full-mobile.py-2`
(`._w-full` `beachfront.css:2885-2887`, `.display-flex` `:3023-3026`,
`.py-2` `:4080-4083` = `padding-y .5rem` → **20 / 16 / 12**,
`.su-flex-v-mobile` ≤767 `:8434-8436` → column).

**Left column** `._w-half.su-w-full-mobile.py-2` — 640 / 369 / 351 wide `[probed]`:

| element                                           | source                                                                                                                                                                               | 1440                                                                                       | 834                          | 390                                    |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ | ---------------------------- | -------------------------------------- |
| `h6.font-weight-bold.text-color-white` "SERVICES" | h6 `beachfront.css:2154-2163`; ≤991 `:7872-7875`; `.font-weight-bold` `:4347-4349`; `.font-weight-bold.text-color-white` `:4351-4353` (`margin:0`); `.text-color-white` `:4429-4434` | **24 / 30**, 700, `#fff`, uppercase, ls 1.28, **margin 0**, `z-index:5; position:relative` | **12 / 15**                  | **12 / 15**                            |
| `p.text-body-large.text-color-white.mt-4._w-80pc` | `.text-body-large` `:7760-7765`; ≤991 `:8363-8365`; ≤479 `:9573-9576`; `.mt-4` `:3909-3911`; `._w-80pc` `:3561-3563`                                                                 | **30 / 45**, `#fff`, mt **40** (`1rem`), mb 40, width **80% = 512**                        | **20 / 30**, mt 32, w 295.19 | **20 / 30**, mt 24, mb **20**, w 280.8 |
| `a.button.w-button` "View All Services"           | `_chrome.md` §6.2 plain variant                                                                                                                                                      | **254.69 × 67**, fs 25                                                                     | **204.14 × 54**, fs 20       | **153.61 × 41**, fs 15                 |

Copy: `Our dental team in Redondo Beach's Riviera Village takes great pride in
the wide-range of practices our state-of-the-art facility is capable of
providing for your smile.` (`index.html:136`) — **this is the gate anchor for
region R5.**

**Right column** `._w-half.flex-vertical.su-w-full-mobile`
(`.flex-vertical` `beachfront.css:2942-2946` → `flex-direction:column;
align-items:flex-start; display:flex`), three rows
`div.h-8._w-full.display-flex.flex-align-center.my-3`:

|                       | source                                                                                                                             | 1440                                                            | 834            | 390            |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | -------------- | -------------- |
| row height            | **`.h-8._w-full.display-flex.flex-align-center.my-3` `beachfront.css:3605-3607` → `2.5rem`** (not `.h-8`'s `2rem` at `:3601-3603`) | **100**                                                         | **80**         | **60**         |
| row margin-y          | `.my-3` `beachfront.css:3819-3822` (`.75rem`)                                                                                      | **30**                                                          | **24**         | **18**         |
| `img.h-full.mr-4`     | `.h-full` `:3149-3151`; `.mr-4` `:3949-3951` (`1rem`)                                                                              | 100 × 100, mr **40**                                            | 80 × 80, mr 32 | 60 × 60, mr 24 |
| `h3.text-color-white` | h3 `:2124-2131`; ≤991 `:7863-7866`; `.text-color-white` `:4429-4434`                                                               | **40 / 50**, 300, `#fff`, margin `20/10`, `z-index:5; relative` | **21 / 26**    | **21 / 26**    |

Rows (icon → label), in DOM order:

1. `…/64b05fba95fa3003b8c411e7_icon%3Dtooth%203.svg` → **Cosmetic Dentistry**
2. `…/64b05fba486da5a75e84f0d0_icon%3Dtooth%202.svg` → **Implant Dentistry**
3. `…/64b05fb9dd859049da3fd0be_icon%3Dtooth%201.svg` → **General Dentistry**

These are static `<div>`s, **not links** — no `href`, no cursor change `[probed]`.

---

### §7. Ask the Doctor Q&A

`<section class="home-ask-the-doctor-section">` `index.html:136`

#### 7.1 Section box — the sign-flipping margin

|              | source                                                                                               | 1440     | 992      | 991/834  | **768**  | **767**  | 390      |
| ------------ | ---------------------------------------------------------------------------------------------------- | -------- | -------- | -------- | -------- | -------- | -------- |
| `margin-top` | `beachfront.css:7191-7193` (`-8rem`); ≤767 `:8912-8914` (**`6rem`**); ≤479 `:9445-9447` (**`8rem`**) | **−320** | **−256** | **−256** | **−192** | **+144** | **+192** |

Five states, and the **sign flips at 767**. This is the single most
consequential box value on the page: it decides how far the Q&A column overlaps
the services band's 320/256/192px bottom padding. `[probed]` section y:
4425.75 / 4474.25 / 5455.19 / 4553.19 / 5291.92 / 4527.67.

#### 7.2 `div.content-width.mt-8`

`.mt-8` `beachfront.css:3925-3927` (`2rem`) → **80 / 64 / 48**. Container per
chrome §2 (max-width 1400, pad-x 60 / 48 / 19.5).

#### 7.3 Sticky "Ask the Doctor" badge

**Column heads below are viewport REPRESENTATIVES of live's four bands, not
band edges**: `1440` = ≥992, `834` = 768–991, `767` = 480–767, `390` = ≤479.
The root font is 40 / 32 / 24 / 24 across them, so a rem has three distinct
values and the last two columns differ only where a ≤479 rule exists. A `"`
means "same as the column to its left", never "no rule".

`div.ask-the-doctor-handwriting-anchor.click-through`:

|                  | source                                          | 1440                                                                                                                                                             | 834       | 767                               | 390                                                |
| ---------------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | --------------------------------- | -------------------------------------------------- |
| base             | `beachfront.css:7664-7674`                      | `z-index:4; width:21rem = **840**; height:10rem = **400**; margin-x:auto; **position:sticky; top:0; left:0**; transition transform 1s cubic-bezier(.19,1,.22,1)` | 672 × 320 | —                                 | —                                                  |
| `.click-through` | `beachfront.css:7676-7678` + `index.html:81-83` | `z-index:6`, `pointer-events:none`                                                                                                                               |           |                                   |                                                    |
| ≤767             | `beachfront.css:8952-8955`                      | —                                                                                                                                                                | —         | **`height:0; position:relative`** | ”                                                  |
| ≤479             | `beachfront.css:9528-9532`                      | —                                                                                                                                                                | —         | —                                 | **`width:100%; display:block; position:relative`** |

`img.ask-the-doctor-handwriting.filter-to-primary-dark`:

|                                | source                     | 1440                                                                                 | 834                                | 767                                                                                  | 390                    |
| ------------------------------ | -------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------- | ------------------------------------------------------------------------------------ | ---------------------- |
| base                           | `beachfront.css:7680-7686` | `width:5.25rem = **210**; margin-top:3rem = **120**; absolute; top:0; left:-5.25rem` | 160, mt 96                         | —                                                                                    | —                      |
| `.filter-to-primary-dark`      | `beachfront.css:7688-7691` | `absolute; left:-2.5rem` = **−100**                                                  | −80                                |                                                                                      |                        |
| ≤991                           | `beachfront.css:8350-8353` | —                                                                                    | `width:5rem = **160**; left:-5rem` |                                                                                      |                        |
| ≤767 base                      | `beachfront.css:8957-8959` | —                                                                                    | —                                  | `display:none`                                                                       | ”                      |
| ≤767 `.filter-to-primary-dark` | `beachfront.css:8961-8967` | —                                                                                    | —                                  | `margin-top:-4rem = **−96**; display:block; top:0%; left:auto; right:8rem = **192**` | ”                      |
| ≤479                           | `beachfront.css:9534-9536` | —                                                                                    | —                                  | —                                                                                    | `right:6rem = **144**` |

`[probed]` rects: 1440 `{200,4545.75,210×122.08}` · 834 `{1,5551.19,160×93.02}` ·
767 `{323.5,5195.92,120×69.75}` · 390 `{106.5,4431.67,120×69.83}`.
Asset `…/64d1a460811a2162809505a0_ask_the_doctor_handwritten_w_trans.png`
(3-entry srcset to 848w) — recoloured by `index.html:77-79`, do not redraw.

`img.ask-the-doctor-headshot`:

|      | source                     | 1440                                                                                                                                                                | 834                   | 767                                                          | 390                   |
| ---- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- | ------------------------------------------------------------ | --------------------- |
| base | `beachfront.css:7693-7703` | `z-index:9; object-fit:cover; object-position:50% 0%; border-radius:50%; width/height 5rem = **200**; margin-top:2.5rem = **100**; absolute; right:-1rem = **−40**` | 160, mt 80, right −32 |                                                              |                       |
| ≤767 | `beachfront.css:8969-8973` | —                                                                                                                                                                   | —                     | `margin-top:-5.5rem = **−132**; top:0%; right:3rem = **72**` | ”                     |
| ≤479 | `beachfront.css:9538-9540` | —                                                                                                                                                                   | —                     | —                                                            | `right:1rem = **24**` |

`[probed]` 200×200 (1440) · 160×160 (834) · 120×120 (767 and 390).
Asset `…/64d1629e96f76ba56f095e36_BD_Dr-Quan-Headshot_crop.jpg` (7-entry srcset).

**The `FloatingDoctor` scroll-follow is DEAD.** `floating-doc.js`
(`index.html:201`) defines the class, but the only instantiation is
**commented out** at `index.html:196-198`
(`window.onload = () => { //var floatingDoc = new FloatingDoctor(); }`).
The badge's step-down behaviour therefore comes **entirely from CSS
`position: sticky; top: 0`** (`beachfront.css:7671-7672`). Do not implement the
JS; do not omit the sticky.

#### 7.4 `div.collection-list-wrapper-4.w-dyn-list`

`beachfront.css:7785-7787`: `margin-top: -10rem` → **−400 / −320 / −240**
(768 → **−240**). This is what pulls the six cards up under the sticky badge.
Each `div.collection-item-2.w-dyn-item` is
`beachfront.css:7659-7662`: `justify-content:center; display:flex`.

#### 7.5 `div.qa-block` × 6

|                      | source                                                                                                     | 1440                                                           | 834     | **768** | 390                                                  |
| -------------------- | ---------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ------- | ------- | ---------------------------------------------------- |
| bg / radius / cursor | `beachfront.css:7196-7198`                                                                                 | `var(--primary-light)`, `border-radius:25px`, `cursor:pointer` |         |         |                                                      |
| width                | `beachfront.css:7199` (`15rem`); ≤767 `:8916-8920` (`100%`, `max-width:20rem`); ≤479 `:9449-9452` (`100%`) | **600**                                                        | **480** | **360** | **351** (cap 480)                                    |
| height               | `beachfront.css:7200` (`10rem`); ≤767 `:8919` (`12rem`)                                                    | **400**                                                        | **320** | **240** | **288**                                              |
| `margin-bottom`      | `beachfront.css:7201` (`.5rem`)                                                                            | **20**                                                         | **16**  | **12**  | **12**                                               |
| transition           | `beachfront.css:7202`; ≤479 `:9451`                                                                        | `margin-top .65s ease-out, opacity .3s`                        | ”       | ”       | `height .65s, margin-top .65s ease-out, opacity .3s` |

Note **height at 390 (288) is larger than at 768 (240)** — the `12rem` ≤767
rule against root 24. Another inversion.

Children:

| child                               | source                                                                                                         | 1440                                                                                                                                                                                                       | 834                                                                     | 390                                                            |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | -------------------------------------------------------------- |
| `div.qa-label`                      | `beachfront.css:7222-7233`                                                                                     | `z-index:5; bg var(--primary-light); border-radius 25px 25px 0 0; justify-content:space-between; align-items:center; width:100%; **height 2rem = 80**; position:relative; transition margin .65s ease-out` | **64**                                                                  | **48**                                                         |
| `h6.qa-circle`                      | `beachfront.css:7240-7248`; ≤991 `:8316-8319`; ≤479 `:9458-9460`; h6 `:2154-2163`; ≤991 `:7872-7875`           | `border:1px solid var(--primary-dark); border-radius:50%; margin-left:.5rem = **20**; padding:.25rem = **10**; **font-size .625rem = 25 / lh 30**` → 52.77 × 52                                            | pad-y `.3rem` = **9.6**, pad-x 8, **20 / 15** → 43.13 × 36.19           | pad `.35rem .25rem` = **8.4 / 6**, **15 / 15** → 33.48 × 33.78 |
| `div.plus-minus-block.mr-2`         | `beachfront.css:7072-7079`; `.mr-2` `:3941-3943` (`.5rem`)                                                     | 25 × 25, mr 20                                                                                                                                                                                             | 20 × 20, mr 16                                                          | **15 × 15**, mr 12                                             |
| `img.qa-image`                      | `beachfront.css:7320-7328`                                                                                     | `object-fit:cover; border-radius:25px; w/h 100%; absolute inset:0%; transition all .4s cubic-bezier(.55,.055,.675,.19)`                                                                                    |                                                                         |                                                                |
| `div.box-gradient-overlay.qa`       | `beachfront.css:7335-7345` (+ `.qa.active` `:7353-7355`)                                                       | as §2.5                                                                                                                                                                                                    |                                                                         |                                                                |
| `div.box-gradient.qa`               | `beachfront.css:6995-7004` (+ `.qa.active` `:7011-7013`)                                                       | as §2.5                                                                                                                                                                                                    |                                                                         |                                                                |
| `div.qa-text.m-2`                   | `beachfront.css:7282-7290` + `:7292-7301`; `.m-2` `:3762-3764`; ≤767 `:8922-8924`; ≤479 `:9462-9464`           | `width:80% = **480**; **height 3rem = 120**; margin-top:2rem = **80**; margin-left:1rem = **40**; absolute bottom:0; overflow:hidden`                                                                      | 384 × 96, mt 64, ml 32                                                  | 280.8 × 72, mt 48, ml 24, `margin-bottom:0`                    |
| `h4.qa-question`                    | `beachfront.css:7250-7261`; ≤991 `:8321-8324`; h4 `:2134-2141`                                                 | **fs 30 (h4) / lh 45 (1.5em)**, museo-sans **500**, `#fff`, `margin-top:auto; margin-bottom:.5rem = **20**`, absolute bottom:0 left:0, `transition opacity .25s`                                           | **20 / 30**, mb 16                                                      | **20 / 30**, mb 12                                             |
| `div.qa-answer`                     | `beachfront.css:7308-7312`; ≤991 `:8326-8328`                                                                  | `max-height:5rem = **200**; **transform: translate(0, 200%)**; transition `transform .65s cubic-bezier(.23,1,.32,1), height .65s ease-out`                                                                 | 160, ≤991 transition → `margin-top .65s ease-out, height .65s ease-out` | 120                                                            |
| `p.text-color-white.mb-2.text-body` | `.text-body` `:7751-7754`; ≤991 `:8359-8361`; `.mb-2` `:3977-3979` (`.5rem`); `.text-color-white` `:4429-4434` | **20 / 30**, `#fff`, mb **20**                                                                                                                                                                             | **16 / 24**, mb 16                                                      | **16 / 24**, mb 12                                             |
| `a.button.mb-2` "Read More"         | `_chrome.md` §6.2 plain variant + `.mb-2` `:3977-3979`                                                         | **180.25 × 67**, fs 25                                                                                                                                                                                     | **144.61 × 54**, fs 20                                                  | **108.95 × 41**, fs 15                                         |

**Active state** `[probed]` at 1440:

|                                           | inactive            | `.active`                                 | source                                         |
| ----------------------------------------- | ------------------- | ----------------------------------------- | ---------------------------------------------- |
| `.qa-block` margin-top                    | 0                   | **+80** (`2rem`)                          | `beachfront.css:7210-7212`                     |
| ” height ≤479                             | 288                 | **`16rem` = 384**                         | `beachfront.css:9454-9456`                     |
| `.qa-label` margin-top                    | 0                   | **−80** (`-2rem`)                         | `beachfront.css:7236-7238`                     |
| `.qa-text.m-2` height                     | 120                 | **320** (`8rem`), `transition height .2s` | `beachfront.css:7303-7306`                     |
| `.qa-question` opacity                    | 1                   | **0**                                     | `beachfront.css:7263-7265`                     |
| `.qa-answer` transform                    | `translate(0,200%)` | **none**, `height:auto; max-height:none`  | `beachfront.css:7314-7318` (≤479 `:9466-9468`) |
| `.qa-image` radius                        | 25                  | **0 0 25px 25px**                         | `beachfront.css:7331-7333`                     |
| `.box-gradient.qa` radius                 | 25                  | **0 0 25px 25px**                         | `beachfront.css:7011-7013`                     |
| `.box-gradient-overlay.qa` opacity/radius | 0 / 25              | **1** / 0 0 25px 25px                     | `beachfront.css:7353-7355`                     |

`.qa-question.top` / `.qa-question.top.active` / `.qa-question.m-2` /
`.qa-holder` / `.ask-the-doctor-collection-item`
(`beachfront.css:7267-7280`, `:7214-7220`, `:7779-7783`) are **not used on this
page**. Do not port.

Six cards in DOM order (`qa-circle` number / question / href / image):

1. **01** — `Beyond the Smile: Supporting Your Whole-Body Health` →
   `/questions/regular-dental-cleanings-support-your-whole-body-health` →
   `…/689bb3f231f2003a4066605c_couple_running_in_beach-cropped.jpg`
   _(this h4 is the gate anchor for R6)_
2. **07** — `What is the best routine for my dental health?` →
   `/questions/best-routine-for-my-dental-health` →
   `…/68b7199bed7cb2eb7839aa5a_getty-images-O7QZTwoH2f0-unsplash.jpg`
3. **09** — `Do teeth turn yellow as you age?` →
   `…/64d1402a4309c0bf7d84ce63_running-into-our-golden-years.jpg`
4. — `…` → `…/683f066c76c80e0cb66b375d_happy-couple-patients_web.jpg`
5. — `…` → `…/64d13ea1e938619c788c15ef_chipped-tooth.jpg`
6. — `Why Does My Tooth Hurt When I Bite Down?` →
   `/questions/why-does-my-tooth-hurt-when-i-bite-down` →
   `…/699f516449162a22ad808758_getty-images-61Z74XV90Xg-unsplash.jpg`

All six also carry `…/64b99fb04451a762305a659f_Plus.svg` and
`…/64b9a1227d5f98ec3f2fe98d_minus.svg`, `loading="lazy"`, `sizes="100vw"`,
full srcsets.

#### 7.6 Trailing CTA

`div.content-width` > `div.display-flex.flex-justify-center.mb-6`
(`.display-flex` `beachfront.css:3023-3026`; `.flex-justify-center` `:2984-2987`;
`.mb-6` `:3994-3996` = `1.5rem` → **60 / 48 / 36**) >
`a.button.text-color-primary` "View All Questions" → `/ask-the-doctor`.
Primary-outline pill per `_chrome.md` §6.2/§6.3: `border-color: var(--primary)`
(`beachfront.css:6065-6067`), fs 25 / 20 / **14** (≤479 `:9185-9187`),
**h 67 / 54 / 38.38** `[probed]`, width 138.31 / 111.05 / 78.33.

---

## C. INTERACTION INVENTORY

Page-unique only — the header hamburger, nav modal, form modal, CTA-band
buttons/socials, and footer links are enumerated in `_chrome.md` §3/§4/§5/§7.

| #     | element                       | selector                                        | trigger                                    | source of behaviour                                                                                                                                     |
| ----- | ----------------------------- | ----------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | Hero "Make Appointment"       | `.button.position-absolute-bottom-right.home`   | click                                      | IX2 `a-5` only (**no `.show-form` class** — `index.html:136`); hover `beachfront.css:6042-6045`                                                         |
| 2–4   | Value cards ×3                | `.expanding-box`                                | click                                      | jQuery `toggle` `index.html:194`; `cursor:pointer` `beachfront.css:6920`; hover `.86` `:6933-6935`                                                      |
| 5     | Team rail arrow (right glyph) | `.heads-arrow-right`                            | click                                      | `index.html:189-191` → `scrollLeft "-=240"` over 500ms; also IX2 `a-14` (**empty action list**)                                                         |
| 6     | Team rail arrow (left glyph)  | `.heads-arrow-left`                             | click                                      | `index.html:185-187` → `scrollLeft "+=240"` over 500ms                                                                                                  |
| 7     | Team rail                     | `.heads-slider-holder`                          | native horizontal scroll                   | `overflow:scroll` `beachfront.css:7132`, scrollbar hidden `index.html:127-133`                                                                          |
| 8–18  | Headshot links ×11            | `.head-link`                                    | hover + navigate                           | hover `.6` `beachfront.css:7366-7368`; overlay `.primary-on-hover:hover{opacity:1}` `:7418-7420`                                                        |
| 19    | Review prev                   | `.big-review-arrow-left`                        | click                                      | `big-review.js` `slider.prev`; `cursor:pointer` `beachfront.css:7615`; hover `.6` `:7622-7624`                                                          |
| 20    | Review next                   | `.big-review-arrow-right`                       | click                                      | `big-review.js` `slider.next`; hover `.6` `beachfront.css:7602-7604`                                                                                    |
| 21–25 | Review source logos ×5        | `.social-logo-big-review`                       | hover + navigate                           | hover `.6` `beachfront.css:6830-6832`                                                                                                                   |
| 26    | "Read Reviews" expander       | `.block-link.social-link-block`                 | click                                      | jQuery `toggle` `index.html:174`; IX2 `a-8` / `a-9`; hover on the `h5` `.6` `beachfront.css:6250-6252`; hover on `.plus-minus-block` `.51` `:7081-7083` |
| 27–29 | Revealed social links ×3      | `.socials-container ._w-8.clickable`            | hover + navigate (hidden until #26 active) | `display:none` `beachfront.css:7547`; hover `.6` `:3474`                                                                                                |
| 30    | Steps "Book an Appointment"   | `.home-healthy-mouth-section .button.show-form` | click                                      | jQuery `showForm` `index.html:170` **+** IX2 `a-5`                                                                                                      |
| 31    | "View All Services"           | `.home-services-section .button.w-button`       | navigate `/services`                       | hover `beachfront.css:6042-6045`                                                                                                                        |
| 32–37 | Q&A cards ×6                  | `.qa-block`                                     | click                                      | jQuery `toggle` `index.html:195`; `cursor:pointer` `beachfront.css:7197`; hover `.8` `:7206-7208`                                                       |
| 38–43 | "Read More" ×6                | `.qa-answer .button.mb-2`                       | navigate `/questions/…`                    | hover `beachfront.css:6042-6045`                                                                                                                        |
| 44    | "View All Questions"          | `.button.text-color-primary.w-button`           | navigate `/ask-the-doctor`                 | hover `beachfront.css:6042-6045`                                                                                                                        |

Measured hover deltas `[probed]` at 1440 (settled):
`.head-link` 1 → **0.6** with child `.primary-on-hover` 0 → **1** ·
`.social-logo-big-review` 1 → **0.6** · `Read Reviews` h5 1 → **0.6** ·
`.plus-minus-block` 1 → **0.51** · `.expanding-box` → **0.86** ·
`.qa-block` → **0.8**.

**The two team-rail arrows are wired backwards on live** and must stay that way:
`[probed]` `.heads-slider-holder.scrollLeft` 0 → click **left** glyph → **240**
→ click **right** glyph → **0**. `index.html:185-191` is the source.

There are **no `:focus-visible` rules and no keyboard-operable custom widget**
on this page — the sliders and expanders are pointer-only (`_chrome.md` §7).

**INTERACTION COUNT: 44**

---

## D. ANIMATION CENSUS

IX2 state read from `Webflow.require("ix2").store.getState().ixData`;
home-page id is `655680f0c897c56b081e916a` (`index.html:1`,
`data-wf-page`). **52 events** are scoped to this page or global.

### D.1 `a-7` "up and in" — the universal scroll reveal (30 elements)

Trigger: **Webflow `SCROLL_INTO_VIEW`**, `scrollOffsetValue: 0%` for all except
five off-page targets. Webflow IX2 uses an `IntersectionObserver`-equivalent
scroll listener, not the DOM `IntersectionObserver` API.

| step                               | actions                                              | duration | easing      |
| ---------------------------------- | ---------------------------------------------------- | -------- | ----------- |
| initial (applied inline at render) | `TRANSFORM_MOVE y = 4` (**rem**) + `STYLE_OPACITY 0` | 500      | _(linear)_  |
| on enter                           | `TRANSFORM_MOVE y = 0` + `STYLE_OPACITY 1`           | **2000** | **outExpo** |

Travel resolves through the root ladder: **160px @1440 / 128px @834 / 96px @390**
(and 96px @768 — the trap band). The pre-render inline style is literally
`transform: translate3d(0, 4rem, 0) scale3d(1,1,1) rotateX(0) rotateY(0)
rotateZ(0) skew(0,0); opacity: 0` (`index.html:136`), and after settling IX2
rewrites it to `translate3d(0px, 0rem, 0px) … ; opacity: 1; transform-style:
preserve-3d` `[probed]`.

Elements bound to `a-7`, by section:

| §   | element                                            | `data-w-id`                                                     |
| --- | -------------------------------------------------- | --------------------------------------------------------------- |
| 1   | `h1.home-hero-heading`                             | `72990b89-e4bb-2ef8-43d2-78a1e216099e`                          |
| 1   | hero CTA button                                    | `b869ab0c-abcc-9553-9957-8ba849a76c2b`                          |
| 2   | `h1` "Finally have a dentist…"                     | `0e1ee810-8930-779a-1f22-612048fcafa0`                          |
| 2   | `.expanding-box` Comfort / Comprehensive / Caring  | `a0f659dc-…` / `af3b782e-…` / `40df759b-…`                      |
| 3   | `h6` MEET YOUR TEAM                                | `2f384d32-0199-84a3-b59b-c935cee48788`                          |
| 3   | `.heads-slider-holder`                             | `f5d3b9c8-17c9-c59d-bc0b-6b35dbd29b82`                          |
| 3   | `.heads-opacity-gradient` left / right             | `94b05531-…` / `4106cc14-…`                                     |
| 4   | `h1` "Serving the South Bay…"                      | `1cf14d33-19fd-2897-d494-2121333d4d7c`                          |
| 4   | `.big-review` card                                 | `783e3c8e-18d3-315f-2f74-39118e924312` **(defeated — see D.5)** |
| 4   | `.what-they-say-big-review` / `-arrow`             | `…39118e92431c` / `…39118e92431d`                               |
| 4   | `.big-review-arrow-left` / `-right`                | `783e3c8e-…924320` / `219133b1-…`                               |
| 4   | Read Reviews row                                   | `1c94ffb4-2382-b5d2-9df2-015da05656cc`                          |
| 5   | `.content-width.display-flex` (heading+circle row) | `f9e18410-3047-173c-b9af-ab2d45822f83`                          |
| 5   | `.home-step` ×3                                    | `8f983969-…` / `84c871ae-…` / `107ab368-…`                      |
| 5   | `.flex-justify-center.mb-8` CTA wrapper            | `46c3d3a3-5a5a-cf13-abe1-76cc132cdcf0`                          |
| 6   | `h6` SERVICES                                      | `c85a6118-bb25-494f-d1d7-fc9f1b962c6e`                          |
| 6   | services lede `p`                                  | `fe9576e4-da6a-0363-095b-ec7456110fa0`                          |
| 6   | "View All Services"                                | `2dfe9990-41a6-877e-2f9b-021b89c7988b`                          |
| 6   | tooth rows ×3                                      | `0384df56-…` / `578529ed-…` / `45109b78-…`                      |
| 7   | `.ask-the-doctor-handwriting` img                  | `d170b851-f50a-3814-da4e-9c7bafd87cda`                          |
| 7   | `.ask-the-doctor-headshot` img                     | `fa25c5dd-c5ec-f090-50c1-9ccea4f1728e`                          |
| 7   | `.qa-block`                                        | `df0fd825-25c6-bfce-9eac-ab56875d0598`                          |
| 7   | "View All Questions"                               | `03c9288f-e41f-d8b8-2585-e8d8cf1b778c`                          |

**`.beach-circle`, `.big-teal-tooth`, `.bot-wave` and the hero gradients have NO
reveal** — they are painted immediately. A rebuild that reveals them is wrong.

### D.2 `a-5` "show-form-modal" / `a-6` "hide-form-modal"

`MOUSE_CLICK` → `TRANSFORM_MOVE .form-modal y = 150` (**%**), 500ms, no easing.
`a-6` is `y = -150`. Bound on this page to the hero CTA
(`b869ab0c-…`) and the §5 CTA (`3f35ea91-…`). Measured
`matrix(1,0,0,1,0,1350)` at 1440×900 `[probed]` (= 150% of the 900px modal).
Chrome §4 owns the modal itself.

### D.3 `a-8` "open-footer-socials" / `a-9` "close-footer-socials"

`MOUSE_CLICK` / `MOUSE_SECOND_CLICK` on `.block-link.social-link-block`
(`1c94ffb4-…5656cd`). Targets `.socials-container` **by class selector**, so it
fires on the §4 instance _and_ the footer instance simultaneously.

`a-8`: `STYLE_OPACITY 1` (2000ms outExpo) + `GENERAL_DISPLAY flex` (0ms) +
`TRANSFORM_MOVE y = 40%` (2000ms outExpo) → measured **+27.5px** at 1440
(40% of the 68.75px box) `[probed]`.
`a-9`: `TRANSFORM_MOVE y = 0` (2000ms outExpo) + `STYLE_OPACITY 0` (500ms
outExpo), then `GENERAL_DISPLAY none` (0ms).

### D.4 Empty / dead action lists

- **`a-12`** — bound to `SCROLL_INTO_VIEW` on
  `.ask-the-doctor-handwriting-anchor` (`ea8d731c-…`). **Zero action items.**
  It does nothing; the badge's motion is CSS `position:sticky` only.
- **`a-14` "slide right 5rem"** — bound to `MOUSE_CLICK` on
  `.heads-arrow-right` (`f24555d4-…`). **Zero action items.** The rail moves
  purely via the jQuery `.animate({scrollLeft}, 500)` at `index.html:185-191`.

### D.5 CSS transitions (not IX2) — the click-driven motion

These are what actually animate on click, and they are all authored in CSS:

| target                               | property/duration                                                                                                       | source                         |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| `.expanding-box`                     | `border-radius 2s cubic-bezier(.95,.05,.795,.035)`                                                                      | `beachfront.css:6929`          |
| `.expanding-image`                   | `all .65s cubic-bezier(.55,.055,.675,.19)`                                                                              | `beachfront.css:6984`          |
| `.box-gradient`                      | `all .65s cubic-bezier(.19,1,.22,1), border-radius .65s cubic-bezier(.95,.05,.795,.035)`; **`.35s` at ≤479**            | `beachfront.css:7000`, `:9426` |
| `.box-gradient-overlay`              | `all .65s cubic-bezier(.55,.055,.675,.19), border-radius .65s cubic-bezier(.95,.05,.795,.035)`                          | `beachfront.css:7341`          |
| `.expanding-text`                    | `opacity .65s cubic-bezier(.55,.055,.675,.19)`; ≤991 adds `margin-top .65s ease-out`                                    | `beachfront.css:7021`, `:8305` |
| `.expanding-label`                   | `all .65s cubic-bezier(.55,.055,.675,.19)`                                                                              | `beachfront.css:7043`, `:7050` |
| `.expanding-plus`                    | `opacity .65s cubic-bezier(.55,.055,.675,.19)`                                                                          | `beachfront.css:7057`          |
| `.qa-block`                          | `margin-top .65s ease-out, opacity .3s`; ≤479 `height .65s, margin-top .65s ease-out, opacity .3s`                      | `beachfront.css:7202`, `:9451` |
| `.qa-label`                          | `margin .65s ease-out`                                                                                                  | `beachfront.css:7231`          |
| `.qa-question`                       | `opacity .25s`                                                                                                          | `beachfront.css:7257`          |
| `.qa-answer`                         | `transform .65s cubic-bezier(.23,1,.32,1), height .65s ease-out`; ≤991 `margin-top .65s ease-out, height .65s ease-out` | `beachfront.css:7310`, `:8327` |
| `.qa-text.m-2.active`                | `height .2s`                                                                                                            | `beachfront.css:7305`          |
| `.qa-image`                          | `all .4s cubic-bezier(.55,.055,.675,.19)`                                                                               | `beachfront.css:7325`          |
| `.big-review-slider`                 | `transform 2s cubic-bezier(.19,1,.22,1)`                                                                                | `beachfront.css:7569`          |
| `.socials-container`                 | `opacity 2s cubic-bezier(.19,1,.22,1)`                                                                                  | `beachfront.css:7546`          |
| `.primary-on-hover` / `.head-link`   | `opacity .2s`                                                                                                           | `beachfront.css:7411`, `:7362` |
| `.ask-the-doctor-handwriting-anchor` | `transform 1s cubic-bezier(.19,1,.22,1)` (only ever used by the dead FloatingDoctor)                                    | `beachfront.css:7670`          |

### D.6 Non-visual JS side effects

`index.html:171-173` and `:180-184`: a **portrait-orientation `alert()`** fires
on load and on every debounced resize when
`innerWidth < 792 && innerHeight < innerWidth`. Reproduce or deliberately omit —
but note it, because a headless gate run at 1440×900 does **not** trip it
(900 < 1440 is true but 1440 < 792 is false).

---

## E. KNOWN-SUSPECT LIST

Ranked by how likely our build is wrong and how invisible the error is to a
diluted gate region.

### E.1 `.mb-8 { font-size: 1rem }` — the textbook three-tier trap `beachfront.css:7972-7974`

`h1.text-align-center.mb-8` ("Serving the South Bay for over 40 years") is
**60px @1440 · 32px @834 · 24px @390**, and 32px across the whole **769–991**
band. A two-tier ladder keyed at 768 renders 24px there — a 25% type error over
a full heading, inside gate region R3 which is 820px tall (so a 38px height
delta is ~5% and clears 0.10 on its own). This is the highest-confidence
suspect on the page: it is a _font-size hidden inside a margin utility_, so a
rebuild that maps `.mb-8 → mb-8` and stops will never see it.
Same rule also applies to `div.flex-justify-center.mb-8` in §5 (`index.html:136`).

### E.2 `.text-align-center.mb-4` — 120px at md `beachfront.css:4491-4495`

"Your Path to Oral Health" is **120px/140px at 1440, 834 AND 768** and only
drops to 56/70 below 480 (`beachfront.css:9050-9053`). The compound selector
(0,2,0) outranks the `h2{font-size:72px}` inside the ≤991 block
(`beachfront.css:7858-7861`). Any build that gives this heading a "tablet size"
of 72px is wrong by 48px on a 420px-tall block, and it sits at the _top_ of
gate region R4 (1291px) where it can absorb 10% before failing.

### E.3 `.home-ask-the-doctor-section` margin-top sign flip `beachfront.css:7191-7193` / `:8912-8914` / `:9445-9447`

**−320 / −256 / −192 / +144 / +192** across 1440 / 834 / 768 / 767 / 390. Five
states and a sign change at 767. Getting the sign wrong shifts every element
below it, which then reads as a _global_ offset and gets misdiagnosed as a
footer problem. Pair it with §6.1's `padding-bottom: 8rem` (**320/256/192**) —
the two must be implemented together or the services band collapses.

### E.4 `.expanding-box` width — five states, two of them in the page's own `<style>` `index.html:88-102`

`calc(33% - 25px)` / `calc(33% - 25px)` / `16rem = 512` / `16rem = 384` / `100%`.
The breakpoints are **991 and 480** (embed) while the rest of the card's ladder
(`height`, `margin`) breaks at **991 and 479** (`beachfront.css:8289-8293`,
`:9404-9409`). At exactly 480 the width is 100% but the margin is still `2rem`;
at 479 the margin becomes `.5rem`. Two adjacent, differently-gated ladders on
one element. It will not be found by grepping `beachfront.css`.

### E.5 Ladders that invert (mobile larger than tablet)

Each of these will look "obviously wrong" if implemented as a monotonic scale:

- `.text-align-center.steps-font-m` — 40 / **21** / **30** px, and the weight
  changes 300 → 100 (`beachfront.css:2124-2131`, `:7863-7866`, `:9064-9070`).
- `.expanding-text` — 20 / **18** / **20** px (`beachfront.css:7020`, `:8304`, `:9434`).
- `.qa-block` height — 400 / 320 / **240 @768** / **288 @390**
  (`beachfront.css:7200`, `:8919`).
- `.big-teal-tooth` width — 130 / 130 / **55 @767** / **75 @390**
  (`beachfront.css:8975-8979`, `:9542-9545`).
- `.expanding-label` height — 80 / 64 / **48 @768** / **60 @390**
  (`beachfront.css:7041`, `:9442`).

### E.6 Values with no stylesheet line — `[probed-only]` inventory

Do not copy these blindly; re-derive them from their generator.

1. `.heads-slider-holder` `padding-left` and `.heads-opacity-gradient` `width`
   — both `getContentWidthMargin()` (`index.html:177-183`,
   `matching/spec/incidental-utils.js`), and both **`parseInt`-truncated**
   (19 not 19.5 at 390; 61 not 61.36 at 767). The CSS `width:200px` at
   `beachfront.css:7521`/`:7527` is _never_ the rendered value.
2. `.big-review-item` inline `width` and the slider's `inc`, below 480 only
   (`big-review.js`): `sliderport.width()/24` rem → 14.039rem = **336.94px** at 390.
3. The 40px gap between §1 and §2 at ≥768 — a **margin-collapse** result of
   `h1.my-4`'s `margin-top`, not padding (§2.1).
4. `.bot-wave`'s injected SVG (`index.html:143-152`) — absent from the static
   HTML, so any DOM-diff against `index.html` will report it missing.
5. IX2's post-settle inline rewrite (`translate3d(0px, 0rem, 0px) …; opacity: 1;
transform-style: preserve-3d`) on all 30 `a-7` targets.
6. The `.big-review` cards' forced `opacity:1` / `translate3d(0,0,0)` from the
   last two lines of `big-review.js` — the only element on the page whose IX2
   reveal is cancelled by a later script.
7. All absolute document-space `y` values in this file — they are 1440/834/390
   specific and will move if any earlier section's height changes.

### E.7 Rules present in `beachfront.css` that this page must NOT use

Porting them "for completeness" is a real drift risk:
`.expanding-box.mid/.bot/.top/.left/.right` (`:6941-6977` + all media
variants) · `.home-hero-heading.su-w-full-mobile` (`:6905-6909`, `:8278-8282`,
`:8848-8850`, `:9389-9391`) · `.hero-mid-gradient.home` (`:6888-6890`) ·
`.hero-bot-gradient.home-blue` (`:6500-6502`) · `.bg-video.mobile-only`
(`:7798-7800`, `:8989-8990`, `:9578-9580`) · `.arrow-big-review.*` /
`.big-review-arrow-*.filter-to-primary` (`:6834-6874`, `:7606-7612`,
`:7626-7632`, `:8342-8348`, `:8944-8950`, `:9374-9380`) ·
`.qa-question.top/.m-2`, `.qa-holder`, `.ask-the-doctor-collection-item`
(`:7267-7280`, `:7214-7220`, `:7779-7783`) ·
`.custom-shape-divider-bottom-1689290473` (`index.html:39-58`) ·
`.ellipsis-three-lines` (`index.html:105-111`).
