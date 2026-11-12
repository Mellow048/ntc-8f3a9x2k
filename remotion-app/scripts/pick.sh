#!/usr/bin/env bash
# Review stills of chosen film frames, rendered in ONE browser page (the sets are built and the shaders compiled once).
#
#   scripts/pick.sh <outDir> <frame,frame,...> [width]
#
# REVIEW names the film's still-picker composition, declared in src/videos/<film>/register.tsx (e.g. REVIEW=BinanceReview):
# output frame i shows film frame number i of the list. REMOTION_BROWSER can point at a local browser (scripts/local-chromium.sh).
set -euo pipefail
out=$1; list=$2; width=${3:-360}
n=$(awk -F, '{print NF}' <<<"$list")
rm -rf "$out"; mkdir -p "$out"
node scripts/stills.mjs "${REVIEW:?set REVIEW=<Film>Review, the still-picker composition of the film (src/videos/<film>/register.tsx)}" "$out" --every=1 --range=0-$((n - 1)) --width="$width" --log=10 --props="{\"frames\":[$list]}"
i=0
for f in ${list//,/ }; do
  src=$(printf '%s/f%04d.jpeg' "$out" "$i")
  [ -f "$src" ] && mv "$src" "$(printf '%s/p%04d.jpeg' "$out" "$f")"
  i=$((i + 1))
done
for p in "$out"/p*.jpeg; do mv "$p" "${p/\/p//f}"; done
echo "PICK-DONE $(ls "$out" | wc -l) stills in $out"
