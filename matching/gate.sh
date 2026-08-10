#!/usr/bin/env bash
# Canonical matching gate for beachfront-dentistry.
#
#   bash matching/gate.sh <round-tag> [page ...]
#
# Runs page-diff for every page (or just the named ones) at the full breakpoint
# matrix and writes matching/out-<round-tag>-<page>/.
#
# MATRIX = 1440,834,390. Live's real breakpoints are 480/768/992, and the
# 768-991 band is where the worst structural defect of the 2026-08-04 round was
# hiding (the footer renders 2-column there on live and was 1-column here), so
# tablet is gated on every page, not sampled.
#
# ANCHORS: one per census section, derived from live in matching/census-live-1440.txt.
# Every list ends with "Want to learn more" so the FOOTER is its own region —
# without it the closing-CTA region swallows the whole footer plus its map
# embed, which pinned "Ready for great" at ~22% on all six nav pages and hid
# whatever else was in there.
#
# NO MASKS and threshold 0.10 everywhere: the numbers stay honest and the map
# floor stays visible as its own region. Use gate-chrome.sh for the
# media-neutralised secondary read on the video/photo-heavy pages.
#
# PREFLIGHT (see CLAUDE.md rule 2): a page with no section in matching/SPEC.md
# has not had Phase 1 done, and its geometry must not be touched. Skipping the
# spec is how live's root-font ladder, the .content-width ladder and
# .hero.group-photo's separate height ladder each got discovered reactively,
# after the region had already failed several rounds. This refuses the run
# instead of trusting anyone to remember.
set -u
PD="$HOME/.claude/skills/matching-a-page/page-diff.mjs"
# 2026-08-10: production (www.beachfrontdentistry.com) cut over to OUR Netlify
# build sometime after the 2026-08-07 qafix0807 run — the old REF now 301s to
# the rebuild, so gating against it compares the candidate with itself and
# every run goes silently green. The Webflow original is still published at
# its staging domain (same data-wf-site 64af3f93339537d6b661b556, same
# markup classes); that is the reference now. See LEDGER 2026-08-10.
REF="https://beachfront-dentistry.webflow.io"
CAND="http://localhost:5173"
SPEC="$(dirname "$0")/SPEC.md"
TAG="${1:?usage: gate.sh <round-tag> [page ...]}"
# The tag must not contain a hyphen. Output dirs are "out-<TAG>-<page>", and
# next.mjs recovers the page with /^out-[^-]+-(.+)$/ — it splits on the FIRST
# hyphen, so a tag like "r-forms-2026-08-07" yields the page key
# "forms-2026-08-07-yfv" and that run is silently never counted. It cannot split
# on the last hyphen instead, because page keys have hyphens of their own
# ("our-team", "ask-the-doctor"). Failing here is the cheap end of that: a
# mis-tagged round otherwise LOOKS green because next.mjs keeps reading an older
# report for the page you just changed. (Cost this once, 2026-08-07.)
case "$TAG" in
  *-*)
    echo "gate.sh: round tag must not contain a hyphen (got '$TAG')." >&2
    echo "         out-<TAG>-<page> is parsed on the first hyphen, so a" >&2
    echo "         hyphenated tag hides the run from next.mjs. Try '${TAG//-/}'." >&2
    exit 2
    ;;
esac
shift || true
WANT=("$@")

# Set SPEC_OPTIONAL=1 only for a read-only baseline sweep of pages you are not
# about to edit. It is recorded in the round tag so the exemption is visible.
SPEC_OPTIONAL="${SPEC_OPTIONAL:-0}"

has_spec() { # page
  # NB: the obvious `( |$|\b)` guard is rejected by ugrep as an empty
  # subexpression, and a preflight that errors out fails CLOSED — it refused all
  # 9 pages while SPEC.md was complete. Match the page key followed by any
  # non-key character (so `## team` matches but `## teamfoo` does not; `##
  # our-team` cannot match `team` because the key must follow the spaces).
  [ -f "$SPEC" ] && grep -qE "^##+ +$1([^A-Za-z0-9_-]|$)" "$SPEC"
}

run() { # tag refpath candpath sections
  local page="$1" refpath="$2" candpath="$3" sections="$4"
  if [ ${#WANT[@]} -gt 0 ]; then
    local hit=0
    for w in "${WANT[@]}"; do [ "$w" = "$page" ] && hit=1; done
    [ $hit -eq 1 ] || return 0
  fi
  if ! has_spec "$page"; then
    if [ "$SPEC_OPTIONAL" = "1" ]; then
      echo "########## $page ##########"
      echo "WARNING: no '## $page' section in matching/SPEC.md — Phase 1 not done."
      echo "         Running anyway because SPEC_OPTIONAL=1 (baseline read only)."
      echo "         Do NOT apply geometry fixes off this run."
    else
      echo "########## $page ##########"
      echo "REFUSED: no '## $page' section in matching/SPEC.md."
      echo "         Phase 1 (section census + per-section spec, read from"
      echo "         matching/spec/beachfront.css) comes before geometry."
      echo "         See CLAUDE.md rule 2. SPEC_OPTIONAL=1 for a baseline read."
      FAILED_PREFLIGHT=1
      return 0
    fi
  fi
  echo "########## $page ##########"
  node "$PD" --ref "$REF$refpath" --cand "$CAND$candpath" \
    --viewports 1440,834,390 --threshold 0.10 \
    --sections "$sections" --out "matching/out-$TAG-$page" \
    > "matching/out-$TAG-$page.log" 2>&1
  echo "$page exit=$?"
}

# ---- detail templates (densest instance of each) ----
run team "/team-members/dr-robert-quan" "/team-members/dr-robert-quan" \
  "Dentist,Back to Team,Ready for great,Want to learn more"
run svc "/services/dental-exams" "/services/dental-exams" \
  "What to expect,Back to All Services,Ready for great,Want to learn more"
run qa "/questions/regular-dental-cleanings-support-your-whole-body-health" \
  "/questions/regular-dental-cleanings-support-your-whole-body-health" \
  "At Beachfront Dentistry,Have another question,Ready for great,Want to learn more"

# ---- nav pages ----
run home "/" "/dev/match/home" \
  "Finally have a dentist,MEET YOUR TEAM,Serving the South Bay,Your Path to Oral Health,Our dental team in Redondo,Beyond the Smile,Ready for great dental health,Want to learn more"
run yfv "/your-first-visit" "/dev/match/your-first-visit" \
  "We want you to feel comfortable,Office Tour,Dr. Robert Quan,To be a long term health partner,Serving the South Bay for over 40 years,Ready for great dental health,Want to learn more"
run our-team "/our-team" "/dev/match/our-team" \
  "Our,Dr. Robert Quan,Ready for great dental health,Want to learn more"
run services "/services" "/dev/match/services" \
  "Cosmetic Dentistry,General Dentistry,Ready for great dental health,Want to learn more"
run atd "/ask-the-doctor" "/dev/match/ask-the-doctor" \
  "Beyond the Smile,Back to Top,Ready for great dental health,Want to learn more"
run contact "/contact-us" "/contact-us" \
  "Book Appointment,Ready for great dental health,Want to learn more"

if [ "${FAILED_PREFLIGHT:-0}" = "1" ]; then
  echo
  echo "GATE INCOMPLETE ($TAG) — one or more pages were refused for a missing"
  echo "SPEC.md section. Those pages have NOT been measured; do not report a"
  echo "score for them."
  exit 2
fi
echo "ALL DONE ($TAG)"
