"""Köpenick v2: steady 112 BPM caper groove; no reduction in music level.
One global meter and a restrained mallet hook. Original foley cue timings retained.
"""
from pathlib import Path
import json
import numpy as np
from scipy import ndimage
import instruments as I
from dsp import SR,ns,pan,place,rng,read_wav,write_wav,integrated,dbg,fades,hp,lp
ROOT=Path(__file__).resolve().parents[3];OUT=ROOT/'shoots/koepenick/out/audio';OUT.mkdir(parents=True,exist_ok=True)
data=json.loads((ROOT/'remotion-app/src/videos/koepenick/data.json').read_text());D=data['total']/30;N=ns(D);R=rng(19061016)
v,sr=read_wav(str(ROOT/'shoots/koepenick/voice/voice.wav'));assert sr==SR
v=np.repeat(v,2,axis=0) if v.shape[0]==1 else v
v=np.pad(v,((0,0),(0,max(0,N-v.shape[-1]))))[:,:N]
# Compress isolated voice peaks before common mastering, preserving dynamics elsewhere.
# A soft knee only above -13 dBFS so voice average can reach the target without hard limiting.
absenv=ndimage.maximum_filter1d(np.abs(v).max(0),481);thr=dbg(-13);gain=np.minimum(1,(thr/np.maximum(absenv,1e-9))**.5);gain=ndimage.uniform_filter1d(gain,241);v*=gain
m=np.zeros((2,N));fx=np.zeros_like(m)
def add(buf,x,t,g=1,p=0):place(buf,pan(x,p) if x.ndim==1 else x,t,g)
def wt(i):return max(0,data['words'][i]['start']-2/30)
secs=[('borrowed army',0,wt(18),-5.5),('rejected',wt(18),wt(33),-6),('shopping',wt(33),wt(55),-5.5),('the bluff',wt(55),wt(82),-5.5),('train',wt(82),wt(95),-6),('takeover',wt(95),wt(111),-5.5),('bath gag',wt(111),wt(126),-6),('warrant',wt(126),wt(139),-6),('cash and escape',wt(139),wt(170),-5.5),('cellmate',wt(170),wt(184),-6),('caught',wt(184),wt(195),-7),('pardon',wt(195),wt(206),-5.5),('music hall',wt(206),wt(214),-5.5),('bronze callback',wt(214),D,-5.5)]
from groove import compose, BPM, Q, BAR
m,drums,events,cadence=compose(D,data['words'][-1]['end'])
(OUT/'groove-events.json').write_text(json.dumps({'bpm':BPM,'quarter':Q,'bar':BAR,'cadence':cadence,'events':events},indent=2)+'\n')
write_wav(str(OUT/'drums.wav'),drums)
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
# Smooth word duck; per-section loudness is matched AFTER ducking.
ctrl=np.arange(0,D+.02,.01);duck=np.ones(len(ctrl))
for w in data['words']:duck[(ctrl>=w['start']-.04)&(ctrl<=w['end']+.08)]=dbg(-2)
duck=ndimage.gaussian_filter1d(duck,4);m*=np.interp(np.arange(N)/SR,ctrl,duck)
gains=np.zeros(N);report=['# Köpenick — original soundtrack','', 'V2: 112 BPM, continuous 4/4 caper groove. Kick 1/3, backbeat 2/4, light eighths; sparse damped-mallet hook. No section clock resets or rhythmic echoes. Music loudness targets UNCHANGED from v1.','', '| Section | Voice LUFS | Target music LU below voice (after duck) |','|---|---|---|']
for name,a,b,rel in secs:
 ia,ib=ns(a),min(N,ns(b));vl=integrated(v[:,ia:ib]);ml=integrated(m[:,ia:ib]);gains[ia:ib]=dbg(vl+rel-ml);report.append(f'| {name} | {vl:.1f} | {rel:.1f} |')
m*=ndimage.uniform_filter1d(gains,ns(.35));m=fades(m,.025,.20)
fx*=dbg(integrated(v)-12-integrated(fx))
mix=v+m+fx;head=min(1,.86/np.abs(mix).max());mix*=head
write_wav(str(OUT/'premix.wav'),mix);write_wav(str(OUT/'music.wav'),m);write_wav(str(OUT/'sfx.wav'),fx);write_wav(str(OUT/'voice-processed.wav'),v)
report+=['',f'Voice {integrated(v):.1f} LUFS; music {integrated(m):.1f} LUFS; effects {integrated(fx):.1f} LUFS.','', '## Frame-locked cues']+[f'- {t:.3f}s (f{round(t*30)}): {name}' for name,t in cues]
(ROOT/'shoots/koepenick/audio/cues.md').write_text('\n'.join(report)+'\n');print('\n'.join(report))
