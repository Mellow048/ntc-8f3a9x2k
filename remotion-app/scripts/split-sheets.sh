#!/usr/bin/env bash
# sheets.sh <dir> <prefix> [per=8] [cols=4] [width=320] : split the stills of a folder into sheets of <per> tiles
set -euo pipefail
src=$1; prefix=$2; per=${3:-8}; cols=${4:-4}; width=${5:-320}
i=0; n=0; rm -rf "$src"/_part*; 
for f in $(ls "$src"/*.jpeg | sort); do
  d="$src/_part$(printf '%02d' $((i / per)))"; mkdir -p "$d"; cp "$f" "$d/"; i=$((i + 1))
done
for d in "$src"/_part*; do
  k=${d##*_part}; ~/.cache/ntc-venv/bin/python scripts/sheet.py "$d" "${prefix}-$k.jpg" --cols "$cols" --width "$width" >/dev/null; echo "${prefix}-$k.jpg: $(ls "$d" | tr '\n' ' ')"
done
rm -rf "$src"/_part*
