## atd — Ask the Doctor (`/ask-the-doctor`)

Local reference HTML: `matching/spec/ask-the-doctor.html` (114 101 B, published
Wed Jul 22 2026 22:07:20 GMT).
Live: `https://www.beachfrontdentistry.com/ask-the-doctor`.
Webflow page id `655680f0c897c56b081e918f`.

Shared chrome (nav, off-canvas panel, appointment modal, closing CTA band,
footer) is specced in `matching/spec-sections/_chrome.md` and is **byte-identical
here** — verified: the `.form-modal`, `section.header`, `.dropdown-modal`,
`section.footer` markup on this page matches `_chrome.md` §0. This file specs
only what is unique to `/ask-the-doctor`, and defers to `_chrome.md` §1 for the
root-font ladder, §2 for `.content-width`, §3 for nav, §4 for the CTA band, §5
for the footer, §6 for the button pattern.

**Root-font ladder recap** (`_chrome.md` §1; source `ask-the-doctor.html:2-18`
and the duplicate block at `:62-74`): `html{font-size:40px}` / `≤992 → 32px` /
`≤768 → 24px` / `≤480 → 24px` (no-op). Webflow class tiers break at
`beachfront.css:7852` (≤991), `:8372` (≤767), `:9011` (≤479). **Offset by 1px →
every rem has three (sometimes four) resolved values.** Matrix is 1440 / 834 /
390; the 768–991 trap band is called out explicitly wherever it produces a
fourth value.

Palette (`beachfront.css:2047-2054`): `--primary #129ecc`, `--primary-dark
#365b6d`, `--primary-light #e7f5fa`, `--secondary #b6aa91`.

---

## A. Section census

Numbered top to bottom. `y@1440` is the document-y of the element's border box
on live, read after full scroll + `document.getAnimations()` quiesce.

| #          | label                                                                     | anchor (unique, comma-free)       | y@1440            | y@834            | y@390             |
| ---------- | ------------------------------------------------------------------------- | --------------------------------- | ----------------- | ---------------- | ----------------- |
| 1          | Header bar (chrome, absolute overlay)                                     | `"Book an Appointment"`           | 0                 | 0                | 0                 |
| 2          | Hero — `section#hero.hero.ask-a-dentist`                                  | `"Ask the Doctor"` (the `h2`)     | 0                 | 0                | 0                 |
| 2a         | ↳ bottom wave (`.bot-wave`, JS-injected SVG)                              | — (no text)                       | 355.19            | 404.39           | 298.50            |
| 3          | Questions grid — `section.questions-section` box                          | `"Beyond the Smile"`              | 555.19            | 564.39           | 418.50            |
| 3.1 … 3.20 | 20 grid rows × 2 cards @1440/834; **40 rows × 1 card @390**               | see row table below               | 555.19 … 10435.19 | 564.39 … 8468.39 | 418.50 … 12118.50 |
| 4          | Back-to-Top rail — `.content-width.flex-align-center.flex-justify-center` | `"Back to Top"`                   | 11035.19          | 8948.39          | 12466.50          |
| 5          | Closing CTA band (chrome §4)                                              | `"Ready for great dental health"` | 11142.19          | 9034.39          | 12528.88          |
| 6          | Footer info section (chrome §5)                                           | `"Want to learn more"`            | 12362.19          | 9879.00          | 12978.88          |
| 7          | Footer boiler row (chrome §5.6)                                           | `"All Rights Reserved"`           | —                 | —                | —                 |

`document.body.scrollHeight` on live: **13057 / 10845 / 14091** px at
1440 / 834 / 390. (390 is _taller_ than 1440 because the grid goes 1-up.)

Grid row `y` @1440 (20 rows, pitch **520px** = `13rem`):
`555, 1075, 1595, 2115, 2635, 3155, 3675, 4195, 4715, 5235, 5755, 6275, 6795,
7315, 7835, 8355, 8875, 9395, 9915, 10435`.
@834 (20 rows, pitch **416px**): `564, 980, 1396, 1812, 2228, …, 8468`.
@390 (**40** rows, pitch **300px**): `418.5, 718.5, 1018.5, …, 12118.5`.

### A.1 Gate-region mapping — the dilution problem

The gate cuts this page at four anchors: `Beyond the Smile` / `Back to Top` /
`Ready for great dental health` / `Want to learn more`. Resolved against the
census:

| gate region                            | spans census                              | height @1440                    | % of page  |
| -------------------------------------- | ----------------------------------------- | ------------------------------- | ---------- |
| R1 top → `Beyond the Smile`            | **1 + 2 + 2a + the top 300px of card 01** | 0 → 855.19 (855px)              | 6.5 %      |
| R2 `Beyond the Smile` → `Back to Top`  | **3.1 … 3.20 — the whole 40-card grid**   | 855.19 → 11035.19 (**10180px**) | **78.0 %** |
| R3 `Back to Top` → `Ready for…`        | 4                                         | 11035.19 → 11142.19 (107px)     | 0.8 %      |
| R4 `Ready for…` → `Want to learn more` | 5                                         | 11142.19 → 12362.19 (1220px)    | 9.3 %      |
| R5 `Want to learn more` → end          | 6 + 7                                     | 12362.19 → 13057 (695px)        | 5.3 %      |

**Say it explicitly: R2 is 78 % of the page in ONE region and contains 20 census
rows / 40 cards.** A single card is 400×600px = 3.9 % of R2's pixel area. A card
that is 100 % wrong still scores ≈0.039 — under the 0.10 threshold. Every
defect inside a card (`.qa-label` height, `.qa-circle` padding, `.qa-question`
size, the `.qa-answer` translate) is _invisible to the gate_. Phase 4 must not
treat an R2 pass as evidence the grid is correct; the per-component ladders in
§B.3 are the acceptance criteria for R2, not the region score.

Note also that the R1/R2 boundary anchor `"Beyond the Smile"` is the `h5` **inside
card 01** at y 855.19 — 300px _below_ the section box top at 555.19. So R1 owns
the hero _and_ the top 300px of the first card, including its whole
`.qa-label` bar. A wrong `.qa-label` height therefore leaks into R1.

---

## B. Per-census-section spec

### B.1 — Section 2: hero (`section#hero.hero.ask-a-dentist`)

Markup (`ask-the-doctor.html`, minified body):

```
<section id="hero" class="hero ask-a-dentist">
  <div class="bot-wave"></div>          <!-- SVG injected by JS, see below -->
  <div class="hero-top-gradient"></div>
  <div class="hero-bot-gradient"></div>
  <h2 class="subpage-hero-heading">Ask the Doctor</h2>
</section>
```

Four children, in that DOM order. The wave is **first** in source but paints on
top via `z-index: 8`.

#### Box + height ladder — FOUR tiers, none of them rem

`.hero` `beachfront.css:5295-5300`: `align-items:center; height:33vw;
display:block; position:relative`.
`.hero.ask-a-dentist` `beachfront.css:5337-5341`: `background-image:
url(…64b8507bcb8d755f8682eef1_DSC_7704.jpg); background-position:50% 0;
background-size:cover`.

| rule                                    | line                       | applies | height |
| --------------------------------------- | -------------------------- | ------- | ------ |
| `.hero { height: 33vw }`                | `beachfront.css:5297`      | ≥992    | —      |
| `.hero, .hero.redondo { height: 60vw }` | `beachfront.css:7980-7982` | ≤991    | —      |
| `.hero { height: 70vw }`                | `beachfront.css:8438-8440` | ≤767    | —      |
| `.hero.ask-a-dentist { height: 95vw }`  | `beachfront.css:9093-9095` | ≤479    | —      |

Resolved (`[probed]` confirms every row):

| viewport | active rule                                          | height                                             |
| -------- | ---------------------------------------------------- | -------------------------------------------------- |
| **1440** | 33vw                                                 | **475.19px**                                       |
| 992      | 33vw (root already 32px, Webflow tier has NOT fired) | **327.36px**                                       |
| 991      | 60vw                                                 | **594.59px** ← +267px across one pixel of viewport |
| **834**  | 60vw                                                 | **500.39px**                                       |
| 768      | 60vw (root already 24px)                             | **460.80px**                                       |
| 767      | 70vw                                                 | **536.89px**                                       |
| **390**  | 95vw                                                 | **370.50px**                                       |

`.hero` has **no padding and no margin** — the hero's box is exactly its height.
There is no `.content-width` inside the hero.

`section.header` (chrome §3.2) is `position:absolute; top:0` — it overlays the
hero, it does not push it. Both boxes start at document y 0.

#### `h2.subpage-hero-heading` — three type tiers × percentage box

`.subpage-hero-heading` `beachfront.css:6126-6136`:
`color:#fff; text-align:center; width:100%; margin-top:8%; margin-bottom:5%;
font-weight:100; position:absolute; bottom:2%; left:0`.
≤991 `beachfront.css:8076-8080`: `text-align:left; width:80%; left:10%`.
≤479 `beachfront.css:9200-9202`: `left:10%` (restated).

Size comes from bare `h2`:
base `beachfront.css:2114-2122` (`museo-slab, sans-serif; 140px/168px; weight
100 via :6132; color #fff via :6127`);
≤991 `beachfront.css:7858-7861` → `72px/80px`;
≤479 `beachfront.css:9012-9016` → `56px/70px` **plus `overflow-wrap: anywhere`**.

|                                       | 1440                     | 834                           | 390                      |
| ------------------------------------- | ------------------------ | ----------------------------- | ------------------------ |
| family                                | museo-slab, sans-serif   | ←                             | ←                        |
| weight                                | 100 (`:6132`)            | ←                             | ←                        |
| font-size / line-height               | **140 / 168px**          | **72 / 80px**                 | **56 / 70px**            |
| `overflow-wrap`                       | normal                   | normal                        | **anywhere** (`:9013`)   |
| colour                                | `#fff`                   | ←                             | ←                        |
| letter-spacing                        | normal                   | ←                             | ←                        |
| text-align                            | **center**               | **left**                      | **left**                 |
| width                                 | 100 % = **1440px**       | 80 % = **667.19px**           | 80 % = **312px**         |
| `left`                                | 0                        | 10 % = **83.39px**            | 10 % = **39px**          |
| `bottom` (2 % of _hero height_)       | **9.50px**               | **10.00px**                   | **7.41px**               |
| `margin-bottom` (5 % of _hero width_) | **72px**                 | **41.69px**                   | **19.50px**              |
| `margin-top` (8 % of width)           | 115.19px — **inert**     | 66.72px — inert               | 31.19px — inert          |
| rect `[probed]`                       | `{0, 225.69, 1440, 168}` | `{83.39, 368.70, 667.19, 80}` | `{39, 203.59, 312, 140}` |

Two independent percentage bases: `bottom` resolves against the **hero's
height**, `margin-bottom` against the **containing block's width**. The heading's
distance from the hero's bottom edge is `2 %·H + 5 %·W` = 81.5 / 51.7 / 26.9px.
`margin-top` is inert (abspos with `top:auto`, `bottom` set, `height:auto`).

At 992 the heading is still **140/168 centered full-width** while the hero is
only 327px tall — the heading overflows the hero upward. That state is real on
live and is only reachable if the ladder is keyed at 991/992, not 768.

#### `.bot-wave` — the wave is JS-injected and its parent is rotated

**Structural fact only visible in source.** `matching/spec/ask-the-doctor.html`
ships `<div class="bot-wave"></div>` **empty**. The inline script at
`ask-the-doctor.html:120-122` appends the SVG at runtime:

```js
$(".bot-wave").append(' <svg data-name="Layer 1" xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 1200 120" preserveAspectRatio="none"> <path d="M321.39,56.44c58-10.79,
  114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,
  985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,
  321.39,56.44Z" class="shape-fill"></path></svg> ');
```

The path data above is the complete asset — **do not redraw it**. Same path is
reused verbatim by the footer wave (`.custom-shape-divider-bottom-1689290473`,
present inline in the markup at `.footer-wave-embed`).

Geometry:

- `.bot-wave` `beachfront.css:6008-6016`: `z-index:8; width:100%; line-height:0;
position:absolute; bottom:0; left:0; overflow:hidden`.
- **`transform: rotate(180deg)` is on the PARENT `.bot-wave`**, page inline style
  `ask-the-doctor.html:20-22` — not on the SVG. Same pattern as the CTA divider
  (`_chrome.md` §4.6). Computed transform reads `matrix(-1, 0, 0, -1, 0, 0)`.
- `.bot-wave svg` inline `ask-the-doctor.html:24-29`: `position:relative;
display:block; width:calc(133% + 1.3px); height:3rem`.
- `.bot-wave .shape-fill` inline `ask-the-doctor.html:32-34`: `fill:#FFFFFF`
  (matches the white page background below the hero).

|                                    | 1440                     | 834                    | 390                    |
| ---------------------------------- | ------------------------ | ---------------------- | ---------------------- |
| `.bot-wave` height (= svg `3rem`)  | **120px**                | **96px**               | **72px**               |
| `.bot-wave` rect                   | `{0, 355.19, 1440, 120}` | `{0, 404.39, 834, 96}` | `{0, 298.50, 390, 72}` |
| svg width `calc(133% + 1.3px)`     | **1916.50px**            | **1110.52px**          | **520.00px**           |
| svg rect x (after the 180° rotate) | **−476.50**              | **−276.52**            | **−130.00**            |

The negative x is _produced by_ the rotation of an over-wide block child inside
an `overflow:hidden` parent — reproduce the transform, do not hardcode x.
(768-band check: `3rem` = **72px** at 768–991 with root 24 in 768–991's lower
half; at 991–769 root is 32 → **96px**. Three values for the wave height too.)

#### Hero gradients

- `.hero-top-gradient` `beachfront.css:6477-6482`: `background-image:
linear-gradient(#129ecccc, #0000); width:100%; height:25%; position:absolute`
  (no `top` — static-position top = 0).
- `.hero-bot-gradient` `beachfront.css:6484-6490`: `linear-gradient(#0000,
#129ecccc); width:100%; height:50%; position:absolute; bottom:0`.

Percentages of hero height:

|                       | 1440         | 834          | 390          |
| --------------------- | ------------ | ------------ | ------------ |
| top gradient h (25 %) | **118.80px** | **125.09px** | **92.63px**  |
| bot gradient h (50 %) | **237.59px** | **250.19px** | **185.25px** |

Computed colours `[probed]`: `rgba(18,158,204,0.8)` both ends (`#129ecccc` =
0.8 alpha). No `.dark` / `.home` / `.home-blue` variant on this page
(`beachfront.css:6492/6496/6500` are not applicable).

Hero background asset:
`https://cdn.prod.website-files.com/64af3f93339537d6b661b556/64b8507bcb8d755f8682eef1_DSC_7704.jpg`
(`beachfront.css:5338`), `background-position:50% 0`, `background-size:cover`.

---

### B.2 — The hero → grid boundary is a COLLAPSED MARGIN (gate-critical)

`section.questions-section` has **no rule at all in `beachfront.css`** — grep it:
zero hits. Same for `.collection-list-2`. They are structural Webflow classes
with no declarations. Therefore `section.questions-section` has
`padding: 0; margin: 0; border: 0` — `[probed]` confirms `paddingTop/Bottom`
and `marginTop/Bottom` all `0px` at every width.

Its first child is `div.content-width.my-8`. `.my-8` `beachfront.css:3839-3842`:
`margin-top: 2rem; margin-bottom: 2rem`.

Because the section has no padding/border, **that 2rem top margin collapses out
through the section box.** The space between the hero and the questions section
lives on the SECTION, not inside it:

|                               | 1440              | 834        | 390        |
| ----------------------------- | ----------------- | ---------- | ---------- |
| hero bottom                   | 475.19            | 500.39     | 370.50     |
| collapsed `2rem` gap          | **+80**           | **+64**    | **+48**    |
| `section.questions-section` y | **555.19**        | **564.39** | **418.50** |
| `.content-width.my-8` y       | **555.19** (same) | **564.39** | **418.50** |

The grid wrapper's border box starts at exactly the same y as the section's
border box. If the rebuild puts that 2rem as `padding-top` on the section
instead, the section box grows by 80/64/48px at the top and **every gate region
boundary in R1/R2 shifts**. Keep it a margin on the inner `.content-width`.

Symmetrically at the bottom, `.my-8`'s `margin-bottom` collapses with the
adjacent sibling (the Back-to-Top rail), producing the 80/64/48px gap between
the last grid row and the button — and the section's bottom edge lands
**exactly on the button's bottom edge** (11102.19 = 11035.19 + 67 @1440).
There is no trailing space inside `section.questions-section`.

The 40px / 32px / 24px gap between `section.questions-section` and
`section.footer` is `h2.text-align-center.my-4`'s `1rem` top margin
(`beachfront.css:3824-3827`) collapsing out of the footer — chrome §4, noted
here only because it sets the R3/R4 boundary.

`.content-width` (chrome §2, `beachfront.css:5858-5867`, ≤767 `:8627-8630`,
≤479 `:9164-9167`) — pad-x **60 / 48 / 19.5px**, max-width 1400px.
Observed grid wrapper rects: `{20, 555.19, 1400, 10400}` / `{0, 564.39, 834,
8320}` / `{0, 418.50, 390, 12000}`.

---

### B.3 — Section 3: the 40-card questions grid

#### B.3.0 Markup contract (Webflow CMS Collection List, float grid — NOT flex, NOT CSS grid)

```
<section class="questions-section">
  <div class="content-width my-8">
    <div class="w-dyn-list">
      <div role="list" class="collection-list-2 w-dyn-items w-row">
        <div role="listitem" class="ask-the-doctor-collection-item w-dyn-item w-col w-col-6">
          <div data-w-id="eca718d8-1df3-efa3-31bc-0e8a762e2e9c"
               style="transform:translate3d(0,4rem,0)…;opacity:0" class="qa-block">
            <div class="qa-label">
              <h6 class="qa-circle">01</h6>
              <div class="plus-minus-block mr-2">
                <img class="expanding-plus"  src="…64b99fb04451a762305a659f_Plus.svg">
                <img class="expanding-minus" src="…64b9a1227d5f98ec3f2fe98d_minus.svg">
              </div>
            </div>
            <img class="qa-image" loading="lazy" sizes="…" srcset="…" src="…">
            <div class="box-gradient-overlay qa"></div>
            <div class="box-gradient qa"></div>
            <div class="qa-text">
              <h5 class="qa-question">Beyond the Smile: Supporting Your Whole-Body Health</h5>
              <div class="qa-answer">
                <p class="text-color-white mb-2 text-body">…</p>
                <a class="button mb-2 w-button" href="/questions/…">Read More</a>
              </div>
            </div>
          </div>
        </div>
        … ×40 …
```

- The grid is the **legacy Webflow float grid**: `.w-row`
  (`beachfront.css:714-722`, clearfix pseudo-elements, `display:table`),
  `.w-col` `beachfront.css:729-736` `float:left; width:100%; min-height:1px;
padding-left:10px; padding-right:10px; position:relative`,
  `.w-col-6` `beachfront.css:763-765` `width:50%`.
  `.w-row` gets **no negative side margin** here because the list is not inside
  a `.w-container` (`beachfront.css:709-712` is `.w-container .w-row` only) —
  `[probed]` `marginLeft/Right: 0px` at all widths.
- ≤767 `beachfront.css:877-881` → `.w-col { width:100%; left:auto; right:auto }`;
  ≤479 `beachfront.css:945-947` → `.w-col { width:100% }`. **So the grid is
  2-up at 1440 AND at 834, and 1-up only at ≤767.**
- `.ask-the-doctor-collection-item` `beachfront.css:7779-7783`:
  `justify-content:center; height:13rem; display:flex`.
  ≤767 `beachfront.css:8985-8987` → `height:auto`.
- The `style=""` on `.qa-block` is Webflow IX2's serialized initial state, not
  authored CSS — see §D. **`[probed-only]` as an inline value**, but its content
  is derived from action list `a-7` in
  `beachfront-dentistry.schunk.f0bc49bb141fcb49.js` (see §D for the exact JSON).

Column / item geometry:

|                         | 1440    | 992 | **991** | 834     | **768** | **767**    | 390            |
| ----------------------- | ------- | --- | ------- | ------- | ------- | ---------- | -------------- |
| columns                 | 2       | 2   | 2       | **2**   | 2       | **1**      | **1**          |
| rows                    | 20      | 20  | 20      | **20**  | 20      | **40**     | **40**         |
| item outer w            | 640     | 448 | 447.5   | **369** | 348     | 644.28     | **351**        |
| item h (`13rem` / auto) | **520** | 416 | 416     | **416** | **312** | 300 (auto) | **300** (auto) |
| item pad-x              | 10      | 10  | 10      | 10      | 10      | 10         | 10             |

Note the **768 column**: `13rem` × root 24 = **312px**, while 834 gives 416px and
767 gives auto→300px. Three distinct item heights inside 767–991 alone.

#### B.3.1 `.qa-block` — the card

`beachfront.css:7195-7204`: `background-color: var(--primary-light);
cursor:pointer; border-radius:25px; width:15rem; height:10rem;
margin-bottom:.5rem; transition: margin-top .65s ease-out, opacity .3s;
position:relative`.
≤767 `beachfront.css:8916-8920`: `width:100%; max-width:20rem; height:12rem`.
≤479 `beachfront.css:9449-9452`: `width:100%; transition: height .65s,
margin-top .65s ease-out, opacity .3s`.
Hover `beachfront.css:7206-7208`: `opacity:.8`.
Active `beachfront.css:7210-7212`: `margin-top:2rem`;
≤479 `beachfront.css:9454-9456`: `height:16rem`.

|                                 | 1440                                    | 834                     | 390                                                  |
| ------------------------------- | --------------------------------------- | ----------------------- | ---------------------------------------------------- |
| declared width                  | `15rem` = 600px                         | `15rem` = 480px         | `100%`, `max-width:20rem` = 480px                    |
| **rendered** width              | **600px**                               | **349px** ← flex-shrunk | **331px**                                            |
| height                          | `10rem` = **400px**                     | `10rem` = **320px**     | `12rem` = **288px**                                  |
| `margin-bottom` (`.5rem`)       | **20px**                                | **16px**                | **12px**                                             |
| border-radius                   | 25px (fixed)                            | ←                       | ←                                                    |
| background                      | `#e7f5fa`                               | ←                       | ←                                                    |
| `transition`                    | `margin-top .65s ease-out, opacity .3s` | ←                       | `height .65s, margin-top .65s ease-out, opacity .3s` |
| `.active` `margin-top` (`2rem`) | **80px**                                | **64px**                | **48px**                                             |
| `.active` height                | 400px (unchanged)                       | 320px (unchanged)       | **384px** (`16rem`)                                  |

**The 834 shrink is the single most likely rebuild defect.** `.qa-block` is a
flex item of `.ask-the-doctor-collection-item` (`display:flex`,
`justify-content:center`, `beachfront.css:7781-7782`) with default
`flex-shrink:1`. At 1440 the column's content box is 620px and the declared
600px fits → the card is 600px with 10px slack each side. At 834 the column
content box is 349px and the declared 480px **shrinks to 349px** — the card
becomes edge-to-edge in its column. Any rebuild that writes `width:15rem` on a
non-shrinking box (CSS grid item, `flex-shrink:0`, or a `w-` utility) will
overflow at 834. Any rebuild that writes `width:100%` will be wrong at 1440 by
20px.

The active card also does **not** change the row height at 1440/834 — the item
is a fixed `13rem` and the card just slides down 2rem inside it. At 390 the item
is `height:auto`, so opening a card grows the row 300 → 444px and the whole page
below reflows (`scrollHeight` 14091 → 14235 `[probed]`).

#### B.3.2 `.qa-label` — the number bar

`beachfront.css:7222-7234`: `z-index:5; background-color: var(--primary-light);
border-top-left-radius:25px; border-top-right-radius:25px;
justify-content:space-between; align-items:center; width:100%; height:2rem;
transition: margin .65s ease-out; display:flex; position:relative`.
Active `beachfront.css:7236-7238`: `margin-top:-2rem` (slides the bar up behind
the card, revealing the image full-bleed).

|                      | 1440                     | 834                     | 390                       |
| -------------------- | ------------------------ | ----------------------- | ------------------------- |
| height (`2rem`)      | **80px**                 | **64px**                | **48px**                  |
| `.active` margin-top | **−80px**                | **−64px**               | **−48px**                 |
| rect                 | `{100, 555.19, 600, 80}` | `{58, 564.39, 349, 64}` | `{29.5, 418.50, 331, 48}` |

768-band: `2rem` × root 24 = **48px** — same as 390 but with a 2-up grid. Fourth
state.

#### B.3.3 `.qa-circle` — the "01"…"40" badge (FOUR padding values)

`beachfront.css:7240-7248`: `border:1px solid var(--primary-dark);
border-radius:50%; margin-top:0; margin-bottom:0; margin-left:.5rem;
padding:.25rem; font-size:.625rem`.
≤991 `beachfront.css:8316-8319`: `padding-top:.3rem; padding-bottom:.3rem`
(left/right stay `.25rem`).
≤479 `beachfront.css:9458-9460`: `padding:.35rem .25rem`.
Inherited from bare `h6` `beachfront.css:2154-2164`: `color: var(--primary-dark);
letter-spacing:1.28px; text-transform:uppercase; margin:10px 0; font-family:
museo-slab, sans-serif; font-weight:700; font-size:24px; line-height:30px` —
the `font-size` is overridden by `:7248`, the `line-height` is **not**.
≤991 `beachfront.css:7872-7875`: `h6 { font-size:12px; line-height:15px }` —
again only the line-height survives.

|                       | 1440                       | 992      | 991           | **834**                      | **768**       | 767       | **390**                        |
| --------------------- | -------------------------- | -------- | ------------- | ---------------------------- | ------------- | --------- | ------------------------------ |
| font-size (`.625rem`) | **25px**                   | 20px     | 20px          | **20px**                     | 15px          | 15px      | **15px**                       |
| line-height           | **30px**                   | **30px** | **15px**      | **15px**                     | 15px          | 15px      | **15px**                       |
| padding               | **10px**                   | 8px      | **9.6px 8px** | **9.6px 8px**                | **7.2px 6px** | 7.2px 6px | **8.4px 6px**                  |
| margin-left (`.5rem`) | **20px**                   | 16       | 16            | **16px**                     | 12            | 12        | **12px**                       |
| rect                  | `{120, 569.19, 52.77, 52}` | —        | —             | `{74, 578.30, 43.13, 36.19}` | —             | —         | `{41.5, 425.61, 33.48, 33.78}` |

Read the 992 and 991 columns: **font-size and line-height break at different
viewports** (font-size follows the root-font ladder at 992; line-height follows
the Webflow tier at 991). And padding takes **four** values across the matrix:
`10px` / `9.6px 8px` / `7.2px 6px` / `8.4px 6px`. Colour `#365b6d`, 1px solid
`#365b6d` border, `border-radius:50%`, `text-transform:uppercase`,
`letter-spacing:1.28px`, weight 700, museo-slab.

#### B.3.4 `.plus-minus-block` + the two icon SVGs

`.plus-minus-block` `beachfront.css:7072-7079`: `cursor:pointer;
object-fit:fill; width:.625rem; height:.625rem; position:relative;
overflow:visible`. Hover `beachfront.css:7081-7083`: `opacity:.51`.
`.mr-2` `beachfront.css:3941-3943`: `margin-right:.5rem`.
`.expanding-plus` `beachfront.css:7054-7062`: `width:100%; height:100%;
transition: opacity .65s cubic-bezier(.55,.055,.675,.19); position:absolute;
top:0; left:0; transform: rotate(90deg)`.
Active `beachfront.css:7064-7066`: `opacity:0`.
`.expanding-minus` `beachfront.css:7085-7090`: `width:100%; max-width:none;
position:absolute; top:.375rem` — **overridden on this page** by the inline
`<style>` at `ask-the-doctor.html:84-86`: `.expanding-minus{ top: calc(50% -
0.0625rem) }`. The stylesheet value is dead here; cite the page inline rule.

|                                               | 1440                                     | 834                     | 390                    |
| --------------------------------------------- | ---------------------------------------- | ----------------------- | ---------------------- |
| block w/h (`.625rem`)                         | **25×25**                                | **20×20**               | **15×15**              |
| `margin-right` (`.5rem`)                      | **20px**                                 | **16px**                | **12px**               |
| `.expanding-plus` transform                   | `rotate(90deg)` → `matrix(0,1,-1,0,0,0)` | ←                       | ←                      |
| `.expanding-minus` top `calc(50% − .0625rem)` | **10px**                                 | **8px**                 | **6px**                |
| minus rendered h (SVG aspect)                 | 4.80px                                   | 3.84px                  | 2.88px                 |
| block rect                                    | `{655, 582.69, 25, 25}`                  | `{371, 586.39, 20, 20}` | `{333.5, 435, 15, 15}` |

Assets (real files — do not redraw):

- plus `https://cdn.prod.website-files.com/64af3f93339537d6b661b556/64b99fb04451a762305a659f_Plus.svg`
- minus `https://cdn.prod.website-files.com/64af3f93339537d6b661b556/64b9a1227d5f98ec3f2fe98d_minus.svg`

Both are also used by the CTA "Read Reviews" toggle (chrome §4.4) — same two
URLs, 41 instances of each on this page (40 cards + 1 CTA).

#### B.3.5 `.qa-image` and the two gradient plates

`.qa-image` `beachfront.css:7320-7329`: `object-fit:cover; border-radius:25px;
width:100%; height:100%; transition: all .4s cubic-bezier(.55,.055,.675,.19);
position:absolute; inset:0%; overflow:hidden`.
Active `beachfront.css:7331-7333`: `border-radius: 0 0 25px 25px`.

`.box-gradient` `beachfront.css:6995-7004`: `background-image:
linear-gradient(#0000, #129ecce6 90%); border-radius:25px; width:100%;
height:100%; transition: all .65s cubic-bezier(.19,1,.22,1), border-radius .65s
cubic-bezier(.95,.05,.795,.035); position:absolute; top:0; left:0`.
≤767 `beachfront.css:8882-8884`: `linear-gradient(#129eccb3 11%, #129ecc54 87%,
#0000)` — **the gradient flips direction on mobile**.
≤479 `beachfront.css:9424-9428`: `linear-gradient(#129ecce6 23%, #052c3940 93%,
#0000); transition-duration:.35s; top:0`.
Active `beachfront.css:7006-7009` / `.box-gradient.qa.active`
`beachfront.css:7011-7013`: `border-radius: 0 0 25px 25px`.
≤767 active `beachfront.css:8886-8889`: bottom radii back to 25px.

`.box-gradient-overlay` `beachfront.css:7335-7345`: `opacity:0;
linear-gradient(#0000, #1089b1c7 31%, #129ecce6 80%); border-radius:25px;
width/height:100%; transition: all .65s cubic-bezier(.55,.055,.675,.19),
border-radius .65s cubic-bezier(.95,.05,.795,.035); position:absolute; top:0;
left:0`.
≤479 `beachfront.css:9470-9472`: `linear-gradient(#0000, #1089b1c7 16%,
#129ecce6 89%)`.
Active `beachfront.css:7347-7351` (`opacity:1`, bottom radii 0) /
`.box-gradient-overlay.qa.active` `beachfront.css:7353-7355`
(`border-radius: 0 0 25px 25px`); ≤767 active `beachfront.css:8926-8929`
restores 25px bottom radii.

Resolved `.box-gradient` background — **three tiers**:

| viewport                  | computed                                                                            |
| ------------------------- | ----------------------------------------------------------------------------------- |
| ≥768 (1440, **834**, 768) | `linear-gradient(rgba(0,0,0,0), rgba(18,158,204,.9) 90%)`                           |
| 767–480                   | `linear-gradient(rgba(18,158,204,.7) 11%, rgba(18,158,204,.33) 87%, rgba(0,0,0,0))` |
| ≤479 (**390**)            | `linear-gradient(rgba(18,158,204,.9) 23%, rgba(5,44,57,.25) 93%, rgba(0,0,0,0))`    |

`.box-gradient-overlay` — two tiers: base at 1440/834/767, the 16 %/89 % variant
at ≤479. **`opacity: 0` at rest at every width** (`[probed]`).

Paint order inside `.qa-block` (DOM order, all `position:absolute` peers):
`.qa-label` (z-index 5, in flow) → `.qa-image` → `.box-gradient-overlay.qa` →
`.box-gradient.qa` → `.qa-text` (in flow, `position:relative`). The overlay
paints _under_ the base gradient.

40 card images, all served from the CMS asset bucket
`https://cdn.prod.website-files.com/64b1c843b071dc32170ea053/`. Full manifest
(number | question | filename | detail href):

```
01 Beyond the Smile: Supporting Your Whole-Body Health         689bb3f231f2003a4066605c_couple_running_in_beach-cropped.jpg   /questions/regular-dental-cleanings-support-your-whole-body-health
02 Why are my gums turning yellow?                              64d13ab0d112e9ff8d6c7303_teeth-model.jpg                       /questions/why-are-my-gums-turning-yellow
03 My tooth keeps bleeding, what is causing it?                 64d13b871f3009d76412b3ce_red-cheek.jpg                         /questions/my-tooth-keeps-bleeding-what-is-causing-it
04 Why does my tooth look transparent?                          64d13c60fcf5f32c7a2651e4_smiling-woman.jpg                     /questions/transparent-tooth
05 How do I choose the right toothbrush?                        67ed3274645ea263859d59c5_BD_multiple_toothbrush_image.jpg      /questions/choosing-the-right-toothbrush
06 Why won't my tooth pain go away?                             64d13e37870eb893d56a715e_tooth-cold-compress.jpg               /questions/tooth-pain-wont-go-away
07 What is the best routine for my dental health?               68b7199bed7cb2eb7839aa5a_getty-images-O7QZTwoH2f0-unsplash.jpg /questions/best-routine-for-my-dental-health
08 Why do my gums hurt when I brush?                            64d13f4f93084044f2f13440_putting-paste-on-brush.jpg            /questions/gums-hurt-with-brushing
09 Do teeth turn yellow as you age?                             64d1402a4309c0bf7d84ce63_running-into-our-golden-years.jpg     /questions/do-teeth-turn-yellow-as-you-age
10 Did you know these surprising foods can BOOST your dental health? 68b71c23a5607b3b23f7667e_kiwi_crop.jpg                    /questions/what-surprising-foods-optimize-my-dental-health
11 Can flossing prevent heart disease?                          64d14113e9b1bd4ac779112e_flossing.jpg                          /questions/flossing-and-heart-disease
12 Why does my jaw hurt?                                        64d1417c020d3a90a6acb93c_jaw-pain.jpg                          /questions/jaw-pain
13 How Can I Care for My Sensitive Teeth?                       68b71f005ca8fcf885da1a17_getty-images-61Z74XV90Xg-unsplash.jpg /questions/how-can-i-care-for-my-sensitive-teeth
14 Are My Teeth Healthy?                                        64d14373fb27bb254f096ce4_brook-cagle.jpg                       /questions/healthy-teeth
15 Are dental veneers right for me?                             64d143d6c38e2a84ce2a8525_cherry-laithang.jpg                   /questions/dental-veneers
16 Creating Perfect Smiles: Artistry or Science?                683f066c76c80e0cb66b375d_happy-couple-patients_web.jpg         /questions/creating-perfect-smiles-artistry-or-science
17 Does tooth decay cause bad breath?                           64d145907bb71e2876389306_pee-ew.jpg                            /questions/tooth-decay-and-bad-breath
18 What are some common mistakes when brushing your teeth?      64d146b792eb72556c0d5509_bendy-tooth-brush.jpg                 /questions/brushing-mistakes
19 Why did my tooth crack after a root canal?                   64d14099c1f7361013111452_toothache-grimace.jpg                 /questions/cracked-root-canal
20 What are the best cures for chronic bad breath?              64d147a42a186c751e4e0f93_gas-masks.jpg                         /questions/bad-breath-cures
21 Why does my dental bridge keep falling off?                  64d14852ce346cf08d308986_dental-bridges.jpg                    /questions/escaped-dental-bridges
22 How does teeth whitening work?                               64d149542a186c751e50241f_smile.jpg                             /questions/teeth-whitening-explanation
23 Is it normal to grind my teeth during the day?               64d14a1600fcc9a3fa6ca832_woman-toothache-grimace.jpg           /questions/teeth-grinding
24 Why would I need a temporary crown?                          64d14a929e52989ed408cc77_this-woman-really-loves-being-at-the-dentist.jpg /questions/temporary-crown
25 Can flossing help a toothache?                               64d14b28bd095eda61c24290_girl-flossing.jpg                     /questions/flossing-and-toothaches
26 Is It Time To Change My Toothbrush?                          64d13a302f1510e7069334e1_toothpaste.jpg                        /questions/is-it-time-to-change-your-toothbrush
27 How long will porcelain veneers last?                        64d144981271e0c2ed7ce0ac_michael-shivers.jpg                   /questions/how-long-will-veneers-last
28 What New Year's resolutions can help my dental health?       677ff54f832b515523324851_rodion-kutsaiev-BtzFiwqyjrg-unsplash.jpg /questions/resolutions-that-help-your-dental-health
29 Why is my tooth loose?                                       64d13cf0e9b1bd4ac7739144_loose-tooth-mirror.jpg                /questions/loose-tooth
30 My tooth broke off, but it doesn't hurt?                     64d13ea1e938619c788c15ef_chipped-tooth.jpg                     /questions/tooth-broke-off
31 Why does my tooth hurt so bad?                               64d14099c1f7361013111452_toothache-grimace.jpg  (reuse of 19) /questions/my-tooth-hurts-really-bad
32 Do apples yellow teeth?                                      64d1426ce094cf9b34bcb468_woman-getting-apples.jpg              /questions/do-apples-yellow-teeth
33 Why Does My Tooth Hurt When I Bite Down?                     699f516449162a22ad808758_getty-images-61Z74XV90Xg-unsplash.jpg /questions/why-does-my-tooth-hurt-when-i-bite-down
34 Is It Normal for Gums to Bleed When Brushing?                699f7984928ad9f5a94d4282_raghavendra-v-konkathi-5vXiDky3mzg-unsplash_horiz.jpg /questions/is-it-normal-for-gums-to-bleed-when-brushing
35 Why do I have tooth pain when I drink something cold?        699f85ba3fc4c8c16a478ca5_getty-images-NJay3EkGdwE-crop.jpg     /questions/sharp-tooth-pain-with-cold-drinks-causes-fixes
36 How to Stop a Toothache Fast: Safe Relief Until You See a Dentist 699f8937aa4041fb47069340_getty-images-osROIjhewLI-unsplash.jpg /questions/how-to-stop-a-toothache-fast
37 Tooth Sensitivity or a Cavity? Key Differences Dentists Look For  699f8bcbdf934c0d4a99ca73_getty-images-Z5y8mlt2nl8-unsplash.jpg /questions/tooth-sensitivity-or-a-cavity-key-differences
38 How do I know if I have a tooth infection?                   69a07447f925bb2be02c449c_tooth_decay_web.jpg                   /questions/tooth-infection-symptoms-warning-signs-you-shouldnt-ignore
39 Is Tooth Pain an  Emergency? Warning Signs That Need Immediate Care  69a0814c07827a280fcab385_kateryna-hliznitsova-j-ELidUPeIc-unsplash.jpg /questions/when-tooth-pain-is-a-dental-emergency
40 Why Do Teeth Hurt More at Night?                             6a6140a10fa6b39b68daf46e_night_pain_horizontal.jpg            /questions/why-do-teeth-hurt-more-at-night
```

Content notes: cards 19 and 31 **share one image file**. Card 39's title
contains a **double space** ("Tooth Pain an Emergency") — reproduce it, a
content gate will flag a single space. Cards 01–39 ship a Webflow-generated
`srcset` (`-p-500 / -p-800 / -p-1080 / -p-1600 / -p-2000 / -p-2600` +
original) with
`sizes="(max-width: 479px) 96vw, (max-width: 767px) 97vw, (max-width: 991px) 48vw, 50vw"`;
**card 40 has NO srcset and no sizes** — bare `src` only.

#### B.3.6 `.qa-text` — is a BLOCK, not a flex container

`beachfront.css:7282-7290`: `flex-flow:column; justify-content:flex-end;
align-items:center; height:8rem; margin-left:4%; margin-right:4%;
position:relative`.
≤767 `beachfront.css:8922-8924`: `height:10rem`.

**There is no `display:flex`.** Computed `display` is `block` at all three widths
`[probed]` — `flex-flow`, `justify-content` and `align-items` are inert. A
rebuild that "helpfully" adds `display:flex` will re-stack the children and move
the question. Do not add it.

|                                | 1440                      | 992   | 991   | **834**                        | **768**   | 767           | **390**                        |
| ------------------------------ | ------------------------- | ----- | ----- | ------------------------------ | --------- | ------------- | ------------------------------ |
| height                         | `8rem` = **320px**        | 256   | 256   | **256px**                      | **192px** | `10rem` = 240 | **240px**                      |
| margin-l/r (4 % of card width) | **24px**                  | 17.11 | 17.09 | **13.95px**                    | 13.11     | 19.19         | **13.23px**                    |
| rect                           | `{124, 635.19, 552, 320}` | —     | —     | `{71.95, 628.39, 321.09, 256}` | —         | —             | `{42.73, 466.50, 304.53, 240}` |

`8rem` + `2rem` label = `10rem` = exactly the card height at ≥768. At ≤767 the
label is `2rem` and the text `10rem` = `12rem` = the card height. The two
ladders are coupled; changing one without the other opens a gap.

The 4 % side margin resolves against the _card's rendered width_, which at 834 is
the flex-shrunk 349px — so it is 13.95px, **not** 4 % of the declared 480px
(19.2px). Getting §B.3.1's shrink wrong propagates here.

#### B.3.7 `h5.qa-question`

`beachfront.css:7250-7261`: `z-index:5; color:#fff; margin-top:auto;
margin-bottom:.5rem; font-family: museo-sans, sans-serif; font-weight:500;
transition: opacity .25s; position:absolute; bottom:0; left:0`.
Active `beachfront.css:7263-7265`: `opacity:0`.
Size from bare `h5` `beachfront.css:2144-2152`
(`museo-slab; 30px/40px; weight 300; color var(--primary)`) — family, weight and
colour are all overridden by `:7250`; only size/line-height survive.
≤991 `beachfront.css:8321-8324`: `font-size:20px; line-height:30px`.
**There is no `h5` rule in the ≤991/≤767/≤479 blocks** (`_chrome.md` §5.1 makes
the same point), so `.qa-question`'s own ≤991 rule is the only step.

|                           | 1440                         | **992**       | **991 / 834 / 768 / 767 / 390**                                        |
| ------------------------- | ---------------------------- | ------------- | ---------------------------------------------------------------------- |
| family                    | museo-sans, sans-serif       | ←             | ←                                                                      |
| weight                    | 500                          | ←             | ←                                                                      |
| font-size / line-height   | **30 / 40px**                | **30 / 40px** | **20 / 30px**                                                          |
| colour                    | `#fff`                       | ←             | ←                                                                      |
| letter-spacing            | normal                       | ←             | ←                                                                      |
| `margin-bottom` (`.5rem`) | **20px**                     | 16px          | **16px** @834 / **12px** @390                                          |
| position                  | `absolute; bottom:0; left:0` | ←             | ←                                                                      |
| rect                      | `{124, 855.19, 552, 80}`     | —             | `{71.95, 808.39, 321.09, 60}` @834; `{42.73, 634.50, 304.53, 60}` @390 |

`margin-top: auto` is inert (abspos, `top:auto`, `bottom:0`) — computed `0px`.
This is a **two**-tier size ladder (the step is at 991) but a **three**-tier
margin ladder (the step is at 992 and 768). Do not fold them together.

This `h5` is the gate anchor `"Beyond the Smile"`.

#### B.3.8 `.qa-answer` + its two children (collapsed but IN FLOW — white on white)

`.qa-answer` `beachfront.css:7308-7312`: `max-height:5rem; transition: transform
.65s cubic-bezier(.23,1,.32,1), height .65s ease-out;
transform: translate(0, 200%)`.
≤991 `beachfront.css:8326-8328`: `transition: margin-top .65s ease-out,
height .65s ease-out` — note this **drops `transform` from the transition list**,
so on tablet/mobile the collapse/expand snaps rather than slides.
Active `beachfront.css:7314-7318`: `height:auto; max-height:none;
transform:none`.

`p.text-color-white.mb-2.text-body`:
`.text-color-white` `beachfront.css:4429-4434`: `z-index:5; color:#fff;
text-decoration:none; position:relative`.
`.mb-2` `beachfront.css:3977-3979`: `margin-bottom:.5rem`.
`.text-body` `beachfront.css:7751-7754`: `font-size:20px; line-height:1.5em`.
≤991 `beachfront.css:8359-8361` (`.heading-23, .text-body`): `font-size:16px`.
≤767 `beachfront.css:8981-8983`: `line-height: 1.5em` **only** — the 16px is
inherited from the ≤991 rule. ≤479 `beachfront.css:9555-9558`: `16px / 1.5em`. Bare `p` supplies weight 300 (`beachfront.css:2166-2172`),
overridden colour.
≤991 also transitions `.text-color-white.mb-2` `margin-top 2s
cubic-bezier(.19,1,.22,1)` (`beachfront.css:7976-7978`).

`a.button.mb-2.w-button` — see §B.5.

|                                    | 1440                            | 834           | 390           |
| ---------------------------------- | ------------------------------- | ------------- | ------------- |
| `.qa-answer` `max-height` (`5rem`) | **200px**                       | **160px**     | **120px**     |
| `.qa-answer` rendered h            | 183.50px                        | 160px         | 120px         |
| `.qa-answer` transform             | `translateY(200%)` → **+367px** | **+320px**    | **+240px**    |
| p family / weight                  | museo-sans / 300                | ←             | ←             |
| p font-size / line-height          | **20 / 30px**                   | **16 / 24px** | **16 / 24px** |
| p colour                           | `#fff`                          | ←             | ←             |
| p `margin-bottom` (`.5rem`)        | **20px**                        | **16px**      | **12px**      |

**`translate(0, 200%)` is 200 % of the element's OWN rendered height**, which
depends on how many lines the excerpt wraps to. It is therefore a _different_
pixel offset on every card. Never hardcode 367px.

**Nothing clips the collapsed answer.** `overflow` is `visible` on `.qa-answer`,
`.qa-text` (`beachfront.css:7282-7290`), `.qa-block`
(`beachfront.css:7195-7204`) and `.ask-the-doctor-collection-item`
(`beachfront.css:7779-7783`) — `[probed]` confirms `visible` on all four. The
collapsed answer sits **below the card, in the row gap**, at
`{124, 1002.19, 552, 183.5}` for card 01 @1440. It is invisible only because the
text is `#fff` on the white page and the next row's `.qa-label` (z-index 5,
later in DOM) paints over the part that overlaps it. It still **hit-tests** —
`document.elementFromPoint` in the row gap returns
`P.text-color-white mb-2 text-body` `[probed]`. A rebuild that adds
`overflow:hidden` to hide it will change the geometry only imperceptibly but
will change the interaction surface; a rebuild that gives the text a visible
colour will produce a large, obvious pixel diff in the row gaps.

#### B.3.9 Open ("active") state — geometry `[probed]`

Clicking a card adds `.active` to `.qa-block` **and to every descendant** (see
§C). Measured after settle:

|                                             | 1440                    | 834                 | 390                 |
| ------------------------------------------- | ----------------------- | ------------------- | ------------------- |
| `.qa-block` margin-top                      | 80px                    | 64px                | 48px                |
| `.qa-block` height                          | 400 (unchanged)         | 320 (unchanged)     | **384** (`16rem`)   |
| `.qa-block` y                               | 555.19 → **635.19**     | 564.39 → **628.39** | 418.50 → **466.50** |
| `.qa-label` margin-top                      | −80px                   | −64px               | −48px               |
| `.qa-label` y                               | 555.19 (stays)          | 564.39              | 418.50              |
| `.qa-image` radius                          | `0 0 25px 25px`         | ←                   | ←                   |
| `.box-gradient.qa` radius / opacity         | `0 0 25px 25px` / 1     | ←                   | ←                   |
| `.box-gradient-overlay.qa` radius / opacity | `0 0 25px 25px` / **1** | ←                   | ←                   |
| `.qa-question` opacity                      | **0**                   | 0                   | 0                   |
| `.qa-answer` transform / max-height         | `none` / `none`         | ←                   | ←                   |
| `.expanding-plus` opacity                   | **0**                   | 0                   | 0                   |
| item height                                 | 520 (unchanged)         | 416 (unchanged)     | **300 → 444**       |
| `document.scrollHeight`                     | 13057 (unchanged)       | 10845 (unchanged)   | **14091 → 14235**   |

At ≤479 the `.box-gradient` bottom radii go back to 25px
(`beachfront.css:8886-8889`, ≤767) rather than 0 — a mobile-only difference.

---

### B.4 — Section 4: the Back-to-Top rail

```
<div class="content-width flex-align-center flex-justify-center">
  <a href="#hero" class="button text-color-primary w-button">Back to Top</a>
</div>
```

Wrapper: `.content-width` (chrome §2, `beachfront.css:5858-5867`) +
`.flex-align-center` `beachfront.css:2953-2956` (`align-items:center;
display:flex`) + `.flex-justify-center` `beachfront.css:2984-2987`
(`justify-content:center; display:flex`). **No margin of its own** — the space
above it is `.my-8`'s collapsed `margin-bottom` (§B.2).

|                | 1440                             | 834                             | 390                                 |
| -------------- | -------------------------------- | ------------------------------- | ----------------------------------- |
| wrapper rect   | `{20, 11035.19, 1400, 67}`       | `{0, 8948.39, 834, 54}`         | `{0, 12466.50, 390, 38.38}`         |
| wrapper pad-x  | 60px                             | 48px                            | 19.5px                              |
| wrapper margin | 0                                | 0                               | 0                                   |
| button rect    | `{623.52, 11035.19, 192.95, 67}` | `{339.61, 8948.39, 154.77, 54}` | `{140.53, 12466.50, 108.94, 38.38}` |

Button type: see §B.5 (`.text-color-primary` variant — the only element on the
page that hits the ≤479 `.button.text-color-primary { font-size: 14px }` rule).

`href="#hero"` is intercepted by Webflow's `scroll` module (§D.3) — smooth
scroll, not a jump.

---

### B.5 — Button pattern on this page (extends chrome §6)

`.button` `beachfront.css:6028-6040`: `cursor:pointer; background-color:#0000;
border:1px solid #fff; border-radius:8px; height:auto; padding:1.3em 1em;
font-family: museo-slab, sans-serif; font-size:25px; font-weight:300;
line-height:0; transition: opacity .2s, background-color .2s
cubic-bezier(.215,.61,.355,1)`.
Hover `beachfront.css:6042-6045`: `opacity:.6; background-color:#129ecc4a`.
`.button.text-color-primary` `beachfront.css:6065-6067`: `border-color:
var(--primary)`; `.text-color-primary` `beachfront.css:5936-5938`: `color:
var(--primary)`.
`.button.mb-2` `beachfront.css:6078-6080`: `position: relative`.
Webflow base `.w-button` `beachfront.css:265-275` supplies `display:inline-block;
text-decoration:none` (its `background-color:#3898ec`, `border:0`,
`border-radius:0`, `padding:9px 15px` are all overridden by `.button`).

Size ladder — **three tiers, and the two variants diverge at ≤479**:

| rule                                             | line                       | tier                                             |
| ------------------------------------------------ | -------------------------- | ------------------------------------------------ |
| `.button { font-size: 25px }`                    | `beachfront.css:6036`      | ≥992                                             |
| `.button { font-size: 20px }`                    | `beachfront.css:8045-8047` | ≤991                                             |
| `.button { font-size: 15px }`                    | `beachfront.css:8632-8634` | ≤767                                             |
| `.button.text-color-primary { font-size: 14px }` | `beachfront.css:9185-9187` | ≤479, **only the `.text-color-primary` variant** |

`padding: 1.3em 1em` is em-relative, so the box follows the font-size, and
`line-height: 0` means the height is exactly `2 × 1.3em + 2px` border.

|                         | 1440            | 992  | 991     | **834**       | 768   | 767     | **390**             |
| ----------------------- | --------------- | ---- | ------- | ------------- | ----- | ------- | ------------------- |
| "Read More" font-size   | **25px**        | 25px | 20px    | **20px**      | 20px  | 15px    | **15px**            |
| "Read More" padding     | **32.5 / 25px** | ←    | 26 / 20 | **26 / 20px** | 26/20 | 19.5/15 | **19.5 / 15px**     |
| "Read More" height      | **67px**        | 67   | 54      | **54px**      | 54    | 41      | **41px**            |
| "Back to Top" font-size | 25px            | 25px | 20px    | **20px**      | 20px  | 15px    | **14px** ← diverges |
| "Back to Top" height    | **67px**        | 67   | 54      | **54px**      | 54    | 41      | **38.38px**         |

Note the button ladder steps at **991**, not 992 — it is px-based, not rem-based,
so the root-font ladder does not touch it. But it is still a three-tier ladder,
and a two-tier ladder keyed at 768 renders the desktop 25px across the whole
768–991 band.

`.qa-answer .button` colour is `#fff` with a `#fff` border (base rule, no
`.text-color-*` class) — invisible against the white page while collapsed
(§B.3.8), white-on-teal once open. `.mb-2` gives `margin-bottom` 20 / 16 / 12px.

Bare `a` `beachfront.css:2174-2179` supplies `background-color:#129ecc0d;
border-radius:5px; transition: opacity .2s` and `a:hover { opacity: .61 }`
(`beachfront.css:2181-2183`) — `.button`'s `background-color:#0000` cancels the
tint, but the `a:hover` opacity **stacks with** `.button:hover`'s `.6` on the
same element (last-declared wins: `.button:hover` at `:6042` is later than
`a:hover` at `:2181`, so `.6` applies).

---

## C. Interaction inventory

Every interactive element on the rendered page. "Unique" = specced here;
"chrome" = specced in `_chrome.md`, listed only for the count.

### C.1 Unique to `/ask-the-doctor` (121)

| #      | element           | selector                                    | trigger       | behaviour + source                                                                                                                                                                                                                                                                                                       |
| ------ | ----------------- | ------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1–40   | QA card           | `div.qa-block` ×40                          | click         | `$('.qa-block').click(toggle)` — `ask-the-doctor.html:153`. `toggle` from `matching/spec/incidental-utils.js`: adds `.active` to the clicked element **and to every descendant** (`$(this).find('*').addClass('active')`), removes both on second click. Never closes siblings — **multiple cards can be open at once**. |
| 1–40   | ↳ hover           | `.qa-block:hover`                           | hover         | `opacity:.8` — `beachfront.css:7206-7208`                                                                                                                                                                                                                                                                                |
| 41–80  | plus/minus swatch | `div.plus-minus-block.mr-2` ×40             | hover         | `cursor:pointer` `beachfront.css:7073`, `opacity:.51` `beachfront.css:7081-7083`. **No own click handler** — the click bubbles to `.qa-block`.                                                                                                                                                                           |
| 81–120 | "Read More" link  | `a.button.mb-2.w-button` ×40                | click + hover | navigates to `/questions/<slug>`; `.button:hover` `beachfront.css:6042-6045`. Because it is inside `.qa-block`, the click **also toggles the card** before navigation.                                                                                                                                                   |
| 121    | "Back to Top"     | `a.button.text-color-primary[href="#hero"]` | click + hover | Webflow `scroll` module smooth-scroll (§D.3); `.button:hover` `beachfront.css:6042-6045`                                                                                                                                                                                                                                 |

### C.2 Shared chrome present on this page (32) — see `_chrome.md`

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

| #       | element                                                                                                                                               | ref      |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| 122     | `a.link-block-5[href="/"]` white logo                                                                                                                 | §3.2     |
| 123     | `a.link-block-4[href="#"]` hamburger, `data-w-id=d74a87ea…` → open panel                                                                              | §3.3–3.4 |
| 124–130 | 7 × `a.no-text-dec > h3.modal-link` (Home Page / First Visit / Meet Our Team / Services / **Ask the Doctor `w--current`** / Contact / (310) 378-9241) | §3.5     |
| 131     | `a.button…show-form.nav[href="#"]` "Book an Appointment", `data-w-id=6eca16bd…`                                                                       | §3.6     |
| 132     | `a.button…nav` "Make a Payment" → `app.modento.io/beachfront-dentistry`                                                                               | §3.5     |
| 133     | `img.header-hamburger` in `.position-absolute-top-right`, `data-w-id=8dfa6638…` → close panel                                                         | §3.4     |
| 134     | `a.inline-link[href="/"]` blue logo in `.form-modal`                                                                                                  | §3.6     |
| 135     | `a.inline-link[href="#"]` blue X in `.form-modal`, `data-w-id=b914d569…`                                                                              | §3.6     |
| 136–139 | 4 form fields: `#name-2`, `#Email-2`, `#Phone`, `textarea#message`                                                                                    | §3.6     |
| 140     | `input.button.text-color-primary.w-button[type=submit]` "Submit"                                                                                      | §3.6     |
| 141     | `a.button…show-form` "Book Appointment" (CTA band), `data-w-id=1273e294-…4f60`                                                                        | §4.3     |
| 142     | `div.block-link.social-link-block` "Read Reviews", `data-w-id=9daf7a34…` → `$('.social-link-block').click(toggle)` `ask-the-doctor.html:149`          | §4.4     |
| 143     | `div.plus-minus-block` inside it (hover only)                                                                                                         | §4.4     |
| 144–146 | 3 × `a._w-8.clickable` social links (Google Maps reviews / Facebook / Yelp)                                                                           | §4.4     |
| 147–150 | 4 × `a.inline-link > .footer-links` (Your First Visit / Our Team / Services / **Ask the Doctor `w--current`**)                                        | §5.3     |
| 151     | `a.button.text-color-primary-dark` "Make a Payment", `data-w-id=b1ce8885…`                                                                            | §5.3     |
| 152     | `a.inline-link[href="tel:(310)-378-9241"]`                                                                                                            | §5.5     |
| 153     | `.footer-map` Google Maps widget (pan / zoom / tilt / fullscreen — one composite control surface)                                                     | §5.7     |

Not interactive despite appearances: `.position-absolute-top-left > img.header-logo`
in the panel (no anchor, no `data-w-id`); the four `.footer-copyright` divs
including "Privacy Policy" and "Sitemap" — **plain `<div>`s, not links**
(`ask-the-doctor.html`, `.footer-boiler-holder`).

`INTERACTION COUNT: 153`

---

## D. Animation census

### D.1 The card reveal — Webflow IX2 `a-7 "up and in"`, on all 40 cards

Trigger: event **`e-177`**, `eventTypeId: "SCROLL_INTO_VIEW"`,
`animationType: "preset"`, `actionListId: "a-7"`,
`mediaQueries: ["main","medium","small","tiny"]` (i.e. **all four breakpoints**),
`config: { scrollOffsetValue: 0, scrollOffsetUnit: "%", loop: false }`,
`autoStopEventId: "e-178"`. Target
`655680f0c897c56b081e918f|eca718d8-1df3-efa3-31bc-0e8a762e2e9c` — the
`data-w-id` carried by all 40 `.qa-block`s.
Source: `beachfront-dentistry.schunk.f0bc49bb141fcb49.js` (the Webflow IX2 data
chunk, linked from `ask-the-doctor.html`). `"e-178"` appears **only** as that
reference — there is no `e-178` event object, so **the reveal plays once and
never resets on scroll-out**.

Action list `a-7` (title `"up and in"`, `useFirstGroupAsInitialState: true`):

| group             | action    | type             | value                       | easing        | duration    |
| ----------------- | --------- | ---------------- | --------------------------- | ------------- | ----------- |
| 1 (initial state) | `a-7-n`   | `TRANSFORM_MOVE` | `yValue: 4`, `yUnit: "rem"` | —             | 500         |
| 1 (initial state) | `a-7-n-3` | `STYLE_OPACITY`  | `0`                         | —             | 500         |
| 2 (play)          | `a-7-n-2` | `TRANSFORM_MOVE` | `yValue: 0`, `yUnit: "rem"` | **`outExpo`** | **2000 ms** |
| 2 (play)          | `a-7-n-4` | `STYLE_OPACITY`  | `1`                         | **`outExpo`** | **2000 ms** |

Group 1 is what Webflow serializes into the inline `style` attribute in the
shipped HTML (`transform: translate3d(0, 4rem, 0) …; opacity: 0`) — that is why
every `.qa-block` in `matching/spec/ask-the-doctor.html` carries it.

**The travel unit is `rem`, so the reveal distance is on the root-font ladder
too:**

|                 | 1440      | 834       | 390      | 768–991 band              |
| --------------- | --------- | --------- | -------- | ------------------------- |
| travel (`4rem`) | **160px** | **128px** | **96px** | 96px @768, 128px @769–991 |

`outExpo` = `cubic-bezier(0.19, 1, 0.22, 1)`. Not IntersectionObserver — Webflow
IX2 uses its own throttled scroll listener
(`Webflow.scroll` / `resize` decouplers in the IX2 chunk).

Every reveal read must wait for
`document.getAnimations().every(a => a.playState !== "running")` **and** the
2000 ms tail — at 2 s per card × 40 cards the page takes a long time to settle;
an early rect read has had the SIGN wrong on this project.

### D.2 CSS transitions on this page (no JS involved)

| element                       | property list                                                                                                                                     | source                              |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| `.qa-block`                   | `margin-top .65s ease-out, opacity .3s`; ≤479 `height .65s, margin-top .65s ease-out, opacity .3s`                                                | `beachfront.css:7202`, `:9451`      |
| `.qa-label`                   | `margin .65s ease-out`                                                                                                                            | `beachfront.css:7231`               |
| `.qa-question`                | `opacity .25s`                                                                                                                                    | `beachfront.css:7257`               |
| `.qa-answer`                  | `transform .65s cubic-bezier(.23,1,.32,1), height .65s ease-out`; **≤991 → `margin-top .65s ease-out, height .65s ease-out`** (transform dropped) | `beachfront.css:7310`, `:8326-8328` |
| `.qa-image`                   | `all .4s cubic-bezier(.55,.055,.675,.19)`                                                                                                         | `beachfront.css:7325`               |
| `.box-gradient`               | `all .65s cubic-bezier(.19,1,.22,1), border-radius .65s cubic-bezier(.95,.05,.795,.035)`; ≤479 `transition-duration:.35s`                         | `beachfront.css:7000`, `:9426`      |
| `.box-gradient-overlay`       | `all .65s cubic-bezier(.55,.055,.675,.19), border-radius .65s cubic-bezier(.95,.05,.795,.035)`                                                    | `beachfront.css:7341`               |
| `.expanding-plus`             | `opacity .65s cubic-bezier(.55,.055,.675,.19)`                                                                                                    | `beachfront.css:7057`               |
| `.button`                     | `opacity .2s, background-color .2s cubic-bezier(.215,.61,.355,1)`                                                                                 | `beachfront.css:6039`               |
| `a`                           | `opacity .2s`                                                                                                                                     | `beachfront.css:2178`               |
| `.text-color-white.mb-2` ≤991 | `margin-top 2s cubic-bezier(.19,1,.22,1)`                                                                                                         | `beachfront.css:7976-7978`          |

### D.3 "Back to Top" smooth scroll — Webflow `scroll` module

From `beachfront-dentistry.schunk.f0bc49bb141fcb49.js`, module `"scroll"`:
it binds `click.wf-scroll` to `a[href*="#"]:not(.w-tab-link):not(a[href="#"])`
and, for a same-document hash, `preventDefault()`s and animates
`window.scroll` itself:

- duration = `472.143 * Math.log(|target − current| + 125) − 2000` ms,
  multiplied by `data-scroll-time` if present (absent here);
  **0 if `prefers-reduced-motion: reduce`** or
  `body[data-wf-scroll-motion="none"]`.
- easing = `d < .5 ? 4d³ : (d−1)(2d−2)² + 1` (cubic in-out).
- offset = the `outerHeight` of `header, body > .header, body > .w-nav` **only
  when its computed `position` is `fixed`**. `.header` here is
  `position: absolute` (`beachfront.css:5836-5842`, chrome §3.2) → **offset 0**,
  so the target is `#hero`'s `offsetTop` = 0.
- it also `history.pushState`es the hash and focuses the target with
  `tabindex="-1"` + `.wf-force-outline-none`.

Separately, `a[href="#"]` gets `click.wf-empty-link` → bare `preventDefault()`.
That is what stops the nav hamburger, the panel close and both "Book
Appointment" anchors from jumping.

### D.4 `FloatingDoctor` — dead code on this page

`ask-the-doctor.html:155-157` runs
`window.onload = () => { var floatingDoc = new FloatingDoctor(); }`, loaded from
`https://raw.githack.com/tucksravin/incidental-js/main/webflow/specific/beachfront/floating-doc.js`.
The constructor does `this.anchor = $(".ask-the-doctor-handwriting-anchor")`.
**That class does not exist anywhere in `matching/spec/ask-the-doctor.html`**
(grep: 0 hits). Its scroll listener dereferences `this.anchor[0]
.getBoundingClientRect()` and therefore throws a `TypeError` on every scroll
event, swallowed per-event. Net visual effect: **none**. Do not port it, and do
not invent a "handwriting anchor" element.

### D.5 Orientation alert

`ask-the-doctor.html:138-147`: on load and on `window:resize`, if
`innerWidth < 792 && innerHeight < innerWidth` the page calls
`alert("Please use Portrait!")`. This fires on landscape phones/small landscape
viewports. It is a real live behaviour; a probe at a landscape sub-792 viewport
will block on the dialog.

---

## E. Known-suspect list

Ranked. Each is a concrete, cited thing our build is likely getting wrong.

**E1 — `.qa-block` is width-declared but flex-SHRUNK at 834.**
`beachfront.css:7199` says `width:15rem` (= 480px @834) but the parent column's
content box is only 349px, and `beachfront.css:7781-7782` makes the item a
`display:flex` container. Live renders **349px**. Any rebuild using CSS grid,
`flex-shrink:0`, or a fixed-width utility overflows the column at 834 and blows
out the 4 % side margins of `.qa-text` (§B.3.6) with it. **Highest confidence,
highest blast radius — it is inside gate region R2 where the gate cannot see it.**

**E2 — `.qa-circle` padding has FOUR values, none of them keyed at 768.**
`beachfront.css:7246` (`padding:.25rem`) / `:8316-8319` (≤991
`padding-top/bottom:.3rem`) / `:9458-9460` (≤479 `padding:.35rem .25rem`),
each × a different root font size → `10px` @1440, `9.6px 8px` @991–834,
`7.2px 6px` @768, `8.4px 6px` @390. And its **line-height and font-size break at
different viewports** — font-size steps at 992 (root ladder, `:7247` `.625rem`),
line-height steps at 991 (`h6` ≤991 `beachfront.css:7872-7875`). A two-tier
ladder is guaranteed wrong here.

**E3 — `.hero` height is a FOUR-step vw ladder with the ask-a-dentist override
only at ≤479.** `beachfront.css:5297` 33vw / `:7980-7982` 60vw / `:8438-8440`
70vw / `:9093-9095` 95vw. At 992 live is **327.36px**, at 991 it is **594.59px**
— a 267px jump across one pixel. Calibrating md at 768 puts the hero at 460.8px
and never sees either state.

**E4 — the hero→grid gap is a COLLAPSED MARGIN, not padding.**
`beachfront.css:3839-3842` (`.my-8`) on the inner `.content-width`, with
`section.questions-section` having **zero rules in the stylesheet**. Live's
section box starts at y 555.19 (= hero bottom + 80). Re-homing that 2rem as
section padding moves the section's border box by 80/64/48px and shifts the
R1/R2 gate boundary. Same at the bottom: the section's bottom edge coincides
exactly with the Back-to-Top button's bottom edge.

**E5 — `.button` is a three-tier px ladder that splits at ≤479.**
`beachfront.css:6036` 25px / `:8045-8047` 20px / `:8632-8634` 15px, plus
`:9185-9187` `.button.text-color-primary { font-size: 14px }` — so at 390 the
"Read More" buttons are **15px** and "Back to Top" is **14px**. Heights follow
via `padding:1.3em 1em` + `line-height:0`: 67 / 54 / 41 / 38.38px. A single
button component with a two-tier ladder gets the whole 768–991 band and the
390 divergence wrong at once.

**E6 — `.qa-text` has flex properties but NO `display:flex`.**
`beachfront.css:7282-7290` declares `flex-flow`, `justify-content`,
`align-items` on a `display:block` element; computed `display` is `block`
`[probed]`. Adding `display:flex` "to make it work" re-stacks the children and
moves `h5.qa-question` off its `position:absolute; bottom:0` anchor.
Related: `.qa-text` height (`8rem` → `10rem` at ≤767) and `.qa-label` height
(`2rem`) are a **coupled pair** that must sum to the card height at every tier
(`10rem` @≥768, `12rem` @≤767).

**E7 — the collapsed `.qa-answer` is in flow, unclipped, and white-on-white.**
No `overflow:hidden` anywhere in the chain (`beachfront.css:7195-7204`,
`:7282-7290`, `:7308-7312`, `:7779-7783`). `translate(0,200%)` is 200 % of the
element's **own** height, so the offset differs per card. Hiding it with
`overflow:hidden`, `visibility:hidden` or `display:none` changes the interaction
surface (it hit-tests in the row gap `[probed]`); giving the text a visible
colour produces an immediate large pixel diff.

**E8 — the `.bot-wave` SVG is JS-injected and the 180° rotation is on the
PARENT.** `ask-the-doctor.html:120-122` appends the SVG; `:20-22` rotates
`.bot-wave`; `:24-29` sizes the SVG `calc(133% + 1.3px)` × `3rem`. Same
parent-rotation trap as the CTA divider (`_chrome.md` §4.6), and the height is
another three-tier rem (120 / 96 / 72). Rendering the wave server-side inside
`.bot-wave` is fine; putting the rotation on the `<svg>` instead of the wrapper
flips the sign of the −476.5 / −276.5 / −130 x-offset.

**E9 — `.box-gradient` reverses direction on mobile, in three tiers.**
`beachfront.css:6996` (`#0000 → #129ecce6 90%`, bottom-heavy) /
`:8882-8884` (≤767 `#129eccb3 11% → #129ecc54 87% → #0000`, **top-heavy**) /
`:9424-9428` (≤479 `#129ecce6 23% → #052c3940 93% → #0000`, plus
`transition-duration:.35s`). 834 uses the **base** rule, not the ≤767 one.
`.box-gradient-overlay` also has a ≤479 variant (`:9470-9472`).

**E10 — the `.qa-answer` transition list changes at ≤991.**
`beachfront.css:7310` transitions `transform`; `beachfront.css:8326-8328`
replaces the whole list with `margin-top .65s ease-out, height .65s ease-out`,
**dropping `transform`**. So at 834/390 the expand snaps instead of sliding.
Easy to miss because the `.active` end-state is identical.

**E11 — `.expanding-minus` top is set by the PAGE's inline `<style>`, not the
stylesheet.** `beachfront.css:7085-7090` says `top:.375rem`;
`ask-the-doctor.html:84-86` overrides with `top: calc(50% - 0.0625rem)` →
10 / 8 / 6px. Grepping only `beachfront.css` gives 15 / 12 / 9px — wrong at
every tier.

**E12 — card content edge cases.** Card 40
(`6a6140a10fa6b39b68daf46e_night_pain_horizontal.jpg`) ships **no `srcset` and
no `sizes`**, unlike 01–39. Card 39's title has a **double space**
("Tooth Pain an Emergency"). Cards 19 and 31 reuse the same image file. All
three will read as content bugs unless reproduced.

**E13 — the grid stays 2-up at 834.** `beachfront.css:763-765` (`.w-col-6
{ width:50% }`) is only cancelled at `beachfront.css:877-881` (≤767). A
mobile-first rebuild that goes 1-up below 992 produces 40 rows where live has
20, and a `scrollHeight` of ~14 000 instead of 10 845.

---

### `[probed-only]` inventory for this page

Values with no stylesheet line, recorded from live and marked as such:

1. The `.qa-block` inline `style` attribute (IX2 serialized initial state) —
   derived from `a-7` in the IX2 JS chunk, quoted in §D.1.
2. Every `rect{x,y,w,h}` in this file (they are _outcomes_ of the cited rules,
   never sources).
3. `document.body.scrollHeight` 13057 / 10845 / 14091.
4. The `.qa-block` flex-shrink result (349px @834) — the shrink is CSS-derived
   but the resulting pixel value is only obtainable by layout.
5. `.expanding-minus` rendered heights 4.80 / 3.84 / 2.88px — the SVG's intrinsic
   aspect ratio, not a declared value.
6. `.qa-answer` rendered heights (183.5 / 160 / 120px) and therefore the
   `translate(0,200%)` pixel offsets — text-length dependent, per card.
7. Open-state geometry in §B.3.9.
8. The row-gap hit-test returning `P.text-color-white mb-2 text-body` (§B.3.8).
