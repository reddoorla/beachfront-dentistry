#!/usr/bin/env bash
set -u
PD="$HOME/.claude/skills/matching-a-page/page-diff.mjs"
REF="https://www.beachfrontdentistry.com"
CAND="http://localhost:5173"
run() { # uid path sections
  echo "########## $1 ##########"
  node "$PD" --ref "$REF$2" --cand "$CAND$2" \
    --viewports 1440,390 --threshold 0.10 \
    --sections "$3" --out "matching/out-detail6-$1" \
    > "matching/out-detail6-$1.log" 2>&1
  echo "$1 exit=$?"
}
run team "/team-members/dr-robert-quan" "Dentist,Ready for great dental health"
run svc  "/services/dental-exams" "Dental Exams,What to expect during a dental exam,Ready for great dental health"
run qa   "/questions/regular-dental-cleanings-support-your-whole-body-health" "Beyond the Smile,At Beachfront Dentistry,Ready for great dental health"
echo "ALL DONE"
