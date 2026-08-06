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
cd "$(dirname "$0")/.."

SC="$HOME/.claude/skills/matching-a-page/style-census.mjs"
REF="https://www.beachfrontdentistry.com"
CAND="http://localhost:5173"
NODE="${NODE:-node}"
VIEWPORTS="${VIEWPORTS:-1440 834 390}"

declare -a WANT=("$@")

# page -> "refpath candpath"; same list gate.sh drives, deliberately.
pages() {
  cat <<'EOF'
home / /dev/match/home
yfv /your-first-visit /dev/match/your-first-visit
our-team /our-team /dev/match/our-team
services /services /dev/match/services
atd /ask-the-doctor /dev/match/ask-the-doctor
contact /contact-us /contact-us
team /team-members/dr-robert-quan /team-members/dr-robert-quan
svc /services/dental-exams /services/dental-exams
qa /questions/regular-dental-cleanings-support-your-whole-body-health /questions/regular-dental-cleanings-support-your-whole-body-health
EOF
}

TOTAL=0
AMB=0
DECL=0
printf '%-10s %8s %8s %8s\n' page 1440 834 390
while read -r page refpath candpath; do
  [ -z "$page" ] && continue
  if [ ${#WANT[@]} -gt 0 ]; then
    hit=0
    for w in "${WANT[@]}"; do [ "$w" = "$page" ] && hit=1; done
    [ $hit -eq 1 ] || continue
  fi
  line=$(printf '%-10s' "$page")
  for vw in $VIEWPORTS; do
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
