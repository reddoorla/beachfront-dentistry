# beachfront-dentistry — working rules

This project is a pixel-match rebuild of https://www.beachfrontdentistry.com in
SvelteKit + Prismic. The `matching-a-page` skill governs the work. These rules
exist because the skill alone did not hold — each one below is a drift that
actually happened, with the mechanical check that now catches it.

## The four rules

### 1. Source prescribes, rects only verify

Every geometry fix must cite the rule it came from: a line in
`matching/spec/beachfront.css` (or the reference's HTML). "The probe says the
gap is 40px" is not a source. If you cannot name the line, you are guessing —
go read the stylesheet first.

**Check:** the commit body must name the file:line for each fix.
**Operator's challenge:** _"which line of beachfront.css says that?"_

Evidence this matters: the two fixes that landed first-try this project (the
7px services label, the `.team-list-item` ladder) both came from grepping the
stylesheet. The two that had to be reverted (home section margins, services
trailing grid margin) were both applied from a probed number.

### 2. Phase 1 before Phase 4

A page gets its section census + per-section spec in `matching/SPEC.md` BEFORE
its geometry is touched. No SPEC section, no geometry round. The census is the
coverage denominator; skipping it is why live's root-font ladder, the
`.content-width` ladder, and `.hero.group-photo`'s separate height ladder were
each discovered reactively, after multiple failed rounds.

**Check:** `matching/gate.sh` refuses to run a page with no `SPEC.md` section.
**Operator's challenge:** _"show me the SPEC section for that region."_

### 3. Three strikes, then stop

A failing region that has not improved across 3+ gate runs does not get a
fourth attempt. Present the attempts. Never widen the threshold, add a mask, or
reclassify it as a floor to make it go away.

**Check:** `node matching/strikes.mjs [page]` — exits 1 while any region is
stalled, and is the first thing a geometry round runs.
**Operator's challenge:** _"how many runs has that region been flat?"_

### 4. A gate closes an item, nothing else

No fix is "done" because the code changed. Paste the gate header — it is
self-describing, so a nonstandard threshold or an undisclosed mask is visible.
Threshold stays 0.10. No masks on the nav pages. Matrix is 1440/834/390 on
every page, never a subset.

**Operator's challenge:** _"paste the gate header."_

## Standing project facts

- **Live's root-font ladder is the systemic trap.** An inline `<style>` steps
  `html{font-size}` to 40px ≥993 / 32px 769–992 / 24px ≤768, while the Webflow
  class rules break at 991/767/479. Every rem value therefore has THREE sizes.
  Calibrate md at **834, never 768**; lg at **1200/1440, never 992**. Most
  defects on this project were a two-tier ladder keyed at 768, leaving the
  whole 768–991 band rendering the desktop value.
- **Prismic Migration API:** `PUT /documents/{id}` REPLACES a document, never
  merges, and `GET /documents` 403s at the gateway with the write token.
  Consequence: exactly ONE script may write a given document type. See
  `docs/migration.md`.
- Commit per logical round and push `feat/detail-templates-and-footer`. **No PR**
  unless asked.
- Seed scripts read `BEACHFRONT_DENTISTRY_WRITE_TOKEN` from
  `~/Documents/GitHub/reddoor-starter/.env`, pass it in headers only, never
  print it.

## Round protocol

1. `node matching/strikes.mjs <page>` — if it exits 1, the stalled regions are
   the agenda, and stalled ones get escalated rather than re-attempted.
2. Confirm the page has a `matching/SPEC.md` section; write it if not.
3. Fix, each change citing its source line.
4. `bash matching/gate.sh <tag> <page>` — paste the header.
5. Append to `matching/LEDGER.md` at the moment a deviation/floor/mask is
   decided, not reconstructed at the end.
6. `npm test && npx svelte-check` + prettier/eslint, then commit and push.
