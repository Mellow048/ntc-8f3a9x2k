"""Original score + restrained hook rhythm + narration-locked demonstration FX.
Only writes shoots/spring-building/audio/mix-remaster.wav.
"""
from pathlib import Path
import sys
import numpy as np
from scipy import ndimage
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT))
from mix_series import make_music, DATA
from dsp import SR,ns,st,pan,place,rng,dbg,integrated,momentary_max,read_wav,write_wav,true_peak,fades
from mix import limiter
import instruments as I
import sfx_gen as S
p=Path(__file__).resolve().parent
voice,sr=read_wav(str(p/'voice/voice.wav'))
assert sr==SR
voice=st(voice[0]);n=voice.shape[1];duration=n/SR
assert n==DATA['spring-building']['frames']*(SR//30)
ref=integrated(voice)
music=make_music(n,duration,933)*dbg(3)
music*=dbg(ref-10-integrated(music))
control=np.zeros(n)
for w in DATA['spring-building']['words']:
    control[max(0,ns(w['start']-.06)):min(n,ns(w['end']+.12))]=1
control=ndimage.uniform_filter1d(control,size=ns(.12),mode='nearest')
music*=dbg(-3*control)[None,:]
r=rng(5030)
for k in range(14):
    t=.12+k*.52;fade=min(1,max(0,(7.4-t)/1.8))
    hit=I.timpani(72,vel=.38,r=r,dur=.34) if k%2==0 else I.brush(vel=.35,r=r,dur=.14)
    hit/=np.max(np.abs(hit))+1e-12
    place(music,pan(hit,(-.08 if k%2==0 else .12)),t,gain=(.017 if k%2==0 else .009)*fade)
fx=np.zeros_like(voice)
# Shaking appears only in finite demonstrations; effects follow those same words.
cues=[(45,'reveal'),(88,'steel'),(138,'quake'),(536,'quake'),(741,'reveal'),(960,'jelly'),(1030,'slide'),(1170,'steel'),(1260,'flex'),(1463,'slide'),(1588,'quake'),(1699,'flex')]
for frame,kind in cues:
    if kind=='quake': sound=S.push_thump(r)
    elif kind=='steel': sound=S.clink(r,1700,.22)
    elif kind=='jelly': sound=S.swing_squeak(r)
    elif kind=='flex': sound=S.creak(.6,r,100,145,S.CHAIN)
    else: sound=S.whoosh(.48,r,.12,240,1600,.7)
    sound=st(sound);level=momentary_max(sound)
    if np.isfinite(level):sound*=dbg(ref-16-level)
    place(fx,sound,frame/30)
y=voice+music+fx;gain=-15-integrated(y)
for _ in range(4):
    out,_=limiter(y*dbg(gain),ceil_db=-1.4)
    delta=-15-integrated(out)
    if abs(delta)<.03:break
    gain+=delta
out=fades(out,0,.03)
write_wav(str(p/'audio/mix-remaster.wav'),out,bits=16)
(p/'audio/remaster-cues.md').write_text('# Remaster sound cues\n\nApproved Arena voice unchanged; original synthesized score, speech ducking, restrained opening pulse (first 7.4 s), and -6 dB-convention effects.\n\n'+''.join(f'- frame {f}: {k}\n' for f,k in cues)+f'\n{integrated(out):.2f} LUFS; {true_peak(out):.2f} dBTP.\n')
print(f'{duration:.3f}s; {integrated(out):.2f} LUFS; {true_peak(out):.2f} dBTP')
