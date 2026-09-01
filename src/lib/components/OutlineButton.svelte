<script module lang="ts">
  // ---------------------------------------------------------------------------
  // The site's ONE pill interaction language.
  //
  // The same visual pill was authored twelve times across nine files with three
  // different hovers. Nine of them faded — `transition-[opacity,background-color]
  // hover:bg-[#129ecc4a] hover:opacity-60` — which makes the label HARDER to read
  // on hover (measured 7.31:1 → 2.87:1 on the contact pill) and, because opacity
  // composites the whole element, drops the cyan fill it was paired with to an
  // effective 0.174 alpha, so the affordance the class was meant to add is
  // nearly invisible. The control read as going away rather than lighting up.
  // None had a `:active` state at all, and none carried a duration or easing
  // while the site's three easing tokens sat unused at app.css:69-71.
  //
  // The language, from CtaBand/Footer's already-better treatment: the fill
  // deepens, the border steps to full brand cyan, the box takes a 1px press.
  // `translate` — NOT `transform` — is the transitioned property: Tailwind v4
  // compiles `translate-y-px` to `translate: var(--tw-translate-x)
  // var(--tw-translate-y)`, so a `transition-[…,transform]` would never have
  // animated the press (verified against the project's own tailwind build).
  //
  // CONTRAST is the constraint that shapes the colourways, computed per state
  // against the real ground (sRGB relative luminance, WCAG 2.x):
  //
  //   teal  #365b6d ink   rest 7.31 on white · 6.55 on the #e7f5fa footer
  //                       hover 5.33 (#bae3f0) · 4.91 (#a9dced)
  //   cyan  #0e7799 ink   rest 5.10 on white   hover 3.72  ← FAILS
  //         #0e7799 →     rest 5.10            hover 5.05  (ink darkens with
  //         #0b6180 held                                     the fill)
  //   white #ffffff ink   hover — ink never changes; the fill is live's own
  //                       29%-alpha wash, so the label stays pure white on the
  //                       hero exactly as it is at rest (see MARKUP ROUND I1)
  //   white-deep    ink   rest 4.52 on the darkened menu wash (was 2.89)
  //         #ffffff →     hover 5.10 (#0e7799 ink on the white fill)
  //
  // Two of those numbers are deliberate deviations, both forced by the same
  // arithmetic — the fill DARKENS the ground, so dark-ink-on-light-pill always
  // loses contrast on hover, and the cyan colourway had none to lose:
  //
  //  • the cyan pill's rest ink is `--color-primary-deep` (#0e7799), not live's
  //    `.button.text-color-primary` #129ecc. #129ecc on white is 3.09:1 — an AA
  //    failure BEFORE any hover, and 2.26:1 under the shared fill. This repo has
  //    already made exactly this substitution for exactly this reason (see the
  //    footer heading in Footer.svelte).
  //  • held, that ink steps one stop darker to #0b6180 — the same hue (194°) and
  //    saturation (84%) as the brand cyan at L*27%, the luminance the shared fill
  //    requires (≤0.107). Keeping ONE fill strength matters: ExamTimeline and
  //    FirstVisitToc render a teal and a cyan pill side by side, and a colourway
  //    whose hover was quietly weaker to buy contrast would reintroduce the
  //    "affordance you can't see" defect this change exists to remove.
  //
  // ONE rule decides both white colourways: the fill is whatever contrasts with
  // the ground the pill sits on. There are two grounds, so there are two.
  //
  //  • `white` sits on PHOTOGRAPHY (the hero, a section card, a question card).
  //    Its fill is live's own `.button:hover` wash, `#129ecc4a`
  //    (`beachfront.css:6042-6045`) — a 29%-alpha cyan.
  //
  //    This REPLACES an opaque `#0e7799` fill, and the reversal is a designer
  //    call, not a re-derivation. MARKUP ROUND I1, thread
  //    dc881aa2-e714-4960-bca7-cb75ba1d4f16 (Navigation board, pin #1), Tim on
  //    the home hero CTA: "When I hover over this, a blue background shows up.
  //    I don't want there to be." The opaque fill was this repo's invention —
  //    live has never painted a solid block behind this pill — and it was
  //    chosen on the reasoning that "a translucent cyan composites to nothing
  //    over a bright beach". That reasoning optimised the AFFORDANCE and
  //    ignored that a colour block appearing under a hero headline is a
  //    visual-design decision the designer owns.
  //
  //    Nothing about contrast regresses, because the INK does not move: white
  //    at rest, white on hover. The rest state's legibility comes from the
  //    hero's own top/bottom gradient scrims (SubpageHero:149,157), which are
  //    unchanged, so the hover state is now exactly as readable as the rest
  //    state instead of jumping to a different ground mid-interaction. What is
  //    genuinely weaker is how LOUD the affordance is, and live accepted that
  //    same trade — its own answer is this wash. The press beat
  //    (`active:translate-y-px`) and the border carry the rest.
  //
  //    Live pairs the wash with `opacity:.6` on the whole control. That half is
  //    still deliberately NOT taken: it is the "affordance you can't see"
  //    defect this module was written to remove (7.31:1 → 2.87:1, measured).
  //    The wash is live's; the opacity fade stays dropped.
  //  • `white-deep` sits on the MENU WASH. That wash used to be #129ecc, which
  //    left every white thing on it failing AA (measured 2.85-2.96:1 across all
  //    nine links at 390 and 1440 — the whole menu, not just the pills). The
  //    operator ACKed darkening it to `--color-primary-deep`, so the ground now
  //    IS #0e7799 and the `white` fill above would composite to nothing on it —
  //    the same defect, one tone along. This colourway therefore INVERTS
  //    instead: the fill is white and the ink steps to #0e7799. That is the
  //    strongest available step on a deep ground and the only option that holds
  //    4.5:1 at the 15px mobile size — an opaque #129ecc fill would read 3.09:1
  //    under white and fail there.
  //
  // Do NOT collapse the two back into one. They differ because their grounds
  // differ, and a shared fill is invisible on one of them by construction.
  // ---------------------------------------------------------------------------

  export type PillVariant = "teal" | "cyan" | "white" | "white-deep";

  /** Timing + press beat — identical for every colourway. */
  export const PILL_MOTION =
    "transition-[background-color,border-color,color,translate] duration-200 ease-[var(--transition-out-expo)] active:translate-y-px";

  const PILL_COLOURWAY: Record<PillVariant, string> = {
    teal: "border-[#365b6d] text-[#365b6d] hover:border-[#129ecc] hover:bg-[#129ecc4a] focus-visible:ring-primary-deep",
    cyan: "border-[#0e7799] text-[#0e7799] hover:border-[#129ecc] hover:bg-[#129ecc4a] hover:text-[#0b6180] focus-visible:ring-primary-deep",
    white:
      "border-white text-white hover:bg-[#129ecc4a] focus-visible:ring-white focus-visible:ring-offset-primary-deep",
    "white-deep":
      "border-white text-white hover:bg-white hover:text-[#0e7799] focus-visible:ring-white focus-visible:ring-offset-primary-deep",
  };

  /** Shape + focus mechanics every pill shares, colourway-independent. */
  export const PILL_BASE =
    "inline-flex items-center rounded-lg border font-slab font-light focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden";

  /**
   * The full interaction + colour class string for a pill.
   *
   * Call sites that can be an `<OutlineButton>` should be one. The four that
   * cannot are still ONE implementation through this function: CtaBand's pill
   * is a `<PrismicLink>` (an editor-settable field, whose external links need
   * target/rel this component does not model), the Footer's carries its own
   * margins and `linkAttrs`, and the two menu pills carry per-row `in:fly`
   * directives that cannot be applied to a component's inner element.
   */
  export const pillClass = (variant: PillVariant = "teal") =>
    `${PILL_BASE} ${PILL_MOTION} ${PILL_COLOURWAY[variant]}`;
</script>

<script lang="ts">
  import { asLink, type LinkField } from "@prismicio/client";

  // Live's `.button`: a transparent outline pill — 1px border, 8px radius,
  // museo-slab 25px, ~66px tall, the text colour matching the border. Two
  // colourways: teal (#365b6d) and cyan (#129ecc → see the module block above
  // for why this ships #0e7799). Shared by the your-first-visit TOC +
  // exam-timeline sections. A "#appointment" href opens the global
  // AppointmentModal via the layout's delegated handler.
  let {
    label,
    link,
    variant = "teal",
    class: cls = "",
  }: {
    label: string;
    link?: LinkField | string | null;
    variant?: PillVariant;
    class?: string;
  } = $props();

  // Live's `.button` (`beachfront.css:6028-6040`) has NO height of its own:
  // `height:auto; padding:1.3em 1em; line-height:0`, so the box is exactly
  // 2.6em + 2px of border and it tracks the font size. That size is a FOUR-tier
  // ladder, not the two we had: 25px base, 20px <=991 (`:8045-8047`), 15px
  // <=767 (`:8632-8634`), and 14px <=479 for both colourways
  // (`.button.text-color-primary-dark` `:9173-9175` /
  // `.button.text-color-primary` `:9185-9187`). Resolved heights 38 / 41 / 54 /
  // 67 — we shipped 66 at every width. Expressing the padding in `em` the way
  // live does makes the box follow the ladder instead of restating it.
  // The dark colourway is the one exception to the `em` box:
  // `.button.text-color-primary-dark` (`beachfront.css:6047-6051`) replaces the
  // `1.3em` with a hard 32px at >=992, so it is 66 tall where the cyan variant
  // is 67. The <=991 rule (`:8049-8052`) puts `1.3em` back and they converge.
  const sizing = $derived(
    "px-[1em] py-[1.3em] leading-[0] text-[14px] xs:text-[15px] md:text-[20px] lg:text-[25px]" +
      (variant === "teal" ? " lg:py-8" : ""),
  );
  const href = $derived(
    typeof link === "string" ? link : (asLink(link ?? undefined) ?? undefined),
  );
</script>

<a {href} class="{pillClass(variant)} justify-center {sizing} {cls}">
  {label}
</a>
