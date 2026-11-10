"""Beer-only original arranged score. Instrument/DSP primitives from the studied
Taipei short, pinned f2d9d2f; no reference project is modified. All stems are
regenerated in ignored out/remaster/audio. Requires numpy/scipy, no downloads.
"""
from pathlib import Path
import json,sys
import numpy as np
from scipy import signal
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'beer-remaster/sound'))
import instruments as I
from dsp import SR,ns,pan,place,rng,read_wav,write_wav,integrated,dbg,hp,lp,fades
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'shoots/curiosity-survivor/out/remaster/audio';OUT.mkdir(parents=True,exist_ok=True)
data=json.loads((ROOT/'remotion-app/src/curiosity/survivor.json').read_text())
D=data['frames']/30;N=ns(D);R=rng(19450806)
v,sr=read_wav(str(ROOT/'shoots/curiosity-survivor/voice/voice.wav'))
if sr!=SR:v=signal.resample_poly(v,SR,sr,axis=-1)
if v.ndim==1:v=np.stack([v,v])
if v.shape[0]==1:v=np.repeat(v,2,axis=0)
v=np.pad(v,((0,0),(0,max(0,N-v.shape[-1]))))[:,:N]
m=np.zeros((2,N));fx=np.zeros_like(m)
def add(buf,x,t,g=1,p=0):place(buf,pan(x,p) if x.ndim==1 else x,t,g)
def note(inst,midi,t,d=.22,g=.3,p=0):
 f=I.m2f(midi)
 if inst=='pluck':x=I.pluck(f,g,R,dur=d+.22)
 elif inst=='glock':x=I.glock(f,g,R,dur=d+.4)
 elif inst=='vibes':x=I.vibes(f,g,R,dur=d+.5)
 else:x=I.brass(f,d,g,R,kind='tuba' if midi<50 else 'horn')
 add(m,x,t,p=p)
# 132 BPM: a real bass/chord/melody/percussion arrangement, not single quiet sine plucks.
Q=60/112
sections=[('hook',0,4,-9),('journey',4,9.5,-9.5),('aftermath',9.5,14.1,-13),('rail',14.1,17.55,-10),('second city',17.55,24.1,-12),('collective survival',24.1,31.2,-11),('testimony',31.2,37.64,-10),('remembrance',37.64,D,-13)]
for name,a,b,target in sections:
 if name in ('aftermath','second city','remembrance'):
  for k,t in enumerate(np.arange(a,b,1.1)):
   note('vibes',[62,65,69,64][k%4],t,.65,.22,-.25)
   note('pluck',[38,45][k%2],t,.55,.25,.18)
  continue
 for k,t in enumerate(np.arange(a,b-.1,Q)):
  chord=[[50,53,57],[46,50,53],[48,52,55],[45,49,52]][(k//4)%4]
  root=[38,34,36,33][(k//4)%4]
  note('brass' if name in ('journey','rail') else 'pluck',root,t,.19,.45,-.16)
  for j,n in enumerate(chord):note('pluck',n+12,t+Q*.5,.12,.24,.22)
  add(m,I.brush(.18,R) if name=='human cost' else I.snare(.19 if k%2 else .11,R),t+Q*.5,p=-.22)
  # Original short D-minor motif; rhythmic gaps leave room for the voice.
  if k%4 in (0,1,3):
   melodic=[74,77,76,69,72,74,69,65][k%8]
   note('glock' if name in ('hook','testimony') else 'pluck',melodic,t+.04,.18,.24,.25)
# Restrained train rhythm and transitions; no spectacular explosion effects.
for t in np.arange(2.05,3.8,.23):
 add(fx,I.brush(.18,R,dur=.16),t,.25,p=float(R.uniform(-.2,.2)))
for t in np.arange(14.1,15.6,.24):add(fx,I.brush(.2,R,dur=.18),t,.22)
for t in [9.94,20.65]:add(fx,I.timpani(48,.3,R,dur=1.1),t,.25)
# Small stereo room, no long wash over the narrator.
for delay,g in [(.047,.11),(.083,.07)]:
 k=ns(delay);m[:,k:]+=m[::-1,:-k].copy()*g
# Gentle speech duck, smoothly interpolated (not sample-edge gain jumps).
control_t=np.arange(0,D+.02,.01);duck=np.ones(len(control_t))
for w in data['words']:
 duck[(control_t>=w['start']-.045)&(control_t<=w['end']+.1)]=dbg(-2)
duck=np.convolve(np.pad(duck,(6,6),mode='edge'),np.ones(13)/13,mode='valid')
m*=np.interp(np.arange(N)/SR,control_t,duck)
# Match actual perceived music loudness to voice per section AFTER ducking.
report=['# Yamaguchi — restrained motion edition — audio mix','Original composition; Taipei DSP/instrument synthesis reused, not its score.','Restrained minor-key arrangement; no celebratory resolution. Music-to-voice targets are measured after ducking, before final shared mastering.','']
gain=np.zeros(N)
for name,a,b,relative in sections:
 ia,ib=ns(a),min(N,ns(b));vl=integrated(v[:,ia:ib]);ml=integrated(m[:,ia:ib]);g=dbg(vl+relative-ml);gain[ia:ib]=g
 report.append(f'- {name} {a:.2f}–{b:.2f}s: voice {vl:.1f} LUFS; music target {vl+relative:.1f} LUFS ({relative:+.1f} LU relative).')
# 30ms gain smoothing prevents section-edge clicks.
gain=signal.convolve(np.pad(gain,(720,720),mode='edge'),np.ones(1441)/1441,mode='valid',method='fft')
m*=gain;m=fades(m,.025,.35)
# Keep effects behind speech overall, without hiding transients.
fx*=dbg(integrated(v)-12-integrated(fx))
mix=v+m+fx
# Single transparent gain reduction if needed. CI masters to -15 LUFS/-1.5 dBTP.
peak=np.max(np.abs(mix));shared=min(1,.89/max(peak,1e-9));mix*=shared
write_wav(str(OUT/'music.wav'),m);write_wav(str(OUT/'sfx.wav'),fx);write_wav(str(OUT/'premix.wav'),mix)
report+=['',f'Premix shared headroom gain: {20*np.log10(shared):.2f} dB. Voice source and timing unchanged.',f'Full music integrated: {integrated(m):.1f} LUFS; full voice: {integrated(v):.1f} LUFS.','CI final master: -15 LUFS, -1.5 dBTP, 48kHz stereo.']
(OUT/'music-report.md').write_text('\n'.join(report)+'\n');print('\n'.join(report))
