# Final mix for "The Emu War": voice (gain only) + original score, music riding 5.5 LU under the local speech level
# and blooming into the gaps, light SFX stem, master to -15 LUFS integrated with a true peak at or under -1.2 dBTP.
# Writes mix.wav + stem_voice / stem_music / stem_sfx (at mix gain, pre-limiter) + cues.md. 48 kHz stereo 24-bit.
import json
import os
import sys

import numpy as np
from scipy import signal

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, os.path.join(ROOT, "..", "..", "templates", "audio"))
from dsp import SR, ns, st, read_wav, write_wav, integrated, momentary_max, true_peak, dbg, lp, hp, rng, place, pan  # noqa: E402
import instruments as I  # noqa: E402

DUR = 72.0
N = ns(DUR)
TARGET_LUFS = -15.0
CEIL_DBTP = -1.2
MUSIC_UNDER = -5.5           # music sits 5.5 LU under the voice where the voice is speaking
GAP_LIFT = 1.8               # and lifts into the pauses so it is never muzak

# sections = shots (s), read off story.ts
SECTIONS = [
    ("hook", 0.0, 11.1), ("ask", 11.1, 20.0), ("dam", 20.0, 26.3), ("scatter", 26.3, 33.4),
    ("tally", 33.4, 39.0), ("explain", 39.0, 45.43), ("hose", 45.43, 53.37), ("line", 53.37, 58.63),
    ("dusk", 58.63, 66.13), ("closer", 66.13, 72.0),
]


def trim(x, n=N):
    y = np.zeros((2, n))
    m = min(n, x.shape[1])
    y[:, :m] = x[:, :m]
    return y


def word_mask(words, n=N, pad=0.02):
    """1 where the narrator is speaking, 0 in the pauses (from words.json, not from the audio)"""
    m = np.zeros(n)
    for w in words:
        a = max(0, ns(w["start"] - pad))
        b = min(n, ns(w["end"] + pad))
        m[a:b] = 1.0
    return m


def smooth(m, ms=180.0):
    k = max(3, ns(ms / 1000))
    return np.convolve(m, np.hanning(k) / np.hanning(k).sum(), mode="same")


def rms_db(x):
    r = np.sqrt(np.mean(x ** 2) + 1e-30)
    return 20 * np.log10(r)


def section_gain(voice, mask, music, section_db, t0, t1):
    """music gain envelope for one section: ride to (voice level in this section + MUSIC_UNDER)"""
    a, b = ns(t0), ns(t1)
    seg = voice[:, a:b].mean(axis=0)
    m = mask[a:b]
    v = rms_db(seg[m > 0.5]) if (m > 0.5).any() else rms_db(seg)
    base = v + MUSIC_UNDER - rms_db(music[:, a:b].mean(axis=0))
    env = np.full(b - a, base)
    # lift through the pauses
    env = env + GAP_LIFT * (1 - smooth(m, 260))
    return env


def limiter(x, ceil_db=CEIL_DBTP, look_ms=5.0, rel_ms=90.0):
    """look-ahead peak limiter on the 4x-oversampled signal, so the ceiling is a true peak"""
    up = signal.resample_poly(x, 4, 1, axis=-1)
    ceil = 10 ** (ceil_db / 20)
    L = max(1, ns(look_ms / 1000) * 4)
    env = np.abs(up).max(axis=0)
    # running max over the look-ahead window
    pad = np.pad(env, (L, L), mode="edge")
    win = np.lib.stride_tricks.sliding_window_view(pad, 2 * L + 1).max(axis=-1)
    need = np.minimum(1.0, ceil / (win + 1e-12))
    # release smoothing (attack is the look-ahead itself)
    a = np.exp(-1.0 / (ns(rel_ms / 1000) * 4))
    g = np.empty_like(need)
    cur = 1.0
    for i in range(len(need)):
        cur = need[i] if need[i] < cur else a * cur + (1 - a) * need[i]
        g[i] = cur
    up *= g
    return signal.resample_poly(up, 1, 4, axis=-1)[:, : x.shape[1]]


def sfx_track(words):
    """diegetic layer: the truck, two rifle cracks on the picture's burst, wings on the scatter,
    a paper slap when the front page lands. Quiet -- it is a bed, not a cartoon."""
    out = np.zeros((2, N))
    r = rng(7)
    # truck: a low diesel idle, in and out with the vehicle beats
    for t0, t1, g in [(11.6, 19.6, 0.16), (26.6, 33.0, 0.20), (58.8, 65.6, 0.13)]:
        n = ns(t1 - t0)
        t = np.arange(n) / SR
        base = 46.0 + 1.5 * np.sin(2 * np.pi * 0.3 * t)
        y = 0.5 * np.sin(2 * np.pi * base * t) + 0.28 * np.sin(4 * np.pi * base * t + 0.4)
        y += 0.18 * lp(r.standard_normal(n), 220.0, 2) + 0.06 * r.standard_normal(n)
        y *= (1 + 0.25 * np.sin(2 * np.pi * 5.2 * t)) * np.clip(np.minimum(t / 0.6, (t1 - t0 - t) / 0.6), 0, 1)
        place(out, pan(y * g, 0.05), t0, 1.0)
    # two rifle cracks, hard and dry, on the burst frame
    for t0, g in [(22.33, 0.5), (22.47, 0.42)]:
        n = ns(0.9)
        t = np.arange(n) / SR
        y = r.standard_normal(n) * np.exp(-t / 0.045) * 0.9
        y += 0.6 * np.sin(2 * np.pi * 90 * t) * np.exp(-t / 0.08)
        place(out, pan(lp(y, 7000.0, 2) * g, -0.35), t0, 1.0)
    # wings on the scatter
    n = ns(1.5)
    t = np.arange(n) / SR
    flap = np.abs(np.sin(2 * np.pi * 7.5 * t)) ** 2
    wing = r.standard_normal(n) * flap * np.exp(-t / 0.7) * 0.10
    place(out, pan(hp(wing, 900.0, 2), 0.25), 26.4, 1.0)
    # the front page
    n = ns(0.6)
    t = np.arange(n) / SR
    paper = hp(r.standard_normal(n), 1800.0, 2) * np.exp(-t / 0.09) * 0.16
    place(out, pan(paper, -0.2), 60.4, 1.0)
    return out


def main():
    voice = trim(read_wav(os.path.join(ROOT, "voice", "voice.wav"))[0])
    music = trim(read_wav(os.path.join(HERE, "music.wav"))[0])
    with open(os.path.join(ROOT, "voice", "words.json")) as f:
        words = json.load(f)
    if isinstance(words, dict):
        words = words["words"]
    mask = word_mask(words)
    sfx = sfx_track(words)

    # ---- voice gain (one number: the read is already consistent, per the delivery)
    v_gain_db = 0.0
    voice *= dbg(v_gain_db)

    # ---- music automation
    env = np.zeros(N)
    for name, t0, t1 in SECTIONS:
        g = section_gain(voice, mask, music, None, t0, t1)
        a, b = ns(t0), ns(t1)
        env[a:b] = g
        print(f"  {name:8s} {t0:6.2f}-{t1:6.2f}  music {np.median(g):+.1f} dB")
    # crossfade the section joins
    k = ns(0.35)
    env = signal.filtfilt(*signal.butter(1, 2 * k / N), env)
    music *= 10 ** (env / 20)[None, :]
    sfx *= 10 ** (-12.0 / 20)

    premaster = voice + music + sfx
    stems = {"voice": voice, "music": music, "sfx": sfx}
    for k2, v in stems.items():
        write_wav(os.path.join(HERE, f"stem_{k2}.wav"), v, bits=24)

    # ---- master: hit -15 LUFS, hold true peak under -1.2 dBTP, verify the pair
    g = TARGET_LUFS - integrated(premaster)
    out = premaster * dbg(g)
    out = limiter(out)
    for _ in range(4):
        i = integrated(out)
        tp = true_peak(out)
        if tp > CEIL_DBTP:
            out *= dbg(CEIL_DBTP - 0.05 - tp)
        elif abs(i - TARGET_LUFS) > 0.2:
            out *= dbg(TARGET_LUFS - i)
        else:
            break
        out = limiter(out)
    out = np.clip(out, -1.0, 1.0)
    write_wav(os.path.join(HERE, "mix.wav"), out, bits=24)

    # ---- cues.md
    lines = ["# The Emu War -- mix",
             "",
             f"72.000 s / 48 kHz / stereo / 24-bit. Master {integrated(out):.1f} LUFS integrated, "
             f"true peak {true_peak(out):.2f} dBTP. Voice untouched apart from one gain; music rides "
             f"{abs(MUSIC_UNDER):.1f} LU under the local speech and lifts {GAP_LIFT:.1f} dB into the pauses.",
             "", "| section | in | out | music level | shot |", "|---|---|---|---|---|"]
    shot_of = {"hook": 1, "ask": 2, "dam": 3, "scatter": 4, "tally": 5, "explain": 6,
               "hose": 7, "line": 8, "dusk": 9, "closer": 10}
    for name, t0, t1 in SECTIONS:
        a, b = ns(t0), ns(t1)
        lines.append(f"| {name} | {t0:.2f} | {t1:.2f} | {np.median(env[a:b]):+.1f} dB | {shot_of[name]} |")
    lines += ["", "## SFX", "",
              "- truck diesel, 11.60-19.60 / 26.60-33.00 / 58.80-65.60",
              "- two rifle cracks on the burst, 22.33 and 22.47",
              "- wings on the scatter, 26.40", "- front page slapped down, 60.40", "",
              f"## Stems", "", "stem_voice.wav, stem_music.wav, stem_sfx.wav -- at mix gain, pre-limiter.", ""]
    with open(os.path.join(HERE, "cues.md"), "w") as f:
        f.write("\n".join(lines))
    print(f"mix.wav {out.shape[1] / SR:.3f}s  I={integrated(out):.1f} LUFS  TP={true_peak(out):.2f} dBTP")


if __name__ == "__main__":
    main()
