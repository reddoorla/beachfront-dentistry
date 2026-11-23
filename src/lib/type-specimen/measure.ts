// The type specimen's instrument (/type-specimen). Every value the specimen
// shows is READ from a rendered document with getComputedStyle, never typed in:
// change a size in app.css or a component's classes and the next build's
// specimen says so. The page measures at three widths by loading documents into
// same-origin iframes of that width, because a media query or a `vw` clamp only
// answers for the viewport it is evaluated in.

/** The three widths the specimen reports: desktop, tablet, phone. 1280 sits in
 *  live's ≥992 tier, 834 in its 768–991 tier (CLAUDE.md: calibrate md at 834),
 *  390 in its ≤479 tier. */
export const WIDTHS = [
  { key: "desktop", label: "Desktop 1280", width: 1280, height: 900 },
  { key: "tablet", label: "Tablet 834", width: 834, height: 1112 },
  { key: "mobile", label: "Mobile 390", width: 390, height: 844 },
] as const;
export type WidthKey = (typeof WIDTHS)[number]["key"];

export interface TypeStyle {
  family: string;
  /** The whole declared stack, for rendering a sample; not part of the key. */
  stack: string;
  size: string;
  lineHeight: string;
  weight: string;
  letterSpacing: string;
  color: string;
  transform: string;
  style: string;
  decoration: string;
}

export interface Measurement {
  style: TypeStyle;
  /** False when the element has no box at this width (display:none, a closed
   *  menu): its style still applies the moment it shows. */
  visible: boolean;
  /** Declarations a `:hover` / `:visited` rule adds, read from the stylesheets. */
  states: Record<string, Record<string, string>>;
}

/** The first family in a stack, unquoted: `museo-slab, "Rockwell", …` → museo-slab. */
export function firstFamily(stack: string): string {
  return (stack.split(",")[0] ?? "").trim().replace(/^["']|["']$/g, "");
}

export function readStyle(cs: CSSStyleDeclaration): TypeStyle {
  return {
    family: firstFamily(cs.fontFamily),
    stack: cs.fontFamily,
    size: cs.fontSize,
    lineHeight: cs.lineHeight,
    weight: cs.fontWeight,
    letterSpacing: cs.letterSpacing,
    color: cs.color,
    transform: cs.textTransform,
    style: cs.fontStyle,
    decoration: cs.textDecorationLine,
  };
}

export function styleKey(s: TypeStyle | undefined): string {
  if (!s) return "—";
  return [
    s.family,
    s.size,
    s.lineHeight,
    s.weight,
    s.letterSpacing,
    s.color,
    s.transform,
    s.style,
    s.decoration,
  ].join("|");
}

/** `rgb(14, 119, 153)` → `#0e7799`; anything else passes through. */
export function hexColor(c: string): string {
  const m = c.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/);
  if (!m) return c;
  const hex =
    "#" +
    [m[1], m[2], m[3]]
      .map((n) => Number(n).toString(16).padStart(2, "0"))
      .join("");
  return m[4] !== undefined && Number(m[4]) < 1
    ? `${hex} at ${Math.round(Number(m[4]) * 100)}%`
    : hex;
}

/** Relative luminance of an rgb() colour, 0–1, for picking a sample's ground. */
export function luminance(c: string): number {
  const m = c.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!m) return 0;
  const [r, g, b] = [m[1], m[2], m[3]].map((v) => {
    const x = Number(v) / 255;
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** px with at most two decimals: "17.3653px" → "17.37px". */
export function px(v: string): string {
  const m = v.match(/^(-?[\d.]+)px$/);
  return m ? `${Math.round(Number(m[1]) * 100) / 100}px` : v;
}

const SKIP_TAGS = new Set([
  "SCRIPT",
  "STYLE",
  "NOSCRIPT",
  "TEMPLATE",
  "TITLE",
  "META",
  "LINK",
  "HEAD",
  "HTML",
  "IFRAME",
  "OPTION",
]);

/** Elements that own text: at least one non-blank text node as a direct child.
 *  That is where a text style actually lands; a wrapper whose only text is in
 *  its children would double-count the child's style. */
export function textElements(root: Element): Element[] {
  const out: Element[] = [];
  const walk = (el: Element) => {
    if (SKIP_TAGS.has(el.tagName) || el.closest("svg")) return;
    if (
      [...el.childNodes].some(
        (n) => n.nodeType === 3 && (n.textContent ?? "").trim() !== "",
      )
    )
      out.push(el);
    for (const c of el.children) walk(c);
  };
  walk(root);
  return out;
}

/** The element's text, collapsed and cut to `max` characters. */
export function ownText(el: Element, max = 80): string {
  const t = (el.textContent ?? "").replace(/\s+/g, " ").trim();
  return t.length > max ? t.slice(0, max - 1) + "…" : t;
}

/** A stable address for an element within one prerendered page, so the same
 *  element can be matched across the three widths' documents. */
export function domPath(el: Element): string {
  const parts: string[] = [];
  let cur: Element | null = el;
  while (cur && cur.parentElement) {
    const idx = [...cur.parentElement.children].indexOf(cur);
    parts.unshift(`${cur.tagName.toLowerCase()}:${idx}`);
    cur = cur.parentElement;
  }
  return parts.join(">");
}

/** Classes that set type, kept for the label: Tailwind's text/font/leading/
 *  tracking/case utilities (any variant chain), and the site's own named type
 *  hooks. Layout utilities would only bury them. */
export function typeClasses(el: Element): string[] {
  return [...el.classList].filter((c) => {
    const base = c.slice(c.lastIndexOf(":") + 1);
    return (
      /^(text-\[?[\d.]|text-(xs|sm|base|lg|xl|\d?xl)\b|font-|leading-|tracking-|uppercase|lowercase|capitalize|italic|underline|h-primary|display-|detail-|txt-role)/.test(
        base,
      ) ||
      /\]:(text|font|leading)-/.test(c) ||
      /^\[&/.test(c)
    );
  });
}

/** Where on the page an element sits, in words Tim will recognise. */
export function context(el: Element): string {
  if (el.closest("header, nav, [data-site-nav]")) return "Nav";
  if (el.closest("footer")) return "Footer";
  if (el.closest("dialog, [role='dialog']")) return "Dialog";
  if (el.closest("[data-detail-label]")) return "Detail hero label";
  const slice = el.closest<HTMLElement>("[data-slice-type]");
  if (slice) {
    const v = slice.dataset.sliceVariation;
    return `Slice ${slice.dataset.sliceType}${v && v !== "default" ? ` (${v})` : ""}`;
  }
  if (el.closest("main")) return "Main";
  return "Page";
}

type StateRule = { selector: string; state: string; decls: [string, string][] };

/** Every `:hover` / `:visited` rule that applies at this document's width,
 *  with nested rules resolved to full selectors (Tailwind v4 emits
 *  `.hover\:x { &:hover { @media (hover:hover) { … } } }`). */
export function stateRules(doc: Document): StateRule[] {
  const win = doc.defaultView!;
  const out: StateRule[] = [];
  const visit = (rules: CSSRuleList, parent: string | null) => {
    for (const r of rules) {
      if (r instanceof win.CSSMediaRule) {
        if (win.matchMedia(r.conditionText).matches) visit(r.cssRules, parent);
      } else if (r instanceof win.CSSSupportsRule) {
        visit(r.cssRules, parent);
      } else if (
        "cssRules" in r &&
        r.constructor.name === "CSSLayerBlockRule"
      ) {
        visit((r as CSSGroupingRule).cssRules, parent);
      } else if (r instanceof win.CSSStyleRule) {
        const sel = parent
          ? r.selectorText.includes("&")
            ? r.selectorText.replaceAll("&", `:is(${parent})`)
            : `:is(${parent}) ${r.selectorText}`
          : r.selectorText;
        const decls: [string, string][] = [];
        for (let i = 0; i < r.style.length; i++) {
          const p = r.style[i];
          decls.push([p, r.style.getPropertyValue(p)]);
        }
        for (const state of ["hover", "visited"]) {
          if (decls.length && sel.includes(`:${state}`))
            out.push({ selector: sel, state, decls });
        }
        if (r.cssRules?.length) visit(r.cssRules, sel);
      } else if ("style" in r && parent) {
        // CSSNestedDeclarations: bare declarations inside a nested rule.
        const st = (r as CSSStyleRule).style;
        const decls: [string, string][] = [];
        for (let i = 0; i < st.length; i++)
          decls.push([st[i], st.getPropertyValue(st[i])]);
        for (const state of ["hover", "visited"]) {
          if (decls.length && parent.includes(`:${state}`))
            out.push({ selector: parent, state, decls });
        }
      } else if ("cssRules" in r) {
        try {
          visit((r as CSSGroupingRule).cssRules, parent);
        } catch {
          /* cross-origin or unreadable */
        }
      }
    }
  };
  for (const sheet of doc.styleSheets) {
    try {
      visit(sheet.cssRules, null);
    } catch {
      /* a cross-origin sheet (the Adobe font kit) cannot be read */
    }
  }
  return out;
}

const STATE_PROPS = new Set([
  "color",
  "background-color",
  "text-decoration-line",
  "text-decoration-thickness",
  "text-decoration-color",
  "border-color",
  "opacity",
  "--tw-ring-color",
]);

/** The declarations each state adds to `el`, resolved against its custom
 *  properties (`var(--color-dark)` → the colour). The state's subject is the
 *  element or the link/button it sits in. */
export function statesFor(
  el: Element,
  rules: StateRule[],
): Record<string, Record<string, string>> {
  const win = el.ownerDocument.defaultView!;
  const subjects = [el, el.closest("a, button")].filter(
    (x): x is Element => !!x,
  );
  const cs = win.getComputedStyle(el);
  const resolve = (v: string) =>
    v.replace(/var\((--[\w-]+)(?:,[^)]*)?\)/g, (m, name) => {
      const got = cs.getPropertyValue(name).trim();
      return got || m;
    });
  const out: Record<string, Record<string, string>> = {};
  for (const r of rules) {
    const bare = r.selector.replaceAll(`:${r.state}`, "");
    let hit = false;
    for (const s of subjects) {
      try {
        if (s.matches(bare)) hit = true;
      } catch {
        /* a selector jsdom/Chromium cannot test */
      }
    }
    if (!hit) continue;
    for (const [p, v] of r.decls) {
      const prop = p === "text-decoration" ? "text-decoration-line" : p;
      if (!STATE_PROPS.has(prop) && !prop.startsWith("text-decoration"))
        continue;
      (out[r.state] ??= {})[prop] = resolve(v);
    }
  }
  return out;
}

export function measure(el: Element, rules: StateRule[]): Measurement {
  const win = el.ownerDocument.defaultView!;
  const cs = win.getComputedStyle(el);
  return {
    style: readStyle(cs),
    visible: el.getClientRects().length > 0 && cs.visibility !== "hidden",
    states: el.closest("a, button") ? statesFor(el, rules) : {},
  };
}

/** Load `url` in an off-screen iframe `width` wide and hand its document to
 *  `read` once it has loaded and its fonts have settled. */
export function inFrame<T>(
  url: string,
  width: number,
  height: number,
  read: (doc: Document) => T,
  prepare?: (doc: Document) => Promise<void>,
  timeoutMs = 30_000,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const f = document.createElement("iframe");
    f.setAttribute("aria-hidden", "true");
    f.tabIndex = -1;
    f.title = "";
    f.style.cssText = `position:absolute;left:-20000px;top:0;width:${width}px;height:${height}px;border:0;visibility:hidden;pointer-events:none`;
    const timer = setTimeout(() => {
      f.remove();
      reject(new Error(`timed out loading ${url} at ${width}px`));
    }, timeoutMs);
    f.addEventListener("load", async () => {
      try {
        const doc = f.contentDocument!;
        await doc.fonts?.ready;
        // One frame for hydration to settle any class it toggles on mount.
        await new Promise((r) => setTimeout(r, 300));
        if (prepare) await prepare(doc);
        resolve(read(doc));
      } catch (e) {
        reject(e);
      } finally {
        clearTimeout(timer);
        f.remove();
      }
    });
    f.src = url;
    document.body.append(f);
  });
}

/** Open the nav menu, so its links (rendered only while it is open) are read
 *  with the rest of the page. */
export async function openNavMenu(doc: Document): Promise<void> {
  const toggle = [
    ...doc.querySelectorAll<HTMLElement>(
      'nav [aria-controls][aria-expanded="false"]',
    ),
  ].find((b) => b.getClientRects().length > 0);
  if (!toggle) return;
  toggle.click();
  await new Promise((r) => setTimeout(r, 900));
}

export interface ScanHit {
  page: string;
  interactive: boolean;
  path: string;
  tag: string;
  context: string;
  classes: string[];
  text: string;
  m: Measurement;
}

/** Every text-owning element of a document, measured. */
export function scanDocument(doc: Document, page: string): ScanHit[] {
  const rules = stateRules(doc);
  return textElements(doc.body).map((el) => ({
    page,
    path: domPath(el),
    tag: el.tagName.toLowerCase(),
    interactive: !!el.closest("a, button"),
    context: context(el),
    classes: typeClasses(el),
    text: ownText(el),
    m: measure(el, rules),
  }));
}

export interface StyleGroup {
  /** One measurement per width; absent where the element does not exist. */
  by: Partial<Record<WidthKey, Measurement>>;
  tags: Set<string>;
  contexts: Set<string>;
  classes: Set<string>;
  pages: Set<string>;
  examples: string[];
  count: number;
  /** Sits in a link or button, so its hover and visited rules are shown. */
  interactive: boolean;
}

/** Fold per-width scans into distinct styles. Two elements share a style only
 *  when they match at EVERY width: the same 20px desktop paragraph is two
 *  styles if one drops to 12px on a phone and the other to 16px. */
export function groupStyles(
  scans: Partial<Record<WidthKey, ScanHit[]>>,
): StyleGroup[] {
  const byEl = new Map<
    string,
    { hit: ScanHit; by: Partial<Record<WidthKey, Measurement>> }
  >();
  for (const { key } of WIDTHS) {
    for (const hit of scans[key] ?? []) {
      const id = `${hit.page}#${hit.path}`;
      const rec = byEl.get(id) ?? { hit, by: {} };
      rec.by[key] = hit.m;
      byEl.set(id, rec);
    }
  }
  const groups = new Map<string, StyleGroup>();
  for (const { hit, by } of byEl.values()) {
    const key =
      WIDTHS.map((w) => styleKey(by[w.key]?.style)).join("§") +
      "§" +
      JSON.stringify(by.desktop?.states ?? by.mobile?.states ?? {});
    const g = groups.get(key) ?? {
      by,
      tags: new Set(),
      contexts: new Set(),
      classes: new Set(),
      pages: new Set(),
      examples: [],
      count: 0,
      interactive: false,
    };
    g.interactive ||= hit.interactive;
    g.tags.add(hit.tag);
    g.contexts.add(hit.context);
    hit.classes.forEach((c) => g.classes.add(c));
    g.pages.add(hit.page);
    if (hit.text && g.examples.length < 3 && !g.examples.includes(hit.text))
      g.examples.push(hit.text);
    g.count++;
    groups.set(key, g);
  }
  const size = (g: StyleGroup) =>
    parseFloat(g.by.desktop?.style.size ?? g.by.mobile?.style.size ?? "0");
  return [...groups.values()].sort((a, b) => size(b) - size(a));
}

/** The pages worth scanning, from the site's own sitemap: every top-level
 *  page, plus the first page of each nested template (/services/…,
 *  /questions/…, /team-members/…), since siblings share one template. */
export function pickPages(paths: string[]): string[] {
  const seenPrefix = new Set<string>();
  const out: string[] = [];
  for (const p of paths) {
    const segs = p.split("/").filter(Boolean);
    if (segs.length <= 1) {
      if (!out.includes(p)) out.push(p);
    } else if (!seenPrefix.has(segs[0])) {
      seenPrefix.add(segs[0]);
      out.push(p);
    }
  }
  return out;
}
