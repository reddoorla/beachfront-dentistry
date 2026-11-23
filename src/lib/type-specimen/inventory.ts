// Font sizes a component sets for itself (a Tailwind arbitrary `text-[30px]`,
// an inline or <style> `font-size:`), outside the global type scale in app.css.
// Fed the components' source text by the specimen route at build time.

export interface InlineSize {
  file: string;
  line: number;
  /** The class or declaration as written, e.g. `md:[&_p]:text-[19px]`. */
  token: string;
}

/** Source trees that are scaffolding, not the site a visitor sees. */
const EXCLUDE =
  /\/(routes\/dev|routes\/slice-simulator|lib\/blux-frozen|routes\/type-specimen)\//;

const ARBITRARY =
  /[^\s"'`{}]*text-\[(?:[\d.]+(?:px|rem|em|vw)|clamp\([^\]]*\))\][^\s"'`{}]*/g;
const DECLARED = /font-size:\s*([^;"'}]+)/g;

export function inlineSizes(sources: Record<string, string>): InlineSize[] {
  const out: InlineSize[] = [];
  for (const [file, src] of Object.entries(sources)) {
    if (EXCLUDE.test(file)) continue;
    // Blank out comments (keeping their newlines, so line numbers hold): a
    // comment that quotes a class is not a size the page renders.
    const code = src.replace(
      /<!--[\s\S]*?-->|\/\*[\s\S]*?\*\/|(?<![:"'\w])\/\/[^\n]*/g,
      (c) => c.replace(/[^\n]/g, " "),
    );
    code.split("\n").forEach((text, i) => {
      for (const m of text.matchAll(ARBITRARY))
        out.push({ file: file.replace(/^\//, ""), line: i + 1, token: m[0] });
      for (const m of text.matchAll(DECLARED))
        out.push({
          file: file.replace(/^\//, ""),
          line: i + 1,
          token: `font-size: ${m[1].trim()}`,
        });
    });
  }
  return out.sort((a, b) =>
    a.file === b.file ? a.line - b.line : a.file < b.file ? -1 : 1,
  );
}

/** The inventory grouped by file, in file order. */
export function byFile(rows: InlineSize[]): [string, InlineSize[]][] {
  const out = new Map<string, InlineSize[]>();
  for (const r of rows) out.set(r.file, [...(out.get(r.file) ?? []), r]);
  return [...out.entries()];
}
