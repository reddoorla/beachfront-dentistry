## shared chrome

Site-wide furniture that renders identically on all 9 pages. The nine page
specs reference this section instead of restating it.

**Governing rule (CLAUDE.md #1): source prescribes, rects only verify.** Every
value below carries a `beachfront.css:<line>` or `index.html:<line>` citation.
Values that genuinely exist only as computed output (Webflow IX2 inline styles,
jQuery-set values, margin-collapse results) are tagged `[probed-only]` and are
the _only_ numbers here without a line.

Structural sample: `matching/spec/index.html`.
Probe: `https://www.beachfrontdentistry.com/` at 1440 / 834 / 390, scrolled in
250px steps then held until `document.getAnimations()` reported nothing
running (the CTA band's reveal is a 2000ms outExpo — an unsettled read has the
sign of its y-offset wrong).

---

### 0. Provenance — this markup is byte-identical on every page EXCEPT `.form-modal`

Normalized (`data-w-id`, `aria-current="page"`, `w--current`, and `<br/>` vs
`<br>` serialization stripped), `<section class="header">…</section>` and
`<section class="footer">…</section>` hash identically across
`index.html`, `our-team.html`, `contact-us.html`, `ask-the-doctor.html`,
`your-first-visit.html`, `services-live.html`, `detail-svc.html`,
`detail-team.html`, `detail-qa.html`. The only per-page variance is:

- `data-w-id` GUIDs (Webflow re-mints per page; behavior is identical),
- `aria-current="page"` + `w--current` on whichever nav link is active.

`.dropdown-modal` and `.footer-cols` are present on all 9, and every page's
`.header` carries the same 11 links `[probed live 2026-08-05]`.

**`.form-modal` is NOT present on all 9 — corrected 2026-08-05.** This file
previously recorded its absence from `detail-svc.html` / `detail-team.html` as
"an artifact of the capture, not of the site". That was wrong, and it was wrong
in the direction that hides a defect. Probed on LIVE with a 2.5s settle
(`matching/probe-chrome-count.mjs` and the follow-up in the ledger):

| page                                                                                                     | `.form-modal` | `.show-form` triggers |
| -------------------------------------------------------------------------------------------------------- | ------------- | --------------------- |
| `/`, `/your-first-visit`, `/our-team`, `/services`, `/ask-the-doctor`, `/contact-us`, `/questions/<uid>` | PRESENT       | 2–3                   |
| `/services/<uid>`                                                                                        | **ABSENT**    | 2                     |
| `/team-members/<uid>`                                                                                    | **ABSENT**    | 2                     |

So live ships two dead "Book Appointment" buttons on each of those two
templates: the click handler runs and finds nothing to open. Phase 5 must NOT
record that as a passing state, and reproducing it is an operator decision (see
LEDGER) — our build opens a real modal there, which is a divergence FROM live
in the user's favour.

One more counting trap: a page's `.footer` sometimes shows 13 links instead of 10. The extra three (`Terms`, `Report a map error`, and an unlabelled map link)
are Google Maps' own runtime DOM inside the embed, not chrome — the same
cross-origin iframe that is already a declared floor. Count 10.

---

### 1. THE ROOT-FONT LADDER (why every rem below has three values)

Live ships an inline `<style>` in `<head>` that steps the root font-size:

| rule                                                     | source                                                              |
| -------------------------------------------------------- | ------------------------------------------------------------------- |
| `html { font-size: 40px }`                               | `index.html:2-4` (repeated `index.html:62`)                         |
| `@media (max-width: 992px) { html { font-size: 32px } }` | `index.html:8-10` (repeated `index.html:64-66`)                     |
| `@media (max-width: 768px) { html { font-size: 24px } }` | `index.html:12-14` (repeated `index.html:68-70`)                    |
| `@media (max-width: 480px) { html { font-size: 24px } }` | `index.html:16-18` (repeated `index.html:72-74`) — no-op, same 24px |

Webflow's class rules break one pixel earlier:
`beachfront.css:7852` (`max-width: 991px`), `:8372` (`767px`), `:9011` (`479px`),
plus a second 991 block at `:9611`.

**The ladders are offset by 1px, so every rem resolves to THREE pixel values.**

| viewport | root     | Webflow tiers active                               |
| -------- | -------- | -------------------------------------------------- |
| ≥993     | 40px     | desktop base only                                  |
| 992      | **32px** | **desktop base only** ← the trap band's upper edge |
| 991–769  | 32px     | ≤991                                               |
| 768      | **24px** | **≤991** ← the trap band's lower edge              |
| 767–480  | 24px     | ≤991, ≤767                                         |
| ≤479     | 24px     | ≤991, ≤767, ≤479                                   |

Gate matrix resolution used throughout this file:

| rem       | 1440 (root 40) | 834 (root 32) | 390 (root 24) |
| --------- | -------------- | ------------- | ------------- |
| `.5rem`   | 20px           | 16px          | 12px          |
| `.625rem` | 25px           | 20px          | 15px          |
| `.75rem`  | 30px           | 24px          | 18px          |
| `1rem`    | 40px           | 32px          | 24px          |
| `1.5rem`  | 60px           | 48px          | 36px          |
| `2rem`    | 80px           | 64px          | 48px          |
| `3rem`    | 120px          | 96px          | 72px          |
| `4rem`    | 160px          | 128px         | 96px          |
| `20rem`   | 800px          | 640px         | 480px         |

Calibrate md at **834, never 768**; lg at **1200/1440, never 992**. A two-tier
ladder keyed at 768 leaves the whole 768–991 band rendering desktop values.

**Measured proof of the offset** (probed at 7 widths, home page):

| viewport | root                       | `.content-width` pad-x | CTA `h2`                       | footer columns                         |
| -------- | -------------------------- | ---------------------- | ------------------------------ | -------------------------------------- |
| 1440     | 40px                       | 60px                   | 140px                          | 3-up (422 / 422 / 422)                 |
| **992**  | **32px**                   | **48px**               | **140px** ← still desktop type | **3-up** (296 / 296 / 296)             |
| **991**  | 32px                       | 48px                   | **72px** ← Webflow tier fires  | **2-up** (295 / 295 / **591 wrapped**) |
| 834      | 32px                       | 48px                   | 72px                           | 2-up (244 / 244 / **487 wrapped**)     |
| **768**  | **24px** ← root tier fires | **36px** ← not 48      | 72px                           | 2-up (230 / 230 / **459 wrapped**)     |
| **767**  | 24px                       | **61.36px** (8%)       | 72px                           | 1-up (425 / 425 / 425)                 |
| 390      | 24px                       | 19.5px                 | 50px                           | 1-up (351 / 351 / 351)                 |

Read the 992 and 768 rows together: at 992 the _root_ has already stepped down
but _no Webflow rule_ has, and at 768 the root steps down again while the
Webflow tier is still the ≤991 one. Neither state is reachable by a two-tier
ladder. `.content-width` pad-x alone takes **four** distinct values across
768–1440 (60 / 48 / 36), and the footer takes **three** layouts across
767–992 (3-up / 2-up / 1-up).

---

### 2. `.content-width` — the site-wide container

Source: `beachfront.css:5858-5867`

```
.content-width { width:100%; max-width:1400px; height:100%;
                 margin-left:auto; margin-right:auto;
                 padding-left:1.5rem; padding-right:1.5rem;
                 position:relative; }
```

Padding-x overrides:

- `beachfront.css:8627-8630` (≤767) → `padding-left/right: 8%`
- `beachfront.css:9164-9167` (≤479) → `padding-left/right: 5%`

Resolved ladder (max-width is a constant 1400px at every tier):

|                | 1440                  | 834       | 390        |
| -------------- | --------------------- | --------- | ---------- |
| declared       | `1.5rem`              | `1.5rem`  | `5%`       |
| **padding-x**  | **60px**              | **48px**  | **19.5px** |
| box width      | 1400 (centered, x=20) | 834 (x=0) | 390 (x=0)  |
| content column | 1280                  | 738       | 351        |

Verified rects `[probed]`: header `.content-width` 1440 `{x:20,w:1400}` pl=60 ·
834 `{x:0,w:834}` pl=48 · 390 `{x:0,w:390}` pl=19.5.

**Trap-band note:** the 8% rule does NOT start until 767. At 768–991
`.content-width` is still `1.5rem`, which resolves to **48px** (root 32) —
except at exactly 768 where root drops to 24px and it resolves to **36px**.
Any md implementation keyed at 768 produces 36px where live renders 48px.

Modifiers:

- `.content-width.display-flex.flex-justify-between.flex-align-center`
  `beachfront.css:5869-5873` → `margin-top/bottom: auto; position: relative`;
  ≤991 override `beachfront.css:8032-8034` → `margin-top: auto` only.
- `.content-width.flex-align-center.flex-justify-between.header-top`
  `beachfront.css:5875-5879` → `height: 3rem; position: absolute; top: 0`
  (used by the form modal's own top bar).
- `.max-w-1280 { max-width: 1280px }` `beachfront.css:5844-5846` — the only
  other shared container cap; `.modal-form-container` uses the same 1280
  (`beachfront.css:7466-7474`).

Other shared containers: `.footer-info-section` `beachfront.css:5848-5852`
(`background: var(--primary-light); position: relative`),
`.display-flex` `beachfront.css:3023` (`flex-wrap: wrap; display: flex`),
`.position-relative` `beachfront.css:4291`,
`.m-auto` `beachfront.css:3750`.

There is also a JS-computed container alignment helper used by non-chrome
sliders: `getContentWidthMargin()` in `matching/spec/incidental-utils.js`,
which reads `.content-width`'s live `max-width` and `padding-left` and returns
`(innerWidth - maxWidth)/2 + paddingLeft` (or just `paddingLeft` when the
viewport is narrower than max-width). It is invoked at `index.html:177-183`.
Any reimplementation of `.content-width` must keep those two computed values
correct or the sliders drift too.

---

### 3. NAV / header

#### 3.1 Markup (`index.html:113`, one line, minified)

```
<section class="header">
  <div class="content-width display-flex flex-justify-between flex-align-center">
    <a href="/" class="link-block-5 w-inline-block"><img class="header-logo" src="…logo=white.svg"></a>
    <a href="#" class="link-block-4 w-inline-block"><img class="header-hamburger" data-w-id="d74a87ea-…" src="…menu=white, state=idle.svg"></a>
  </div>
  <div class="dropdown-modal">
    <div class="modal-link-container">
      <a class="no-text-dec"><h3 class="modal-link">Home Page</h3></a>
      … First Visit / Meet Our Team / Services / Ask the Doctor / Contact / (310) 378-9241
      <a class="button text-color-primary-dark show-form nav w-button">Book an Appointment</a>
      <a href="https://app.modento.io/beachfront-dentistry" class="button text-color-primary-dark nav w-button">Make a Payment</a>
    </div>
    <div class="content-width">
      <div class="position-absolute-top-left"><img class="header-logo" src="…logo=white.svg"></div>
      <div class="position-absolute-top-right"><img class="header-hamburger" data-w-id="8dfa6638-…" src="…menu=white, state=active.svg"></div>
    </div>
  </div>
</section>
```

The seven `<h3 class="modal-link">` links and the two nav buttons live in the
DOM at all viewports, offscreen. **They therefore appear in text/content diffs
on every page.** Any reimplementation must render the same 9 strings inside the
off-canvas panel, in this order, or content diffs will never close:

`Home Page` · `First Visit` · `Meet Our Team` · `Services` · `Ask the Doctor` ·
`Contact` · `(310) 378-9241` · `Book an Appointment` · `Make a Payment`

Note the panel is present at **all** widths, not just ≤991. There is no
separate desktop nav — the hamburger is the only nav affordance at 1440 too.

#### 3.2 Header bar geometry

`.header` — `beachfront.css:5836-5842`: `z-index:10; width:100%; height:3rem;
position:absolute; top:0`.

`position: absolute` (not fixed, not sticky) — the header **scrolls away**.
Verified `[probed]` at 1440: after scrolling to 8087 the header rect y is
−8087, i.e. it stays pinned to document top.

|                           | 1440             | 834            | 390            |
| ------------------------- | ---------------- | -------------- | -------------- |
| `.header` height (`3rem`) | **120px**        | **96px**       | **72px**       |
| `.header` rect            | `{0,0,1440,120}` | `{0,0,834,96}` | `{0,0,390,72}` |

`.header-logo` — `beachfront.css:6090-6094`: `cursor:pointer; width:2rem;
transition: opacity .35s cubic-bezier(.215,.61,.355,1)`.
≤991 `beachfront.css:8059-8062` → `width:2rem; margin-top:.5rem`.
≤479 `beachfront.css:9196-9198` → `width:2rem`.
`.header-logo.su-display-none-mobile { display:none }` `beachfront.css:6104`,
restated ≤767 `beachfront.css:8649-8651` (used only by the form modal bar).

|                 | 1440                  | 834                | 390                     |
| --------------- | --------------------- | ------------------ | ----------------------- |
| width (`2rem`)  | **80px**              | **64px**           | **48px**                |
| margin-top      | 0                     | `.5rem` = **16px** | `.5rem` = **12px**      |
| rect `[probed]` | `{80, 21.45, 80, 80}` | `{48, 24, 64, 64}` | `{19.5, 21.38, 48, 48}` |

The fractional y comes from the img sitting on the inline-block anchor's
baseline inside an `align-items:center` flex row — reproduce the box model, do
not hardcode the y. `[probed-only]` for the exact y.

`.header-hamburger` — `beachfront.css:6108-6112`: `cursor:pointer; width:1rem;
transition: opacity .35s cubic-bezier(.215,.61,.355,1)`.
≤991 `beachfront.css:8068-8070` → `width:1rem` (unchanged).

|                 | 1440                 | 834                      | 390                         |
| --------------- | -------------------- | ------------------------ | --------------------------- |
| width (`1rem`)  | **40px**             | **32px**                 | **24px**                    |
| rect `[probed]` | `{1320, 49, 40, 31}` | `{754, 36.36, 32, 24.8}` | `{346.5, 30.08, 24, 18.59}` |

Height is the SVG's intrinsic aspect (0.775×width), not a declared value.

`.link-block-4, .link-block-5 { background-color: #0000 }`
`beachfront.css:7709-7711` — this is what kills the `a { background-color:
#129ecc0d; border-radius: 5px }` default from `beachfront.css:2174-2179`.

Asset URLs (idle hamburger vs. active X are two different files):

- logo `…64b05fba026f33ef80c866b8_logo%3Dwhite.svg`
- idle `…64b05fbaef335a499638ada7_menu%3Dwhite%2C%20state%3Didle.svg`
- active/X `…64b05fba486da5a75e84f0f1_menu%3Dwhite%2C%20state%3Dactive.svg`

#### 3.3 The off-canvas panel: the negative-y offscreen positioning

`.dropdown-modal` — `beachfront.css:6390-6401`:

```
z-index: 20;
background-color: var(--primary);                       /* #129ecc */
background-image: linear-gradient(#129ecceb, #129ecceb),
                  url("…64b1bd0a4059869bce02c730_beach-img_elizeu-dias-RN6ts8IZ4_0-unsplash.jpg");
background-position: 0 0, 50%;
background-size: auto, cover;
width: 100vw; height: 100vh;
position: fixed; top: -150vh; left: 0;
```

**`top: -150vh` is the offscreen mechanism** (`beachfront.css:6399`). It is
_not_ `display:none`, _not_ `visibility:hidden`, _not_ `opacity:0` — the panel
is fully rendered and its text is in the accessibility/text layer at all times.
Measured closed rect at every width: `{x:0, y:-1350, w:<vw>, h:900}` for a
900px-tall viewport (`-150vh` = −1350px). This is exactly why the nav link
strings show up in text diffs; a rebuild that hides the panel with `display:none`
will _fail_ content parity in the opposite direction.

`.modal-link-container` — `beachfront.css:6403-6416`:
`z-index:10; grid-column-gap:10px; grid-row-gap:10px; flex-direction:column;
justify-content:space-between; align-items:center; width:100vw; height:60vh;
display:flex; position:absolute; top:10%; bottom:20%`.
At 900px viewport height `[probed]`: top 90px, height 540px, identical at all
three widths. Link y-positions are **derived from `space-between`**, not
declared — do not hardcode them.

`.position-absolute-top-left` — `beachfront.css:5484-5487`: `position:absolute;
inset: 0% auto auto 0%`. ≤767 `beachfront.css:8490-8492` → `left: 8%`;
≤479 `beachfront.css:9109-9111` → `left: 8%`.
`.position-absolute-top-right` — `beachfront.css:5489-5492`: `inset: 0% 0% auto
auto`. ≤767 `beachfront.css:8494-8496` → `right: 8%`.

Close-affordance rects when open `[probed]`:

|      | 1440                   | 834                     | 390                       |
| ---- | ---------------------- | ----------------------- | ------------------------- |
| logo | `{20, 2.9, 80, 80}`    | `{0, 18.9, 64, 64}`     | `{31.2, 24.9, 48, 48}`    |
| X    | `{1380, 26.9, 40, 32}` | `{802, 30.1, 32, 25.6}` | `{334.8, 33.3, 24, 19.2}` |

390's `31.2` = 8% of 390 (`beachfront.css:9109`); `334.8` = 390 − 31.2 − 24
(`beachfront.css:8494`).

#### 3.4 Open state + transition timing (Webflow IX2, `[probed-only]`)

Read from `Webflow.require("ix2").store.getState().ixData`. There is no CSS
transition on `.dropdown-modal` — the motion is entirely IX2, so these values
cannot be cited to the stylesheet.

| action list | title            | trigger                                                                                        | effect                                                                                                    |
| ----------- | ---------------- | ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `a-4`       | `show-nav-modal` | `MOUSE_CLICK` on `d74a87ea-…` (the idle hamburger, `.link-block-4 .header-hamburger`)          | `TRANSFORM_MOVE` on `.dropdown-modal`, `yValue: 150`, `yUnit: vh`, **duration 500ms**, **easing `ease`**  |
| `a-3`       | `hide-nav-modal` | `MOUSE_CLICK` on `8dfa6638-…` (the active X, `.position-absolute-top-right .header-hamburger`) | `TRANSFORM_MOVE` on `.dropdown-modal`, `yValue: -150`, `yUnit: vh`, **duration 500ms**, **easing `ease`** |

These are **absolute** transform targets, not deltas. Net positions:

| state             | `top`    | `transform`                                     | resulting rect y             |
| ----------------- | -------- | ----------------------------------------------- | ---------------------------- |
| initial           | `-150vh` | `none`                                          | −1350 (900vh viewport)       |
| open              | `-150vh` | `translateY(+150vh)` → `matrix(1,0,0,1,0,1350)` | **0**                        |
| closed-after-open | `-150vh` | `translateY(-150vh)`                            | **−2700** (double offscreen) |

Verified open rect `[probed]`: `{x:0, y:0, w:<vw>, h:900}` at all three widths;
`display` stays `block` and `opacity` stays `1` throughout.

Open-state link metrics `[probed]`, 900px viewport:

|                       | 1440                              | 834                               | 390         |
| --------------------- | --------------------------------- | --------------------------------- | ----------- |
| `.modal-link` font/lh | 40 / 50px                         | 21 / 26px                         | 21 / 26px   |
| link y ladder         | 110, 200, 290, 380, 470, 560, 650 | 110, 176, 242, 308, 374, 440, 506 | same as 834 |
| button y              | 740, 846                          | 572, 666                          | 572, 650.4  |

834 and 390 share the same type and the same y ladder — the panel's layout is
viewport-height-driven (`60vh` + `space-between`), so only the button heights
differ between them.

#### 3.5 `.modal-link` type

`beachfront.css:6418-6422`: `color:#fff; cursor:pointer; transition: opacity .35s`.
Everything else inherits `h3` — `beachfront.css:2124-2132`:
`color: var(--primary); margin: 20px 0 10px; font-family: museo-slab, sans-serif;
font-size: 40px; font-weight: 300; line-height: 50px`.
≤991 `beachfront.css:7863-7866` → `font-size: 21px; line-height: 26px`.
There is **no ≤767 and no ≤479 h3 override**, so 834 and 390 are identical.

|                 | 1440                             | 834      | 390      |
| --------------- | -------------------------------- | -------- | -------- |
| font-size       | **40px**                         | **21px** | **21px** |
| line-height     | **50px**                         | **26px** | **26px** |
| weight / family | 300 / museo-slab                 | ←        | ←        |
| color           | `#fff` (`:6419`)                 | ←        | ←        |
| margin          | 20px / 10px (`h3`, `:2126-2127`) | ←        | ←        |

`.no-text-dec { background-color:#0000; text-decoration:none }`
`beachfront.css:6575-6578` — the wrapping anchors.

#### 3.6 The appointment form modal (nav-adjacent shared chrome)

`.form-modal` — `beachfront.css:7443-7456`: `z-index:12;
background-color: var(--primary-light); opacity:1; justify-content:center;
align-items:center; width:100vw; height:100vh; **margin-top:-150vh**;
display:flex; position:fixed; top:0; left:0`.
`.form-modal.working { margin-top: 0 }` `beachfront.css:7458-7460`.

Same negative-offset trick as the nav, this time on `margin-top`. Driven by two
mechanisms simultaneously:

1. **jQuery** (`index.html:149-159`): `.show-form` click → `$(".form-modal").css("opacity","1")`;
   `.hide-form` click → opacity 0.
2. **IX2** `[probed-only]`: `a-5` `show-form-modal` → `TRANSFORM_MOVE` on
   `.form-modal`, `yValue: 150 vh`, **500ms**, easing unset (linear).
   `a-6` `hide-form-modal` → `yValue: -150 vh`, **500ms**.
   Triggers for `a-5`: `6eca16bd-…` (nav "Book an Appointment"),
   `1273e294-…4f60` (CTA "Book Appointment"), `b1ce8885-…` (footer
   "Make a Payment"). Trigger for `a-6`: `b914d569-…` (the modal's own X).

`.modal-form-container` `beachfront.css:7466-7474`: `flex-direction:column;
justify-content:flex-start; width:100%; max-width:1280px; height:80vh;
padding: 0 2rem` → padding-x **80 / 64 / 48px**. ≤479 `beachfront.css:9474-9477`
→ `padding-left/right: 8%` = 31.2px at 390.

`.appt-form-label` `beachfront.css:7476-7482`: `color: var(--primary-dark);
margin-top: 1rem; margin-bottom: 10px; font-size: .5rem; line-height: 1.1em`.
**A rem-sized font — three tiers: 20px / 16px / 12px**, line-height 22 / 17.6 /
13.2px, margin-top 40 / 32 / 24px.
`.appt-form-block { width: 100% }` `beachfront.css:7484-7486`.
`.w-input:focus, .w-select:focus { border-color:#3898ec; outline:0 }`
`beachfront.css:536-539` — the only focus styling in the modal.
Modal heading is a bare `<h3>Request Appointment</h3>` (see 3.5 ladder).

---

### 4. CLOSING CTA BAND — "Ready for great dental health?"

The CTA is the first half of `<section class="footer">`; it is not a separate
section. Structure (`index.html`, one line — see the extracted tail):

```
<section class="footer">
  <div class="cta-section"></div>                       ← empty, height 0
  <h2 data-w-id="1273e294-…4f5b" class="text-align-center my-4">Ready for <br>great dental <br>health?</h2>
  <div class="fiji-section">
    <div class="footer-white-to-trans-gradient">
      <div class="content-width">
        <div data-w-id="…4f5f" class="display-flex flex-align-center flex-justify-center mt-8">
          <a data-w-id="…4f60" href="#" class="button text-color-primary-dark show-form w-button">Book Appointment</a>
        </div>
        <div data-w-id="…4f62" class="display-flex flex-align-center flex-justify-center mt-3">
          <div data-w-id="9daf7a34-…" class="block-link social-link-block">
            <h5 class="services-links text-size-25-px slab text-color-primary-dark">Read Reviews</h5>
            <div class="plus-minus-block"><img class="expanding-plus"><img class="expanding-minus"></div>
            <div class="socials-container"> Google / Facebook / Yelp </div>
          </div>
        </div>
        <div data-w-id="…4f6a" class="cta-beach-label">FIJI ISLANDS</div>
      </div>
    </div>
    <div class="content-width position-relative"></div>
  </div>
  <div class="footer-info-section"> … </div>
</section>
```

`.cta-section` has **no rule anywhere in `beachfront.css`** (grep returns
nothing). It is a zero-height spacer div. Measured h=0 at all three widths.
Do not invent padding for it.

#### 4.1 Heading — the hard `<br>` line breaks

Live hard-wraps into exactly three lines with two literal `<br>` elements:

```
Ready for <br>great dental <br>health?
```

Note the **trailing space before each `<br>`** ("Ready for ", "great dental ").
`innerHTML` verified identical at 1440 / 834 / 390 and across all page captures
(only `<br/>` vs `<br>` serialization differs by capture method). Rendered text
content is `Ready for great dental health?`. Any soft-wrapping reimplementation
will diverge at 834 where the heading would otherwise fit differently.

Type: `<h2 class="text-align-center my-4">`

- `h2` base `beachfront.css:2114-2122`: `color: var(--primary); margin:20px 0 10px;
font-family: museo-slab, sans-serif; font-size:140px; font-weight:100;
line-height:168px`
- ≤991 `beachfront.css:7858-7861` → `font-size:72px; line-height:80px`
- ≤479 `beachfront.css:9012-9016` → `overflow-wrap:anywhere; font-size:56px;
line-height:70px`
- ≤479 **`.text-align-center.my-4`** `beachfront.css:9055-9058` →
  `font-size:50px; line-height:1.2em` — **higher specificity, this wins at 390**
- `.text-align-center` `beachfront.css:4460-4463`: `text-align:center;
text-decoration:none`; ≤479 `beachfront.css:9042-9044` adds `white-space:normal`
- `.my-4` `beachfront.css:3824-3827`: `margin-top:1rem; margin-bottom:1rem`

|                            | 1440                       | 834       | 390              |
| -------------------------- | -------------------------- | --------- | ---------------- |
| font-size                  | **140px**                  | **72px**  | **50px**         |
| line-height                | **168px**                  | **80px**  | **60px** (1.2em) |
| weight / family            | 100 / museo-slab           | ←         | ←                |
| color                      | `var(--primary)` `#129ecc` | ←         | ←                |
| margin-y (`1rem`)          | **40px**                   | **32px**  | **24px**         |
| measured block h (3 lines) | **504px**                  | **240px** | **180px**        |

**Trap-band note:** at 992 this heading is still 140/168 (root 32 does not
matter — the sizes are px), and only drops to 72/80 at 991. At 480–767 it is
72/80. A ladder keyed at 768 renders 140px across 768–991.

#### 4.2 The photo band and its gradient

`.fiji-section` `beachfront.css:6271-6280`:

```
z-index:0;
background-image: url("…64af4c2e1e0b9ad3d901241e_beach-img_sebastien-jermer-n7DY58YFg9E-unsplash.jpg");
background-position: 50%; background-size: 100%;
height: 20rem; margin-top: 1rem; margin-bottom: -10%; position: relative;
```

≤767 `beachfront.css:8679-8681` → `height: 70vw`.

|                        | 1440                | 834                 | 390                |
| ---------------------- | ------------------- | ------------------- | ------------------ |
| height                 | `20rem` = **800px** | `20rem` = **640px** | `70vw` = **273px** |
| margin-top (`1rem`)    | **40px**            | **32px**            | **24px**           |
| margin-bottom (`-10%`) | **−144px**          | **−83.39px**        | **−39px**          |

`-10%` is a **percentage margin, so it resolves against the containing block's
WIDTH**, not height: 10% of 1440 / 833.9 / 390. This is the single easiest
value on this band to get wrong.

`.footer-white-to-trans-gradient` `beachfront.css:6282-6289`:
`z-index:1; background-image: linear-gradient(#fff 12%, #0000 91%);
width:100%; height:80%; margin-top:-1rem; position:absolute`.

|                      | 1440      | 834       | 390          |
| -------------------- | --------- | --------- | ------------ |
| height (80% of fiji) | **640px** | **512px** | **218.39px** |
| margin-top (`-1rem`) | **−40px** | **−32px** | **−24px**    |

#### 4.3 Button + reviews row spacing

`.mt-8` `beachfront.css:3925-3927` → `margin-top: 2rem` = **80 / 64 / 48px**
`.mt-3` `beachfront.css:3905-3907` → `margin-top: .75rem` = **30 / 24 / 18px**

The `.mt-8` margin **collapses out through the enclosing `.content-width`**
(no padding-top / border-top on it), pushing the container's border box down by
that amount `[probed-only]`. Measured `.footer-white-to-trans-gradient >
.content-width` rect y: 7656.75 (gradient y 7576.75 + 80) at 1440;
7877.19 (+64) at 834; 6630.05 (+48) at 390.

This matters because `.cta-beach-label` is positioned against that container.

At 390 the CTA button carries two extra margins:
`.button.text-color-primary-dark { margin-bottom: 60px }` `beachfront.css:8636-8638`
(≤767) and `.button.text-color-primary-dark.show-form { margin-top: -20px }`
`beachfront.css:9181-9183` (≤479). Measured wrapper height at 390 = **78.375px**
= 38.375 (button) + 60 − 20. The button's rect y (6610.05) is therefore **above**
its own wrapper's y (6630.05).

#### 4.4 "Read Reviews" toggle

`.services-links` `beachfront.css:6222-6230`: `color:#fff; margin-top:0;
margin-bottom:0; margin-right:10px; font-size:14px; line-height:2.75em;
text-decoration:none`
`.services-links.text-size-25-px` `beachfront.css:6232-6234` → `font-size:24px`
`.services-links.text-size-25-px.slab` `beachfront.css:6236-6242` →
`text-transform:none; margin-right:.25rem; font-family:museo-slab, sans-serif;
font-size:25px; position:relative`
`.services-links.text-size-25-px.slab.text-color-primary-dark`
`beachfront.css:6244-6248` → `color: var(--primary-dark); cursor:pointer;
margin-right:.75rem`

- ≤991 `beachfront.css:8110-8112` → `.slab { font-size: 20px }`
- ≤767 `beachfront.css:8671-8673` → `.slab { font-size: 15px }`
- ≤479 `beachfront.css:9224-9226` → `.slab { font-size: 10px }` **but**
  `beachfront.css:9228-9230` → `.slab.text-color-primary-dark { font-size: 14px }`
  wins on specificity

|                         | 1440             | 834           | 390            |
| ----------------------- | ---------------- | ------------- | -------------- |
| font-size               | **25px**         | **20px**      | **14px**       |
| line-height (`2.75em`)  | **68.75px**      | **55px**      | **38.5px**     |
| margin-right (`.75rem`) | **30px**         | **24px**      | **18px**       |
| measured box            | `165.31 × 68.75` | `132.25 × 55` | `92.58 × 38.5` |

`.block-link` `beachfront.css:6191-6197`: `white-space:nowrap;
background-color:#0000; align-items:center; display:flex; position:relative`.
≤479 `.block-link.social-link-block { margin-top: -10px }` `beachfront.css:9215-9217`.

`.plus-minus-block` `beachfront.css:7072-7079`: `cursor:pointer; object-fit:fill;
width:.625rem; height:.625rem; position:relative; overflow:visible`
→ **25 / 20 / 15px** square. Measured exactly.
`.expanding-plus` `beachfront.css:7054-7062` (`transform: rotate(90deg)`,
`transition: opacity .65s cubic-bezier(.55,.055,.675,.19)`);
`.expanding-plus.active { opacity: 0 }` `beachfront.css:7064-7066`.
`.expanding-minus` `beachfront.css:7085-7090` plus the inline
`.expanding-minus { top: calc(50% - 0.0625rem) }` at `index.html:84-86`
(`[probed-only]` for the resolved 2.5 / 2 / 1.5px offset).

`.socials-container` `beachfront.css:7541-7551`: `opacity:0;
justify-content:space-between; width:200%; height:100%;
transition: opacity 2s cubic-bezier(.19,1,.22,1); display:none;
position:absolute; bottom:-80%; left:-50%`
`.socials-container.active { opacity:1; bottom:-120% }` `beachfront.css:7553-7556`

- ≤767 `beachfront.css:8935-8938` → `width:120%; left:-10%`
- ≤479 `beachfront.css:9495-9497` → `bottom:-50%`

Toggle mechanism: `$('.social-link-block').click(toggle)` at `index.html:172`,
where `toggle` (defined in `matching/spec/incidental-utils.js`) adds/removes
`.active` on the clicked element **and every descendant**. IX2 additionally
runs `a-8` / `a-9` `[probed-only]`:

- `a-8` `open-footer-socials` (MOUSE_CLICK on `9daf7a34-…`): opacity→1 over
  **2000ms outExpo**, `display: flex` at 0ms, `translateY(+40%)` over
  **2000ms outExpo**
- `a-9` `close-footer-socials` (MOUSE_SECOND_CLICK): `translateY(0)` **2000ms
  outExpo**, opacity→0 **500ms outExpo**, then `display: none`

Social icons: `._w-8 { width: 2rem }` `beachfront.css:3463-3465` → 80/64/48;
`._w-8.clickable` `beachfront.css:3467-3472` (`transition: opacity .2s`);
≤479 `._w-8.clickable.su-w-6-portrait { width: 1.5rem }` `beachfront.css:9034-9036`
→ 36px at 390.

#### 4.5 `.cta-beach-label` — "FIJI ISLANDS"

`beachfront.css:6372-6379`: `color:#fff; font-size:25px; line-height:1.15em;
position:absolute; bottom:20%; left:60px`

- ≤991 `beachfront.css:8138-8140` → `font-size: 20px`
- ≤767 `beachfront.css:8714-8717` → `font-size: 15px; left: 8%`
- ≤479 `beachfront.css:9248-9251` → `font-size: 10px; left: 5%`

|                            | 1440                                                | 834                        | 390                           |
| -------------------------- | --------------------------------------------------- | -------------------------- | ----------------------------- |
| font-size                  | **25px**                                            | **20px**                   | **10px**                      |
| line-height (`1.15em`)     | **28.75px**                                         | **23px**                   | **11.5px**                    |
| family / weight            | museo-sans / 300 (body, `beachfront.css:2096-2102`) | ←                          | ←                             |
| left                       | 60px                                                | 60px                       | 5% = **19.5px**               |
| `bottom: 20%` of container | **128px**                                           | **102.39px**               | **43.67px**                   |
| measured rect              | `{80, 8140, 145.73, 28.75}`                         | `{60, 8263.8, 116.59, 23}` | `{19.5, 6793.27, 58.3, 11.5}` |

Containing block is the `.content-width` inside the gradient — whose top is
displaced downward by the collapsed `.mt-8` (see 4.3). Reproduce the box model;
do not hardcode `top`.

#### 4.6 The wave / shape divider — **`rotate(180deg)` is on the PARENT wrapper**

The divider is declared in the page's inline `<head>` style, not in
`beachfront.css`. Markup at `index.html` inside `<div class="footer-wave-embed
w-embed">`, at the very top of `.footer-info-section`.

```
.custom-shape-divider-bottom-1689290473 {           /* index.html:39-48 */
  position: absolute; left: 0; width: 100%;
  overflow: hidden; line-height: 0;
  transform: rotate(180deg);                        /* index.html:45  ← THE PARENT ROTATE */
  margin-top: -4rem;                                /* index.html:46 */
}
.custom-shape-divider-bottom-1689290473 svg {       /* index.html:49-54 */
  position: relative; display: block;
  width: calc(169% + 1.3px);
  height: 4rem;
}
.custom-shape-divider-bottom-1689290473 .shape-fill { fill: #e7f5fa; }  /* index.html:56-58 */
```

`#e7f5fa` = `var(--primary-light)` = `.footer-info-section`'s own background
(`beachfront.css:5849`), verified computed `rgb(231,245,250)` on both.

SVG: `viewBox="0 0 1200 120"`, `preserveAspectRatio="none"`, single path
`M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z`

|                                      | 1440                    | 834           | 390          |
| ------------------------------------ | ----------------------- | ------------- | ------------ |
| wrapper height / svg height (`4rem`) | **160px**               | **128px**     | **96px**     |
| wrapper `margin-top` (`-4rem`)       | **−160px**              | **−128px**    | **−96px**    |
| svg width `calc(169% + 1.3px)`       | **2434.89px**           | **1410.75px** | **660.39px** |
| computed wrapper transform           | `matrix(-1,0,0,-1,0,0)` | ←             | ←            |
| svg rect x after rotation            | **−994.89**             | **−576.75**   | **−270.39**  |

The rotation is applied to the **wrapper**, so the SVG's post-transform x is
`wrapperWidth − svgWidth` and the _right_ end of the (mirrored) wave is what
renders. A rebuild that puts `rotate(180deg)` on the `<svg>` instead will place
the visible portion at the opposite end and mirror the crest positions.

Sibling pattern, same inline block, used by hero sections (not chrome, listed
so the two are not confused):
`.bot-wave { transform: rotate(180deg) }` `index.html:20-22`;
`.bot-wave svg { position:relative; display:block; width: calc(133% + 1.3px);
height: 3rem }` `index.html:24-29` → 120 / 96 / 72px;
`.bot-wave .shape-fill { fill: #FFFFFF }` `index.html:32-34`.
Base rule `.bot-wave` `beachfront.css:6008-6016` (`z-index:8; width:100%;
line-height:0; position:absolute; bottom:0; left:0; overflow:hidden`);
`.bot-wave.flip` `beachfront.css:6018-6022` (`bottom:-3rem;
transform: rotateY(180deg)`). The `.bot-wave` SVG is **injected by jQuery** at
`index.html:146`, so it does not exist in static HTML.

#### 4.7 Reveal animation on the whole band (`[probed-only]`)

IX2 `a-7` "up and in", `useFirstGroupAsInitialState: true`, trigger
`SCROLL_INTO_VIEW` at `scrollOffsetValue: 0 %`:

| group        | actions                                                                                   |
| ------------ | ----------------------------------------------------------------------------------------- |
| initial (g0) | `TRANSFORM_MOVE yValue: 4, yUnit: rem` + `STYLE_OPACITY 0`, duration 500                  |
| reveal (g1)  | `TRANSFORM_MOVE yValue: 0 rem` + `STYLE_OPACITY 1`, **duration 2000ms, easing `outExpo`** |

Applied to `1273e294-…4f5b` (the `<h2>`), `…4f5f` (button wrapper),
`…4f60` (the button), `…4f62` (reviews wrapper), `…4f6a` (`.cta-beach-label`),
and `b1ce8885-…` (footer "Make a Payment").

`4rem` initial offset resolves to **160 / 128 / 96px**.

Pre-settle inline style (verified): `transform: translate3d(0px, 4rem, 0px) …;
transform-style: preserve-3d; opacity: 0`.
Post-settle: `translate3d(0px, 0rem, 0px) …; opacity: 1`.

**Consequence for :hover** — IX2 leaves `opacity: 1` as an _inline_ style on
these elements, which outranks `.button:hover { opacity: .6 }` and
`a:hover { opacity: .61 }`. Measured at all three widths: hovering the CTA
"Book Appointment" changes **background-color only**
(`rgba(0,0,0,0)` → `rgba(18,158,204,0.29)`), opacity stays `1`. The nav-panel
buttons carry no inline style and _do_ dim. Do not "fix" this asymmetry.

---

### 5. FOOTER

`.footer-info-section` `beachfront.css:5848-5852`:
`background-color: var(--primary-light) /* #e7f5fa */; margin-top:0;
position: relative`. Measured bg `rgb(231,245,250)` at all three widths.

Contained in `.content-width` (§2), so the footer's content column is
**1280 / 738 / 351px** at x **80 / 48 / 19.5**.

#### 5.1 `.footer-learn-more` — "Want to learn more?"

`beachfront.css:6385-6388`: `margin-top: .5rem; font-weight: 100` on an `<h5>`.
`h5` base `beachfront.css:2144-2152`: `color: var(--primary); margin: 10px 0;
font-family: museo-slab, sans-serif; font-size: 30px; font-weight: 300;
line-height: 40px`.
**There is no `h5` override in the ≤991 or ≤767 blocks** (only h1/h2/h3/h4/h6 at
`beachfront.css:7853-7876`, only h1 at `:8373`, only h2 at `:9012`).
≤479 `.footer-learn-more { font-size: 16px }` `beachfront.css:9258-9260`.

|                      | 1440          | 834      | 390                 |
| -------------------- | ------------- | -------- | ------------------- |
| font-size            | **30px**      | **30px** | **16px**            |
| line-height          | **40px**      | **40px** | **40px** ← stays 40 |
| weight               | 100 (`:6387`) | ←        | ←                   |
| margin-top (`.5rem`) | **20px**      | **16px** | **12px**            |
| margin-bottom        | 10px (`h5`)   | ←        | ←                   |

1440 and 834 are identical here. A ladder that shrinks this at md is wrong.

#### 5.2 Column structure — **2-column in the 768–991 band**

`.footer-cols` `beachfront.css:6291-6296`: `flex-wrap:wrap; margin-top:1rem;
padding-bottom:3rem; display:flex`.
≤991 `beachfront.css:8118-8120` → `flex-wrap: wrap` (restated).
≤767 `beachfront.css:8683-8685` → `margin-top: 0`.

`.footer-col-1` `beachfront.css:6298-6300` → `width: 33%`
`.footer-col-2` `beachfront.css:6315-6317` → `width: 33%`
`.footer-col-3` `beachfront.css:6319-6322` → `width: 33%; position: relative`

- ≤991 `beachfront.css:8126-8128` → **`.footer-col-3 { width: 66% }`**
- ≤767 `beachfront.css:8687-8689` → `.footer-col-1 { width: 66% }`;
  `beachfront.css:8695-8697` → `.footer-col-2 { width: 66% }`
- ≤479 `beachfront.css:9236-9238` → `.footer-col-1, .footer-col-2,
.footer-col-3 { width: 100% }`

Resolved layout `[verified by probe]`:

|             | 1440                           | 834                                | 390                        |
| ----------- | ------------------------------ | ---------------------------------- | -------------------------- |
| col-1       | 33% → 422.39 @ x 80, row 1     | 33% → **243.53** @ x 48, row 1     | 100% → 351 @ x 19.5, row 1 |
| col-2       | 33% → 422.39 @ x 502.39, row 1 | 33% → **243.53** @ x 291.53, row 1 | 100% → 351, row 2          |
| col-3       | 33% → 422.39 @ x 924.78, row 1 | 66% → **487.08** @ x 48, **row 2** | 100% → 351, row 3          |
| effective   | **3 columns**                  | **2 columns + full-width map**     | **1 column**               |
| col heights | 400 / 400 / 400                | 320 / 320 / 400                    | 278.19 / 256 / 400         |

**At 768–991 the footer is 2-up: links and contact side by side (33% each),
map wrapped onto its own row at 66%.** 33+33+66 = 132% > 100%, so `flex-wrap:
wrap` forces col-3 down. This is the missed defect; a 3-col→1-col ladder keyed
at 768 renders 3 columns across the whole band.

`.footer-cols` padding-bottom (`3rem`): **120 / 96 / 72px**;
margin-top (`1rem`): **40 / 32 / 0px** (0 at 390 per `:8683`).

#### 5.3 `.footer-links`

`beachfront.css:6302-6308`: `color: var(--primary-dark); margin-top:.5rem;
margin-bottom:.5rem; font-size:20px; line-height:2em`
`.footer-links.mt-0` `beachfront.css:6310-6313`: `margin-top:0;
text-decoration:none`

- ≤991 `beachfront.css:8122-8124` → `.footer-links, .footer-links.mt-0 { font-size: 16px }`
- ≤767 `beachfront.css:8691-8693` → `font-size: 12px`

|                     | 1440                              | 834                               | 390                       |
| ------------------- | --------------------------------- | --------------------------------- | ------------------------- |
| font-size           | **20px**                          | **16px**                          | **12px**                  |
| line-height (`2em`) | **40px**                          | **32px**                          | **24px**                  |
| margin-y (`.5rem`)  | **20px**                          | **16px**                          | **12px**                  |
| measured y ladder   | 8372.8 / 8432.8 / 8492.8 / 8552.8 | 8489.8 / 8537.8 / 8585.8 / 8633.8 | 6902 / 6938 / 6974 / 7010 |
| step                | **60px**                          | **48px**                          | **36px**                  |

The step is `line-height + 1× margin`, not `+ 2×`: the wrapping
`a.inline-link` is `display: inline` (`beachfront.css:7388`), so adjacent
`.footer-links` block boxes sit in the same block formatting context and their
20/20 (16/16, 12/12) margins **collapse**. `[probed-only]` for the collapse
result; the inputs are all cited.

Colour `var(--primary-dark)` `#365b6d`, family museo-sans 300 (inherited from
`body`, `beachfront.css:2096-2102`).

#### 5.4 `.footer-contact-header` — the label rows

`beachfront.css:6337-6343`: `color: var(--primary-dark);
font-family: museo-slab, sans-serif; font-size:20px; font-weight:500;
line-height:2em`

- ≤991 `beachfront.css:8130-8132` → `.footer-contact-header, .footer-contact-info { font-size: 16px }`
- ≤479 `beachfront.css:9240-9242` → `.footer-contact-header { font-size: 16px }`

|                     | 1440                 | 834      | 390      |
| ------------------- | -------------------- | -------- | -------- |
| font-size           | **20px**             | **16px** | **16px** |
| line-height (`2em`) | **40px**             | **32px** | **32px** |
| weight / family     | **500** / museo-slab | ←        | ←        |

The only 500-weight text in the chrome, and the only footer style that does
**not** shrink at 390. Strings: `OFFICE HOURS`, `CONTACT` (literal uppercase in
the markup — `text-transform` is `none`).

#### 5.5 `.footer-contact-info`

`beachfront.css:6345-6351`: `color: var(--primary-dark); margin-top:0;
margin-bottom:0; font-size:20px; line-height:2em`
`.footer-contact-info.mt-0 { margin-top: 0 }` `beachfront.css:6353-6355`

- ≤991 `beachfront.css:8130-8132` → `font-size: 16px`
- ≤767 `beachfront.css:8699-8701` → `font-size: 12px`

|                     | 1440     | 834      | 390      |
| ------------------- | -------- | -------- | -------- |
| font-size           | **20px** | **16px** | **12px** |
| line-height (`2em`) | **40px** | **32px** | **24px** |
| margins             | 0 / 0    | ←        | ←        |
| measured row step   | **40px** | **32px** | **24px** |

`.footer-contact-block.mb-4` → `.mb-4 { margin-top:0; margin-bottom:1rem }`
`beachfront.css:3985-3988` → **40 / 32 / 24px**. Measured block heights
160 / 128 / 104px.

Rows: `Monday - Thursday / 7am - 5pm`, `Friday / 7am - 2pm`,
`Saturday - Sunday / Closed`, `(310) 378-9241` (wrapped in
`a.inline-link` → `tel:(310)-378-9241`), `1706 S Elena Ave. Suite B`,
`Redondo Beach, CA 90277`.

#### 5.6 `.footer-copyright` — the small ~11px rows

`beachfront.css:6357-6362`: `color: var(--primary-dark); margin:.5rem;
font-size:12px; line-height:1.2em`

- ≤767 `beachfront.css:8703-8707` → `margin-top:.5rem; margin-left:0;
font-size:10px`
- ≤479 `beachfront.css:9244-9246` → `font-size: 7px`

|                       | 1440                        | 834                      | 390                          |
| --------------------- | --------------------------- | ------------------------ | ---------------------------- |
| font-size             | **12px**                    | **12px**                 | **7px**                      |
| line-height (`1.2em`) | **14.4px**                  | **14.4px**               | **8.4px**                    |
| margin (`.5rem`)      | **20px** all round          | **16px** all round       | **12px 12px 12px 0**         |
| measured y            | 8912.8                      | 9321.8                   | 7920.2                       |
| measured x ladder     | 100 / 396.7 / 642.8 / 860.6 | 64 / 266.2 / 418 / 541.3 | 19.5 / 149.1 / 249.2 / 332.7 |

1440 and 834 are both 12px — the shrink is at ≤767 (10px) then ≤479 (7px).
**There is no 11px anywhere**; the "~11px row" is the 12px/14.4px copyright row
at desktop and tablet. A ladder that interpolates an 11px md value is wrong.

`.footer-boiler-holder` `beachfront.css:6364-6370`: `flex-wrap:wrap;
place-content:space-between; width:66%; padding-bottom:1rem; display:flex`

- ≤991 `beachfront.css:8134-8136` → `width: 75%`
- ≤767 `beachfront.css:8709-8712` → `flex-wrap: wrap; width: 100%`

|                         | 1440              | 834               | 390              |
| ----------------------- | ----------------- | ----------------- | ---------------- |
| width                   | 66% → **844.8px** | 75% → **553.5px** | 100% → **351px** |
| padding-bottom (`1rem`) | **40px**          | **32px**          | **24px**         |

Four items, `space-between`: `©2023 Beachfront Dentistry`,
`All Rights Reserved`, `Privacy Policy`, `Sitemap`. They are plain `<div>`s —
**not links** — so no `:hover` applies to them.

#### 5.7 Google Map embed

Markup:

```
<div class="footer-map w-widget w-widget-map"
     data-widget-style="roadmap"
     data-widget-latlng="33.817617,-118.385433"
     aria-label="Beachfront Dentistry"
     data-enable-scroll="true" role="region" title="Beachfront Dentistry"
     data-enable-touch="true" data-widget-zoom="12"
     data-widget-tooltip="Find us here!"></div>
```

`.w-widget-map` `beachfront.css:1002-1005`: `width: 100%; height: 400px`
`.w-widget-map label { width:auto; display:inline }` `beachfront.css:1007-1010`
`.w-widget-map img { max-width: inherit }` `beachfront.css:1012-1014`
`.w-widget-map .gm-style-iw { text-align: center }` `beachfront.css:1016-1018`
`.w-widget-map .gm-style-iw > button { display: none !important }` `beachfront.css:1020-1022`
≤991 `.footer-map { width: 100% }` `beachfront.css:8166-8168`

|                         | 1440                              | 834                 | 390                |
| ----------------------- | --------------------------------- | ------------------- | ------------------ |
| height                  | **400px** (fixed, all tiers)      | 400px               | 400px              |
| measured rect           | `{924.78, 422.39, 400}`           | `{48, 487.08, 400}` | `{19.5, 351, 400}` |
| widget bg while loading | `rgb(229,227,223)` (Google's own) | ←                   | ←                  |

Webflow hydrates this into a Google Maps JS canvas at runtime (single child
`<div>` with inline `height:100%; width:100%; position:absolute`)
`[probed-only]`. Height never changes across the matrix — the width is what
tracks the column, and at 834 that means a **487.08px-wide, 400px-tall map on
its own row**.

---

### 6. BUTTON / PILL PATTERN

#### 6.1 Base

`.w-button` `beachfront.css:265-275`: `color:#fff; line-height:inherit;
cursor:pointer; background-color:#3898ec; border:0; border-radius:0;
padding:9px 15px; text-decoration:none; display:inline-block` — fully
overridden below except for `display: inline-block`.

`.button` `beachfront.css:6028-6040`:

```
cursor: pointer;
background-color: #0000;              /* transparent */
border: 1px solid #fff;
border-radius: 8px;
height: auto;
padding: 1.3em 1em;
font-family: museo-slab, sans-serif;
font-size: 25px;
font-weight: 300;
line-height: 0;                        /* ← the height trick */
transition: opacity .2s, background-color .2s cubic-bezier(.215, .61, .355, 1);
```

Font-size overrides: ≤991 `beachfront.css:8045-8047` → `20px`;
≤767 `beachfront.css:8632-8634` → `15px`. **No ≤479 rule on bare `.button`** —
plain buttons stay 15px at 390.

#### 6.2 Why computed padding lies — record the measured box

`line-height: 0` collapses the line box to zero height, so under `box-sizing:
border-box` (Webflow's global) the rendered height is _entirely_
`padding-top + padding-bottom + 2× border`. The text glyphs overflow the
content box. Do not derive height from font-size or from `padding` alone —
these are the **measured rects**:

The FOUR tiers of the font ladder, each with its line — the box is
`2.6em + 2px` of border everywhere except the dark variant at ≥992, which
replaces the `1.3em` with a hard 32px:

| variant                                              | ≥992                                                       | 768–991                                                          | 480–767                                           | ≤479                                                  |
| ---------------------------------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------- | ----------------------------------------------------- |
| `.button` (plain, e.g. "View All Services")          | fs 25 (`beachfront.css:6036`), pad `32.5px 25px`, **h 67** | fs 20 (`:8045-8047`), pad `26px 20px`, **h 54**                  | fs 15 (`:8632-8634`), pad `19.5px 15px`, **h 41** | fs 15 (no ≤479 rule), **h 41**                        |
| `.button.text-color-primary-dark` (CTA, footer, nav) | fs 25, pad **`32px` hard** (`:6047-6051`) `25px`, **h 66** | fs 20 (`:8049-8052` restores `1.3em`), pad `26px 20px`, **h 54** | fs 15 (`:8632-8634`), **h 41**                    | fs 14 (`:9173-9175`), pad `18.2px 14px`, **h 38.375** |
| `.button.text-color-primary`                         | fs 25, pad `32.5px 25px`, **h 67**                         | fs 20 (`:8045-8047`), pad `26px 20px`, **h 54**                  | fs 15 (`:8632-8634`), **h 41**                    | fs 14 (`:9185-9187`), pad `18.2px 14px`, **h 38.375** |

The base rule the whole table hangs off is `.button` `beachfront.css:6028-6040`:
`height:auto; padding:1.3em 1em; line-height:0; border:1px; border-radius:8px;
font-family:museo-slab; font-size:25px; font-weight:300`. **There is no height
declaration anywhere** — a build that pins one (we shipped a flat 66px, and a
two-tier 38/66 on the detail templates) restates three quarters of this ladder
wrong. Express the padding in `em` and the box follows.

**Two different heights coexist at 1440 — 66px and 67px** — because
`.button.text-color-primary-dark` `beachfront.css:6047-6051` replaces the `1.3em`
vertical padding with a hard `padding-top: 32px; padding-bottom: 32px`, while
everything else keeps `1.3em` of 25px = 32.5px. At 834 the ≤991 rule
`beachfront.css:8049-8052` puts it back to `1.3em` (= 26px) and the two
converge on 54px. At 390 they diverge again (38.375 vs 41) because the dark
variant is 14px (`beachfront.css:9173-9175`) while plain is 15px.

Horizontal padding is always `1em`: **25 / 20 / 14–15px**.

Sample measured widths (text-dependent, listed for reference):
`Book an Appointment` 317.83 / 254.67 / 178.88 · `Make a Payment`
250.11 / 200.48 / 140.94 · `View All Services` 254.69 / 204.14 / 153.61.

#### 6.3 Variants

| selector                                              | source                     | declarations                                                                                                                                                                      |
| ----------------------------------------------------- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.button.text-color-primary-dark`                     | `beachfront.css:6047-6051` | `border-color: var(--primary-dark); padding-top:32px; padding-bottom:32px` (+ `.text-color-primary-dark` `beachfront.css:5897` → `color: var(--primary-dark)`)                    |
| ” ≤991                                                | `beachfront.css:8049-8052` | `padding-top:1.3em; padding-bottom:1.3em`                                                                                                                                         |
| ” ≤767                                                | `beachfront.css:8636-8638` | `margin-bottom: 60px`                                                                                                                                                             |
| ” ≤479                                                | `beachfront.css:9173-9175` | `font-size: 14px`                                                                                                                                                                 |
| `.button.text-color-primary-dark.show-form.nav`       | `beachfront.css:6053-6056` | `margin-top:20px; margin-bottom:10px`                                                                                                                                             |
| `.button.text-color-primary-dark.nav`                 | `beachfront.css:6058-6063` | `color:#fff; border-color:#fff; margin-top:20px; margin-bottom:10px`                                                                                                              |
| `.button.text-color-primary-dark.mt-2` ≤767           | `beachfront.css:8640-8643` | `margin-bottom:0; display:inline-block`                                                                                                                                           |
| `.button.text-color-primary-dark.mr-4.show-form` ≤479 | `beachfront.css:9177-9179` | `margin-top: 0`                                                                                                                                                                   |
| `.button.text-color-primary-dark.show-form` ≤479      | `beachfront.css:9181-9183` | `margin-top: -20px`                                                                                                                                                               |
| `.button.text-color-primary`                          | `beachfront.css:6065-6067` | `border-color: var(--primary)` (+ `.text-color-primary` `beachfront.css:5936`)                                                                                                    |
| ” ≤479                                                | `beachfront.css:9185-9187` | `font-size: 14px`                                                                                                                                                                 |
| `.button.text-color-primary.mt-2.show-form`           | `beachfront.css:6069-6071` | `margin-bottom: 20px`                                                                                                                                                             |
| `.button.mb-2`                                        | `beachfront.css:6078-6080` | `position: relative`                                                                                                                                                              |
| `.button.position-absolute-bottom-right.home`         | `beachfront.css:6073-6076` | `bottom:4rem; right:2rem`; ≤991 `:8054-8057` `bottom:2rem; right:2rem`; ≤767 `:8645-8647` `width:8rem`; ≤479 `:9189-9193` `position:absolute; bottom:3rem; left:auto; right:auto` |

Computed border/radius/family (verified identical at all three widths):
`border: 1px solid`, `border-radius: 8px`, `font-family: museo-slab, sans-serif`,
`font-weight: 300`, `background-color: rgba(0,0,0,0)`,
`transition: opacity 0.2s, background-color 0.2s cubic-bezier(0.215,0.61,0.355,1)`.
Border colour: `#fff` base / `var(--primary-dark)` `#365b6d` /
`var(--primary)` `#129ecc` per variant.

---

### 7. HOVER + FOCUS CENSUS — all 42 rule blocks in `beachfront.css`

Grepped with `/:hover|:focus/`. Chrome-relevant rows marked ●.

| #   | line                  | selector                                                             | declarations                                     |
| --- | --------------------- | -------------------------------------------------------------------- | ------------------------------------------------ |
| 1   | `beachfront.css:33`   | `a:active, a:hover`                                                  | `outline: 0` ●                                   |
| 2   | `beachfront.css:536`  | `.w-input:focus, .w-select:focus`                                    | `border-color:#3898ec; outline:0` ● (form modal) |
| 3   | `beachfront.css:1276` | `.w-slider-dot:focus`                                                | `outline:none; box-shadow:0 0 0 2px #fff`        |
| 4   | `beachfront.css:1281` | `.w-slider-dot:focus.w-active`                                       | `box-shadow: none`                               |
| 5   | `beachfront.css:1304` | `.w-slider-arrow-left:focus, .w-slider-arrow-right:focus`            | `outline: 0`                                     |
| 6   | `beachfront.css:1369` | `.w-dropdown-toggle:focus`                                           | `outline: 0`                                     |
| 7   | `beachfront.css:1404` | `.w-dropdown-link:focus`                                             | `outline: 0`                                     |
| 8   | `beachfront.css:1663` | `.w-lightbox-control:hover`                                          | `opacity: 1`                                     |
| 9   | `beachfront.css:1668` | `.w-lightbox-inactive, .w-lightbox-inactive:hover`                   | `opacity: 0`                                     |
| 10  | `beachfront.css:1906` | `.w-nav-button:focus`                                                | `outline: 0`                                     |
| 11  | `beachfront.css:1995` | `.w-tab-link:focus`                                                  | `outline: 0`                                     |
| 12  | `beachfront.css:2181` | `a:hover`                                                            | `opacity: .61` ●                                 |
| 13  | `beachfront.css:2998` | `.flex-justify-end.flex-align-center:hover`                          | `opacity: .6`                                    |
| 14  | `beachfront.css:3474` | `._w-8.clickable:hover`                                              | `opacity: .6` ● (CTA socials)                    |
| 15  | `beachfront.css:6042` | `.button:hover`                                                      | `opacity: .6; background-color: #129ecc4a` ●     |
| 16  | `beachfront.css:6096` | `.header-logo:hover`                                                 | `opacity: .5` ●                                  |
| 17  | `beachfront.css:6114` | `.header-hamburger:hover`                                            | `opacity: .4` ●                                  |
| 18  | `beachfront.css:6205` | `.block-link.display-flex:hover`                                     | `opacity: .6`                                    |
| 19  | `beachfront.css:6214` | `.block-link.togglable:hover`                                        | `opacity: .6`                                    |
| 20  | `beachfront.css:6250` | `.services-links.text-size-25-px.slab.text-color-primary-dark:hover` | `opacity: .6` ● (Read Reviews)                   |
| 21  | `beachfront.css:6263` | `.button-arrow.filter-to-primary-dark:hover`                         | `opacity: .6`                                    |
| 22  | `beachfront.css:6424` | `.modal-link:hover`                                                  | `opacity: .5` ● (nav links)                      |
| 23  | `beachfront.css:6620` | `.visit-list-item:hover`                                             | `opacity: .67`                                   |
| 24  | `beachfront.css:6675` | `.team-slider-arrow.filter-to-primary:hover`                         | `opacity: .6`                                    |
| 25  | `beachfront.css:6830` | `.social-logo-big-review:hover`                                      | `opacity: .6`                                    |
| 26  | `beachfront.css:6845` | `.arrow-big-review.filter-to-primary:hover`                          | `opacity: .6`                                    |
| 27  | `beachfront.css:6853` | `.arrow-big-review.filter-to-primary.right:hover`                    | `opacity: .6`                                    |
| 28  | `beachfront.css:6863` | `.arrow-big-review.filter-to-primary.left:hover`                     | `opacity: 1`                                     |
| 29  | `beachfront.css:6872` | `.arrow-big-review.left.filter-to-primary:hover`                     | `opacity: .6`                                    |
| 30  | `beachfront.css:6933` | `.expanding-box:hover`                                               | `opacity: .86`                                   |
| 31  | `beachfront.css:6947` | `.expanding-box.mid:hover`                                           | `opacity: .65`                                   |
| 32  | `beachfront.css:6958` | `.expanding-box.bot:hover`                                           | `opacity: .65`                                   |
| 33  | `beachfront.css:6967` | `.expanding-box.top:hover`                                           | `opacity: .65`                                   |
| 34  | `beachfront.css:7081` | `.plus-minus-block:hover`                                            | `opacity: .51` ● (Read Reviews toggle)           |
| 35  | `beachfront.css:7206` | `.qa-block:hover`                                                    | `opacity: .8`                                    |
| 36  | `beachfront.css:7366` | `.head-link:hover`                                                   | `opacity: .6`                                    |
| 37  | `beachfront.css:7391` | `.inline-link:hover`                                                 | `opacity: .6` ● (footer links, phone)            |
| 38  | `beachfront.css:7418` | `.primary-on-hover:hover`                                            | `opacity: 1`                                     |
| 39  | `beachfront.css:7602` | `.big-review-arrow-right:hover`                                      | `opacity: .6`                                    |
| 40  | `beachfront.css:7610` | `.big-review-arrow-right.filter-to-primary:hover`                    | `transform: scale(1.01)`                         |
| 41  | `beachfront.css:7622` | `.big-review-arrow-left:hover`                                       | `opacity: .6`                                    |
| 42  | `beachfront.css:7630` | `.big-review-arrow-left.filter-to-primary:hover`                     | `transform: scale(1.01)`                         |

Transition durations that carry the hovers:
`.button` `.2s` opacity + `.2s cubic-bezier(.215,.61,.355,1)` bg (`:6039`) ·
`.header-logo` / `.header-hamburger` `.35s cubic-bezier(.215,.61,.355,1)`
(`:6093`, `:6111`) · `.modal-link` `.35s` (`:6421`) ·
`.inline-link` `.2s` (`:7387`) · `a` `.2s` (`:2178`) ·
`._w-8.clickable` `.2s` (`:3471`).

Measured hover deltas `[probed]`, identical at 1440 / 834 / 390:

| element                       | before → after                                                                               |
| ----------------------------- | -------------------------------------------------------------------------------------------- |
| CTA "Book Appointment"        | bg `rgba(0,0,0,0)` → **`rgba(18,158,204,0.29)`**; opacity **stays 1** (IX2 inline pin, §4.7) |
| footer link (`.inline-link`)  | opacity `1` → **`0.6`**                                                                      |
| footer phone (`.inline-link`) | opacity `1` → **`0.6`**                                                                      |
| "Read Reviews"                | opacity `1` → **`0.6`**                                                                      |
| header logo                   | opacity `1` → **`0.5`**                                                                      |
| header hamburger              | opacity `1` → **`0.4`**                                                                      |

`.socials-container ._w-8.clickable` could not be hovered — `display: none`
until the toggle fires (`beachfront.css:7547`).

There are **no `:focus-visible` rules and no custom focus ring** anywhere; every
focus rule in the sheet either removes the outline or is Webflow slider/tab
chrome that this site does not use in the shared furniture.

---

### 8. TYPE-STYLE CENSUS — 14 distinct styles in the shared chrome

Three-tier ladders, `font-size / line-height`:

| #   | style                 | selector                                                       | family / weight                                      | 1440       | 834       | 390       | source                             |
| --- | --------------------- | -------------------------------------------------------------- | ---------------------------------------------------- | ---------- | --------- | --------- | ---------------------------------- |
| 1   | nav link              | `.modal-link` (`h3`)                                           | museo-slab 300, `#fff`                               | 40 / 50    | 21 / 26   | 21 / 26   | `:6418`, `:2124`, `:7863`          |
| 2   | button label, plain   | `.button`                                                      | museo-slab 300, `#fff`, lh 0                         | 25 / 0     | 20 / 0    | 15 / 0    | `:6028`, `:8045`, `:8632`          |
| 3   | button label, dark    | `.button.text-color-primary-dark`                              | museo-slab 300, `#365b6d` (`#fff` when `.nav`), lh 0 | 25 / 0     | 20 / 0    | 14 / 0    | `:6047`, `:6058`, `:9173`          |
| 4   | button label, primary | `.button.text-color-primary`                                   | museo-slab 300, `#129ecc`, lh 0                      | 25 / 0     | 20 / 0    | 14 / 0    | `:6065`, `:9185`                   |
| 5   | CTA heading           | `h2.text-align-center.my-4`                                    | museo-slab 100, `#129ecc`                            | 140 / 168  | 72 / 80   | 50 / 60   | `:2114`, `:7858`, `:9055`          |
| 6   | "Read Reviews"        | `.services-links.text-size-25-px.slab.text-color-primary-dark` | museo-slab 300, `#365b6d`                            | 25 / 68.75 | 20 / 55   | 14 / 38.5 | `:6222`, `:6236`, `:8110`, `:9228` |
| 7   | "FIJI ISLANDS"        | `.cta-beach-label`                                             | museo-sans 300, `#fff`                               | 25 / 28.75 | 20 / 23   | 10 / 11.5 | `:6372`, `:8138`, `:9248`          |
| 8   | "Want to learn more?" | `.footer-learn-more` (`h5`)                                    | museo-slab 100, `#129ecc`                            | 30 / 40    | 30 / 40   | 16 / 40   | `:6385`, `:2144`, `:9258`          |
| 9   | footer nav link       | `.footer-links`                                                | museo-sans 300, `#365b6d`                            | 20 / 40    | 16 / 32   | 12 / 24   | `:6302`, `:8122`, `:8691`          |
| 10  | footer label          | `.footer-contact-header`                                       | museo-slab **500**, `#365b6d`                        | 20 / 40    | 16 / 32   | 16 / 32   | `:6337`, `:8130`, `:9240`          |
| 11  | footer detail         | `.footer-contact-info`                                         | museo-sans 300, `#365b6d`                            | 20 / 40    | 16 / 32   | 12 / 24   | `:6345`, `:8130`, `:8699`          |
| 12  | footer fine print     | `.footer-copyright`                                            | museo-sans 300, `#365b6d`                            | 12 / 14.4  | 12 / 14.4 | 7 / 8.4   | `:6357`, `:8703`, `:9244`          |
| 13  | modal heading         | `.modal-form-container h3`                                     | museo-slab 300, `#129ecc`                            | 40 / 50    | 21 / 26   | 21 / 26   | `:2124`, `:7863`                   |
| 14  | modal field label     | `.appt-form-label`                                             | museo-sans 300, `#365b6d`, `.5rem`/`1.1em`           | 20 / 22    | 16 / 17.6 | 12 / 13.2 | `:7476`                            |

Families are loaded from Typekit (`use.typekit.net/tao4byj.js`) — `museo-slab`
and `museo-sans`. Google Fonts (Lato, Montserrat) are also loaded but are not
used by any chrome style. Colour tokens (`beachfront.css:2047-2054`):
`--primary #129ecc`, `--primary-dark #365b6d`, `--secondary #b6aa91`,
`--primary-light #e7f5fa`, `--secondary-dark #2b2a29`,
`--secondary-light #cecece`.

Only style #14 is rem-sized, and it is the one that must be built as a
three-tier ladder rather than a two-tier one. Every other type value in the
chrome is a hard px that steps on Webflow's 991/767/479 gates — but the
_spacing_ around them is almost entirely rem and therefore steps on the root
ladder at 992/768/480. **That 1px offset between the two is the whole trap.**

---

### 9. `[probed-only]` inventory

Values here have no stylesheet line and must be re-derived, not copied blindly:

1. All IX2 timings/offsets (§3.4, §4.7, §4.4) — read from
   `Webflow.require("ix2").store.getState().ixData`, stored at
   `/tmp/bf-chrome-ix2.json` during this pass.
2. The IX2 inline `opacity: 1` on CTA elements and its effect on `:hover` (§4.7).
3. Margin-collapse results: `.mt-8` through `.content-width` (§4.3), adjacent
   `.footer-links` (§5.3).
4. Fractional img y-offsets from inline-block baseline alignment (§3.2).
5. Google Maps' runtime DOM and its `rgb(229,227,223)` loading background (§5.7).
6. `.bot-wave`'s SVG (jQuery-injected at `index.html:146`, absent from
   static HTML).
7. Absolute document-space y values in every table — those are the home page's
   and will differ per page; only the _relative_ offsets are shared chrome.

Raw probe output for re-checking: `/tmp/bf-chrome-probe.json`,
`/tmp/bf-chrome-probe2.json`, `/tmp/bf-chrome-ix2.json`.
