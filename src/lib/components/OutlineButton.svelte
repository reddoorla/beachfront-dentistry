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
  const href = $derived(
    typeof link === "string" ? link : (asLink(link ?? undefined) ?? undefined),
  );
</script>

<a
  {href}
  class="focus-visible:ring-primary-deep inline-flex h-[66px] items-center justify-center rounded-lg border px-6 font-slab text-[20px] font-light transition-opacity hover:opacity-60 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden lg:text-[25px] {cls}"
  style="color:{color};border-color:{color}"
>
  {label}
</a>
