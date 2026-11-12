"""Turn a raw TTS take into a tight, bright, punchy narration track, and measure it.

Raw text-to-speech tends to be boomy, evenly paced and full of dead air. This
tool does what a short-form editor does to a voiceover:

  1. tighten  - compress every pause longer than 120 ms (jump-cut pacing) while
                keeping long pauses longer than short ones, so rhythm survives;
  2. tone     - rumble filter, bass shelf cut, low-mid dip, presence lift, air;
  3. dynamics - compression, then loudness normalisation;
  4. pace     - pitch-preserving tempo lift, optional small pitch/formant lift.

It also reports numbers (pace, pause share, pitch, pitch movement, tone balance)
so candidate voices can be compared objectively.

    python shoots/voice_master.py analyze IN [IN ...] [--words N]
    python shoots/voice_master.py master  TAKE [TAKE ...] --out OUT.wav [--target-seconds 59]
                                          [--max-tempo 1.3] [--tempo 1.08] [--pitch 1.0]
                                          [--bass -5] [--presence 3.5] [--mp3 OUT.mp3]

Several takes are joined in order (each one tightened first), which lets a long
script be recorded in shorter chunks so the delivery does not sag.

Needs numpy, scipy and an ffmpeg binary (PATH, or the imageio-ffmpeg wheel).
"""
from __future__ import annotations

import argparse
import os
import shutil
import subprocess
import sys
import tempfile
import wave

import numpy as np
from scipy.signal import welch

SR = 48000


def ffmpeg_exe() -> str:
    exe = shutil.which("ffmpeg")
    if exe:
        return exe
    import imageio_ffmpeg  # bundled static binary

    return imageio_ffmpeg.get_ffmpeg_exe()


def decode(path: str, sr: int = SR) -> np.ndarray:
    raw = subprocess.check_output(
        [ffmpeg_exe(), "-v", "error", "-i", path, "-f", "f32le", "-ac", "1", "-ar", str(sr), "-"]
    )
    return np.frombuffer(raw, "<f4").astype(np.float64)


def write_wav(path: str, x: np.ndarray, sr: int = SR) -> None:
    pcm = (np.clip(x, -1, 1) * 32767).astype("<i2")
    with wave.open(path, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes(pcm.tobytes())


# ---------------------------------------------------------------- pauses
def quiet_runs(x: np.ndarray, sr: int, floor_db: float = -40.0, hop_s: float = 0.005):
    hop = int(hop_s * sr)
    n = len(x) // hop
    env = np.sqrt(np.mean(x[: n * hop].reshape(n, hop) ** 2, axis=1) + 1e-20)
    ref = np.percentile(env, 95)
    quiet = env < ref * 10 ** (floor_db / 20)
    runs, i = [], 0
    while i < n:
        if quiet[i]:
            j = i
            while j < n and quiet[j]:
                j += 1
            runs.append((i * hop, j * hop))
            i = j
        else:
            i += 1
    return runs, n * hop


def tighten(x: np.ndarray, sr: int = SR, min_gap: float = 0.12, slope: float = 0.22,
            max_gap: float = 0.24, lead: float = 0.02, tail: float = 0.13) -> tuple[np.ndarray, list]:
    """Compress pauses > min_gap to min_gap + slope*(L-min_gap), capped at max_gap.

    Stop closures inside words (< 120 ms) are never touched. Returns the new
    signal and a list of (old_start, old_end, new_length) for every edit.
    """
    runs, usable = quiet_runs(x, sr)
    fade = int(0.006 * sr)
    out, pos, edits = [], 0, []
    for a, b in runs:
        L = (b - a) / sr
        first, last = a == 0, b >= usable
        if first:
            target = min(L, lead)
        elif last:
            target = min(L, tail)
        elif L > min_gap:
            target = min(max_gap, min_gap + slope * (L - min_gap))
        else:
            continue
        keep = int(target * sr)
        if keep >= b - a:
            continue
        k_tail = int(keep * 0.6) if not first else 0          # decay after the previous word
        k_head = keep - k_tail                                # breath of room before the next
        seg_a = x[pos:a + k_tail].copy()
        if len(seg_a) > fade and not first:
            seg_a[-fade:] *= np.linspace(1, 0, fade)
        out.append(seg_a)
        pos = b - k_head
        if not last:
            nxt = x[pos:pos + fade] * np.linspace(0, 1, fade)
            out.append(nxt)
            pos += fade
        edits.append((a / sr, b / sr, target))
    out.append(x[pos:])
    return np.concatenate(out), edits


# ---------------------------------------------------------------- tone / dynamics
def chain(tempo: float, pitch: float, bass_db: float, presence_db: float) -> str:
    parts = [f"aresample={SR}"]
    if abs(pitch - 1) > 1e-3:
        # Resampling lift: raises pitch and formants together (lighter, younger voice).
        parts += [f"asetrate={int(round(SR * pitch))}", f"aresample={SR}"]
    parts += [
        "highpass=f=95:poles=2",                          # rumble / proximity boom
        f"lowshelf=g={bass_db}:f=230:t=q:w=0.7",          # the "too much bass" shelf
        "equalizer=f=330:t=q:w=1.0:g=-2.5",               # boxy low-mids
        f"equalizer=f=3300:t=q:w=0.9:g={presence_db}",    # presence: consonants cut through
        "highshelf=g=2.5:f=8500:t=q:w=0.7",               # air
        # Light levelling only: heavy compression irons out the emphasis that makes a read lively.
        "acompressor=threshold=0.125:ratio=2.2:attack=10:release=140:makeup=1.4",
    ]
    rest = tempo / pitch                                  # asetrate already sped it up by `pitch`
    if abs(rest - 1) > 1e-3:
        parts.append(f"atempo={rest:.5f}")                # WSOLA: the speech-friendly stretcher
    return ",".join(parts)


def loudness(path: str) -> dict:
    """Integrated loudness (LUFS), loudness range (LU) and true peak (dBFS) of a file."""
    err = subprocess.run([ffmpeg_exe(), "-hide_banner", "-nostats", "-i", path, "-af",
                          "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True).stderr
    tail = err[err.rindex("Summary:"):]
    grab = lambda key: float(tail.split(key)[1].split()[0])
    return {"lufs": grab("I:"), "lra": grab("LRA:"), "peak": grab("Peak:")}


def master(srcs: list[str], dst: str, tempo: float | None, target_seconds: float | None,
           max_tempo: float, pitch: float, bass_db: float, presence_db: float, mp3: str | None,
           do_tighten: bool = True, join_gap: float = 0.30, lufs: float = -16.0,
           true_peak: float = -1.5) -> dict:
    raw_s, cut, parts = 0.0, 0, []
    for n, src in enumerate(srcs):
        x = decode(src)
        raw_s += len(x) / SR
        if do_tighten:
            x, edits = tighten(x)
            cut += len(edits)
        if n:
            parts.append(np.zeros(int(max(0.0, join_gap - 0.15) * SR)))   # takes already keep 0.15 s
        parts.append(x)
    x = np.concatenate(parts)
    tight_s = len(x) / SR
    if target_seconds:
        tempo = float(np.clip(tight_s / target_seconds, 1.0, max_tempo))
    tempo = tempo or 1.0
    with tempfile.TemporaryDirectory() as tmp:
        mid, toned = os.path.join(tmp, "tight.wav"), os.path.join(tmp, "toned.wav")
        write_wav(mid, x)
        run = lambda src, af, out: subprocess.check_call(
            [ffmpeg_exe(), "-y", "-v", "error", "-i", src, "-af", af, "-ac", "1", "-ar", str(SR),
             "-c:a", "pcm_s16le", out])
        run(mid, chain(tempo, pitch, bass_db, presence_db) + ",volume=-6dB", toned)
        # Static gain to the loudness target, then a peak limiter: dynamics are preserved.
        gain = lufs - loudness(toned)["lufs"]
        limit = 10 ** (true_peak / 20)
        for _ in range(3):                                # the limiter works on sample peaks;
            run(toned, f"volume={gain:.2f}dB,alimiter=limit={limit:.4f}:attack=2:release=40:level=0", dst)
            over = loudness(dst)["peak"] - true_peak      # lower it until the true peak complies
            if over <= 0.05:
                break
            limit *= 10 ** (-(over + 0.1) / 20)
    if mp3:
        subprocess.check_call([ffmpeg_exe(), "-y", "-v", "error", "-i", dst,
                               "-c:a", "libmp3lame", "-b:a", "192k", mp3])
    return {"raw_s": round(raw_s, 2), "tight_s": round(tight_s, 2), "pauses_cut": cut,
            "tempo": round(tempo, 3), "pitch": pitch, "final_s": round(len(decode(dst)) / SR, 2),
            **loudness(dst)}


# ---------------------------------------------------------------- measurement
def f0_track(x16: np.ndarray, sr: int = 16000):
    """Autocorrelation pitch per 10 ms hop. Returns (times_s, f0_hz) for voiced frames."""
    n, hop = int(0.04 * sr), int(0.01 * sr)
    lo, hi = sr // 400, sr // 60
    win = np.hanning(n)
    gate = 0.1 * np.sqrt(np.mean(x16 ** 2) + 1e-12)
    t, out = [], []
    for i in range(0, len(x16) - n, hop):
        fr = x16[i:i + n]
        if np.sqrt(np.mean(fr ** 2)) < gate:
            continue
        fr = (fr - fr.mean()) * win
        spec = np.fft.rfft(fr, 2 * n)
        ac = np.fft.irfft(spec * np.conj(spec))[:n]
        if ac[0] <= 0:
            continue
        ac = ac / ac[0]
        k = lo + int(np.argmax(ac[lo:hi]))
        if ac[k] > 0.5:
            t.append(i / sr); out.append(sr / k)
    t, f0 = np.array(t), np.array(out)
    if len(f0):
        med = np.median(f0)
        ok = (f0 > 0.6 * med) & (f0 < 1.8 * med)          # drop octave errors
        t, f0 = t[ok], f0[ok]
    return t, f0


def analyze(path: str, words: int | None) -> dict:
    x = decode(path)
    runs, usable = quiet_runs(x, SR)
    start = runs[0][1] if runs and runs[0][0] == 0 else 0
    end = runs[-1][0] if runs and runs[-1][1] >= usable else usable
    dur = (end - start) / SR
    gaps = np.array([(b - a) / SR for a, b in runs if a > start and b < end and (b - a) / SR > 0.12])
    f, p = welch(x[start:end], SR, nperseg=8192)
    tot = p.sum()
    band = lambda lo, hi: 10 * np.log10(p[(f >= lo) & (f < hi)].sum() / tot + 1e-12)
    cum = np.cumsum(p) / tot
    t, f0 = f0_track(decode(path, 16000))
    med = float(np.median(f0)) if len(f0) else 0.0
    st = 12 * np.log2(f0 / med) if len(f0) else np.zeros(1)
    thirds = []
    if len(f0):
        for k in range(3):
            sel = (t >= t[0] + (t[-1] - t[0]) * k / 3) & (t <= t[0] + (t[-1] - t[0]) * (k + 1) / 3)
            thirds.append(round(float(np.std(st[sel])), 2) if sel.any() else 0.0)
    return {
        "file": path,
        "speech_s": round(dur, 2),
        "words_per_s": round(words / dur, 2) if words else None,
        "pause_share": round(float(gaps.sum() / dur), 3) if len(gaps) else 0.0,
        "pauses": int(len(gaps)),
        "longest_pause_s": round(float(gaps.max()), 2) if len(gaps) else 0.0,
        "f0_median_hz": round(med, 1),
        "f0_std_st": round(float(np.std(st)), 2),
        "f0_range_p10_p90_st": round(float(np.percentile(st, 90) - np.percentile(st, 10)), 2),
        "f0_std_by_third": thirds,
        "bass_lt150_dB": round(float(band(0, 150)), 1),
        "lowmid_150_400_dB": round(float(band(150, 400)), 1),
        "presence_2k_5k_dB": round(float(band(2000, 5000)), 1),
        "air_5k_12k_dB": round(float(band(5000, 12000)), 1),
        "rolloff_99_hz": int(f[np.searchsorted(cum, 0.99)]),
        "bandwidth_-60dB_hz": int(f[np.flatnonzero(10 * np.log10(p / p.max() + 1e-20) > -60)[-1]]),
    }


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    m = sub.add_parser("master")
    m.add_argument("src", nargs="+", help="one or more takes, joined in order")
    m.add_argument("--out", required=True)
    m.add_argument("--tempo", type=float, help="fixed speed-up factor (default: none)")
    m.add_argument("--target-seconds", type=float, help="pick the tempo that lands this length")
    m.add_argument("--max-tempo", type=float, default=1.30, help="upper limit for --target-seconds")
    m.add_argument("--pitch", type=float, default=1.0, help="pitch/formant lift factor, e.g. 1.03")
    m.add_argument("--bass", type=float, default=-5.0, help="low-shelf gain in dB")
    m.add_argument("--presence", type=float, default=3.5, help="3.3 kHz gain in dB")
    m.add_argument("--no-tighten", action="store_true")
    m.add_argument("--join-gap", type=float, default=0.30, help="pause between takes, before tempo")
    m.add_argument("--mp3")
    a = sub.add_parser("analyze")
    a.add_argument("src", nargs="+")
    a.add_argument("--words", type=int)
    args = ap.parse_args()
    if args.cmd == "master":
        print(master(args.src, args.out, args.tempo, args.target_seconds, args.max_tempo, args.pitch,
                     args.bass, args.presence, args.mp3, not args.no_tighten, args.join_gap))
    else:
        for s in args.src:
            r = analyze(s, args.words)
            print(r.pop("file"))
            for k, v in r.items():
                print(f"   {k:22s} {v}")


if __name__ == "__main__":
    sys.exit(main())
