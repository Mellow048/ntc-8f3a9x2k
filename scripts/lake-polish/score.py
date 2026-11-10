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
OUT=ROOT/'shoots/curiosity-lake/out/polish/audio';OUT.mkdir(parents=True,exist_ok=True)
data=json.loads((ROOT/'remotion-app/src/curiosity/lake.json').read_text())
D=38.4;N=ns(D);R=rng(19801123)
v,sr=read_wav(str(ROOT/'shoots/curiosity-lake/voice/voice.wav'))
if sr!=SR:v=signal.resample_poly(v,SR,sr,axis=-1)
if v.ndim==1:v=np.stack([v,v])
if v.shape[0]==1:v=np.repeat(v,2,axis=0)
# Insert a rhetorical 0.5-second pause after 'the mine'; retain the Arena voice.
cut=ns(36.0333333333)
v=np.concatenate([v[:,:cut],np.zeros((2,ns(.5))),v[:,cut:]],axis=1)
for w in data['words']:
 if w['start']>=36.03:w['start']+=.5;w['end']+=.5
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
# New, lighter investigative-adventure cue. Major/add9 colours, forward rhythm,
# warm mallets and short string pulses rather than low ominous drone beds.
Q=60/112
sections=[('hook',0,4.14,-5),('rig',4.14,8.97,-6),('mine',8.97,12.68,-6),('breach',12.68,16.16,-6),('plug',16.16,20.62,-5),('whirlpool',20.62,24.11,-5),('reversal',24.11,28.77,-6),('escape',28.77,32.15,-5),('return',32.15,D,-5)]
for j,(name,a,b,target) in enumerate(sections):
 chords=[[50,57,64,66],[55,62,69,71],[52,59,66,67],[47,54,61,62]]
 chord=chords[j%4] if name not in ('escape','return') else [50,57,61,66]
 for k,t in enumerate(np.arange(a,b-.08,Q/2)):
  n=chord[[0,2,1,3,2,1,3,2][k%8]]+12
  # Warm struck resonator, not a borrowed melody or music recording.
  tt=np.arange(ns(.34))/SR;hz=I.m2f(n)
  x=(np.sin(2*np.pi*hz*tt)+.22*np.sin(2*np.pi*hz*2.004*tt))*np.exp(-tt*12)*np.minimum(tt/.008,1)
  add(m,x,t,.19,(-.35 if k%2 else .35))
  if k%2==0:
   tt=np.arange(ns(.32))/SR;hz=I.m2f(chord[0]-12)
   add(m,(np.sin(2*np.pi*hz*tt)+.15*np.sin(4*np.pi*hz*tt))*np.exp(-tt*10),t,.21)
  if k%4==2:add(m,I.brush(.16,R),t,.08,-.2)
  if k%4==0:
   for n2 in chord[1:]:
    tt=np.arange(ns(.26))/SR;hz=I.m2f(n2)
    x=sum(np.sin(2*np.pi*hz*h*tt)/h**1.7 for h in range(1,5))
    add(m,x*np.sin(np.pi*np.minimum(tt/.26,1))**2,t,.045,.1)
# A clear final cadence and audible one-second resolution after the last word.
for n in [50,57,61,66,74]:
 tt=np.arange(ns(1.15))/SR;hz=I.m2f(n)
 add(m,np.sin(2*np.pi*hz*tt)*np.exp(-tt*3)*np.minimum(tt/.015,1),37.15,.11,(n-62)/35)
# Original mechanical drill, breach, drain and flowing-water events.
for t in np.arange(5.7,8.5,.24):
 x=lp(R.standard_normal(ns(.2)),1800)*np.exp(-np.arange(ns(.2))/SR*12);add(fx,x,t,.025,-.15)
add(fx,I.snare(.5,R,dur=.3),13.17,.3)
for t in np.arange(14.44,16.1,.27):add(fx,lp(R.standard_normal(ns(.45)),1500)*np.exp(-np.arange(ns(.45))/SR*6),t,.035)
add(fx,I.pluck(160,.5,R,dur=.3),17.02,.25)
for t in [21.56,22.37,23.3]:add(fx,I.timpani(55,.45,R,dur=.7),t,.32)
# Resurfacing gets an airy pressure release rather than a recurring bell motif.
for t in [33.5,34.1,34.7]:add(fx,lp(R.standard_normal(ns(.35)),900)*np.exp(-np.arange(ns(.35))/SR*10),t,.018)
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
report=['# Lake Peigneur — motion edition — audio mix','Revision 3: original 112 BPM investigative/adventure cue; brighter harmonic palette.','Music 5–6 LU below narration after ducking, with a resolved final cadence. Music-to-voice targets are measured after ducking, before final shared mastering.','']
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
report+=['',f'Premix shared headroom gain: {20*np.log10(shared):.2f} dB. Original Arena voice retained; 0.5-second pause inserted after the mine.',f'Full music integrated: {integrated(m):.1f} LUFS; full voice: {integrated(v):.1f} LUFS.','CI final master: -15 LUFS, -1.5 dBTP, 48kHz stereo.']
(OUT/'music-report.md').write_text('\n'.join(report)+'\n');print('\n'.join(report))
