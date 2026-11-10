"""Reproducible original music, picture-synced effects, and voice mix for the series."""
from pathlib import Path
import json, sys
import numpy as np
from scipy import ndimage
ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT/'pendulum'/'audio'))
from dsp import SR, ns, st, pan, place, rng, dbg, integrated, momentary_max, read_wav, write_wav, true_peak, fades
import instruments as I
import sfx_gen as S
from mix import limiter

DATA = json.loads((ROOT.parent/'remotion-app/src/videos/engineering-series/data.json').read_text())
R = rng(1523)

def rr(): return rng(int(R.integers(1 << 30)))

def make_music(n, duration, seed):
    """Light storybook plucked bass, vibes and bells. All instruments synthesized."""
    r = rng(seed)
    out = np.zeros((2,n))
    q = .52
    roots = [41, 46, 48, 41, 38, 43, 48, 41]
    motif = [77,81,84,81, 82,81,79,77, 79,82,86,84, 81,79,77,72]
    for k in range(int(duration/q)+1):
        t = k*q
        root = roots[(k//4)%len(roots)]
        x = I.pluck(I.m2f(root + (7 if k%2 else 0)), .36, r, dur=.48)
        place(out, pan(x, -.2), t)
        if k%2==0:
            x = I.vibes(I.m2f(motif[k%len(motif)]), .25, r, dur=.8, trem_depth=.18)
            place(out, pan(x, .24), t+.08)
        if k%8==7:
            x = I.musicbox(I.m2f(motif[k%len(motif)]+12), .20, r, dur=.9)
            place(out, pan(x, -.35), t+.1)
    L=integrated(out)
    return out*dbg(-26-L)


def event(kind):
    r=rr()
    if kind in ('quake','sink','bearing','jack'):
        return S.push_thump(r)
    if kind in ('heat','cold','clay','seawall','seabed'):
        return S.whoosh(.7,r,.2,260,1800,.75)
    if kind in ('joint','truss','three','service'):
        return S.clink(r,1900,.3)
    if kind in ('build','drill'):
        return S.creak(.5,r,90,160,S.CHAIN)
    if kind in ('fish','airport','car','train'):
        return S.whoosh(.5,r,.15,350,2200,.8)
    if kind in ('jelly','ruler'):
        return S.swing_squeak(r)
    return S.clink(r,2700,.2)


def build(slug, spec, index):
    path=ROOT/slug
    v,sr=read_wav(str(path/'voice'/'voice.wav'))
    assert sr==SR and v.shape[1]==spec['frames']*(SR//30)
    v=st(v[0]); n=v.shape[1]; duration=n/SR
    ref=integrated(v)
    m=make_music(n,duration,932+index)
    # Apply the +3 dB score convention first, then ride the score beneath speech.
    m *= dbg(3)
    target = ref-10
    m *= dbg(target-integrated(m))
    control=np.zeros(n,dtype=np.float32)
    for w in spec['words']:
        a=max(0,ns(w['start']-.06)); b=min(n,ns(w['end']+.12))
        control[a:b]=1
    control=ndimage.uniform_filter1d(control,size=ns(.12),mode='nearest')
    m *= dbg(-3*control)[None,:]
    effects=np.zeros((2,n))
    for i,b in enumerate(spec['beats'][1:]):
        x=event(b['scene']); x=st(x)
        cur=momentary_max(x)
        if np.isfinite(cur):
            # -6 dB relative to the event's conservative pre-fader level.
            x *= dbg(ref-10-6-cur)
        place(effects,x,b['frame']/30)
    y=v+m+effects
    gain=-15-integrated(y)
    for i in range(3):
        out,g=limiter(y*dbg(gain),ceil_db=-1.4)
        delta=-15-integrated(out)
        if abs(delta)<.03: break
        gain+=delta
    out=fades(out,0,.03)
    outdir=path/'audio';outdir.mkdir(exist_ok=True)
    write_wav(str(outdir/'mix.wav'),out,bits=16)
    (outdir/'cues.md').write_text('# Sound cues\n\nOriginal synthesized storybook score, speech ducking and timed effects. SFX events use the -6 dB convention.\n\n'+''.join(f"- frame {b['frame']}: {b['scene']} ({b['phrase']})\n" for b in spec['beats'][1:])+f'\nIntegrated {integrated(out):.2f} LUFS; true peak {true_peak(out):.2f} dBTP.\n')
    print(slug, f'{duration:.2f}s', f'{integrated(out):.2f} LUFS',f'{true_peak(out):.2f} dBTP',flush=True)

if __name__ == '__main__':
    for i,(slug,spec) in enumerate(DATA.items()):
        build(slug,spec,i)
