// @vitest-environment node
//
// The harness scripts are recipe-owned CODE (see .prettierignore) that the
// `reddoor-maint match-harness` recipe copies byte-for-byte into other sites,
// so a defect here ships fleet-wide. Each case below drives the real script in
// a scratch copy and asserts on what it prints and how it exits — and every
// guard is shown to GRANT as well as refuse, because a guard proven only to
// refuse is not proven (the failure this repo has hit twice).
//
// Lives under scripts/ rather than matching/: the recipe's .gitignore block
// ignores `matching/*` and whitelists only the files it installs, so a test
// file there is invisible to git (and to vitest's include).
import { execFile } from "node:child_process";
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { afterEach, describe, expect, it } from "vitest";

const exec = promisify(execFile);
const HERE = join(dirname(fileURLToPath(import.meta.url)), "..", "matching");

/** The scripts a scratch copy needs: the four under test plus what they import
 *  (floors.mjs is side-effect free; harness.json is the real page table). */
const COPIED = [
  "harness.mjs",
  "next.mjs",
  "strikes.mjs",
  "build-spec.mjs",
  "floors.mjs",
  "harness.json",
];
const KEYS = Object.keys(
  (
    JSON.parse(await readFile(join(HERE, "harness.json"), "utf8")) as {
      pages: object;
    }
  ).pages,
).sort();

const roots: string[] = [];
afterEach(async () => {
  await Promise.all(
    roots.splice(0).map((r) => rm(r, { recursive: true, force: true })),
  );
});

/** A `<root>/<name>/matching/` holding the real scripts. The default `name`
 *  carries a SPACE: `new URL(".", import.meta.url).pathname` percent-encodes
 *  it, so a script resolving its own directory that way looks for
 *  `with%20space/matching/…`, which does not exist (#47). */
async function scratch(name = "with space"): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "bf-matching-"));
  roots.push(root);
  const dir = join(root, name, "matching");
  await mkdir(dir, { recursive: true });
  for (const f of COPIED) await cp(join(HERE, f), join(dir, f));
  return dir;
}

/** Run `node matching/<script> …args` from the scratch site's root, the way
 *  the round protocol invokes it. Resolves on EVERY exit code — a helper that
 *  threw on non-zero would make "crashed" and "refused" the same shape. */
async function node(dir: string, script: string, ...args: string[]) {
  try {
    const { stdout, stderr } = await exec(
      "node",
      [join("matching", script), ...args],
      {
        cwd: dirname(dir),
      },
    );
    return { code: 0, out: stdout + stderr };
  } catch (e) {
    const err = e as { code?: number; stdout?: string; stderr?: string };
    return {
      code: err.code ?? -1,
      out: (err.stdout ?? "") + (err.stderr ?? ""),
    };
  }
}

/** One completed, countable gate run under `out-<tag>-<name>`, passing at
 *  every viewport, attributed to `page` by its ref path (the way strikes.mjs
 *  resolves the page) — so the run dir's NAME can differ from the page. */
async function writeRun(
  dir: string,
  name: string,
  page = "home",
  at = "2026-09-01T00:00:00.000Z",
) {
  const cfg = JSON.parse(await readFile(join(dir, "harness.json"), "utf8")) as {
    ref: string;
    matrix: number[];
    pages: Record<string, { ref: string; anchors: string[] }>;
  };
  const p = cfg.pages[page];
  const labels = ["top", ...p.anchors];
  const regions = cfg.matrix.flatMap((viewport) =>
    labels.map((label) => ({
      viewport,
      label,
      mismatchFraction: 0.01,
      heightDeltaFraction: 0,
      pass: true,
    })),
  );
  await mkdir(join(dir, `out-${name}`), { recursive: true });
  await writeFile(
    join(dir, `out-${name}`, "report.json"),
    JSON.stringify({
      meta: {
        schemaVersion: 1,
        ref: cfg.ref + p.ref,
        generatedAt: at,
        threshold: 0.1,
        maxHeightDelta: 0.05,
        viewports: cfg.matrix,
        sections: p.anchors,
        mask: [],
      },
      overallPass: true,
      regions,
    }),
  );
}

describe("#47 — every script resolves its own directory under a path with a space", () => {
  it("strikes.mjs honours PAUSED there (the switch must not fail open)", async () => {
    const dir = await scratch();
    await writeFile(join(dir, "PAUSED"), "paused by test\n");
    const r = await node(dir, "strikes.mjs");
    expect(r.out).toMatch(/MATCHING PAUSED/);
    expect(r.code).toBe(0);
  });

  it("strikes.mjs reads the corpus there when PAUSED is absent", async () => {
    const dir = await scratch();
    await writeRun(dir, "t1-home");
    const r = await node(dir, "strikes.mjs");
    expect(r.out).not.toMatch(/MATCHING PAUSED/);
    expect(r.out).toMatch(/strikes: clear/);
    expect(r.code).toBe(0);
  });

  it("next.mjs honours PAUSED there", async () => {
    const dir = await scratch();
    await writeFile(join(dir, "PAUSED"), "paused by test\n");
    const r = await node(dir, "next.mjs");
    expect(r.out).toMatch(/MATCHING PAUSED/);
    expect(r.code).toBe(0);
  });

  it("next.mjs reads the corpus there when PAUSED is absent", async () => {
    const dir = await scratch();
    await writeRun(dir, "t1-home");
    const r = await node(dir, "next.mjs");
    expect(r.out).not.toMatch(/MATCHING PAUSED/);
    // home is 27 = (8 anchors + 1) x 3 viewports; the denominator is the whole
    // declared site (every page, measured or not), so only home's row is pinned.
    expect(r.out).toMatch(
      /SCORE 27\/\d+ regions passing over 9 of 9 page\(s\)/,
    );
    expect(r.out).toMatch(/^ {2}home {6}27\/27$/m);
  });

  it("build-spec.mjs finds spec-sections/ and writes SPEC.md there", async () => {
    const dir = await scratch();
    await mkdir(join(dir, "spec-sections"));
    await writeFile(join(dir, "spec-sections", "_chrome.md"), "## chrome\n");
    for (const k of KEYS)
      await writeFile(join(dir, "spec-sections", `${k}.md`), `## ${k}\n`);
    const r = await node(dir, "build-spec.mjs");
    expect(r.out).toMatch(
      new RegExp(`SPEC.md built — ${KEYS.length}/${KEYS.length} pages`),
    );
    expect(r.code).toBe(0);
    expect(await readFile(join(dir, "SPEC.md"), "utf8")).toContain("## home");
  });
});

describe("#48 — the refusal's 'known pages' are the gate keys, not the corpus's dir names", () => {
  it("lists exactly the page table's keys, even with a hand-named probe dir in the corpus", async () => {
    const dir = await scratch("plain");
    await writeRun(dir, "t1-home");
    await writeRun(dir, "t1-r1"); // a probe dir: keyOf() says "r1", which is not a page
    const r = await node(dir, "strikes.mjs", "nosuchpage");
    expect(r.code).toBe(2);
    expect(r.out).toMatch(/"nosuchpage" matches no gate run/);
    const known = /known pages: (.*)$/m.exec(r.out)?.[1];
    expect(known?.split(", ")).toEqual(KEYS);
  });

  it("still GRANTS a real key — the probe dir stays reachable by its own name", async () => {
    const dir = await scratch("plain");
    await writeRun(dir, "t1-home");
    await writeRun(dir, "t1-r1");
    expect(await node(dir, "strikes.mjs", "home")).toMatchObject({ code: 0 });
    expect((await node(dir, "strikes.mjs", "home")).out).toMatch(
      /strikes: clear .* on home/,
    );
    expect(await node(dir, "strikes.mjs", "r1")).toMatchObject({ code: 0 });
  });
});

describe("#50 — a page key is validated once, at load, before any pattern sees it", () => {
  it("refuses a key carrying a regex metacharacter, naming the key", async () => {
    const dir = await scratch("plain");
    const p = join(dir, "harness.json");
    const cfg = JSON.parse(await readFile(p, "utf8")) as {
      pages: Record<string, unknown>;
    };
    cfg.pages["a.c"] = cfg.pages.home;
    await writeFile(p, JSON.stringify(cfg, null, 2));
    const r = await node(dir, "harness.mjs", "--table");
    expect(r.code).not.toBe(0);
    expect(r.out).toMatch(/"a\.c"/);
    expect(r.out).not.toMatch(/^home\t/m); // nothing was listed
  });

  it("loads the real harness.json — every shipped key passes", async () => {
    const dir = await scratch("plain");
    const r = await node(dir, "harness.mjs", "--table");
    expect(r.code).toBe(0);
    expect(
      r.out
        .trim()
        .split("\n")
        .map((l) => l.split("\t")[0])
        .sort(),
    ).toEqual(KEYS);
  });
});
