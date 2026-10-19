// Every absolute URL a prerendered file carries must be the production origin.
// Kit 3 prerenders with the placeholder origin "http://sveltekit-prerender"
// (paths.origin is deliberately unset: sveltekit.config.js says why), and only
// code that goes through $lib/seo's siteOrigin swaps it for Netlify's URL. A
// read of page.url that skips siteOrigin builds green and ships the
// placeholder; three review rounds on #90 kept finding new spellings of that
// read which a source scan could not see. So this checks the output instead:
// it builds the site exactly as Netlify does, with URL set, and fails on any
// built file that still names the placeholder.
import { spawnSync } from "node:child_process";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

export const PLACEHOLDER = "http://sveltekit-prerender";
const PRODUCTION = "https://beachfrontdentistry.com";
const TEXT = /\.(html|xml|txt|json|js)$/;

export function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (TEXT.test(entry)) out.push(full);
  }
  return out;
}

/** Built files that name the placeholder, and how many name production. */
export function scan(root) {
  const files = walk(root).filter(
    (f) => !/[\\/]_app[\\/]immutable[\\/]/.test(f),
  );
  const offenders = [];
  let production = 0;
  for (const file of files) {
    const text = readFileSync(file, "utf8");
    if (text.includes(PLACEHOLDER)) offenders.push(relative(root, file));
    if (text.includes(PRODUCTION)) production++;
  }
  return { files: files.length, offenders, production };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const env = { ...process.env, URL: PRODUCTION };
  delete env.VITEST;
  const built = spawnSync("pnpm", ["exec", "vite", "build"], {
    env,
    stdio: "inherit",
  });
  if (built.status !== 0) process.exit(built.status ?? 1);
  const { files, offenders, production } = scan("build");
  // The instrument's control: a build that emitted nothing, or that never
  // took the production URL, would pass the placeholder check vacuously.
  if (files < 50 || production < 50) {
    console.error(
      `prerender-origin: expected a full build carrying ${PRODUCTION}; ` +
        `saw ${files} files, ${production} naming it`,
    );
    process.exit(1);
  }
  if (offenders.length > 0) {
    console.error(
      `prerender-origin: ${offenders.length} built file(s) carry ${PLACEHOLDER}, ` +
        `kit 3's prerender placeholder, instead of ${PRODUCTION}. Build absolute ` +
        `URLs from page.url through $lib/seo's siteOrigin:\n  ` +
        offenders.join("\n  "),
    );
    process.exit(1);
  }
  console.log(
    `prerender-origin: ${files} built files, ${production} carry ${PRODUCTION}, none the placeholder`,
  );
}
