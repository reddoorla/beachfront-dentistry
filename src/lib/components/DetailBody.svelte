<script lang="ts">
  import RichTextBody from "./RichTextBody.svelte";
  import DetailParagraph from "./DetailParagraph.svelte";
  import { animateIn, LIVE_REVEAL } from "$lib/actions/animateIn";
  import type { RichTextField } from "@prismicio/client";

  // Shared body copy for the detail templates (service / question / team),
  // matched to live's `.dynamic-content-body` (`.w-richtext`):
  //   • museo-sans slate #365b6d (live's whole body copy is slate, not #333).
  //   • 12px/18 mobile → 20px/30 desktop paragraphs; 10px between every block.
  //   • Ordered/unordered lists keep their markers (Tailwind Preflight strips
  //     list-style + padding) indented 40px; li 12px/21.6 → 20px/36 desktop.
  // Direct-hit `[&_p]`/`[&_li]` utilities: a wrapper font-size loses to
  // app.css's `main :where(p)` base rule, so the child needs the direct hit.
  let {
    field,
    class: cls = "",
    subheadingGap = "block",
    variant = "live",
  }: {
    field: RichTextField;
    class?: string;
    /** How live authored the blank line above a body sub-heading — see below. */
    subheadingGap?: "block" | "break";
    /** "editorial": the Ask the Doctor articles' own scale — see EDITORIAL. */
    variant?: "live" | "editorial";
  } = $props();

  // The Ask the Doctor articles (the operator's pick, 2026-11-23, "B ·
  // Editorial"; workspace decision
  // 2026-11-23-1947-beachfront-faq-typography-direction). Live's scale above
  // measured 12px body at 390, lists at 20px/36 beside 16px/24 paragraphs at
  // 834, sub-headings the same size as the body, and a fixed 10px between
  // paragraphs, smaller than a line. Here paragraphs and list items share
  // 18/30 → 19/32 → 20/34, blocks sit 16 → 18px apart, sub-headings are
  // museo-slab in deep teal (5.1:1) at 22/28 → 26/32 → 30/38 with 40 → 48 →
  // 56px above, and list numbers are bold deep teal. The route caps the column
  // at 640px, which reads 73 characters a line at 834 and 1440.
  const EDITORIAL =
    "text-[#365b6d] [&>*+*]:mt-[16px] lg:[&>*+*]:mt-[18px] [&_strong]:font-bold [&_p]:text-[18px] [&_p]:leading-[30px] [&_p]:font-light [&_ol]:list-decimal [&_ol]:pl-10 [&_ul]:list-disc [&_ul]:pl-10 [&_li]:text-[18px] [&_li]:leading-[30px] [&_li]:font-light [&_li+li]:mt-[8px] [&_li::marker]:font-bold [&_li::marker]:text-primary-deep [&_.detail-subheading]:font-slab [&_.detail-subheading]:text-[22px] [&_.detail-subheading]:leading-[28px] [&_.detail-subheading]:text-primary-deep [&_.detail-subheading]:mt-[40px] [&_.detail-subheading_strong]:font-medium md:[&_p]:text-[19px] md:[&_p]:leading-[32px] md:[&_li]:text-[19px] md:[&_li]:leading-[32px] md:[&_.detail-subheading]:text-[26px] md:[&_.detail-subheading]:leading-[32px] md:[&_.detail-subheading]:mt-[48px] lg:[&_p]:text-[20px] lg:[&_p]:leading-[34px] lg:[&_li]:text-[20px] lg:[&_li]:leading-[34px] lg:[&_.detail-subheading]:text-[30px] lg:[&_.detail-subheading]:leading-[38px] lg:[&_.detail-subheading]:mt-[56px]";
  const LIVE =
    "text-[#365b6d] [&>*+*]:mt-[10px] [&_strong]:font-bold [&_p]:text-[12px] [&_p]:leading-[18px] [&_p]:font-light [&_ol]:list-decimal [&_ol]:pl-10 [&_ul]:list-disc [&_ul]:pl-10 [&_li]:text-[12px] [&_li]:leading-[21.6px] [&_li]:font-light md:[&_p]:text-[16px] md:[&_p]:leading-[24px] md:[&_li]:text-[20px] md:[&_li]:leading-[36px] lg:[&_p]:text-[20px] lg:[&_p]:leading-[30px] lg:[&_li]:text-[20px] lg:[&_li]:leading-[36px]";

  // The blank line above a body sub-heading was authored TWO different ways in
  // webflow, and the migration dropped both. Read off live's own `.w-richtext`
  // children (matching/probe-body-dom.mjs, 5 documents):
  //   • services  — a STANDALONE empty <p> block (dental-exams 2, implants 2,
  //     teeth-whitening 8; trailing <br> in a paragraph: 0 across all four).
  //     Whitespace above the sub-heading = 10 + 18 + 10 = 38px.
  //   • questions — a trailing <br> INSIDE the preceding paragraph (4 of them
  //     on the sampled Q&A), so that paragraph is one line taller and the gap
  //     stays the standard 10px. Whitespace above the sub-heading = 18 + 10 =
  //     28px.
  // Both reduce to "how much space sits above a tagged sub-heading", so this
  // reproduces them in CSS rather than by mutating the content: every element
  // AFTER the sub-heading then lands on live's exact y at either setting
  // (verified element-by-element on both templates).
  // NB: the counts vary per document (dental-cleanings has 0 empty blocks), so
  // the real fix is to carry live's blank lines into the Prismic docs — a seed
  // + publish. See LEDGER.
  // The blank line is one LINE-HEIGHT, which steps 18/24/30 with the body, so
  // the gap has to step too: break = lh + 10, block = 10 + lh + 10.
  const subheadingClass = $derived(
    subheadingGap === "break"
      ? "[&_.detail-subheading]:mt-[28px] md:[&_.detail-subheading]:mt-[34px] lg:[&_.detail-subheading]:mt-[40px]"
      : "[&_.detail-subheading]:mt-[38px] md:[&_.detail-subheading]:mt-[44px] lg:[&_.detail-subheading]:mt-[50px]",
  );
</script>

<div
  class="{variant === 'editorial'
    ? EDITORIAL
    : `${LIVE} ${subheadingClass}`} {cls}"
  use:animateIn={LIVE_REVEAL}
>
  <RichTextBody {field} components={{ paragraph: DetailParagraph }} />
</div>
