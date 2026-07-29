<script lang="ts">
  import { PrismicRichText } from "@prismicio/svelte";
  import { asText, isFilled, type RichTextField } from "@prismicio/client";

  // ServiceCategoryBandSlice isn't in the generated Prismic types yet — same
  // situation as QuestionList: this is a brand-new slice and regenerating
  // needs a wired Slice Machine session, so the slice + doc shapes are
  // widened locally here.
  type CollectionItemDoc = {
    uid: string;
    data: {
      title?: RichTextField;
      tags?: string | null;
    };
  };

  interface Props {
    slice: {
      slice_type: string;
      variation?: string;
      primary: {
        category_tag?: string | null;
        heading?: RichTextField;
        intro?: RichTextField;
      };
    };
    context?: { collections?: Record<string, CollectionItemDoc[]> };
  }

  let { slice, context }: Props = $props();

  const titleText = (doc: CollectionItemDoc): string =>
    asText((doc.data.title ?? []) as RichTextField);

  // The tags field is a comma-separated STRING on collection_item docs (e.g.
  // "Cosmetic Dentistry" or "General Dentistry, Specialty Services"), not a
  // Prismic tags array — split/trim it into a parsed list per doc. A doc with
  // no tags field at all parses to [""], which never matches a real category
  // tag, so it renders nowhere (matching the live /services index behavior).
  let matchingDocs = $derived(
    (context?.collections?.collection_item ?? []).filter((doc) =>
      (doc.data.tags ?? "")
        .split(",")
        .map((t) => t.trim())
        .includes(slice.primary.category_tag ?? ""),
    ),
  );
</script>

<section
  data-slice-type={slice.slice_type}
  data-slice-variation={slice.variation}
  class="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-6 py-16 md:grid-cols-2 md:items-start"
>
  <div>
    {#if isFilled.richText(slice.primary.heading)}
      <PrismicRichText field={slice.primary.heading} />
    {/if}
    {#if isFilled.richText(slice.primary.intro)}
      <div class="mt-4">
        <PrismicRichText field={slice.primary.intro} />
      </div>
    {/if}
  </div>

  <!-- Brand-blue link panel: normal-size white text on the brand hue needs
       -deep (see app.css) to clear WCAG AA — plain primary is only 3.09:1.
       The subtle dark gradient mirrors the live site's panel look; it's
       decorative (aria-hidden, pointer-events-none) and sits under the link
       list via explicit z-10 so it never dims the actual link text/focus
       ring, which absolutely-positioned siblings can otherwise paint over
       even when they precede the content in the DOM. -->
  <div class="relative overflow-hidden rounded-lg bg-primary-deep p-8 md:p-10">
    <div
      class="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20"
      aria-hidden="true"
    ></div>
    <ul class="relative z-10 flex flex-col gap-4">
      {#each matchingDocs as doc (doc.uid)}
        <li>
          <a
            href="/services/{doc.uid}"
            class="flex items-center justify-between gap-3 font-semibold text-white underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary-deep focus-visible:outline-hidden"
          >
            <span>{titleText(doc)}</span>
            <span aria-hidden="true">→</span>
          </a>
        </li>
      {/each}
    </ul>
  </div>
</section>
