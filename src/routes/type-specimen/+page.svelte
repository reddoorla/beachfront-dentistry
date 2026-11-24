<script lang="ts">
  import { onMount } from "svelte";
  import { dev } from "$app/env";
  import type { RichTextField } from "@prismicio/client";
  import CtaBand from "$lib/components/CtaBand.svelte";
  import DefaultButton from "$lib/components/DefaultButton.svelte";
  import DetailBody from "$lib/components/DetailBody.svelte";
  import DetailHero from "$lib/components/DetailHero.svelte";
  import DetailIntro from "$lib/components/DetailIntro.svelte";
  import Field from "$lib/components/Field.svelte";
  import OutlineButton from "$lib/components/OutlineButton.svelte";
  import { shouldLoadAnalytics } from "$utils/analytics";
  import { byFile } from "$lib/type-specimen/inventory";
  import {
    WIDTHS,
    groupStyles,
    hexColor,
    inFrame,
    luminance,
    measure,
    openNavMenu,
    pickPages,
    px,
    scanDocument,
    stateRules,
    type Measurement,
    type ScanHit,
    type StyleGroup,
    type WidthKey,
  } from "$lib/type-specimen/measure";

  let { data } = $props();

  // ── Part 1: the core styles, rendered here through the real components ──
  // Each sample is a block of real markup; `targets` are the elements inside it
  // whose computed style the page reports.
  type Sample = {
    id: string;
    title: string;
    note?: string;
    targets: { sel: string; name: string; link?: boolean }[];
  };

  const SAMPLES: Sample[] = [
    ...[1, 2, 3, 4, 5, 6].map((n) => ({
      id: `h${n}`,
      title: `H${n}, the site-wide default`,
      note:
        n <= 3
          ? "app.css h1–h6 rules. Inside <main> h1–h3 take the -deep blue; most of the site's real headings set their own size instead (see the full list below)."
          : "app.css h1–h6 rules.",
      targets: [{ sel: `h${n}`, name: `h${n}` }],
    })),
    {
      id: "body",
      title: "Paragraph body, the site-wide default",
      note: "app.css `main :where(p)`: a fluid clamp, so it differs at every width.",
      targets: [
        { sel: "p", name: "p" },
        { sel: "strong", name: "strong" },
        { sel: "em", name: "em" },
        { sel: "small", name: "small" },
        { sel: "a", name: "a (link in body)", link: true },
      ],
    },
    {
      id: "lists",
      title: "Lists and blockquote, unstyled",
      note: "No site rule styles a bare list or blockquote: Tailwind's reset removes bullets and indents. Article lists are styled by the article body below.",
      targets: [
        { sel: "ul li", name: "ul li" },
        { sel: "ol li", name: "ol li" },
        { sel: "blockquote", name: "blockquote" },
      ],
    },
    {
      id: "crumb",
      title: "Article crumb: Ask the Doctor / View All Questions",
      note: "DetailIntro crumb, above the title of every /questions/… article. The homepage's “Meet Your Team” eyebrow style.",
      targets: [
        { sel: "[data-detail-crumb]", name: "crumb text" },
        { sel: "[data-detail-crumb] a", name: "crumb link", link: true },
      ],
    },
    {
      id: "hero-name",
      title: "Detail hero label: a team member's name",
      note: "DetailHero, labelSize name: every /team-members/… page.",
      targets: [{ sel: "[data-detail-label] h1", name: "name (h1)" }],
    },
    {
      id: "intro-editorial",
      title: "Detail intro, editorial: article title and lede",
      note: "DetailIntro variant editorial: the Ask the Doctor articles.",
      targets: [
        { sel: "h1", name: "title (h1)" },
        { sel: "p", name: "lede" },
      ],
    },
    {
      id: "intro-xl",
      title: "Detail intro, live xl: service title and lede",
      note: "DetailIntro titleSize xl: /services/… pages.",
      targets: [
        { sel: "h1", name: "title (h1)" },
        { sel: "p", name: "lede" },
      ],
    },
    {
      id: "body-editorial",
      title: "Article body, editorial",
      note: "DetailBody variant editorial: the Ask the Doctor articles.",
      targets: [
        { sel: "p:not(.detail-subheading)", name: "paragraph" },
        { sel: ".detail-subheading strong", name: "sub-heading" },
        { sel: "ul li", name: "list item" },
        { sel: "a", name: "link", link: true },
      ],
    },
    {
      id: "body-live",
      title: "Detail body, live",
      note: "DetailBody variant live: services and team pages.",
      targets: [
        { sel: "p:not(.detail-subheading)", name: "paragraph" },
        { sel: ".detail-subheading strong", name: "sub-heading" },
        { sel: "ul li", name: "list item" },
        { sel: "a", name: "link", link: true },
      ],
    },
    {
      id: "cta",
      title: "Closing CTA band: display heading and pill",
      note: "CtaBand (.display-xl): the bottom of most pages.",
      targets: [
        { sel: "h2", name: "display heading (h2)" },
        { sel: "a", name: "pill button", link: true },
      ],
    },
    {
      id: "buttons",
      title: "Buttons",
      note: "OutlineButton in its teal and cyan colourways, and DefaultButton.",
      targets: [
        {
          sel: "[data-spec-btn='teal'] a",
          name: "OutlineButton teal",
          link: true,
        },
        {
          sel: "[data-spec-btn='cyan'] a",
          name: "OutlineButton cyan",
          link: true,
        },
        {
          sel: "[data-spec-btn='default'] a",
          name: "DefaultButton",
          link: true,
        },
      ],
    },
    {
      id: "form",
      title: "Form fields",
      note: "Field: the appointment form and /contact-us.",
      targets: [
        { sel: "label", name: "label" },
        { sel: "p", name: "description" },
        { sel: "input", name: "input" },
        { sel: "textarea", name: "textarea" },
      ],
    },
  ];

  const subheading = "What to do before your appointment";
  const linkWords = "a link inside the article";
  const bodyText = `A paragraph of article body, long enough to wrap so the line height shows. It holds ${linkWords} and some bold words.`;
  const ARTICLE: RichTextField = [
    {
      type: "paragraph",
      text: "Most tooth pain has a simple cause, and the sooner it is looked at the simpler the fix tends to be.",
      spans: [],
    },
    {
      type: "paragraph",
      text: subheading,
      spans: [{ type: "strong", start: 0, end: subheading.length }],
    },
    {
      type: "paragraph",
      text: bodyText,
      spans: [
        {
          type: "hyperlink",
          start: bodyText.indexOf(linkWords),
          end: bodyText.indexOf(linkWords) + linkWords.length,
          data: { link_type: "Web", url: "/ask-the-doctor" },
        },
        {
          type: "strong",
          start: bodyText.indexOf("bold words"),
          end: bodyText.indexOf("bold words") + "bold words".length,
        },
      ],
    },
    { type: "list-item", text: "A bulleted list item", spans: [] },
    { type: "list-item", text: "A second list item", spans: [] },
    { type: "o-list-item", text: "A numbered list item", spans: [] },
  ] as RichTextField;

  // ── Measuring ──
  type Values = Partial<Record<WidthKey | "here", Measurement>>;
  let partOne = $state<Record<string, Values>>({});
  let hereWidth = $state(0);
  // `status` is the live region (start and finish only); `progress` is the
  // per-page counter, shown but not announced.
  let status = $state("Measuring…");
  let progress = $state("");
  let groups = $state<StyleGroup[]>([]);
  let scanned = $state<string[]>([]);
  let scanError = $state("");
  let fontsNote = $state("");
  // On the production hostnames every framed page load would count as a visit
  // in the practice's Google Analytics, so the three-width measuring runs only
  // where analytics is off (staging, deploy previews, localhost).
  let framesAllowed = $state(false);

  function readPartOne(doc: Document): Record<string, Measurement> {
    const rules = stateRules(doc);
    const out: Record<string, Measurement> = {};
    for (const s of SAMPLES) {
      const root = doc.querySelector(`[data-spec="${s.id}"]`);
      for (const t of s.targets) {
        const el = root?.querySelector(t.sel);
        if (el) out[`${s.id}/${t.sel}`] = measure(el, rules);
      }
    }
    return out;
  }

  function merge(key: WidthKey | "here", got: Record<string, Measurement>) {
    const next = { ...partOne };
    for (const [k, m] of Object.entries(got))
      next[k] = { ...(next[k] ?? {}), [key]: m };
    partOne = next;
  }

  async function runScan() {
    const res = await fetch("/sitemap.xml");
    if (!res.ok) throw new Error(`/sitemap.xml answered ${res.status}`);
    const xml = await res.text();
    const paths = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
      (m) => new URL(m[1]).pathname,
    );
    const pages = pickPages(paths);
    if (!pages.length) throw new Error("/sitemap.xml listed no pages");
    const scans: Partial<Record<WidthKey, ScanHit[]>> = {};
    let done = 0;
    const jobs = pages.flatMap((p) => WIDTHS.map((w) => ({ p, w })));
    const total = jobs.length;
    const worker = async () => {
      for (let j = jobs.shift(); j; j = jobs.shift()) {
        const { p, w } = j;
        try {
          const hits = await inFrame(
            p,
            w.width,
            w.height,
            (doc) => scanDocument(doc, p),
            openNavMenu,
          );
          (scans[w.key] ??= []).push(...hits);
        } catch (e) {
          scanError += `${(e as Error).message}. `;
        }
        done++;
        progress = `Reading the live pages: ${done} of ${total} (page × width) loaded…`;
      }
    };
    await Promise.all([worker(), worker(), worker()]);
    groups = groupStyles(scans);
    scanned = pages;
    progress = "";
    status = `Done: ${groups.length} distinct styles found.`;
  }

  onMount(async () => {
    hereWidth = window.innerWidth;
    merge("here", readPartOne(document));
    await document.fonts.ready;
    const kit = [...document.fonts].filter((f) => /museo/i.test(f.family));
    fontsNote = kit.some((f) => f.status === "loaded")
      ? "The Adobe museo fonts are loading on this address, so the samples show the real faces."
      : "The Adobe museo fonts are not loading on this address (the kit is locked to the live domains), so the samples render in the fallback faces named in the stack. The values are the same either way.";
    // The framed copies of this page measure; they never frame anything.
    if (new URLSearchParams(location.search).has("frame")) return;
    framesAllowed = !shouldLoadAnalytics(location.hostname, dev);
    if (!framesAllowed) {
      status = "";
      return;
    }
    for (const w of WIDTHS) {
      try {
        merge(
          w.key,
          await inFrame(
            "/type-specimen?frame=1",
            w.width,
            w.height,
            readPartOne,
          ),
        );
      } catch (e) {
        scanError += `${(e as Error).message}. `;
      }
    }
    try {
      await runScan();
    } catch (e) {
      scanError += `Could not read the sitemap: ${(e as Error).message}. `;
      progress = "";
      status = "Stopped: see the error under Part 2's heading.";
    }
  });

  const ROWS: [string, (m: Measurement) => string][] = [
    ["Family", (m) => m.style.family],
    ["Size", (m) => px(m.style.size)],
    ["Line height", (m) => px(m.style.lineHeight)],
    ["Weight", (m) => m.style.weight],
    ["Letter-spacing", (m) => px(m.style.letterSpacing)],
    ["Colour", (m) => hexColor(m.style.color)],
    [
      "Case / style",
      (m) =>
        [
          m.style.transform !== "none" ? m.style.transform : "",
          m.style.style !== "normal" ? m.style.style : "",
          m.style.decoration !== "none" ? m.style.decoration : "",
        ]
          .filter(Boolean)
          .join(", ") || "—",
    ],
    [
      "Hover",
      (m) =>
        m.states.hover
          ? Object.entries(m.states.hover)
              .map(([k, v]) => `${k}: ${hexColor(v)}`)
              .join("; ")
          : "—",
    ],
    [
      "Visited",
      (m) =>
        m.states.visited
          ? Object.entries(m.states.visited)
              .map(([k, v]) => `${k}: ${v}`)
              .join("; ")
          : "not styled",
    ],
  ];

  const COLS = $derived(
    framesAllowed
      ? WIDTHS.map((w) => ({ key: w.key as WidthKey | "here", label: w.label }))
      : [{ key: "here" as const, label: `This window (${hereWidth}px)` }],
  );

  function sampleStyle(m: Measurement | undefined): string {
    if (!m) return "";
    const s = m.style;
    const ground = luminance(s.color) > 0.6 ? "#365b6d" : "transparent";
    return `font-family:${s.stack};font-size:${s.size};line-height:${s.lineHeight};font-weight:${s.weight};letter-spacing:${s.letterSpacing};color:${s.color};text-transform:${s.transform};font-style:${s.style};text-decoration-line:${s.decoration};background:${ground}`;
  }

  const filesWithSizes = $derived(byFile(data.inlineSizes));
</script>

{#snippet valuesTable(
  get: (col: WidthKey | "here") => Measurement | undefined,
  interactive = false,
  absent = "…",
)}
  <div class="overflow-x-auto">
    <table
      class="mt-3 w-full table-fixed border-collapse text-left text-[12px] leading-[17px] md:text-[13px] md:leading-[18px]"
    >
      <colgroup><col class="w-[26%] md:w-[160px]" /></colgroup>
      <thead>
        <tr>
          <th class="border-b border-[#d0d7dc] py-1 pr-3 font-semibold"></th>
          {#each COLS as c (c.key)}
            <th class="border-b border-[#d0d7dc] py-1 pr-3 font-semibold">
              {c.label}
            </th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each ROWS.filter(([l]) => interactive || (l !== "Hover" && l !== "Visited")) as [label, fmt] (label)}
          <tr>
            <th class="py-1 pr-3 align-top font-normal text-[#5d6c7b]">
              {label}
            </th>
            {#each COLS as c (c.key)}
              {@const m = get(c.key)}
              <td
                class="py-1 pr-2 align-top font-mono break-words"
                data-spec-value={`${c.key}:${label}`}
              >
                {m ? fmt(m) : absent}{#if m && !m.visible && label === "Family"}
                  <span class="block font-sans text-[#5d6c7b]">
                    (hidden at this width)
                  </span>{/if}
              </td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{/snippet}

<div class="bg-[#365b6d] px-5 pt-[140px] pb-10 md:px-12 lg:px-20">
  <div
    class="mx-auto max-w-[1440px] font-sans text-[16px] leading-[24px] text-white"
  >
    <p
      class="text-[13px] leading-[18px] font-bold tracking-[0.12em] text-white uppercase"
    >
      Internal review page · not linked, not indexed
    </p>
    <h1
      class="mt-2 font-sans text-[40px] leading-[48px] font-bold"
      style="color:#fff"
    >
      Type specimen
    </h1>
    <p class="mt-4 max-w-[760px] text-[16px] leading-[26px] font-normal">
      Every text style the site uses, with its values at desktop (1280px),
      tablet (834px) and phone (390px). Nothing here is typed in: the page loads
      the site at each width and reads the values the browser computes from the
      site's real CSS, so a change to a style shows up here on the next build.
      Part 1 is the core styles rendered through the real components. Part 2 is
      every distinct style found on the live pages. Part 3 lists the sizes set
      one-off inside components.
    </p>
    {#if fontsNote}<p
        class="mt-3 max-w-[760px] text-[14px] leading-[22px] text-white"
      >
        {fontsNote}
      </p>{/if}
    {#if !framesAllowed && hereWidth}
      <p
        class="mt-3 max-w-[760px] rounded bg-[#fff4d6] p-3 text-[14px] leading-[22px] text-[#222]"
      >
        On the live address this page shows only this window's values: measuring
        at three widths loads the site's pages in the background, and here each
        load would count as a visit in the practice's analytics. Open it on the
        staging address for all three widths and the full list.
      </p>
    {/if}
    <p class="mt-3 text-[14px] font-bold text-white" aria-live="polite">
      {status}
    </p>
    {#if progress}<p class="text-[14px] text-white">{progress}</p>{/if}
  </div>
</div>

<section class="px-5 py-10 md:px-12 lg:px-20" aria-labelledby="part-1">
  <div class="mx-auto max-w-[1440px] font-sans">
    <h2
      id="part-1"
      class="font-sans text-[28px] leading-[36px] font-bold"
      style="color:#222"
    >
      Part 1 · Core styles, rendered through the real components
    </h2>
  </div>
</section>

{#each SAMPLES as s (s.id)}
  <section class="border-t border-[#d0d7dc]" aria-label={s.title}>
    <div class="mx-auto max-w-[1440px] px-5 pt-8 font-sans md:px-12 lg:px-20">
      <h3
        class="font-sans text-[20px] leading-[28px] font-bold"
        style="color:#222"
      >
        {s.title}
      </h3>
      {#if s.note}<p
          class="mt-1 max-w-[760px] text-[14px] leading-[22px] font-normal text-[#5d6c7b]"
        >
          {s.note}
        </p>{/if}
    </div>

    <div data-spec={s.id} class="my-6">
      {#if s.id.match(/^h[1-6]$/)}
        <div class="mx-auto max-w-[1440px] px-5 md:px-12 lg:px-20">
          <svelte:element this={s.id}>
            The quick brown fox, {s.id.toUpperCase()}
          </svelte:element>
        </div>
      {:else if s.id === "body"}
        <div class="mx-auto max-w-[1440px] px-5 md:px-12 lg:px-20">
          <p class="max-w-[760px]">
            Body paragraph. Beachfront Dentistry has cared for families in
            Redondo Beach for years, with <strong>strong words</strong>,
            <em>emphasised words</em>,
            <a href="/ask-the-doctor">a plain link</a>, and
            <small>small print</small> inside the same paragraph.
          </p>
        </div>
      {:else if s.id === "lists"}
        <div class="mx-auto max-w-[1440px] px-5 md:px-12 lg:px-20">
          <ul><li>A bare bulleted list item</li></ul>
          <ol><li>A bare numbered list item</li></ol>
          <blockquote>A bare blockquote</blockquote>
        </div>
      {:else if s.id === "crumb"}
        <DetailIntro
          title="How do I know if a toothache is an emergency?"
          titleSize="lg"
          variant="editorial"
          crumb={{
            label: "Ask the Doctor",
            linkLabel: "View All Questions",
            href: "/ask-the-doctor",
          }}
        />
      {:else if s.id === "hero-name"}
        <DetailHero label="Dr. Example Name" labelSize="name" />
      {:else if s.id === "intro-editorial"}
        <DetailIntro
          title="How do I know if a toothache is an emergency?"
          lede="A short lede that introduces the answer in a sentence or two."
          titleSize="lg"
          variant="editorial"
        />
      {:else if s.id === "intro-xl"}
        <DetailIntro
          title="Dental Exams"
          lede="A service lede, set larger and indented at desktop like live."
          titleSize="xl"
        />
      {:else if s.id === "body-editorial"}
        <section class="mx-auto max-w-[1440px] px-5 md:px-12 lg:px-20">
          <DetailBody
            field={ARTICLE}
            class="max-w-[640px]"
            variant="editorial"
          />
        </section>
      {:else if s.id === "body-live"}
        <section class="mx-auto max-w-[1440px] px-5 md:px-12 lg:px-20">
          <DetailBody field={ARTICLE} />
        </section>
      {:else if s.id === "cta"}
        <CtaBand backgroundImage={null} />
      {:else if s.id === "buttons"}
        <div
          class="mx-auto flex max-w-[1440px] flex-wrap items-center gap-6 px-5 md:px-12 lg:px-20"
        >
          <span data-spec-btn="teal">
            <OutlineButton label="Learn More" link="/our-team" variant="teal" />
          </span>
          <span data-spec-btn="cyan">
            <OutlineButton
              label="Have another question?"
              link="/ask-the-doctor"
              variant="cyan"
            />
          </span>
          <span data-spec-btn="default">
            <DefaultButton href="/contact-us">Default button</DefaultButton>
          </span>
        </div>
      {:else if s.id === "form"}
        <div
          class="mx-auto grid max-w-[1440px] gap-4 px-5 md:px-12 lg:px-20 [&>*]:max-w-[640px]"
        >
          <Field
            name="specimen-name"
            label="Full name"
            description="A field's description line."
          />
          <Field
            name="specimen-message"
            label="Message"
            type="textarea"
            rows={3}
            placeholder="Placeholder text"
          />
        </div>
      {/if}
    </div>

    <div
      class="mx-auto max-w-[1440px] px-5 pb-8 font-sans text-[#222] md:px-12 lg:px-20"
    >
      {#each s.targets as t (t.sel)}
        <h4
          class="mt-4 font-mono text-[14px] leading-[20px] font-semibold"
          style="color:#222"
        >
          {t.name} <span class="font-normal text-[#5d6c7b]">· {t.sel}</span>
        </h4>
        {@render valuesTable(
          (col) => partOne[`${s.id}/${t.sel}`]?.[col],
          t.link,
        )}
      {/each}
    </div>
  </section>
{/each}

<section
  class="border-t-4 border-[#0e7799] bg-[#f4f7f9] px-5 py-10 md:px-12 lg:px-20"
  aria-labelledby="part-2"
>
  <div class="mx-auto max-w-[1440px] font-sans text-[#222]">
    <h2
      id="part-2"
      class="font-sans text-[28px] leading-[36px] font-bold"
      style="color:#222"
    >
      Part 2 · Every distinct text style on the live pages
    </h2>
    <p class="mt-2 max-w-[760px] text-[15px] leading-[24px] font-normal">
      Read from these pages at all three widths: one of each template, and every
      top-level page, taken from the sitemap. Two elements count as one style
      only when they match at every width. Largest desktop size first. The
      sample is the measured style applied to the element's own text. Hover is
      shown for a mouse at 1280 and 834 and not at 390. A style that only
      applies on touch screens shows in the 390 column only when this page is
      opened on a phone.
    </p>
    {#if scanned.length}
      <p class="mt-2 text-[14px] leading-[22px] text-[#5d6c7b]">
        {groups.length} distinct styles across {scanned.join(", ")}.
      </p>
    {/if}
    {#if scanError}<p class="mt-2 text-[14px] text-red-700">{scanError}</p>{/if}

    {#each groups as g, i (i)}
      <article
        class="mt-6 rounded border border-[#d0d7dc] bg-white p-4"
        data-spec-group={i}
      >
        <h3
          class="font-mono text-[14px] leading-[20px] font-semibold"
          style="color:#222"
        >
          {i + 1}. {[...g.contexts].join(" · ")} — {[...g.tags].join(", ")}
          <span class="font-normal text-[#5d6c7b]">
            ({g.count} on {g.pages.size} page{g.pages.size > 1 ? "s" : ""})
          </span>
        </h3>
        <div class="mt-3 grid gap-3 lg:grid-cols-2">
          {#each [["desktop", "At 1280"], ["mobile", "At 390"]] as [k, lab] (k)}
            <div class="overflow-x-auto">
              <span class="block font-sans text-[12px] text-[#5d6c7b]">
                {lab}
              </span>
              <span class="block" style={sampleStyle(g.by[k as WidthKey])}>
                {g.examples[0] || "Sample text"}
              </span>
            </div>
          {/each}
        </div>
        {#if g.classes.size}
          <p
            class="mt-3 font-mono text-[12px] leading-[18px] break-all text-[#5d6c7b]"
          >
            {[...g.classes].join(" ")}
          </p>
        {:else}
          <p class="mt-3 text-[12px] leading-[18px] text-[#5d6c7b]">
            No type class of its own: styled by a parent's rule or the global
            defaults.
          </p>
        {/if}
        <p class="mt-1 text-[12px] leading-[18px] text-[#5d6c7b]">
          Seen on:
          {#each [...g.pages] as p, j (p)}{j ? ", " : ""}<a
              class="underline"
              href={p}
            >
              {p}
            </a>{/each}
        </p>
        {@render valuesTable(
          (col) => (col === "here" ? undefined : g.by[col]),
          g.interactive,
          "no element with this text at this width",
        )}
      </article>
    {/each}
  </div>
</section>

<section class="px-5 py-10 md:px-12 lg:px-20" aria-labelledby="part-3">
  <div class="mx-auto max-w-[1440px] font-sans text-[#222]">
    <h2
      id="part-3"
      class="font-sans text-[28px] leading-[36px] font-bold"
      style="color:#222"
    >
      Part 3 · Sizes set one-off inside components
    </h2>
    <p class="mt-2 max-w-[760px] text-[15px] leading-[24px] font-normal">
      Every font size a component sets for itself (a Tailwind
      <code>text-[…]</code> value or a <code>font-size</code> declaration)
      instead of taking it from a shared style: {data.inlineSizes.length} in
      {filesWithSizes.length} files, read from the source at build time.
    </p>
    {#each filesWithSizes as [file, rows] (file)}
      <h3
        class="mt-5 font-mono text-[14px] leading-[20px] font-semibold break-all"
        style="color:#222"
      >
        {file} <span class="font-normal text-[#5d6c7b]">({rows.length})</span>
      </h3>
      <ul class="mt-1 font-mono text-[12px] leading-[18px]">
        {#each rows as r, j (j)}
          <li><span class="text-[#5d6c7b]">:{r.line}</span> {r.token}</li>
        {/each}
      </ul>
    {/each}
  </div>
</section>
