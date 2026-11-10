"""Add a very subtle rhythmic lift to only the first seven seconds of the existing mix.

Uses the original mix as input, never rewrites it, so this is reproducible. Voice and
existing sound remain intact; the new music layer fades out before 8 seconds.
"""
from pathlib import Path
import sys
import numpy as np
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'pendulum'/'audio'))
from dsp import SR, ns, read_wav, write_wav, rng, pan, place, integrated, true_peak
import instruments as I

p=Path(__file__).resolve().parent
base,sr=read_wav(str(p/'audio/mix.wav'))
assert sr==SR and base.shape[0]==2
pulse=np.zeros_like(base)
r=rng(4812)
# Match the original score's 0.52-second beat, with restrained low drum + soft brush.
for k in range(14):
    t=.12+k*.52
    fade=min(1,max(0,(7.4-t)/1.8))
    if k%2==0:
        sound=I.timpani(72,vel=.38,r=r,dur=.34)
        sound=sound/(np.max(np.abs(sound))+1e-12)*.017*fade  # ~-35 dBFS peak
        place(pulse,pan(sound,-.08),t)
    if k%2==1:
        sound=I.brush(vel=.35,r=r,dur=.14)
        sound=sound/(np.max(np.abs(sound))+1e-12)*.009*fade # ~-41 dBFS peak
        place(pulse,pan(sound,.12),t)
result=base+pulse
peak=true_peak(result)
# Avoid changing the voice level unless the new layer uses up existing headroom.
if peak > -1.1:
    result*=10**((-1.2-peak)/20)
    peak=true_peak(result)
write_wav(str(p/'audio/mix-hook.wav'),result,bits=16)
print(f'Hook layer peak: {20*np.log10(np.max(np.abs(pulse))):.2f} dBFS; mix {integrated(result):.2f} LUFS, {peak:.2f} dBTP')
