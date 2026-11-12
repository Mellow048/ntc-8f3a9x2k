"""Is an encoded soundtrack still its WAV? Exit 1 if the encode carries a click the WAV does not have.

    python templates/scripts/aac_check.py <mix.wav> <encoded.m4a or .mp4>

ffmpeg's AAC encoder was once caught writing five full-scale samples into a passage that sat at -17 dBFS: a click in
the published film that no meter on the WAV could have shown. Two tests, both against the WAV itself:
  - the peak of the decoded sound may be at most 1 dB above the WAV's (lossy encoding moves peaks by a few tenths);
  - no decoded sample louder than -14 dBFS may be more than half again as large as anything the WAV has within 2 ms of it.
Needs ffmpeg on the path and numpy.
"""
import subprocess
import sys

import numpy as np

SR = 48000


def pcm(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-map", "0:a:0", "-f", "f32le", "-ac", "2", "-ar", str(SR), "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2).T.astype(np.float64)


src, enc = pcm(sys.argv[1]), pcm(sys.argv[2])
n = min(src.shape[1], enc.shape[1])
# a decoder may hand the sound back a few samples late: line the two up on two seconds from the middle
mid, reach = n // 2, 2048
a, b = src[0, mid: mid + 2 * SR], enc[0, mid - reach: mid + 2 * SR + reach]
lag = int(np.argmax([np.dot(a, b[k: k + len(a)]) for k in range(0, 2 * reach + 1, 1)])) - reach if len(b) >= len(a) + 2 * reach else 0
if lag > 0:
    enc = enc[:, lag:]
elif lag < 0:
    src = src[:, -lag:]
n = min(src.shape[1], enc.shape[1])
src, enc = src[:, :n], enc[:, :n]
db = lambda x: 20 * np.log10(max(float(x), 1e-9))
peak_src, peak_enc = np.abs(src).max(), np.abs(enc).max()
# the largest sample of the WAV within about 2 ms either side of each sample: block maxima over 96 samples, three blocks wide
B = 96
k = n // B
blocks = np.abs(src[:, : k * B]).reshape(2, k, B).max(2)
wide = np.maximum(blocks, np.maximum(np.pad(blocks, ((0, 0), (1, 0)))[:, :-1], np.pad(blocks, ((0, 0), (0, 1)))[:, 1:]))
near = np.repeat(wide, B, axis=1)
e = np.abs(enc[:, : k * B])
clicks = np.flatnonzero(((e > 1.5 * near + 0.05) & (e > 0.2)).any(0))
times = sorted({round(float(i) / SR, 2) for i in clicks})
print(f"encode check: peak {db(peak_enc):.2f} dBFS against the WAV's {db(peak_src):.2f} dBFS; decoded {lag} samples late; "
      f"{len(clicks)} samples stand clear of the WAV" + (f", at {times[:12]} s" if times else ""))
sys.exit(1 if (db(peak_enc) > db(peak_src) + 1.0 or len(clicks)) else 0)
