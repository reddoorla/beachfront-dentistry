# Beachfront Dentistry — Work Journal

Running log of build work: what was done, why, and where it landed.
Chronological — newest entry at the bottom. [CLAUDE.md](../CLAUDE.md) holds the
rules; this is the history of working under them.

The convention is in [CLAUDE.md](../CLAUDE.md) under "The work journal". In
short: every working session appends a dated entry, prose over bullets, why
over what, and history is never edited to be right — a later entry corrects an
earlier one and says so.

---

## 2026-09-05 — Journal opened, and 203 commits of history summarised rather than reconstructed (`chore/work-journal`)

The journal starts today, so this first entry is a **backfill**: a deliberately
coarse summary of what came before, written from the commit log rather than
from memory. Detail below this line is trustworthy; detail above it is not, and
nothing here should be cited as though someone wrote it down at the time. The
commit log, `matching/LEDGER.md` and `matching/SPEC.md` remain the record for
anything before 2026-09-05.

**What this repo is.** A pixel-match rebuild of the existing Webflow site at
`beachfrontdentistry.com` — a dental practice — in SvelteKit 2 / Svelte 5 /
Tailwind v4 / Prismic on Netlify, forked from the reddoor-starter and wired to
Prismic repo `48bb12d1`. The README is still the starter's and describes the
template, not this site; `CLAUDE.md` is the real orientation. "Pixel-match" is
meant literally: `matching/` holds a scored harness — a per-page census and
spec, `gate.sh` diffing our render against live's at 1440/834/390,
`strikes.mjs` for regions that have stopped improving, `next.mjs` to name the
next action.

**The eras.** 203 commits from `Initial commit` on 2026-07-28 to here, and the
distribution is lopsided: **10 in July, 187 in August, 6 in September.** July is
four days of bootstrap — chrome, slices, detail routes, then seeding the five
page assemblies. August is everything else, in two interleaved tracks: the
matching campaign roughly the 3rd to the 13th, whose commit subjects carry their
own scores (`rebuild the exam section from live's composition — 16/24 ->
20/24`), and the review work beside it — Tim's MarkUp pins in lettered rounds,
an a11y pass that found real AA failures on the cyan wash, SEO, LCP, and
repeated repairs to the Prismic round-trip. Mid-August turns to infrastructure
(CI delivering Prismic model changes, GA4, Search Console). September is six
commits: srcset caps, one more MarkUp round, the team slider.

**The five rules in `CLAUDE.md` were written mid-campaign, not up front** — four
on 2026-08-05 (`f8774f0`), the fifth (`cf4ae14`) the same day. Each is a drift
that had already happened: geometry applied from a probed number instead of a
stylesheet line, a page touched before its spec existed, a stalled region
attempted a fourth time. Worth knowing before anyone decides a rule looks
excessive.

**Matching is PAUSED, deliberately, since 2026-09-01.** `matching/PAUSED`
records the state: 109/153 regions passing, 24 open failures, 18 declared
floors, 1 operator-accepted failure, worst page `our-team`. Every open region
was long-stalled — out of strikes, needing a new model or a decision rather than
another attempt. The switch is an exit code because rule 5 ("a commit is a
checkpoint, not a stopping point") would otherwise overrule a prose instruction
to stop. Resuming is the operator's call.

**State as of this entry.** `chore/work-journal` off `origin/main` at `3cee232`,
tree clean, nothing in flight. The `fix/team-carousel` branch left in the
checkout is PR #42, squash-merged 2026-09-04 — its four commits are
content-identical to main and only look unmerged. This branch was cut from
`origin/main` for that reason: based on the checkout, its PR would have shown
ten already-merged files and 1,243 lines it did not touch.

**What changed today.** `CLAUDE.md` gained "The work journal", and this file
exists. The gap is visible in this entry: six weeks of a scored, phase-gated
campaign left its numbers in `LEDGER.md` and its conclusions in `CLAUDE.md`, but
had nowhere chronological to say why a round went the way it did — so that
reasoning survives only where someone happened to write a good commit subject.

## 2026-09-09 — The page table becomes data, and the gate learns to refuse (`chore/matching-harness-consolidation`)

The harness had many copies of one table, and they had drifted. On 2026-08-10
only `gate.sh` was repointed at the Webflow staging host; every other script
kept `www.beachfrontdentistry.com`, which by then served our own Netlify build.
So the style census, the hover sweep, the states gate, the walkthrough and the
anchor-parity probe had spent four weeks comparing the candidate with itself and
reporting clean. `probe-anchor-parity.mjs:84` was also still cutting `contact`
on "Book Appointment" — its comment said "must mirror gate.sh exactly", and that
promise is what a comment is worth.

**What is here now.** `matching/harness.json` holds the nine pages plus the
hosts, matrix, thresholds and fingerprints; `matching/harness.mjs` is the only
reader, exporting `REF`/`CAND`/`MATRIX`/`THRESHOLD`/`PAGES`/`byKey`/`TOTALS` and
a CLI (`--env`, `--table`, `--check-ref`) so the two bash gates hold no second
copy. TOTALS are derived — `(anchors + 1) × 3` — and the derived map equals the
old hand-typed one exactly, which is how we know the derivation is the right
one. `--table` prints the nine deleted `run` lines byte-identically; that
byte-identity was the invariant every task on this branch re-proved, each time
with a one-byte negative control to show the check could fail.

**The belief this corrects.** The 08-10 note in `gate.sh` said the Webflow
original "is still published at its staging domain; that is the reference now."
It is not. Measured today by the gate's own preflight:
`GET https://beachfront-dentistry.webflow.io/ → HTTP 404`. There is no live
reference in either direction. The only surviving capture is
`matching/pages/*.live.html` + `matching/spec/`, both git-ignored, both on one
machine. That is why the preflight is fail-closed and requires a positive
fingerprint rather than a 200: a 200 is exactly what both dead hosts produce for
the wrong reasons.

**Numbers, measured.** 247 tracked files under `matching/` before, 234 after: 16
`sweep*.sh` deleted (checked before deleting, not assumed — all 16 set
`REF="https://www.beachfrontdentistry.com"`, all 16 pass `--viewports 1440,390`
against a 1440/834/390 matrix, and all 16 are round-scoped copies of the same
`page-diff` invocation `gate.sh` now drives), three added. 215 of the 234 are
now `.prettierignore`d so the recipe can byte-compare them on upgrade; the 16
`.md` files and `states/*.mjs` were deliberately left in scope, because the
fleet has already been bitten once by `prettier --check .` silently covering
nothing, and exempting the directory wholesale would repeat it on the records.

**A census that was wrong twice before it was measured.** `harness.mjs` claimed
"the nine-row page table: 5 copies", naming `gate.sh`. That was true when
written and false one commit later, when the table left `gate.sh` — and it had
never named `states/index.mjs` or `probe-chrome-count.mjs`, both nine-row
carriers at the time. A second recount during this work also got it wrong, by
grepping key tokens anywhere in a file instead of counting table rows, which
inflates `probe-anchors.mjs` (5 rows) and `hover-sweep.mjs` (6) into nine-row
tables and still misses `probe-chrome-count.mjs`, whose array-of-pairs shape no
`key:` pattern matches. The measured figure is **6 before, 1 after**. The
comment now carries its own method so it can be re-run rather than recalled.
A census is a claim about code; it has to be measured against the tree.

**Report schema.** Every report now carries `meta.schemaVersion`, `page-diff
--version` prints it, and `gate.sh` compares before spending a run. Honest
accounting: this makes `next.mjs` exit 2 on this repo's entire corpus, because
every historical report predates the field — 377 run directories, every one
holding a `report.json`, zero carrying `schemaVersion`. That is correct and it
is also inert: matching has been PAUSED since 09-01 and `next.mjs` exits at the
pause switch first. `strikes.mjs` still reads the legacy history, because it
needs only `mismatchFraction` and `pass`, and all 6379 regions across those 377
reports carry both.

**One page vocabulary.** `strikes.mjs` derived a page name from the report's ref
URL, which disagreed with the gate key on exactly six of the nine pages
(`team`, `svc`, `qa`, `yfv`, `atd`, `contact`). It now asks the table. The
practical effect is that `strikes.mjs yfv` matches 63 runs where it used to
match 58 — the five it was missing are hand-named probe directories whose ref is
`/your-first-visit`.

**`/dev/match` shipped with every build.** The route renders seed assemblies,
reads `cookies` and queries Prismic, and a production build served it 200. Worse
than the pages: its own not-found branch returned
`no matching assembly for "…" (have: home, your-first-visit, our-team,
services, ask-the-doctor)` to anonymous traffic, disclosing the page inventory.
`if (!dev) error(404)` is now the first statement of `load`. Verified on a real
build with `/dev/a11y-fixtures` as the 200 control, and separately shown to
still serve 200 under `vite dev` — a guard proven only to refuse is not proven.

**Two traps worth writing down.** The plan's test bound `pnpm preview` to port
4173; that port was held by an orphaned `vite preview` from an unrelated repo
that had been running since 09-06, so the literal command would have measured a
three-day-old build from another project. And `pnpm vite:dev -- --port N`
silently binds 5173 — pnpm inserts a `--` that vite treats as end-of-options, so
`--port` _and the `--strictPort` that would have made the failure loud_ are both
discarded. Both are the same shape: a measurement pointed at something other
than the thing under test.

**Found, not fixed, filed.** #47 (four sites resolve their own directory with
`URL#pathname`, which `harness.mjs` documents as wrong — the `strikes.mjs` one
resolves `PAUSED`, so the pause switch fails _open_ under a percent-encoding
path), #48 (`strikes.mjs`'s "known pages" list offers a retired vocabulary and
15 probe-dir names as if they were pages), #49 (`SPEC.md` is stale against its
own generator — the next `build-spec.mjs` run silently deletes 37 lines that
were hand-written into the generated file and never into its source section),
#50 (the shared heading predicate interpolates the page key into a pattern
unescaped), #51 (12 probes still point `REF` at a host serving our own build),
#52 (the `vite:dev` port trap above), #53 (five `/dev` fixture pages still ship
as public static HTML; the blanket fix would destroy the 200 control that makes
the guard test meaningful).

## 2026-09-09 — The template would have shipped the client's name to every future site (`fix/harness-template-generic`)

A follow-on to the entry above, found while starting the recipe that consumes
this work. The `match-harness` generator copies seven files out of `matching/`
**verbatim** into a template installed on every future site, and its acceptance
check is `grep -ci beachfront` over the generated template — expected `0`.

`harness.mjs` returned `4`.

The consolidation had been careful about exactly this: `gate.sh`, `census.sh`
and `build-spec.mjs` were emptied of site prose, and the acceptance block in #54
greps those three and gets `0`. But the copied set is seven files, not three,
and `harness.mjs` — the file the whole consolidation was built around — was
never in the grep. It carried the client's hostnames in two comments: the census
block, and the `checkRef` doc explaining why the preflight is fail-closed.

**The check was right and its scope was wrong**, which is a harder failure to
see than a check that is simply absent: #54's acceptance printed a truthful `0`
about three files while a fourth, more important one, was never asked.

The `checkRef` prose was worth keeping, so it moved to a dated `LEDGER.md`
record rather than being deleted — it is the argument for the whole fail-closed
design (both candidate hosts return a status a naive check reads as success, for
opposite reasons). Moving it also caught a stale number inside it: it claimed
"33 of this site's scripts still point REF at the former", which was true when
written and went false the moment #54 deleted 16 sweeps and converted four
probes. Measured on merged main: **12**. A count in a doc comment has no way to
know when it stopped being true; a dated record does not pretend to.

## 2026-09-09 — The corrections lived in the copy, not the original (`fix/harness-comments-match-recipe`)

Adversarial review of the recipe PR caught this, and it is the sharpest version
of tonight's recurring defect. Three false comments were found in
`reddoor-maintenance`'s generated `template.ts` and corrected there — the claim
that the `match-harness` recipe "does not exist yet" (in `harness.mjs` and
`gate.sh`), and `gate.sh`'s pre-consolidation census of "33 of its 230 top-level
matching scripts".

But `template.ts` is **generated** from this repo. Its own header says `Do NOT
hand-edit — regenerate`. So the corrections survived exactly until someone ran
the generator, at which point all three reverted to the false text — and the
file's instructions actively tell you to run it.

Reproduced before fixing: regenerating produced `8 insertions, 15 deletions`,
every line of it a correction being undone.

**Why this shape is worth naming.** A fix applied to a derived artifact reads as
done, passes review, and is undone by the documented workflow. It is the same
class as reading a cached response as state, or a glob as a population — the
thing you edited was not the thing that decides. The distinguishing symptom is
that the artifact's own header tells you how to destroy your work.

The fix is here rather than there: `matching/harness.mjs` and `matching/gate.sh`
now carry the corrected text at source, so regeneration is a no-op instead of a
reversion. `census.sh`, `next.mjs`, `strikes.mjs`, `build-spec.mjs` and
`census-count.mjs` were already byte-identical and untouched.

`--table` is still byte-identical to the frozen copy (`cmp` exit 0), which is
the check that these were comment-only edits and not a behaviour change. The
hyphen guard still refuses at exit 2, the reference preflight still refuses at
exit 2, and `next.mjs` still exits 0 at the pause switch.

## 2026-09-09 — census.sh granted a green from a census that never ran (`fix/census-sh-vacuous-clean`)

Phase 3's gate reported CLEAN without measuring anything. Point
`MATCHING_SKILL_DIR` at a directory with no `style-census.mjs` and
`bash matching/census.sh` prints

```
page          1440     834     390
home             0       0       0

Phase 3 CLEAN — 0 undeclared type mismatches (0 declared, 0 ambiguous).
```

and exits 0. Every run died on module resolution; `census-count.mjs` read each
crash log as `0 0 0`, because it counts `^  y=` rows and a stack trace has none
(`census-count.mjs:35-56`); and census.sh summed three zeroes into a green. No
rows was reported as no mismatches. Nine pages × three viewports is 27 such
runs, and the operator sees one word.

**The belief this corrects.** The finding arrived naming the missing-file case,
and the missing file is not the likely one — nobody deletes the skill. The
likely one is the candidate host being down, and I measured that it is
byte-identical: with `style-census.mjs` present and every run throwing
`page.goto: net::ERR_CONNECTION_REFUSED`, census.sh prints the same table and
the same CLEAN. So the obvious repair — check the exit status — could never
have worked. `style-census.mjs:187` exits 1 when it finds mismatches, and node's
uncaught-exception exit code is also 1 (measured: `node -e 'throw new
Error("boom")'` → 1). The one number available to the caller means "there is a
finding" and "I died before I looked" with equal weight, and a gate cannot
divide by it.

**Enumerating the class rather than fixing the instance** turned one reported
case into seven, each of which printed CLEAN and exited 0 on `main`:
`style-census.mjs` absent; present but crashing; present but silent (writes an
empty log and exits 0); both pages rendering zero text runs, which agree
perfectly and mean nothing; a typo'd page argument (`bash matching/census.sh
hom`); an empty `pages` table in `harness.json`; and `census-count.mjs` itself
failing to import `census-deviations.mjs`, where node's own stack trace went to
stderr, `read -r n a d` bound nothing, and bash's arithmetic read the empty `$n`
as zero. That last one's only visible symptom on `main` was a blank cell in the
table — whitespace, in a column of zeroes.

**What was tried and abandoned.** The natural shape was `gate.sh:37-42`, which
preflights `node "$PD" --version` and compares field 4 with the harness's
`REPORT_SCHEMA` before spending a run. It does not transfer: `style-census.mjs`
has no `--version` at all (`page-diff.mjs:191-195` defines one; nothing in
style-census writes one), and adding one would move this file's correctness into
the `matching-a-page` skill's release cycle, in a different repository. The
substitute is style-census's own usage banner (`style-census.mjs:151-157`),
demanded by running it with no arguments. That is better than it first looks:
`import { chromium } from "playwright"` is at `style-census.mjs:19` and runs
before the banner, so a skill checkout with no browser dependency installed
fails once, here, cheaply — instead of writing 27 crash logs that every reader
downstream counts as zero.

The three guards are GUARD 1 (the tool exists and answers its banner), GUARD 2
(each run leaves the header and the counts line that `style-census.mjs:166-169`
writes together, only after walking both pages, with `ref runs`/`cand runs` both
non-zero) and GUARD 3 (at least one page was censused — the empty table and the
unmatched page name distinguished, the latter being the refusal
`strikes.mjs:147-156` already had). GUARD 2b rejects a `census-count.mjs` run
that did not return three integers. Everything refused exits 2 and names which
guard refused. The loop still reads `done < <(pages)` and not a pipe: a pipe
runs it in a subshell, every counter would still read 0 at the bottom, and the
fix would reproduce the bug it fixes — `gate.sh:123-125` records the same trap
for `FAILED_PREFLIGHT`.

**Honest accounting: the guards were proved to GRANT, not only to refuse.** A
refusal-only proof is worthless here, because refusing everything also refuses
every crash. Against a stub that produces a real completed census, census.sh
still reports CLEAN and exits 0 and now says what the green is made of —
`(3 censused run(s) over 1 page(s), each one counted.)` — and against the same
stub emitting one 11px/cyan mismatch row it still exits 1 with
`3 type mismatch(es) remain`. Mutating the per-run evidence check to `if false`
returns the crash case to `Phase 3 CLEAN` exit 0; mutating `done < <(pages)`
into a pipe reddens the GRANT case, which is the whole reason that case exists.

`matching/*.sh` and `matching/*.mjs` are in `.prettierignore` and `matching/` is
in `eslint.config.js:52`'s ignores, so neither tool touches either file — the
bytes have to survive verbatim into the `match-harness` recipe's `template.ts`,
which is regenerated from this checkout rather than hand-edited.

**Found here, not fixed here.** census.sh honours no `matching/PAUSED` switch.
`next.mjs:25-30` and `strikes.mjs:36-42` both exit 0 on it as their first act;
census.sh reads it never. This repo has been PAUSED since 2026-09-01, so
`bash matching/census.sh` today would spend 27 browser-pair runs against a live
reference during a declared pause. It is a real asymmetry in the same
three-gate family, it is not in this change, and it is tracked as an issue
against reddoor-maintenance — census.sh is recipe-owned, so any fix has to go
through the same source-then-regenerate path this one did.
