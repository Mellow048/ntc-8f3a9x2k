"""Conform the raw Arena narration take to film pace and time every word.

    python shoots/koepenick/voice/prepare.py

Input   raw-take.mp3   the untouched Arena TTS take (never edited)
        narration.txt  the exact text that was sent to the voice
Output  voice.wav      48 kHz mono, film pace (what the film and the mix use)
        voice.mp3      listening copy of voice.wav
        words.json     one entry per spoken word, timed on voice.wav

Why the take is conformed: the approved Taipei 101 narration in
references/approved runs at 4.0 words/s inside phrases with a median pause of
0.24 s. The raw take for this film came out at 3.7 words/s with a median pause
of 0.44 s, which would make the film 83 s long. Two gentle steps bring it to
the benchmark's pace:

  1. pauses  every pause of 0.12 s or more is shortened to 0.10 s + 0.30 x its
             length (0.42 s at most), so long pauses stay longer than short
             ones. Only the quietest stretch inside each pause is removed, at
             least 70 ms after the previous word and 40 ms before the next,
             starting and ending where the sound has already died away, and
             the join is cross-faded over 12 ms. No word is touched.
             A few pauses carry the comedy and the ending cadence; those keep
             a set length instead (BEATS below).
  2. tempo   one uniform pitch-preserving lift (ffmpeg atempo).

Needs numpy, pocketsphinx and an ffmpeg binary (PATH, FFMPEG, or the
imageio-ffmpeg wheel). Nothing is downloaded.
"""
from __future__ import annotations

import json
import math
import os
import re
import shutil
import subprocess
import sys
import wave
from pathlib import Path

import numpy as np
from pocketsphinx import Decoder

HERE = Path(__file__).resolve().parent
SR = 48000
FPS = 30

# ---- pacing (the only numbers to tune) ------------------------------------
MIN_GAP = 0.12      # pauses shorter than this are left alone
GAP_BASE = 0.10     # new pause = GAP_BASE + GAP_SLOPE * old pause ...
GAP_SLOPE = 0.30
GAP_MAX = 0.42      # ... but never longer than this
KEEP_AFTER = 0.07   # never cut closer than this after a word ends
KEEP_BEFORE = 0.04  # never cut closer than this before a word starts
XFADE = 0.012
EDGE = 0.02         # the 20 ms on each side of a cut must be quiet ...
EDGE_LIMITS = (-42.0, -39.0, -36.0)  # ... below the first of these levels (dBFS RMS) that any position can meet
TEMPO = 1.08        # uniform pitch-preserving lift
# Pauses that are part of the joke or the ending: (word before, word after) -> length in the finished file.
# A pause is never lengthened beyond what the voice actually left.
BEATS = {
    ("hall", "they"): 0.30,        # "...rob a town hall. | They had no idea."
    ("him", "they"): 0.32,         # "...orders them to follow him. | They do."
    ("bath", "granted"): 0.34,     # "...to take a bath. | Granted."
    ("today", "a"): 0.36,          # "And outside that town hall today? | A bronze statue..."
    ("shoemaker", "still"): 0.45,  # "...of the shoemaker. | Still wearing the wrong hat."
}
LEAD_IN = 0.07      # silence before the first word (the Taipei take has 0.07 s)
TAIL = 0.30         # voice-only tail kept after the last word

# Pronunciations the built-in dictionary lacks. Several are offered for the
# two German names; the aligner reports which one the audio is closest to.
EXTRA = {
    "koepenick": ["K ER P AH N IH K", "K OW P AH N IH K", "K AA P AH N IH K", "K EH P AH N IH K",
                  "K UH P AH N IH K", "K Y UW P AH N IH K", "K OW P EH N IH K", "K ER P EH N IH K"],
    "voigt": ["V OY T", "F OY K T", "F OW K T", "V OY K T", "F OY T", "V OW T", "F OW G T"],
    "cellmate": ["S EH L M EY T"],
    "unluckily": ["AH N L AH K AH L IY"],
}


def ffmpeg() -> str:
    exe = os.environ.get("FFMPEG") or shutil.which("ffmpeg")
    if exe:
        return exe
    import imageio_ffmpeg

    return imageio_ffmpeg.get_ffmpeg_exe()


def decode(path: Path, sr: int) -> np.ndarray:
    raw = subprocess.check_output([ffmpeg(), "-v", "error", "-i", str(path), "-f", "f32le", "-ac", "1", "-ar", str(sr), "-"])
    return np.frombuffer(raw, "<f4").astype(np.float64)


def write_wav(path: Path, x: np.ndarray, sr: int = SR) -> None:
    pcm = (np.clip(x, -1, 1) * 32767.0).round().astype("<i2")
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes(pcm.tobytes())


# ---- text ------------------------------------------------------------------
def spoken_tokens(text: str) -> list[str]:
    return re.findall(r"[a-z]+(?:'[a-z]+)?", text.replace("Köpenick", "koepenick").lower())


def display_words(text: str) -> list[tuple[str, int]]:
    """(word as written, number of spoken tokens it covers), e.g. ('fifty-seven,', 2)."""
    out = []
    for w in text.split():
        n = len(spoken_tokens(w))
        if n:
            out.append((w, n))
    return out


# ---- forced alignment --------------------------------------------------------
def align(x16: np.ndarray, tokens: list[str]):
    d = Decoder(samprate=16000, loglevel="ERROR")
    for word, prons in EXTRA.items():
        have = set()
        if d.lookup_word(word):
            have.add(d.lookup_word(word))
        for p in prons:
            if p in have:
                continue
            name, i = word, 2
            while d.lookup_word(name):
                name = f"{word}({i})"
                i += 1
            d.add_word(name, p, True)
            have.add(p)
    missing = sorted({t for t in tokens if not d.lookup_word(t)})
    if missing:
        raise SystemExit(f"no pronunciation for: {missing}")
    pcm = (np.clip(x16, -1, 1) * 32767.0).astype("<i2").tobytes()
    d.set_align_text(" ".join(tokens))
    d.start_utt()
    d.process_raw(pcm, False, True)
    d.end_utt()
    out = []
    for s in d.seg():
        if s.word in ("<sil>", "<s>", "</s>", "(NULL)"):
            continue
        out.append({"token": re.sub(r"\(\d+\)$", "", s.word), "variant": d.lookup_word(s.word),
                    "start": s.start_frame / 100, "end": (s.end_frame + 1) / 100})
    if [w["token"] for w in out] != tokens:
        raise SystemExit("alignment did not return every word in order")
    return out


def pause_stats(words) -> tuple[int, float, float]:
    gaps = [b["start"] - a["end"] for a, b in zip(words, words[1:])]
    big = [g for g in gaps if g >= MIN_GAP]
    return len(big), float(sum(big)), float(np.median(big)) if big else 0.0


# ---- step 1: pauses ------------------------------------------------------------
def tighten(x: np.ndarray, words) -> tuple[np.ndarray, list[dict]]:
    xf = int(XFADE * SR)
    edge = int(EDGE * SR)
    power = np.concatenate([[0.0], np.cumsum(x * x)])
    pieces, pos, edits = [], 0, []
    for a, b in zip(words, words[1:]):
        gap = b["start"] - a["end"]
        if gap < MIN_GAP:
            continue
        target = min(GAP_MAX, GAP_BASE + GAP_SLOPE * gap)
        beat = BEATS.get((a["token"], b["token"]))
        if beat is not None:
            target = min(gap, beat * TEMPO)
        lo = int((a["end"] + KEEP_AFTER) * SR)
        hi = int((b["start"] - KEEP_BEFORE) * SR)
        cut = min(int((gap - target) * SR), hi - lo)
        if cut < int(0.03 * SR):
            continue
        # quietest window of length `cut` inside [lo, hi] whose two edges are quiet as well
        starts = np.arange(lo, hi - cut + 1, 48)
        energy = power[starts + cut] - power[starts]
        before = (power[starts] - power[starts - edge]) / edge
        after = (power[np.minimum(starts + cut + edge, len(x))] - power[starts + cut]) / edge
        edge_db = 10 * np.log10(np.maximum(1e-12, np.maximum(before, after)))
        pick = int(np.argmin(edge_db))
        for limit in EDGE_LIMITS:
            ok = edge_db < limit
            if ok.any():
                pick = int(np.flatnonzero(ok)[int(np.argmin(energy[ok]))])
                break
        s = int(starts[pick])
        left = x[pos:s + xf].copy()
        left[-xf:] *= np.linspace(1.0, 0.0, xf)
        right_head = x[s + cut:s + cut + xf] * np.linspace(0.0, 1.0, xf)
        left[-xf:] += right_head
        pieces.append(left)
        pos = s + cut + xf
        removed_db = 10 * math.log10(max(1e-12, (power[s + cut] - power[s]) / cut))
        edits.append({"after": a["token"], "at": s / SR, "old": gap, "new": gap - cut / SR, "removed_dbfs": removed_db,
                      "edge_dbfs": float(edge_db[pick])})
    pieces.append(x[pos:])
    return np.concatenate(pieces), edits


def main() -> None:
    text = (HERE / "narration.txt").read_text(encoding="utf-8")
    tokens = spoken_tokens(text)
    raw = decode(HERE / "raw-take.mp3", SR)
    raw_words = align(decode(HERE / "raw-take.mp3", 16000), tokens)
    n0, t0, m0 = pause_stats(raw_words)
    span0 = raw_words[-1]["end"] - raw_words[0]["start"]

    tight, edits = tighten(raw, raw_words)

    # trim the lead-in and tail around the speech (positions from the raw alignment, moved by the edits)
    first = max(0.0, raw_words[0]["start"] - LEAD_IN)
    removed_total = len(raw) / SR - len(tight) / SR
    last = raw_words[-1]["end"] - removed_total + TAIL * TEMPO
    tight = tight[int(first * SR):min(len(tight), int(last * SR))]
    fade = int(0.008 * SR)
    tight[:fade] *= np.linspace(0, 1, fade)
    tight[-fade:] *= np.linspace(1, 0, fade)

    # ---- step 2: tempo ----
    tmp = HERE / "_tight.tmp.wav"
    write_wav(tmp, tight)
    out_wav = HERE / "voice.wav"
    subprocess.run([ffmpeg(), "-v", "error", "-y", "-i", str(tmp), "-filter:a", f"atempo={TEMPO}",
                    "-ar", str(SR), "-ac", "1", "-c:a", "pcm_s16le", str(out_wav)], check=True)
    tmp.unlink()
    subprocess.run([ffmpeg(), "-v", "error", "-y", "-i", str(out_wav), "-c:a", "libmp3lame", "-b:a", "128k",
                    str(HERE / "voice.mp3")], check=True)

    # ---- time every word on the finished file ----
    final = decode(out_wav, SR)
    words = align(decode(out_wav, 16000), tokens)
    n1, t1, m1 = pause_stats(words)
    span1 = words[-1]["end"] - words[0]["start"]
    duration = len(final) / SR

    entries, i = [], 0
    for shown, n in display_words(text):
        part = words[i:i + n]
        entries.append({"word": shown, "start": round(part[0]["start"], 3), "end": round(part[-1]["end"], 3)})
        i += n
    data = {
        "slug": "koepenick", "fps": FPS, "voiceDuration": round(duration, 3),
        "lastWordEnd": entries[-1]["end"],
        "pacing": {"minGap": MIN_GAP, "gapBase": GAP_BASE, "gapSlope": GAP_SLOPE, "gapMax": GAP_MAX, "tempo": TEMPO},
        "words": entries,
    }
    (HERE / "words.json").write_text(json.dumps(data, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")

    # ---- report ----
    def db(v: float) -> float:
        return 20 * math.log10(max(v, 1e-12))

    print(f"raw take   : {len(raw) / SR:6.2f} s  {len(tokens)} words  {len(tokens) / span0:.2f} words/s overall, "
          f"{len(tokens) / (span0 - t0):.2f} inside phrases; {n0} pauses, {t0:.2f} s, median {m0:.2f} s")
    print(f"film pace  : {duration:6.2f} s  {len(tokens)} words  {len(tokens) / span1:.2f} words/s overall, "
          f"{len(tokens) / (span1 - t1):.2f} inside phrases; {n1} pauses, {t1:.2f} s, median {m1:.2f} s")
    print(f"last word ends {words[-1]['end']:.2f} s; peak {db(np.abs(final).max()):.1f} dBFS")
    print(f"pause edits: {len(edits)}; removed {sum(e['old'] - e['new'] for e in edits):.2f} s; "
          f"loudest removed stretch {max(e['removed_dbfs'] for e in edits):.1f} dBFS RMS "
          f"(median {float(np.median([e['removed_dbfs'] for e in edits])):.1f}); "
          f"loudest cut edge {max(e['edge_dbfs'] for e in edits):.1f} dBFS")
    # no word may have lost length beyond the tempo change
    worst = []
    for a, b in zip(raw_words, words):
        d0, d1 = a["end"] - a["start"], b["end"] - b["start"]
        worst.append((d1 - d0 / TEMPO, a["token"], d0, d1))
    worst.sort()
    print("largest word-length losses vs raw/tempo (alignment grid is 10 ms): "
          + ", ".join(f"{w} {d * 1000:+.0f} ms" for d, w, _, _ in worst[:5]))
    for w in words:
        if w["token"] in ("koepenick", "voigt"):
            print(f"closest pronunciation for {w['token']!r}: {w['variant']}")


if __name__ == "__main__":
    sys.exit(main())
