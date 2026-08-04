import { asText } from "@prismicio/client";
import type { RichTextField } from "@prismicio/client";

/** Split a detail-page body into a promoted lede + the rest.
 *
 * The rule: the first paragraph is promoted to a styled lede ONLY when it is
 * the body's FIRST block. If anything else opens the body (a heading, an
 * image, a list), no lede is extracted and the body renders unchanged —
 * promoting a paragraph from deeper in would silently REORDER the document,
 * hoisting it above the heading/image the author deliberately put first.
 *
 * Shared by the service AND question detail routes (live gives both the same
 * cyan right-indented lede over a dark body). Pure and page-side (presentation,
 * not data): exported for direct unit testing from the routes' load tests.
 */
export function splitLede(body: RichTextField): {
  lede: string;
  rest: RichTextField;
} {
  const [first, ...rest] = body;
  if (first?.type === "paragraph") {
    return { lede: asText([first]), rest: rest as RichTextField };
  }
  return { lede: "", rest: body };
}
