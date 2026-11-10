"""Prepare the ten selected Arena TTS takes for the five engineering shorts.

The input scripts in series-scripts.json exactly match the spoken text. We remove
only leading/trailing silence, apply a small uniform tempo adjustment, force-align
individual words with PocketSphinx, and output 48 kHz mono speech plus timings.
"""
from pathlib import Path
import json
import re
import subprocess
import wave
import numpy as np
from scipy.signal import resample_poly
from pocketsphinx import Decoder
import imageio_ffmpeg

ROOT = Path(__file__).resolve().parent
SR = 48000
FPS = 30
FF = imageio_ffmpeg.get_ffmpeg_exe()
SCRIPTS = json.loads((ROOT / 'series-scripts.json').read_text())


def decode_take(path):
    raw = subprocess.check_output([FF, '-v', 'error', '-i', str(path), '-af', 'atempo=1.06',
                                   '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-'])
    x = np.frombuffer(raw, '<f4').copy()
    window = 480
    energy = np.sqrt(np.mean(x[:len(x)//window*window].reshape(-1, window) ** 2, axis=1))
    active = np.flatnonzero(energy > 0.0025)
    if not len(active):
        raise ValueError(f'No speech in {path}')
    a = max(0, active[0]*window - int(0.06*SR))
    b = min(len(x), (active[-1]+1)*window + int(0.08*SR))
    return x[a:b]


def words_of(s):
    s = s.replace('HSBC', 'H S B C').replace('eighty-nine', 'eighty nine').replace('ninety-four', 'ninety four').replace('thirty-eight', 'thirty eight')
    return re.findall(r"[a-z]+(?:'[a-z]+)?", s.lower())


def align(x, words, offset):
    d = Decoder(samprate=16000, loglevel='ERROR')
    d.add_word('seawalls', 'S IY W AO L Z', False)
    for w in words:
        if not d.lookup_word(w):
            raise ValueError(f'Unknown pronunciation: {w}')
    d.set_align_text(' '.join(words))
    y = np.clip(resample_poly(x, 1, 3), -1, 1)
    raw = (y * 32767).astype('<i2').tobytes()
    d.start_utt()
    d.process_raw(raw, False, True)
    d.end_utt()
    segs = [s for s in d.seg() if not s.word.startswith('<') and not s.word.startswith('[')]
    if len(segs) != len(words):
        raise ValueError(f'Alignment returned {len(segs)} words for {len(words)} words')
    out = []
    for expected, seg in zip(words, segs):
        spoken = re.sub(r'\(\d+\)$', '', seg.word.lower())
        if spoken != expected:
            raise ValueError(f'Unexpected alignment {spoken} != {expected}')
        a = offset + seg.start_frame / 100
        b = offset + (seg.end_frame + 1) / 100
        out.append({'word': expected, 'start': round(a, 3), 'end': round(max(a + .01, b), 3)})
    return out


def main():
    for slug, spec in SCRIPTS.items():
        path = ROOT / slug
        voice = path / 'voice'
        takes = [decode_take(voice / f'part{i}.mp3') for i in (1, 2)]
        lead = np.zeros(int(.12*SR), dtype=np.float32)
        gap = np.zeros(int(.16*SR), dtype=np.float32)
        x = np.concatenate([lead, takes[0], gap, takes[1], np.zeros(int(.4*SR), dtype=np.float32)])
        frames = int(np.ceil(len(x) / SR * FPS))
        x = np.pad(x, (0, frames * (SR//FPS) - len(x)))
        words = align(takes[0], words_of(spec['chunks'][0]), len(lead)/SR)
        words += align(takes[1], words_of(spec['chunks'][1]), (len(lead)+len(takes[0])+len(gap))/SR)
        with wave.open(str(voice/'voice.wav'), 'wb') as w:
            w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
            w.writeframes((np.clip(x, -1, 1)*32767).astype('<i2').tobytes())
        (voice/'words.json').write_text(json.dumps(words, indent=2)+'\n')
        (path/'SCRIPT.md').write_text('# '+spec['title']+'\n\n## Narration\n\n'+'\n\n'.join(spec['chunks'])+'\n\n## Sources\n\n'+''.join('- '+u.strip()+'\n' for u in spec['source'].split(';'))+'\n')
        (path/'timing.json').write_text(json.dumps({'frames':frames,'fps':FPS,'duration':frames/FPS}, indent=2)+'\n')
        print(slug, frames, f'{frames/FPS:.2f}s', len(words), 'words', flush=True)

if __name__ == '__main__':
    main()
