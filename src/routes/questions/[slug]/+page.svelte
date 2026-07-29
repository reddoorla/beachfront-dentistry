<script lang="ts">
  import RichTextBody from "$lib/components/RichTextBody.svelte";
  import CtaBand from "$lib/components/CtaBand.svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
</script>

<article class="mx-auto max-w-3xl px-6 pt-32 pb-16">
  <a
    href="/ask-the-doctor"
    class="text-sm font-medium tracking-widest uppercase hover:opacity-70 focus-visible:ring-2 focus-visible:ring-primary-deep focus-visible:ring-offset-2 focus-visible:outline-hidden"
  >
    <span aria-hidden="true">←</span> All questions
  </a>

  <h1 class="mt-6 text-3xl font-light text-dark">{data.title}</h1>

  <div class="richtext-block mt-6">
    <RichTextBody field={data.doc.data.body} />
  </div>
</article>

<CtaBand />
