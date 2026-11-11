"""Original Köpenick mock-military/music-hall score, not a reference melody.
116 BPM, D major/B minor. Reuses only the instrument/DSP library.
"""
from pathlib import Path
import json,subprocess,re,shutil
import numpy as np
from scipy import signal,ndimage
import instruments as I
from dsp import SR,ns,pan,place,rng,read_wav,write_wav,integrated,dbg,fades,hp,lp
ROOT=Path(__file__).resolve().parents[3];OUT=ROOT/'shoots/koepenick/out/audio';OUT.mkdir(parents=True,exist_ok=True)
data=json.loads((ROOT/'remotion-app/src/videos/koepenick/data.json').read_text());D=data['total']/30;N=ns(D);R=rng(19061016)
v,sr=read_wav(str(ROOT/'shoots/koepenick/voice/voice.wav'));assert sr==SR
v=np.repeat(v,2,axis=0) if v.shape[0]==1 else v
v=np.pad(v,((0,0),(0,max(0,N-v.shape[-1]))))[:,:N]
m=np.zeros((2,N));fx=np.zeros_like(m)
def add(buf,x,t,g=1,p=0):place(buf,pan(x,p) if x.ndim==1 else x,t,g)
def note(inst,n,t,d=.2,g=.3,p=0):
 f=I.m2f(n)
 if inst=='pluck':x=I.pluck(f,g,R,dur=d+.2)
 elif inst=='fife':x=I.fife(f,d,g,R)
 elif inst=='glock':x=I.glock(f,g,R,dur=d+.35)
 elif inst=='vibes':x=I.vibes(f,g,R,dur=d+.5)
 else:x=I.brass(f,d,g,R,kind='tuba' if n<50 else 'horn')
 add(m,x,t,p=p)
def wt(i):return max(0,data['words'][i]['start']-2/30)
secs=[('borrowed army',0,wt(18),-5.5),('rejected',wt(18),wt(33),-6),('shopping',wt(33),wt(55),-5.5),('the bluff',wt(55),wt(82),-5.5),('train',wt(82),wt(95),-6),('takeover',wt(95),wt(111),-5.5),('bath gag',wt(111),wt(126),-6),('warrant',wt(126),wt(139),-6),('cash and escape',wt(139),wt(170),-5.5),('cellmate',wt(170),wt(184),-6),('caught',wt(184),wt(195),-7),('pardon',wt(195),wt(206),-5.5),('music hall',wt(206),wt(214),-5.5),('bronze callback',wt(214),D,-5.5)]
Q=60/116
# A new syncopated "borrowed authority" motif; nobody else's melody.
melody=[(0,74,.55),(.75,78,.25),(1.25,76,.45),(2,69,.45),(2.75,73,.25),(3.25,74,.6),(4,81,.5),(4.75,78,.25),(5.25,76,.5),(6,73,.25),(6.5,69,.25),(7,74,.8)]
for si,(name,a,b,rel) in enumerate(secs):
 minor=name in ['rejected','cellmate','caught','warrant'];roots=[47,43,40,42] if minor else [38,43,45,38]
 chords=[[59,62,66],[55,59,62],[52,55,59],[54,58,61]] if minor else [[62,66,69],[59,62,67],[61,64,69],[62,66,69]]
 light=name in ['shopping','bath gag','cash and escape','cellmate']
 for k,t in enumerate(np.arange(a,b-.1,Q)):
  ch=chords[(k//4)%4]
  note('pluck',roots[(k//4)%4],t,.23,.46,-.2)
  if name!='caught':
   for n in ch:note('pluck' if light else 'brass',n,t+Q*.5,.12,.14,.2)
  if name not in ['rejected','caught','bronze callback']:add(m,I.snare(.12 if k%2 else .06,R),t+Q*.5,p=-.25)
  if light:
   # dry woodblock replaces the march snare during the cap/bath/receipt business
   ts=np.arange(ns(.08))/SR;x=np.sin(2*np.pi*970*ts)*np.exp(-ts*70);add(m,x,t,.035,.3)
 for cycle in np.arange(a+.08,b,8*Q):
  for beat,n,d in melody:
   t=cycle+beat*Q
   if t+d*Q>=b-.1:continue
   if name=='caught' and beat%2:continue
   inst='vibes' if minor else ('glock' if name in ['music hall','bronze callback'] else 'fife')
   nn=n-(2 if minor else 0)
   note(inst,nn,t,d*Q,.2 if inst=='fife' else .28,.15)
# Joke holes: the score breathes before the deadpan response and the final callback.
for a,b in [(wt(125)-.15,wt(125)+.18),(wt(226)-.23,wt(226)+.08)]:
 ia,ib=ns(a),ns(b);m[:,ia:ib]*=.22
# Final D-major cadence after the last word; no abrupt cutoff.
end=data['words'][-1]['end']
for n in [38,50,62,66,69,74]:note('vibes' if n>59 else 'brass',n,end-.02,.65,.25,0)
# Frame-locked foley: stamp, synchronous halt, glasses, coins, pen, gate and applause.
cues=[]
def cue(i,name,x,g=.1,p=0):
 t=wt(i);add(fx,x,t,g,p);cues.append((name,t))
def noise(d):return R.standard_normal(ns(d))
def thud(d=.14,f=110):
 t=np.arange(ns(d))/SR;return fades((np.sin(2*np.pi*f*t)+.3*lp(noise(d),1600))*np.exp(-t*35),.003,.02)
cue(29,'registry stamp',thud(),.35)
cue(57,'ten boots halt',thud(.24,70),.4)
cue(94,'mug clink',I.glock(1500,.3,R,dur=.3),.08)
cue(99,'door bolts',thud(.2,250),.2)
cue(125,'permission flick',I.pluck(650,.4,R,dur=.2),.07)
for i in range(9):add(fx,I.glock(1900+i*147,.2,R,dur=.17),wt(144)+i*.075,.08,float(R.uniform(-.4,.4)))
cues.append(('coins into sack',wt(144)))
cue(146,'quill on paper',fades(hp(noise(.7),2200),.02,.1),.012)
cue(169,'steam',fades(lp(hp(noise(.9),300),2600),.15,.4),.035)
cue(188,'breakfast cup',I.glock(1100,.3,R,dur=.25),.08)
cue(191,'cell door',thud(.25,80),.35)
cue(204,'pardon seal',thud(.12,130),.2)
# Short, irregular claps under the theatrical stage reveal, not a hiss.
for t in np.arange(wt(206)+.35,wt(214)-.1,.115):add(fx,fades(hp(noise(.04),1000),.002,.03),t,float(R.uniform(.015,.04)),float(R.uniform(-.7,.7)))
for delay,g in [(.043,.1),(.079,.06)]:
 k=ns(delay);m[:,k:]+=m[::-1,:-k].copy()*g
# Smooth word duck; per-section loudness is matched AFTER ducking.
ctrl=np.arange(0,D+.02,.01);duck=np.ones(len(ctrl))
for w in data['words']:duck[(ctrl>=w['start']-.04)&(ctrl<=w['end']+.08)]=dbg(-2)
duck=ndimage.gaussian_filter1d(duck,4);m*=np.interp(np.arange(N)/SR,ctrl,duck)
gains=np.zeros(N);report=['# Köpenick — original soundtrack','', '116 BPM, D major/B minor; new syncopated motif; reused synthesis primitives only.','', '| Section | Voice LUFS | Target music LU below voice (after duck) |','|---|---|---|']
for name,a,b,rel in secs:
 ia,ib=ns(a),min(N,ns(b));vl=integrated(v[:,ia:ib]);ml=integrated(m[:,ia:ib]);gains[ia:ib]=dbg(vl+rel-ml);report.append(f'| {name} | {vl:.1f} | {rel:.1f} |')
m*=ndimage.uniform_filter1d(gains,ns(.04));m=fades(m,.025,.20)
fx*=dbg(integrated(v)-12-integrated(fx))
# Compress isolated voice peaks before common mastering, preserving dynamics elsewhere.
# A soft knee only above -13 dBFS so voice average can reach the target without hard limiting.
absenv=ndimage.maximum_filter1d(np.abs(v).max(0),481);thr=dbg(-13);gain=np.minimum(1,(thr/np.maximum(absenv,1e-9))**.5);gain=ndimage.uniform_filter1d(gain,241);v*=gain
mix=v+m+fx;head=min(1,.86/np.abs(mix).max());mix*=head
write_wav(str(OUT/'premix.wav'),mix);write_wav(str(OUT/'music.wav'),m);write_wav(str(OUT/'sfx.wav'),fx)
report+=['',f'Voice {integrated(v):.1f} LUFS; music {integrated(m):.1f} LUFS; effects {integrated(fx):.1f} LUFS.','', '## Frame-locked cues']+[f'- {t:.3f}s (f{round(t*30)}): {name}' for name,t in cues]
(ROOT/'shoots/koepenick/audio/cues.md').write_text('\n'.join(report)+'\n');print('\n'.join(report))
