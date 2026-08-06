#!/usr/bin/env bash
# Round 10 — full-site confirmatory sweep after the shared-chrome round
# (Nav logo/hamburger ladder, Footer geometry + tablet columns, detail md tier,
# team headshot ladder). Every page at 1440,390. Results -> matching/out-final-*.
set -u
PD="$HOME/.claude/skills/matching-a-page/page-diff.mjs"
REF="https://www.beachfrontdentistry.com"
CAND="http://localhost:5173"
run() { # tag refpath candpath sections [extra…]
  local tag="$1" refpath="$2" candpath="$3" sections="$4"; shift 4
  echo "########## $tag ##########"
  node "$PD" --ref "$REF$refpath" --cand "$CAND$candpath" \
    --viewports 1440,390 --threshold 0.10 \
    --sections "$sections" --out "matching/out-final-$tag" "$@" \
    > "matching/out-final-$tag.log" 2>&1
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
# --- nav pages (regression check: Nav + Footer are shared chrome) ---
run home "/" "/dev/match/home" \
  "Finally have a dentist,MEET YOUR TEAM,Serving the South Bay,Your Path to Oral Health,Our dental team in Redondo,Ready for great dental health" \
  --neutralize-media
run yfv "/your-first-visit" "/dev/match/your-first-visit" \
  "We want you to feel comfortable,Office Tour,Dr. Robert Quan,To be a long term health partner,Serving the South Bay for over 40 years,Ready for great dental health" \
  --neutralize-media
run our-team "/our-team" "/dev/match/our-team" \
  "Our,Dr. Robert Quan,Ready for great dental health" --neutralize-media
run services "/services" "/dev/match/services" \
  "Cosmetic Dentistry,Ready for great dental health" --neutralize-media
run atd "/ask-the-doctor" "/dev/match/ask-the-doctor" \
  "Beyond the Smile,Ready for great dental health" --neutralize-media
run contact "/contact-us" "/contact-us" \
  "Book Appointment,Ready for great dental health" --neutralize-media
echo "ALL DONE"
