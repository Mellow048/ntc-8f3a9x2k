"""Lock the narration for the Neuville-sur-Saône short and derive word timings from it.

    python shoots/pool/build_voice.py [--target-seconds 76] [--max-tempo 1.2]
    python shoots/pool/build_voice.py --beats-only     # only add the BEATS to an existing voice.wav

Input   voice/raw-take.mp3  the approved Arena TTS read (voice-15) as it came, kept so the pace can be changed later
                            (voice/v15.tmp.wav, the uncompressed and uncommitted original, is used instead if present)
Output  voice/voice.wav     mastered narration, 48 kHz mono (pauses tightened, tone nearly untouched, tempo lift)
        voice/words.json    one entry per spoken word: display text, start and end in seconds
        voice/timing.json   how the track was made (tempo, cuts, duration, loudness)
        remotion-app/src/videos/pool/words.json   the same words, read by the picture

The read is brisk, so deliberate beats (BEATS below) are added at the end: silence after the hook ("one month"), after
the sum, after "the flex", after "online", after "watching", after "recorded it", after "first", after "twenty years",
either side of his answer to the judge, after "empire" and before the closing question.
The picture, captions and sound follow words.json, so they move with it.

Word times come from PocketSphinx forced alignment of the *raw* take (natural pace
aligns best) and are then carried through the pause edits and the tempo change, so
they are exact for the mastered file.

Needs numpy, scipy, pocketsphinx and an ffmpeg binary (PATH or imageio-ffmpeg).
"""
from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent))
import voice_master as vm  # noqa: E402

RAW = HERE / "voice" / "raw-take.mp3"
NARRATION = HERE / "narration.txt"
PICTURE_WORDS = HERE.parents[1] / "remotion-app" / "src" / "videos" / "pool" / "words.json"

# Spoken forms the aligner needs, and pronunciations missing from the CMU dictionary.
SPOKEN: dict[str, str] = {"gendarmes": "zhondarm", "prefecture": "preffectsure"}
LEXICON = {
    "gendarmes": "ZH AA N D AA R M",
    "gendarme": "ZH AA N D AA R M",
    "prefecture": "P R IY F EH K CH ER",
    "heritage": "HH EH R IH T IH JH",
    "euros": "Y UH R OW Z",
    "refinery": "R IH F AY N ER IY",
    "archaeology": "AA R K IY AA L AH JH IY",
    "suburban": "S AH B ER B AH N",
    "zhondarm": "ZH AA N D AA R M",
    "preffectsure": "P R IY F EH K CH ER",
}

def script_words() -> list[dict]:
    """Display word and aligner token for every word of the narration, in order."""
    out = []
    lines = NARRATION.read_text().strip().splitlines()
    for li, line in enumerate(lines):
        for raw in line.split():
            display = raw.strip('"').rstrip(",!?:;")
            if display.endswith(".") and display.lower() not in SPOKEN:
                display = display[:-1]
            token = SPOKEN.get(display.lower(), re.sub(r"[^a-z']", "", display.lower()))
            sentence_end = raw[-1] in ".!?" and raw.lower() not in SPOKEN
            out.append({"word": display, "token": token, "line": li + 1, "ends_sentence": sentence_end, "comma": raw[-1] in ",:;"})   # comma: a caption never runs across it
    return out


def align(x48: np.ndarray, tokens: list[str]) -> list[tuple[float, float]]:
    from pocketsphinx import Decoder
    from scipy.signal import resample_poly

    d = Decoder(samprate=16000, loglevel="ERROR")
    for w, phones in LEXICON.items():
        if not d.lookup_word(w):
            d.add_word(w, phones, False)
    missing = sorted({t for t in tokens if not d.lookup_word(t)})
    if missing:
        raise SystemExit(f"No pronunciation for: {missing}")
    d.set_align_text(" ".join(tokens))
    y = np.clip(resample_poly(x48, 1, 3), -1, 1)
    d.start_utt()
    d.process_raw((y * 32767).astype("<i2").tobytes(), False, True)
    d.end_utt()
    segs = [s for s in d.seg() if not s.word.startswith("<") and not s.word.startswith("[")]
    if len(segs) != len(tokens):
        raise SystemExit(f"Alignment returned {len(segs)} words for {len(tokens)}")
    out = []
    for token, seg in zip(tokens, segs):
        spoken = re.sub(r"\(\d+\)$", "", seg.word.lower())
        if spoken != token:
            raise SystemExit(f"Alignment mismatch: {spoken} != {token}")
        out.append((seg.start_frame / 100, (seg.end_frame + 1) / 100))
    return out


# Deliberate beats: (narration line, word, seconds of silence added after that word in the finished read).
BEATS = [(1, "gold", 0.28), (2, "garden", 0.24), (3, "hall", 0.26), (5, "look", 0.24), (6, "Lyon", 0.26), (7, "missing", 0.22), (8, "dead", 0.3), (9, "pool", 0.24), (12, "it", 0.3)]
# Spelled-out initials come with a pause after every letter. (narration line, word, seconds of silence left between its letters)
SQUEEZE: list = []


def add_beats(audio: np.ndarray, words: list[dict], sr: int = vm.SR):
    """Insert BEATS into a finished read, inside the pause that is already there. Updates `words` in place."""
    hop, fade = int(0.005 * sr), int(0.005 * sr)
    index = lambda b: next(k for k, w in enumerate(words) if w["line"] == b[0] and w["word"].strip(".,!?:;").lower() == b[1].strip(".,!?:;").lower())
    done = []
    for line, word, extra in sorted(BEATS, key=index, reverse=True):       # last first: earlier times stay valid
        i = index((line, word))
        lo = int((words[i]["end"] - 0.2) * sr)
        seg = audio[lo:lo + int(0.45 * sr)]
        n = len(seg) // hop
        quiet = np.sqrt(np.mean(seg[: n * hop].reshape(n, hop) ** 2, axis=1) + 1e-20) < 10 ** (-50 / 20)
        best, start = (0, 0), None
        for k in range(n + 1):
            if k < n and quiet[k]:
                start = k if start is None else start
            elif start is not None:
                best, start = max(best, (k - start, start)), None
        if best[0] * hop < 0.04 * sr:
            raise SystemExit(f"No silence after {word!r} (line {line}) to put a beat in")
        at = lo + (best[1] + best[0] // 2) * hop
        t = at / sr
        head, tail = audio[:at].copy(), audio[at:].copy()
        ramp = np.linspace(1.0, 0.0, fade)
        head[-fade:] *= ramp
        tail[:fade] *= ramp[::-1]
        audio = np.concatenate([head, np.zeros(int(round(extra * sr))), tail])
        words[i]["end"] = round(min(words[i]["end"], t), 3)
        for j in range(i + 1, len(words)):
            w = words[j]
            a = (max(w["start"], t) if j == i + 1 else w["start"]) + extra
            w["start"], w["end"] = round(a, 3), round(max(w["end"] + extra, a + 0.02), 3)
        done.append({"line": line, "after": word, "at": round(t, 3), "seconds": extra})
    return audio, done[::-1]


def squeeze(audio: np.ndarray, words: list[dict], sr: int = vm.SR):
    """Shorten the silences inside the SQUEEZE words of a finished read. Updates `words` in place."""
    hop, fade, done = int(0.005 * sr), int(0.004 * sr), []
    for line, word, keep in SQUEEZE:
        i = next(k for k, w in enumerate(words) if w["line"] == line and w["word"] == word)
        lo, hi = int(words[i]["start"] * sr), int(words[i]["end"] * sr)
        n = (hi - lo) // hop
        quiet = np.sqrt(np.mean(audio[lo:lo + n * hop].reshape(n, hop) ** 2, axis=1) + 1e-20) < 10 ** (-45 / 20)
        runs, start = [], None
        for k in range(n + 1):
            if k < n and quiet[k]:
                start = k if start is None else start
            elif start is not None:
                runs.append((start, k)); start = None
        cut = 0
        for a, b in reversed([r for r in runs if (r[1] - r[0]) * hop > (keep + 0.03) * sr and r[0] > 0 and r[1] < n]):
            drop = (b - a) * hop - int(keep * sr)
            mid = lo + (a + b) * hop // 2
            x0, x1 = mid - drop // 2, mid - drop // 2 + drop
            head, tail = audio[:x0].copy(), audio[x1:].copy()
            ramp = np.linspace(1.0, 0.0, fade)
            head[-fade:] *= ramp
            tail[:fade] *= ramp[::-1]
            audio = np.concatenate([head, tail])
            cut += drop
        shift = cut / sr
        words[i]["end"] = round(words[i]["end"] - shift, 3)
        for w in words[i + 1:]:
            w["start"], w["end"] = round(w["start"] - shift, 3), round(w["end"] - shift, 3)
        done.append({"line": line, "word": word, "seconds_removed": round(shift, 3)})
    return audio, done


def save(audio: np.ndarray, words: list[dict], info: dict) -> None:
    out = HERE / "voice" / "voice.wav"
    import wave
    with wave.open(str(out), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(vm.SR)
        w.writeframes(np.clip(np.round(audio * 32768), -32768, 32767).astype("<i2").tobytes())
    duration = len(audio) / vm.SR
    info.update({"seconds": round(duration, 3), "words": len(words), "words_per_second": round(len(words) / duration, 2), **vm.loudness(str(out))})
    (HERE / "voice" / "words.json").write_text(json.dumps(words, indent=1) + "\n")
    PICTURE_WORDS.parent.mkdir(parents=True, exist_ok=True)
    PICTURE_WORDS.write_text(json.dumps(words) + "\n")
    (HERE / "voice" / "timing.json").write_text(json.dumps(info, indent=1) + "\n")
    print(json.dumps(info, indent=1))
    for li in sorted({w["line"] for w in words}):
        ws = [w for w in words if w["line"] == li]
        print(f"L{li:02d} {ws[0]['start']:6.2f}-{ws[-1]['end']:6.2f}  " + " ".join(w["word"] for w in ws))


def time_map(edits: list[tuple[float, float, float]]):
    """Raw-take time -> tightened time, mirroring voice_master.tighten()."""
    cuts, removed = [], 0.0
    for n, (a, b, target) in enumerate(edits):
        first = a == 0
        k_tail = 0.0 if first else int(int(target * vm.SR) * 0.6) / vm.SR
        k_head = int(target * vm.SR) / vm.SR - k_tail
        cuts.append((a + k_tail, b - k_head, removed))
        removed += (b - k_head) - (a + k_tail)

    def f(t: float) -> float:
        shift = 0.0
        for lo, hi, before in cuts:
            if t <= lo:
                return t - before
            if t < hi:
                return lo - before
            shift = before + (hi - lo)
        return t - shift

    return f


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--target-seconds", type=float, default=66.0)
    ap.add_argument("--max-tempo", type=float, default=1.20)
    ap.add_argument("--bass", type=float, default=-1.0)
    ap.add_argument("--presence", type=float, default=1.5)
    ap.add_argument("--beats-only", action="store_true", help="add the BEATS to the voice.wav that is already there")
    args = ap.parse_args()

    if args.beats_only:
        info = json.loads((HERE / "voice" / "timing.json").read_text())
        if info.get("beats"):
            raise SystemExit("voice.wav already has its beats")
        words = json.loads((HERE / "voice" / "words.json").read_text())
        audio, info["beats"] = add_beats(vm.decode(str(HERE / "voice" / "voice.wav")), words)
        save(audio, words, info)
        return

    words = script_words()
    x = vm.decode(str(RAW))
    raw_times = align(x, [w["token"] for w in words])

    # Sentence ends keep a slightly longer breath than commas, so the read still has shape.
    tight, edits = vm.tighten(x, min_gap=0.12, slope=0.30, max_gap=0.34, lead=0.03, tail=0.20)
    tempo = float(np.clip(len(tight) / vm.SR / args.target_seconds, 1.0, args.max_tempo))
    out = HERE / "voice" / "voice.wav"
    with tempfile.TemporaryDirectory() as tmp:
        mid, toned = os.path.join(tmp, "tight.wav"), os.path.join(tmp, "toned.wav")
        vm.write_wav(mid, tight)
        run = lambda src, af, dst: subprocess.check_call(
            [vm.ffmpeg_exe(), "-y", "-v", "error", "-i", src, "-af", af, "-ac", "1", "-ar", str(vm.SR),
             "-c:a", "pcm_s16le", dst])
        # The read was approved untreated, so the tone is left almost alone: rumble filter, a touch of
        # presence so it sits over the music bed, gentle levelling, then the tempo lift (WSOLA).
        tone = (f"aresample={vm.SR},highpass=f=80:poles=2,lowshelf=g={args.bass}:f=200:t=q:w=0.7,"
                f"equalizer=f=3300:t=q:w=0.9:g={args.presence},"
                "acompressor=threshold=0.125:ratio=2:attack=10:release=140:makeup=1.3")
        if tempo > 1.001:
            tone += f",atempo={tempo:.5f}"
        run(mid, tone + ",volume=-6dB", toned)
        gain = -16.0 - vm.loudness(toned)["lufs"]
        limit = 10 ** (-1.5 / 20)
        for _ in range(3):
            run(toned, f"volume={gain:.2f}dB,alimiter=limit={limit:.4f}:attack=2:release=40:level=0", str(out))
            over = vm.loudness(str(out))["peak"] + 1.5
            if over <= 0.05:
                break
            limit *= 10 ** (-(over + 0.1) / 20)

    final = vm.decode(str(out))
    duration = len(final) / vm.SR
    # atempo keeps the length ratio only approximately; use the measured ratio so times stay exact.
    scale = duration / (len(tight) / vm.SR)
    remap = time_map(edits)
    result = []
    for w, (a, b) in zip(words, raw_times):
        s, e = remap(a) * scale, remap(b) * scale
        result.append({"word": w["word"], "start": round(s, 3), "end": round(max(s + 0.02, e), 3),
                       "line": w["line"], "ends_sentence": w["ends_sentence"], "comma": w["comma"]})
    sr = vm.SR
    for prev, cur in zip(result, result[1:]):
        if cur["start"] < prev["end"]:                 # no overlaps after the edits
            prev["end"] = cur["start"]
        gap = final[int(prev["end"] * sr):int(cur["start"] * sr)]
        # Speech inside a "gap" means the aligner closed the word early (spelled-out initials do this).
        if len(gap) > 0.08 * sr and 10 * np.log10(np.mean(gap * gap) + 1e-12) > -30:
            prev["end"] = cur["start"]

    info = {"source": RAW.name, "voice": "Arena TTS voice-15 (en-US, masculine, conversational)",
            "raw_seconds": round(len(x) / vm.SR, 2), "tight_seconds": round(len(tight) / vm.SR, 2),
            "pauses_cut": len(edits), "tempo": round(tempo, 4),
            "eq": {"bass_shelf_db": args.bass, "presence_db": args.presence}}
    audio, info["squeezed"] = squeeze(final, result)
    audio, info["beats"] = add_beats(audio, result)
    save(audio, result, info)


if __name__ == "__main__":
    main()
