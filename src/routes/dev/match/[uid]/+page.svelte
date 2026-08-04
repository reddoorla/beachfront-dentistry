<script lang="ts">
  import { SliceZone } from "@prismicio/svelte";
  import { components } from "$lib/slices";
  import { loadPresentation } from "$lib/blux/presentation";

  let { data } = $props();
</script>

<!-- Renders the shared publish assembly through the SAME SliceZone + components
     the production [uid] route uses, so what shows here is what ships. See
     +page.server.ts for why this exists (a Prismic-publish-free matching gate). -->
<SliceZone
  slices={data.slices as never}
  {components}
  context={{
    presentation: loadPresentation(data.uid),
    collections: data.collections,
  }}
/>
