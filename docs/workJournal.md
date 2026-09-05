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
