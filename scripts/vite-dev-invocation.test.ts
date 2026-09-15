// @vitest-environment node
//
// #52: `pnpm vite:dev -- --port N --strictPort` binds 5173. pnpm keeps the `--`
// in the argv it builds (`vite dev --host -- --port N --strictPort`), vite's
// parser treats `--` as end-of-options, and BOTH flags land in a passthrough
// array — including the one whose whole job was to make the mistake loud. So no
// consumer may reach vite through the `vite:dev` script with arguments; each
// runs the binary directly with `pnpm exec vite dev …`, which arrives intact.
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CONSUMERS = ["lighthouserc.json", "playwright.config.ts"];

describe("#52 — no dev-server consumer routes flags through `vite:dev`", () => {
  for (const file of CONSUMERS) {
    it(`${file} runs vite directly, with --strictPort`, async () => {
      const src = await readFile(join(ROOT, file), "utf8");
      // The invocation shapes that lose their arguments (pnpm) or work only
      // under one runner (npm): neither may be how a config starts vite.
      expect(src).not.toMatch(/\b(pnpm|npm)( run)? vite:dev\b/);
      expect(src).toMatch(/pnpm exec vite dev\b[^\n"`]*--strictPort/);
    });
  }

  it("the `vite:dev` script keeps --host for its own callers", async () => {
    const pkg = JSON.parse(
      await readFile(join(ROOT, "package.json"), "utf8"),
    ) as {
      scripts: Record<string, string>;
    };
    expect(pkg.scripts["vite:dev"]).toMatch(/\bvite dev\b.*--host/);
  });
});
