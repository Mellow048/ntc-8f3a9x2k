#!/usr/bin/env bash
# Contact sheets of review stills, a few tiles to a sheet so that each tile is big enough to judge.
#
#   scripts/sheets.sh <dir of stills> <prefix> [tiles per sheet = 12] [columns = 4] [tile width = 380]
#
# Writes out/<prefix>-1.jpg, out/<prefix>-2.jpg, ... (scripts/sheet.py makes each one). Use a new prefix for every round:
# a viewer can show the old picture under an old name. PYTHON names a Python with pillow (default python3).
set -euo pipefail
dir=$1; prefix=$2; per=${3:-12}; cols=${4:-4}; width=${5:-380}
py=${PYTHON:-python3}; tmp=$(mktemp -d); n=0; k=1
for f in $(ls "$dir" | sort); do
  mkdir -p "$tmp/$k"; cp "$dir/$f" "$tmp/$k/"; n=$((n + 1))
  if [ $((n % per)) = 0 ]; then k=$((k + 1)); fi
done
for d in $(ls "$tmp" | sort -n); do "$py" scripts/sheet.py "$tmp/$d" "out/$prefix-$d.jpg" --cols "$cols" --width "$width"; done
rm -rf "$tmp"
