## team — Dr. Robert Quan (CMS team-member detail)

Route `/team-members/dr-robert-quan` · local structural sample
`matching/spec/detail-team.html` (149 lines). **The entire `<body>` markup is
minified onto line 113**, so element citations are `detail-team.html:113` plus
the quoted snippet. The `<head>` `<style>` (lines 1–59), the `<body>` embed
`<style>` (lines 59–113) and the trailing `<script>` (lines 119–149) DO have
real line numbers and are cited as such — every `detail-team.html:<n>` below is
a **raw-file** line, verified with `grep -n`. Webflow page id
`655680f0c897c56b081e91cc`, collection `655680f0c897c56b081e9174`, item slug
`dr-robert-quan`.

**Governing rule (CLAUDE.md #1): source prescribes, rects only verify.** Every
geometry/type value below carries a `beachfront.css:<line>` or
`detail-team.html:<line>` citation. Values that exist only as computed output
(IX2 inline styles, jQuery-injected DOM, margin-collapse results,
percentage-of-percentage resolution, text wrap points) are tagged
`[probed-only]`.

Shared nav / appointment modal / closing CTA / footer are **already specced in
`matching/spec-sections/_chrome.md`** — §1 root-font ladder, §2
`.content-width`, §3 nav, §3.6 form modal, §4 CTA band, §5 footer, §6 buttons,
§7 hovers, §8 type census, §9 probed-only inventory. This file does not restate
them; it references them and specs only what is unique to this page. **One
chrome-spec correction is required — see §E.7.**

Probe: `https://www.beachfrontdentistry.com/team-members/dr-robert-quan` at
**1440 / 1200 / 992 / 991 / 834 / 768 / 767 / 480 / 479 / 390**, viewport height
900, scrolled in 250px steps with 80ms delays, then held until
`document.getAnimations().every(a => a.playState !== "running")` plus 600ms.
The ten-width matrix is deliberate: this page's one hero image element
(`.member-page-headshot`) takes **five** distinct sizes across that range —
see §E.1. Raw output:
`…/scratchpad/probe-team.json` (geometry/type),
`probe-team2.json` (interaction + reveal states),
`probe-team3.mjs` output (anchor uniqueness + asset resolution).

---

### 0. The root-font ladder applies here unchanged

`detail-team.html:3-5` (`html{font-size:40px}`), `:8-10` (`≤992 → 32px`),
`:12-14` (`≤768 → 24px`), `:16-18` (`≤480 → 24px`, no-op) — byte-identical to
`index.html`, and repeated a second time in the `<body>` embed at
`detail-team.html:62`, `:64-66`, `:68-70`, `:72-74`.

Webflow's class gates are one pixel earlier: `beachfront.css:7852` (≤991),
`:8372` (≤767), `:9011` (≤479); the second ≤991 block at `:9611` contains only
`#w-node-…` grid rules and touches nothing on this page.

Measured root font-size `[probed]`: 40px at 1440/1200 · **32px at 992** ·
32px at 991/834 · **24px at 768** · 24px at 767/480/479/390. The 992 and 768
rows are the trap band's two edges and neither is reachable from a two-tier
ladder keyed at 768.

Resolved rem table used throughout this file:

| rem     | 1440 (root 40) | 992 (root 32, desktop CSS) | 834 (root 32) | 768 (root 24, ≤991 CSS) | 390 (root 24) |
| ------- | -------------- | -------------------------- | ------------- | ----------------------- | ------------- |
| `.5rem` | 20             | 16                         | 16            | 12                      | 12            |
| `.6rem` | 24             | 19.2                       | 19.2          | 14.4                    | 14.4          |
| `1rem`  | 40             | 32                         | 32            | 24                      | 24            |
| `2rem`  | 80             | 64                         | 64            | 48                      | 48            |
| `3rem`  | 120            | 96                         | 96            | 72                      | 72            |
| `4rem`  | 160            | 128                        | 128           | 96                      | 96            |
| `6rem`  | 240            | 192                        | 192           | 144                     | 144           |
| `8rem`  | 320            | 256                        | 256           | **192**                 | 192           |

Document height `[probed]`: **2992 / 2811 / 2330** at 1440 / 834 / 390
(and 2966 / 2739 / 2890 / 2578 / 2881 / 2676 / 2410 at 1200 / 992 / 991 / 768 /
767 / 480 / 479 — note 991 is _taller_ than 992 by 151px and 767 taller than
768 by 303px; both jumps are the ladder offset made visible).

---

## A. Section census

`y@W` = document-space y of the element's border box, settled after all
reveals. This page is the shortest in the site: **four DOM sections**
(`.header`, `.hero`, `.bio-section`, `.footer`), of which the gate's four
anchors cut _five_ regions because one gate anchor splits `.bio-section` in
half.

| #   | label                                                | anchor (unique opening text) | y@1440      | h@1440 | y@834   | h@834  | y@390   | h@390   |
| --- | ---------------------------------------------------- | ---------------------------- | ----------- | ------ | ------- | ------ | ------- | ------- |
| 1   | header / nav — **absolute overlay**, chrome §3       | `Home Page`                  | **0**       | 120    | 0       | 96     | 0       | 72      |
| 2   | hero — beach photo, gradients, title, headshot, wave | `Dr. Robert Quan`            | **0**       | 475.19 | 0       | 500.39 | 0       | 273     |
| 3   | bio — role label + 3 richtext paragraphs             | `Dentist`                    | **555.19**  | 355    | 564.39  | 302    | 321     | 348     |
| 4   | bio — back-link row (`.w-layout-hflex.mb-8`)         | `Back to Team`               | **910.19**  | 87     | 866.39  | 70     | 669     | 50.38   |
| 5   | closing CTA band (chrome §4)                         | `Ready for`                  | **1077.19** | 1200   | 1000.39 | 828.61 | 767.38  | 438     |
| 6   | footer info (chrome §5)                              | `Want to learn more?`        | **2277.19** | 714.41 | 1829    | 982.41 | 1205.38 | 1124.59 |

Notes on the census rows:

- **1 and 2 are coincident at y=0.** `.header` is `position: absolute; top: 0;
z-index: 10` (`beachfront.css:5836-5842`) so it overlays the hero photo and
  contributes nothing to flow. The hero starts at 0.
- **3 and 4 are the two halves of one DOM element** —
  `<section class="bio-section">` spans y 555.19→997.19 @1440 (h 442),
  564.39→936.39 @834 (h 372), 321→719.38 @390 (h 398.38). The gate's
  `Back to Team` anchor splits it. Row 3's `h` above is therefore the _derived_
  sub-height (row-4 y minus row-3 y), not a DOM box.
- **5 and 6 are the two halves of one `<section class="footer">**` (chrome §4/§5),
  y@1440 = 1077.19, total h = 1914.41.
- `.bio-section` has **zero rules anywhere in `beachfront.css`** (`grep -n
"bio-section"` returns nothing; `grep -n "bio"` returns only
  `.member-page-long-bio` at `:6471`, `:8179`, `:8759`, which this page does not
  use — see §E.8). Measured: `background: rgba(0,0,0,0)`, `padding: 0`,
  `margin: 0`, `position: static`, `display: block` at all three widths
  `[probed]`. Do not invent padding for it.

#### A.1 Census-to-gate mapping — where defects hide

Gate anchors on this page: `Dentist` · `Back to Team` · `Ready for great` ·
`Want to learn more`.

| gate region                              | y-range @1440     | height  | census sections                                           | dilution risk                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ---------------------------------------- | ----------------- | ------- | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| top → `Dentist`                          | 0 → 555.19        | **555** | **1 + 2** + the 80px collapsed margin (§B.3.2)            | ⚠️ compound. The hero photo is 86% of the region's area and is a flat beach gradient, so a defect in any _small_ element inside it is heavily diluted. The h1 title box at 834 is 194.83×76 = 3.2% of the region — **a wrapped-vs-unwrapped title at 834 (§E.5) cannot reach 0.10 on its own.** The headshot is 12.8% @1440 / 13.9% @834 and _is_ individually detectable. Check the title explicitly; do not trust a pass here. |
| `Dentist` → `Back to Team`               | 555.19 → 930.19   | **375** | **3**                                                     | clean — one section, one region. The headshot's bottom edge lands exactly at 555.19 @1440 (§B.2.5) so it does _not_ intrude into this region at 1440/834; at 390 it stops 33.6px above it.                                                                                                                                                                                                                                       |
| `Back to Team` → `Ready for great`       | 930.19 → 1077.19  | **147** | **4** (button, 67px) + the 80px collapsed margin (§B.4.3) | smallest region on the page — 147px @1440, 118px @834, 86.4px @390. Low dilution, _high_ sensitivity: a wrong button height or a wrong `mb-8` value is >10% of this region immediately. Expect this region to fail first and loudest.                                                                                                                                                                                            |
| `Ready for great` → `Want to learn more` | 1077.19 → 2277.19 | 1200    | **5**                                                     | chrome-owned (§4)                                                                                                                                                                                                                                                                                                                                                                                                                |
| `Want to learn more` → end               | 2277.19 → 2992    | 714.81  | **6**                                                     | chrome-owned (§5)                                                                                                                                                                                                                                                                                                                                                                                                                |

**Anchor-uniqueness warning `[probed]`** — counted as substrings of
`document.body.innerText`:

| anchor               | occurrences | where                                                                                                                                  |
| -------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `Dentist`            | **3** ⚠️    | the `<h4>Dentist</h4>`; the bio paragraph's "…School of **Dentist**ry in San Francisco"; the footer's "©2023 Beachfront **Dentist**ry" |
| `Back to Team`       | 1 ✅        |                                                                                                                                        |
| `Ready for`          | 1 ✅        |                                                                                                                                        |
| `Want to learn more` | 1 ✅        |                                                                                                                                        |
| `Dr. Robert Quan`    | 1 ✅        | the `<h1>` (the bio copy spells it "Dr Robert Quan", no period)                                                                        |
| `Quan`               | 5           | h1, 3× in bio copy, `<title>` (not in innerText)                                                                                       |

`Dentist` is only safe if the gate resolves anchors by **exact element text**.
If it matches by substring, the `Dentist` boundary can resolve to the footer
copyright row and the region map above collapses. Verify before trusting.
`Dr. Robert Quan` is a safe alternate anchor for census section 2.

---

## B. Per-section spec

### B.1 Section 1 — header / nav

Entirely chrome. See `_chrome.md` §3 (markup, §3.2 geometry, §3.3 off-canvas
panel, §3.4 open/close IX2, §3.5 `.modal-link` type). Byte-identical here per
chrome §0. Measured on this page for confirmation `[probed]`:
`position: absolute`, `z-index: 10`, `h = 120 / 96 / 72` at 1440/834/390
(`.header { height: 3rem }` `beachfront.css:5836-5842` on the root ladder →
breaks at **992 / 768**, not 991/767).

Active nav link: **none** — no `w--current` / `aria-current` on any
`.modal-link` (this route is not in the nav). Verify the rebuild does not mark
"Meet Our Team" active.

---

### B.2 Section 2 — hero

Markup (`detail-team.html`, `<section class="hero">`):

```
<section class="hero">
  <img class="hero-dynamic-image" loading="lazy" width="100" sizes="100vw" srcset="…">
  <div class="hero-top-gradient"></div>
  <div class="hero-bot-gradient"></div>
  <div class="content-width">
    <div class="hero-cols">
      <div class="col-2-of-3">
        <h1 class="subpage-hero-heading half-width">Dr. Robert Quan</h1>
      </div>
      <div class="col-1-of-3">
        <img class="member-page-headshot" loading="lazy" sizes="(max-width:479px) 100vw, (max-width:767px) 144px, 26vw" srcset="…">
      </div>
    </div>
  </div>
  <div class="bot-wave"></div>          ← SVG injected by jQuery, detail-team.html:123
</section>
```

**No `data-w-id` anywhere in the hero** — the hero has no reveal animation
(§D). Everything is at its final position on first paint.

#### B.2.1 `.hero` — the height ladder (vw, three tiers, Webflow gates)

`beachfront.css:5295-5300`:

```
.hero { align-items:center; height:33vw; display:block; position:relative }
```

- ≤991 `beachfront.css:7980-7982` → `.hero, .hero.redondo { height: 60vw }`
- ≤767 `beachfront.css:8438-8440` → `.hero { height: 70vw }`
- ≤479 — **no bare `.hero` rule.** `beachfront.css:9068-9095` overrides only
  `.hero.redondo` / `.hero.contact` / `.hero.group-photo` / `.hero.home` /
  `.hero.ask-a-dentist` (all to 95vw / 70vh). This hero carries **no modifier
  class**, so it inherits 70vw all the way down. See §E.12.

Resolved (measured `[probed]`, matches to 0.01px):

| viewport | rule                             | height     |
| -------- | -------------------------------- | ---------- |
| 1440     | 33vw                             | **475.19** |
| 1200     | 33vw                             | 396        |
| **992**  | 33vw ← desktop rule still active | **327.36** |
| **991**  | 60vw ← Webflow tier fires        | **594.59** |
| 834      | 60vw                             | **500.39** |
| **768**  | 60vw ← still the ≤991 rule       | **460.8**  |
| **767**  | 70vw                             | **536.89** |
| 480      | 70vw                             | 336        |
| 479      | 70vw                             | 335.3      |
| 390      | 70vw                             | **273**    |

Note the hero gets _taller_ going 992 → 991 (327 → 595). Not a rem ladder, so
these break on 991/767 and the root ladder is irrelevant here — but §B.2.6 and
§B.2.7 in the same section _are_ rem, so this section carries **both** gate
systems at once.

`position: relative` with `z-index: auto` → no stacking context, so the
headshot's `z-index: 9` escapes the hero box (§B.2.5).

#### B.2.2 `.hero-dynamic-image` — the beach photo

`beachfront.css:6428-6433`: `object-fit: cover; width:100%; height:100%;
position: absolute`. No responsive overrides. Plus `img` base
`beachfront.css:232-236` → `max-width: 100%; vertical-align: middle;
display: inline-block`. Measured rect = the hero box exactly at every width.

**Asset (do not redraw):**
`https://cdn.prod.website-files.com/64b1c843b071dc32170ea053/64bb0f96fd2a4cab9f42ccaa_beach-img_elizeu-dias-RN6ts8IZ4_0-unsplash.jpg`
(5472w original). `srcset` variants, same stem, suffixes
`-p-500.jpg 500w`, `-p-800.jpg 800w`, `-p-1080.jpg 1080w`, `-p-1600.jpg 1600w`,
`-p-2000.jpg 2000w`, `-p-2600.jpg 2600w`, `-p-3200.jpg 3200w`, plus the
un-suffixed original at `5472w`. Attributes: `sizes="100vw"`, `width="100"`,
`loading="lazy"`, `alt=""`. Selected at 1440 `[probed]`: the `-p-1600` variant
(natural 1440×960).

**CDN note:** this asset and the headshot live under site bucket
`64b1c843b071dc32170ea053` (the CMS collection bucket), _not_ the
`64af3f93339537d6b661b556` bucket that every chrome asset uses. Both buckets
are live; do not normalize them to one.

#### B.2.3 Hero gradients

| element              | source                     | declarations                                                                                                         | measured h @1440/834/390 |
| -------------------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| `.hero-top-gradient` | `beachfront.css:6477-6482` | `background-image: linear-gradient(#129ecccc, #0000); width:100%; height:25%; position:absolute` (top defaults to 0) | 118.8 / 125.09 / 68.25   |
| `.hero-bot-gradient` | `beachfront.css:6484-6490` | `background-image: linear-gradient(#0000, #129ecccc); width:100%; height:50%; position:absolute; bottom:0`           | 237.59 / 250.19 / 136.5  |

No responsive overrides on either (the `.dark` / `.home` / `.home-blue`
modifiers at `:6492`, `:6496`, `:6500` are not used here). Computed colour
`[probed]`: `rgba(18,158,204,0.8)` — `#129ecccc` is `--primary` at α=0.8.
Both percentages resolve against the hero height, so they track the 33/60/70vw
ladder automatically.

#### B.2.4 `.content-width` / `.hero-cols` / columns

`.content-width` — chrome §2, unchanged. Measured here `[probed]`:
1440 `{x:20, w:1400}` pad-x 60 · 834 `{x:0, w:834}` pad-x 48 ·
390 `{x:0, w:390}` pad-x 19.5. `height: 100%` (`beachfront.css:5860`) makes it
the full hero height, and its `position: relative` (`beachfront.css:5866`)
makes it the containing block for `.member-page-headshot` (§B.2.5).

`.hero-cols` `beachfront.css:6435-6438` → `height: 100%; display: flex`.
**No responsive override anywhere** — the two-column split holds at every width
including 390.

`.col-2-of-3` `beachfront.css:6440-6443` → `width: 66%; position: relative`
(this `position: relative` is what makes it the containing block for the `<h1>`,
§B.2.6 — note it is a _different_ containing block from the headshot's).
`.col-1-of-3` `beachfront.css:6445-6447` → `width: 33%`. Neither has a
responsive override. **66 + 33 = 99%, not 100** — there is a 1% dead gutter at
the right edge of `.hero-cols` at every width (measured @1440: cols end at
1347.19, `.hero-cols` right edge 1360 → 12.81px unused).

Measured column boxes `[probed]`:

|               | 1440                   | 834                    | 390                    |
| ------------- | ---------------------- | ---------------------- | ---------------------- |
| `.hero-cols`  | x 80, w 1280           | x 48, w 738            | x 19.5, w 351          |
| `.col-2-of-3` | x 80, w **844.80**     | x 48, w **487.08**     | x 19.5, w **231.66**   |
| `.col-1-of-3` | x **924.80**, w 422.39 | x **535.08**, w 243.53 | x **251.16**, w 115.83 |

#### B.2.5 `.member-page-headshot` — the five-step ladder

`beachfront.css:6459-6469`:

```
.member-page-headshot { z-index:9; object-fit:cover; object-position:50% 0%;
  border-radius:4rem; width:8rem; height:8rem;
  position:absolute; bottom:-2rem; right:auto }
```

- ≤991 `beachfront.css:8174-8177` → `object-position: 50% 0%; right: auto`
  (**no size change** — the size still comes from the base `8rem`, which the
  root ladder has already re-resolved)
- ≤767 `beachfront.css:8752-8757` → `width: 6rem; height: 6rem;
position: absolute; bottom: -.6rem`
- ≤479 `beachfront.css:9262-9265` → `width: 4rem; height: 4rem`

The `rem` base and the Webflow overrides step on _different_ gates, so the
element takes **five** distinct sizes. Measured `[probed]`, exact:

| viewport | root   | active rule | declared | **rendered w/h** | border-radius | `bottom` |
| -------- | ------ | ----------- | -------- | ---------------- | ------------- | -------- |
| 1440     | 40     | base        | `8rem`   | **320**          | 160           | −80      |
| 1200     | 40     | base        | `8rem`   | 320              | 160           | −80      |
| **992**  | **32** | base        | `8rem`   | **256**          | 128           | −64      |
| 991      | 32     | base + ≤991 | `8rem`   | 256              | 128           | −64      |
| 834      | 32     | base + ≤991 | `8rem`   | **256**          | 128           | −64      |
| **768**  | **24** | base + ≤991 | `8rem`   | **192** ⚠️       | 96            | −48      |
| **767**  | 24     | ≤767        | `6rem`   | **144**          | 96            | −14.4    |
| 480      | 24     | ≤767        | `6rem`   | 144              | 96            | −14.4    |
| **479**  | 24     | ≤479        | `4rem`   | **96**           | 96            | −14.4    |
| 390      | 24     | ≤479        | `4rem`   | **96**           | 96            | −14.4    |

`border-radius: 4rem` is never overridden, so it also takes 160/128/96. At
every tier the radius is ≥ half the box (or is clamped there by the CSS
overlap rule at 767–480: 96+96=192 > 144 → scaled to 72 each), so the image is
**always a full circle**. A hard-coded `border-radius: 9999px` is
pixel-equivalent; a hard-coded `160px` is not.

**Positioning.** `left` is never declared → `auto` → resolves to the static
position, i.e. the left edge of `.col-1-of-3`. `right: auto` is declared
(`:6467`, restated `:8176`). The containing block is the **hero's
`.content-width` padding box** (the nearest positioned ancestor —
`.col-1-of-3` and `.hero-cols` are both `static`). Verified @1440 `[probed]`:
computed `left: 904.797px` + content-width x 20 = rect x **924.80** = the
`.col-1-of-3` x, and `right: 175.203` = 1400 − 904.797 − 320. ✓

**The invariant worth building to:** `bottom: -2rem` and the `.mt-8` on the
next section's heading are _both_ `2rem`, so at 1440/992/991/834/768 the
headshot's bottom edge lands **exactly** on the bio section's top edge.
Measured @1440: headshot y 235.19 + h 320 = 555.19 = `.bio-section` y. @834:
308.39 + 256 = 564.39 = bio y. At ≤767 the `bottom` becomes `-.6rem` while
`.mt-8` stays `2rem`, so the invariant breaks by design: @390 headshot bottom
= 287.39, bio top = 321, a 33.6px gap.

`z-index: 9` beats `.bot-wave`'s `z-index: 8` (`beachfront.css:6009`), so the
circle draws **over** the wave; and because `.hero` creates no stacking
context (`position: relative`, `z-index: auto`) and has no `overflow: hidden`,
the circle also draws **over the white bio section below**.

**Asset (do not redraw):**
`https://cdn.prod.website-files.com/64b1c843b071dc32170ea053/64bb0fbee7ccd4a6c98eb3bc_BD_Dr-Quan-Headshot_crop.jpg`
(2899w original). `srcset` suffixes `-p-500 500w`, `-p-800 800w`,
`-p-1080 1080w`, `-p-1600 1600w`, `-p-2000 2000w`, `-p-2600 2600w`, plus the
original at `2899w`. `sizes="(max-width: 479px) 100vw, (max-width: 767px) 144px, 26vw"`
— note the `144px` literal is `6rem` at root 24, i.e. the `sizes` attribute
encodes the ≤767 tier of the ladder above. Selected at 1440 `[probed]`: the
`-p-500` variant (natural 374×476), because `26vw` of 1440 = 374px.
`loading="lazy"`, `alt=""`. Combined with `object-fit: cover` +
`object-position: 50% 0%` this crops the 374×476 portrait to a square anchored
at the **top**, not the centre — getting `object-position` wrong crops the
chin off.

#### B.2.6 `h1.subpage-hero-heading.half-width` — "Dr. Robert Quan"

`beachfront.css:6126-6136`:

```
.subpage-hero-heading { color:#fff; text-align:center; width:100%;
  margin-top:8%; margin-bottom:5%; font-weight:100;
  position:absolute; bottom:2%; left:0 }
```

`beachfront.css:6138-6140` → `.subpage-hero-heading.half-width { text-align:left }`

Responsive:

- ≤991 `beachfront.css:8076-8080` → `.subpage-hero-heading { text-align:left; width:80%; left:10% }`
- ≤991 `beachfront.css:8082-8085` → `.half-width { width:40%; left:0% }`
- ≤767 `beachfront.css:8653-8657` → `.half-width { width:80%; margin-bottom:10%; left:0% }`
- ≤479 `beachfront.css:9200-9202` → `.subpage-hero-heading { left:10% }`
- ≤479 `beachfront.css:9204-9208` → `.half-width { width:100%; font-size:25px; left:0% }`

Type ladder — the element is an `<h1>`, so it also inherits the base heading
ladder `beachfront.css:2104-2112` (`museo-slab, 60px/72px, weight 300,
color var(--primary)`) and `beachfront.css:7853-7856` (≤991 → `28px/38px`),
`beachfront.css:8373-8376` (≤767 → `28px/38px`, same values). `color:#fff` and
`font-weight:100` come from `:6126`. Resolved `[probed]`:

| viewport | font-size / line-height | weight | width rule | **rendered width** | **rendered height** | lines |
| -------- | ----------------------- | ------ | ---------- | ------------------ | ------------------- | ----- |
| 1440     | **60 / 72**             | 100    | `100%`     | 844.80             | **72**              | 1     |
| 992      | 60 / 72                 | 100    | `100%`     | 591.36             | 72                  | 1     |
| 991      | **28 / 38**             | 100    | `40%`      | 236.27             | **38**              | 1     |
| **834**  | 28 / 38                 | 100    | `40%`      | **194.83**         | **76** ⚠️           | **2** |
| **768**  | 28 / 38                 | 100    | `40%`      | **183.73**         | **76** ⚠️           | **2** |
| 767      | 28 / 38                 | 100    | `80%`      | 340.17             | **38**              | 1     |
| 479      | **25 / 38**             | 100    | `100%`     | 284.53             | 38                  | 1     |
| 390      | **25 / 38**             | 100    | `100%`     | 231.66             | **38**              | 1     |

Family/colour/letter-spacing/transform, identical at all widths `[probed]`:
`museo-slab, sans-serif` / `rgb(255,255,255)` / `normal` / `none`;
`text-align: left` (from `.half-width` `:6138` and `:8076`).

**"Dr. Robert Quan" wraps to two lines only in the 768–991 band** — that is the
only band where the box is 40% wide _and_ the type is 28px. Any md
implementation keyed at 768 gives 80% width there → one line → the whole title
block renders 38px tall instead of 76px and sits 38px lower. §E.5.

**Vertical positioning is bottom-anchored and `margin-top` is inert.** With
`top: auto` and `bottom: 2%`, the used `top` is _solved_ from the
over-constrained equation, so `margin-top: 8%` contributes nothing to the
rendered position — only `bottom` and `margin-bottom` do. Percentages resolve
against `.col-2-of-3` (`position: relative`, `:6440`): `bottom` against its
**height** (= hero height), the margins against its **width**. Verified
`[probed]`:

|      | container w × h | `margin-bottom` decl | resolved mb | resolved `bottom` | h1 bottom edge | hero bottom | gap       |
| ---- | --------------- | -------------------- | ----------- | ----------------- | -------------- | ----------- | --------- |
| 1440 | 844.80 × 475.19 | 5%                   | 42.234      | 9.50              | 423.45         | 475.19      | **51.74** |
| 834  | 487.08 × 500.39 | 5%                   | 24.344      | 10.008            | 466.05         | 500.39      | **34.35** |
| 390  | 231.66 × 273    | **10%** (`:8654`)    | 23.156      | 5.46              | 244.39         | 273         | **28.62** |

Computed `margin-top` for the record `[probed]`: 67.578 / 38.953 / 18.531
(8% of the container width) — present in computed style, zero effect on layout.

#### B.2.7 `.bot-wave` — the divider, and **the rotation is on the PARENT**

Base `beachfront.css:6008-6016`:

```
.bot-wave { z-index:8; width:100%; line-height:0;
  position:absolute; bottom:0; left:0; overflow:hidden }
```

The three properties that actually shape it are **not in `beachfront.css`** —
they are in this page's own `<head>` `<style>` (`detail-team.html:20-34`):

```
.bot-wave      { transform: rotate(180deg) }                    detail-team.html:20-22
.bot-wave svg  { position:relative; display:block;
                 width: calc(133% + 1.3px); height: 3rem }       detail-team.html:24-29
.bot-wave .shape-fill { fill: #FFFFFF }                          detail-team.html:32-34
```

- **`rotate(180deg)` is on `.bot-wave`, the wrapper — never on the `<svg>`.**
  Same pattern as the footer wave (chrome §4.6). Measured transform on
  `.bot-wave` `[probed]`: `matrix(-1, 0, 0, -1, 0, 0)` at all widths; the
  `<svg>`'s own transform is `none`. The consequence is visible in the rects:
  the svg is 1916.5px wide inside a 1440px wrapper, and its **post-transform
  rect starts at x = −476.5** (right-aligned) rather than x = 0. A build that
  rotates the SVG instead of the wrapper gets the overflow on the wrong side.
- Do **not** reach for `.bot-wave.flip` (`beachfront.css:6018-6022`,
  `transform: rotateX(0) rotateY(180deg) rotateZ(0); bottom: -3rem;
transform-style: preserve-3d`). That is a different variant and is **not**
  applied on this page.
- `height: 3rem` is a **pure root-font ladder** — it breaks at **992 / 768**,
  not 991/767. Measured `[probed]`: **120 / 96 / 96 / 96 / 72 / 72 / 72 / 72**
  at 1440 / 1200 / 992 / 991 / 834 / 768 / 767 / 390. Note 992 and 991 agree
  and 768 and 767 agree here — the wave is the one element on this page whose
  ladder has only _three_ steps, and they land on the root gates.
- `width: calc(133% + 1.3px)` measured `[probed]`: 1916.5 / 1110.52 / 520 at
  1440 / 834 / 390.
- `.bot-wave` rect itself: full viewport width, y = hero bottom − wave height
  (355.19 / 404.39 / 201 @1440/834/390), `overflow: hidden`.

**The SVG is JS-injected, not in the static markup** (`detail-team.html:123`):

```js
$(".bot-wave").append(
  ' <svg data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none"> <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" class="shape-fill"></path></svg> ',
);
```

Note the leading space in the appended string (a text node before the `<svg>`)
— harmless because `.bot-wave` has `line-height: 0`. `viewBox="0 0 1200 120"`,
`preserveAspectRatio="none"` (so the path stretches non-uniformly), fill
`#FFFFFF` to match the white `<body>` background (`beachfront.css:222-229`,
measured `rgb(255,255,255)`).

**Same path `d` as the footer wave** (`detail-team.html:115`) — one asset, two
fills (`#FFFFFF` here vs `#e7f5fa` in the footer, `detail-team.html:56-58`)
and two heights (`3rem` here vs `4rem` there, `detail-team.html:49-54`).

---

### B.3 Section 3 — bio: role label + richtext

Markup:

```
<section class="bio-section">
  <div data-w-id="624f79d8-7de5-a88e-7c85-42dd9ed460ea"
       style="transform:translate3d(0, 4rem, 0) …; opacity:0" class="content-width">
    <h4 class="text-color-primary-dark mt-8 mb-4">Dentist</h4>
    <div class="w-richtext"><p>…</p><p>…</p><p>…</p></div>
    <div class="w-layout-hflex flex-align-center mb-8">…</div>   ← census section 4
  </div>
</section>
```

The `style=` on `.content-width` is the IX2 **initial state**, serialized into
the HTML by Webflow (§D). It is `[probed-only]` as a _rendered_ value —
post-settle it becomes `translate3d(0px, 0rem, 0px) …; opacity: 1;
transform-style: preserve-3d`.

#### B.3.1 `h4` "Dentist" — and the `.mt-8` / `.mb-4` specificity trap

Classes: `text-color-primary-dark mt-8 mb-4`. Four rules collide:

| source                                 | declarations                                                                                                                                          |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `beachfront.css:2134-2142` (`h4` base) | `color: var(--primary); margin-top:10px; margin-bottom:10px; font-family: museo-slab, sans-serif; font-size:30px; font-weight:700; line-height:1.5em` |
| `beachfront.css:7868-7870` (≤991)      | `h4 { font-size: 16px }`                                                                                                                              |
| `beachfront.css:5897-5899`             | `.text-color-primary-dark { color: var(--primary-dark) }` → `#365b6d`                                                                                 |
| `beachfront.css:3925-3927`             | `.mt-8 { margin-top: 2rem }`                                                                                                                          |
| `beachfront.css:3985-3988`             | `.mb-4 { margin-top: 0; margin-bottom: 1rem }` ⚠️ **also sets margin-top**                                                                            |
| `beachfront.css:5928-5930`             | `.text-color-primary-dark.mt-8.mb-4 { margin-top: 2rem }` ← **restores it**                                                                           |

`.mb-4` (line 3985) declares `margin-top: 0` and comes **after** `.mt-8`
(line 3925) at equal (1-class) specificity, so the naive cascade zeroes the top
margin. Live renders `2rem` only because of the 3-class compound at
`beachfront.css:5928-5930`. See §E.4 — this is the highest-risk
non-obvious rule on the page.

Type, resolved `[probed]`:

|                                    | 1440                                    | 992     | 834         | 768     | 390         |
| ---------------------------------- | --------------------------------------- | ------- | ----------- | ------- | ----------- |
| font-size / line-height            | **30 / 45**                             | 30 / 45 | **16 / 24** | 16 / 24 | **16 / 24** |
| family / weight / colour           | museo-slab / **700** / `rgb(54,91,109)` | same    | same        | same    | same        |
| letter-spacing / transform / align | normal / none / start                   |         |             |         |             |

(Note the type here is px, so it steps on 991 — _not_ on the root ladder. The
margins on the very same element step on 992/768. Two gates, one element.)

Box, measured `[probed]`:

|                           | 1440   | 834    | 390    |
| ------------------------- | ------ | ------ | ------ |
| `margin-top` (`2rem`)     | **80** | **64** | **48** |
| `margin-bottom` (`1rem`)  | **40** | **32** | **24** |
| padding / border / radius | 0      | 0      | 0      |
| width (= content column)  | 1280   | 738    | 351    |
| height                    | 45     | 24     | 24     |

#### B.3.2 The `margin-top: 2rem` **collapses out of the section** — where the space lives

`.content-width` has no padding-top, no border-top, no BFC trigger
(`beachfront.css:5858-5867`; `overflow: visible`), and `.bio-section` has no
rules at all. So the h4's `margin-top: 2rem` collapses up through
`.content-width` and through `<section class="bio-section">` and becomes the
section's own outer margin. **The gap belongs to neither section's border
box.** Verified `[probed]`:

|         | hero bottom | bio-section y | gap    | =                   |
| ------- | ----------- | ------------- | ------ | ------------------- |
| 1440    | 475.19      | **555.19**    | 80     | `2rem` @ root 40    |
| 992     | 327.36      | 391.36        | 64     | `2rem` @ root 32    |
| 834     | 500.39      | **564.39**    | 64     | `2rem` @ root 32    |
| **768** | 460.80      | 508.80        | **48** | `2rem` @ root 24 ⚠️ |
| 390     | 273         | **321**       | 48     | `2rem` @ root 24    |

The IX2 `transform` on `.content-width` does **not** stop this collapse
(transforms do not create a BFC) — confirmed: the rects above are the settled,
transformed-to-identity values and the collapse still holds.

Build consequence: if the rebuild expresses this as `padding-top` on the bio
section (or as a `margin-bottom` on the hero), the 80/64/48px moves _into_ one
of the two gate regions and every anchor cut below it shifts. §E.3.

#### B.3.3 `.w-richtext` and the three `<p>`s

`.w-richtext` itself has **no size rules** — it inherits `<body>`'s
`museo-sans / 300 / 64px / 1.2em` (`beachfront.css:2096-2102`, measured
`64px/76.8px` at every width, which is why the block _looks_ unstyled in
DevTools). Its width is the full content column: **1280 / 738 / 351**.

The paragraphs get their type from the `p` element ladder:

| source                                       | declarations                                                                                               |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `beachfront.css:2166-2172`                   | `p { color: var(--primary-dark); margin-bottom:10px; font-size:20px; font-weight:300; line-height:1.5em }` |
| `beachfront.css:424-427` (Webflow normalize) | `p { margin-top: 0; margin-bottom: 10px }`                                                                 |
| `beachfront.css:7877-7879` (≤991)            | `p { font-size: 16px }`                                                                                    |
| `beachfront.css:8378-8380` (≤767)            | `p { font-size: 16px }` (same)                                                                             |
| `beachfront.css:9018-9020` (≤479)            | `p { font-size: 12px }`                                                                                    |

Resolved `[probed]`: **20/30 @1440 and @992 · 16/24 @991–480 · 12/18 @479 and
@390.** Family `museo-sans, sans-serif`, weight 300, colour `rgb(54,91,109)`,
letter-spacing `normal`, transform `none`, align `start`. The inter-paragraph
gap is a hard **10px at every width** (px, not rem — it does not scale).

Measured paragraph boxes `[probed]`:

|                     | 1440                      | 834                       | 390                     |
| ------------------- | ------------------------- | ------------------------- | ----------------------- |
| p1 (lines × lh)     | y 640.19, h **90** (3×30) | y 620.39, h **72** (3×24) | y 369, h **90** (5×18)  |
| p2                  | y 740.19, h **90**        | y 702.39, h **96** (4×24) | y 469, h **126** (7×18) |
| p3                  | y 840.19, h **60** (2×30) | y 808.39, h **48**        | y 605, h **54** (3×18)  |
| `.w-richtext` total | y 640.19, h **270**       | y 620.39, h **246**       | y 369, h **300**        |

**The richtext box is 10px taller than the sum of its paragraphs** (270 vs
90+10+90+10+60 = 260). That is `beachfront.css:1672-1681`:

```
.w-richtext:before, .w-richtext:after { content:" "; grid-area:1/1/2/2; display:table }
.w-richtext:after { clear: both }
```

The `display: table` `::after` pseudo blocks the last `<p>`'s `margin-bottom`
from collapsing out. A rebuild that drops the Webflow clearfix loses exactly
10px before the back-link row, at every width. §E.9.

The h4→richtext gap is the h4's `margin-bottom: 1rem` alone (`p`'s `margin-top`
is 0): **40 / 32 / 24** measured @1440/834/390 — root ladder, breaks at 992/768.

**Copy (3 paragraphs, verbatim):**

1. "Dr Robert Quan was born and raised in the Central Valley in Fresno, CA. He attended the University of the Pacific in Stockton, CA earning his degree in Biology. He earned his Doctor of Dental Surgery degree at the University of the Pacific, Arthur A. Dugoni School of Dentistry in San Francisco, CA."
2. "Following graduation from Dental school, Dr Quan completed his residency at the Community Regional Medical Center and Veterans Affairs Hospital in Fresno where he continued to refine his dental abilities. After working in private practices in Fresno and Rochester, MN, Dr Quan is happy to call Southern California his new home while his wife completes her residency at UCLA in OB/GYN."
3. "Dr. Quan loves that dentistry is a blend of function, technical skill, and artistic acuity. In his free time, he enjoys spending time with his wife, working out and playing volleyball."

Note the inconsistent "Dr Robert Quan" (no period) in the body vs
"Dr. Robert Quan" in the `<h1>` — reproduce both exactly; the h1 spelling is
the safe gate anchor and the body spelling is not.

---

### B.4 Section 4 — bio: the back-link row

```
<div class="w-layout-hflex flex-align-center mb-8">
  <a href="/our-team" class="button text-color-primary mt-2 w-button">Back to Team</a>
</div>
```

#### B.4.1 The wrapper

| source                            | declarations                                                                             |
| --------------------------------- | ---------------------------------------------------------------------------------------- |
| `beachfront.css:2056-2060`        | `.w-layout-hflex { flex-direction: row; align-items: flex-start; display: flex }`        |
| `beachfront.css:2953-2956`        | `.flex-align-center { align-items: center; display: flex }` ← overrides the `flex-start` |
| `beachfront.css:3998-4000`        | `.mb-8 { margin-bottom: 2rem }`                                                          |
| `beachfront.css:7972-7974` (≤991) | `.mb-8 { font-size: 1rem }` ⚠️ a **font-size** rule on a margin utility                  |

The ≤991 `font-size: 1rem` on `.mb-8` is measured `[probed]` on the wrapper:
`64px` @1440/992 → `32px` @991/834 → `24px` @768/767/390. It has no visible
effect (the wrapper's only child is a `.button` with its own font-size and the
wrapper contains no text nodes) but it _is_ inherited, so any rebuild that puts
text in this row will inherit the wrong size if it skips the rule.

Measured wrapper box `[probed]`: `display: flex`, `flex-direction: row`,
`align-items: center`, `margin-bottom` **80 / 64 / 48**, all padding 0,
width = content column (1280 / 738 / 351), height **87 / 70 / 50.375**
(= the button's `margin-top` + the button's height; the single flex item's
margin box sets the line height even under `align-items: center`).

#### B.4.2 The button

Classes `button text-color-primary mt-2 w-button`. Chrome §6 owns the pattern;
the variant ladder on this page:

| source                            | declarations                                                                                                                                                                                                                                                                  |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `beachfront.css:265-275`          | `.w-button` — only `display: inline-block` survives                                                                                                                                                                                                                           |
| `beachfront.css:6028-6040`        | `.button { cursor:pointer; background:#0000; border:1px solid #fff; border-radius:8px; height:auto; padding:1.3em 1em; font-family:museo-slab; font-size:25px; font-weight:300; line-height:0; transition: opacity .2s, background-color .2s cubic-bezier(.215,.61,.355,1) }` |
| `beachfront.css:6065-6067`        | `.button.text-color-primary { border-color: var(--primary) }`                                                                                                                                                                                                                 |
| `beachfront.css:5936-5938`        | `.text-color-primary { color: var(--primary) }` → `#129ecc`                                                                                                                                                                                                                   |
| `beachfront.css:3901-3903`        | `.mt-2 { margin-top: .5rem }`                                                                                                                                                                                                                                                 |
| `beachfront.css:8045-8047` (≤991) | `.button { font-size: 20px }`                                                                                                                                                                                                                                                 |
| `beachfront.css:8632-8634` (≤767) | `.button { font-size: 15px }`                                                                                                                                                                                                                                                 |
| `beachfront.css:9185-9187` (≤479) | `.button.text-color-primary { font-size: 14px }`                                                                                                                                                                                                                              |

`.button.text-color-primary-dark.mt-2` at `beachfront.css:8640-8643`
(`margin-bottom:0; display:inline-block`) does **not** apply here — this button
is `.text-color-primary`, not `-dark`. Neither does
`.button.text-color-primary.mt-2.show-form` (`beachfront.css:6069-6071`,
`margin-bottom: 20px`) — no `.show-form` class.

Resolved, measured `[probed]` (`line-height: 0` means the height is
`2 × padding + 2 × 1px border`; do not derive it from font-size — chrome §6.2):

| viewport  | font-size | pad-y (`1.3em`) | pad-x (`1em`) | **height** | width ("Back to Team") | `margin-top` (`.5rem`) |
| --------- | --------- | --------------- | ------------- | ---------- | ---------------------- | ---------------------- |
| 1440      | 25        | 32.5            | 25            | **67**     | 214.36                 | **20**                 |
| 992       | 25        | 32.5            | 25            | 67         | 214.36                 | **16** ⚠️              |
| 991       | 20        | 26              | 20            | **54**     | 171.89                 | 16                     |
| 834       | 20        | 26              | 20            | **54**     | 171.89                 | **16**                 |
| **768**   | 20        | 26              | 20            | **54**     | 171.89                 | **12** ⚠️              |
| 767       | 15        | 19.5            | 15            | **41**     | 129.42                 | 12                     |
| 479 / 390 | 14        | 18.2            | 14            | **38.375** | 120.92                 | **12**                 |

Constant at every width `[probed]`: `border: 1px solid rgb(18,158,204)`,
`border-radius: 8px`, `background-color: rgba(0,0,0,0)`,
`font-family: museo-slab, sans-serif`, `font-weight: 300`, `line-height: 0px`,
`color: rgb(18,158,204)`, `text-transform: none`, `cursor: pointer`.

Look at 992 and 768: **font-size and margin-top step on different gates**, so
the button has 25px type with a 16px margin at 992 and 20px type with a 12px
margin at 768. Neither combination is reachable from a two-tier ladder.

#### B.4.3 The trailing `margin-bottom: 2rem` also collapses out

Same mechanism as §B.3.2, at the bottom. Measured `[probed]`:

|      | bio-section bottom | footer y    | gap                  |
| ---- | ------------------ | ----------- | -------------------- |
| 1440 | 997.19             | **1077.19** | **80** (`2rem` @ 40) |
| 834  | 936.39             | **1000.39** | **64** (`2rem` @ 32) |
| 390  | 719.38             | **767.38**  | **48** (`2rem` @ 24) |

The CTA `<h2>`'s own `.my-4` top margin (`1rem` = 40/32/24, chrome §4) collapses
_into_ this same gap and loses — `max(80, 40) = 80`. Confirmed: the CTA `<h2>`'s
rect y equals `section.footer`'s rect y exactly at all three widths.

---

### B.5 / B.6 Sections 5 and 6 — closing CTA + footer

Chrome §4 and §5, verbatim. Confirmations measured on this page `[probed]`:

- `section.footer` y/h: 1077.19 / 1914.41 @1440 · 1000.39 / 1811.02 @834 ·
  767.38 / 1562.59 @390.
- `.cta-section` (`detail-team.html`, `<div class="cta-section"></div>`) has no
  rule in `beachfront.css` and measures h = 0 — chrome §4 already says so.
- CTA `<h2>` heights: 504 @1440 (3 lines × 168) · 240 @834 (3 × 80) · 180 @390
  (3 × 60), matching chrome §8 style #5.
- `.fiji-section` y/h: 1621.19 / 800 · 1272.39 / 640 · 971.38 / 273.
- `.footer-info-section` y/h: 2277.19 / 714.41 · 1829 / 982.41 · 1205.38 / 1124.59.
- Footer wave: the `4rem` variant at `detail-team.html:39-58`
  (`.custom-shape-divider-bottom-1689290473`, `margin-top: -4rem`,
  `width: calc(169% + 1.3px)`, `height: 4rem`, `fill: #e7f5fa`,
  `transform: rotate(180deg)` on the wrapper) — chrome §4.6.

**The one deviation from chrome on this page:** `.form-modal` is **absent from
the live DOM** at every width. See §E.7.

---

## C. Interaction inventory

Enumerated by _distinct interactive control_. Nested pointer-cursor children
(the `<h3 class="modal-link">` inside each nav `<a>`, the `<img>` inside each
link, the `.expanding-plus`/`.expanding-minus` inside the reviews toggle) are
folded into their parent control and are not counted separately.

| #   | control                   | selector / source                                                                                                                                                   | behaviour                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | owner                        |
| --- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| 1   | header logo link          | `a.link-block-5 > img.header-logo` → `/`                                                                                                                            | hover `opacity 1 → .5` (`beachfront.css:6096`), transition `.35s cubic-bezier(.215,.61,.355,1)` (`:6093`)                                                                                                                                                                                                                                                                                                                                                                                                                                                            | chrome §3                    |
| 2   | header hamburger          | `a.link-block-4 > img.header-hamburger`, `data-w-id="d74a87ea-…73c0"`                                                                                               | IX2 **e-9 → a-4 "show-nav-modal"**; hover `opacity → .4` (`beachfront.css:6114`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | chrome §3.4                  |
| 3   | panel close hamburger     | `.dropdown-modal .position-absolute-top-right img.header-hamburger`, `data-w-id="8dfa6638-…90e4"`                                                                   | IX2 **e-7 → a-3 "hide-nav-modal"**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | chrome §3.4                  |
| 4   | panel logo                | `.dropdown-modal .position-absolute-top-left img.header-logo`                                                                                                       | ⚠️ **inert** — `cursor: pointer` + `:hover{opacity:.5}` from `.header-logo` (`:6096`) but it is **not wrapped in an `<a>`** and has no `data-w-id`. Looks clickable, does nothing. Do not add a link.                                                                                                                                                                                                                                                                                                                                                                | chrome §3                    |
| 5   | nav "Home Page"           | `a.no-text-dec` → `/`                                                                                                                                               | `a:hover{opacity:.61}` (`:2181`), `.modal-link:hover{opacity:.5}` (`:6424`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | chrome §3.5                  |
| 6   | nav "First Visit"         | → `/your-first-visit`                                                                                                                                               | "                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | chrome                       |
| 7   | nav "Meet Our Team"       | → `/our-team`                                                                                                                                                       | " · **not** marked current on this route                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | chrome                       |
| 8   | nav "Services"            | → `/services`                                                                                                                                                       | "                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | chrome                       |
| 9   | nav "Ask the Doctor"      | → `/ask-the-doctor`                                                                                                                                                 | "                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | chrome                       |
| 10  | nav "Contact"             | → `/contact-us`                                                                                                                                                     | "                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | chrome                       |
| 11  | nav "(310) 378-9241"      | → `tel:310-378-9241`                                                                                                                                                | "                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | chrome                       |
| 12  | nav "Book an Appointment" | `a.button.text-color-primary-dark.show-form.nav`, `data-w-id="6eca16bd-…bdbe"`                                                                                      | IX2 **e-307 → a-5 "show-form-modal"** + jQuery `$(".show-form").click(showForm)` (`detail-team.html:126-136`). ⚠️ **INERT on this page — `.form-modal` does not exist (§E.7).** Hover still fires: bg → `rgba(18,158,204,.29)`, opacity → .6                                                                                                                                                                                                                                                                                                                         | chrome §3.6                  |
| 13  | nav "Make a Payment"      | `a.button…nav` → `https://app.modento.io/beachfront-dentistry`                                                                                                      | `.button:hover` (`:6042`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | chrome                       |
| 14  | **"Back to Team"**        | `a.button.text-color-primary.mt-2.w-button` → `/our-team`                                                                                                           | **page-unique.** Hover measured at 1440/834/390: opacity `1 → 0.6`, bg `rgba(0,0,0,0) → rgba(18,158,204,0.29)`, transition `.2s` / `.2s cubic-bezier(.215,.61,.355,1)` (`:6039`, `:6042`). **It DOES dim** — no IX2 inline `opacity` pin on this element (measured `getAttribute("style") === null`), unlike the CTA button.                                                                                                                                                                                                                                         | **this page**                |
| 15  | CTA "Book Appointment"    | `a.button.text-color-primary-dark.show-form`, `data-w-id="1273e294-…4f60"`                                                                                          | IX2 **e-17 → a-5** (inert, §E.7) + **e-75 → a-7** reveal. Hover changes **bg only** — a-7 pins `opacity:1` inline (chrome §4.7).                                                                                                                                                                                                                                                                                                                                                                                                                                     | chrome §4                    |
| 16  | "Read Reviews" expander   | `div.block-link.social-link-block`, `data-w-id="9daf7a34-…bdbe"`                                                                                                    | IX2 **e-211 → a-8 "open-footer-socials"** / **e-212 → a-9 "close-footer-socials"** _plus_ jQuery `$('.social-link-block').click(toggle)` (`detail-team.html:149`) → `toggle` in `matching/spec/incidental-utils.js` adds/removes `active` on the element **and every descendant**. Measured `[probed]`: `.socials-container` `display: none → flex`, `opacity: 0 → 1`, `height 0 → 68.75 / 55 / 38.5` @1440/834/390; class becomes `block-link social-link-block active`. Label hover `opacity → .6` (`:6250`), `.plus-minus-block` hover `opacity → .51` (`:7081`). | chrome §4.4                  |
| 17  | Google reviews link       | `a._w-8.clickable` → google.com/maps/place/Beachfront+Dentistry/…                                                                                                   | hover `opacity → .6` (`:3474`); **unhoverable until #16 opens** (`display:none`, `:7547`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | chrome §4                    |
| 18  | Facebook link             | `a._w-8.clickable` → `https://www.facebook.com/RedondoDentists`                                                                                                     | "                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | chrome                       |
| 19  | Yelp link                 | `a._w-8.clickable` → `https://www.yelp.com/biz/beachfront-dentistry-redondo-beach`                                                                                  | "                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | chrome                       |
| 20  | footer "Your First Visit" | `a.inline-link` → `/your-first-visit`                                                                                                                               | hover `opacity → .6` (`:7391`), `.2s` (`:7387`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | chrome §5.3                  |
| 21  | footer "Our Team"         | → `/our-team`                                                                                                                                                       | "                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | chrome                       |
| 22  | footer "Services"         | → `/services`                                                                                                                                                       | "                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | chrome                       |
| 23  | footer "Ask the Doctor"   | → `/ask-the-doctor`                                                                                                                                                 | "                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | chrome                       |
| 24  | footer "Make a Payment"   | `a.button.text-color-primary-dark`, `data-w-id="b1ce8885-…a66b"`                                                                                                    | IX2 **e-303 → a-5** (inert, §E.7) + **e-305 → a-7** reveal                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | chrome §5                    |
| 25  | footer phone              | `a.inline-link` → `tel:(310)-378-9241`                                                                                                                              | hover `opacity → .6`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | chrome §5.5                  |
| 26  | Google Maps embed         | `.footer-map.w-widget.w-widget-map`, `data-widget-zoom="12"`, `data-enable-scroll="true"`, `data-enable-touch="true"`, `data-widget-latlng="33.817617,-118.385433"` | one composite third-party widget: pan / zoom± / fullscreen / tilt / camera control / "Keyboard shortcuts" / "Terms" / "Report a map error" / scale toggle. Injects **96 pointer-cursor nodes** into the DOM at runtime (`[probed]`: indices 48–143 of the pointer census). Counted as **one** control.                                                                                                                                                                                                                                                               | chrome §5.7                  |
| 27  | landscape `alert()`       | `detail-team.html:138-146`                                                                                                                                          | `if (window.innerWidth < 792 && window.innerHeight < window.innerWidth) alert("Please use Portrait!")` — fires on load **and** on the decoupled `window:resize` event (`incidental-utils.js`). A native modal. Not triggered at any gate width (1440/834/390 are all landscape-or-tall enough to fail one clause); measured `dialogs: []` at all three.                                                                                                                                                                                                              | this page (site-wide script) |

Elements with `cursor: pointer` that are **not** separate controls: the 7
`<h3 class="modal-link">` (inside their `<a>`), the 4 `<img>`s inside header/panel
links, the 3 social `<img>`s, the 4 `.footer-links` / `.footer-contact-info`
`<div>`s (inside their `.inline-link` `<a>`), `.expanding-plus` /
`.expanding-minus` (inside #16). Elements that are **not** interactive at all
`[probed]`: `.member-page-headshot` (`cursor: auto`, no `:hover` rule anywhere
in `beachfront.css`), `h1.subpage-hero-heading`, `.hero-dynamic-image`, both
hero gradients, `.bot-wave`, `h4`, all three `<p>`s.

There are **no** sliders, tabs, accordions, dropdowns (in the Webflow-widget
sense), forms, or inputs on this page. `.w-slider*`, `.w-tab*`, `.w-dropdown*`
markup is absent. There are **no `:focus-visible` rules and no custom focus
ring** anywhere in the sheet (chrome §7).

**INTERACTION COUNT: 27**

---

## D. Animation census

**Page-unique: exactly one reveal.**

| target                                                                                                                                            | trigger                                                                                                                                            | action list                                                | travel                                                                                                                                                     | duration / easing     |
| ------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| `section.bio-section > .content-width` (`data-w-id="624f79d8-7de5-a88e-7c85-42dd9ed460ea"`, IX2 target id `655680f0c897c56b081e91cc\|624f79d8-…`) | **`SCROLL_INTO_VIEW`**, `scrollOffsetValue: 0`, `scrollOffsetUnit: "%"`, event **`e-145`**, `mediaQueries: ["main","medium","small","tiny"]` (all) | **`a-7` "up and in"**, `useFirstGroupAsInitialState: true` | g0 (initial): `TRANSFORM_MOVE yValue: 4, yUnit: "rem"` + `STYLE_OPACITY 0`, duration 500 · g1 (reveal): `TRANSFORM_MOVE yValue: 0 rem` + `STYLE_OPACITY 1` | **2000ms, `outExpo`** |

Read from `Webflow.require("ix2").store.getState().ixData` — `[probed-only]`,
no stylesheet line exists for any of it.

- **The `4rem` initial offset is on the root ladder**: **160 / 128 / 96 px** at
  1440 / 834 / 390, and **128 at 992**, **96 at 768**. IX2 resolves `rem`
  against the live root font-size at play time.
- **The whole bio section is one animated unit.** `.content-width` wraps the
  h4, the richtext, and the back-link row, so census sections 3 _and_ 4 fade
  and rise together. There is no per-element stagger.
- Serialized initial state, present in the static HTML:
  `transform: translate3d(0, 4rem, 0) scale3d(1,1,1) rotateX(0) rotateY(0) rotateZ(0) skew(0,0); opacity: 0`
  (with `-webkit-`/`-moz-`/`-ms-` duplicates).
- Settled inline state `[probed]`:
  `transform: translate3d(0px, 0rem, 0px) scale3d(1,1,1) rotateX(0deg) rotateY(0deg) rotateZ(0deg) skew(0deg, 0deg); opacity: 1; transform-style: preserve-3d`.
  Mid-flight the element also carries `will-change: opacity, transform`
  (captured at 834: `translate3d(0px, 0.01312rem, 0px); opacity: 0.99672`).
- **At 1440 and 390 the section is inside the initial 900px viewport, so the
  reveal has already completed by the time a naive probe reads it** (measured
  pre-scroll inline style at 1440 and 390 is already the settled one). At 834
  the section starts at y 564 with the reveal still running. **Any rect read
  before `document.getAnimations()` goes quiet has the sign of the y-offset
  wrong.** This is the exact failure mode CLAUDE.md warns about.
- **The transform does not change layout.** `.bio-section`'s border box is at
  its final y on first paint; the collapsed 2rem margins above and below
  (§B.3.2, §B.4.3) hold regardless of the animation state. Confirmed: rect y
  pre-settle at 834 = 564.81 vs post-settle 564.39 — a 0.42px transform
  residue, not a layout difference.
- `transform-style: preserve-3d` + a non-`none` transform makes
  `.content-width` a containing block for absolutely-positioned descendants.
  There are none inside `.bio-section`, so this is inert _here_ — but it is why
  the hero's headshot must be positioned against the **hero's**
  `.content-width` and not this one.

**Chrome reveals also firing on this page** (all `a-7`, all
`SCROLL_INTO_VIEW` @ 0%): `e-73` (CTA `<h2>`), `e-85` (button wrapper), `e-75`
(the CTA button), `e-77` (reviews wrapper), `e-87` (`.cta-beach-label`),
`e-305` (footer "Make a Payment"). Chrome §4.7.

**Click-triggered:** `e-9 → a-4` / `e-7 → a-3` (nav panel, chrome §3.4);
`e-211 → a-8` / `e-212 → a-9` (reviews expander, chrome §4.4);
`e-17 / e-303 / e-307 → a-5 "show-form-modal"` — all three **no-op on this page**
(§E.7).

**Not present on this page:** any reveal on the hero (no `data-w-id` in
`<section class="hero">`), any scroll-linked/parallax animation, any
`IntersectionObserver` of the site's own (Webflow IX2 uses scroll listeners,
not IO — a rebuild using IO must match the 0% offset threshold semantics),
any `a-12` / `a-13` / `a-14` action list (all have 0 action groups), and the
`a` / `a-2` "Viewer Accordion" lists (no accordion markup here).

CSS transitions in play: `.button` `opacity .2s, background-color .2s
cubic-bezier(.215,.61,.355,1)` (`beachfront.css:6039`); `a` `opacity .2s`
(`beachfront.css:2178`); `.header-logo` / `.header-hamburger` `.35s
cubic-bezier(.215,.61,.355,1)` (`beachfront.css:6093`, `:6111`);
`.modal-link` `.35s` (`:6421`); `.inline-link` `.2s` (`:7387`);
`._w-8.clickable` `.2s` (`:3471`).

---

## E. Known-suspect list

Ranked by confidence that our build is currently wrong.

### E.1 `.member-page-headshot` — a FIVE-step size ladder (highest confidence)

`beachfront.css:6459-6469` (`8rem` + `border-radius: 4rem` + `bottom: -2rem`),
`:8174-8177` (≤991 — **size untouched**), `:8752-8757` (≤767 → `6rem`,
`bottom: -.6rem`), `:9262-9265` (≤479 → `4rem`).

The base size is declared in `rem` (root gates **992 / 768 / 480**) while the
overrides are Webflow classes (gates **991 / 767 / 479**). The two interleave
into five rendered sizes: **320 / 256 / 192 / 144 / 96**. A two-tier or even a
three-tier ladder keyed at 768 reproduces the bug this project exists to fix:

| viewport | live renders | a build keyed `md:` at 768 with `6rem` renders                        | error          |
| -------- | ------------ | --------------------------------------------------------------------- | -------------- |
| 992      | 256          | 320 (still "desktop")                                                 | **+64**        |
| 834      | 256          | 144 (`6rem` @ root 24 if the root ladder is also keyed at 768) or 192 | **−112 / −64** |
| **768**  | **192**      | 144                                                                   | **−48**        |
| 767      | 144          | 144                                                                   | ✅             |

`border-radius: 4rem` rides the same ladder (160 / 128 / 96 computed). And
`bottom` takes **−80 / −64 / −48 / −14.4** — a _four_-step ladder of its own,
because `-2rem` is on the root gates and `-.6rem` on the Webflow gates.
Getting `bottom` wrong breaks the invariant in §B.2.5 (headshot bottom edge ==
bio section top edge at ≥768) and moves the circle relative to the wave.

**Check:** at 768 the headshot must be **192px**, at 834 **256px**, at 992
**256px**. If any of those three is wrong, the ladder is two-tier.

### E.2 `.bot-wave` — three separate traps in one element

1. **`transform: rotate(180deg)` is on the wrapper, not the SVG**
   (`detail-team.html:20-22`; measured `matrix(-1,0,0,-1,0,0)` on `.bot-wave`
   and `none` on the `<svg>`). Rotating the SVG instead puts the 476.5px
   horizontal overflow on the wrong side.
2. **`height: 3rem` is declared only in the page's inline `<style>`**
   (`detail-team.html:24-29`) — it is **not in `beachfront.css`**. A build that
   greps only the stylesheet will not find it. It is a pure root-font ladder:
   **120 / 96 / 72** breaking at **992 and 768**, so it is one of the few
   values on this page where 991 == 992 and 767 == 768.
3. `.bot-wave.flip` (`beachfront.css:6018-6022`) is a **different** variant
   (`rotateY(180deg)`, `bottom: -3rem`) and is **not** used here. Do not
   conflate them.

Also: the SVG is jQuery-appended (`detail-team.html:123`), so it is absent
from server-rendered HTML. A Svelte build that renders it inline is _more_
correct, but must reproduce `viewBox="0 0 1200 120"`,
`preserveAspectRatio="none"`, `width: calc(133% + 1.3px)`, and
`fill: #FFFFFF`.

### E.3 The two collapsed `2rem` margins own the inter-section space

`.mt-8` on the h4 (`beachfront.css:5928-5930`, §B.3.2) and `.mb-8` on the
back-link row (`beachfront.css:3998-4000`, §B.4.3) both **collapse out** of
`section.bio-section` because `.content-width` has no padding-top/bottom
(`beachfront.css:5858-5867`) and `.bio-section` has no rules at all. Measured:
hero bottom 475.19 → bio top **555.19** (80px of nobody's box) @1440;
bio bottom 997.19 → footer top **1077.19** (another 80).

If the rebuild expresses either gap as section padding, the space moves _into_
a gate region and every anchor cut below shifts by 80/64/48px. Because the
`Back to Team → Ready for great` region is only **147px** tall @1440, an 80px
misattribution there is a >50% region error — it will not hide.

### E.4 `.mb-4` zeroes `margin-top`; only a 3-class compound restores it

`beachfront.css:3985-3988` declares `.mb-4 { margin-top: 0; margin-bottom: 1rem }`
and sits **after** `.mt-8` (`beachfront.css:3925-3927`) at equal specificity.
On `<h4 class="text-color-primary-dark mt-8 mb-4">` the naive cascade gives
`margin-top: 0`. Live renders `2rem` **only** because of
`beachfront.css:5928-5930`:

```
.text-color-primary-dark.mt-8.mb-4 { margin-top: 2rem }
```

A port that implements `mt-8` / `mb-4` as independent utilities — in either
source order, and especially a Tailwind-style port where `mb-4` legitimately
does _not_ touch `margin-top` — produces either **0** or **80px** by accident,
not by rule. This is the single most likely silent 80px error on the page.
**Check:** `getComputedStyle(h4).marginTop` must be `80px` @1440.

### E.5 `.subpage-hero-heading.half-width` — four widths, and a wrap that only exists in the trap band

`beachfront.css:6126-6136` (`100%`), `:8082-8085` (≤991 → `40%`),
`:8653-8657` (≤767 → `80%`, `margin-bottom: 10%`), `:9204-9208` (≤479 →
`100%`, `font-size: 25px`). Combined with the `h1` type ladder
(`:2104-2112` 60/72 → `:7853-7856` 28/38), the title box is:

`844.80×72` @1440 · `591.36×72` @992 · `236.27×38` @991 ·
**`194.83×76` @834** · **`183.73×76` @768** · `340.17×38` @767 ·
`231.66×38` @390.

**768–991 is the only band where the title wraps to two lines.** A build keyed
at 768 gives `80%` at 834 → one line → the block is 38px tall instead of 76px
and sits 38px lower. That defect is only **3.2% of its gate region's area**
(§A.1) so it will **pass** the 0.10 gate. Check the h1 rect explicitly at 834;
do not rely on the region score.

Second trap in the same rule: `margin-top: 8%` is **inert** (top is solved from
`bottom: 2%`, §B.2.6). A build that implements it as real top spacing pushes
the title down by 67.6 / 39.0 / 18.5px.

Third: `margin-bottom` is `5%` above 767 and `10%` at ≤767, and both resolve
against `.col-2-of-3`'s **width**, not the hero's height.

### E.6 `.button.text-color-primary` — four font steps, and type/margin on different gates

Font: 25 (≥992, `:6028`) / 20 (991–768, `:8045`) / 15 (767–480, `:8632`) /
14 (≤479, `:9185`). Heights **67 / 54 / 41 / 38.375**. `.mt-2` (`.5rem`,
`:3901`) steps at 992/768 → **20 / 16 / 12**.

At **992** the button is 25px type with a **16px** margin; at **768** it is
20px type with a **12px** margin. The 41px height exists only in 480–767 and is
invisible to a 1440/834/390 matrix — but the _presence_ of the 15px step is
what makes `.button.text-color-primary` a four-tier component, so any
`text-color-primary` button built as three tiers is wrong somewhere in
480–767. Chrome §6.2 has the full table.

### E.7 `.form-modal` does not exist on this page — chrome §0 is wrong here

Chrome §0 states: _"`.form-modal` is present on all full-page captures
(`detail-svc.html` / `detail-team.html` are partial extracts, so its absence
there is an artifact of the capture, not of the site)."_

**Live-verified false for this page.** Measured at 1440 / 834 / 390:
`document.querySelectorAll(".form-modal").length === 0` **before and after**
programmatically clicking `section.footer a.show-form`. The only
`[class*=modal]` elements in the live DOM are `dropdown-modal`,
`modal-link-container`, and 7× `modal-link` — the nav panel. No dialog opened,
no dialog event fired.

Consequences to build to:

- `$(".show-form").click(showForm)` (`detail-team.html:126-136`) binds to an
  empty jQuery set → no-op.
- IX2 `a-5 "show-form-modal"` (events `e-17`, `e-303`, `e-307`) targets a class
  that does not exist → no-op.
- Controls #12, #15, #24 in §C are **dead** on this route. Their only observable
  behaviour is the CSS hover.
- A rebuild that renders the appointment modal here adds DOM live does not
  have. If the modal has any non-zero rendered size (even `opacity: 0`), it
  changes document height and can shift the footer.

**Action:** correct `_chrome.md` §0 to distinguish "absent from the capture"
(`detail-svc.html`) from "absent from the live page" (`detail-team.html`), and
re-probe `/services/*` before assuming the same there.

### E.8 `.member-page-long-bio` is a decoy — this page does not use it

`beachfront.css:6471-6475` (`width: 66%; margin-top:0; margin-bottom:0`),
`:8179-8181` (≤991 → `width: 100%`), `:8759-8761` (≤767 → `width: 100%`).
The name says "member page long bio" and this _is_ the member page — but the
markup uses a bare `<div class="w-richtext">` with no such class. Measured
richtext width `[probed]`: **1280 / 738 / 351** = the full content column, not
66%. Applying `.member-page-long-bio` narrows the copy to 844.8px @1440 and
re-wraps all three paragraphs. Presumably a stale rule from an earlier
revision of the template. Do not "restore" it.

### E.9 `.w-richtext`'s clearfix pseudo adds a real 10px

`beachfront.css:1672-1681` — `.w-richtext:before, .w-richtext:after
{ content:" "; grid-area:1/1/2/2; display:table }` with `:after { clear: both }`.
The `display: table` `::after` prevents the last `<p>`'s `margin-bottom: 10px`
(`beachfront.css:424-427`) from collapsing out. Measured richtext height
**270** @1440 vs 260 for the paragraphs alone. Dropping the pseudo loses
exactly 10px before the back-link row at **every** width — it is px, not rem,
so it does not scale away and it lands in the smallest gate region on the page
(147px @1440), where 10px is 6.8%.

### E.10 The `Dentist` gate anchor is not substring-unique

3 occurrences in `document.body.innerText` `[probed]`: the `<h4>`, the bio
paragraph's "School of Dentistry", and the footer's "©2023 Beachfront
Dentistry". If the gate resolves anchors by substring rather than exact element
text, the `Dentist` boundary can land in the footer and the whole region map in
§A.1 is void. `Dr. Robert Quan` (h1) is a unique alternate; the body copy's
"Dr Robert Quan" (no period) is a _different_ string and is also unique.

### E.11 Hover asymmetry between the two buttons — do not "fix" it

Measured at 1440 / 834 / 390:

| button                      | inline `style`                     | hover result                                           |
| --------------------------- | ---------------------------------- | ------------------------------------------------------ |
| **"Back to Team"** (§B.4.2) | `null`                             | opacity `1 → 0.6` **and** bg → `rgba(18,158,204,0.29)` |
| CTA "Book Appointment"      | IX2 a-7 leaves `opacity: 1` inline | **bg only**; opacity stays `1`                         |

Both are `.button` and both match `.button:hover { opacity:.6; background-color:#129ecc4a }`
(`beachfront.css:6042-6045`); the difference is entirely the inline pin from
the reveal (chrome §4.7). Since `.bio-section`'s reveal targets the
**wrapper** `.content-width` and not the button, the back-link button has no
pin. A rebuild that animates the button itself will kill its hover dim.

### E.12 Bare `.hero` has no ≤479 rule

`beachfront.css:5295-5300` (33vw), `:7980-7982` (≤991 → 60vw),
`:8438-8440` (≤767 → 70vw), and **nothing at ≤479** — `beachfront.css:9068-9095`
overrides only the five modified variants (`.redondo` 95vw, `.contact` 95vw,
`.group-photo` 95vw, `.home` 70vh, `.ask-a-dentist` 95vw). This hero carries no
modifier, so 70vw carries all the way down: measured **336 @480, 335.3 @479,
273 @390**. Copying the `.hero.contact` pattern would make it 370.5px at 390 —
a 97.5px error that cascades into every y below it.

---

### F. `[probed-only]` inventory for this page

Values below have no stylesheet line and must be re-derived, not copied:

1. IX2 `e-145` / `a-7` timings, offsets, and easing (§D) — from
   `Webflow.require("ix2").store.getState().ixData`.
2. The serialized initial and settled inline `style` on
   `section.bio-section > .content-width`.
3. Margin-collapse results: the 80/64/48 gaps above and below `.bio-section`
   (§B.3.2, §B.4.3) and the CTA `<h2>`'s `my-4` losing to the `mb-8`.
4. The `<h1>`'s solved `top` and the inertness of its `margin-top: 8%` (§B.2.6).
5. The 768–991 two-line wrap of "Dr. Robert Quan" (§E.5) — a text-metrics
   result, not a rule.
6. `.bot-wave`'s injected SVG and its post-rotation rect
   (`x = −476.5`, w 1916.5 @1440).
7. `currentSrc` selection for both images (`-p-1600` for the hero, `-p-500`
   for the headshot at 1440).
8. `.form-modal`'s absence (§E.7).
9. Google Maps' 96 runtime pointer nodes (§C #26).
10. All absolute document-space y values in §A — they are this page's and share
    nothing with the other eight beyond the chrome's _relative_ offsets.

Raw probe output for re-checking:
`…/scratchpad/probe-team.json`, `probe-team2.json`,
`probe-team.mjs`, `probe-team2.mjs`, `probe-team3.mjs`.
