## our-team — Meet Our Team (team grid)

Route `/our-team` · local structural sample
`matching/spec/our-team.html` (149 lines; the whole `<body>` is minified onto
**line 113**, so markup citations are `our-team.html:113` plus the quoted
snippet; the `<head>`/`<body>` inline `<style>` blocks and the trailing
`<script>` DO have real line numbers and are cited as such).

**Governing rule (CLAUDE.md #1): source prescribes, rects only verify.** Every
geometry/type value below carries a `beachfront.css:<line>` or
`our-team.html:<line>` citation. Values that exist only as computed output
(Webflow IX2 inline styles, jQuery-injected DOM, flex-shrink results, `ch`
resolution, margin-collapse) are tagged `[probed-only]`.

Shared nav / appointment modal / closing CTA / footer are **already specced in
`matching/spec-sections/_chrome.md`** — §2 `.content-width`, §3 nav, §3.6 form
modal, §4 CTA band, §5 footer, §6 buttons, §7 hovers, §8 type census. This file
does not restate them; it references them and specs only what is unique to
`/our-team`.

Probe: `https://www.beachfrontdentistry.com/our-team` at **1440 / 992 / 991 /
834 / 768 / 767 / 390**, viewport height 900, scrolled in 250px steps with 80ms
delays, then held until `document.getAnimations().every(a => a.playState !==
"running")`. The seven-width matrix is deliberate — see §E.1; the team card is
the worst offender on this project for the offset-ladder trap and only a
seven-width read exposes it.

Raw probe output:
`…/scratchpad/probe-team.json`, `probe-rules.json`, `probe-hover.json`.

---

### 0. The root-font ladder applies here unchanged

`our-team.html:2-4` (`html{font-size:40px}`), `:8-10` (`≤992 → 32px`),
`:12-14` (`≤768 → 24px`), `:16-18` (`≤480 → 24px`, no-op) — byte-identical to
`index.html`, and repeated a second time in the `<body>` embed at
`our-team.html:62`, `:64-66`, `:68-70`, `:72-74`.

Webflow's class gates are one pixel earlier: `beachfront.css:7852` (≤991),
`:8372` (≤767), `:9011` (≤479), second ≤991 block at `:9611`.

**Every rem below therefore resolves to three values keyed 1440 / 834 / 390 —
and on this page four of them, because the team card's ladder is declared at
BOTH gates.** See §E.1.

---

## A. Section census

Numbered top to bottom, `y@1440` = document-space y of the section's border box
(settled, after all reveals):

| #   | label                                  | anchor (unique opening text) | y@1440      | h@1440 | y@834    | y@390  |
| --- | -------------------------------------- | ---------------------------- | ----------- | ------ | -------- | ------ |
| 1   | header / nav (chrome)                  | `Home Page`                  | **0**       | 120    | 0        | 0      |
| 2   | hero — Redondo beach photo + "Meet"    | `Meet`                       | **0**       | 475.19 | 0        | 0      |
| 3   | subtitle block — "Our" / "Team" + lede | `Our`                        | **465.19**  | 606    | 490.39   | 360.5  |
| 4   | team grid — 11 CMS cards               | `Dr. Robert Quan`            | **1081.19** | 2640   | 758.39   | 680.5  |
| 5   | closing CTA band (chrome §4)           | `Ready for`                  | **3761.19** | 1200   | 12406.39 | 6248.5 |
| 6   | footer info (chrome §5)                | `Want to learn more?`        | **4961.19** | 714.41 | 13235    | 6686.5 |

Sections 5 and 6 are the two halves of the single `<section class="footer">`
(`y@1440 = 3761.19`, `h = 1914.41`); the census splits them because the gate
anchors split them.

Document height `[probed]`: **5676 / 14217 / 7811** at 1440 / 834 / 390.

#### A.1 Census-to-gate mapping — where defects hide

The gate cuts this page at four anchors: `Our` · `Dr. Robert Quan` ·
`Ready for great dental health` · `Want to learn more`. That is **4 anchors for
6 census sections**, so two gate regions are compound:

| gate region                          | y-range @1440                  | census sections it swallows                                              | dilution risk                                                                                                                                                                                                                                                                                                           |
| ------------------------------------ | ------------------------------ | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| top → `Our`                          | 0 → 465.19 (465px)             | **1 + 2** (header, hero)                                                 | header is 120px of a 465px region — a 26% slice. Acceptable.                                                                                                                                                                                                                                                            |
| `Our` → `Dr. Robert Quan`            | 465.19 → 1351.19 (886px)       | **3** entire + the grid's leading `4rem` margin + **the first headshot** | ⚠️ the `.team-grid-headshot` (200px tall at 1440, and the element with the worst ladder on this page — §E.1) sits at y 1141–1341, i.e. **23% of this region**. A headshot rendered at the wrong tier size can hide under 0.10.                                                                                          |
| `Dr. Robert Quan` → `Ready for…`     | 1351.19 → 3761.19 (**2410px**) | **4** (all 11 cards, 4 rows)                                             | ⚠️⚠️ **worst region on the page.** One wrong card sub-element (e.g. the read-more label's 16→19.2→14.4 ladder, §E.2) is ~1/11 of the region's content and ~1% of its area. At 834 this region is **11 616px tall** — dilution is an order of magnitude worse. Do not trust a pass here; check a single card explicitly. |
| `Ready for…` → `Want to learn more?` | 3761.19 → 4981.19              | **5** (chrome §4)                                                        | chrome-owned                                                                                                                                                                                                                                                                                                            |
| `Want to learn more?` → end          | 4981.19 → 5676                 | **6** (chrome §5)                                                        | chrome-owned                                                                                                                                                                                                                                                                                                            |

**Anchor-uniqueness warning:** as a _substring_, `Our` occurs **3×** in
`document.body.innerText` `[probed]` — the nav panel's `Meet Our Team`, the
`<h2>Our</h2>`, and the footer link `Our Team`. `Meet` occurs **2×** (hero h2 +
nav `Meet Our Team`), `Team` **3×**. Only `Dr. Robert Quan`, `Ready for` and
`Want to learn more` are substring-unique. The `Our` anchor is only safe if the
gate resolves anchors by _exact element text_, not substring. Verify this before
trusting the region boundaries.

---

## B. Per-section spec

### 1. Header / nav — chrome

Byte-identical to `index.html` per `_chrome.md` §0. `.header` is
`position:absolute; height:3rem` (`beachfront.css:5836-5842`) → **120 / 96 /
72px**, overlaying section 2. Only per-page variance: `aria-current="page"` +
`w--current` on the `Meet Our Team` link and on the footer `Our Team` link
(`our-team.html:113`). Nothing else to build. See `_chrome.md` §3.

---

### 2. Hero — `section.hero.redondo`

Markup (`our-team.html:113`):

```html
<section class="hero redondo">
  <div class="hero-top-gradient"></div>
  <div class="hero-bot-gradient"></div>
  <h2 class="meet-heading"><br />Meet</h2>
  <div class="bot-wave"></div>
  <!-- SVG injected by jQuery -->
</section>
```

#### 2.1 Section box — a **vw** ladder, not a rem ladder

`.hero` `beachfront.css:5295-5300`: `align-items:center; height:33vw;
display:block; position:relative`.
`.hero.redondo` `beachfront.css:5302-5308`: `background-image: url(…redondo…);
background-position: 0 100%; background-size: 100%; padding-bottom: 0;
position: relative`.

Overrides: ≤991 `beachfront.css:7980-7982` `.hero, .hero.redondo{height:60vw}` ·
≤767 `beachfront.css:8438-8440` `.hero{height:70vw}` and `:8442-8445`
`.hero.redondo{background-size:cover; height:70vw}` · ≤479
`beachfront.css:9072-9076` `.hero.redondo{object-fit:cover;
background-size:cover; height:95vw}`.

|                     | 1440               | 834          | 390               |
| ------------------- | ------------------ | ------------ | ----------------- |
| declared height     | `33vw`             | `60vw`       | `95vw`            |
| **resolved**        | **475.19px**       | **500.39px** | **370.5px**       |
| background-size     | `100%` (`:5305`)   | `100%`       | `cover` (`:9074`) |
| background-position | `0 100%` (`:5304`) | ←            | ←                 |
| margin / padding    | 0 / 0              | ←            | ←                 |

Because it is `vw`-based the hero is **immune to the root-font ladder** but not
to the Webflow gate: at **992 → 327.36px**, at **991 → 594.59px** (a 267px jump
across one pixel of viewport), at **768 → 460.8px**, at **767 → 536.89px**
`[probed]`. Do not key this at 768.

Asset (real file, do not redraw):
`https://cdn.prod.website-files.com/64af3f93339537d6b661b556/64af4ef42e7d98b2fdb91769_beach-in-beautiful-morning-light-at-redondo-beach-75226436.jpeg`

#### 2.2 Gradient overlays

`.hero-top-gradient` `beachfront.css:6477-6482`:
`background-image: linear-gradient(#129ecccc, #0000); width:100%; height:25%;
position:absolute` (no `top`, so it lands at the static-position top = 0).
`.hero-bot-gradient` `beachfront.css:6484-6490`:
`linear-gradient(#0000, #129ecccc); width:100%; height:50%;
position:absolute; bottom:0`.

Neither has a `.dark` / `.home` modifier on this page (`beachfront.css:6492`,
`:6496`, `:6500` are for other pages).

|                   | 1440                        | 834                     | 390                     |
| ----------------- | --------------------------- | ----------------------- | ----------------------- |
| top gradient rect | `{0, 0, 1440, 118.80}`      | `{0,0,834,125.09}`      | `{0,0,390,92.63}`       |
| bot gradient rect | `{0, 237.59, 1440, 237.59}` | `{0,250.20,834,250.19}` | `{0,185.25,390,185.25}` |

(percentages of §2.1's height; `[probed]` rects confirm 25% / 50%.)

#### 2.3 `h2.meet-heading` — "Meet", with a **leading `<br/>`**

Markup is literally `<h2 class="meet-heading"><br/>Meet</h2>`
(`our-team.html:113`). The empty first line is load-bearing: it doubles the
element height and is what pushes "Meet" up off the wave.

`.meet-heading` `beachfront.css:6518-6524`: `color:#fff; text-align:center;
width:100%; position:absolute; bottom:.75rem`.
Type from `h2` `beachfront.css:2114-2122`
(`color:var(--primary); margin:20px 0 10px; font-family: museo-slab,sans-serif;
font-size:140px; font-weight:100; line-height:168px`) — colour overridden to
`#fff` at `:6519`. ≤991 `beachfront.css:7858-7861` → `72px/80px`.
**No ≤767 override.** ≤479 `beachfront.css:9012-9016` →
`overflow-wrap:anywhere; 56px/70px`.

|                            | 1440                               | 834                  | 390                 |
| -------------------------- | ---------------------------------- | -------------------- | ------------------- |
| font-size / line-height    | **140 / 168**                      | **72 / 80**          | **56 / 70**         |
| family / weight            | museo-slab / **100**               | ←                    | ←                   |
| colour                     | `#fff` (`:6519`)                   | ←                    | ←                   |
| letter-spacing / transform | normal / none                      | ←                    | ←                   |
| text-align                 | center (`:6520`)                   | ←                    | ←                   |
| margin                     | `20px 0 10px` (`h2`, `:2116-2117`) | ←                    | ←                   |
| `bottom` (`.75rem`)        | **30px**                           | **24px**             | **18px**            |
| element height (2 lines)   | **336**                            | **160**              | **140**             |
| rect `[probed]`            | `{0, 99.19, 1440, 336}`            | `{0,306.39,834,160}` | `{0,202.5,390,140}` |

The `bottom` offset is measured to the **margin box**, so the visual gap from
the section's bottom edge to the text box is `bottom + margin-bottom` =
`30+10 = 40 / 24+10 = 34 / 18+10 = 28`. `y@1440 = 475.19 − 40 − 336 = 99.19` ✓
— reproduce the box model, do not hardcode y.

#### 2.4 `.bot-wave` — **the SVG is jQuery-injected, and the rotation is on the parent**

The static HTML ships `<div class="bot-wave"></div>` **empty**
(`our-team.html:113`). The SVG is appended at runtime:
`$(".bot-wave").append(' <svg … viewBox="0 0 1200 120" preserveAspectRatio="none"><path d="M321.39,56.44…" class="shape-fill"></path></svg> ');`
— `our-team.html:123`. `[probed-only]` as DOM; the markup string is cited.

Box (two sources, both required):

- `beachfront.css:6008-6016` — `z-index:8; width:100%; line-height:0;
position:absolute; bottom:0; left:0; overflow:hidden`
- `our-team.html:20-22` — `.bot-wave { transform: rotate(180deg) }`
- `our-team.html:24-30` — `.bot-wave svg { position:relative; display:block;
width: calc(133% + 1.3px); height: 3rem }`
- `our-team.html:32-34` — `.bot-wave .shape-fill { fill: #FFFFFF }`

**The `rotate(180deg)` lives on the wrapper `div`, not the `svg`.** Same
structural trap as the CTA wave (`_chrome.md` §4.6). The svg is laid out at
local x=0 and only _appears_ right-shifted after the parent's rotation — the
probed rect is post-transform.

|                          | 1440                         | 834                 | 390                |
| ------------------------ | ---------------------------- | ------------------- | ------------------ |
| wrapper height (`3rem`)  | **120px**                    | **96px**            | **72px**           |
| wrapper rect             | `{0, 355.19, 1440, 120}`     | `{0,404.39,834,96}` | `{0,298.5,390,72}` |
| svg width (`133%+1.3px`) | **1916.50**                  | **1110.52**         | **520.00**         |
| svg rect x (post-rotate) | **−476.50**                  | **−276.52**         | **−130.00**        |
| computed transform       | `matrix(-1, 0, 0, -1, 0, 0)` | ←                   | ←                  |

`svg:not(:root){overflow:hidden}` `beachfront.css:82-84` plus the wrapper's own
`overflow:hidden` clip the 133% width to the viewport.

---

### 3. Subtitle block — `section.our-team-subtitle-section`

```html
<section class="our-team-subtitle-section">
  <h2 class="text-align-center text-color-primary-dark my-0 mt-neg-10px">
    Our
  </h2>
  <h2 class="text-align-center text-color-primary-dark my-0">Team</h2>
  <div class="content-width">
    <h3 class="text-align-center max-w-620px mx-auto">
      We love caring for our patients and we also love the beach, read a little
      about each of our team members and see their favorite beach beyond the
      South Bay.
    </h3>
  </div>
</section>
```

(`our-team.html:113`)

#### 3.1 The section element has **zero CSS rules**

`grep -n 'our-team-subtitle' beachfront.css` → **no match**. There is no
`.our-team-subtitle-section` rule anywhere in the stylesheet, in any media
block, or in either inline `<style>`. It is a bare block box: `margin 0;
padding 0; position:static` `[probed, confirms absence]`. Do **not** invent
section padding here — every pixel of vertical space in this region comes from
the children's own margins.

#### 3.2 ⚠️ The section box **starts 10px above the hero's bottom edge**

`.text-align-center.text-color-primary-dark.my-0.mt-neg-10px`
`beachfront.css:4474-4476` → `margin-top: -10px` (a hard px, not rem — the same
at all three tiers). Because the section has no padding and no border, that
negative margin **collapses through the section's top edge** and drags the
section's border box up by 10px:

|             | 1440       | 834        | 390       |
| ----------- | ---------- | ---------- | --------- |
| hero bottom | 475.19     | 500.39     | 370.5     |
| section y   | **465.19** | **490.39** | **360.5** |
| overlap     | **−10px**  | **−10px**  | **−10px** |

This is exactly the class of fact CLAUDE.md #1 exists for: the gate cuts on the
section box, so the `Our` region's first 10px are _hero pixels_. A rebuild that
puts this space in the hero's `padding-bottom` (or drops the negative margin and
compensates elsewhere) will move the region boundary and fail the cut even
though the render looks identical. `[probed]` confirms −10 at all three tiers.

Also in play: `.my-0` `beachfront.css:3804-3807` (`margin-top:0;
margin-bottom:0`) zeroes `h2`'s `20px/10px` (`beachfront.css:2116-2117`) on
**both** headings, so the two lines butt directly against each other.

#### 3.3 Type — `h2` "Our" and "Team"

Both are `h2` (`beachfront.css:2114-2122`) recoloured by
`.text-color-primary-dark` `beachfront.css:5897-5899` → `var(--primary-dark)`
= `#365b6d` (`beachfront.css:2049`), centred by `.text-align-center`
`beachfront.css:4460-4463`. ≤991 `beachfront.css:7858-7861` → 72/80. ≤479
`beachfront.css:9012-9016` → 56/70.

|                         | 1440                     | 834                 | 390                |
| ----------------------- | ------------------------ | ------------------- | ------------------ |
| font-size / line-height | **140 / 168**            | **72 / 80**         | **56 / 70**        |
| family / weight         | museo-slab / 100         | ←                   | ←                  |
| colour                  | `rgb(54,91,109)`         | ←                   | ←                  |
| ls / transform          | normal / none            | ←                   | ←                  |
| "Our" margin            | `-10px 0 0 0`            | ←                   | ←                  |
| "Team" margin           | `0`                      | ←                   | ←                  |
| "Our" rect              | `{0, 465.19, 1440, 168}` | `{0,490.39,834,80}` | `{0,360.5,390,70}` |
| "Team" rect             | `{0, 633.19, 1440, 168}` | `{0,570.39,834,80}` | `{0,430.5,390,70}` |

At ≤479 `beachfront.css:9042-9044` also adds `.text-align-center{white-space:normal}`.

#### 3.4 Type — the lede `h3`

Wrapped in a plain `.content-width` (chrome §2 — max-width 1400, pad-x
`1.5rem` `beachfront.css:5858-5867`, `8%` ≤767 `:8627-8630`, `5%` ≤479
`:9164-9167`).

Base `h3` `beachfront.css:2124-2132`: `color:var(--primary) #129ecc;
margin:20px 0 10px; museo-slab; 40px/50px; weight 300`.
`.text-align-center.max-w-620px` `beachfront.css:4505-4507` → `max-width:620px`.
`.mx-auto` `beachfront.css:3844-3847`.
≤991 `beachfront.css:7863-7866` → `21px/26px`.
≤767 `beachfront.css:8421-8424` `.text-align-center.max-w-620px.mx-auto` →
`font-size:20px; line-height:30px`.
≤479 `beachfront.css:9060-9062` → `font-size:20px` **only** (line-height stays
30 from the ≤767 rule).

|                          | 1440                         | 834                      | 390                                                              |
| ------------------------ | ---------------------------- | ------------------------ | ---------------------------------------------------------------- |
| font-size / line-height  | **40 / 50**                  | **21 / 26**              | **20 / 30**                                                      |
| family / weight / colour | museo-slab / 300 / `#129ecc` | ←                        | ←                                                                |
| max-width                | 620px                        | 620px                    | 620px (**but** box is 351 — the column is narrower than the cap) |
| margin                   | `20px auto 10px`             | ←                        | ←                                                                |
| rect `[probed]`          | `{410, 821.19, 620, 250}`    | `{107, 670.39, 620, 78}` | `{19.5, 520.5, 351, 150}`                                        |

**Three-tier, and the middle tier is not a midpoint** — 40 → 21 → 20. A ladder
that interpolates (e.g. 40/28/20) is wrong. At 767 it is already 20/30
`[probed]`, at 768 still 21/26 `[probed]`.

Copy (verbatim, one sentence, no `<br>`):

> We love caring for our patients and we also love the beach, read a little about each of our team members and see their favorite beach beyond the South Bay.

---

### 4. Team grid — `section.team-grid-section`

```html
<section class="team-grid-section">
  <div class="content-width">
    <div class="w-dyn-list">
      <div
        role="list"
        class="display-flex flex-justify-center w-dyn-items w-row"
      >
        <div
          data-w-id="25862c8e-db8f-e3bf-7fef-7e81f2689c8f"
          style="transform:translate3d(0, 4rem, 0) …;opacity:0"
          role="listitem"
          class="team-list-item m-2 w-dyn-item w-col w-col-4"
        >
          <a href="/team-members/<slug>" class="inline-link w-inline-block"
            ><img class="team-grid-headshot" …
          /></a>
          <a href="/team-members/<slug>" class="inline-link w-inline-block"
            ><h5 class="text-align-center">Name</h5></a
          >
          <h6 class="text-align-center h7">Role</h6>
          <div class="position-relative">
            <p class="m-2 team-teaser text-body mb-1">teaser…</p>
          </div>
          <img class="team-grid-beach" alt="<Beach>" … />
          <h6 class="team-beach-name">Beach</h6>
          <a
            href="/team-members/<slug>"
            class="flex-justify-start w-inline-block"
          >
            <div
              class="team-teasewr-read-more flex-child-align-end flex-align-end display-flex"
            >
              read more
            </div>
            <img
              class="read-more-arrow filter-to-primary-dark"
              src="…Arrow.svg"
            />
          </a>
        </div>
        × 11
      </div>
    </div>
  </div>
</section>
```

(`our-team.html:113`)

#### 4.1 Section + container

`.team-grid-section` `beachfront.css:6526-6528` — `text-decoration:none`. That
is the **entire** rule. No padding, no margin, no background. All vertical space
in this section is the cards' own margins (§4.3).

`.content-width` per chrome §2 → column **1280 / 738 / 351** at x **80 / 48 /
19.5** `[probed]`. `.w-dyn-list` and `.w-dyn-item` have **no rules** in
`beachfront.css` (`grep` → 0 hits) — they are pass-through wrappers.

#### 4.2 The flex row and its hidden `font-size` bomb

`div.display-flex.flex-justify-center.w-dyn-items.w-row`:

- `.display-flex` `beachfront.css:3023-3026` → `flex-wrap:wrap; display:flex`
- `.flex-justify-center` `beachfront.css:2984-2987` → `justify-content:center; display:flex`
- ≤767 `beachfront.css:8386-8388` → `.display-flex{flex-wrap:wrap}` (no-op)
- ≤767 `beachfront.css:872-875` → `.w-row{margin-left:0; margin-right:0}`
- **≤991 `beachfront.css:7890-7892` → `.display-flex { font-size: .6rem }`**

That last rule is the page's most dangerous single line. It sets an _inherited_
font-size of `.6rem` on every `.display-flex` element at ≤991 — **19.2px at
834, 14.4px at 390, and NOT APPLIED at 992** (root 32 but Webflow gate not yet
fired). Every card descendant that declares its own size is unaffected; the one
that is not is the read-more label (§4.9), which also carries `display-flex`.
Measured inherited size on `.w-dyn-items` `[probed]`: **64px / 19.2px / 14.4px**.

Because the row is `display:flex`, `.w-col`'s `float:left`
(`beachfront.css:730`) is inert, and the cards' margins **do not collapse**.

#### 4.3 ⚠️ `.team-list-item` — the four-value box ladder

Declared in **four** places, at both gate families:

| source                            | rule                                                                                                                           |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `beachfront.css:6530-6536`        | `.team-list-item { background-color: var(--primary-light); border-radius: 20px; width: 8rem; height: 12rem; padding-left: 0 }` |
| `beachfront.css:6538-6540`        | `.team-list-item.m-2 { margin-top: 4rem }`                                                                                     |
| `beachfront.css:3762-3764`        | `.m-2 { margin: .5rem }` (shorthand; `margin-top` then overridden by `:6539`)                                                  |
| `beachfront.css:8183-8187` (≤991) | `.team-list-item.m-2 { width: 16rem; height: 24rem; margin: 8rem 1rem 1rem }`                                                  |
| `beachfront.css:9271-9276` (≤479) | `.team-list-item.m-2 { width: 100%; height: 16rem; margin-top: 4rem; padding-top: 2.5rem }`                                    |
| `beachfront.css:729-736`          | `.w-col { float:left; width:100%; min-height:1px; padding-left:10px; padding-right:10px; position:relative }`                  |
| `beachfront.css:755-757`          | `.w-col-4 { width: 33.3333% }` — **loses** to `:6533` (same specificity, later line)                                           |

Cascade notes that a rebuild gets wrong:

- `padding-left:0` at `:6535` beats `.w-col{padding-left:10px}` at `:733`
  (same specificity 0-1-0, later wins) but **`padding-right:10px` survives**.
  The card's padding is therefore **asymmetric: `0 10px 0 0`** at every tier
  `[probed: paddingRight 10px, paddingLeft 0 at 1440/834/390]`.
- The ≤479 rule sets only `margin-top`, so `margin-right/bottom/left` stay at
  the ≤991 shorthand's `1rem`.
- `.w-col{position:relative}` (`:735`) is what makes the card the containing
  block for `.team-grid-beach` and `.team-beach-name` (§4.7, §4.8). The card
  itself declares no `position`.

**Resolved across the seven-width matrix `[probed]`** — this table is the whole
reason the matrix is seven wide:

| viewport | root | Webflow tier | width     | height  | margin-top | margin r/b/l | padding-top | cards per row |
| -------- | ---- | ------------ | --------- | ------- | ---------- | ------------ | ----------- | ------------- |
| **1440** | 40   | base         | **320**   | **480** | **160**    | 20           | 0           | **3**         |
| **992**  | 32   | base         | **256**   | **384** | **128**    | 16           | 0           | **3**         |
| **991**  | 32   | ≤991         | **512**   | **768** | **256**    | 32           | 0           | **1**         |
| **834**  | 32   | ≤991         | **512**   | **768** | **256**    | 32           | 0           | **1**         |
| **768**  | 24   | ≤991         | **384**   | **576** | **192**    | 24           | 0           | **1**         |
| **767**  | 24   | ≤991+767     | **384**   | **576** | **192**    | 24           | 0           | **1**         |
| **390**  | 24   | all          | **303** ¹ | **384** | **96**     | 24           | **60**      | **1**         |

¹ declared `width:100%` = 351 (the `.content-width` column) but the 24+24 side
margins overflow the flex line, so `flex-shrink:1` takes it to **303**
`[probed-only — a flex-shrink result, not a declared number]`.

**Four distinct widths across 768–1440 (320 / 256 / 512 / 384).** A two-tier
ladder keyed at 768 renders 320 where live renders 512 at 834 — a 60% error
that a diluted region (§A.1) can still pass.

Row pitch is fully derivable: `height + margin-bottom + next margin-top` =
`480+20+160 = 660` @1440, `768+32+256 = 1056` @834, `384+24+96 = 504` @390.
Section height = 11 rows × pitch at md/sm, 4 rows at lg:
**2640 / 11616 / 5544** `[probed, matches derivation exactly]`.

Card x positions @1440 `[probed]`: rows 1–3 at **200 / 560 / 920**; row 4 has
only 2 cards and is **centred at 380 / 740** (from `.flex-justify-center`
`:2985`) — the trailing row is NOT left-aligned.

Background `var(--primary-light)` = `#e7f5fa` (`beachfront.css:2051`) →
`rgb(231,245,250)`. Border-radius **20px** flat at every tier (`:6532`) — not
a rem, do not scale it.

#### 4.4 ⚠️ `.team-grid-headshot` — a second four-value ladder, and `margin-top` does not reset

| source                            | rule                                                                                                                                                                                      |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `beachfront.css:6551-6562`        | `object-fit:cover; object-position:50% 0%; border-radius:100rem; width:5rem; height:5rem; margin-top:-2.5rem; margin-left:auto; margin-right:auto; transition:opacity .2s; display:block` |
| `beachfront.css:8193-8197` (≤991) | `width:10rem; height:10rem; margin-top:-5rem`                                                                                                                                             |
| `beachfront.css:9284-9287` (≤479) | `width:5rem; height:5rem` — **`margin-top` is NOT restated**                                                                                                                              |

| viewport | width = height | margin-top | note                                                                                                                            |
| -------- | -------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **1440** | **200**        | **−100**   |                                                                                                                                 |
| **992**  | **160**        | **−80**    |                                                                                                                                 |
| **991**  | **320**        | **−160**   |                                                                                                                                 |
| **834**  | **320**        | **−160**   |                                                                                                                                 |
| **768**  | **240**        | **−120**   |                                                                                                                                 |
| **390**  | **120**        | **−120**   | ⚠️ `−5rem` leaks from the ≤991 block while width drops back to `5rem` — the pull-up equals the **full** avatar height, not half |

`border-radius:100rem` computes to **4000 / 3200 / 2400px** `[probed]` — a
plain `border-radius:50%` is visually equivalent here but will not match a
computed-style diff.

`margin-left/right:auto` centres it: computed **55 / 91 / 86.5px** `[probed]`.
Rect @1440 `{255, 1141.19, 200, 200}`; @834 `{252, 854.39, 320, 320}`;
@390 `{130, 716.5, 120, 120}`.

Geometry check (derive, don't hardcode): @390 card border-box top 776.5 +
`padding-top:60` = content top 836.5, − 120 = **716.5** ✓.

Assets — 11 distinct real files, all under
`https://cdn.prod.website-files.com/64b1c843b071dc32170ea053/`:

| #   | member              | headshot file                                              | srcset widths                    |
| --- | ------------------- | ---------------------------------------------------------- | -------------------------------- |
| 1   | Dr. Robert Quan     | `64bb0fbee7ccd4a6c98eb3bc_BD_Dr-Quan-Headshot_crop.jpg`    | 500,800,1080,1600,2000,2600,2899 |
| 2   | Dr. Michael Hopkins | `64bb0fca292b8b83528cc2ff_BD_Dr-Hopkins-Headshot_crop.jpg` | 500…3200,4055                    |
| 3   | Stacey              | `64bb0dfdfd2a4cab9f4157f7_DSC_7537_sq_headshot_crop.jpg`   | 500…2151                         |
| 4   | Enrique             | `64bb0ecf51f2b29911ad5374_enrique.jpg`                     | 500,800,1134                     |
| 5   | Alicia              | `64bc459e10fba50752b252b6_Alicia_7530_crop.jpg`            | 500…3408                         |
| 6   | Linda               | `64bc4b3dfa9c2b4c2d919bb3_Linda_edit_7595.jpg`             | 500…1800                         |
| 7   | Michelle            | `64bc4c68082c3534bd2fc72a_michelle_beachfront.jpg`         | 500…1800                         |
| 8   | Christina           | `64bc4d1ccc874d4a3f88fb11_BH_christina_DH.jpg`             | 500…2448                         |
| 9   | Sabrina             | `64bc4daf6430fa15b0c2480a_BH_sabrina.jpg`                  | 500…2448                         |
| 10  | Raquel              | `64bc4ed80b3b039b77fbb8ca_raquel-beachfront.jpg`           | 500…1800                         |
| 11  | Lanette             | `64bc51dd4bea106fb5db4e6a_lanette_beachfront.jpg`          | 500…1800                         |

All 11 carry the identical `sizes` attribute
`(max-width: 479px) 79vw, (max-width: 767px) 240px, (max-width: 991px) 32vw, 16vw`
(`our-team.html:113`) — note it is keyed to Webflow's 479/767/991, **not** the
root ladder, and `240px` in the 480–767 band is a fixed px entry.

#### 4.5 `h5` name — **flat 30/40 at all three tiers**

`<a class="inline-link w-inline-block"><h5 class="text-align-center">Name</h5></a>`.
`h5` `beachfront.css:2144-2152`: `color:var(--primary) #129ecc;
margin:10px 0; museo-slab; 30px/40px; weight 300`. `.text-align-center`
`:4460-4463`.

**There is no `h5` rule in any media block** — `beachfront.css:7853` (≤991)
covers h1/h2/h3/h4/h6 only, `:8373` (≤767) covers h1 only, `:9012` (≤479)
covers h2 only. Verified by grep for `^  h5` → 0 hits.

|                          | 1440                         | 834                    | 390                   |
| ------------------------ | ---------------------------- | ---------------------- | --------------------- |
| font-size / line-height  | **30 / 40**                  | **30 / 40**            | **30 / 40**           |
| weight / family / colour | 300 / museo-slab / `#129ecc` | ←                      | ←                     |
| margin                   | `10px 0`                     | ←                      | ←                     |
| rect                     | `{200, 1351.19, 310, 40}`    | `{161,1184.39,502,40}` | `{43.5,846.5,293,40}` |

Any responsive shrink here is a fabrication. (Same fact as `_chrome.md` §5.1
for `.footer-learn-more`, which does the same thing until ≤479.)

#### 4.6 `h6.h7` role label

`.h7` `beachfront.css:7734-7740`: `color:var(--primary-dark); font-family:
museo-sans, sans-serif; font-size:16px; font-weight:300; line-height:25px`.
Specificity 0-1-0 beats the `h6` element rules (0-0-1) at **every** tier, so
the ≤991 `h6{font-size:12px}` (`beachfront.css:7872-7875`) never applies here.
Retained from `h6` `beachfront.css:2154-2164`: `letter-spacing:1.28px;
text-transform:uppercase; margin:10px 0`.

|                         | 1440                            | 834                    | 390                   |
| ----------------------- | ------------------------------- | ---------------------- | --------------------- |
| font-size / line-height | **16 / 25**                     | **16 / 25**            | **16 / 25**           |
| family / weight         | museo-sans / 300 (`:7736-7738`) | ←                      | ←                     |
| colour                  | `#365b6d` (`:7735`)             | ←                      | ←                     |
| letter-spacing          | **1.28px** (`:2156`)            | ←                      | ←                     |
| transform               | uppercase (`:2157`)             | ←                      | ←                     |
| margin                  | `10px 0` (`:2158-2159`)         | ←                      | ←                     |
| rect                    | `{200, 1401.19, 310, 25}`       | `{161,1234.39,502,25}` | `{43.5,896.5,293,25}` |

Source text is mixed-case (`Dentist`, `Dental Hygenist`) and uppercased by CSS —
keep the source casing or content diffs will not close.

#### 4.7 `p.team-teaser` — a **`ch`-height clip** pinned to 16px at every tier

`<div class="position-relative">` (`beachfront.css:4291-4293`) wraps
`<p class="m-2 team-teaser text-body mb-1">`.

| source                            | rule                                                                                                      |
| --------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `beachfront.css:2166-2172`        | `p { color:var(--primary-dark); margin-bottom:10px; font-size:20px; font-weight:300; line-height:1.5em }` |
| `beachfront.css:3762-3764`        | `.m-2 { margin: .5rem }`                                                                                  |
| `beachfront.css:3770-3773`        | `.m-2.team-teaser { height: 7.5ch; overflow: hidden }`                                                    |
| `beachfront.css:3775-3777`        | `.m-2.team-teaser.text-body.mb-1 { font-size: 16px }`                                                     |
| `beachfront.css:3973-3975`        | `.mb-1 { margin-bottom: .25rem }` (later than `.m-2`, so it wins the bottom)                              |
| `beachfront.css:7751-7754`        | `.text-body { font-size:20px; line-height:1.5em }`                                                        |
| `beachfront.css:7968-7970` (≤991) | `.m-2.max-h-25, .m-2.team-teaser { white-space: normal }`                                                 |

**Specificity 0-4-0 on `:3775` beats every media-query `.text-body` /`p` rule**
(`:7877` ≤991 p 16px, `:8359` ≤991 .text-body 16px, `:8378` ≤767 p 16px,
`:8981` ≤767 .text-body lh, `:9018` ≤479 p 12px, `:9555` ≤479 .text-body 16px).
Result: **16px / 24px at all three tiers** `[probed 1440/834/390 all 16px/24px]`.

Consequently `7.5ch` resolves against a 16px museo-sans and the clip height is
**75px at every tier** `[probed]` — 1ch = 10px. `[probed-only]` for the `ch`
→ px factor; it depends on the Typekit `museo-sans` "0" advance width and will
be wrong if the font falls back.

|                                    | 1440                         | 834                    | 390                   |
| ---------------------------------- | ---------------------------- | ---------------------- | --------------------- |
| font-size / line-height            | **16 / 24**                  | **16 / 24**            | **16 / 24**           |
| family / weight / colour           | museo-sans / 300 / `#365b6d` | ←                      | ←                     |
| height (`7.5ch`)                   | **75px**                     | **75px**               | **75px**              |
| overflow                           | hidden                       | ←                      | ←                     |
| margin (`.5rem` / `.25rem` bottom) | `20 20 10 20`                | `16 16 8 16`           | `12 12 6 12`          |
| rect                               | `{220, 1446.19, 270, 75}`    | `{177,1275.39,470,75}` | `{55.5,933.5,269,75}` |

The margins are the only rem values here, so this is the classic pattern the
project keeps getting wrong: **flat type on a three-tier spacing ladder.**

Teaser copy is CMS-truncated with a literal trailing `…`; reproduce verbatim
including the typos (`Dr Robert Quan` with no period, `Dental Hygenist` for
Stacey/Alicia vs `Dental Hygienist` for Christina/Sabrina/Lanette, `SCROC`
for Linda vs `SROC` for Michelle):

| #   | slug                 | name                | role                | beach         | teaser                                                                                                |
| --- | -------------------- | ------------------- | ------------------- | ------------- | ----------------------------------------------------------------------------------------------------- |
| 1   | `dr-robert-quan`     | Dr. Robert Quan     | Dentist             | Bali          | Dr Robert Quan was born and raised in the Central Valley in Fresno, CA. He...                         |
| 2   | `dr-michael-hopkins` | Dr. Michael Hopkins | Dentist             | Cabo          | Dr. Michael Hopkins grew up locally in the South Bay, where he graduated from Palos Verdes...         |
| 3   | `stacey`             | Stacey              | Dental Hygenist     | Cabo          | Stacey joined our dental team as a Dental Hygienist in 2020. We are excited...                        |
| 4   | `enrique`            | Enrique             | Dental Assistant    | Cabo          | Enrique joined our dental team as a Dental Assistant in 2021. We...                                   |
| 5   | `alicia`             | Alicia              | Dental Hygenist     | Santa Barbara | Alicia has been a part of our dental team as a Dental Hygienist since 2010. She was...                |
| 6   | `linda`              | Linda               | Administrator       | Myrtle Beach  | Linda has been a Registered Dental Assistant for over 25 years after graduating from SCROC in 1991... |
| 7   | `michelle`           | Michelle            | Administrator       | Cabo          | Michelle has been a Registered Dental Assistant for over 25 years after graduating from SROC...       |
| 8   | `christina`          | Christina           | Dental Hygienist    | Myrtle Beach  | Christina joined our dental team as a Registered Dental Hygienist in December 2016. Christina...      |
| 9   | `sabrina`            | Sabrina             | Dental Hygienist    | Santa Barbara | Sabrina joined our dental team as a Registered Dental Hygienist in 2017. Sabrina was born...          |
| 10  | `raquel`             | Raquel              | Hygiene Coordinator | Bali          | Raquel has been part of our team since 2017 as our Hygiene Coordinator. She...                        |
| 11  | `lanette`            | Lanette             | Dental Hygienist    | Cabo          | Lanette joined our dental team as a Dental Hygienist in 2021. We are excited to have her...           |

Card order is fixed by the CMS collection and is **not** alphabetical.

#### 4.8 `.team-grid-beach` + `.team-beach-name` — the absolute overlay

`.team-grid-beach` `beachfront.css:6564-6573`: `object-fit:cover;
border-bottom-right-radius:20px; border-bottom-left-radius:20px; width:100%;
height:30%; display:block; position:absolute; bottom:0`. **No responsive
override anywhere** — the ladder comes entirely from `height:30%` of §4.3's
card height:

|                | 1440                       | 834                     | 390                         |
| -------------- | -------------------------- | ----------------------- | --------------------------- |
| width × height | **320 × 144**              | **512 × 230.39**        | **303 × 115.19**            |
| radii          | `0 0 20px 20px`            | ←                       | ←                           |
| rect           | `{200, 1577.19, 320, 144}` | `{161,1552,512,230.39}` | `{43.5,1045.31,303,115.19}` |

Containing block is the card, via `.w-col{position:relative}`
`beachfront.css:735` — **not** any rule on `.team-list-item`.
Note `width:100%` here resolves against the card's **padding box**, which is
`width − padding-right(10)`… but the probe shows 320/512/303 = full card width,
because `box-sizing:border-box` (`beachfront.css:214-216`) and `width:100%` on
an absolutely-positioned child resolves against the **padding box** = card
width. Reproduce the box model.

`.team-beach-name` `beachfront.css:7370-7376`: `color:#fff; font-weight:300;
position:absolute; bottom:.25rem; left:.5rem`. Type inherits `h6`
`beachfront.css:2154-2164` (museo-slab, 24px/30px, ls 1.28px, uppercase,
margin 10px 0), weight overridden 700→**300**. ≤991 `beachfront.css:7872-7875`
→ `12px/15px`. No ≤767/≤479 h6 rule.

|                            | 1440                        | 834                      | 390                      |
| -------------------------- | --------------------------- | ------------------------ | ------------------------ |
| font-size / line-height    | **24 / 30**                 | **12 / 15**              | **12 / 15**              |
| family / weight / colour   | museo-slab / 300 / `#fff`   | ←                        | ←                        |
| letter-spacing / transform | 1.28px / uppercase          | ←                        | ←                        |
| `bottom` (`.25rem`)        | **10px**                    | **8px**                  | **6px**                  |
| `left` (`.5rem`)           | **20px**                    | **16px**                 | **12px**                 |
| rect                       | `{220, 1671.19, 61.17, 30}` | `{177,1749.39,33.14,15}` | `{55.5,1129.5,33.14,15}` |

Type is 24/12/12 (two-tier, gated at 991) while position is 10/8/6 (three-tier,
gated at 992/768). Both ladders live on the same element — this is the offset in
miniature.

Beach assets (5 distinct files reused across 11 cards):

| beach         | file (under `…/64b1c843b071dc32170ea053/`)                                           | used by                    |
| ------------- | ------------------------------------------------------------------------------------ | -------------------------- |
| Bali          | `64bb0f96fd2a4cab9f42ccaa_beach-img_elizeu-dias-RN6ts8IZ4_0-unsplash.jpg`            | Quan, Raquel               |
| Cabo          | `64bb1017e17c11a72e17236f_beach-img_gaddafi-rusli-2ueUnL4CkV8-unsplash.jpg`          | Hopkins, Michelle, Lanette |
| Cabo          | `64bb0e4c778125db87203f95_beach-img_lalo-hernandez-Amo081zdJsI-unsplash.jpg`         | Stacey, Enrique            |
| Santa Barbara | `64bc4afd03823445f34950b3_beach-img_cristofer-maximilian-uQDRDqpYJHI-unsplash.jpg`   | Alicia, Sabrina            |
| Myrtle Beach  | `64bc4bcdb9c30f671929f6d2_beach-img_aleksandra-boguslawska-MS7KD9Ti7FQ-unsplash.jpg` | Linda, Christina           |

Two files named "Cabo" — the label is CMS text, not derived from the file.
Nine of the eleven carry
`sizes="(max-width: 479px) 90vw, (max-width: 767px) 74vw, (max-width: 991px) 52vw, 26vw"`
plus a full `srcset`; **Alicia's and Sabrina's (Santa Barbara) ship `src` only,
with no `sizes` and no `srcset`** (`our-team.html:113`). That asymmetry is in
the source, not a capture artifact.

`alt` text = the beach name (`Bali`, `Cabo`, `Santa Barbara`, `Myrtle Beach`);
headshot `alt` is empty.

#### 4.9 ⚠️ "read more" — the label gets **bigger** at md than at desktop

```html
<a href="/team-members/<slug>" class="flex-justify-start w-inline-block">
  <div
    class="team-teasewr-read-more flex-child-align-end flex-align-end display-flex"
  >
    read more
  </div>
  <img
    class="read-more-arrow filter-to-primary-dark"
    src="…64b070f15651708aded7ab3e_Arrow.svg"
  />
</a>
```

(note the class-name typo `teasewr` — reproduce it or selector-based diffs break)

Anchor: `.flex-justify-start` `beachfront.css:2977-2982` →
`background-color:#129ecc00; justify-content:flex-start; text-decoration:none;
display:flex`. Plus `.w-inline-block` `beachfront.css:246-249`
(`max-width:100%; display:inline-block` — overridden to flex).
The `a` base `beachfront.css:2174-2179` contributes `border-radius:5px` (visible
in computed style) and `transition:opacity .2s`.

Label: `.team-teasewr-read-more` `beachfront.css:7429-7441` →
`color:var(--primary-dark); text-align:right; letter-spacing:1.03px;
text-transform:uppercase; margin-left:.5rem; margin-right:.5rem;
font-size:16px; font-weight:300; line-height:1.5em; text-decoration:none;
display:block`.

**But the element also carries `display-flex`, so at ≤991
`beachfront.css:7890-7892` (`.display-flex{font-size:.6rem}`) overrides the
declared 16px** — same specificity (0-1-0), later in the file, and inside the
≤991 media block. Verified by matched-rule enumeration `[probed]`.

| viewport | root | font-size  | line-height (`1.5em`) | margin-x (`.5rem`) | source of size               |
| -------- | ---- | ---------- | --------------------- | ------------------ | ---------------------------- |
| **1440** | 40   | **16px**   | **24px**              | **20px**           | `:7436`                      |
| **992**  | 32   | **16px**   | **24px**              | **16px**           | `:7436` (≤991 not yet fired) |
| **991**  | 32   | **19.2px** | **28.8px**            | **16px**           | `:7891` `.6rem`              |
| **834**  | 32   | **19.2px** | **28.8px**            | **16px**           | `:7891`                      |
| **768**  | 24   | **14.4px** | **21.6px**            | **12px**           | `:7891`                      |
| **390**  | 24   | **14.4px** | **21.6px**            | **12px**           | `:7891`                      |

Family museo-sans / weight 300 / colour `#365b6d` / ls **1.03px** / uppercase /
text-align right — flat at all tiers.
Rect `[probed]`: @1440 `{220, 1531.19, 100.5, 24}` · @834
`{177, 1358.39, 118.73, 28.8}` · @390 `{55.5, 1014.5, 91.38, 21.59}`.

Arrow: `.read-more-arrow` has **no CSS rule anywhere**
(`grep -n 'read-more-arrow' beachfront.css` → 0 hits; not in either inline
`<style>` either). It renders at its **intrinsic 10 × 11px**
`[probed: naturalWidth 10, naturalHeight 11]`, then the parent's
`display:flex` + default `align-items:stretch` stretches its **height to the
flex line**: computed **10 × 24 / 10 × 28.8 / 10 × 21.59** `[probed]`. The only
styling is `.filter-to-primary-dark` from `our-team.html:77-79`:
`filter: brightness(0%) saturate(100%) invert(29%) sepia(33%) saturate(599%) hue-rotate(155deg) brightness(100%) contrast(87%)`.
Asset:
`https://cdn.prod.website-files.com/64af3f93339537d6b661b556/64b070f15651708aded7ab3e_Arrow.svg`
(11 identical uses; also mirrored locally at `matching/spec/live-arrow.svg`).
**Do not redraw it as an inline SVG or a border triangle.**

#### 4.10 Structural facts only visible in source

1. **Every card ships a pre-settle inline transform.** `our-team.html:113`
   carries, on all 11 items, the same
   `style="-webkit-transform:translate3d(0, 4rem, 0) scale3d(1,1,1) rotateX(0) rotateY(0) rotateZ(0) skew(0,0); … transform:translate3d(0, 4rem, 0) …; opacity:0"`.
   This is IX2 `useFirstGroupAsInitialState` baked into the HTML (§D).
2. **All 11 cards share ONE `data-w-id`** — `25862c8e-db8f-e3bf-7fef-7e81f2689c8f`
   — because Webflow repeats the CMS item. IX2 still binds per element.
3. **After settle the card keeps an inline `transform`** —
   `translate3d(0px, 0rem, 0px) scale3d(1,1,1)…; opacity:1;
transform-style:preserve-3d` `[probed]` → computed
   `matrix(1, 0, 0, 1, 0, 0)`, i.e. **not `none`**. The card therefore creates
   a stacking context and a containing block for fixed descendants. A rebuild
   that ends with `transform:none` will differ in computed-style diffs.
4. `.w-dyn-list` / `.w-dyn-item` / `.w-dyn-items` have **no** stylesheet rules;
   the only Webflow-grid rules that touch the card are `.w-col` / `.w-col-4`
   (§4.3). There is **no** slider, tab, or lightbox widget on this page.
5. The row is `role="list"` with `role="listitem"` children — keep the ARIA or
   accessibility diffs open.

---

### 5. Closing CTA band — chrome

`_chrome.md` §4 in full. Page-specific y `[probed]`: `<h2>` at **3761.19**
(h 504) @1440, `.fiji-section` at **4305.19** (h 800), `12406.39` / `12678.39`
@834, `6248.5` / `6452.5` @390. Copy, gradient, wave, FIJI label, Read Reviews
toggle and reveal timing are all shared.

### 6. Footer — chrome

`_chrome.md` §5 in full. `.footer-info-section` y `[probed]`:
**4961.19 / 13235 / 6686.5**; `.footer-learn-more` at **4981.19 / 13251 /
6698.5**. Only per-page variance is `aria-current="page"` + `w--current` on the
`Our Team` link.

---

## C. Interaction inventory

Counting rule: an **affordance** = an element that has an `href`, a bound click
handler (jQuery or IX2), or is a form control. Descendants that merely inherit
`cursor:pointer` from an affordance are not counted separately (they are listed
in C.3 so the number is reproducible).

### C.1 Shared chrome affordances — 31

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

| #     | element                   | selector                                                                                                                                    | mechanism                                                                                                                   | source      |
| ----- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ----------- |
| 1     | form-modal logo link      | `.form-modal a.inline-link` → `/`                                                                                                           | href                                                                                                                        | chrome §3.6 |
| 2     | form-modal close X        | `.form-modal img.header-hamburger[data-w-id=b914d569-…]`                                                                                    | IX2 `a-6` hide-form-modal, 500ms, `translateY(-150vh)`                                                                      | chrome §3.6 |
| 3–6   | 4 form fields             | `#name-2`, `#Email-2`, `#Phone`, `#message`                                                                                                 | native                                                                                                                      | chrome §3.6 |
| 7     | form submit               | `input.button.text-color-primary`                                                                                                           | native                                                                                                                      | chrome §3.6 |
| 8     | header logo               | `a.link-block-5` → `/`                                                                                                                      | href                                                                                                                        | chrome §3.2 |
| 9     | header hamburger          | `a.link-block-4` / `img[data-w-id=d74a87ea-…]`                                                                                              | IX2 `a-4` show-nav-modal, 500ms `ease`, `translateY(+150vh)`                                                                | chrome §3.4 |
| 10–16 | 7 nav-panel links         | `a.no-text-dec` → `/`, `/your-first-visit`, `/our-team` **(w--current)**, `/services`, `/ask-the-doctor`, `/contact-us`, `tel:310-378-9241` | href                                                                                                                        | chrome §3.1 |
| 17    | nav "Book an Appointment" | `a.button.show-form.nav[data-w-id=6eca16bd-…]`                                                                                              | jQuery `showForm` (`our-team.html:126-128,135`) + IX2 `a-5`                                                                 | chrome §3.6 |
| 18    | nav "Make a Payment"      | `a.button.nav` → `app.modento.io`                                                                                                           | href                                                                                                                        | chrome §3.1 |
| 19    | nav-panel close X         | `img.header-hamburger[data-w-id=8dfa6638-…]`                                                                                                | IX2 `a-3` hide-nav-modal                                                                                                    | chrome §3.4 |
| 20    | CTA "Book Appointment"    | `a.button.show-form[data-w-id=1273e294-…4f60]`                                                                                              | jQuery + IX2 `a-5`                                                                                                          | chrome §4.3 |
| 21    | "Read Reviews" toggle     | `.block-link.social-link-block[data-w-id=9daf7a34-…]`                                                                                       | jQuery `$('.social-link-block').click(toggle)` (`our-team.html:149`, `toggle` from `incidental-utils.js`) + IX2 `a-8`/`a-9` | chrome §4.4 |
| 22–24 | 3 social links            | `a._w-8.clickable` → Google Maps / Facebook / Yelp                                                                                          | href (hidden until #21 fires)                                                                                               | chrome §4.4 |
| 25–28 | 4 footer links            | `a.inline-link` → `/your-first-visit`, `/our-team` **(w--current)**, `/services`, `/ask-the-doctor`                                         | href                                                                                                                        | chrome §5.3 |
| 29    | footer "Make a Payment"   | `a.button[data-w-id=b1ce8885-…]`                                                                                                            | href + IX2 `a-5`                                                                                                            | chrome §5.3 |
| 30    | footer phone              | `a.inline-link[href="tel:(310)-378-9241"]`                                                                                                  | href                                                                                                                        | chrome §5.5 |
| 31    | Google Map widget         | `.footer-map[data-enable-scroll=true][data-enable-touch=true]`                                                                              | Maps JS (drag/zoom)                                                                                                         | chrome §5.7 |

### C.2 Page-unique affordances — 33 (3 per card × 11)

| per card | selector       | target                                                  |
| -------- | -------------- | ------------------------------------------------------- |
| a        | headshot link  | `a.inline-link.w-inline-block > img.team-grid-headshot` | `/team-members/<slug>` |
| b        | name link      | `a.inline-link.w-inline-block > h5`                     | `/team-members/<slug>` |
| c        | read-more link | `a.flex-justify-start.w-inline-block` (label + arrow)   | `/team-members/<slug>` |

× 11 slugs: `dr-robert-quan`, `dr-michael-hopkins`, `stacey`, `enrique`,
`alicia`, `linda`, `michelle`, `christina`, `sabrina`, `raquel`, `lanette`.

**Hover behaviour differs between (a)/(b) and (c) — this is real, not a bug:**

| affordance               | rule                                                                                                             | before → after `[probed 1440/834/390, identical]` |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| headshot link, name link | `.inline-link:hover{opacity:.6}` `beachfront.css:7391-7393` (0-2-0)                                              | `1` → **`0.6`**                                   |
| read-more link           | falls through to `a:hover{opacity:.61}` `beachfront.css:2181-2183` — there is **no** `.flex-justify-start:hover` | `1` → **`0.61`**                                  |
| headshot `<img>` itself  | `transition:opacity .2s` declared `beachfront.css:6560` but **no `:hover` rule exists**                          | `1` → **`1`** (no change)                         |

There is no `.team-list-item:hover`, no `.team-grid-headshot:hover`, no
`.team-teasewr-read-more:hover`, no `.read-more-arrow:hover` anywhere in
`beachfront.css` (grep confirmed). The card as a whole is **not** a hover
target. The cards' IX2 inline `opacity:1` (§4.10.3) sits on the _card_, not the
links, so unlike the CTA button (chrome §4.7) these links **do** dim.

### C.3 Matched by the regex but NOT separate affordances

Listed so the count is reproducible, not to be built as interactions:
`.dropdown-modal`, `.modal-link-container`, `.modal-link` ×7,
`.modal-form-container`, `.form-modal`, `.plus-minus-block`,
`img.expanding-plus`, `img.expanding-minus`, `.socials-container`,
`.header-logo` ×3 (`cursor:pointer` from `beachfront.css:6091` — the nav-panel
logo at `.position-absolute-top-left` has **no** href and **no** IX2 binding, a
pure pointer decoy), `.header-hamburger` ×3, `h5.text-align-center` ×11,
`div.team-teasewr-read-more` ×11, `img.read-more-arrow` ×11,
`img.team-grid-headshot` ×11, `div.footer-links` ×4, `div.footer-contact-info`
(phone). `[probed: 135 elements match the broad regex at 1440]`.

Also inert on this page: `$(".hide-form").click(hideForm)` (`our-team.html:136`)
binds to **zero elements** — no element on the page carries `.hide-form`
(`grep -o 'hide-form' our-team.html` → 1 hit, the script line itself). The form
modal can only be dismissed by IX2 `a-6`. Do not "fix" this.

**INTERACTION COUNT: 64**

---

## D. Animation census

All motion is Webflow IX2, read from
`Webflow.require("ix2").store.getState().ixData` `[probed-only — no stylesheet
line exists for any of it]`. Loaded by
`beachfront-dentistry.1897c86d.bafe3d049a8a5f18.js` (`our-team.html:113`).
**There is no IntersectionObserver of our own and no scroll-linked motion** —
IX2's `SCROLL_INTO_VIEW` is the only scroll trigger, and it is a one-shot
threshold, not a scrub.

| event                    | trigger                                      | target                                                          | action list                  |
| ------------------------ | -------------------------------------------- | --------------------------------------------------------------- | ---------------------------- |
| `e-139`                  | `SCROLL_INTO_VIEW`, `scrollOffsetValue: 0 %` | `25862c8e-…689c8f` = **`.team-list-item`, all 11**              | `a-7` "up and in"            |
| `e-73/75/77/85/87`       | `SCROLL_INTO_VIEW`, 0%                       | CTA h2 / button / reviews wrapper / button wrapper / FIJI label | `a-7` (chrome §4.7)          |
| `e-305`                  | `SCROLL_INTO_VIEW`, 0%                       | footer "Make a Payment"                                         | `a-7` (chrome)               |
| `e-9`                    | `MOUSE_CLICK`                                | idle hamburger `d74a87ea-…`                                     | `a-4` show-nav-modal         |
| `e-7`                    | `MOUSE_CLICK`                                | panel X `8dfa6638-…`                                            | `a-3` hide-nav-modal         |
| `e-17`, `e-303`, `e-307` | `MOUSE_CLICK`                                | CTA button / footer Make a Payment / nav Book an Appointment    | `a-5` show-form-modal        |
| `e-21`                   | `MOUSE_CLICK`                                | form-modal X `b914d569-…`                                       | `a-6` hide-form-modal        |
| `e-211` / `e-212`        | `MOUSE_CLICK` / `MOUSE_SECOND_CLICK`         | `.social-link-block` `9daf7a34-…`                               | `a-8` / `a-9` footer socials |

### D.1 `a-7` "up and in" — the page's only unique reveal

`useFirstGroupAsInitialState: true`.

| group            | actions                                                                                                      |
| ---------------- | ------------------------------------------------------------------------------------------------------------ |
| **g0 (initial)** | `TRANSFORM_MOVE yValue: 4, yUnit: rem` + `STYLE_OPACITY value: 0`, duration **500**, easing `''`             |
| **g1 (reveal)**  | `TRANSFORM_MOVE yValue: 0, yUnit: rem` + `STYLE_OPACITY value: 1`, duration **2000ms**, easing **`outExpo`** |

Because g0 is the initial state, the 4rem offset is **baked into the static
HTML** as an inline style on all 11 cards (§4.10.1) — a rebuild must ship the
same pre-settle state or the first paint differs.

**`4rem` travel resolves to three values: 160 / 128 / 96px** at 1440 / 834 /
390 (root ladder, `our-team.html:2-4,8-10,12-14`) — _not_ to the Webflow gates.
So the reveal distance and the card size step at **different** viewports.

Trigger geometry: `scrollOffsetValue: 0 %` means the action fires when the
element's top crosses the viewport bottom. Each of the 11 cards fires
**independently** as it scrolls in; there is no stagger/delay (`delay: 0`), so
cards in the same row fire together and later rows fire ~660px (1440) / 1056px
(834) / 504px (390) apart.

**Reading rects before settle gets the sign wrong** (the card is 4rem _below_
its final position while animating). Hold until
`document.getAnimations().every(a => a.playState !== "running")` — with a
2000ms outExpo the tail is long.

### D.2 CSS transitions on this page (not IX2)

| element               | transition    | source                                                                          |
| --------------------- | ------------- | ------------------------------------------------------------------------------- |
| `.team-grid-headshot` | `opacity .2s` | `beachfront.css:6560` (declared but nothing ever changes its opacity — see C.2) |
| `.inline-link`        | `opacity .2s` | `beachfront.css:7387`                                                           |
| `a`                   | `opacity .2s` | `beachfront.css:2178`                                                           |

No transition is declared on `.team-list-item`, `.team-grid-beach`,
`.team-beach-name`, `.team-teasewr-read-more`, or `.read-more-arrow`.

### D.3 Non-animation JS that runs on load

- `our-team.html:123` — jQuery injects the `.bot-wave` SVG (§2.4).
- `our-team.html:138-146` — a landscape `alert("Please use Portrait!")` fires
  when `innerWidth < 792 && innerHeight < innerWidth`, on load and on the
  debounced `window:resize` event from `incidental-utils.js`. **This will fire
  in a 768×… headless probe if the height is set below the width.** Keep probe
  viewports at height 900 or the dialog blocks the run.
- `matching/spec/incidental-utils.js` — supplies `toggle` (used by C.1 #21) and
  `getContentWidthMargin` (unused on this page; no slider here).

---

## E. Known-suspect list

Ordered by expected damage. Each is a concrete, cited source fact that a
two-tier rebuild gets wrong.

### E.1 ⭐ `.team-list-item` + `.team-grid-headshot` — the only elements on the site with a **four-value** size ladder

Both are declared at the ≤991 gate (`beachfront.css:8183-8187`, `:8193-8197`)
_and_ sized in `rem`, so they step at **991 (Webflow)** _and_ **992/768
(root)**. Measured, per §4.3/§4.4:

|             | 1440 | 992     | 991     | 834 | 768     | 390 |
| ----------- | ---- | ------- | ------- | --- | ------- | --- |
| card width  | 320  | **256** | **512** | 512 | **384** | 303 |
| card height | 480  | **384** | **768** | 768 | **576** | 384 |
| headshot    | 200  | **160** | **320** | 320 | **240** | 120 |
| cards/row   | 3    | **3**   | **1**   | 1   | 1       | 1   |

A ladder keyed `desktop / 768 / 480` produces **320px cards at 834 where live
renders 512px**, and **3-up at 834 where live is 1-up**, which changes the
section height from 11 616px to ~3 000px. That is the single most likely
failure on this page, and §A.1 shows the region is big enough to hide a smaller
version of it.

### E.2 ⭐ `.display-flex { font-size: .6rem }` at `beachfront.css:7890-7892`

An inherited font-size injected onto _every_ `.display-flex` element at ≤991
only. On this page it hijacks `.team-teasewr-read-more`, whose own
`font-size:16px` (`beachfront.css:7436`) loses on source order. Result:
**16 / 19.2 / 14.4px** — the label is _larger_ at md than at desktop. Nobody
guesses this; it must be ported as a rule, not as a per-element size.
It also changes `.w-dyn-items`' inherited size from 64px to 19.2/14.4px, so any
descendant we add that relies on inherited sizing will drift too.

### E.3 The subtitle section's `-10px` overlap (`beachfront.css:4474-4476`)

`mt-neg-10px` escapes the section box and pulls
`section.our-team-subtitle-section` **10px up into the hero** at all three
tiers (§3.2). This moves the `Our` region boundary. If the rebuild puts that
space anywhere else — hero padding, a wrapper margin, a `gap` — the geometry
matches but the _region cut_ does not.

### E.4 `h5` name is flat 30/40 at all three tiers (`beachfront.css:2144-2152`)

There is no `h5` rule in any media block. Every instinct says "shrink the name
on mobile"; live does not. Same trap already documented for
`.footer-learn-more` in `_chrome.md` §5.1 — it recurred here, so treat a flat
`h5` as the default assumption and require a cited media rule before scaling
any `h5`.

### E.5 `.h7` beats the responsive `h6` rules (`beachfront.css:7734-7740`)

The role label is **16/25 flat**, because `.h7` (0-1-0) outranks
`h6{font-size:12px}` (0-0-1) at ≤991. But `.team-beach-name` — same `h6` tag,
no `.h7` — **does** drop to 12/15. Two `h6` elements inside the same card with
different ladders. Easy to unify wrongly in either direction.

### E.6 `.team-teaser`'s `height: 7.5ch` (`beachfront.css:3770-3773`)

A `ch`-unit fixed clip whose px value (75) depends on the Typekit `museo-sans`
"0" advance at 16px. If the font fails to load or a fallback is used, the clip
height changes and every card below shifts. Build it as `7.5ch` with the same
font stack, **not** as `75px`, and not as `-webkit-line-clamp` — the
`.ellipsis-three-lines` helper exists at `our-team.html:105-110` but is **not**
applied to this element.

### E.7 The card's asymmetric padding `0 10px 0 0`

`.team-list-item{padding-left:0}` (`beachfront.css:6535`) kills only the left
half of `.w-col{padding-left:10px; padding-right:10px}`
(`beachfront.css:733-734`). Every card is 10px narrower on the right than the
left inside. A rebuild that drops `.w-col` entirely (very tempting — it is dead
float chrome) loses the 10px and shifts all card content 5px. At ≤479
`.team-list-item.m-2{padding-top:2.5rem}` (`beachfront.css:9275`) adds a 60px
top pad that exists at **no other tier**.

### E.8 `.team-grid-headshot`'s `margin-top` does not reset at ≤479

`beachfront.css:9284-9287` restates `width`/`height` back to `5rem` but leaves
`margin-top:-5rem` from `:8196`. At 390 the avatar is pulled up by **its full
height (−120px)**, not half. A "clean" ladder that pairs `5rem` with `-2.5rem`
at sm is wrong by 60px.

### E.9 `.read-more-arrow` has no CSS rule at all

Zero hits in `beachfront.css` and zero in both inline `<style>` blocks. It is
intrinsic 10×11 stretched to the flex line height by `align-items:stretch`
(§4.9). Anything that gives it an explicit width/height, or redraws it as a
CSS triangle, will differ at every tier. The file exists — use it.

### E.10 `.our-team-subtitle-section` and `.team-grid-section` are essentially rule-less

`.our-team-subtitle-section` has **no rule at all**; `.team-grid-section` has
only `text-decoration:none` (`beachfront.css:6526-6528`). All vertical rhythm
in sections 3 and 4 comes from child margins. Adding section padding to "tidy"
the spacing will match at 1440 and break the 991/992 and 767/768 rows.

### E.11 Trailing row centring

`.flex-justify-center` (`beachfront.css:2984-2987`) centres the 2-card 4th row
at x **380 / 740** @1440 while full rows sit at **200 / 560 / 920** `[probed]`.
A CSS-grid rebuild left-aligns the orphan row and fails only in the last ~660px
of a 2410px region — well under 0.10 on its own.

### E.12 Anchor `Our` is not substring-unique

3 substring occurrences in `body.innerText` `[probed]` (nav `Meet Our Team`,
the `<h2>`, footer `Our Team`). If the gate resolves anchors by substring the
region boundary lands on the nav panel, not the heading. Confirm exact-text
matching before trusting §A.1's ranges.

---

_Citations in this file: `beachfront.css` line references plus
`our-team.html` line references; everything not so cited is explicitly tagged
`[probed]` or `[probed-only]`._

---

## `[probed-only]` inventory

Values with NO stylesheet line. They were read off the rendered reference
and must be re-derived if anything upstream changes — never copied blindly
into a fix, and never cited as though they were a rule (repo CLAUDE.md
rule 1).

13. `our-team.md:13` — resolution, margin-collapse) are tagged `[probed-only]`.
14. `our-team.md:204` — — `our-team.html:123`. `[probed-only]` as DOM; the markup string is cited.
15. `our-team.md:563` — **75px at every tier** `[probed]` — 1ch = 10px. `[probed-only]` for the `ch`
16. `our-team.md:1018` — `[probed]` or `[probed-only]`.*
