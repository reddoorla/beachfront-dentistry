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
    size = "default",
    class: cls = "",
  }: {
    label: string;
    link?: LinkField | string | null;
    variant?: "teal" | "cyan";
    // "detail" matches live's smaller detail-page back-links (38px/14px on
    // mobile) while keeping the full 66px/25px pill at desktop.
    size?: "default" | "detail";
    class?: string;
  } = $props();

  const color = $derived(variant === "cyan" ? "#129ecc" : "#365b6d");
  const sizing = $derived(
    size === "detail"
      ? "h-[38px] px-[14px] text-[14px] lg:h-[66px] lg:px-6 lg:text-[25px]"
      : "h-[66px] px-6 text-[20px] lg:text-[25px]",
  );
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
