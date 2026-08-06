<script lang="ts">
  import { asLink, type LinkField } from "@prismicio/client";

  // Live's `.button`: a transparent outline pill — 1px border, 8px radius,
  // museo-slab 25px, ~66px tall, the text colour matching the border. Two
  // colourways: teal (#365b6d) and cyan (#129ecc). Shared by the your-first-
  // visit TOC + exam-timeline sections. A "#appointment" href opens the global
  // AppointmentModal via the layout's delegated handler.
  let {
    label,
    link,
    variant = "teal",
    class: cls = "",
  }: {
    label: string;
    link?: LinkField | string | null;
    variant?: "teal" | "cyan";
    class?: string;
  } = $props();

  const color = $derived(variant === "cyan" ? "#129ecc" : "#365b6d");
  // Live's `.button` (`beachfront.css:6028-6040`) has NO height of its own:
  // `height:auto; padding:1.3em 1em; line-height:0`, so the box is exactly
  // 2.6em + 2px of border and it tracks the font size. That size is a FOUR-tier
  // ladder, not the two we had: 25px base, 20px <=991 (`:8045-8047`), 15px
  // <=767 (`:8632-8634`), and 14px <=479 for both colourways
  // (`.button.text-color-primary-dark` `:9173-9175` /
  // `.button.text-color-primary` `:9185-9187`). Resolved heights 38 / 41 / 54 /
  // 67 — we shipped 66 at every width. Expressing the padding in `em` the way
  // live does makes the box follow the ladder instead of restating it.
  const sizing =
    "px-[1em] py-[1.3em] leading-[0] text-[14px] xs:text-[15px] md:text-[20px] lg:text-[25px]";
  const href = $derived(
    typeof link === "string" ? link : (asLink(link ?? undefined) ?? undefined),
  );
</script>

<a
  {href}
  class="focus-visible:ring-primary-deep inline-flex items-center justify-center rounded-lg border font-slab font-light transition-opacity hover:opacity-60 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden {sizing} {cls}"
  style="color:{color};border-color:{color}"
>
  {label}
</a>
