<script lang="ts">
  import type { RTParagraphNode } from "@prismicio/client";
  import type { Snippet } from "svelte";

  // Paragraph renderer for the detail-page body. Its only job is to mark the
  // "bold-only" paragraphs — a paragraph whose ENTIRE text is one bold run is
  // how webflow authored the body sub-headings ("What to expect during a
  // dental exam", "Why are dental exams important?").
  //
  // Live puts 38px between the paragraph above and such a sub-heading, and the
  // normal 10px everywhere else. CSS can't select these: `strong:only-child`
  // ignores text nodes, so it can't tell a bold-only sub-heading from a
  // paragraph that merely ENDS in a bold run — hence the node check here,
  // which sees the real span offsets.
  let { node, children }: { node: RTParagraphNode; children: Snippet } =
    $props();

  const isSubheading = $derived.by(() => {
    if (!node?.text) return false;
    const strong = (node.spans ?? []).filter((s) => s.type === "strong");
    if (!strong.length) return false;
    return (
      Math.min(...strong.map((s) => s.start)) <= 0 &&
      Math.max(...strong.map((s) => s.end)) >= node.text.length
    );
  });
</script>

<p class={isSubheading ? "detail-subheading" : undefined}>
  {@render children()}
</p>
