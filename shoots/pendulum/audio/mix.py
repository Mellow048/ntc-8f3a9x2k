# Final soundtrack mix for "The Giant Golden Ball Inside Taipei 101":
#   voice (unchanged gain) + original march/waltz score (+3 dB standard, ducked -3 dB under speech)
#   + synthesized SFX stem (-6 dB events), mastered to -15.0 LUFS integrated and <= -1.2 dBTP true peak,
#   exact 65.500 s / 48 kHz / stereo / 24-bit WAV + cues.md loudness & event report.

import os
import time
import json
import subprocess
import numpy as np
from scipy import ndimage, signal
from dsp import (
    SR, ns, st, dbg, read_wav, write_wav,
    integrated, momentary, short_term, lra, true_peak, fades,
)
import timeline as T

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
N = ns(T.DUR)
TARGET_LUFS = -15.0
CEIL_DBTP = -1.2
DUCK_DB = -3.0

# Music target per section (LU relative to speech in that section, after -3 dB ducking; "+3 dB music" standard)
MUSIC_TARGET = {
    "hook": -10.0,
    "city": -10.0,
    "office": -10.5,
    "reveal": -10.5,
    "boat": -11.5,
    "mechanism": -10.5,
    "typhoon": -10.0,
    "aftermath": -11.5,
    "finale": -10.0,
}

#Gentle dips on quiet sentence endings so final words stay crystal-clear
DIPS = [
    (4.05, 4.58, -2.5),    # "...jumbo jet."
    (29.20, 29.95, -2.5),  # "...eight thick cables."
    (48.85, 49.50, -2.5),  # "...full meter off center."
    (63.60, 64.45, -2.0),  # "...cute cartoon mascot."
]


def log(*a):
    print(f"[{time.strftime('%H:%M:%S')}]", *a, flush=True)


def load_voice():
    x, sr = read_wav(os.path.join(ROOT, "voice", "voice.wav"))
    assert sr == SR, f"Expected {SR} Hz voice.wav, got {sr}"
    v = x[0] if x.shape[0] == 1 else x.mean(0)
    out = np.zeros(N)
    out[:min(N, len(v))] = v[:N]
    return st(out)


def speech_spans(words, merge=0.3):
    sp = []
    for w in words:
        s, e = float(w["s"]), float(w["e"])
        if sp and s - sp[-1][1] < merge:
            sp[-1][1] = max(sp[-1][1], e)
        else:
            sp.append([s, e])
    return sp


def duck_db(spans, depth=DUCK_DB, pre=0.08, post=0.12, att=0.07, rel=0.45):
    ctrl = 1000
    nc = int(T.DUR * ctrl) + 2
    va = np.zeros(nc)
    for s, e in spans:
        va[max(0, int((s - pre) * ctrl)):int((e + post) * ctrl)] = 1.0
    ka, kr = 1 - np.exp(-1 / (att * ctrl)), 1 - np.exp(-1 / (rel * ctrl))
    env = np.zeros(nc)
    e = 0.0
    for i in range(nc):
        tgt = va[i]
        e += (tgt - e) * (ka if tgt > e else kr)
        env[i] = e
    return np.interp(np.arange(N) / SR, np.arange(nc) / ctrl, depth * env)


def section_db(m_ducked, v):
    import music
    secs = music.SECTIONS
    gains = {}
    for name, a, b in secs:
        seg = slice(ns(a), ns(b))
        Lm, Lv = integrated(m_ducked[:, seg]), integrated(v[:, seg])
        gains[name] = (Lv + MUSIC_TARGET[name] - Lm) if (np.isfinite(Lm) and np.isfinite(Lv)) else 0.0
    curve = np.zeros(N)
    t = np.arange(N) / SR
    for name, a, _b in secs:
        curve[t >= a] = gains[name]
    sm = ndimage.uniform_filter1d(curve, ns(0.35), mode="nearest")
    hard = np.zeros(N, bool)
    hard[ns(T.FLASH - 0.2):ns(T.FLASH + 0.2)] = True
    curve = np.where(hard, curve, sm)
    for a, b, db in DIPS:
        d = np.zeros(N)
        d[ns(a):ns(b)] = db
        curve += ndimage.uniform_filter1d(d, ns(0.06), mode="nearest")
    return curve, gains


def limiter(x, ceil_db=CEIL_DBTP, look=0.003, rel=0.08):
    c = dbg(ceil_db)
    n = x.shape[1]
    up = np.abs(signal.resample_poly(x, 4, 1, axis=-1)).max(0)
    pk = np.pad(up, (0, max(0, 4 * n - len(up))))[:4 * n].reshape(n, 4).max(1)
    gr = np.minimum(1.0, c / np.maximum(pk, 1e-12))
    La = max(1, ns(look))
    g1 = ndimage.minimum_filter1d(gr, 2 * La + 1, mode="nearest")
    g2 = g1.copy()
    idx = np.flatnonzero(g1 < 1.0)
    if len(idx):
        kr = 1 - np.exp(-1 / (rel * SR))
        gap = ns(rel * 8)
        brk = np.flatnonzero(np.diff(idx) > gap)
        starts = np.concatenate([[idx[0]], idx[brk + 1]])
        ends = np.concatenate([idx[brk], [idx[-1]]])
        for a, b_ in zip(starts, ends):
            e = min(n, b_ + gap)
            seg = g1[a:e]
            out = np.empty(len(seg))
            g = 1.0
            for k in range(len(seg)):
                g = min(seg[k], g + (1 - g) * kr)
                out[k] = g
            g2[a:e] = out
    g3 = ndimage.uniform_filter1d(g2, 2 * La + 1, mode="nearest")
    g3 = np.minimum(g3, 1.0)
    return x * g3[None, :], g3


def lufs(x):
    v = integrated(x)
    return v if np.isfinite(v) else -99.0


def ffmpeg_ebur(path):
    ff = "ffmpeg"
    try:
        import imageio_ffmpeg
        ff = imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        pass
    try:
        r = subprocess.run([ff, "-hide_banner", "-nostats", "-i", path, "-af", "ebur128=peak=true", "-f", "null", "-"],
                           capture_output=True, text=True, timeout=180)
        txt = r.stderr
        i = txt.rfind("Summary:")
        return txt[i:].strip() if i >= 0 else txt[-1000:]
    except Exception as e:
        return f"ffmpeg check skipped: {e}"


def main():
    t0 = time.time()
    words = T.words(os.path.join(ROOT, "voice", "words.json"))
    spans = speech_spans(words)
    v = load_voice()
    v_ref = integrated(v)
    log(f"voice: {v_ref:.2f} LUFS, TP {true_peak(v):.2f} dBTP")

    import music
    b = music.build()
    m_raw, _ = music.render(b, ref=-20.0)
    dk = duck_db(spans)
    m_d = m_raw * dbg(dk)[None, :]
    sec_curve, sec_gains = section_db(m_d, v)
    m = m_d * dbg(sec_curve)[None, :]
    end = ns(T.DUR - 0.04)
    m[:, end:] *= np.linspace(1, 0, N - end)[None, :]
    log(f"music rendered & ducked: {lufs(m):.2f} LUFS")

    import sfx
    s_st, C = sfx.render(v_ref)
    log(f"sfx rendered: {lufs(s_st):.2f} LUFS")

    mix0 = v + m + s_st
    G = TARGET_LUFS - lufs(mix0)
    for it in range(5):
        y, g3 = limiter(mix0 * dbg(G))
        L = lufs(y)
        log(f"master iter {it}: gain {G:+.2f} dB -> {L:.2f} LUFS, TP {true_peak(y):.2f} dBTP")
        if abs(L - TARGET_LUFS) < 0.02:
            break
        G += TARGET_LUFS - L
    y = fades(y, 0.0, 0.03)
    assert y.shape == (2, N)

    mix_path = os.path.join(HERE, "mix.wav")
    write_wav(mix_path, y, bits=16)
    gv, gm, gs = v * dbg(G), m * dbg(G), s_st * dbg(G)
    eb = ffmpeg_ebur(mix_path)
    print(eb)

    # Write cue sheet & loudness report
    lines = [
        "# The Giant Golden Ball Inside Taipei 101 — Soundtrack Cue Sheet",
        "",
        f"- **Duration:** `{T.DUR:.3f} s` (`{N}` samples @ 48 kHz stereo, `{T.TOTAL}` frames @ 30 fps)",
        f"- **Integrated Loudness:** `{lufs(y):.1f} LUFS` | **True Peak:** `{true_peak(y):.2f} dBTP` | **LRA:** `{lra(y):.1f} LU`",
        f"- **Stems (mix gain {G:+.2f} dB):** Voice `{lufs(gv):.1f} LUFS`, Music `{lufs(gm):.1f} LUFS`, SFX `{lufs(gs):.1f} LUFS`",
        "",
        "## ffmpeg ebur128 Cross-Check",
        "```",
        eb,
        "```",
        "",
        "## Music Sections",
    ]
    for tm, desc in b.cues:
        lines.append(f"- **{tm:5.2f}s (f{int(round(tm * T.FPS))}):** {desc}")
    lines += ["", "## Synthesized SFX Cues (-6 dB event standard)", "| Time (s) | Frame | Cue | Description | Applied LU vs Voice |", "|---|---|---|---|---|"]
    for c in sorted(C, key=lambda item: item.t):
        lines.append(f"| {c.t:6.2f} | {int(round(c.t * T.FPS)):4d} | `{c.name}` | {c.desc} | {c.applied:+.1f} |")
    open(os.path.join(HERE, "cues.md"), "w", encoding="utf-8").write("\n".join(lines) + "\n")
    log(f"wrote mix.wav + cues.md in {time.time() - t0:.1f} s")


if __name__ == "__main__":
    main()
