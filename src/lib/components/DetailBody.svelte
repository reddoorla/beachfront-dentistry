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
  }: {
    field: RichTextField;
    class?: string;
    /** How live authored the blank line above a body sub-heading — see below. */
    subheadingGap?: "block" | "break";
  } = $props();

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
  class="text-[#365b6d] [&>*+*]:mt-[10px] {subheadingClass} [&_strong]:font-bold [&_p]:text-[12px] [&_p]:leading-[18px] [&_p]:font-light [&_ol]:list-decimal [&_ol]:pl-10 [&_ul]:list-disc [&_ul]:pl-10 [&_li]:text-[12px] [&_li]:leading-[21.6px] [&_li]:font-light md:[&_p]:text-[16px] md:[&_p]:leading-[24px] md:[&_li]:text-[16px] md:[&_li]:leading-[28.8px] lg:[&_p]:text-[20px] lg:[&_p]:leading-[30px] lg:[&_li]:text-[20px] lg:[&_li]:leading-[36px] {cls}"
  use:animateIn={LIVE_REVEAL}
>
  <RichTextBody {field} components={{ paragraph: DetailParagraph }} />
</div>
