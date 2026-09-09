#!/usr/bin/env bash
# Phase 3 style gate — the mechanical net for the type spec.
#
#   bash matching/census.sh            # all 9 pages, all 3 viewports
#   bash matching/census.sh home yfv   # just these
#
# style-census diffs the computed type tuple (family, weight, size,
# line-height, letter-spacing, transform, colour) of every text snippet present
# on BOTH pages. It is the only gate that catches the 11px footer line and the
# cyan-vs-teal link that page-diff is structurally blind to — a region can be
# pixel-clean at 0.10 and still be wearing the wrong colour on small text.
#
# Prints a per-page/per-viewport mismatch count and leaves the full runs in
# matching/census-<page>-<vw>.log. Exits 1 while any count is non-zero.
set -uo pipefail
# Resolved BEFORE the cd. $0 is the path as TYPED, so a relatively invoked
# census.sh that resolved the harness afterwards would look for it under
# whatever root the cd landed on.
HARNESS="$(cd "$(dirname "$0")" && pwd)/harness.mjs"
cd "$(dirname "$0")/.."

# Everything configurable lives in matching/harness.json; harness.mjs is the one
# reader. --env supplies REF, CAND, SC and VIEWPORTS_SP — this gate held its own
# copy of all four, and its REF went stale when production cut over to our own
# build (LEDGER "REFERENCE MOVED", verified 2026-08-10) while gate.sh's was
# repointed the same day.
eval "$(node "$HARNESS" --env)"
NODE="${NODE:-node}"

# The matrix is DATA, read as VIEWPORTS_SP, the way gate.sh reads MATRIX. The
# old VIEWPORTS override is retired rather than silently ignored: a census run
# over a matrix harness.json does not name is a column set the pixel gate never
# measured, and it would look exactly like a clean one.
if [ -n "${VIEWPORTS:-}" ]; then
  echo "census.sh: the VIEWPORTS override is retired — the matrix is data now." >&2
  echo "           Edit \"matrix\" in matching/harness.json, then unset it." >&2
  exit 2
fi

declare -a WANT=("$@")

# page -> "refpath candpath": the same table gate.sh drives, from the same file.
# cut drops the anchors column, which the style census has no argument for
# (style-census.mjs: --ref <url> --cand <url> [--vw 1440]).
pages() { node "$HARNESS" --table | cut -f1-3; }

TOTAL=0
AMB=0
DECL=0
# One column per viewport, from the matrix. Flush with the data rows below, at
# last: the old header hardcoded four fixed fields separated by a literal space,
# which the rows do not have, so its labels sat 1/2/3 columns right of them.
printf '%-10s' page
for vw in $VIEWPORTS_SP; do printf '%8s' "$vw"; done
printf '\n'
while read -r page refpath candpath; do
  [ -z "$page" ] && continue
  if [ ${#WANT[@]} -gt 0 ]; then
    hit=0
    for w in "${WANT[@]}"; do [ "$w" = "$page" ] && hit=1; done
    [ $hit -eq 1 ] || continue
  fi
  line=$(printf '%-10s' "$page")
  for vw in $VIEWPORTS_SP; do
    log="matching/census-$page-$vw.log"
    "$NODE" "$SC" --ref "$REF$refpath" --cand "$CAND$candpath" --vw "$vw" >"$log" 2>&1
    # census-count splits the log three ways: REAL mismatches, AMBIGUOUS
    # same-text collisions (style-census's own split), and DECLARED rows the
    # operator has already ruled on (matching/census-deviations.mjs, the same
    # contract as floors.mjs). Only the first is outstanding work — without the
    # third, this gate can never reach zero and its number means nothing.
    read -r n a d <<<"$("$NODE" matching/census-count.mjs "$log")"
    AMB=$((AMB + a))
    DECL=$((DECL + d))
    TOTAL=$((TOTAL + n))
    line="$line$(printf '%8s' "$n")"
  done
  echo "$line"
done < <(pages)

echo
if [ "$TOTAL" -eq 0 ]; then
  echo "Phase 3 CLEAN — 0 undeclared type mismatches ($DECL declared, $AMB ambiguous)."
  [ "$AMB" -gt 0 ] && echo "($AMB ambiguous same-text rows remain: each needs ADJUDICATING," &&
    echo " not fixing — our element matches, another sharing its text does not.)"
  exit 0
fi
echo "$TOTAL type mismatch(es) remain (+ $AMB ambiguous, $DECL declared)."
echo "Full runs: matching/census-<page>-<vw>.log"
echo "A mismatch is a defect or a ledgered deviation. An ambiguous row is neither"
echo "until you look: the census keys on TEXT, so two different elements sharing a"
echo "string land under one key and only one of them may be wrong."
exit 1
