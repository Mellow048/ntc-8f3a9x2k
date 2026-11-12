"""Is any word of the narration covered by the music or the effects? Word by word, for a news short's build_mix.py.

    python templates/scripts/word_margins.py shoots/<film>/audio/build_mix.py [how many of the lowest words to list]

For every narration word: the loudness of the voice minus the loudness of everything else (music and effects after
ducking, at mix gain), both K-weighted and both measured over the word's own span (30 ms off each end, never less than
120 ms). The overall level of the music says nothing about one short, quiet word with a beat on top of it, and a
measure over a wider window dilutes it: the Binance film's "it" read 7.9 LU under the bed this way after three renders
had passed every other meter.

Benchmarks, films the user approved after listening: the freezer film reads median 5.6 LU, 10th percentile 1.5, lowest
-3.4, 7 of 235 words under 0. A word far under that needs a look: lift it, clear the bed under it, or move the accent
that lands on it (WEAK_WORDS in shoots/binance-heist/audio/build_mix.py does the first two).

Works with any build_mix.py that has build_stems(), WORDS and TARGET_LUFS and imports dbg, integrated, kfilt and SR
from templates/audio/dsp.py. It builds the stems again (about ten seconds) and writes nothing.
"""
import importlib.util
import os
import sys

import numpy as np

path = os.path.abspath(sys.argv[1])
show = int(sys.argv[2]) if len(sys.argv) > 2 else 8
spec = importlib.util.spec_from_file_location("film_mix", path)
bm = importlib.util.module_from_spec(spec)
sys.argv = [path]
spec.loader.exec_module(bm)

voice, music, sfx = bm.build_stems()[:3]
gain = bm.dbg(bm.TARGET_LUFS - bm.integrated(voice + music + sfx))
kv, kb = bm.kfilt(voice * gain), bm.kfilt((music + sfx) * gain)


def lufs(x, a, b):
    return -0.691 + 10 * np.log10(max(1e-12, float((x[:, int(a * bm.SR): int(b * bm.SR)] ** 2).mean(axis=1).sum())))


rows = []
for i, w in enumerate(bm.WORDS):
    a, b = w["start"] + 0.03, w["end"] - 0.03
    if b - a < 0.12:
        a, b = (a + b) / 2 - 0.06, (a + b) / 2 + 0.06
    v, bed = lufs(kv, a, b), lufs(kb, a, b)
    rows.append((v - bed, i, w["word"], w["start"], v, bed))
m = np.array([r[0] for r in rows])
print(f"{len(rows)} words: voice over music and effects, median {np.median(m):.1f} LU, 10th percentile {np.percentile(m, 10):.1f} LU, "
      f"lowest {m.min():.1f} LU; {int((m < 0).sum())} under 0, {int((m < -3.5).sum())} under -3.5")
print("lowest:")
for d, i, word, t, v, bed in sorted(rows)[:show]:
    print(f"  {d:6.1f} LU  word {i:3d} {word!r:14} at {t:6.2f} s (frame {int(np.floor(t * 30 + 0.5)):4d})  voice {v:6.1f}  bed {bed:6.1f} LUFS")
