<script lang="ts">
  import RichTextBody from "./RichTextBody.svelte";
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
  }: {
    field: RichTextField;
    class?: string;
  } = $props();

  // A paragraph whose entire text is one bold run = a webflow sub-heading.
  // (CSS can't detect this — `strong:only-child` ignores text nodes, so it
  //  can't tell a bold-only sub-heading from a paragraph that merely contains
  //  a bold run — hence the span check here.)
  function isBoldOnlyHeading(block: unknown): boolean {
    const b = block as {
      type?: string;
      text?: string;
      spans?: { start: number; end: number; type: string }[];
    };
    if (!b || b.type !== "paragraph" || !b.text) return false;
    const strong = (b.spans ?? []).filter((s) => s.type === "strong");
    if (!strong.length) return false;
    const min = Math.min(...strong.map((s) => s.start));
    const max = Math.max(...strong.map((s) => s.end));
    return min <= 0 && max >= b.text.length;
  }

  // Webflow ends the paragraph BEFORE each sub-heading with a trailing <br>
  // (an empty line) — the space above the sub-heading. Migration cleaned those
  // out, so live's body runs ~1 line/para taller. Re-insert the exact break
  // webflow used (\n + zero-width joiner) on precisely the content paragraphs
  // immediately before a bold-only sub-heading — not the sub-headings, not
  // paragraphs that merely contain a bold run.
  const withBreaks = $derived(
    Array.isArray(field)
      ? (field as unknown[]).map((blk, i) => {
          const b = blk as { type?: string; text?: string };
          const next = (field as unknown[])[i + 1];
          if (
            b.type === "paragraph" &&
            !isBoldOnlyHeading(b) &&
            isBoldOnlyHeading(next)
          ) {
            return { ...b, text: `${b.text}\n‍` };
          }
          return blk;
        })
      : field,
  ) as RichTextField;
</script>

<div
  class="text-[#365b6d] [&>*+*]:mt-[10px] [&_p]:text-[12px] [&_p]:leading-[18px] [&_p]:font-light [&_ol]:list-decimal [&_ol]:pl-10 [&_ul]:list-disc [&_ul]:pl-10 [&_li]:text-[12px] [&_li]:leading-[21.6px] [&_li]:font-light lg:[&_p]:text-[20px] lg:[&_p]:leading-[30px] lg:[&_li]:text-[20px] lg:[&_li]:leading-[36px] {cls}"
  use:animateIn={LIVE_REVEAL}
>
  <RichTextBody field={withBreaks} />
</div>
