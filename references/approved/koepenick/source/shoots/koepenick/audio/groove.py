"""Köpenick v2: continuous 112 BPM / 4-4 caper groove, synthesized in Python.

One clock for the entire film, NOT restarted at narration/camera edits.
Kick on 1/3, dry backbeat on 2/4, restrained eighth-note shaker. Pizzicato
bass and chord responses leave room for a short, repeating mallet hook.
No fife, march rolls, slapback echoes or competing syncopated lead lines.
"""
import numpy as np
import instruments as I
from dsp import SR, ns, pan, place, rng, fades, lp, hp

BPM = 112
Q = 60 / BPM
BAR = 4 * Q


def compose(duration, last_word):
    r = rng(19061110)
    music = np.zeros((2, ns(duration)))
    drums = np.zeros_like(music)
    events = []

    def add(bus, x, t, gain, p=0, kind='note'):
        if t >= duration:
            return
        place(bus, pan(x, p), t, gain)
        events.append({'kind': kind, 'time': round(t, 8)})

    # Dry, round kick: the upper partial is audible on phone speakers.
    t = np.arange(ns(.19)) / SR
    phase = 2 * np.pi * (64*t + 38*.018*(1-np.exp(-t/.018)))
    kick = fades((np.sin(phase) + .28*np.sin(2*phase))*np.exp(-t/ .055), .002, .025)
    # Short brushed backbeat, not the old rattling military snare.
    t = np.arange(ns(.13)) / SR
    snare = fades((.65*lp(hp(r.standard_normal(len(t)), 850), 5800)
                   + .3*np.sin(2*np.pi*185*t))*np.exp(-t/.027), .002, .025)
    t = np.arange(ns(.055)) / SR
    hat = fades(lp(hp(r.standard_normal(len(t)), 4800), 9500)*np.exp(-t/.013), .002, .015)

    # Two bars of melodic identity, then two bars of space. Same motif returns
    # predictably every four bars; a single lead rather than continuous noodling.
    hook = [(0, 74, .65), (1, 78, .65), (2, 81, 1.35),
            (4, 78, .65), (5, 76, .65), (6, 74, 1.35)]
    major = [(38, [62,66,69]), (47, [59,62,66]),
             (43, [59,62,67]), (45, [61,64,69])]
    minor = [(47, [59,62,66]), (43, [59,62,67]),
             (40, [59,64,67]), (42, [58,61,66])]
    # Last full bar ends just AFTER the final word. Cadence occupies the existing
    # resolved tail: at 68.571s for this 68.44s final word, no picture retiming.
    cadence = np.ceil(last_word / BAR) * BAR
    for bar, start in enumerate(np.arange(0, cadence, BAR)):
        tense = 49 <= start < 58
        root, chord = (minor if tense else major)[bar % 4]
        # Arrangement changes only on bar boundaries. Never reset meter at cuts.
        for beat in range(4):
            at = start + beat*Q
            if at >= cadence:
                continue
            if beat % 2 == 0:
                add(drums, kick, at, .56, kind='kick')
                bass = I.pluck(I.m2f(root if beat == 0 else root+7), .8, r,
                               dur=.39, bright=.2)
                add(music, bass, at, .65, -.06, 'bass')
            else:
                add(drums, snare, at, .32, .04, 'backbeat')
                for n in chord:
                    add(music, I.pluck(I.m2f(n), .42, r, dur=.25, bright=.22),
                        at, .40, -.25, 'chord')
            for sub in [0, .5]:
                # Offbeats support the pulse, never compete with the backbeat.
                add(drums, hat, at+sub*Q, .075 if sub == 0 else .043,
                    .22, 'hat')
        if bar % 4 == 0 and not tense:
            for beat, pitch, length in hook:
                at = start+beat*Q
                if at + length*Q > cadence:
                    continue
                # Damp mallet tails: no overlapping bell haze beneath words.
                x = I.vibes(I.m2f(pitch), .5, r, dur=length*Q+.10,
                            damp=length*Q-.05, trem_depth=0)
                add(music, lp(x, 3600), at, .30, .20, 'hook')
    music += drums
    # Dominant-to-tonic harmony is established by the preceding A-major bar.
    # Final tonic has a clear attack followed by a smooth natural release.
    for n in [38, 50, 62, 66, 69, 74]:
        x = I.pluck(I.m2f(n), .5, r, dur=duration-cadence, bright=.25)
        add(music, x, cadence, .65 if n < 60 else .40, 0, 'cadence')
    return fades(music, .012, .18), drums, events, float(cadence)
