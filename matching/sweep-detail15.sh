#!/usr/bin/env bash
# Round 10 — full-site confirmatory sweep after the shared-chrome round
# (Nav logo/hamburger ladder, Footer geometry + tablet columns, detail md tier,
# team headshot ladder). Every page at 1440,390. Results -> matching/out-r15-*.
set -u
PD="$HOME/.claude/skills/matching-a-page/page-diff.mjs"
REF="https://www.beachfrontdentistry.com"
CAND="http://localhost:5173"
run() { # tag refpath candpath sections [extra…]
  local tag="$1" refpath="$2" candpath="$3" sections="$4"; shift 4
  echo "########## $tag ##########"
  node "$PD" --ref "$REF$refpath" --cand "$CAND$candpath" \
    --viewports 1440,390 --threshold 0.10 \
    --sections "$sections" --out "matching/out-r15-$tag" "$@" \
    > "matching/out-r15-$tag.log" 2>&1
  echo "$tag exit=$?"
}
# --- detail templates (the round's primary target) ---
run team "/team-members/dr-robert-quan" "/team-members/dr-robert-quan" \
  "Dentist,Back to Team,Ready for great,Want to learn more"
run svc "/services/dental-exams" "/services/dental-exams" \
  "What to expect,Back to All Services,Ready for great,Want to learn more"
run qa "/questions/regular-dental-cleanings-support-your-whole-body-health" \
  "/questions/regular-dental-cleanings-support-your-whole-body-health" \
  "At Beachfront Dentistry,Have another question,Ready for great,Want to learn more"
echo "ALL DONE"
