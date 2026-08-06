#!/usr/bin/env bash
set -u
PD="$HOME/.claude/skills/matching-a-page/page-diff.mjs"
REF="https://www.beachfrontdentistry.com"
CAND="http://localhost:5173"
run() { # tag path sections
  echo "########## $1 ##########"
  node "$PD" --ref "$REF$2" --cand "$CAND$2" \
    --viewports 1440,390 --threshold 0.10 \
    --sections "$3" --out "matching/out-d8-$1" \
    > "matching/out-d8-$1.log" 2>&1
  echo "$1 exit=$?"
}
run team "/team-members/dr-robert-quan" \
  "Dentist,Back to Team,Ready for great,Want to learn more"
run svc "/services/dental-exams" \
  "What to expect,Back to All Services,Ready for great,Want to learn more"
run qa "/questions/regular-dental-cleanings-support-your-whole-body-health" \
  "At Beachfront Dentistry,Have another question,Ready for great,Want to learn more"
echo "ALL DONE"
