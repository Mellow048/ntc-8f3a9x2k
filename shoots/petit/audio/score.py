"""Petit: original 96 BPM A-minor high-wire groove; continuous 4/4, no meter resets.
Distinct from Koepenick (112 BPM D-major caper) and Taipei/Beer. Curiosity -> tension -> relief.
Music 5-6 LU below speech after ducking, 48 kHz stereo.
"""
from pathlib import Path
import json
import numpy as np
from scipy import ndimage
import instruments as I
from dsp import SR,ns,pan,place,rng,read_wav,write_wav,integrated,dbg,fades,hp,lp
ROOT=Path(__file__).resolve().parents[3];OUT=ROOT/'shoots/petit/out/audio';OUT.mkdir(parents=True,exist_ok=True)
data=json.loads((ROOT/'remotion-app/src/videos/petit/data.json').read_text());D=data['total']/30;N=ns(D);R=rng(19740807)
v,sr=read_wav(str(ROOT/'shoots/petit/voice/voice.wav'));assert sr==SR
v=np.repeat(v,2,axis=0) if v.shape[0]==1 else v
v=np.pad(v,((0,0),(0,max(0,N-v.shape[-1]))))[:,:N]
absenv=ndimage.maximum_filter1d(np.abs(v).max(0),481);thr=dbg(-13);gain=np.minimum(1,(thr/np.maximum(absenv,1e-9))**.5);gain=ndimage.uniform_filter1d(gain,241);v*=gain
BPM=96;Q=60/BPM;BAR=4*Q
m=np.zeros((2,N));drums=np.zeros((2,N));fx=np.zeros_like(m)
def add(buf,x,t,g=1,p=0):place(buf,pan(x,p) if x.ndim==1 else x,t,g)
def wt(i):return max(0,data['words'][i]['start']-2/30)
# --- drums: round kick 1/3, dry backbeat 2/4, light eighths ---
t=np.arange(ns(.19))/SR
phase=2*np.pi*(60*t+36*.018*(1-np.exp(-t/.018)))
kick=fades((np.sin(phase)+.28*np.sin(2*phase))*np.exp(-t/.055),.002,.025)
t=np.arange(ns(.13))/SR
snare=fades((.65*lp(hp(R.standard_normal(len(t)),850),5800)+.3*np.sin(2*np.pi*185*t))*np.exp(-t/.027),.002,.025)
t=np.arange(ns(.055))/SR
hat=fades(lp(hp(R.standard_normal(len(t)),4800),9500)*np.exp(-t/.013),.002,.015)
# --- harmony: A minor, distinct from Koepenick D-major ---
# Am - F - C - G (I-VI-III-VII in A minor), tense wire uses Em - Dm
major=[(45,[57,60,64]),(41,[57,60,65]),(48,[55,60,64]),(43,[55,59,62])]
minor=[(40,[57,60,64]),(38,[57,60,62]),(45,[57,60,64]),(41,[57,60,65])]
# Two-bar mallet hook, A-minor, different contour from Koepenick
hook=[(0,69,.65),(1,72,.65),(2,76,1.35),(4,72,.65),(5,69,.65),(6,67,1.35)]
last_word=data['words'][-1]['end']
cadence=np.ceil(last_word/BAR)*BAR
for bar,start in enumerate(np.arange(0,cadence,BAR)):
 tense=wt(119)<=start<wt(155)
 root,chord=(minor if tense else major)[bar%4]
 for beat in range(4):
  at=start+beat*Q
  if at>=cadence: continue
  if beat%2==0:
   add(drums,kick,at,.56)
   bass=I.pluck(I.m2f(root if beat==0 else root+7),.8,R,dur=.39,bright=.2)
   add(m,bass,at,.65,-.06)
  else:
   add(drums,snare,at,.32,.04)
   for n in chord:
    add(m,I.pluck(I.m2f(n),.42,R,dur=.25,bright=.22),at,.40,-.25)
  for sub in [0,.5]:
   add(drums,hat,at+sub*Q,.075 if sub==0 else .043,.22)
 if bar%4==0 and not tense:
  for beat,pitch,length in hook:
   at=start+beat*Q
   if at+length*Q>cadence: continue
   x=I.vibes(I.m2f(pitch),.5,R,dur=length*Q+.10,damp=length*Q-.05,trem_depth=0)
   add(m,x,at,.5,-.1)
# --- frame-locked foley ---
cues=[]
def cue(i,name,x,g=.1,p=0):
 t=wt(i);add(fx,x,t,g,p);cues.append((name,t))
def noise(d):return R.standard_normal(ns(d))
def thud(d=.14,f=110):
 t=np.arange(ns(d))/SR;return fades((np.sin(2*np.pi*f*t)+.3*lp(noise(d),1600))*np.exp(-t*35),.003,.02)
cue(21,'square coins',I.glock(1500,.25,R,dur=.22),.05)
cue(29,'magazine flip',fades(hp(noise(.3),2000),.02,.1),.04)
cue(58,'notebook',fades(hp(noise(.4),2200),.02,.1),.03)
cue(59,'toolbox set down',thud(.12,150),.14)
cue(67,'cable clank',I.glock(900,.3,R,dur=.3),.09)
cue(76,'pole knock',I.glock(420,.35,R,dur=.35),.10)
cue(83,'elevator doors',thud(.2,180),.2)
cue(87,'tape snap',fades(hp(noise(.16),2600),.01,.06),.05)
cue(100,'bow release',I.pluck(500,.4,R,dur=.2),.08)
cue(111,'cable pull',thud(.3,90),.3)
cue(119,'step out',thud(.18,100),.25)
cue(144,'traffic stops',thud(.25,70),.18)
cue(150,'police siren blip',I.glock(1200,.3,R,dur=.25),.07)
cue(166,'handcuffs',I.glock(1800,.3,R,dur=.2),.09)
cue(177,'gavel',thud(.12,130),.2)
cue(187,'park applause',fades(hp(noise(.5),1000),.05,.4),.05)
cue(194,'pass stamp',thud(.12,130),.2)
cue(206,'wind',fades(lp(noise(1.2),700),.3,.5),.03)
# --- duck + section gains ---
ctrl=np.arange(0,D+.02,.01);duck=np.ones(len(ctrl))
for w in data['words']:duck[(ctrl>=w['start']-.04)&(ctrl<=w['end']+.08)]=dbg(-2)
duck=ndimage.gaussian_filter1d(duck,4);m*=np.interp(np.arange(N)/SR,ctrl,duck)
secs=[('hook',0,wt(40),-5.5),('disguise',wt(40),wt(67),-5.5),('smuggle',wt(67),wt(100),-5.5),('night pull',wt(100),wt(119),-6),('wire',wt(119),wt(155),-6),('street',wt(155),wt(177),-5.5),('arrest park',wt(177),wt(206),-5.5),('today',wt(206),D,-5.5)]
gains=np.zeros(N);report=['# Petit — original soundtrack','','96 BPM A-minor high-wire groove. Continuous 4/4. Kick 1/3, backbeat 2/4, light eighths; sparse damped-mallet hook. No meter resets.','','| Section | Voice LUFS | Target music LU below voice (after duck) |','|---|---|---|']
for name,a,b,rel in secs:
 ia,ib=ns(a),min(N,ns(b));vl=integrated(v[:,ia:ib]);ml=integrated(m[:,ia:ib]);gains[ia:ib]=dbg(vl+rel-ml);report.append(f'| {name} | {vl:.1f} | {rel:.1f} |')
m*=ndimage.uniform_filter1d(gains,ns(.35));m=fades(m,.025,.20)
fx*=dbg(integrated(v)-12-integrated(fx))
mix=v+m+fx;head=min(1,.86/np.abs(mix).max());mix*=head
write_wav(str(OUT/'premix.wav'),mix);write_wav(str(OUT/'music.wav'),m);write_wav(str(OUT/'sfx.wav'),fx);write_wav(str(OUT/'voice-processed.wav'),v)
report+=['',f'Voice {integrated(v):.1f} LUFS; music {integrated(m):.1f} LUFS; effects {integrated(fx):.1f} LUFS.','', '## Frame-locked cues']+[f'- {t:.3f}s (f{round(t*30)}): {name}' for name,t in cues]
(ROOT/'shoots/petit/audio/cues.md').write_text('\n'.join(report)+'\n');print('\n'.join(report))
