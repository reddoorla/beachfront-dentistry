#!/usr/bin/env bash
# Confirmatory gate sweep on the current branch (feat/first-visit-sections).
# All 6 pages at 1440,390, --neutralize-media to isolate structure from the
# documented photo-pipeline / dev-CSP floors. Results -> matching/out-verify-*.
set -u
PD="$HOME/.claude/skills/matching-a-page/page-diff.mjs"
REF="https://www.beachfrontdentistry.com"
CAND="http://localhost:5173"
run() {
  local uid="$1" refpath="$2" candpath="$3" sections="$4"
  echo "########## $uid ##########"
  node "$PD" --ref "$REF$refpath" --cand "$CAND$candpath" \
    --viewports 1440,390 --threshold 0.10 --neutralize-media \
    --sections "$sections" --out "matching/out-verify-$uid" \
    > "matching/out-verify-$uid.log" 2>&1
  echo "$uid exit=$?"
}
run home              "/"                 "/dev/match/home"             "Finally have a dentist,MEET YOUR TEAM,Serving the South Bay,Your Path to Oral Health,Our dental team in Redondo,Ready for great dental health"
run your-first-visit  "/your-first-visit" "/dev/match/your-first-visit" "We want you to feel comfortable,Office Tour,Dr. Robert Quan,To be a long term health partner,Serving the South Bay for over 40 years,Ready for great dental health"
run our-team          "/our-team"         "/dev/match/our-team"         "Our,Dr. Robert Quan,Ready for great dental health"
run services          "/services"         "/dev/match/services"         "Cosmetic Dentistry,Ready for great dental health"
run ask-the-doctor    "/ask-the-doctor"   "/dev/match/ask-the-doctor"   "Beyond the Smile,Ready for great dental health"
run contact-us        "/contact-us"       "/contact-us"                 "Book Appointment,Ready for great dental health"
echo "ALL DONE"
