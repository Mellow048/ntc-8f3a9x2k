#!/usr/bin/env bash
# The sandbox cannot reach Azure Actions artifact storage. Publish only our
# isolated previews/final deliveries on the fixed session branch as a fallback.
set -euo pipefail
BRANCH=arena/044538ca-ntc-8f3a9x2k
git config user.name 'Curiosity render bot'
git config user.email '41898282+github-actions[bot]@users.noreply.github.com'
git add -f -- "$2"
if git diff --cached --quiet; then exit 0; fi
git commit -m "$1"
for attempt in 1 2 3 4 5; do
  git fetch origin "$BRANCH"
  git rebase "origin/$BRANCH"
  if git push origin "HEAD:$BRANCH"; then exit 0; fi
done
exit 1
