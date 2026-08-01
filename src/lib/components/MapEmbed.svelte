<script lang="ts">
  // Simple Google Maps embed iframe — no API key required (unlike the Maps JS
  // surface the frozen Blux sites hydrate, gated in svelte.config.js's
  // wantsMapsCsp). Only https://www.google.com needs to be in frame-src.
  interface Props {
    query?: string;
  }

  let {
    query = "Beachfront Dentistry, 1706 S Elena Ave, Redondo Beach, CA",
  }: Props = $props();
</script>

<iframe
  title="Map to Beachfront Dentistry"
  src={"https://www.google.com/maps?q=" +
    encodeURIComponent(query) +
    "&output=embed"}
  class="h-[400px] w-full rounded border-0"
  loading="lazy"
  referrerpolicy="no-referrer-when-downgrade"
></iframe>
