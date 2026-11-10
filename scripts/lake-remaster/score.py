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
OUT=ROOT/'shoots/curiosity-lake/out/remaster/audio';OUT.mkdir(parents=True,exist_ok=True)
data=json.loads((ROOT/'remotion-app/src/curiosity/lake.json').read_text())
D=data['frames']/30;N=ns(D);R=rng(19801120)
v,sr=read_wav(str(ROOT/'shoots/curiosity-lake/voice/voice.wav'))
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
# Revision two: through-composed dark cinematic pulses, bowed harmonic beds,
# granular water textures. No inherited motif, brass, glock or plucked ostinato.
Q=60/86
sections=[('hook',0,4.14,-9),('rig',4.14,8.97,-10),('mine',8.97,12.68,-11),('breach',12.68,16.16,-8),('plug',16.16,20.62,-10),('whirlpool',20.62,24.11,-8),('reversal',24.11,28.77,-9),('escape',28.77,32.15,-10),('return',32.15,D,-9)]
for j,(name,a,b,target) in enumerate(sections):
 dur=b-a; tt=np.arange(ns(dur))/SR
 # Slowly breathing bowed partials with distinct harmonic movement per scene.
 chord=[[45,52,59],[45,48,55],[41,48,56],[38,45,53],[43,50,57],[38,41,48],[40,47,55],[48,55,64],[45,52,60]][j]
 for k,n in enumerate(chord):
  hz=440*2**((n-69)/12)
  x=sum(np.sin(2*np.pi*hz*h*tt + .13*np.sin(tt*(3+k)))/h**1.6 for h in range(1,7))
  env=np.minimum(tt/.5,1)*np.minimum((dur-tt)/.7,1)*(.75+.15*np.sin(tt*1.8+k))
  add(m,x*env,a,.12,(-.6+k*.6))
 for k,t in enumerate(np.arange(a,b-.15,Q)):
  length=.48;tt2=np.arange(ns(length))/SR
  kick=np.sin(2*np.pi*(42*tt2+4*(1-np.exp(-tt2*22))))*np.exp(-tt2*11)
  add(m,kick,t,.24 if name in ('breach','whirlpool') else .12)
  if k%3==2:
   noise=hp(lp(R.standard_normal(ns(.2)),4600),1700)*np.exp(-np.arange(ns(.2))/SR*32)
   add(m,noise,t+Q*.63,.035,.5)
 # Tension rises as the flooded mine and surface collapse connect.
 if name in ('breach','whirlpool','reversal'):
  texture=hp(lp(R.standard_normal(len(tt)),1100),180)
  add(m,texture*np.sin(np.pi*np.clip(tt/dur,0,1))**2,a,.018,-.4)
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
report=['# Lake Peigneur — motion edition — audio mix','Revision 2: new 86 BPM cinematic harmonic/pulse composition; no prior melody or music recording reused.','Bowed additive harmonic beds, low pressure pulses and granular water textures; harmonic relief at escape. Music-to-voice targets are measured after ducking, before final shared mastering.','']
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
